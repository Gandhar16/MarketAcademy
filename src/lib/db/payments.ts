/**
 * Plan state and the Razorpay checkout/subscription audit trail.
 *
 * Two things live here, deliberately kept separate:
 *
 *  1. `users.plan` / `users.plan_expires_at` — what every gate check reads.
 *     One row, no join, fast on every lesson and every game page.
 *  2. `subscriptions` — one row per checkout ever started, updated by the
 *     webhook as Razorpay's own state machine moves it along. This is the
 *     audit trail and the thing the account page reads for "renews on" /
 *     "lapsed on" — it is never read on the hot path of a gate check.
 *
 * Access is computed at READ time from `plan_expires_at`, not maintained by a
 * background job that flips `plan` back to 'free' when a period lapses —
 * there is no cron in a serverless deployment to run that job reliably, and
 * a stale `plan='pro'` row that `hasProAccess()` already treats as expired
 * costs nothing. See lib/payments/access.ts.
 */
import { randomUUID } from 'node:crypto';
import type { Db } from './driver';

export type PlanId = 'monthly' | 'quarterly' | 'annual' | 'lifetime';
export type SubscriptionStatus = 'created' | 'active' | 'cancelled' | 'completed' | 'halted' | 'expired';

export interface SubscriptionRow {
  id: string;
  userId: string;
  planId: string;
  razorpayOrderId: string | null;
  razorpaySubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: number | null;
  createdAt: number;
  updatedAt: number;
}

interface SubscriptionDbRow {
  id: string;
  user_id: string;
  plan_id: string;
  razorpay_order_id: string | null;
  razorpay_subscription_id: string | null;
  status: string;
  current_period_end: number | null;
  created_at: number;
  updated_at: number;
}

