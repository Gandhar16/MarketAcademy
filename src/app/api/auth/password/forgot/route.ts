/**
 * POST /api/auth/password/forgot
 * { email }
 *
 * Always answers the same thing.
 *
 * That is the whole design of this endpoint. "No account with that address"
 * turns a form anyone can reach into a tool for testing whether a given person
 * is registered here — and this site knows what people have been practising,
 * which is not a fact to leak about somebody. So an unknown address, an account
 * that exists, and an account whose address was never confirmed all produce the
 * identical response and the identical status code. Only the inbox differs.
 *
 * Accounts created through Google that never confirmed an address are
 * unreachable here by construction rather than by a check: their `email_key` is
 * namespaced to the provider, so a lookup by address simply does not find them.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserByEmail } from '@/lib/db/users';
import { issueToken } from '@/lib/db/emailTokens';
import { siteUrl } from '@/lib/auth/oauth';
import { sendMail } from '@/lib/email/send';
import { resetPasswordMessage } from '@/lib/email/templates';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The one answer, whatever happened. */
const ALWAYS = {
  ok: true,
  message: 'If there is an account with that address, a reset link is on its way. Check your spam folder too.',
};

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== 'string') {
    return NextResponse.json({ error: 'bad_request', message: 'Pass { email }.' }, { status: 400 });
  }

  const db = await getDb();
  const user = await getUserByEmail(db, body.email);

  // Everything below is best-effort and deliberately unreported. A failure to
  // send must not become the signal that distinguishes a real account from an
  // imaginary one.
  if (user?.email) {
    const issued = await issueToken(db, { userId: user.id, purpose: 'reset', email: user.email });
    if (issued.ok) {
      const url = `${siteUrl()}/reset-password?token=${encodeURIComponent(issued.token)}`;
      await sendMail({ to: user.email, ...resetPasswordMessage({ url, displayName: user.displayName }) });
    }
  }

  return NextResponse.json(ALWAYS);
}
