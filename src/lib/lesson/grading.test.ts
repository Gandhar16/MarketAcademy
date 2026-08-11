import { describe, expect, it } from 'vitest';
import {
  computeExpected,
  gradeCheckpoint,
  gradeClassify,
  gradeCompute,
  gradeConstruct,
  gradeDecision,
  parseNumeric,
  type ComputeSpec,
  type ConstructSpec,
  type TaskType,
} from './grading';
import { LESSONS } from '@/content/registry';

describe('parseNumeric — learners type all of these', () => {
  it.each([
    ['1234', 1234],
    ['1,234.56', 1234.56],
    ['₹1,234', 1234],
    ['0.42%', 0.42],
    ['  12 ', 12],
    ['-3.5', -3.5],
    [42, 42],
  ])('parses %s', (input, expected) => {
    expect(parseNumeric(input)).toBe(expected);
  });

  it.each([['', null], ['abc', null], ['₹%', null], [null, null], [undefined, null], [{}, null], [NaN, null]])(
    'rejects %s',
    (input, expected) => {
      expect(parseNumeric(input)).toBe(expected);
    },
  );
});

describe('decision grading', () => {
  const spec = { options: ['Viable', 'Marginal', 'Not viable'], correct: 'Marginal' };

  it('accepts the right call', () => {
    expect(gradeDecision(spec, 'Marginal').correct).toBe(true);
  });

  it('is case-insensitive, because typing is not the skill being tested', () => {
    expect(gradeDecision(spec, 'marginal').correct).toBe(true);
  });

  it('names what the learner picked and what the numbers say', () => {
    const r = gradeDecision(spec, 'Viable');
    expect(r.correct).toBe(false);
    expect(r.feedback).toContain('Viable');
    expect(r.feedback).toContain('Marginal');
  });

  it('gives no credit for a blank answer', () => {
    expect(gradeDecision(spec, '').credit).toBe(0);
    expect(gradeDecision(spec, undefined).credit).toBe(0);
  });
});

describe('compute grading — recomputed, never stored', () => {
  const spec: ComputeSpec = {
    metric: 'roundTripCostPercent',
    market: 'IN',
    venue: 'NSE',
    product: 'delivery',
    price: 1400,
    quantity: 35,
    tolerance: 0.03,
    unit: '%',
  };

  it('derives the expected value from the live cost engine', () => {
    const expected = computeExpected(spec);
    // Delivery round trip is a few tenths of a percent — assert the band, not a
    // frozen number, so a rate change updates the test's meaning honestly.
    expect(expected).toBeGreaterThan(0.2);
    expect(expected).toBeLessThan(1);
  });

  it('accepts an answer inside tolerance', () => {
    const expected = computeExpected(spec);
    expect(gradeCompute(spec, expected.toFixed(3)).correct).toBe(true);
    expect(gradeCompute(spec, (expected + 0.02).toFixed(3)).correct).toBe(true);
  });

  it('rejects an answer outside tolerance but gives half credit in the right ballpark', () => {
    const expected = computeExpected(spec);
    const r = gradeCompute(spec, expected * 1.3);
    expect(r.correct).toBe(false);
    expect(r.credit).toBe(0.5);
    expect(r.feedback).toMatch(/Right ballpark/);
  });

  it('gives no credit for an order-of-magnitude error', () => {
    const expected = computeExpected(spec);
    expect(gradeCompute(spec, expected * 100).credit).toBe(0);
  });

  it('gives no credit for a non-number and says so plainly', () => {
    const r = gradeCompute(spec, 'quite a lot');
    expect(r.credit).toBe(0);
    expect(r.feedback).toMatch(/not a number/);
  });

  it('always reveals the expected value after grading', () => {
    expect(gradeCompute(spec, 'nonsense').expected).toBeTruthy();
  });

  it('computes a broker delta that reflects brokerage plus its GST', () => {
    const delta = computeExpected({
      metric: 'brokerageDelta',
      market: 'IN',
      venue: 'NSE',
      product: 'delivery',
      price: 800,
      quantity: 10,
      tolerance: 5,
      plans: ['in-discount', 'in-full-service'],
    });
    // 0.5% x 8,000 = ₹40 per leg, ₹80 total, +18% GST = ₹94.40.
    expect(delta).toBeCloseTo(94.4, 1);
  });

  it('rejects an unknown broker plan rather than grading against nonsense', () => {
    expect(() =>
      computeExpected({
        metric: 'brokerageDelta',
        market: 'IN',
        venue: 'NSE',
        product: 'delivery',
        price: 800,
        quantity: 10,
        tolerance: 5,
        plans: ['in-discount', 'not-a-broker'],
      }),
    ).toThrow(/Unknown broker plan/);
  });

  it('names an unknown metric instead of silently returning undefined', () => {
    // This exact bug shipped once: a lesson used the examples.ts vocabulary by
    // mistake, the switch fell through, and the failure surfaced two frames
    // away as "cannot read properties of undefined".
    expect(() => computeExpected({ ...spec, metric: 'roundTripPercent' as never })).toThrow(
      /Unknown compute metric "roundTripPercent"/,
    );
  });

  it('supports every declared metric without throwing', () => {
    const metrics: ComputeSpec['metric'][] = [
      'roundTripCostPercent',
      'roundTripCostAmount',
      'breakevenPercent',
      'legCostAmount',
      'brokerageDelta',
    ];
    for (const metric of metrics) {
      expect(Number.isFinite(computeExpected({ ...spec, metric }))).toBe(true);
    }
  });
});

