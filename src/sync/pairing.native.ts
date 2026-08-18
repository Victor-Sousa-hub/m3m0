import { savePairing } from '../db/syncState';
import { pairJoin, pairStart } from './apiClient';
import { syncNow } from './syncClient';

export async function pairAsNewAccount(): Promise<{ pairingCode: string; expiresAt: string }> {
  const { accountId, syncSecret, pairingCode, expiresAt } = await pairStart();
  await savePairing(accountId, syncSecret);
  return { pairingCode, expiresAt };
}

export async function joinWithCode(code: string): Promise<void> {
  const { accountId, syncSecret } = await pairJoin(code);
  await savePairing(accountId, syncSecret);
  await syncNow();
}
