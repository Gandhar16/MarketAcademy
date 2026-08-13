/**
 * Worked-example evaluation.
 *
 * These tests matter more than most: a wrong number inside a step-by-step
 * walkthrough is worse than no walkthrough at all, because the learner has
 * watched it being derived and will trust it.
 */
import { describe, expect, it } from 'vitest';
import { evaluateExample } from './examples';
import { LESSONS } from '@/content/registry';

const parse = (s: string) => Number(s.replace(/[₹,%\s]/g, '').split(' ')[0]);

describe('cost computations', () => {
  const base = { product: 'delivery', price: 1400, quantity: 71 };

  it('computes turnover', () => {
    expect(evaluateExample({ fn: 'turnover', price: 1400, quantity: 71 })).toBe('₹99,400');
  });

  it('pulls a single charge line out of a leg', () => {
    // 0.1% of ₹99,400 = ₹99.40
    expect(evaluateExample({ ...base, fn: 'legCostLine', line: 'stt', side: 'buy' })).toBe('₹99.40');
  });

  it('returns zero for a line that does not apply to that side', () => {
    // Stamp duty is buy-side only.
    expect(evaluateExample({ ...base, fn: 'legCostLine', line: 'stamp', side: 'sell' })).toBe('₹0.00');
  });

  it('computes a round trip that matches the sum of its legs', () => {
    const total = parse(evaluateExample({ ...base, fn: 'roundTripTotal' }));
    const buy = parse(evaluateExample({ ...base, fn: 'legCost', side: 'buy' }));
    const sell = parse(evaluateExample({ ...base, fn: 'legCost', side: 'sell' }));
    expect(total).toBeCloseTo(buy + sell, 2);
  });

  it('expresses the round trip as a percentage of turnover', () => {
    const pct = parse(evaluateExample({ ...base, fn: 'roundTripPercent' }));
    expect(pct).toBeGreaterThan(0.2);
    expect(pct).toBeLessThan(0.4);
  });

  it('agrees with the intraday-versus-delivery claim the lessons make', () => {
    const delivery = parse(evaluateExample({ fn: 'roundTripTotal', product: 'delivery', price: 1400, quantity: 35 }));
    const intraday = parse(evaluateExample({ fn: 'roundTripTotal', product: 'intraday', price: 1400, quantity: 35 }));
    expect(delivery / intraday).toBeGreaterThan(2);
  });
});

describe('option computations', () => {
  const atm = { spot: 24000, strike: 24000, ivPercent: 14, type: 'call' as const };

  it('prices an at-the-money call as pure time value', () => {
    expect(parse(evaluateExample({ ...atm, fn: 'optionIntrinsic' }))).toBe(0);
    expect(parse(evaluateExample({ ...atm, fn: 'optionPrice', days: 30 }))).toBeGreaterThan(0);
  });

  it('decays that premium to zero by expiry — the T3 example’s whole point', () => {
    const d30 = parse(evaluateExample({ ...atm, fn: 'optionPrice', days: 30 }));
    const d16 = parse(evaluateExample({ ...atm, fn: 'optionPrice', days: 16 }));
    const d3 = parse(evaluateExample({ ...atm, fn: 'optionPrice', days: 3 }));
    expect(d30).toBeGreaterThan(d16);
    expect(d16).toBeGreaterThan(d3);
    expect(parse(evaluateExample({ ...atm, fn: 'optionIntrinsic' }))).toBe(0);
  });

  it('reports a negative theta for a long option', () => {
    expect(Number(evaluateExample({ ...atm, fn: 'optionGreek', greek: 'theta', days: 30 }))).toBeLessThan(0);
  });

  it('rejects an unknown greek rather than printing nonsense', () => {
    expect(evaluateExample({ ...atm, fn: 'optionGreek', greek: 'omega', days: 30 })).toMatch(/example error/);
  });
});

