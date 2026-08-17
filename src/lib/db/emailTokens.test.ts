import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { checkCredentials, createUser, getUserById, setPassword, userForToken, createSession } from './users';
import {
  MAX_SENDS_PER_WINDOW,
  SEND_WINDOW_MS,
  TOKEN_TTL_MS,
  hashEmailToken,
  issueToken,
  markEmailVerified,
  purgeExpiredEmailTokens,
  redeemToken,
  sendsRemaining,
} from './emailTokens';

const PASSWORD = 'a-long-enough-passphrase';

let db: Db;
let userId: string;

beforeEach(async () => {
  db = await openTestDb();
  const made = await createUser(db, { email: 'ram@example.com', displayName: 'Ram', password: PASSWORD });
  if (!made.ok) throw new Error(made.message);
  userId = made.value.id;
});

async function issue(purpose: 'verify' | 'reset' = 'reset', now = Date.now()) {
  const r = await issueToken(db, { userId, purpose, email: 'ram@example.com', now });
  if (!r.ok) throw new Error(r.message);
  return r;
}

describe('issuing', () => {
  it('never stores the token itself', async () => {
    const { token } = await issue();
    const row = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM email_tokens WHERE token_hash = ?', token);
    expect(Number(row?.n)).toBe(0);

    const hashed = await db.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM email_tokens WHERE token_hash = ?',
      hashEmailToken(token),
    );
    expect(Number(hashed?.n)).toBe(1);
  });

  it('retires the previous unused link of the same purpose', async () => {
    const first = await issue();
    await issue();
    const result = await redeemToken(db, first.token, 'reset');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('used');
  });

  it('leaves a link of a DIFFERENT purpose alone', async () => {
    const verify = await issue('verify');
    await issue('reset');
    expect((await redeemToken(db, verify.token, 'verify')).ok).toBe(true);
  });

  it('stops after a few sends in the window, then allows more once it passes', async () => {
    const start = Date.now();
    for (let i = 0; i < MAX_SENDS_PER_WINDOW; i++) await issue('reset', start);
    expect(await sendsRemaining(db, userId, 'reset', start)).toBe(0);

    const blocked = await issueToken(db, { userId, purpose: 'reset', email: 'ram@example.com', now: start });
    expect(blocked.ok).toBe(false);

    const later = start + SEND_WINDOW_MS + 1;
    expect(await sendsRemaining(db, userId, 'reset', later)).toBe(MAX_SENDS_PER_WINDOW);
    expect((await issueToken(db, { userId, purpose: 'reset', email: 'ram@example.com', now: later })).ok).toBe(true);
  });
});

describe('redeeming', () => {
  it('works once, and only once', async () => {
    const { token } = await issue();
    const first = await redeemToken(db, token, 'reset');
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.value.userId).toBe(userId);

    const second = await redeemToken(db, token, 'reset');
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('used');
  });

  /**
   * The privilege-escalation test. Both links are the same shape, and one only
   * confirms an address while the other hands over the password.
   */
  it('will not spend a confirmation link as a password reset', async () => {
    const { token } = await issue('verify');
    const wrong = await redeemToken(db, token, 'reset');
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.reason).toBe('unknown');

    // And it is still good for what it was actually for.
    expect((await redeemToken(db, token, 'verify')).ok).toBe(true);
  });

  it('refuses an expired link', async () => {
    const start = Date.now();
    const { token } = await issue('reset', start);
    const result = await redeemToken(db, token, 'reset', start + TOKEN_TTL_MS + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('refuses a token nobody issued', async () => {
    const result = await redeemToken(db, 'not-a-real-token', 'reset');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown');
  });

  it('does not leave an expired-but-unspent link redeemable after a purge', async () => {
    const start = Date.now();
    const { token } = await issue('reset', start);
    expect(await purgeExpiredEmailTokens(db, start + TOKEN_TTL_MS + 1)).toBe(1);
    expect((await redeemToken(db, token, 'reset')).ok).toBe(false);
  });
});

describe('what redeeming leads to', () => {
  it('confirming an address records it', async () => {
    const { token } = await issue('verify');
    const redeemed = await redeemToken(db, token, 'verify');
    if (!redeemed.ok) throw new Error(redeemed.message);

    await markEmailVerified(db, redeemed.value.userId, redeemed.value.email);
    expect((await getUserById(db, userId))?.emailVerifiedAt).toBeTruthy();
  });

  it('resetting a password replaces it and signs every device out', async () => {
    const { token: sessionToken } = await createSession(db, userId);
    expect(await userForToken(db, sessionToken)).not.toBeNull();

    const { token } = await issue('reset');
    const redeemed = await redeemToken(db, token, 'reset');
    if (!redeemed.ok) throw new Error(redeemed.message);

    const result = await setPassword(db, redeemed.value.userId, 'a-brand-new-passphrase');
    expect(result.ok).toBe(true);

    expect(await checkCredentials(db, 'ram@example.com', 'a-brand-new-passphrase')).not.toBeNull();
    expect(await checkCredentials(db, 'ram@example.com', PASSWORD)).toBeNull();
    // The session that existed before the reset is gone.
    expect(await userForToken(db, sessionToken)).toBeNull();
  });

  it('refuses a new password that breaks the length rule, without spending anything', async () => {
    const result = await setPassword(db, userId, 'short');
    expect(result.ok).toBe(false);
    // The old one still works, so nothing was half-applied.
    expect(await checkCredentials(db, 'ram@example.com', PASSWORD)).not.toBeNull();
  });

  it('takes its tokens with the account when it is deleted', async () => {
    const { token } = await issue();
    await db.run('DELETE FROM users WHERE id = ?', userId);
    expect((await redeemToken(db, token, 'reset')).ok).toBe(false);
  });
});
