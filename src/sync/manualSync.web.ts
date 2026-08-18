import { getSyncState, markSynced } from '../db/syncState';
import { syncPull } from './apiClient';

/**
 * The web build already talks to the backend live for every read/write, so
 * there's no local outbox to flush — but the "Sincronizar agora" button
 * still needs to do something observable, otherwise it just sits there
 * doing nothing and lastSyncedAt stays stuck on "nunca" forever. Pulling
 * confirms the pairing still works (throws if the secret is bad) and gives
 * the user a timestamp to trust.
 */
export async function syncNow(): Promise<void> {
  const state = await getSyncState();
  if (!state) return;
  await syncPull(state.syncSecret);
  await markSynced();
}
