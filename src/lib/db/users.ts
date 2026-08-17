/**
 * User accounts and sessions.
 *
 * Every query in the application that touches a user goes through this file.
 * That is what made moving from a local SQLite file to a hosted one a bounded
 * afternoon rather than an archaeology project — see ./driver.ts.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import type { Db } from './driver';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  lastSeenAt: number;
  leaderboardOptIn: boolean;
  market: string;
  /** Epoch ms the address was proven to be theirs, or null if it never was. */
  emailVerifiedAt: number | null;
  /** False for an account that has only ever signed in through a provider. */
  hasPassword: boolean;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  password: string;
  market?: string;
  leaderboardOptIn?: boolean;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string; message: string };

/** Session lifetime. Thirty days, refreshed on use — long enough that a learner
 *  practising a few times a week is never signed out mid-habit. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DISPLAY_NAME_MAX = 24;

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  created_at: number;
  last_seen_at: number;
  leaderboard_opt_in: number;
  market: string;
  email_verified_at: number | null;
  has_password: number;
  password_hash?: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: Number(row.created_at),
    lastSeenAt: Number(row.last_seen_at),
    leaderboardOptIn: Number(row.leaderboard_opt_in) === 1,
    market: row.market,
    emailVerifiedAt: row.email_verified_at == null ? null : Number(row.email_verified_at),
    hasPassword: Number(row.has_password ?? 1) === 1,
  };
}

/**
 * Deliberately permissive. Strict email regexes reject valid addresses far more
 * often than they catch typos, and the address is not being used to prove
 * anything here — it is a login handle.
 */
export function emailProblem(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return 'That does not look like an email address.';
  const at = trimmed.indexOf('@');
  if (at < 1 || at === trimmed.length - 1) return 'That does not look like an email address.';
  if (trimmed.includes(' ')) return 'An email address cannot contain a space.';
  if (trimmed.indexOf('@', at + 1) !== -1) return 'That address has more than one @.';
  return null;
}

export function displayNameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Pick a name of at least 2 characters.';
  if (trimmed.length > DISPLAY_NAME_MAX) return `Keep it under ${DISPLAY_NAME_MAX} characters.`;
  // The display name appears on a public leaderboard, so it may not be made to
  // look like markup or a URL.
  if (/[<>@/\\]/.test(trimmed)) return 'Letters, numbers, spaces, hyphens and underscores only.';
  return null;
}

