const PAIRING_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

/**
 * The device/account credential (bearer token in `account_secrets`) — also
 * the thing shown to the user as their "recovery key". 16 random digits
 * (~2^53 keyspace) so a human can plausibly memorize or copy it, unlike a
 * 64-char hex secret; that's plenty for this app's threat model (a personal
 * streak, not a payments credential), and every device/pairing path mints
 * the same format so any of them can double as the recovery key.
 */
export function generateSecret(length = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => (b % 10).toString()).join('');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generatePairingCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => PAIRING_CODE_ALPHABET[b % PAIRING_CODE_ALPHABET.length]).join('');
}

export async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
