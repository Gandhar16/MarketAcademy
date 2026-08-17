/**
 * Resolving a provider identity to a Market Academy account.
 *
 * Three outcomes, in this order, and the order is the security design:
 *
 *  1. **Known identity** — this provider + subject id has signed in before.
 *     Sign them into the account it is linked to. No email involved.
 *  2. **New identity, provably the same person** — the provider states it has
 *     VERIFIED an address that an existing account uses. Link, and sign in.
 *  3. **New identity, everything else** — create a new account.
 *
 * Rule 2 is the one worth defending. Matching on an unverified address would
 * mean anyone who can convince a provider to echo back someone else's email —
 * by setting it as an unconfirmed profile field, which several providers allow
 * — inherits that account outright, along with its progress, its P&L and its
 * Pro plan. So an unverified address is treated as no address: it does not
 * match, it does not link, it does not even get the benefit of the doubt.
 *
 * The reverse direction is safe and is allowed: a brand-new OAuth account whose
 * verified email happens to be free simply takes it.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from '@/lib/auth/password';
import type { Db } from './driver';
import { displayNameProblem, emailKey, getUserById, type User } from './users';

export interface LinkedIdentity {
  provider: string;
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}

export type SignInOutcome =
  | { kind: 'signed-in'; user: User }
  | { kind: 'linked'; user: User }
  | { kind: 'created'; user: User };

/**
 * A password that cannot be used, for an account that has never had one.
 *
 * Correctly formed, so `checkCredentials` runs the same full scrypt comparison
 * it runs for everyone else and takes the same time — an early return here
 * would let an attacker time the difference and enumerate which addresses are
 * Google-only. Derived from 32 random bytes that are discarded, so there is no
 * string anybody can send that verifies against it.
 */
export async function unusablePassword(): Promise<string> {
  return hashPassword(randomBytes(32).toString('base64url'));
}

/**
 * A display name from a provider is somebody's real name, chosen for a
 * different audience, and it lands on a public leaderboard here. It still has
 * to satisfy the same rules a typed one does — length, and no characters that
 * let it masquerade as markup or a URL.
 */
