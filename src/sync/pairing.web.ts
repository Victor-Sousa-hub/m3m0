import { getSyncState, savePairing } from '../db/syncState';
import { pairInvite, pairJoin, pairStart, regenerateKey, whoami } from './apiClient';

export async function pairAsNewAccount(): Promise<{ pairingCode: string; expiresAt: string }> {
  const { accountId, syncSecret, pairingCode, expiresAt } = await pairStart();
  await savePairing(accountId, syncSecret);
  return { pairingCode, expiresAt };
}

export async function joinWithCode(code: string): Promise<void> {
  const { accountId, syncSecret } = await pairJoin(code);
  await savePairing(accountId, syncSecret);
}

/** Mints a code to add another device to *this* (already paired) account. */
export async function inviteNewDevice(): Promise<{ pairingCode: string; expiresAt: string }> {
  const state = await getSyncState();
  if (!state) throw new Error('Dispositivo não pareado.');
  return pairInvite(state.syncSecret);
}

/**
 * Pairs this device using an existing account's recovery key (its
 * `syncSecret`, shown in `SyncScreen`) instead of a short-lived pairing
 * code — the key never expires and can be reused any number of times, so
 * this is what "recover my streak on a new device" actually calls.
 */
export async function recoverWithKey(key: string): Promise<void> {
  const { accountId } = await whoami(key);
  await savePairing(accountId, key);
}

/**
 * Mints a fresh, current-format recovery key for this device's own account
 * and adopts it locally — for devices paired before secrets were 16-digit
 * codes, so they can pick up the new, memorable format in place.
 */
export async function regenerateMyKey(): Promise<string> {
  const state = await getSyncState();
  if (!state) throw new Error('Dispositivo não pareado.');
  const { syncSecret } = await regenerateKey(state.syncSecret);
  await savePairing(state.accountId, syncSecret);
  return syncSecret;
}
