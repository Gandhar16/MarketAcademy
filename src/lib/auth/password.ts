/**
 * Password hashing.
 *
 * scrypt from node:crypto — memory-hard, in the standard library, and the
 * OWASP-recommended choice when Argon2 is not available without a dependency.
 * No bcrypt: it silently truncates at 72 bytes, which turns a long passphrase
 * into a shorter one without telling anybody.
 */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * OWASP's 2024 minimum for scrypt is N=2^17, r=8, p=1. That costs roughly
 * 128 MB of memory per hash, which is the entire point — it is what makes a
 * stolen hash expensive to attack offline.
 */
export const SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

// The policy itself lives in ./policy so the sign-up form can enforce the same
// rule without pulling node:crypto into the browser bundle. Re-exported here so
// server code has one import for everything password-shaped.
export { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, passwordProblem } from './policy';

/** Returns `scrypt$N$r$p$salt$hash`, self-describing so parameters can change later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const { N, r, p } = SCRYPT_PARAMS;
  const derived = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH, SCRYPT_PARAMS);
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/**
 * Constant-time verification against a stored hash, using the parameters
 * recorded in the hash rather than today's. That is what lets SCRYPT_PARAMS be
 * raised later without invalidating everyone's password.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  // A hostile row cannot ask us to allocate an arbitrary amount of memory.
  if (N > 2 ** 20 || r > 32 || p > 16) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], 'base64');
    expected = Buffer.from(parts[5], 'base64');
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const derived = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
    N,
    r,
    p,
    maxmem: 512 * 1024 * 1024,
  });

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
