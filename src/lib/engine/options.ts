/**
 * Options pricing, greeks, and payoffs.
 *
 * Powers the T3 lesson, the Payoff Builder game, and Earnings Roulette.
 *
 * A note on what this is and is not. Black–Scholes is a MODEL. It assumes
 * lognormal returns, constant volatility, continuous hedging and no jumps —
 * none of which are true. It is in here because it is the shared language of
 * the options market and because the greeks it produces are the right mental
 * model for how an option behaves. Every surface that renders these numbers
 * must label them as modelled, per PLAN.md §7.1.
 *
 * Indian index options are EUROPEAN (exercisable only at expiry), which is what
 * Black–Scholes prices. US single-stock options are American and can be
 * exercised early; for calls on a non-dividend-paying stock early exercise is
 * never optimal so the European price holds, but for puts it is a real
 * difference and we say so rather than quietly pricing them wrong.
 */

export type OptionType = 'call' | 'put';

export interface OptionInputs {
  /** Spot price of the underlying. */
  spot: number;
  strike: number;
  /** Time to expiry in YEARS. 7 days = 7/365. */
  timeToExpiry: number;
  /** Annualised volatility as a decimal. 0.18 means 18%. */
  volatility: number;
  /** Annualised risk-free rate as a decimal. */
  rate: number;
  /** Continuous dividend yield as a decimal. Zero for index options in India. */
  dividendYield?: number;
  type: OptionType;
}

/** Standard normal cumulative distribution — Abramowitz & Stegun 26.2.17. */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p =
    d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

/** Standard normal probability density. */
export function normalPdf(x: number): number {
  return 0.3989422804014327 * Math.exp((-x * x) / 2);
}

function d1d2(i: OptionInputs): { d1: number; d2: number } {
  const q = i.dividendYield ?? 0;
  const sqrtT = Math.sqrt(i.timeToExpiry);
  const d1 =
    (Math.log(i.spot / i.strike) + (i.rate - q + (i.volatility * i.volatility) / 2) * i.timeToExpiry) /
    (i.volatility * sqrtT);
  return { d1, d2: d1 - i.volatility * sqrtT };
}

/**
 * Intrinsic value per unit — what the option is worth if expiry were now.
 * Also the correct answer at T=0, where Black–Scholes divides by zero.
 */
export function intrinsicValue(spot: number, strike: number, type: OptionType): number {
  return type === 'call' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
}

/**
 * Physical settlement of an ITM single-stock option left open at expiry —
 * "the modern account-killer" (PLAN.md §4). A long call/put that is
 * in-the-money at expiry and never closed is not cash-settled: the holder
 * must fund taking (or making) delivery of the underlying shares, at the
 * FULL strike value, not the premium they paid — plus a delivery charge.
 * Index options are cash-settled and never hit this path at all.
 *
 * SOURCES — verified 2026-08-09 (same figures src/components/widgets/settlement.tsx uses):
 *   Margin ladder and square-off policy:
 *     https://support.zerodha.com/category/trading-and-markets/trading-faqs/f-otrading/articles/policy-on-physical-settlement
 *   Physical delivery charge (0.25%, or 0.1% for netted positions):
 *     https://zerodha.com/charges/
 */
export const PHYSICAL_DELIVERY_PERCENT = 0.25;
/** Reduced rate where the position nets off against another leg. */
export const PHYSICAL_DELIVERY_NETTED_PERCENT = 0.1;

export interface PhysicalSettlement {
  inTheMoney: boolean;
  /** Per-share payoff at expiry, before any charge. */
  intrinsic: number;
  /** What the holder must fund to take delivery — strike x lot size, zero if OTM. */
  obligation: number;
  /** Broker's delivery charge on that obligation. */
  deliveryCharge: number;
  /** The position's mark-to-market value at expiry, before the obligation and charge. */
  grossGain: number;
  /** Obligation as a multiple of the premium originally paid — the "168x the premium" number. */
  obligationToPremiumRatio: number;
}

