import { randomInt } from 'crypto';

/**
 * Generates a one-time temp password for admin/lockout-triggered resets.
 * Uses crypto.randomInt (CSPRNG) rather than Math.random, since Math.random's
 * internal state can be reconstructed from observed outputs, which matters
 * here because the output directly becomes a live account credential.
 */
export function generateTempPassword(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[randomInt(alphabet.length)];
  return s + randomInt(100, 1000);
}
