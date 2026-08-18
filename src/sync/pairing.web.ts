import { getSyncState, savePairing } from '../db/syncState';
import { pairInvite, pairJoin, pairStart } from './apiClient';

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