export function physicalSettlementFor(opts: {
  spot: number;
  strike: number;
  type: OptionType;
  lotSize: number;
  premiumPaid: number;
  netted?: boolean;
}): PhysicalSettlement {
  const intrinsic = intrinsicValue(opts.spot, opts.strike, opts.type);
  const inTheMoney = intrinsic > 0;
  const obligation = inTheMoney ? opts.strike * opts.lotSize : 0;
  const rate = opts.netted ? PHYSICAL_DELIVERY_NETTED_PERCENT : PHYSICAL_DELIVERY_PERCENT;
  const deliveryCharge = (obligation * rate) / 100;
  const grossGain = intrinsic * opts.lotSize;
  return {
    inTheMoney,
    intrinsic,
    obligation,
    deliveryCharge,
    grossGain,
    obligationToPremiumRatio: opts.premiumPaid > 0 ? obligation / opts.premiumPaid : 0,
  };
}

export function blackScholesPrice(i: OptionInputs): number {
  // At or past expiry, and at zero volatility, the option is worth exactly its
  // intrinsic value. Handling this explicitly avoids NaN at the two boundaries
  // learners hit first: expiry day, and a slider dragged to zero.
  if (i.timeToExpiry <= 0 || i.volatility <= 0) {
    return intrinsicValue(i.spot, i.strike, i.type);
  }

  const q = i.dividendYield ?? 0;
  const { d1, d2 } = d1d2(i);
  const dfR = Math.exp(-i.rate * i.timeToExpiry);
  const dfQ = Math.exp(-q * i.timeToExpiry);

  return i.type === 'call'
    ? i.spot * dfQ * normalCdf(d1) - i.strike * dfR * normalCdf(d2)
    : i.strike * dfR * normalCdf(-d2) - i.spot * dfQ * normalCdf(-d1);
}

export interface Greeks {
  /** ∂price/∂spot. Also roughly the probability of finishing in the money. */
  delta: number;
  /** ∂delta/∂spot. How fast delta changes — why short options get dangerous fast. */
  gamma: number;
  /** ∂price/∂time, PER DAY. Almost always negative for a long option. */
  theta: number;
  /** ∂price/∂volatility, per 1 percentage point of IV. This is IV crush. */
  vega: number;
  /** ∂price/∂rate, per 1 percentage point. Small and usually ignorable. */
  rho: number;
}

