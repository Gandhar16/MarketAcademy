/**
 * POST /api/payments/webhook
 *
 * Called by Razorpay's own infrastructure, not a browser — there is no
 * session cookie, no Origin header worth checking, and no CSRF risk in the
 * conventional sense (see verifySameOrigin's docstring: CSRF is about a
 * browser being tricked into a same-origin-looking request; this endpoint
 * is deliberately cross-origin by design). The `x-razorpay-signature`
 * header IS the authentication — it proves the request came from Razorpay
 * and the body was not altered in transit, which is a strictly stronger
 * guarantee than an Origin header could give here.
 *
 * This is the authoritative source of truth for plan state — see the
 * docstring on /api/payments/verify for why that endpoint alone is not
 * enough. Razorpay retries on anything but a 200, so every branch below is
 * idempotent via payment_events, and an unrecognised event type is
 * acknowledged (200) rather than rejected — new event types get added to
 * Razorpay's API over time, and failing loudly on one this code doesn't
 * handle yet would just cause endless retries for something that was never
 * going to be actionable.
 *
 * Deliberately not rate-limited: enforceRateLimit() keys on client IP, and
 * every Razorpay webhook delivery shares Razorpay's own outbound IPs across
 * every merchant on the platform — a burst of legitimate deliveries during a
 * sale could trip a limit meant for one abusive browser. The HMAC signature
 * check above is the actual defence for this route.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  extendSubscriptionPeriod,
  getSubscriptionByOrderId,
  activatePlan,
  markEventProcessed,
  markSubscriptionStatus,
  wasEventProcessed,
  type SubscriptionStatus,
} from '@/lib/db/payments';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RazorpayEventEntity<T> {
  entity: T;
}

interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment?: RazorpayEventEntity<{ id: string; order_id?: string | null }>;
    subscription?: RazorpayEventEntity<{ id: string; current_end?: number | null; status: string }>;
  };
}

const SUBSCRIPTION_PERIOD_EVENTS = new Set(['subscription.activated', 'subscription.charged']);
const SUBSCRIPTION_STATUS_EVENTS: Record<string, SubscriptionStatus> = {
  'subscription.cancelled': 'cancelled',
  'subscription.completed': 'completed',
  'subscription.halted': 'halted',
};

export async function POST(req: Request) {
  // MUST be the raw text — a re-serialised JSON.stringify of a parsed body
  // is not guaranteed to be byte-identical to what Razorpay actually signed.
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const eventId = req.headers.get('x-razorpay-event-id');

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }
  if (!eventId) {
    // Every real Razorpay delivery carries this header. Its absence means
    // something is replaying or forging a request that got the body
    // signature right some other way (e.g. a leaked webhook secret) — either
    // way there is no safe idempotency key to process it under.
    return NextResponse.json({ error: 'missing_event_id' }, { status: 400 });
  }

  const body = JSON.parse(rawBody) as RazorpayWebhookBody;
  const db = await getDb();

  if (await wasEventProcessed(db, eventId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    if (body.event === 'payment.captured') {
      const orderId = body.payload.payment?.entity.order_id;
      if (orderId) {
        const sub = await getSubscriptionByOrderId(db, orderId);
        // Only meaningful for a one-time (lifetime) order — a subscription's
        // auto-generated per-cycle order never matches a row here, since
        // subscriptions are looked up by subscription id, not order id.
        if (sub && sub.status !== 'active') {
          await activatePlan(db, { subscriptionId: sub.id, userId: sub.userId, periodEndMs: null });
        }
      }
    } else if (SUBSCRIPTION_PERIOD_EVENTS.has(body.event)) {
      const entity = body.payload.subscription?.entity;
      if (entity?.id && entity.current_end) {
        await extendSubscriptionPeriod(db, {
          razorpaySubscriptionId: entity.id,
          periodEndMs: entity.current_end * 1000,
        });
      }
    } else if (body.event in SUBSCRIPTION_STATUS_EVENTS) {
      const entity = body.payload.subscription?.entity;
      if (entity?.id) {
        await markSubscriptionStatus(db, {
          razorpaySubscriptionId: entity.id,
          status: SUBSCRIPTION_STATUS_EVENTS[body.event],
        });
      }
    }
    // Any other event type: acknowledged, no action taken.
  } catch (err) {
    console.error('[payments] webhook handler failed', body.event, err);
    // Not marked processed — Razorpay will retry, and the next attempt gets
    // a clean run rather than being silently swallowed.
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }

  await markEventProcessed(db, eventId, body.event);
  return NextResponse.json({ ok: true });
}
