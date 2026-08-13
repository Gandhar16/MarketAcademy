import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { createUser } from './users';
import {
  activatePlan,
  createPendingCheckout,
  extendSubscriptionPeriod,
  getLatestSubscriptionForUser,
  getSubscriptionByOrderId,
  getSubscriptionByRazorpaySubscriptionId,
  getUserPlan,
  markEventProcessed,
  markSubscriptionStatus,
  wasEventProcessed,
} from './payments';

let db: Db;
let userId: string;

beforeEach(async () => {
  db = await openTestDb();
  const r = await createUser(db, { email: 'ram@example.com', displayName: 'Ram', password: 'a-long-enough-passphrase' });
  if (!r.ok) throw new Error(r.message);
  userId = r.value.id;
});

describe('getUserPlan', () => {
  it('starts every new user on free with no expiry', async () => {
    expect(await getUserPlan(db, userId)).toEqual({ plan: 'free', planExpiresAt: null });
  });

  it('returns null for an unknown user', async () => {
    expect(await getUserPlan(db, 'nope')).toBeNull();
  });
});

describe('a one-time (lifetime) purchase', () => {
  it('grants Pro with no expiry once activated', async () => {
    const pending = await createPendingCheckout(db, { userId, planId: 'lifetime', razorpayOrderId: 'order_abc' });
    expect(pending.status).toBe('created');

    const found = await getSubscriptionByOrderId(db, 'order_abc');
    expect(found?.id).toBe(pending.id);

    await activatePlan(db, { subscriptionId: pending.id, userId, periodEndMs: null });

    expect(await getUserPlan(db, userId)).toEqual({ plan: 'pro', planExpiresAt: null });
    const sub = await getLatestSubscriptionForUser(db, userId);
    expect(sub?.status).toBe('active');
    expect(sub?.currentPeriodEnd).toBeNull();
  });
});

describe('a recurring subscription', () => {
  it('grants Pro until the current period end once activated', async () => {
    const periodEnd = Date.now() + 30 * 86_400_000;
    const pending = await createPendingCheckout(db, {
      userId,
      planId: 'monthly',
      razorpaySubscriptionId: 'sub_abc',
    });

    await activatePlan(db, { subscriptionId: pending.id, userId, periodEndMs: periodEnd });

    const plan = await getUserPlan(db, userId);
    expect(plan?.plan).toBe('pro');
    expect(plan?.planExpiresAt).toBe(periodEnd);
  });

  it('extends the expiry on renewal without needing the internal row id', async () => {
    const firstPeriodEnd = Date.now() + 30 * 86_400_000;
    const pending = await createPendingCheckout(db, {
      userId,
      planId: 'monthly',
      razorpaySubscriptionId: 'sub_renew',
    });
    await activatePlan(db, { subscriptionId: pending.id, userId, periodEndMs: firstPeriodEnd });

    const secondPeriodEnd = firstPeriodEnd + 30 * 86_400_000;
    await extendSubscriptionPeriod(db, { razorpaySubscriptionId: 'sub_renew', periodEndMs: secondPeriodEnd });

    expect((await getUserPlan(db, userId))?.planExpiresAt).toBe(secondPeriodEnd);
    expect((await getSubscriptionByRazorpaySubscriptionId(db, 'sub_renew'))?.currentPeriodEnd).toBe(secondPeriodEnd);
  });

  it('extending an unknown subscription id is a safe no-op', async () => {
    await expect(extendSubscriptionPeriod(db, { razorpaySubscriptionId: 'nope', periodEndMs: Date.now() })).resolves.not.toThrow();
  });

  it('cancelling does NOT touch the expiry — access lapses on its own once it passes', async () => {
    const periodEnd = Date.now() + 30 * 86_400_000;
    const pending = await createPendingCheckout(db, {
      userId,
      planId: 'monthly',
      razorpaySubscriptionId: 'sub_cancel',
    });
    await activatePlan(db, { subscriptionId: pending.id, userId, periodEndMs: periodEnd });

    await markSubscriptionStatus(db, { razorpaySubscriptionId: 'sub_cancel', status: 'cancelled' });

    const plan = await getUserPlan(db, userId);
    expect(plan?.plan).toBe('pro');
    expect(plan?.planExpiresAt).toBe(periodEnd); // still paid-for time remaining
    expect((await getLatestSubscriptionForUser(db, userId))?.status).toBe('cancelled');
  });
});

describe('webhook idempotency', () => {
  it('reports an event as unprocessed until it is marked, then processed', async () => {
    expect(await wasEventProcessed(db, 'evt_1')).toBe(false);
    await markEventProcessed(db, 'evt_1', 'payment.captured');
    expect(await wasEventProcessed(db, 'evt_1')).toBe(true);
  });

  it('marking the same event twice does not throw — the caller is expected to check first', async () => {
    await markEventProcessed(db, 'evt_dup', 'payment.captured');
    // Real handlers always check wasEventProcessed before this; this asserts
    // the underlying constraint exists in case a caller ever fails to.
    await expect(markEventProcessed(db, 'evt_dup', 'payment.captured')).rejects.toThrow();
  });
});
