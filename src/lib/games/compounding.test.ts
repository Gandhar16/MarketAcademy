import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INFLATION,
  NIFTY_ANNUAL_RETURNS,
  NIFTY_RETURN_SERIES,
  moneyWeightedReturn,
  project,
  sequenceRiskComparison,
} from './compounding';

const flat = (rate: number, years: number) => Array.from({ length: years }, () => rate);

describe('projection', () => {
  it('compounds a lump sum correctly', () => {
    const r = project({ initial: 100, annualContribution: 0, returns: flat(0.1, 3), inflation: 0 });
    expect(r.finalNominal).toBeCloseTo(133.1, 6);
    expect(r.nominal).toHaveLength(4); // year 0 plus three years
  });

  it('deflates to today’s money', () => {
    const r = project({ initial: 100, annualContribution: 0, returns: flat(0.06, 10), inflation: 0.06 });
    // Returning exactly inflation means you are flat in real terms.
    expect(r.finalReal).toBeCloseTo(100, 4);
  });

  it('shows a nominally-positive outcome that is a real-terms loss', () => {
    const r = project({ initial: 100, annualContribution: 0, returns: flat(0.04, 20), inflation: 0.06 });
    expect(r.finalNominal).toBeGreaterThan(100);
    expect(r.finalReal).toBeLessThan(100);
  });

  it('adds contributions after the year’s return, not before', () => {
    const r = project({ initial: 100, annualContribution: 10, returns: [0.1], inflation: 0 });
    expect(r.finalNominal).toBeCloseTo(120, 6); // 110 then +10
  });

  it('subtracts fee drag from every year', () => {
    const withFee = project({ initial: 100, annualContribution: 0, returns: flat(0.1, 20), inflation: 0, feeDrag: 0.01 });
    const without = project({ initial: 100, annualContribution: 0, returns: flat(0.1, 20), inflation: 0 });
    expect(withFee.finalNominal).toBeLessThan(without.finalNominal);
    // A 1% annual fee costs far more than 1% of the outcome over 20 years —
    // this is the number index-fund advocates are pointing at.
    expect(1 - withFee.finalNominal / without.finalNominal).toBeGreaterThan(0.15);
  });

  it('flags ruin when withdrawals exhaust the balance', () => {
    const r = project({ initial: 100, annualContribution: -30, returns: flat(-0.1, 10), inflation: 0 });
    expect(r.ruined).toBe(true);
    expect(r.finalNominal).toBe(0);
  });

  it('never reports a negative balance', () => {
    const r = project({ initial: 100, annualContribution: -50, returns: flat(-0.5, 10), inflation: 0 });
    expect(Math.min(...r.nominal)).toBeGreaterThanOrEqual(0);
  });

  it('reports arithmetic mean above geometric mean whenever returns vary', () => {
    const r = project({ initial: 100, annualContribution: 0, returns: [0.5, -0.3, 0.2, -0.1], inflation: 0 });
    expect(r.arithmeticMean).toBeGreaterThan(r.geometricMean);
  });

  it('makes the two means equal when every return is identical', () => {
    const r = project({ initial: 100, annualContribution: 0, returns: flat(0.08, 5), inflation: 0 });
    expect(r.arithmeticMean).toBeCloseTo(r.geometricMean, 10);
  });

  it('shows the +50%/-50% trap: average zero, outcome negative', () => {
    const r = project({ initial: 100, annualContribution: 0, returns: [0.5, -0.5], inflation: 0 });
    expect(r.arithmeticMean).toBeCloseTo(0, 10);
    expect(r.finalNominal).toBeCloseTo(75, 6);
    expect(r.geometricMean).toBeLessThan(0);
  });

  it('handles an empty return series', () => {
    const r = project({ initial: 100, annualContribution: 0, returns: [], inflation: 0.06 });
    expect(r.finalNominal).toBe(100);
    expect(r.arithmeticMean).toBe(0);
  });
});

describe('money-weighted return', () => {
  it('recovers a flat rate when there are no contributions', () => {
    expect(moneyWeightedReturn(100, 0, 10, 100 * Math.pow(1.09, 10))).toBeCloseTo(0.09, 5);
  });

  it('recovers a rate in the presence of contributions', () => {
    let b = 100;
    for (let y = 0; y < 15; y++) {
      b *= 1.07;
      b += 12;
    }
    expect(moneyWeightedReturn(100, 12, 15, b)).toBeCloseTo(0.07, 4);
  });

  it('returns NaN rather than a wrong number when no rate fits', () => {
    expect(Number.isNaN(moneyWeightedReturn(100, 0, 10, 1e12))).toBe(true);
  });
});

describe('sequence-of-returns risk', () => {
  const returns = [0.3, 0.1, -0.4, 0.2, 0.15, -0.25, 0.35, 0.05];

  it('is irrelevant for a lump sum — multiplication commutes', () => {
    const c = sequenceRiskComparison({ initial: 100, annualContribution: 0, returns, inflation: 0.06 });
    expect(c.orderIrrelevant).toBe(true);
    expect(c.original.finalNominal).toBeCloseTo(c.reversed.finalNominal, 8);
  });

  it('matters enormously once money is being added each year', () => {
    const c = sequenceRiskComparison({ initial: 100, annualContribution: 50, returns, inflation: 0.06 });
    expect(c.orderIrrelevant).toBe(false);
    expect(Math.abs(c.gap)).toBeGreaterThan(1);
  });

  it('matters when money is being withdrawn — the retirement failure mode', () => {
    const c = sequenceRiskComparison({ initial: 1000, annualContribution: -80, returns, inflation: 0.06 });
    expect(c.orderIrrelevant).toBe(false);
  });
});

describe('NIFTY historical series', () => {
  it('covers twenty calendar years with no gaps', () => {
    expect(NIFTY_ANNUAL_RETURNS).toHaveLength(20);
    for (let i = 1; i < NIFTY_ANNUAL_RETURNS.length; i++) {
      expect(NIFTY_ANNUAL_RETURNS[i].year).toBe(NIFTY_ANNUAL_RETURNS[i - 1].year + 1);
    }
  });

  it('includes the 2008 crash and the 2009 recovery', () => {
    expect(NIFTY_ANNUAL_RETURNS.find((r) => r.year === 2008)!.ret).toBeLessThan(-40);
    expect(NIFTY_ANNUAL_RETURNS.find((r) => r.year === 2009)!.ret).toBeGreaterThan(50);
  });

  it('compounds to a long-run return well below its arithmetic average', () => {
    const r = project({
      initial: 100,
      annualContribution: 0,
      returns: NIFTY_RETURN_SERIES,
      inflation: DEFAULT_INFLATION,
    });
    expect(r.arithmeticMean).toBeGreaterThan(r.geometricMean + 0.02);
    expect(r.finalNominal).toBeGreaterThan(100);
  });

  it('leaves a real-terms outcome far below the nominal one', () => {
    const r = project({
      initial: 100,
      annualContribution: 0,
      returns: NIFTY_RETURN_SERIES,
      inflation: DEFAULT_INFLATION,
    });
    expect(r.finalReal).toBeLessThan(r.finalNominal / 2);
  });
});
