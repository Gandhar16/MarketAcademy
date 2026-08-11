/**
 * Engine-computed values for worked examples.
 *
 * An `example` step can carry a `compute` spec instead of a literal value. The
 * value is then produced by the same engines the simulator uses, at render
 * time. That means a worked example CANNOT go stale: when a Budget changes STT,
 * the arithmetic in the lesson changes with it, and the claim tests catch any
 * surrounding prose that no longer matches.
 *
 * This is the difference between a course that was correct once and a course
 * that is correct.
 */
import { computeCost, roundTripCost } from '../engine/costs';
import type { Market, Product, Venue } from '../engine/costs/types';
import { blackScholesPrice, daysToYears, greeks, intrinsicValue, type OptionType } from '../engine/options';
import { buildBook, walkBook, type BookShape } from '../analysis/orderbook';
import { sizeFromStop } from '../engine/portfolio';
import { project } from '../games/compounding';

export type ComputeSpec = Record<string, unknown>;

const inr = (n: number, dp = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const pct = (n: number, dp = 3) => `${n.toFixed(dp)}%`;

/**
 * Evaluate a compute spec to a display string.
 *
 * Returns a clearly-marked error string rather than throwing: a broken example
 * spec is our bug, and it should be visible in review without taking down the
 * whole lesson for a learner.
 */
export function evaluateExample(spec: ComputeSpec): string {
  try {
    return evaluate(spec);
  } catch (err) {
    return `[example error: ${err instanceof Error ? err.message : 'unknown'}]`;
  }
}

function evaluate(spec: ComputeSpec): string {
  const fn = String(spec.fn ?? '');

  switch (fn) {
    // ── costs ────────────────────────────────────────────────────────────────
    case 'legCost': {
      const b = costArgs(spec);
      const r = computeCost({ ...b, side: (spec.side as 'buy' | 'sell') ?? 'buy' });
      return inr(r.total);
    }
    case 'legCostLine': {
      const b = costArgs(spec);
      const r = computeCost({ ...b, side: (spec.side as 'buy' | 'sell') ?? 'buy' });
      const line = r.lines.find((l) => l.key === String(spec.line));
      if (!line) return inr(0);
      return inr(line.amount);
    }
    case 'roundTripTotal':
      return inr(roundTripCost({ ...costArgs(spec), side: 'buy' }, num(spec.price)).total);
    case 'roundTripPercent': {
      const r = roundTripCost({ ...costArgs(spec), side: 'buy' }, num(spec.price));
      return pct((r.total / (num(spec.price) * num(spec.quantity))) * 100);
    }
    case 'breakevenPercent':
      return pct(roundTripCost({ ...costArgs(spec), side: 'buy' }, num(spec.price)).breakevenPercent);
    case 'breakevenMove':
      return inr(roundTripCost({ ...costArgs(spec), side: 'buy' }, num(spec.price)).breakevenMove, 3);
    case 'turnover':
      return inr(num(spec.price) * num(spec.quantity), 0);

    // ── options ──────────────────────────────────────────────────────────────
    case 'optionPrice':
      return inr(blackScholesPrice(optionArgs(spec)));
    case 'optionIntrinsic':
      return inr(intrinsicValue(num(spec.spot), num(spec.strike), spec.type as OptionType));
    case 'optionTimeValue': {
      const i = optionArgs(spec);
      return inr(Math.max(0, blackScholesPrice(i) - intrinsicValue(i.spot, i.strike, i.type)));
    }
    case 'optionGreek': {
      const g = greeks(optionArgs(spec));
      const which = String(spec.greek) as keyof typeof g;
      const v = g[which];
      if (v == null) throw new Error(`unknown greek "${String(spec.greek)}"`);
      return which === 'gamma' ? v.toFixed(5) : v.toFixed(3);
    }

    // ── order book ───────────────────────────────────────────────────────────
    case 'bookWalkAverage': {
      const w = walkBook(buildBook(bookShape(spec)), (spec.side as 'buy' | 'sell') ?? 'buy', num(spec.quantity));
      return w.averagePrice.toFixed(3);
    }
    case 'bookWalkSlippage': {
      const w = walkBook(buildBook(bookShape(spec)), (spec.side as 'buy' | 'sell') ?? 'buy', num(spec.quantity));
      return `${w.slippage.toFixed(3)} (${w.slippagePercent.toFixed(3)}%)`;
    }
    case 'bookWalkCost': {
      const w = walkBook(buildBook(bookShape(spec)), (spec.side as 'buy' | 'sell') ?? 'buy', num(spec.quantity));
      return inr(w.slippage * w.filledQuantity, 0);
    }
    case 'bookWalkLevels': {
      const w = walkBook(buildBook(bookShape(spec)), (spec.side as 'buy' | 'sell') ?? 'buy', num(spec.quantity));
      return `${w.levelsConsumed} level${w.levelsConsumed === 1 ? '' : 's'}`;
    }

    // ── sizing and compounding ───────────────────────────────────────────────
    case 'sizeFromStop': {
      const r = sizeFromStop({
        equity: num(spec.equity),
        riskFraction: num(spec.riskPercent) / 100,
        entry: num(spec.entry),
        stop: num(spec.stop),
        lotSize: spec.lotSize == null ? undefined : num(spec.lotSize),
      });
      return `${r.quantity.toLocaleString('en-IN')} units`;
    }
    case 'riskAmount':
      return inr((num(spec.equity) * num(spec.riskPercent)) / 100, 0);
    case 'compoundFinal': {
      const r = project({
        initial: num(spec.initial),
        annualContribution: num(spec.contribution ?? 0),
        returns: Array.from({ length: num(spec.years) }, () => num(spec.ratePercent) / 100),
        inflation: num(spec.inflationPercent ?? 0) / 100,
        feeDrag: num(spec.feePercent ?? 0) / 100,
      });
      return inr(spec.real ? r.finalReal : r.finalNominal, 0);
    }

    // ── plain arithmetic, still worth centralising ──────────────────────────
    case 'literal':
      return String(spec.value ?? '');
    case 'multiply':
      return inr(num(spec.a) * num(spec.b), num(spec.dp ?? 2));
    case 'percentOf':
      return inr((num(spec.value) * num(spec.percent)) / 100, num(spec.dp ?? 2));
    /** (high − low) ÷ reference, as a percentage. The candle range calculation. */
    case 'spanPercent': {
      const ref = num(spec.reference);
      if (ref === 0) throw new Error('spanPercent needs a non-zero reference');
      return pct(((num(spec.high) - num(spec.low)) / ref) * 100, num(spec.dp ?? 2));
    }

    default:
      throw new Error(`unknown fn "${fn}"`);
  }
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`expected a number, got ${JSON.stringify(v)}`);
  return n;
}

function costArgs(spec: ComputeSpec) {
  return {
    market: (spec.market as Market) ?? 'IN',
    venue: (spec.venue as Venue) ?? 'NSE',
    product: (spec.product as Product) ?? 'delivery',
    price: num(spec.price),
    quantity: num(spec.quantity),
  };
}

function optionArgs(spec: ComputeSpec) {
  return {
    spot: num(spec.spot),
    strike: num(spec.strike),
    timeToExpiry: daysToYears(num(spec.days)),
    volatility: num(spec.ivPercent) / 100,
    rate: num(spec.ratePercent ?? 6.5) / 100,
    type: (spec.type as OptionType) ?? 'call',
  };
}

function bookShape(spec: ComputeSpec): BookShape {
  return {
    mid: num(spec.mid ?? 1400),
    tickSize: num(spec.tickSize ?? 0.05),
    spreadTicks: num(spec.spreadTicks ?? 1),
    topQuantity: num(spec.topQuantity ?? 450),
    depthGrowth: num(spec.depthGrowth ?? 1.35),
    levels: num(spec.levels ?? 10),
  };
}
