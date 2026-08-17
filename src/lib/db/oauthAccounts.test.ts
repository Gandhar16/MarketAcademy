import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { createUser, checkCredentials, getUserById } from './users';
import {
  findByProviderIdentity,
  linkToUser,
  linkedProviders,
  signInWithIdentity,
  unlinkProvider,
  unusablePassword,
  usableDisplayName,
  type LinkedIdentity,
} from './oauthAccounts';

const PASSWORD = 'a-long-enough-passphrase';

let db: Db;
beforeEach(async () => {
  db = await openTestDb();
});

function identity(over: Partial<LinkedIdentity> = {}): LinkedIdentity {
  return {
    provider: 'google',
    providerUserId: 'google-sub-1',
    email: 'ram@example.com',
    emailVerified: true,
    displayName: 'Ram',
    ...over,
  };
}

describe('signing in with a provider', () => {
  it('creates an account the first time', async () => {
    const outcome = await signInWithIdentity(db, identity());
    expect(outcome.kind).toBe('created');
    expect(outcome.user.email).toBe('ram@example.com');
    expect(outcome.user.displayName).toBe('Ram');
  });

  it('returns to the same account on the second sign-in', async () => {
    const first = await signInWithIdentity(db, identity());
    const second = await signInWithIdentity(db, identity());
    expect(second.kind).toBe('signed-in');
    expect(second.user.id).toBe(first.user.id);
  });

  it('follows the provider id, not the email, when the address changes', async () => {
    const first = await signInWithIdentity(db, identity());
    // Same person, same Google account, new address on it.
    const second = await signInWithIdentity(db, identity({ email: 'ram.new@example.com' }));
    expect(second.user.id).toBe(first.user.id);
  });

  it('never opts a new account into the public leaderboard', async () => {
    const outcome = await signInWithIdentity(db, identity());
    expect(outcome.user.leaderboardOptIn).toBe(false);
  });
});

describe('linking to an existing account', () => {
  it('links when the provider has VERIFIED the address', async () => {
    const made = await createUser(db, { email: 'ram@example.com', displayName: 'Ram', password: PASSWORD });
    if (!made.ok) throw new Error(made.message);

    const outcome = await signInWithIdentity(db, identity({ emailVerified: true }));
    expect(outcome.kind).toBe('linked');
    expect(outcome.user.id).toBe(made.value.id);
  });

  it('marks the address confirmed once a provider has vouched for it', async () => {
    const made = await createUser(db, { email: 'ram@example.com', displayName: 'Ram', password: PASSWORD });
    if (!made.ok) throw new Error(made.message);

    await signInWithIdentity(db, identity({ emailVerified: true }));
    const row = await db.get<{ email_verified_at: number | null }>(
      'SELECT email_verified_at FROM users WHERE id = ?',
      made.value.id,
    );
    expect(row?.email_verified_at).toBeTruthy();
  });

  /**
   * The account-takeover test. A provider that merely echoes back an address it
   * has not checked must not be able to hand over somebody else's account.
   */
  it('refuses to link on an UNVERIFIED address, and makes a separate account', async () => {
    const victim = await createUser(db, { email: 'ram@example.com', displayName: 'Ram', password: PASSWORD });
    if (!victim.ok) throw new Error(victim.message);

    const outcome = await signInWithIdentity(db, identity({ provider: 'facebook', emailVerified: false }));
    expect(outcome.kind).toBe('created');
    expect(outcome.user.id).not.toBe(victim.value.id);

    // And the original account is untouched — still reachable by its password.
    expect(await checkCredentials(db, 'ram@example.com', PASSWORD)).not.toBeNull();
  });

  it('does not let an unverified sign-in squat on the email key', async () => {
    // Unverified first...
    await signInWithIdentity(db, identity({ provider: 'facebook', providerUserId: 'fb-1', emailVerified: false }));
    // ...then the real owner registers with a password. This must still work:
    // if the unverified account had claimed `email_key`, it would collide.
    const made = await createUser(db, { email: 'ram@example.com', displayName: 'Ram', password: PASSWORD });
    expect(made.ok).toBe(true);
  });
});