describe('classify grading', () => {
  const spec = {
    categories: ['Broker', 'Government', 'Exchange'],
    items: [
      { label: 'Brokerage', category: 'Broker' },
      { label: 'STT', category: 'Government' },
      { label: 'Transaction charges', category: 'Exchange' },
      { label: 'Stamp duty', category: 'Government' },
    ],
  };

  it('awards full credit for a perfect assignment', () => {
    const answer = Object.fromEntries(spec.items.map((i) => [i.label, i.category]));
    const r = gradeClassify(spec, answer);
    expect(r.correct).toBe(true);
    expect(r.credit).toBe(1);
  });

  it('awards proportional credit and names what was misplaced', () => {
    const answer = { Brokerage: 'Broker', STT: 'Broker', 'Transaction charges': 'Exchange', 'Stamp duty': 'Government' };
    const r = gradeClassify(spec, answer);
    expect(r.credit).toBe(0.75);
    expect(r.feedback).toMatch(/STT → Government/);
  });

  it('handles a completely empty answer', () => {
    expect(gradeClassify(spec, {}).credit).toBe(0);
    expect(gradeClassify(spec, undefined).credit).toBe(0);
  });

  it('does not divide by zero on an empty item list', () => {
    expect(gradeClassify({ categories: [], items: [] }, {}).credit).toBe(0);
  });
});

describe('construct grading — validated by the real order validator', () => {
  const spec: ConstructSpec = {
    instrument: { symbol: 'RELIANCE.NS', market: 'IN', tickSize: 0.05 },
    lastPrice: 1400,
    availableCash: 200_000,
    require: { side: 'sell', type: 'SL-M', triggerBetween: [1330, 1370], maxRiskPerUnit: 70 },
  };

  it('accepts an order that is valid and meets every constraint', () => {
    const r = gradeConstruct(spec, { side: 'sell', type: 'SL-M', quantity: 100, triggerPrice: 1350 });
    expect(r.correct).toBe(true);
    expect(r.credit).toBe(1);
  });

  it('rejects an order the exchange would reject, and explains why', () => {
    const r = gradeConstruct(spec, { side: 'sell', type: 'SL-M', quantity: 100, triggerPrice: 1350.237 });
    expect(r.credit).toBe(0);
    expect(r.feedback).toMatch(/tick size/);
  });

  it('rejects a stop on the wrong side of the market', () => {
    const r = gradeConstruct(spec, { side: 'sell', type: 'SL-M', quantity: 100, triggerPrice: 1450 });
    expect(r.credit).toBe(0);
    expect(r.feedback).toMatch(/must sit BELOW/);
  });

  it('gives partial credit for a valid order that misses the risk brief', () => {
    const r = gradeConstruct(spec, { side: 'sell', type: 'SL-M', quantity: 100, triggerPrice: 1300 });
    expect(r.correct).toBe(false);
    expect(r.credit).toBe(0.4);
    expect(r.feedback).toMatch(/trigger must sit between/);
  });

  it('penalises picking SL when the brief called for SL-M', () => {
    const r = gradeConstruct(spec, { side: 'sell', type: 'SL', quantity: 100, triggerPrice: 1350, limitPrice: 1345 });
    expect(r.correct).toBe(false);
    expect(r.feedback).toMatch(/asked for a SL-M order/);
  });

  it('rejects an unfunded order', () => {
    const r = gradeConstruct(
      { ...spec, availableCash: 1000, require: { side: 'buy', type: 'LIMIT' } },
      { side: 'buy', type: 'LIMIT', quantity: 100, limitPrice: 1400 },
    );
    expect(r.credit).toBe(0);
    expect(r.feedback).toMatch(/Insufficient funds/);
  });

  it('handles a completely empty submission without throwing', () => {
    expect(() => gradeConstruct(spec, {})).not.toThrow();
    expect(gradeConstruct(spec, {}).credit).toBe(0);
  });
});

