/**
 * GET /api/auth/oauth/:provider/start
 *
 * Begins the redirect dance. Everything this request needs to remember until
 * the provider sends the browser back — the state, the PKCE verifier, whether
 * this is a sign-in or a deliberate link, and where to land afterwards — goes
 * into one short-lived httpOnly cookie rather than into a server-side store.
 * There is no session yet to key a store on, and a cookie the client cannot
 * read is exactly as trustworthy here.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeUrlFor, createState, createVerifier, enabledProviders, providerById } from '@/lib/auth/oauth';
import { currentUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const OAUTH_COOKIE = 'ma_oauth';
/** Long enough to sign in, short enough that a stale tab cannot replay it. */
const FLOW_TTL_SECONDS = 10 * 60;

/**
 * Only a path on this site, never a full URL.
 *
 * `?next=` is attacker-supplied and ends up in a Location header. Accepting
 * anything else turns sign-in into an open redirect — the classic phishing
 * primitive, where a link that genuinely starts at your domain finishes on
 * someone else's. `//evil.com` is rejected too: it is protocol-relative and a
 * browser treats it as an absolute URL.
 */
export function safeNext(value: string | null): string {
  if (!value) return '/progress';
  if (!value.startsWith('/') || value.startsWith('//')) return '/progress';
  return value;
}

export async function GET(req: Request, ctx: RouteContext<'/api/auth/oauth/[provider]/start'>) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const { provider: providerId } = await ctx.params;
  const provider = providerById(providerId);

  // Enabled, not merely known. A provider without credentials would send the
  // learner to a provider error page they cannot act on.
  if (!provider || !enabledProviders().some((p) => p.id === provider.id)) {
    return NextResponse.json(
      { error: 'unknown_provider', message: 'That sign-in method is not available.' },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const state = createState();
  const verifier = createVerifier();

  // `link` only means anything for someone already signed in; asking to link
  // while signed out is just a sign-in.
  const wantsLink = url.searchParams.get('mode') === 'link';
  const mode = wantsLink && (await currentUser()) ? 'link' : 'signin';

  const jar = await cookies();
  jar.set(
    OAUTH_COOKIE,
    JSON.stringify({ provider: provider.id, state, verifier, mode, next: safeNext(url.searchParams.get('next')) }),
    {
      httpOnly: true,
      // `lax`, and it has to be: the provider returns the browser here with a
      // top-level GET redirect from their domain, and `strict` withholds the
      // cookie on exactly that navigation — which would break every sign-in.
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: FLOW_TTL_SECONDS,
    },
  );

  return NextResponse.redirect(authorizeUrlFor(provider, { state, verifier }));
}
