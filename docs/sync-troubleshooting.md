# Sync troubleshooting

How m3m0's cross-device sync works, what broke on 2026-08-18, and how to
diagnose similar issues in the future.

## Architecture in one paragraph

Two independently-deployed Cloudflare Workers: **`m3m0`**
(`https://m3m0.m3m0.workers.dev`, the web/PC build — static assets from
`npx expo export -p web`, deployed via `npm run deploy` at the repo root)
and **`m3m0-sync`** (`https://m3m0-sync.m3m0.workers.dev`, the API in
`backend/`, deployed via `npm run deploy` inside `backend/`). Native
(Android) and web builds share the *same* frontend code but different data
layers (`src/data/*Repository.native.ts` vs `.web.ts`, Metro's
platform-suffix resolution): native writes to local SQLite first and
pushes opportunistically (`src/sync/syncClient.native.ts`, fire-and-forget,
swallows all errors — a flaky connection must never interrupt a quiz);
web has no local store and talks to the backend live on every read/write.
The backend is one D1 database (`m3m0-sync-db`) with `accounts` /
`account_secrets` (N secrets can point at one account — that's how
multiple devices share one account) / `active_days` / `quiz_attempts`,
migrated via `backend/migrations/*.sql`.

**Critical asymmetry**: local D1 migrations (`npm run migrate:local` in
`backend/`) and the remote database (`npm run migrate:remote`) are
separate, and neither Worker auto-redeploys — `npm run deploy` (root or
`backend/`) is always a manual, explicit step. It is entirely possible for
the code in this repo, the local dev D1, the remote D1 schema, and what's
actually live on either Worker to all be different versions at once. Most
of the incidents below trace back to that gap.

## What broke today, root cause → fix

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | `StatsScreen` crashed: `Cannot read properties of undefined (reading 'label')` | `GAME_MODES[attempt.gameMode]` where `attempt.gameMode` was `undefined` — data pulled from a backend not yet migrated/redeployed with the `game_mode` column | Added `normalizeGameMode()` (`src/quiz/gameModes.ts`) applied at every point attempt data enters the app from an external source; never trust shape at a data boundary |
| 2 | "Sync não tá funcionando" — `/sync/push` returning 500 | D1's `.bind()` throws on `undefined`. A push whose attempt payload omitted `gameMode` (old backend code before migration, or any legacy/partial client) crashed the **entire batch** — every attempt/active-day in that call, not just the bad row | Same `normalizeGameMode` fallback applied server-side in `backend/src/index.ts` before binding |
| 3 | Web build's "Sincronizar agora" did nothing, `lastSyncedAt` stuck on "nunca" | `src/sync/manualSync.web.ts` was a hardcoded no-op stub (pre-existing, predates today) — true that web has nothing local to flush, but the button and timestamp were then permanently dead | Now calls `syncPull` (proves the pairing still works, throws into the existing error UI if not) + `markSynced()` |
| 4 | Real account silently split into two disconnected accounts | `SyncScreen` only offered "Gerar código" (create new account) when **unpaired** — there was no way to invite a device from an *already-paired* one. Opening the app on a fresh browser with no code in hand, "Gerar código" was the only button available, so it created a second account instead of joining the real one | Added `POST /pair/invite` (authenticated: mints a code for the *caller's own* account) + "Adicionar outro dispositivo" button on the paired `SyncScreen` state |

\#4 additionally required a one-off manual data repair (see below) since it
had already happened before the fix landed.

## Diagnostic playbook

Run these against the *deployed* backend, not local dev — that's the one
that matters when a user reports "sync isn't working."

**1. Is the deployed bundle actually current?**
```bash
curl -s https://m3m0.m3m0.workers.dev/ | grep -oE '_expo/static/js/web/[a-zA-Z0-9._-]+\.js'
```
Compare the hash to what a fresh `npx expo export -p web` produces locally.
If they differ, the live site predates your latest commits — redeploy
before debugging anything else.

**2. Is the backend schema current?**
```bash
cd backend && npx wrangler d1 execute m3m0-sync-db --remote \
  --command "PRAGMA table_info(quiz_attempts);"
```
Check the column list against `backend/migrations/*.sql`. If a migration
hasn't been applied remotely (`npm run migrate:remote` only runs when you
run it — it is not automatic), this is why.

