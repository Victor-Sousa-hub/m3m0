import { generateId, generatePairingCode, generateSecret, hashSecret } from './crypto';

export interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PAIRING_CODE_TTL_MS = 15 * 60 * 1000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

interface AttemptInput {
  clientId: string;
  deckName: string;
  score: number;
  totalQuestions: number;
  durationMinutes: number;
  timeTakenSeconds: number;
  points: number;
  completedAt: string;
  gameMode: string;
}

type AttemptRecord = AttemptInput;

const VALID_GAME_MODES = new Set(['blitz', 'thinking', 'study', 'simulado']);

/**
 * A push can come from a client that predates game modes (or is mid
 * hot-reload) and omit gameMode entirely — D1's `.bind()` throws on
 * `undefined`, which would otherwise crash the whole batch (including
 * unrelated attempts/active days in the same push). Same "never trust shape
 * at the boundary" rationale as the frontend's normalizeGameMode.
 */
function normalizeGameMode(value: unknown): string {
  return typeof value === 'string' && VALID_GAME_MODES.has(value) ? value : 'thinking';
}

async function authenticate(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const secret = auth.slice('Bearer '.length).trim();
  if (!secret) return null;
  const secretHash = await hashSecret(secret);
  const row = await env.DB.prepare('SELECT account_id FROM account_secrets WHERE secret_hash = ?')
    .bind(secretHash)
    .first<{ account_id: string }>();
  return row?.account_id ?? null;
}

async function issueSecretFor(env: Env, accountId: string): Promise<string> {
  const secret = generateSecret();
  const secretHash = await hashSecret(secret);
  await env.DB.prepare('INSERT INTO account_secrets (secret_hash, account_id) VALUES (?, ?)')
    .bind(secretHash, accountId)
    .run();
  return secret;
}

async function handlePairStart(env: Env): Promise<Response> {
  const accountId = generateId();
  const pairingCode = generatePairingCode();
  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS).toISOString();

  await env.DB.prepare(
    'INSERT INTO accounts (id, pairing_code, pairing_code_expires_at) VALUES (?, ?, ?)'
  )
    .bind(accountId, pairingCode, expiresAt)
    .run();
  const secret = await issueSecretFor(env, accountId);

  return json({ accountId, syncSecret: secret, pairingCode, expiresAt });
}

/**
 * Lets an already-paired device mint a fresh code to add a 3rd+ device to
 * its own account. Without this, the only way to "pair" from a device that
 * doesn't already have a code in hand is /pair/start, which creates a brand
 * new, disconnected account — exactly the trap that split one real account
 * into two and needed a manual DB merge to fix.
 */
async function handlePairInvite(env: Env, accountId: string): Promise<Response> {
  const pairingCode = generatePairingCode();
  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS).toISOString();

  await env.DB.prepare('UPDATE accounts SET pairing_code = ?, pairing_code_expires_at = ? WHERE id = ?')
    .bind(pairingCode, expiresAt, accountId)
    .run();

  return json({ pairingCode, expiresAt });
}

async function handlePairJoin(request: Request, env: Env): Promise<Response> {
  const body = await request.json<{ code?: string }>().catch(() => null);
  const code = body?.code?.trim().toUpperCase();
  if (!code) return error('Código é obrigatório', 400);

  const account = await env.DB.prepare(
    'SELECT id, pairing_code_expires_at FROM accounts WHERE pairing_code = ?'
  )
    .bind(code)
    .first<{ id: string; pairing_code_expires_at: string | null }>();

  if (!account) return error('Código inválido ou já utilizado', 404);
  if (account.pairing_code_expires_at && new Date(account.pairing_code_expires_at) < new Date()) {
    return error('Código expirado', 410);
  }

  // The joining device gets its own secret (own row in account_secrets)
  // pointing at the same account — the pairing code is single-use and gets
  // cleared so it can't be reused by a third party.
  const secret = await issueSecretFor(env, account.id);
  await env.DB.prepare('UPDATE accounts SET pairing_code = NULL, pairing_code_expires_at = NULL WHERE id = ?')
    .bind(account.id)
    .run();

  return json({ accountId: account.id, syncSecret: secret });
}

