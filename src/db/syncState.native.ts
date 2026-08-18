import { getDatabase } from './database';

export interface SyncState {
  accountId: string;
  syncSecret: string;
  pairedAt: string;
  lastSyncedAt: string | null;
}

export async function getSyncState(): Promise<SyncState | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SyncState>(
    `SELECT account_id as accountId, sync_secret as syncSecret, paired_at as pairedAt,
            last_synced_at as lastSyncedAt
     FROM sync_state WHERE id = 1`
  );
  if (!row?.accountId || !row.syncSecret) return null;
  return row;
}

export async function savePairing(accountId: string, syncSecret: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_state (id, account_id, sync_secret, paired_at, last_synced_at)
     VALUES (1, ?, ?, datetime('now'), NULL)
     ON CONFLICT (id) DO UPDATE SET account_id = excluded.account_id, sync_secret = excluded.sync_secret,
       paired_at = excluded.paired_at`,
    accountId,
    syncSecret
  );
}

export async function markSynced(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE sync_state SET last_synced_at = datetime('now') WHERE id = 1");
}