function toSubscription(row: SubscriptionDbRow): SubscriptionRow {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    razorpayOrderId: row.razorpay_order_id,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    status: row.status as SubscriptionStatus,
    currentPeriodEnd: row.current_period_end == null ? null : Number(row.current_period_end),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export interface UserPlanState {
  plan: 'free' | 'pro';
  planExpiresAt: number | null;
}

export async function getUserPlan(db: Db, userId: string): Promise<UserPlanState | null> {
  const row = await db.get<{ plan: string; plan_expires_at: number | null }>(
    'SELECT plan, plan_expires_at FROM users WHERE id = ?',
    userId,
  );
  if (!row) return null;
  return {
    plan: row.plan === 'pro' ? 'pro' : 'free',
    planExpiresAt: row.plan_expires_at == null ? null : Number(row.plan_expires_at),
  };
}

/**
 * Started the moment a checkout begins — before Razorpay has confirmed
 * anything. Row exists so `verify` and the webhook have something to look up
 * by order/subscription id, and so an abandoned checkout leaves a trace
 * ('created', never advances) instead of vanishing.
 */
export async function createPendingCheckout(
  db: Db,
  opts: {
    userId: string;
    planId: PlanId;
    razorpayOrderId?: string;
    razorpaySubscriptionId?: string;
  },
  now = Date.now(),
): Promise<SubscriptionRow> {
  const id = randomUUID();
  await db.run(
    `INSERT INTO subscriptions (id, user_id, plan_id, razorpay_order_id, razorpay_subscription_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'created', ?, ?)`,
    id,
    opts.userId,
    opts.planId,
    opts.razorpayOrderId ?? null,
    opts.razorpaySubscriptionId ?? null,
    now,
    now,
  );
  return (await getSubscriptionById(db, id))!;
}

export async function getSubscriptionById(db: Db, id: string): Promise<SubscriptionRow | null> {
  const row = await db.get<SubscriptionDbRow>('SELECT * FROM subscriptions WHERE id = ?', id);
  return row ? toSubscription(row) : null;
}

export async function getSubscriptionByOrderId(db: Db, orderId: string): Promise<SubscriptionRow | null> {
  const row = await db.get<SubscriptionDbRow>('SELECT * FROM subscriptions WHERE razorpay_order_id = ?', orderId);
  return row ? toSubscription(row) : null;
}

export async function getSubscriptionByRazorpaySubscriptionId(
  db: Db,
  razorpaySubscriptionId: string,
): Promise<SubscriptionRow | null> {
  const row = await db.get<SubscriptionDbRow>(
    'SELECT * FROM subscriptions WHERE razorpay_subscription_id = ?',
    razorpaySubscriptionId,
  );
  return row ? toSubscription(row) : null;
}

/** For the account page: the most recently touched checkout/subscription, if any. */
export async function getLatestSubscriptionForUser(db: Db, userId: string): Promise<SubscriptionRow | null> {
  const row = await db.get<SubscriptionDbRow>(
    'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
    userId,
  );
  return row ? toSubscription(row) : null;
}

/**
 * Marks a checkout as paid and grants Pro. `periodEndMs` is null for a
 * lifetime purchase (no expiry, ever) and a real timestamp for a recurring
 * plan's current billing period.
 *
 * Both writes happen together: a subscription row marked 'active' with a
 * user row still on 'free' would show the learner as paid on the account
 * page's audit trail and locked out of the content they just bought.
 */
export async function activatePlan(
  db: Db,
  opts: { subscriptionId: string; userId: string; periodEndMs: number | null },
  now = Date.now(),
): Promise<void> {
  await db.tx(async (t) => {
    await t.run(
      `UPDATE subscriptions SET status = 'active', current_period_end = ?, updated_at = ? WHERE id = ?`,
      opts.periodEndMs,
      now,
      opts.subscriptionId,
    );
    await t.run('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?', 'pro', opts.periodEndMs, opts.userId);
  });
}

/**
 * A recurring plan renewed: Razorpay charged the next cycle. Extends both the
 * subscription row's period and the user's expiry together — this is the
 * only place `plan_expires_at` moves forward after the first activation.
 */
export async function extendSubscriptionPeriod(
  db: Db,
  opts: { razorpaySubscriptionId: string; periodEndMs: number },
  now = Date.now(),
): Promise<void> {
  const sub = await getSubscriptionByRazorpaySubscriptionId(db, opts.razorpaySubscriptionId);
  if (!sub) return; // Unknown subscription id — nothing here to extend; the webhook handler logs this case.

  await db.tx(async (t) => {
    await t.run(
      `UPDATE subscriptions SET status = 'active', current_period_end = ?, updated_at = ? WHERE id = ?`,
      opts.periodEndMs,
      now,
      sub.id,
    );
    await t.run('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?', 'pro', opts.periodEndMs, sub.userId);
  });
}

/**
 * A subscription stopped renewing — cancelled by the learner, or halted by
 * Razorpay after repeated payment failures. Deliberately does NOT touch
 * `users.plan_expires_at`: access lapses on its own once that timestamp
 * passes, which is already paid for and should not be revoked early.
 */
export async function markSubscriptionStatus(
  db: Db,
  opts: { razorpaySubscriptionId: string; status: SubscriptionStatus },
  now = Date.now(),
): Promise<void> {
  await db.run(
    `UPDATE subscriptions SET status = ?, updated_at = ? WHERE razorpay_subscription_id = ?`,
    opts.status,
    now,
    opts.razorpaySubscriptionId,
  );
}

// ---------------------------------------------------------------------------
// Webhook idempotency
// ---------------------------------------------------------------------------

/**
 * Razorpay retries a webhook delivery on anything but a 200 — the same event
 * arriving twice is the ordinary case, not a failure mode. Every handler
 * checks this before applying an event and records it after.
 */
export async function wasEventProcessed(db: Db, razorpayEventId: string): Promise<boolean> {
  const row = await db.get<{ x: number }>(
    'SELECT 1 AS x FROM payment_events WHERE razorpay_event_id = ?',
    razorpayEventId,
  );
  return row != null;
}

export async function markEventProcessed(
  db: Db,
  razorpayEventId: string,
  eventType: string,
  now = Date.now(),
): Promise<void> {
  await db.run(
    'INSERT INTO payment_events (razorpay_event_id, event_type, processed_at) VALUES (?, ?, ?)',
    razorpayEventId,
    eventType,
    now,
  );
}