describe('accounts with no password', () => {
  it('cannot be signed into with any password', async () => {
    await signInWithIdentity(db, identity());
    expect(await checkCredentials(db, 'ram@example.com', PASSWORD)).toBeNull();
    expect(await checkCredentials(db, 'ram@example.com', '')).toBeNull();
  });

  it('stores a well-formed hash, so the check is not short-circuited', async () => {
    const hash = await unusablePassword();
    // Same shape as a real one — that is what keeps the timing identical and
    // stops the response revealing which accounts are provider-only.
    expect(hash.split('$')).toHaveLength(6);
    expect(hash.startsWith('scrypt$')).toBe(true);
  });
});

describe('linking and unlinking deliberately', () => {
  it('links a provider to the signed-in account', async () => {
    const made = await createUser(db, { email: 'ram@example.com', displayName: 'Ram', password: PASSWORD });
    if (!made.ok) throw new Error(made.message);

    expect(await linkToUser(db, made.value.id, identity({ emailVerified: false }))).toEqual({ ok: true });
    expect(await linkedProviders(db, made.value.id)).toHaveLength(1);
  });

  it('refuses to steal a provider account already linked elsewhere', async () => {
    const first = await signInWithIdentity(db, identity());
    const other = await createUser(db, { email: 'sita@example.com', displayName: 'Sita', password: PASSWORD });
    if (!other.ok) throw new Error(other.message);

    const result = await linkToUser(db, other.value.id, identity());
    expect(result.ok).toBe(false);
    // And the original link is undisturbed.
    expect((await findByProviderIdentity(db, 'google', 'google-sub-1'))?.id).toBe(first.user.id);
  });

  it('will not unlink the only way into an account', async () => {
    // Created through the provider, so the password is unusable. Its address is
    // verified, but there is no other provider and no password to fall back to.
    const outcome = await signInWithIdentity(db, identity({ emailVerified: false }));
    const result = await unlinkProvider(db, outcome.user.id, 'google');
    expect(result.ok).toBe(false);
    expect(await linkedProviders(db, outcome.user.id)).toHaveLength(1);
  });

  it('unlinks once a second provider exists', async () => {
    const outcome = await signInWithIdentity(db, identity({ emailVerified: false }));
    await linkToUser(db, outcome.user.id, identity({ provider: 'github', providerUserId: 'gh-1' }));

    expect(await unlinkProvider(db, outcome.user.id, 'google')).toEqual({ ok: true });
    expect(await linkedProviders(db, outcome.user.id)).toEqual([{ provider: 'github', email: 'ram@example.com' }]);
  });

  it('takes the links with the account when it is deleted', async () => {
    const outcome = await signInWithIdentity(db, identity());
    await db.run('DELETE FROM users WHERE id = ?', outcome.user.id);
    expect(await findByProviderIdentity(db, 'google', 'google-sub-1')).toBeNull();
    expect(await getUserById(db, outcome.user.id)).toBeNull();
  });
});

describe('display names from a provider', () => {
  it('keeps an ordinary one', () => {
    expect(usableDisplayName('Ram Sharma', null)).toBe('Ram Sharma');
  });

  it('strips characters that would let it pose as markup or a link', () => {
    expect(usableDisplayName('Ram <b>Sharma</b>', null)).toBe('Ram b Sharma b');
  });

  it('falls back to the local part of the address, then to something neutral', () => {
    expect(usableDisplayName(null, 'ram.sharma@example.com')).toBe('ram.sharma');
    expect(usableDisplayName(null, null)).toBe('Learner');
    expect(usableDisplayName('', '')).toBe('Learner');
  });

  it('truncates a very long one rather than rejecting it', () => {
    const name = usableDisplayName('a'.repeat(80), null);
    expect(name.length).toBeLessThanOrEqual(24);
  });
});
