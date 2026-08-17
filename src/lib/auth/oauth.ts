/**
 * Signing in with Google and friends.
 *
 * Authorization Code flow with PKCE, against the existing session system rather
 * than instead of it. A social sign-in ends at exactly the same place a password
 * sign-in does — a row in `sessions` and the `ma_session` cookie — so every
 * access check, the leaderboard, XP, the paywall and account deletion keep
 * working without knowing which button was pressed.
 *
 * No SDK per provider. All four are ordinary OAuth 2.0 endpoints, and a
 * dependency per button would be four supply-chain risks and four upgrade
 * treadmills for what is one POST and one GET each.
 *
 * ── The security decision worth reading ──────────────────────────────────────
 *
 * The dangerous move in social login is linking a provider account to an
 * existing local account by email. If someone can get a provider to assert
 * "my email is gandhar@example.com" without proving it, they inherit that
 * account — password, progress, Pro plan and all.
 *
 * So the rule here is: link only when the provider states, explicitly, that it
 * verified the address. Google says so with `email_verified`; GitHub says so
 * per-address on /user/emails. Facebook and Microsoft do not say so at all, so
 * their sign-ins never auto-link — they create their own account, and the
 * learner can link deliberately from the account page later. An unverified
 * address is treated as no address at all, never as a weaker yes.
 */

import { randomBytes, createHash } from 'node:crypto';

/**
 * A plain record rather than `NodeJS.ProcessEnv`, for the reason already
 * recorded in db/driver.ts: the framework augments that type with required
 * keys, so a test cannot construct one from the two variables it cares about.
 */
type Env = Record<string, string | undefined>;

export interface OAuthProfile {
  /** The provider's own immutable id for this person. Never their email. */
  providerUserId: string;
  email: string | null;
  /**
   * The provider has actually verified this address. False whenever the
   * provider does not say, which is deliberately indistinguishable from a
   * provider that says no — see the note above.
   */
  emailVerified: boolean;
  displayName: string | null;
}

export interface OAuthProvider {
  id: string;
  /** What the button says. */
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  /** Provider-specific extras on the authorize request. */
  authorizeParams?: Record<string, string>;
  /** One call, or several, depending on how the provider exposes an email. */
  fetchProfile: (accessToken: string) => Promise<OAuthProfile>;
}

