export interface SyncState {
  accountId: string;
  syncSecret: string;
  pairedAt: string;
  lastSyncedAt: string | null;
}

const STORAGE_KEY = 'm3m0.sync_state';

export async function getSyncState(): Promise<SyncState | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SyncState;
  } catch {
    return null;
  }
}

export async function savePairing(accountId: string, syncSecret: string): Promise<void> {
  const state: SyncState = {
    accountId,
    syncSecret,
    pairedAt: new Date().toISOString(),
    lastSyncedAt: null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function markSynced(): Promise<void> {
  const current = await getSyncState();
  if (!current) return;
  current.lastSyncedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
