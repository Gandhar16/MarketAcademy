/**
 * What "Pro" actually gates — pure functions, no DB import, so they are
 * trivial to unit test and safe to call from both server and client code
 * (the client never sees a secret through this file, only booleans).
 */
import type { Tier } from '@/lib/lesson/dsl';

/** T0 (Foundations) and T1 (Beginner) stay free forever — the trust-building hook. */
export const FREE_TIERS: readonly Tier[] = ['T0', 'T1'];

/** T2 (Intermediate) through T5 (Edge Cases) are the paid content. */
export function isTierGated(tier: Tier): boolean {
  return !FREE_TIERS.includes(tier);
}

/**
 * The four games with real engine complexity worth paying for. The other six
 * (order-gauntlet, cost-cutter, risk-roulette, bias-buster, candle-sprint,
 * the-long-game) stay free — see the pricing-tier discussion this was built
 * from for why this specific split.
 */
export const FLAGSHIP_GAMES: readonly string[] = ['chart-replay', 'payoff-builder', 'circuit-breaker', 'earnings-roulette'];

export function isGameGated(slug: string): boolean {
  return FLAGSHIP_GAMES.includes(slug);
}

export interface PlanState {
  plan: 'free' | 'pro';
  planExpiresAt: number | null;
}

/**
 * `planExpiresAt === null` while `plan === 'pro'` means a lifetime grant —
 * disambiguated by `plan` alone, never by the timestamp being absent. A
 * lapsed recurring plan is NOT actively downgraded back to 'free' anywhere
 * (see lib/db/payments.ts) — this function is what makes that safe: it
 * re-checks the expiry on every call rather than trusting a stale `plan`
 * column.
 */
export function hasProAccess(plan: PlanState | null | undefined, now = Date.now()): boolean {
  if (!plan || plan.plan !== 'pro') return false;
  return plan.planExpiresAt == null || plan.planExpiresAt > now;
}