describe('order book computations', () => {
  it('shows a small order filling at the touch with no slippage', () => {
    expect(evaluateExample({ fn: 'bookWalkLevels', quantity: 100, side: 'buy' })).toBe('1 level');
    expect(evaluateExample({ fn: 'bookWalkSlippage', quantity: 100, side: 'buy' })).toMatch(/^0\.000/);
  });

  it('shows a large order eating several levels at a worse average', () => {
    expect(evaluateExample({ fn: 'bookWalkLevels', quantity: 3000, side: 'buy' })).not.toBe('1 level');
    const avg = Number(evaluateExample({ fn: 'bookWalkAverage', quantity: 3000, side: 'buy' }));
    expect(avg).toBeGreaterThan(1400);
  });

  it('reports the rupee cost of that slippage', () => {
    expect(parse(evaluateExample({ fn: 'bookWalkCost', quantity: 3000, side: 'buy' }))).toBeGreaterThan(0);
  });
});

describe('sizing and arithmetic', () => {
  it('derives position size from the stop', () => {
    // ₹2,000 of risk over ₹28 of stop distance = 71 units.
    expect(evaluateExample({ fn: 'sizeFromStop', equity: 200000, riskPercent: 1, entry: 1400, stop: 1372 })).toBe(
      '71 units',
    );
  });

  it('computes the risk budget', () => {
    expect(evaluateExample({ fn: 'riskAmount', equity: 200000, riskPercent: 1 })).toBe('₹2,000');
  });

  it('multiplies and takes percentages', () => {
    expect(evaluateExample({ fn: 'multiply', a: 1350, b: 250, dp: 0 })).toBe('₹3,37,500');
    expect(evaluateExample({ fn: 'percentOf', value: 337500, percent: 0.25 })).toBe('₹843.75');
  });

  it('computes a span as a percentage of a reference — the candle range', () => {
    expect(evaluateExample({ fn: 'spanPercent', high: 105, low: 99, reference: 104, dp: 1 })).toBe('5.8%');
    expect(evaluateExample({ fn: 'spanPercent', high: 262, low: 247, reference: 259, dp: 2 })).toBe('5.79%');
  });

  it('refuses a zero reference rather than returning Infinity', () => {
    expect(evaluateExample({ fn: 'spanPercent', high: 10, low: 1, reference: 0 })).toMatch(/example error/);
  });

  it('compounds', () => {
    expect(parse(evaluateExample({ fn: 'compoundFinal', initial: 100000, years: 10, ratePercent: 12 }))).toBeGreaterThan(
      300000,
    );
  });

  it('computes ownership as a percentage of shares outstanding', () => {
    expect(evaluateExample({ fn: 'ownershipPercent', sharesOwned: 10, sharesOutstanding: 1000 })).toBe('1.00%');
    expect(evaluateExample({ fn: 'ownershipPercent', sharesOwned: 10, sharesOutstanding: 2000, dp: 1 })).toBe('0.5%');
  });
});

describe('failure handling', () => {
  it('reports an unknown function visibly instead of throwing', () => {
    expect(evaluateExample({ fn: 'notAThing' })).toMatch(/example error: unknown fn/);
  });

  it('reports a missing argument visibly', () => {
    expect(evaluateExample({ fn: 'turnover', price: 1400 })).toMatch(/example error/);
  });

  it('never throws, whatever it is handed', () => {
    for (const spec of [{}, { fn: '' }, { fn: 'legCost' }, { fn: 'optionPrice' }]) {
      expect(() => evaluateExample(spec)).not.toThrow();
    }
  });
});

describe('every shipped example evaluates cleanly', () => {
  it.each(LESSONS.map((l) => [l.id, l] as const))('%s', (_id, lesson) => {
    for (const block of lesson.blocks) {
      if (block.kind !== 'example') continue;
      for (const step of block.steps) {
        if (!step.compute) continue;
        const out = evaluateExample(step.compute);
        expect(out, `"${step.label}" failed to evaluate`).not.toMatch(/example error/);
        expect(out.length, `"${step.label}" produced nothing`).toBeGreaterThan(0);
      }
    }
  });

  it('gives every example at least one computed step, so it cannot silently rot', () => {
    for (const lesson of LESSONS) {
      for (const block of lesson.blocks) {
        if (block.kind !== 'example') continue;
        const computed = block.steps.filter((s) => s.compute).length;
        expect(computed, `${lesson.id}: "${block.title}" hardcodes every value`).toBeGreaterThan(0);
      }
    }
  });
});