export function usableDisplayName(candidate: string | null, fallbackEmail: string | null): string {
  const trimmed = (candidate ?? '').trim();
  if (trimmed && !displayNameProblem(trimmed)) return trimmed;

  // Strip anything the rules reject rather than giving up on it — "Ravi
  // Sharma <ravi>" should become "Ravi Sharma", not "Learner".
  const cleaned = trimmed.replace(/[<>@/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 24).trim();
  if (cleaned && !displayNameProblem(cleaned)) return cleaned;

  const local = (fallbackEmail ?? '').split('@')[0].replace(/[<>@/\\]/g, '').slice(0, 24);
  if (local && !displayNameProblem(local)) return local;

  return 'Learner';
}

export async function findByProviderIdentity(
  db: Db,
  provider: string,
  providerUserId: string,
): Promise<User | null> {
  const row = await db.get<{ user_id: string }>(
    'SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?',
    provider,
    providerUserId,
  );
  return row ? getUserById(db, row.user_id) : null;
}

export async function linkedProviders(db: Db, userId: string): Promise<{ provider: string; email: string | null }[]> {
  const rows = await db.all<{ provider: string; email: string | null }>(
    'SELECT provider, email FROM oauth_accounts WHERE user_id = ? ORDER BY linked_at',
    userId,
  );
  return rows.map((r) => ({ provider: r.provider, email: r.email }));
}

/**
 * The whole sign-in decision, as one transaction per outcome.
 *
 * Returns which of the three paths was taken, because the pages want to say
 * different things: a fresh account should land somewhere that explains what
 * this site is, and a newly linked one is worth telling the person about
 * explicitly rather than silently merging their two identities.
 */
export async function signInWithIdentity(db: Db, identity: LinkedIdentity): Promise<SignInOutcome> {
  const now = Date.now();

  // 1. Seen this exact identity before.
  const known = await findByProviderIdentity(db, identity.provider, identity.providerUserId);
  if (known) {
    await db.run('UPDATE users SET last_seen_at = ? WHERE id = ?', now, known.id);
    return { kind: 'signed-in', user: (await getUserById(db, known.id))! };
  }

  // 2. Provider has verified an address that an existing account already uses.
  if (identity.email && identity.emailVerified) {
    const existing = await db.get<{ id: string }>(
      'SELECT id FROM users WHERE email_key = ?',
      emailKey(identity.email),
    );
    if (existing) {
      await db.tx(async (t) => {
        await t.run(
          'INSERT INTO oauth_accounts (provider, provider_user_id, user_id, email, linked_at) VALUES (?, ?, ?, ?, ?)',
          identity.provider,
          identity.providerUserId,
          existing.id,
          identity.email,
          now,
        );
        // The provider just proved the address. If the account had never
        // confirmed it, it is confirmed now — that is the same evidence the
        // confirmation email would have produced.
        await t.run(
          'UPDATE users SET last_seen_at = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?',
          now,
          now,
          existing.id,
        );
      });
      return { kind: 'linked', user: (await getUserById(db, existing.id))! };
    }
  }

  // 3. A new account.
  //
  // The email is stored even when unverified, because it is still the best
  // handle for support and for telling two accounts apart. What it does NOT do
  // is claim `email_key` when it is unverified — that unique column is what
  // rule 2 matches on, so letting an unproven address occupy it would hand the
  // next person to verify that address a permanent collision. Those accounts
  // get a namespaced key instead, unique and unmatchable.
  const id = randomUUID();
  const key = identity.email && identity.emailVerified
    ? emailKey(identity.email)
    : `oauth:${identity.provider}:${identity.providerUserId}`;

  await db.tx(async (t) => {
    await t.run(
      `INSERT INTO users (id, email, email_key, display_name, password_hash, created_at, last_seen_at,
                          leaderboard_opt_in, market, email_verified_at, has_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      id,
      identity.email ?? '',
      key,
      usableDisplayName(identity.displayName, identity.email),
      await unusablePassword(),
      now,
      now,
      // Off, exactly as it is for a password sign-up. Appearing on a public
      // board is a choice, and arriving via Google is not that choice.
      0,
      'IN',
      identity.email && identity.emailVerified ? now : null,
    );
    await t.run('INSERT INTO user_stats (user_id, updated_at) VALUES (?, ?)', id, now);
    await t.run(
      'INSERT INTO oauth_accounts (provider, provider_user_id, user_id, email, linked_at) VALUES (?, ?, ?, ?, ?)',
      identity.provider,
      identity.providerUserId,
      id,
      identity.email,
      now,
    );
  });

  return { kind: 'created', user: (await getUserById(db, id))! };
}

/**
 * Link a provider to the account already signed in — the deliberate path, from
 * the account page, for the cases rule 2 refuses to do automatically.
 */
export async function linkToUser(db: Db, userId: string, identity: LinkedIdentity): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const taken = await findByProviderIdentity(db, identity.provider, identity.providerUserId);
  if (taken) {
    return taken.id === userId
      ? { ok: true }
      : { ok: false, message: `That ${identity.provider} account is already linked to a different account here.` };
  }
  await db.run(
    'INSERT INTO oauth_accounts (provider, provider_user_id, user_id, email, linked_at) VALUES (?, ?, ?, ?, ?)',
    identity.provider,
    identity.providerUserId,
    userId,
    identity.email,
    Date.now(),
  );
  return { ok: true };
}

/**
 * Unlink, unless it is the only way in.
 *
 * An account created through Google has an unusable password, so removing its
 * last provider would lock the person out of their own progress permanently
 * with no way to recover. Refused rather than warned about.
 */
export async function unlinkProvider(db: Db, userId: string, provider: string): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const links = await linkedProviders(db, userId);
  if (!links.some((l) => l.provider === provider)) return { ok: true };

  if (links.length === 1) {
    const row = await db.get<{ verified: number | null }>(
      'SELECT email_verified_at AS verified FROM users WHERE id = ?',
      userId,
    );
    // Without a confirmed address there is no password-reset route back in, so
    // this link is the only door.
    if (!row?.verified) {
      return {
        ok: false,
        message:
          'That is the only way you can sign in. Confirm your email address first, then set a password — after that you can unlink this.',
      };
    }
  }

  await db.run('DELETE FROM oauth_accounts WHERE user_id = ? AND provider = ?', userId, provider);
  return { ok: true };
}
