/**
 * GET /api/auth/oauth/:provider/callback
 *
 * Where the provider sends the browser back. Validates the flow, swaps the code
 * for a token, reads the profile, and ends in the same place a password sign-in
 * ends: `startSession`, and a redirect.
 *
 * Every failure here is a redirect to /login carrying a short reason CODE, not
 * a JSON error. Whoever is looking at this is a person in a browser who pressed
 * a button, and a raw 400 tells them nothing they can act on. Why a code rather
 * than the sentence itself is explained above `FailureCode`.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { exchangeCode, providerById, siteUrl } from '@/lib/auth/oauth';
import { currentUser, startSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { linkToUser, signInWithIdentity } from '@/lib/db/oauthAccounts';
import { OAUTH_COOKIE } from '../start/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FlowState {
  provider: string;
  state: string;
  verifier: string;
  mode: 'signin' | 'link';
  next: string;
}

function readFlow(raw: string | undefined): FlowState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const f = parsed as Record<string, unknown>;
    if (typeof f.provider !== 'string' || typeof f.state !== 'string' || typeof f.verifier !== 'string') return null;
    return {
      provider: f.provider,
      state: f.state,
      verifier: f.verifier,
      mode: f.mode === 'link' ? 'link' : 'signin',
      next: typeof f.next === 'string' && f.next.startsWith('/') && !f.next.startsWith('//') ? f.next : '/progress',
    };
  } catch {
    return null;
  }
}

/** Constant-time, and length-safe — `timingSafeEqual` throws on a length mismatch. */
function sameState(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * A CODE, never a message.
 *
 * The sign-in page reads this out of the query string and shows the matching
 * sentence from its own fixed list. Sending prose instead would mean anything
 * in that parameter gets rendered — so a crafted link to our real domain could
 * display "Your account is suspended, call this number" above a genuine
 * sign-in form. React escapes the markup; it cannot escape the meaning.
 */
export type FailureCode =
  | 'unavailable'
  | 'cancelled'
  | 'provider_error'
  | 'expired'
  | 'mismatch'
  | 'unverified'
  | 'no_code'
  | 'unreachable'
  | 'signed_out';

function fail(code: FailureCode): NextResponse {
  const url = new URL('/login', siteUrl());
  url.searchParams.set('error', code);
  return NextResponse.redirect(url);
}

export async function GET(req: Request, ctx: RouteContext<'/api/auth/oauth/[provider]/callback'>) {
  const { provider: providerId } = await ctx.params;
  const provider = providerById(providerId);

  const jar = await cookies();
  const flow = readFlow(jar.get(OAUTH_COOKIE)?.value);
  // One attempt per cookie, whatever happens next. Leaving it in place would
  // let a replayed callback URL be retried against a still-valid verifier.
  jar.delete(OAUTH_COOKIE);

  if (!provider) return fail('unavailable');

  const url = new URL(req.url);

  // The provider reports a refusal here — most often the person pressing
  // "Cancel" on the consent screen, which is not an error worth alarming them
  // about.
  const providerError = url.searchParams.get('error');
  if (providerError) {
    return fail(providerError === 'access_denied' ? 'cancelled' : 'provider_error');
  }

  if (!flow) return fail('expired');
  if (flow.provider !== provider.id) return fail('mismatch');

  const state = url.searchParams.get('state');
  // The CSRF check. Without it, an attacker can hand someone a pre-baked
  // callback URL and silently sign them into the ATTACKER's account, where
  // everything they then do is visible to whoever owns it.
  if (!state || !sameState(state, flow.state)) return fail('unverified');

  const code = url.searchParams.get('code');
  if (!code) return fail('no_code');

  let identity;
  try {
    const token = await exchangeCode(provider, { code, verifier: flow.verifier });
    const profile = await provider.fetchProfile(token);
    if (!profile.providerUserId) return fail('provider_error');
    identity = {
      provider: provider.id,
      providerUserId: profile.providerUserId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      displayName: profile.displayName,
    };
  } catch {
    // Deliberately not surfacing the provider's message: it is written for a
    // developer reading a console, and can carry request identifiers.
    return fail('unreachable');
  }

  const db = await getDb();

  // Deliberate linking, from the account page, by someone already signed in.
  if (flow.mode === 'link') {
    const me = await currentUser();
    if (!me) return fail('signed_out');
    const result = await linkToUser(db, me.id, identity);
    const back = new URL('/account', siteUrl());
    // Same rule as the sign-in failures: identifiers, never prose. The only
    // way linking fails is that this provider account belongs to someone else
    // here, so one code covers it.
    if (result.ok) back.searchParams.set('linked', provider.id);
    else back.searchParams.set('link_error', provider.id);
    return NextResponse.redirect(back);
  }

  const outcome = await signInWithIdentity(db, identity);
  await startSession(outcome.user.id, req.headers.get('user-agent') ?? undefined);

  const destination = new URL(flow.next, siteUrl());
  // Tells the page whether to greet a newcomer or a returning learner, and
  // whether to mention that two ways in now reach one account.
  if (outcome.kind !== 'signed-in') destination.searchParams.set('welcome', outcome.kind);
  return NextResponse.redirect(destination);
}