export function emailKey(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(db: Db, input: CreateUserInput): Promise<Result<User>> {
  const email = input.email.trim();
  const displayName = input.displayName.trim();

  const problem = emailProblem(email) ?? displayNameProblem(displayName) ?? passwordProblem(input.password);
  if (problem) return { ok: false, error: 'invalid', message: problem };

  const key = emailKey(email);
  const existing = await db.get<{ id: string }>('SELECT id FROM users WHERE email_key = ?', key);
  if (existing) {
    return { ok: false, error: 'email_taken', message: 'An account with that email already exists.' };
  }

  const now = Date.now();
  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);

  // The user row and the stats row are one fact, so they are one transaction.
  // A user with no stats row would appear signed-in and have no XP anywhere.
  await db.tx(async (t) => {
    await t.run(
      `INSERT INTO users (id, email, email_key, display_name, password_hash, created_at, last_seen_at, leaderboard_opt_in, market)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      email,
      key,
      displayName,
      passwordHash,
      now,
      now,
      input.leaderboardOptIn ? 1 : 0,
      input.market ?? 'IN',
    );
    await t.run('INSERT INTO user_stats (user_id, updated_at) VALUES (?, ?)', id, now);
  });

  return { ok: true, value: (await getUserById(db, id))! };
}

export async function getUserById(db: Db, id: string): Promise<User | null> {
  const row = await db.get<UserRow>('SELECT * FROM users WHERE id = ?', id);
  return row ? toUser(row) : null;
}

export async function getUserByEmail(db: Db, email: string): Promise<User | null> {
  const row = await db.get<UserRow>('SELECT * FROM users WHERE email_key = ?', emailKey(email));
  return row ? toUser(row) : null;
}

/**
 * Verifies a password. Always runs a hash comparison, even when the account
 * does not exist — otherwise the response time tells an attacker which
 * addresses are registered.
 */
export async function checkCredentials(db: Db, email: string, password: string): Promise<User | null> {
  const row = await db.get<UserRow>('SELECT * FROM users WHERE email_key = ?', emailKey(email));

  const hash =
    row?.password_hash ??
    // A real hash of a value nobody can supply, so the miss costs the same as a hit.
    'scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  const valid = await verifyPassword(password, hash);
  if (!valid || !row) return null;

  await db.run('UPDATE users SET last_seen_at = ? WHERE id = ?', Date.now(), row.id);
  return toUser(row);
}

export async function changePassword(db: Db, userId: string, current: string, next: string): Promise<Result<true>> {
  const row = await db.get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', userId);
  if (!row) return { ok: false, error: 'not_found', message: 'No such account.' };

  if (!(await verifyPassword(current, row.password_hash))) {
    return { ok: false, error: 'wrong_password', message: 'That is not your current password.' };
  }
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: 'invalid', message: problem };

  const hash = await hashPassword(next);
  await db.tx(async (t) => {
    await t.run('UPDATE users SET password_hash = ?, has_password = 1 WHERE id = ?', hash, userId);
    // Changing a password signs out every other device. That is the whole
    // reason people change passwords, so it happens in the same transaction.
    await t.run('DELETE FROM sessions WHERE user_id = ?', userId);
  });
  return { ok: true, value: true };
}

/**
 * Sets a password without knowing the old one.
 *
 * Only ever called after a single-use link sent to the account's own address
 * has been redeemed — that redemption IS the proof of ownership, and there is
 * no current password to offer in the case this exists for. It also covers an
 * account created through Google choosing a password for the first time.
 *
 * Every other session dies with the change, exactly as in `changePassword`: if
 * this reset happened because somebody else had got in, leaving their session
 * alive would make the whole exercise pointless.
 */
export async function setPassword(db: Db, userId: string, next: string): Promise<Result<true>> {
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: 'invalid', message: problem };

  const exists = await db.get<{ id: string }>('SELECT id FROM users WHERE id = ?', userId);
  if (!exists) return { ok: false, error: 'not_found', message: 'No such account.' };

  const hash = await hashPassword(next);
  await db.tx(async (t) => {
    // `has_password = 1` matters most for the case this exists for: an account
    // created through Google choosing a password for the first time.
    await t.run('UPDATE users SET password_hash = ?, has_password = 1 WHERE id = ?', hash, userId);
    await t.run('DELETE FROM sessions WHERE user_id = ?', userId);
  });
  return { ok: true, value: true };
}

export async function updateProfile(
  db: Db,
  userId: string,
  patch: { displayName?: string; leaderboardOptIn?: boolean; market?: string },
): Promise<Result<User>> {
  if (patch.displayName !== undefined) {
    const problem = displayNameProblem(patch.displayName);
    if (problem) return { ok: false, error: 'invalid', message: problem };
    await db.run('UPDATE users SET display_name = ? WHERE id = ?', patch.displayName.trim(), userId);
  }
  if (patch.leaderboardOptIn !== undefined) {
    await db.run('UPDATE users SET leaderboard_opt_in = ? WHERE id = ?', patch.leaderboardOptIn ? 1 : 0, userId);
  }
  if (patch.market !== undefined) {
    await db.run('UPDATE users SET market = ? WHERE id = ?', patch.market, userId);
  }
  const user = await getUserById(db, userId);
  return user ? { ok: true, value: user } : { ok: false, error: 'not_found', message: 'No such account.' };
}

export async function deleteUser(db: Db, userId: string): Promise<void> {
  // Everything else cascades. That is the point of the foreign keys.
  await db.run('DELETE FROM users WHERE id = ?', userId);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/** Hashed before storage, so a database dump does not hand over live sessions. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  db: Db,
  userId: string,
  userAgent?: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  await db.run(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)',
    hashToken(token),
    userId,
    now,
    expiresAt,
    userAgent?.slice(0, 200) ?? null,
  );

  return { token, expiresAt };
}

/**
 * Resolves a cookie token to a user, sliding the expiry forward as it goes.
 * An expired row is deleted rather than merely ignored — otherwise the table
 * only ever grows.
 */
export async function userForToken(db: Db, token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const hash = hashToken(token);
  const row = await db.get<{ user_id: string; expires_at: number }>(
    'SELECT user_id, expires_at FROM sessions WHERE token_hash = ?',
    hash,
  );
  if (!row) return null;

  const now = Date.now();
  const expiresAt = Number(row.expires_at);
  if (expiresAt <= now) {
    await db.run('DELETE FROM sessions WHERE token_hash = ?', hash);
    return null;
  }

  // Slide the window, but only once a day — otherwise every page view is a write.
  if (expiresAt - now < SESSION_TTL_MS - 24 * 60 * 60 * 1000) {
    await db.run('UPDATE sessions SET expires_at = ? WHERE token_hash = ?', now + SESSION_TTL_MS, hash);
  }

  return getUserById(db, row.user_id);
}

export async function destroySession(db: Db, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.run('DELETE FROM sessions WHERE token_hash = ?', hashToken(token));
}

export async function purgeExpiredSessions(db: Db, now = Date.now()): Promise<number> {
  const before = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sessions WHERE expires_at <= ?', now);
  await db.run('DELETE FROM sessions WHERE expires_at <= ?', now);
  return Number(before?.n ?? 0);
}

// ---------------------------------------------------------------------------
// Sign-in throttling
// ---------------------------------------------------------------------------

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILURES = 8;

/**
 * Returns the seconds a caller must wait, or 0 if they may proceed.
 *
 * Keyed on email+address together. Keying on the email alone would let anyone
 * lock a stranger out of their own account by guessing badly on purpose.
 */
export async function loginBackoffSeconds(db: Db, key: string, now = Date.now()): Promise<number> {
  await db.run('DELETE FROM login_attempts WHERE at < ?', now - LOGIN_WINDOW_MS);
  const row = await db.get<{ n: number; last: number | null }>(
    'SELECT COUNT(*) AS n, MAX(at) AS last FROM login_attempts WHERE key = ? AND at >= ?',
    key,
    now - LOGIN_WINDOW_MS,
  );

  const n = Number(row?.n ?? 0);
  if (n < LOGIN_MAX_FAILURES) return 0;
  const retryAt = Number(row?.last ?? now) + LOGIN_WINDOW_MS;
  return Math.max(1, Math.ceil((retryAt - now) / 1000));
}

export async function recordLoginFailure(db: Db, key: string, now = Date.now()): Promise<void> {
  await db.run('INSERT INTO login_attempts (key, at) VALUES (?, ?)', key, now);
}

export async function clearLoginFailures(db: Db, key: string): Promise<void> {
  await db.run('DELETE FROM login_attempts WHERE key = ?', key);
}
