/**
 * POST /api/payments/cancel
 *
 * Cancels the caller's active recurring subscription AT THE END of the
 * current billing period — not immediately. The learner already paid for
 * the period they are in; ending access early would be taking money for
 * something not delivered. `users.plan_expires_at` already encodes exactly
 * when access should lapse, so this only needs to stop the NEXT charge from
 * happening, never touch the expiry that already governs access.
 *
 * A lifetime purchase has nothing to cancel — there is no recurring charge
 * to stop, which this reports as a 400 rather than silently doing nothing.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';
import { getLatestSubscriptionForUser, markSubscriptionStatus } from '@/lib/db/payments';
import { getRazorpayClient } from '@/lib/payments/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const db = await getDb();
  const sub = await getLatestSubscriptionForUser(db, user.id);

  if (!sub || !sub.razorpaySubscriptionId || sub.status !== 'active') {
    return NextResponse.json(
      { error: 'no_active_subscription', message: 'There is no active recurring plan to cancel.' },
      { status: 400 },
    );
  }

  try {
    await getRazorpayClient().subscriptions.cancel(sub.razorpaySubscriptionId, /* cancelAtCycleEnd */ true);
  } catch (err) {
    console.error('[payments] cancel failed', err);
    return NextResponse.json(
      { error: 'cancel_failed', message: 'Could not cancel with Razorpay. Please try again.' },
      { status: 502 },
    );
  }

  // Optimistic local update — the webhook's subscription.cancelled event will
  // confirm the same state again, harmlessly, once Razorpay processes it.
  await markSubscriptionStatus(db, { razorpaySubscriptionId: sub.razorpaySubscriptionId, status: 'cancelled' });

  return NextResponse.json({
    ok: true,
    message: 'Your plan will not renew. You keep Pro access until the current period ends.',
  });
}
