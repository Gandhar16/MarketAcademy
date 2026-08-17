/**
 * POST /api/auth/password/reset
 * { token, password }
 *
 * Redeems a link from the reset email and sets the new password. Redeeming the
 * token is the proof of ownership — no current password is asked for, because
 * the entire point is that there isn't one to hand.
 *
 * Deliberately does NOT sign the person in afterwards. `setPassword` clears
 * every session on the account, which is the correct response to "somebody may
 * have been in here"; quietly minting a fresh session for whoever submitted
 * this form would undo that in the same request. They land on the sign-in page
 * and use the password they just chose.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { redeemToken } from '@/lib/db/emailTokens';
import { setPassword } from '@/lib/db/users';
import { passwordProblem } from '@/lib/auth/policy';
import { endSession } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.token !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'bad_request', message: 'Pass { token, password }.' }, { status: 400 });
  }

  const db = await getDb();

  /**
   * The password is checked BEFORE the token is spent. Otherwise a new password
   * that fails the length rule would burn the only link the person has, and
   * they would have to go back to their inbox and ask for another one to fix a
   * typo.
   */
  const problem = passwordProblem(body.password);
  if (problem) return NextResponse.json({ error: 'invalid', message: problem }, { status: 400 });

  const redeemed = await redeemToken(db, body.token, 'reset');
  if (!redeemed.ok) return NextResponse.json({ error: redeemed.reason, message: redeemed.message }, { status: 400 });

  const result = await setPassword(db, redeemed.value.userId, body.password);
  if (!result.ok) return NextResponse.json({ error: result.error, message: result.message }, { status: 400 });

  // Their own cookie is now pointing at a session row that no longer exists.
  // Clearing it means the sign-in page they land on says "Sign in" rather than
  // appearing to still know them.
  await endSession();

  return NextResponse.json({ ok: true, message: 'Password changed. Sign in with it.' });
}
