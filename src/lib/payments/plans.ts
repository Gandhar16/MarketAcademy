/**
 * The plan catalogue — INR only, Razorpay only, for now.
 *
 * US-market monetization was explicitly deferred to a later Stripe
 * integration when this was scoped; see the pricing discussion this was
 * built from. Nothing here assumes a second currency exists yet.
 *
 * Prices were chosen to sit well under Coursera Plus ($399/yr) and roughly
 * in MasterClass territory ($120-240/yr) despite being a much more
 * specialised product, and to stay nowhere near RBI's ₹15,000 recurring
 * e-mandate cap. `totalCount` gives Razorpay's Subscriptions API the
 * "number of billing cycles" it requires — Razorpay has no concept of an
 * unbounded subscription, so this is a long-but-finite horizon (~10 years)
 * that is, for any practical purpose, "until cancelled".
 */
export type PlanId = 'monthly' | 'quarterly' | 'annual' | 'lifetime';

interface RecurringPlan {
  id: Exclude<PlanId, 'lifetime'>;
  kind: 'subscription';
  label: string;
  amountPaise: number;
  /** Razorpay subscription cadence. */
  period: 'monthly' | 'yearly';
  interval: number;
  totalCount: number;
  billingNote: string;
  /** Name of the env var holding this plan's Razorpay Plan ID (created in the Razorpay dashboard). */
  razorpayPlanEnvVar: string;
}

interface OneTimePlan {
  id: 'lifetime';
  kind: 'one_time';
  label: string;
  amountPaise: number;
  billingNote: string;
}

export type PlanDefinition = RecurringPlan | OneTimePlan;

export const PLANS: Record<PlanId, PlanDefinition> = {
  monthly: {
    id: 'monthly',
    kind: 'subscription',
    label: 'Monthly',
    amountPaise: 19_900,
    period: 'monthly',
    interval: 1,
    totalCount: 120, // 10 years of monthly cycles
    billingNote: '₹199 every month',
    razorpayPlanEnvVar: 'RAZORPAY_PLAN_MONTHLY',
  },
  quarterly: {
    id: 'quarterly',
    kind: 'subscription',
    label: 'Quarterly',
    amountPaise: 49_900,
    period: 'monthly',
    interval: 3,
    totalCount: 40, // 10 years of 3-month cycles
    billingNote: '₹499 every 3 months',
    razorpayPlanEnvVar: 'RAZORPAY_PLAN_QUARTERLY',
  },
  annual: {
    id: 'annual',
    kind: 'subscription',
    label: 'Annual',
    amountPaise: 149_900,
    period: 'yearly',
    interval: 1,
    totalCount: 10, // 10 years of yearly cycles
    billingNote: '₹1,499 every year',
    razorpayPlanEnvVar: 'RAZORPAY_PLAN_ANNUAL',
  },
  lifetime: {
    id: 'lifetime',
    kind: 'one_time',
    label: 'Lifetime',
    amountPaise: 499_900,
    billingNote: '₹4,999 once, forever',
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PLANS;
}

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}