// ---------------------------------------------------------------------------
// Reading untyped JSON without reaching for `any`
// ---------------------------------------------------------------------------

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A provider that answers with an error, or with HTML, must not look like a success. */
async function getJson(url: string, accessToken: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
      // GitHub rejects requests with no User-Agent outright.
      'user-agent': 'market-academy',
    },
  });
  if (!res.ok) throw new Error(`Profile request failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// The providers
// ---------------------------------------------------------------------------

export const PROVIDERS: OAuthProvider[] = [
  {
    id: 'google',
    label: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    clientIdEnv: 'OAUTH_GOOGLE_CLIENT_ID',
    clientSecretEnv: 'OAUTH_GOOGLE_CLIENT_SECRET',
    // `select_account` so a shared or family device does not silently sign in
    // as whoever used it last — which on a learning site means one person's
    // progress landing in another person's account.
    authorizeParams: { prompt: 'select_account' },
    async fetchProfile(token) {
      const me = record(await getJson('https://openidconnect.googleapis.com/v1/userinfo', token));
      return {
        providerUserId: str(me.sub) ?? '',
        email: str(me.email),
        // Google returns a real boolean here. Anything else is treated as "no".
        emailVerified: me.email_verified === true,
        displayName: str(me.name) ?? str(me.given_name),
      };
    },
  },
  {
    id: 'github',
    label: 'GitHub',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    clientIdEnv: 'OAUTH_GITHUB_CLIENT_ID',
    clientSecretEnv: 'OAUTH_GITHUB_CLIENT_SECRET',
    async fetchProfile(token) {
      const me = record(await getJson('https://api.github.com/user', token));

      /**
       * A second call, because `/user` returns the PUBLIC profile email, which
       * is blank for most accounts and is not necessarily verified when it is
       * present. `/user/emails` is the one that reports verification per
       * address, and the primary+verified entry is the only one worth trusting.
       */
      let email = null as string | null;
      let verified = false;
      try {
        const list = await getJson('https://api.github.com/user/emails', token);
        if (Array.isArray(list)) {
          const primary = list.map(record).find((e) => e.primary === true && e.verified === true);
          if (primary) {
            email = str(primary.email);
            verified = email != null;
          }
        }
      } catch {
        // Losing the email costs the learner an auto-link, not their sign-in.
      }

      return {
        providerUserId: str(me.id) ?? String(me.id ?? ''),
        email,
        emailVerified: verified,
        displayName: str(me.name) ?? str(me.login),
      };
    },
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'openid email profile',
    clientIdEnv: 'OAUTH_MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'OAUTH_MICROSOFT_CLIENT_SECRET',
    async fetchProfile(token) {
      const me = record(await getJson('https://graph.microsoft.com/oidc/userinfo', token));
      return {
        providerUserId: str(me.sub) ?? '',
        email: str(me.email),
        // Microsoft's userinfo carries no verification claim, and a personal
        // account's address is not necessarily proven. So: never auto-linked.
        emailVerified: false,
        displayName: str(me.name),
      };
    },
  },
  {
    id: 'facebook',
    label: 'Facebook',
    authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scope: 'email public_profile',
    clientIdEnv: 'OAUTH_FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'OAUTH_FACEBOOK_CLIENT_SECRET',
    async fetchProfile(token) {
      const me = record(await getJson('https://graph.facebook.com/v21.0/me?fields=id,name,email', token));
      return {
        providerUserId: str(me.id) ?? '',
        email: str(me.email),
        // Same as Microsoft: no verification claim in the response, so no
        // auto-link. Facebook also simply omits the field when the person
        // declined the email permission, which is common.
        emailVerified: false,
        displayName: str(me.name),
      };
    },
  },
];

export function providerById(id: string): OAuthProvider | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

/**
 * Configured providers only.
 *
 * This is what lets Google ship the day its credentials exist while the other
 * three stay dark, with no code change and no half-working button. A button
 * that leads to a provider error page is worse than no button.
 */
export function enabledProviders(env: Env = process.env): OAuthProvider[] {
  return PROVIDERS.filter((p) => Boolean(env[p.clientIdEnv]) && Boolean(env[p.clientSecretEnv]));
}

// ---------------------------------------------------------------------------
// PKCE and state
// ---------------------------------------------------------------------------

/**
 * PKCE, on every provider, including the ones where a confidential client with
 * a secret arguably does not need it. It costs one hash and closes the
 * authorization-code interception window for free.
 */
export function createVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function challengeFor(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function createState(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * Where the provider sends the browser back.
 *
 * Built from configuration, never from the request's Host header. A redirect
 * URI derived from an attacker-controllable header is how authorization codes
 * get delivered to somebody else's server — and it has to match what is
 * registered in the provider's console character for character anyway.
 */
export function siteUrl(env: Env = process.env): string {
  const explicit = env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  // Vercel sets this to the stable production domain, which is the right
  // fallback for a deployment nobody has configured SITE_URL on yet.
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export function redirectUri(providerId: string, env: Env = process.env): string {
  return `${siteUrl(env)}/api/auth/oauth/${providerId}/callback`;
}

export function authorizeUrlFor(
  provider: OAuthProvider,
  { state, verifier, env = process.env }: { state: string; verifier: string; env?: Env },
): string {
  const url = new URL(provider.authorizeUrl);
  url.searchParams.set('client_id', env[provider.clientIdEnv] ?? '');
  url.searchParams.set('redirect_uri', redirectUri(provider.id, env));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', provider.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challengeFor(verifier));
  url.searchParams.set('code_challenge_method', 'S256');
  for (const [k, v] of Object.entries(provider.authorizeParams ?? {})) url.searchParams.set(k, v);
  return url.toString();
}

/** Swaps the one-time code for an access token. */
export async function exchangeCode(
  provider: OAuthProvider,
  { code, verifier, env = process.env }: { code: string; verifier: string; env?: Env },
): Promise<string> {
  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      // GitHub answers this endpoint in form-encoding unless asked otherwise,
      // and a form-encoded body parsed as JSON throws rather than degrading.
      accept: 'application/json',
      'user-agent': 'market-academy',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(provider.id, env),
      client_id: env[provider.clientIdEnv] ?? '',
      client_secret: env[provider.clientSecretEnv] ?? '',
      code_verifier: verifier,
    }),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const body = record(await res.json());
  const token = str(body.access_token);
  // Providers signal failure with a 200 and an `error` field at least as often
  // as with a status code, so the absence of a token is the real check.
  if (!token) throw new Error(`Token exchange returned no access token: ${str(body.error) ?? 'unknown'}`);
  return token;
}