**3. Exercise the API directly with curl** (bypasses the UI entirely,
isolates frontend vs. backend):
```bash
# mint a throwaway test account/secret
curl -s https://m3m0-sync.m3m0.workers.dev/pair/start -X POST

# push (swap in the secret from above)
curl -s -w "\nHTTP %{http_code}\n" https://m3m0-sync.m3m0.workers.dev/sync/push \
  -X POST -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -d '{"activeDays":["2026-01-01"],"attempts":[{"clientId":"t1","deckName":"D","score":1,"totalQuestions":5,"durationMinutes":5,"timeTakenSeconds":60,"points":10,"completedAt":"2026-01-01T00:00:00.000Z","gameMode":"blitz"}]}'

# pull it back
curl -s https://m3m0-sync.m3m0.workers.dev/sync/pull -H "Authorization: Bearer $SECRET"
```
A non-200 here is a **backend** bug (check `wrangler tail` or the Worker's
error page). If curl succeeds but the app still looks broken, the bug is
client-side — check the deployed bundle freshness (step 1) or the data
mapping in `attemptRepository.*.ts`.

**4. Detect a split account** (symptom: "my history disappeared" /
"scoreboard shows fewer games than I played" after pairing on a new
device/browser):
```bash
cd backend && npx wrangler d1 execute m3m0-sync-db --remote --command \
  "SELECT account_id, COUNT(*) attempts, MAX(completed_at) last FROM quiz_attempts GROUP BY account_id ORDER BY last DESC;"
```
More than one `account_id` with recent activity that *should* be the same
person is the split-account symptom. Cross-check with:
```bash
npx wrangler d1 execute m3m0-sync-db --remote --command \
  "SELECT id, pairing_code, created_at FROM accounts ORDER BY created_at DESC;"
```
A `pairing_code` of `NULL` means that account has been joined by a second
device (real, in-use account); a non-null code means it's likely a
one-off/abandoned pairing attempt.

**Manual merge** (only if a split already happened — the `/pair/invite`
button prevents new ones): pick the account with the real history as the
survivor, then reassign the loser's rows onto it and delete the loser:
```sql
UPDATE quiz_attempts    SET account_id = '<survivor>' WHERE account_id = '<loser>';
UPDATE active_days      SET account_id = '<survivor>' WHERE account_id = '<loser>';
UPDATE account_secrets  SET account_id = '<survivor>' WHERE account_id = '<loser>';
DELETE FROM accounts WHERE id = '<loser>';
```
Check `active_days` for a date collision between the two accounts *before*
merging (same PRIMARY KEY `(account_id, date)`) — if both accounts have an
active day on the same date, the plain `UPDATE` will fail; you'd need
`INSERT OR IGNORE ... SELECT` instead for that table and then delete the
loser's now-duplicate rows.

## Symptom → likely cause quick reference

- **Crash reading `.label` / `.something` off attempt/game data** → a field
  is missing from data that came over the network. Check
  `normalizeGameMode`-style boundary validation exists for every field
  read off `AttemptRecord`/`AttemptPayload`, not just the ones that have
  broken before.
- **A sync action silently "succeeds" but nothing changed** → check
  whether the code path is a native fire-and-forget `syncNow()` (swallows
  errors by design) — add a temporary `console.error` in the catch block
  to see what's actually failing, then remove it.
- **One user's data looks incomplete after using a new device/browser** →
  split-account check (playbook step 4), not a push/pull bug.
- **Works locally (`expo start`), broken on the deployed URL (or vice
  versa)** → bundle staleness (playbook step 1) or remote-vs-local D1
  schema drift (playbook step 2). Always redeploy *and* migrate remote
  before concluding there's a code bug.

## Known leftover cruft

A throwaway test account (`b95d8e8b-27dc-474a-90f4-74bf0f278862`, 2 fake
attempts) is still sitting in the remote D1 from debugging this — harmless
(not linked to any real device), but safe to delete if you want the table
clean:
```bash
cd backend && npx wrangler d1 execute m3m0-sync-db --remote --command \
  "DELETE FROM quiz_attempts WHERE account_id='b95d8e8b-27dc-474a-90f4-74bf0f278862';
   DELETE FROM active_days WHERE account_id='b95d8e8b-27dc-474a-90f4-74bf0f278862';
   DELETE FROM account_secrets WHERE account_id='b95d8e8b-27dc-474a-90f4-74bf0f278862';
   DELETE FROM accounts WHERE id='b95d8e8b-27dc-474a-90f4-74bf0f278862';"
```
