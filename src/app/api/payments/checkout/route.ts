/**
 * POST /api/payments/checkout
 * { planId: 'monthly' | 'quarterly' | 'annual' | 'lifetime' }
 *
 * Starts a checkout: creates a Razorpay Order (lifetime) or Subscription
 * (recurring) and records a 'created' row so /api/payments/verify and the
 * webhook have something to look up by id. Returns exactly what the
 * Razorpay Checkout widget needs to open — never a secret.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';
import { createPendingCheckout } from '@/lib/db/payments';
import { getPlan, isPlanId } from '@/lib/payments/plans';
import { getRazorpayClient, razorpayKeyId } from '@/lib/payments/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  if (!body || !isPlanId(body.planId)) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Pass { planId: "monthly" | "quarterly" | "annual" | "lifetime" }.' },
      { status: 400 },
    );
  }

  const plan = getPlan(body.planId);
  const db = await getDb();

  try {
    // Constructed inside the try: a missing RAZORPAY_KEY_ID/SECRET throws
    // synchronously, and this route reports that as a controlled 503 rather
    // than an unhandled exception turning into a generic framework error page.
    const razorpay = getRazorpayClient();

    if (plan.kind === 'one_time') {
      const order = await razorpay.orders.create({
        amount: plan.amountPaise,
        currency: 'INR',
        // Razorpay caps receipt at 40 chars; a user id plus a short suffix fits.
        receipt: `${user.id.slice(0, 24)}-${Date.now().toString(36)}`,
        notes: { userId: user.id, planId: plan.id },
      });
      await createPendingCheckout(db, { userId: user.id, planId: plan.id, razorpayOrderId: order.id });
      return NextResponse.json({
        keyId: razorpayKeyId(),
        kind: 'one_time',
        orderId: order.id,
        amount: plan.amountPaise,
        currency: 'INR',
      });
    }

    const razorpayPlanId = process.env[plan.razorpayPlanEnvVar];
    if (!razorpayPlanId) {
      // Not a learner-facing bug — this means the site operator hasn't created
      // the matching Plan in the Razorpay dashboard yet. Fail loudly rather
      // than silently charging the wrong amount.
      console.error(`[payments] ${plan.razorpayPlanEnvVar} is not set — cannot start a "${plan.id}" checkout.`);
      return NextResponse.json(
        { error: 'not_configured', message: 'This plan is not available yet. Try again shortly.' },
        { status: 503 },
      );
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: plan.totalCount,
      customer_notify: 1,
      notes: { userId: user.id, planId: plan.id },
    });

    await createPendingCheckout(db, { userId: user.id, planId: plan.id, razorpaySubscriptionId: subscription.id });
    return NextResponse.json({
      keyId: razorpayKeyId(),
      kind: 'subscription',
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error('[payments] checkout creation failed', err);
    if (err instanceof Error && err.message.includes('is not set')) {
      return NextResponse.json(
        { error: 'not_configured', message: 'Payments are not set up yet. Try again shortly.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'checkout_failed', message: 'Could not start checkout. Please try again.' },
      { status: 502 },
    );
  }
}
