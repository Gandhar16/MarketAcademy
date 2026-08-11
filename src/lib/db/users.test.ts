import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import {
  LOGIN_MAX_FAILURES,
  changePassword,
  checkCredentials,
  clearLoginFailures,
  createSession,
  createUser,
  deleteUser,
  destroySession,
  displayNameProblem,
  emailProblem,
  getUserByEmail,
  loginBackoffSeconds,
  purgeExpiredSessions,
  recordLoginFailure,
  updateProfile,
  userForToken,
} from './users';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';

const PASSWORD = 'a-long-enough-passphrase';

let db: Db;
beforeEach(async () => {
  db = await openTestDb();
});

async function makeUser(email = 'ram@example.com', name = 'Ram') {
  const r = await createUser(db, { email, displayName: name, password: PASSWORD });
  if (!r.ok) throw new Error(r.message);
  return r.value;
}

describe('password hashing', () => {
  it('round-trips', async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
    expect(await verifyPassword(PASSWORD + 'x', hash)).toBe(false);
  });

  it('never stores the password itself', async () => {
    expect(await hashPassword(PASSWORD)).not.toContain(PASSWORD);
  });

  it('salts, so two identical passwords produce different hashes', async () => {
    expect(await hashPassword(PASSWORD)).not.toBe(await hashPassword(PASSWORD));
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    for (const bad of ['', 'nonsense', 'scrypt$x$8$1$aa$bb', 'bcrypt$1$2$3$aa$bb', 'scrypt$16384$8$1$aa$']) {
      expect(await verifyPassword(PASSWORD, bad)).toBe(false);
    }
  });

  it('refuses hash parameters large enough to be a memory-exhaustion attempt', async () => {
    expect(await verifyPassword(PASSWORD, 'scrypt$1073741824$8$1$aa$bb')).toBe(false);
  });

  it('treats unicode-equivalent passwords as the same', async () => {
    // é as one codepoint vs e + combining accent. A learner switching keyboards
    // should not be locked out of their own account.
    const hash = await hashPassword('café-passphrase');
    expect(await verifyPassword('café-passphrase', hash)).toBe(true);
  });

  it('asks for length rather than symbols', async () => {
    expect(passwordProblem('Ab1!x')).toMatch(/at least/);
    expect(passwordProblem('correct horse battery')).toBeNull();
    expect(passwordProblem('aaaaaaaaaaaa')).toMatch(/same character/);
  });
});

describe('registration', () => {
  it('creates an account and a stats row', async () => {
    const user = await makeUser();
    expect(user.email).toBe('ram@example.com');
    expect(await db.get('SELECT COUNT(*) AS n FROM user_stats WHERE user_id = ?', user.id)).toEqual({ n: 1 });
  });

  it('is off the leaderboard unless asked', async () => {
    expect((await makeUser()).leaderboardOptIn).toBe(false);
  });

  it('refuses a duplicate email regardless of case', async () => {
    await makeUser('Ram@Example.com');
    const again = await createUser(db, { email: 'ram@EXAMPLE.com', displayName: 'Other', password: PASSWORD });
    expect(again).toMatchObject({ ok: false, error: 'email_taken' });
  });

  it('finds a user by email case-insensitively', async () => {
    const user = await makeUser('Ram@Example.com');
    expect((await getUserByEmail(db, 'ram@example.com'))?.id).toBe(user.id);
  });

  it('rejects bad input with a message a person can act on', async () => {
    const bad = await createUser(db, { email: 'not-an-email', displayName: 'Ram', password: PASSWORD });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toMatch(/email address/);
  });

  it('rejects a display name that could be mistaken for markup', async () => {
    expect(displayNameProblem('<script>')).not.toBeNull();
    expect(displayNameProblem('Ram K_1')).toBeNull();
    expect(displayNameProblem('a')).not.toBeNull();
  });

  it('accepts addresses that strict regexes wrongly reject', async () => {
    expect(emailProblem('a+tag@sub.domain.co.in')).toBeNull();
    expect(emailProblem('a@b')).toBeNull();
    expect(emailProblem('two@at@signs.com')).not.toBeNull();
  });
});

describe('credentials', () => {
  it('accepts the right password and rejects the wrong one', async () => {
    const user = await makeUser();
    expect((await checkCredentials(db, 'ram@example.com', PASSWORD))?.id).toBe(user.id);
    expect(await checkCredentials(db, 'ram@example.com', 'wrong-password-here')).toBeNull();
  });

  it('returns null for an unknown account without revealing that it is unknown', async () => {
    expect(await checkCredentials(db, 'nobody@example.com', PASSWORD)).toBeNull();
  });

  it('changing a password signs every device out', async () => {
    const user = await makeUser();
    const a = await createSession(db, user.id);
    const b = await createSession(db, user.id);
    expect(await userForToken(db, a.token)).not.toBeNull();

    const result = await changePassword(db, user.id, PASSWORD, 'a-different-long-passphrase');
    expect(result.ok).toBe(true);
    expect(await userForToken(db, a.token)).toBeNull();
    expect(await userForToken(db, b.token)).toBeNull();
    expect(await checkCredentials(db, 'ram@example.com', 'a-different-long-passphrase')).not.toBeNull();
  });

  it('will not change a password without the current one', async () => {
    const user = await makeUser();
    expect(await changePassword(db, user.id, 'not-the-password', 'a-different-long-passphrase')).toMatchObject({
      ok: false,
      error: 'wrong_password',
    });
  });
});