async function handleSyncPush(request: Request, env: Env, accountId: string): Promise<Response> {
  const body = await request
    .json<{ activeDays?: string[]; attempts?: AttemptInput[] }>()
    .catch(() => null);
  if (!body) return error('JSON inválido', 400);

  const activeDays = body.activeDays ?? [];
  const attempts = body.attempts ?? [];

  const statements = [
    ...activeDays.map((date) =>
      env.DB.prepare('INSERT OR IGNORE INTO active_days (account_id, date) VALUES (?, ?)').bind(
        accountId,
        date
      )
    ),
    ...attempts.map((attempt) =>
      env.DB.prepare(
        `INSERT OR IGNORE INTO quiz_attempts
           (account_id, client_id, deck_name, score, total_questions, duration_minutes, time_taken_seconds, points, completed_at, game_mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        accountId,
        attempt.clientId,
        attempt.deckName,
        attempt.score,
        attempt.totalQuestions,
        attempt.durationMinutes,
        attempt.timeTakenSeconds,
        attempt.points,
        attempt.completedAt,
        normalizeGameMode(attempt.gameMode)
      )
    ),
  ];

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }

  return json({ ok: true });
}

/**
 * Resolves the caller's own long-lived sync secret back to an accountId.
 * Lets a device "log in" with nothing but that secret — the secret itself
 * is already a permanent, never-expiring credential (unlike a pairing
 * code), so this is the whole mechanism behind the user-facing "recovery
 * key": paste it into `SyncScreen` on any device, any time.
 */
async function handleWhoami(accountId: string): Promise<Response> {
  return json({ accountId });
}

/**
 * Mints a fresh secret for the caller's own account without any pairing
 * dance — lets a device that paired before secrets became 16-digit
 * recovery keys pick up the new format in place. Old secrets (any format)
 * stay valid; there's no revocation, same as every other multi-secret path
 * here.
 */
async function handleKeyRegenerate(env: Env, accountId: string): Promise<Response> {
  const syncSecret = await issueSecretFor(env, accountId);
  return json({ syncSecret });
}

async function handleSyncPull(env: Env, accountId: string): Promise<Response> {
  const [activeDaysResult, attemptsResult] = await env.DB.batch([
    env.DB.prepare('SELECT date FROM active_days WHERE account_id = ?').bind(accountId),
    env.DB.prepare(
      `SELECT client_id as clientId, deck_name as deckName, score, total_questions as totalQuestions,
              duration_minutes as durationMinutes, time_taken_seconds as timeTakenSeconds, points,
              completed_at as completedAt, game_mode as gameMode
       FROM quiz_attempts WHERE account_id = ?`
    ).bind(accountId),
  ]);

  const activeDays = (activeDaysResult.results as { date: string }[]).map((r) => r.date);
  const attempts = attemptsResult.results as unknown as AttemptRecord[];

  return json({ activeDays, attempts });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/pair/start') {
      return handlePairStart(env);
    }

    if (request.method === 'POST' && url.pathname === '/pair/join') {
      return handlePairJoin(request, env);
    }

    if (
      url.pathname === '/sync/push' ||
      url.pathname === '/sync/pull' ||
      url.pathname === '/pair/invite' ||
      url.pathname === '/whoami' ||
      url.pathname === '/key/regenerate'
    ) {
      const accountId = await authenticate(request, env);
      if (!accountId) return error('Não autenticado', 401);

      if (request.method === 'POST' && url.pathname === '/sync/push') {
        return handleSyncPush(request, env, accountId);
      }
      if (request.method === 'GET' && url.pathname === '/sync/pull') {
        return handleSyncPull(env, accountId);
      }
      if (request.method === 'POST' && url.pathname === '/pair/invite') {
        return handlePairInvite(env, accountId);
      }
      if (request.method === 'GET' && url.pathname === '/whoami') {
        return handleWhoami(accountId);
      }
      if (request.method === 'POST' && url.pathname === '/key/regenerate') {
        return handleKeyRegenerate(env, accountId);
      }
    }

    return error('Não encontrado', 404);
  },
};