describe('checkpoint grading', () => {
  const tasks = [
    { type: 'decision' as TaskType, spec: { options: ['a', 'b'], correct: 'a' } },
    { type: 'decision' as TaskType, spec: { options: ['a', 'b'], correct: 'b' } },
  ];

  it('scores 100 for all correct and 50 for half', () => {
    expect(gradeCheckpoint(tasks, ['a', 'b']).score).toBe(100);
    expect(gradeCheckpoint(tasks, ['a', 'a']).score).toBe(50);
    expect(gradeCheckpoint(tasks, ['b', 'a']).score).toBe(0);
  });

  it('handles missing answers', () => {
    expect(gradeCheckpoint(tasks, []).score).toBe(0);
  });

  it('does not penalise the learner for a broken spec — that is our bug', () => {
    const broken = [{ type: 'compute' as TaskType, spec: { metric: 'brokerageDelta', plans: ['x', 'y'] } }];
    const graded = gradeCheckpoint(broken, ['5']);
    expect(graded.results[0].feedback).toMatch(/content bug/);
  });

  it('grades every checkpoint in the shipped curriculum without throwing', () => {
    for (const lesson of LESSONS) {
      for (const block of lesson.blocks) {
        if (block.kind !== 'checkpoint') continue;
        const graded = gradeCheckpoint(
          block.tasks.map((t) => ({ type: t.type as TaskType, spec: t.spec as Record<string, unknown> })),
          block.tasks.map(() => ''),
        );
        // Blank answers must score zero, not crash and not accidentally pass.
        expect(graded.score).toBe(0);
        for (const r of graded.results) {
          expect(r.feedback).not.toMatch(/content bug/);
        }
      }
    }
  });

  it('awards full marks when the shipped checkpoints are answered correctly', () => {
    for (const lesson of LESSONS) {
      const idx = lesson.blocks.findIndex((b) => b.kind === 'checkpoint');
      const block = lesson.blocks[idx];
      if (block?.kind !== 'checkpoint') continue;

      // Build a correct answer for every task type. This proves each shipped
      // checkpoint is actually answerable — a task whose constraints cannot be
      // satisfied is a content bug that would otherwise reach a learner.
      const answers = block.tasks.map((t) => {
        const spec = t.spec as Record<string, unknown>;

        if (t.type === 'decision') return spec.correct as string;
        if (t.type === 'compute') return computeExpected(spec as unknown as ComputeSpec);

        if (t.type === 'classify') {
          const items = spec.items as { label: string; category: string }[];
          return Object.fromEntries(items.map((i) => [i.label, i.category]));
        }

        const s = spec as unknown as ConstructSpec;
        const tick = s.instrument.tickSize;
        const snap = (p: number) => Math.round(p / tick) * tick;
        const band = s.require.triggerBetween;
        const type = s.require.type ?? 'MARKET';
        const side = s.require.side ?? 'buy';
        const trigger = band ? snap((band[0] + band[1]) / 2) : undefined;

        // LIMIT and SL orders are rejected without a limit price, so a correct
        // answer must supply one — placed on the fillable side of the market.
        const limitPrice =
          type === 'LIMIT' || type === 'SL'
            ? snap(side === 'buy' ? (trigger ?? s.lastPrice) : (trigger ?? s.lastPrice))
            : undefined;

        return {
          side,
          type,
          quantity: s.require.minQuantity ?? 1,
          triggerPrice: trigger,
          limitPrice,
        };
      });

      expect(gradeCheckpoint(
        block.tasks.map((t) => ({ type: t.type as TaskType, spec: t.spec as Record<string, unknown> })),
        answers,
      ).score).toBe(100);
    }
  });
});