describe('sessions', () => {
  it('resolves a token to its user', async () => {
    const user = await makeUser();
    const { token } = await createSession(db, user.id);
    expect((await userForToken(db, token))?.id).toBe(user.id);
  });

  it('stores a hash, never the token itself', async () => {
    const user = await makeUser();
    const { token } = await createSession(db, user.id);
    const rows = await db.all('SELECT token_hash FROM sessions') as { token_hash: string }[];
    expect(rows[0].token_hash).not.toBe(token);
    expect(rows.some((r) => r.token_hash.includes(token))).toBe(false);
  });

  it('rejects an unknown or absent token', async () => {
    await makeUser();
    expect(await userForToken(db, undefined)).toBeNull();
    expect(await userForToken(db, 'made-up')).toBeNull();
  });

  it('rejects and deletes an expired session', async () => {
    const user = await makeUser();
    const { token } = await createSession(db, user.id);
    await db.run('UPDATE sessions SET expires_at = ?', Date.now() - 1);
    expect(await userForToken(db, token)).toBeNull();
    expect(await db.get('SELECT COUNT(*) AS n FROM sessions')).toEqual({ n: 0 });
  });

  it('logging out kills only that session', async () => {
    const user = await makeUser();
    const a = await createSession(db, user.id);
    const b = await createSession(db, user.id);
    await destroySession(db, a.token);
    expect(await userForToken(db, a.token)).toBeNull();
    expect(await userForToken(db, b.token)).not.toBeNull();
  });

  it('purges expired rows in bulk', async () => {
    const user = await makeUser();
    await createSession(db, user.id);
    await createSession(db, user.id);
    await db.run('UPDATE sessions SET expires_at = ?', 1000);
    expect(await purgeExpiredSessions(db)).toBe(2);
  });
});

describe('sign-in throttling', () => {
  it('lets a normal number of typos through', async () => {
    for (let i = 0; i < LOGIN_MAX_FAILURES - 1; i++) await recordLoginFailure(db, 'k');
    expect(await loginBackoffSeconds(db, 'k')).toBe(0);
  });

  it('backs off after too many failures', async () => {
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await recordLoginFailure(db, 'k');
    expect(await loginBackoffSeconds(db, 'k')).toBeGreaterThan(0);
  });

  it('forgives once the window has passed', async () => {
    const long_ago = Date.now() - 60 * 60 * 1000;
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await recordLoginFailure(db, 'k', long_ago);
    expect(await loginBackoffSeconds(db, 'k')).toBe(0);
  });

  it('clears on a successful sign-in', async () => {
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await recordLoginFailure(db, 'k');
    await clearLoginFailures(db, 'k');
    expect(await loginBackoffSeconds(db, 'k')).toBe(0);
  });

  it('cannot be used to lock a stranger out of their own account', async () => {
    // The key is email+address. An attacker hammering from their own address
    // throttles themselves and nobody else.
    for (let i = 0; i < LOGIN_MAX_FAILURES * 3; i++) await recordLoginFailure(db, 'victim@x.com|1.2.3.4');
    expect(await loginBackoffSeconds(db, 'victim@x.com|1.2.3.4')).toBeGreaterThan(0);
    expect(await loginBackoffSeconds(db, 'victim@x.com|5.6.7.8')).toBe(0);
  });
});

describe('account deletion', () => {
  it('takes everything attached to the account with it', async () => {
    const user = await makeUser();
    await createSession(db, user.id);
    await db.run('INSERT INTO lesson_progress (user_id, lesson_id, updated_at) VALUES (?, ?, ?)', user.id, 'l', 1);
    await db.run(
      'INSERT INTO game_runs (id, user_id, game, played_at, process_score) VALUES (?, ?, ?, ?, ?)',
      'g1',
      user.id,
      'chart-replay',
      1,
      50,
    );

    await deleteUser(db, user.id);

    for (const table of ['sessions', 'lesson_progress', 'game_runs', 'user_stats', 'skill_mastery']) {
      expect(await db.get(`SELECT COUNT(*) AS n FROM ${table}`), table).toEqual({ n: 0 });
    }
  });
});

describe('profile', () => {
  it('updates the leaderboard opt-in', async () => {
    const user = await makeUser();
    const r = await updateProfile(db, user.id, { leaderboardOptIn: true });
    expect(r.ok && r.value.leaderboardOptIn).toBe(true);
  });

  it('refuses an invalid display name', async () => {
    const user = await makeUser();
    expect(await updateProfile(db, user.id, { displayName: '<b>' })).toMatchObject({ ok: false });
  });
});
