import { describe, expect, it } from 'vitest';
import {
  accrualGap,
  cashConversion,
  currentRatio,
  debtToEquity,
  interestCoverage,
  returnOnAssets,
  returnOnCapitalEmployed,
  returnOnEquity,
  type Financials,
} from './fundamentals';

/** A plain, unlevered business. Every ratio has an easy hand-checkable answer. */
const PLAIN: Financials = {
  netProfit: 100,
  operatingCashFlow: 100,
  operatingProfit: 140,
  interestCost: 0,
  equity: 1_000,
  debt: 0,
  totalAssets: 1_250,
  currentAssets: 400,
  currentLiabilities: 200,
};

describe('fundamentals', () => {
  it('computes the ordinary ratios', () => {
    expect(returnOnEquity(PLAIN)).toBeCloseTo(10, 6);
    expect(returnOnCapitalEmployed(PLAIN)).toBeCloseTo(14, 6);
    expect(returnOnAssets(PLAIN)).toBeCloseTo(8, 6);
    expect(debtToEquity(PLAIN)).toBe(0);
    expect(currentRatio(PLAIN)).toBe(2);
  });

  it('shows leverage flattering return on equity without touching return on capital', () => {
    // The claim an explainer makes on screen: swap equity for debt and ROE
    // rises while ROCE does not. Asserted here so the scene cannot start
    // teaching something the arithmetic does not do.
    const levered: Financials = {
      ...PLAIN,
      equity: 400,
      debt: 600,
      interestCost: 48,
      netProfit: PLAIN.operatingProfit - 48,
    };

    expect(returnOnEquity(levered)).toBeGreaterThan(returnOnEquity(PLAIN));
    // Capital employed is unchanged (400 + 600 = 1,000), and so is operating
    // profit — so this ratio must be identical, not merely similar.
    expect(returnOnCapitalEmployed(levered)).toBeCloseTo(returnOnCapitalEmployed(PLAIN), 6);
  });

  it('measures interest cover the way a lender would', () => {
    expect(interestCoverage({ ...PLAIN, interestCost: 14 })).toBeCloseTo(10, 6);
    expect(interestCoverage({ ...PLAIN, interestCost: 140 })).toBeCloseTo(1, 6);
  });

  it('spots profit that never became cash', () => {
    expect(accrualGap(PLAIN)).toBe(0);
    expect(cashConversion(PLAIN)).toBe(1);

    // Half the profit still sitting in receivables.
    const paperish: Financials = { ...PLAIN, operatingCashFlow: 50 };
    expect(accrualGap(paperish)).toBeCloseTo(50, 6);
    expect(cashConversion(paperish)).toBeCloseTo(0.5, 6);
  });

  it('returns NaN rather than Infinity when a denominator is zero', () => {
    // A screener that prints "Infinity%" has told the reader nothing. NaN is at
    // least honestly unusable, and callers can test for it.
    expect(Number.isNaN(interestCoverage({ ...PLAIN, interestCost: 0 }))).toBe(true);
    expect(Number.isNaN(returnOnEquity({ ...PLAIN, equity: 0 }))).toBe(true);
  });
});
