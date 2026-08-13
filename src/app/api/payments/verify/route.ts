/**
 * POST /api/payments/verify
 * { planId, razorpay_payment_id, razorpay_signature, razorpay_order_id? | razorpay_subscription_id? }
 *
 * Called from the browser the instant Razorpay Checkout's popup succeeds.
 * This exists purely for a fast "you're Pro now" — it is NOT the
 * authoritative grant. The webhook (/api/payments/webhook) is what Razorpay
 * itself calls server-to-server and is what actually governs state on
 * anything that can change later: a renewal, a failed recurring charge, a
 * refund. Trusting only this endpoint would mean trusting the browser about
 * whether a subscription is still active next month, which it cannot know.
 *
 * Still worth doing well: the signature check here is exactly as strict as
 * the webhook's, just against a different secret-derived value, and a
 * subscription/order row that does not belong to the calling user is
 * rejected even with a valid signature — a valid signature only proves the
 * payment happened, not that this browser is allowed to claim it.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';
import { activatePlan, getSubscriptionByOrderId, getSubscriptionByRazorpaySubscriptionId } from '@/lib/db/payments';
import { isPlanId } from '@/lib/payments/plans';
import { getRazorpayClient, verifyOrderPaymentSignature, verifySubscriptionPaymentSignature } from '@/lib/payments/razorpay';

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
  if (!body || !isPlanId(body.planId) || typeof body.razorpay_payment_id !== 'string' || typeof body.razorpay_signature !== 'string') {
    return NextResponse.json({ error: 'bad_request', message: 'Missing or malformed verification payload.' }, { status: 400 });
  }

  const db = await getDb();

  if (typeof body.razorpay_order_id === 'string') {
    const valid = verifyOrderPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ error: 'invalid_signature', message: 'Payment could not be verified.' }, { status: 400 });
    }

    const sub = await getSubscriptionByOrderId(db, body.razorpay_order_id);
    if (!sub || sub.userId !== user.id) {
      return NextResponse.json({ error: 'not_found', message: 'No matching checkout for this order.' }, { status: 404 });
    }

    await activatePlan(db, { subscriptionId: sub.id, userId: user.id, periodEndMs: null });
    return NextResponse.json({ ok: true, plan: 'lifetime' });
  }

  if (typeof body.razorpay_subscription_id === 'string') {
    const valid = verifySubscriptionPaymentSignature({
      subscriptionId: body.razorpay_subscription_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ error: 'invalid_signature', message: 'Payment could not be verified.' }, { status: 400 });
    }

    const sub = await getSubscriptionByRazorpaySubscriptionId(db, body.razorpay_subscription_id);
    if (!sub || sub.userId !== user.id) {
      return NextResponse.json({ error: 'not_found', message: 'No matching checkout for this subscription.' }, { status: 404 });
    }

    // The billing period end comes from Razorpay's own record of the
    // subscription, not from anything computed locally — `current_end` is
    // set once Razorpay has actually processed the authorising payment.
    let periodEndMs: number | null = null;
    try {
      const razorpay = getRazorpayClient();
      const remote = await razorpay.subscriptions.fetch(body.razorpay_subscription_id);
      if (remote.current_end) periodEndMs = remote.current_end * 1000;
    } catch (err) {
      console.error('[payments] could not fetch subscription after verify', err);
    }
    // No current_end yet (e.g. Razorpay hasn't finished processing) — grant a
    // short provisional window rather than none at all; the webhook corrects
    // this to the real period the moment `subscription.activated` arrives.
    if (periodEndMs == null) periodEndMs = Date.now() + 24 * 60 * 60 * 1000;

    await activatePlan(db, { subscriptionId: sub.id, userId: user.id, periodEndMs });
    return NextResponse.json({ ok: true, plan: sub.planId });
  }

  return NextResponse.json(
    { error: 'bad_request', message: 'Pass either razorpay_order_id or razorpay_subscription_id.' },
    { status: 400 },
  );
}
