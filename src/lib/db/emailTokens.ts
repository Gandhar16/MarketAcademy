/**
 * Single-use links sent to an email address.
 *
 * Confirming an address and resetting a password are the same mechanism with a
 * different word in one column, so they share one table and one set of rules
 * rather than two implementations that drift:
 *
 *  - **Hashed at rest.** The email carries the only usable copy. A database
 *    dump yields nothing redeemable, exactly as with session tokens.
 *  - **Single use.** Redeeming stamps `used_at`. The row survives so a second
 *    click can say "already used" instead of the alarming "invalid link".
 *  - **Short-lived**, and issuing a new one retires the old ones, so a forwarded
 *    or shoulder-surfed link stops working the moment a fresh one is asked for.
 *  - **Rate-limited per account**, because the send button is a way to have this
 *    site post mail to a stranger's inbox on demand.
 */
import { createHash, randomBytes } from 'node:crypto';
import type { Db } from './driver';

export type TokenPurpose = 'verify' | 'reset';

/**
 * An hour for both. Long enough to survive a slow inbox and a distracted
 * afternoon, short enough that a link left in a shared mailbox goes stale.
 */
export const TOKEN_TTL_MS = 60 * 60 * 1000;

/** How many links one account may ask for before it has to wait. */
export const MAX_SENDS_PER_WINDOW = 3;
export const SEND_WINDOW_MS = 15 * 60 * 1000;

export interface RedeemedToken {
  userId: string;
  email: string;
  purpose: TokenPurpose;
}

export type Redeem =
  | { ok: true; value: RedeemedToken }
  | { ok: false; reason: 'unknown' | 'used' | 'expired'; message: string };

export function hashEmailToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Whether another link may be sent, without saying anything about the account.
 *
 * Counts what was ISSUED, not what was delivered — an attacker hammering the
 * button costs the real owner their inbox either way.
 */
export async function sendsRemaining(
  db: Db,
  userId: string,
  purpose: TokenPurpose,
  now = Date.now(),
): Promise<number> {
  const row = await db.get<{ n: number }>(
    'SELECT COUNT(*) AS n FROM email_tokens WHERE user_id = ? AND purpose = ? AND created_at >= ?',
    userId,
    purpose,
    now - SEND_WINDOW_MS,
  );
  return Math.max(0, MAX_SENDS_PER_WINDOW - Number(row?.n ?? 0));
}

/**
 * Mints a token and returns the raw value — the ONLY time it exists in a form
 * that can be redeemed. It goes straight into the email and is never logged,
 * never stored, and never returned to a browser.
 */
export async function issueToken(
  db: Db,
  {
    userId,
    purpose,
    email,
    now = Date.now(),
    ttlMs = TOKEN_TTL_MS,
  }: { userId: string; purpose: TokenPurpose; email: string; now?: number; ttlMs?: number },
): Promise<{ ok: true; token: string; expiresAt: number } | { ok: false; message: string }> {
  if ((await sendsRemaining(db, userId, purpose, now)) <= 0) {
    return {
      ok: false,
      message: 'That link has been sent a few times already. Check your inbox and spam folder, then try again shortly.',
    };
  }

  const token = randomBytes(32).toString('base64url');
  const expiresAt = now + ttlMs;

  await db.tx(async (t) => {
    // Asking for a new link retires the outstanding ones. Two live reset links
    // means two chances for the wrong person to find one.
    await t.run(
      'UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL',
      now,
      userId,
      purpose,
    );
    await t.run(
      'INSERT INTO email_tokens (token_hash, user_id, purpose, email, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      hashEmailToken(token),
      userId,
      purpose,
      email,
      now,
      expiresAt,
    );
  });

  return { ok: true, token, expiresAt };
}

/**
 * Spends a token, or explains why it cannot be spent.
 *
 * The purpose is checked as well as the token, so a confirmation link can never
 * be redeemed as a password reset — they are the same shape and one is far more
 * valuable than the other.
 */
export async function redeemToken(
  db: Db,
  token: string,
  purpose: TokenPurpose,
  now = Date.now(),
): Promise<Redeem> {
  const hash = hashEmailToken(token);

  /**
   * Read and spend in one transaction, so a link clicked twice in quick
   * succession — a double-tap, or a mail client that prefetches URLs before the
   * person even sees the message — cannot be redeemed twice. Checking and then
   * updating on the open handle would leave a window between the two where both
   * callers still see `used_at` as NULL.
   */
  return db.tx(async (t) => {
    const row = await t.get<{
      user_id: string;
      purpose: string;
      email: string;
      expires_at: number;
      used_at: number | null;
    }>('SELECT user_id, purpose, email, expires_at, used_at FROM email_tokens WHERE token_hash = ?', hash);

    // The purpose is checked alongside the token, so a confirmation link can
    // never be spent as a password reset — identical shape, very different power.
    if (!row || row.purpose !== purpose) {
      return { ok: false, reason: 'unknown', message: 'That link is not one we recognise. Ask for a new one.' };
    }
    if (row.used_at != null) {
      return {
        ok: false,
        reason: 'used',
        message: 'That link has already been used. Ask for a new one if you need it.',
      };
    }
    if (Number(row.expires_at) <= now) {
      return { ok: false, reason: 'expired', message: 'That link has expired. Ask for a new one.' };
    }

    await t.run('UPDATE email_tokens SET used_at = ? WHERE token_hash = ?', now, hash);
    return { ok: true, value: { userId: row.user_id, email: row.email, purpose } };
  });
}

/** Housekeeping, same as `purgeExpiredSessions`. */
export async function purgeExpiredEmailTokens(db: Db, now = Date.now()): Promise<number> {
  const before = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM email_tokens WHERE expires_at <= ?', now);
  await db.run('DELETE FROM email_tokens WHERE expires_at <= ?', now);
  return Number(before?.n ?? 0);
}

/** Records that an address has been proven to belong to this account. */
export async function markEmailVerified(db: Db, userId: string, email: string, now = Date.now()): Promise<void> {
  await db.run('UPDATE users SET email_verified_at = ? WHERE id = ? AND email = ?', now, userId, email);
}
