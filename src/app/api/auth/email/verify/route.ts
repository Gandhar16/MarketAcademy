/**
 * POST /api/auth/email/verify
 *
 * Sends a confirmation link to the signed-in account's own address. No body:
 * the only address it will ever mail is the one already on the account, so
 * there is nothing for a caller to choose and nothing to abuse.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { issueToken } from '@/lib/db/emailTokens';
import { requireUser } from '@/lib/auth/session';
import { siteUrl } from '@/lib/auth/oauth';
import { sendMail } from '@/lib/email/send';
import { verifyEmailMessage } from '@/lib/email/templates';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  if (!user.email) {
    return NextResponse.json(
      { error: 'no_email', message: 'This account has no email address to confirm.' },
      { status: 400 },
    );
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, message: 'That address is already confirmed.' });
  }

  const db = await getDb();
  const issued = await issueToken(db, { userId: user.id, purpose: 'verify', email: user.email });
  if (!issued.ok) return NextResponse.json({ error: 'too_many', message: issued.message }, { status: 429 });

  const url = `${siteUrl()}/verify-email?token=${encodeURIComponent(issued.token)}`;
  const sent = await sendMail({ to: user.email, ...verifyEmailMessage({ url, displayName: user.displayName }) });
  if (!sent.ok) return NextResponse.json({ error: 'send_failed', message: sent.message }, { status: 502 });

  return NextResponse.json({ ok: true, message: `Sent. Check ${user.email}.` });
}
