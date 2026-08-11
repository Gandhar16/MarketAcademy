import type { CostBreakdown, CostInput } from './types';
import { computeIndiaCost, IN_BROKER_PLANS } from './india';
import { computeUSCost, US_BROKER_PLANS } from './us';

export * from './types';
export * from './india';
export * from './us';

/** Single entry point. Every fill in the app goes through this function. */
export function computeCost(input: CostInput): CostBreakdown {
  return input.market === 'IN' ? computeIndiaCost(input) : computeUSCost(input);
}

export const ALL_BROKER_PLANS = [...IN_BROKER_PLANS, ...US_BROKER_PLANS];

/**
 * Round-trip cost of an idea: buy now, sell later at `exitPrice`.
 *
 * This is the number the learner actually needs and never gets shown. It
 * answers "how far does this have to move before I am even?" — and for a small
 * intraday trade in India the answer is frequently a shock.
 */
export function roundTripCost(
  entry: CostInput,
  exitPrice: number,
): {
  entry: CostBreakdown;
  exit: CostBreakdown;
  total: number;
  /** Absolute price move per unit required to break even. */
  breakevenMove: number;
  /** The same move as a percentage of the entry price. */
  breakevenPercent: number;
  currency: 'INR' | 'USD';
} {
  const entryCost = computeCost({ ...entry, side: 'buy' });
  const exitCost = computeCost({ ...entry, side: 'sell', price: exitPrice });
  const total = entryCost.total + exitCost.total;
  const units = entry.quantity * (entry.multiplier ?? (entry.market === 'US' && entry.product === 'options' ? 100 : 1));
  const breakevenMove = units > 0 ? total / units : 0;
  return {
    entry: entryCost,
    exit: exitCost,
    total,
    breakevenMove,
    breakevenPercent: entry.price > 0 ? (breakevenMove / entry.price) * 100 : 0,
    currency: entryCost.currency,
  };
}