export function greeks(i: OptionInputs): Greeks {
  if (i.timeToExpiry <= 0 || i.volatility <= 0) {
    // At expiry the option is a step function: delta is 0 or 1, everything else
    // is zero. Reporting NaN here would break every widget on expiry day.
    const itm = intrinsicValue(i.spot, i.strike, i.type) > 0;
    const sign = i.type === 'call' ? 1 : -1;
    return { delta: itm ? sign : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const q = i.dividendYield ?? 0;
  const { d1, d2 } = d1d2(i);
  const sqrtT = Math.sqrt(i.timeToExpiry);
  const dfR = Math.exp(-i.rate * i.timeToExpiry);
  const dfQ = Math.exp(-q * i.timeToExpiry);
  const pdf = normalPdf(d1);

  const delta = i.type === 'call' ? dfQ * normalCdf(d1) : dfQ * (normalCdf(d1) - 1);
  const gamma = (dfQ * pdf) / (i.spot * i.volatility * sqrtT);

  const thetaAnnual =
    i.type === 'call'
      ? -(i.spot * dfQ * pdf * i.volatility) / (2 * sqrtT) -
        i.rate * i.strike * dfR * normalCdf(d2) +
        q * i.spot * dfQ * normalCdf(d1)
      : -(i.spot * dfQ * pdf * i.volatility) / (2 * sqrtT) +
        i.rate * i.strike * dfR * normalCdf(-d2) -
        q * i.spot * dfQ * normalCdf(-d1);

  return {
    delta,
    gamma,
    // Per day, because nobody thinks in years when they are watching an option
    // bleed. 365 rather than 252: options decay over calendar time, including
    // weekends, which is why Monday mornings are unkind to long premium.
    theta: thetaAnnual / 365,
    // Per percentage point of IV, not per unit — traders quote vega that way.
    vega: (i.spot * dfQ * pdf * sqrtT) / 100,
    rho:
      (i.type === 'call'
        ? i.strike * i.timeToExpiry * dfR * normalCdf(d2)
        : -i.strike * i.timeToExpiry * dfR * normalCdf(-d2)) / 100,
  };
}

/**
 * Implied volatility by bisection.
 *
 * Bisection rather than Newton–Raphson deliberately: it cannot diverge, it
 * cannot land on a negative vol, and for deep ITM/OTM options where vega
 * approaches zero Newton becomes numerically unstable exactly where learners
 * are most likely to be poking at it.
 */
export function impliedVolatility(
  marketPrice: number,
  i: Omit<OptionInputs, 'volatility'>,
  opts: { tolerance?: number; maxIterations?: number } = {},
): number | null {
  const tolerance = opts.tolerance ?? 1e-6;
  const maxIterations = opts.maxIterations ?? 128;

  const floor = intrinsicValue(i.spot, i.strike, i.type);
  // No volatility can produce a price below intrinsic value — such a quote is
  // an arbitrage or a bad print, and returning null is more honest than
  // returning a number.
  if (marketPrice < floor - tolerance) return null;
  if (i.timeToExpiry <= 0) return null;

  let low = 1e-6;
  let high = 5; // 500% annualised covers anything a real market prints

  if (blackScholesPrice({ ...i, volatility: high }) < marketPrice) return null;

  for (let n = 0; n < maxIterations; n++) {
    const mid = (low + high) / 2;
    const price = blackScholesPrice({ ...i, volatility: mid });
    if (Math.abs(price - marketPrice) < tolerance) return mid;
    if (price > marketPrice) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

// ── Payoffs ─────────────────────────────────────────────────────────────────

export interface Leg {
  type: OptionType | 'stock';
  /** Positive to buy, negative to sell. In lots/contracts, not units. */
  quantity: number;
  strike?: number;
  /** Price paid or received per unit. */
  premium: number;
}

/** Payoff of one leg at a given expiry price, per unit of the underlying. */
export function legPayoff(leg: Leg, spot: number): number {
  if (leg.type === 'stock') return (spot - leg.premium) * leg.quantity;
  const intrinsic = intrinsicValue(spot, leg.strike as number, leg.type);
  // Long pays the premium and receives intrinsic; short is the mirror image.
  return (intrinsic - leg.premium) * leg.quantity;
}

export function strategyPayoff(legs: Leg[], spot: number): number {
  return legs.reduce((sum, leg) => sum + legPayoff(leg, spot), 0);
}

export interface PayoffProfile {
  points: { spot: number; payoff: number }[];
  /** Spots where the strategy crosses zero. */
  breakevens: number[];
  /** Null where profit is genuinely unbounded. */
  maxProfit: number | null;
  /** Null where loss is genuinely unbounded. */
  maxLoss: number | null;
  /** True when profit grows without limit as the underlying rises. */
  unlimitedProfit: boolean;
  /** True when loss grows without limit as the underlying rises. */
  unlimitedLoss: boolean;
  /** Payoff slope above the highest strike — the only region that is unbounded. */
  slopeAbove: number;
  /** Payoff slope below the lowest strike. Bounded, because a price stops at zero. */
  slopeBelow: number;
}

/**
 * Payoff slope far above every strike, and far below every strike.
 *
 * Computed from the legs rather than sampled from the chart. Sampling cannot
 * distinguish "unbounded" from "my chart range was too narrow", which is how
 * payoff tools end up reporting a max profit that is just the edge of the plot.
 */
export function payoffSlopes(legs: Leg[]): { above: number; below: number } {
  let above = 0;
  let below = 0;
  for (const leg of legs) {
    if (leg.type === 'stock') {
      above += leg.quantity;
      below += leg.quantity;
    } else if (leg.type === 'call') {
      // A call is flat below its strike and slopes +1 per unit above it.
      above += leg.quantity;
    } else {
      // A put slopes -1 per unit below its strike and is flat above it.
      below -= leg.quantity;
    }
  }
  return { above, below };
}

export function payoffProfile(legs: Leg[], range: { from: number; to: number; steps?: number }): PayoffProfile {
  const steps = range.steps ?? 200;
  const width = (range.to - range.from) / steps;

  const points = Array.from({ length: steps + 1 }, (_, n) => {
    const spot = range.from + n * width;
    return { spot, payoff: strategyPayoff(legs, spot) };
  });

  const breakevens: number[] = [];
  for (let n = 1; n < points.length; n++) {
    const a = points[n - 1];
    const b = points[n];
    if (a.payoff === 0) breakevens.push(a.spot);
    else if (a.payoff * b.payoff < 0) {
      // Linear interpolation is exact here: option payoffs are piecewise linear.
      breakevens.push(a.spot + (b.spot - a.spot) * (Math.abs(a.payoff) / (Math.abs(a.payoff) + Math.abs(b.payoff))));
    }
  }

  const { above, below } = payoffSlopes(legs);

  // A piecewise-linear payoff takes its extremes at a kink or at a boundary, so
  // evaluating the strikes plus spot = 0 is exact — no sampling error, and no
  // dependence on how wide the caller happened to draw the chart.
  const strikes = legs.map((l) => l.strike).filter((s): s is number => s != null);
  const probes = [0, ...strikes, Math.max(range.to, ...strikes) * 2 || range.to];
  const candidates = probes.map((s) => strategyPayoff(legs, s));

  // Only the upside is genuinely unbounded: a price can rise forever, but it
  // stops at zero on the way down, so the downside always has a finite worst
  // case. Reporting a long put's profit as "unlimited" would be flattering and
  // wrong — it is capped at the strike.
  const unlimitedProfit = above > 1e-9;
  const unlimitedLoss = above < -1e-9;

  return {
    points,
    breakevens,
    maxProfit: unlimitedProfit ? null : Math.max(...candidates),
    maxLoss: unlimitedLoss ? null : Math.min(...candidates),
    unlimitedProfit,
    unlimitedLoss,
    slopeAbove: above,
    slopeBelow: below,
  };
}

/** Named structures the Payoff Builder asks learners to construct. */
export const STRATEGY_TEMPLATES: Record<string, { label: string; describe: string }> = {
  'long-call': { label: 'Long call', describe: 'Unlimited upside, loss capped at the premium.' },
  'long-put': { label: 'Long put', describe: 'Profits as the underlying falls, loss capped at the premium.' },
  'bull-call-spread': {
    label: 'Bull call spread',
    describe: 'Buy a call, sell a higher one. Cheaper than a long call, and the upside is capped.',
  },
  'bear-put-spread': { label: 'Bear put spread', describe: 'Buy a put, sell a lower one. Capped both ways.' },
  straddle: { label: 'Long straddle', describe: 'Call and put at the same strike. Profits on a big move either way.' },
  strangle: { label: 'Long strangle', describe: 'OTM call and OTM put. Cheaper than a straddle, needs a bigger move.' },
  'iron-condor': {
    label: 'Iron condor',
    describe: 'Sell a call spread and a put spread. Profits if nothing happens. Loss is capped but larger than the gain.',
  },
  'covered-call': { label: 'Covered call', describe: 'Long stock, short a call against it. Income, capped upside.' },
};

/** Days to years, the conversion everyone gets wrong once. */
export function daysToYears(days: number): number {
  return days / 365;
}
