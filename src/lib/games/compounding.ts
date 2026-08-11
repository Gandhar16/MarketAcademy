/**
 * Compounding, inflation, and sequence-of-returns risk.
 *
 * Powers The Long Game. The lesson it has to deliver is that the AVERAGE return
 * is not what you get: the ORDER of returns matters enormously once you are
 * adding or withdrawing money, and inflation quietly halves whatever is left.
 *
 * Every projection here is a model over a real or stated return sequence, and
 * every surface that renders it must say so.
 */

export interface CompoundingInput {
  /** Lump sum at the start. */
  initial: number;
  /** Amount added at the end of each year. Negative to withdraw. */
  annualContribution: number;
  /** Annual returns as decimals, one per year. Order matters. */
  returns: number[];
  /** Annual inflation as a decimal, used for the real-terms series. */
  inflation: number;
  /** Annual fee/expense drag as a decimal, deducted from each year's return. */
  feeDrag?: number;
}

export interface CompoundingResult {
  /** Nominal balance at the end of each year, starting with year 0 = initial. */
  nominal: number[];
  /** The same series in today's money. */
  real: number[];
  finalNominal: number;
  finalReal: number;
  totalContributed: number;
  /** Money-weighted annualised return actually achieved, as a decimal. */
  moneyWeightedReturn: number;
  /** The simple average of the return sequence — usually flattering. */
  arithmeticMean: number;
  /** The compounded average, which is what a lump sum actually earns. */
  geometricMean: number;
  /** True if the balance ever hit zero — the sequence-risk failure mode. */
  ruined: boolean;
}

export function project(input: CompoundingInput): CompoundingResult {
  const fee = input.feeDrag ?? 0;
  const nominal: number[] = [input.initial];
  const real: number[] = [input.initial];

  let balance = input.initial;
  let contributed = input.initial;
  let ruined = false;

  input.returns.forEach((r, year) => {
    balance *= 1 + (r - fee);
    balance += input.annualContribution;
    if (input.annualContribution > 0) contributed += input.annualContribution;

    if (balance <= 0) {
      balance = 0;
      ruined = true;
    }

    nominal.push(balance);
    real.push(balance / Math.pow(1 + input.inflation, year + 1));
  });

  const arithmeticMean = input.returns.length
    ? input.returns.reduce((a, b) => a + b, 0) / input.returns.length
    : 0;

  const growth = input.returns.reduce((acc, r) => acc * (1 + (r - fee)), 1);
  const geometricMean = input.returns.length ? Math.pow(Math.max(growth, 0), 1 / input.returns.length) - 1 : 0;

  return {
    nominal,
    real,
    finalNominal: balance,
    finalReal: real[real.length - 1],
    totalContributed: contributed,
    moneyWeightedReturn: moneyWeightedReturn(input.initial, input.annualContribution, input.returns.length, balance),
    arithmeticMean,
    geometricMean,
    ruined,
  };
}

/**
 * The single annual rate that would have produced the same final balance from
 * the same contributions. Solved by bisection because there is no closed form
 * once contributions are involved.
 */
export function moneyWeightedReturn(
  initial: number,
  annualContribution: number,
  years: number,
  finalBalance: number,
): number {
  if (years <= 0) return 0;

  const balanceAt = (rate: number) => {
    let b = initial;
    for (let y = 0; y < years; y++) {
      b *= 1 + rate;
      b += annualContribution;
    }
    return b;
  };

  let low = -0.99;
  let high = 1.5;
  if (balanceAt(low) > finalBalance || balanceAt(high) < finalBalance) return NaN;

  for (let n = 0; n < 200; n++) {
    const mid = (low + high) / 2;
    if (balanceAt(mid) > finalBalance) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

/**
 * Sequence-of-returns risk, demonstrated by reversing the same returns.
 *
 * With a lump sum and no cashflows the order is irrelevant — multiplication
 * commutes. The moment you add or withdraw money each year, the order becomes
 * one of the largest factors in the outcome, and almost nobody plans for it.
 */
export function sequenceRiskComparison(input: CompoundingInput): {
  original: CompoundingResult;
  reversed: CompoundingResult;
  /** Difference in final real balance between the two orderings. */
  gap: number;
  /** True when order made no difference — which happens only without cashflows. */
  orderIrrelevant: boolean;
} {
  const original = project(input);
  const reversed = project({ ...input, returns: [...input.returns].reverse() });
  const gap = original.finalReal - reversed.finalReal;
  return {
    original,
    reversed,
    gap,
    orderIrrelevant: Math.abs(gap) < Math.max(1, Math.abs(original.finalReal) * 1e-9),
  };
}

/**
 * Real historical annual total returns for the NIFTY 50, in percent.
 *
 * SOURCE — NSE / published index annual returns, calendar years 2005–2024,
 * verified 2026-08-09. These are price-index annual changes rounded to one
 * decimal and are used to give learners a REAL return sequence rather than a
 * smooth 12% assumption. They are labelled in the UI as historical index
 * returns, not as a forecast.
 */
export const NIFTY_ANNUAL_RETURNS: { year: number; ret: number }[] = [
  { year: 2005, ret: 36.3 },
  { year: 2006, ret: 39.8 },
  { year: 2007, ret: 54.8 },
  { year: 2008, ret: -51.8 },
  { year: 2009, ret: 75.8 },
  { year: 2010, ret: 17.9 },
  { year: 2011, ret: -24.6 },
  { year: 2012, ret: 27.7 },
  { year: 2013, ret: 6.8 },
  { year: 2014, ret: 31.4 },
  { year: 2015, ret: -4.1 },
  { year: 2016, ret: 3.0 },
  { year: 2017, ret: 28.6 },
  { year: 2018, ret: 3.2 },
  { year: 2019, ret: 12.0 },
  { year: 2020, ret: 14.9 },
  { year: 2021, ret: 24.1 },
  { year: 2022, ret: 4.3 },
  { year: 2023, ret: 20.0 },
  { year: 2024, ret: 8.8 },
];

export const NIFTY_RETURN_SERIES = NIFTY_ANNUAL_RETURNS.map((r) => r.ret / 100);

/** Typical long-run Indian CPI inflation, used as the default real-terms deflator. */
export const DEFAULT_INFLATION = 0.06;
