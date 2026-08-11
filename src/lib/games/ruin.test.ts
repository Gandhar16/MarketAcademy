import { describe, expect, it } from 'vitest';
import { DEFAULT_RUIN_CONFIG, expectancy, kellyFraction, simulate, simulatePath } from './ruin';
import { mulberry32, seedFrom } from '../util/rng';

describe('seeded RNG', () => {
  it('is deterministic for a given seed', () => {
    const a = Array.from({ length: 5 }, mulberry32(42));
    const b = Array.from({ length: 5 }, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('differs across seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('stays within [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('derives a stable seed from a string', () => {
    expect(seedFrom('nifty-2020-crash')).toBe(seedFrom('nifty-2020-crash'));
    expect(seedFrom('a')).not.toBe(seedFrom('b'));
  });
});

describe('risk of ruin — the lesson the numbers have to actually support', () => {
  const cfg = { ...DEFAULT_RUIN_CONFIG, trades: 200 };

  it('replays identically for the same seed', () => {
    expect(simulatePath(cfg, 5).equity).toEqual(simulatePath(cfg, 5).equity);
  });

  it('rarely ruins a positive edge at 2% risk', () => {
    const s = simulate({ ...cfg, riskFraction: 0.02 }, 300);
    expect(s.ruinProbability).toBeLessThan(0.1);
  });

  it('frequently ruins the SAME edge at 20% risk — the entire point of the game', () => {
    const small = simulate({ ...cfg, riskFraction: 0.02 }, 300);
    const huge = simulate({ ...cfg, riskFraction: 0.2 }, 300);
    expect(huge.ruinProbability).toBeGreaterThan(small.ruinProbability * 3);
    expect(huge.medianMaxDrawdown).toBeGreaterThan(small.medianMaxDrawdown);
  });

  it('ruins a negative edge regardless of sizing', () => {
    const s = simulate({ ...cfg, winRate: 0.4, riskFraction: 0.02, trades: 500 }, 200);
    expect(s.medianFinal).toBeLessThan(cfg.startingEquity);
  });

  it('produces losing streaks long enough to break most people', () => {
    // At a 55% win rate, a run of 7+ losses is entirely ordinary across 200
    // trades. Learners who have never seen this abandon good systems.
    const s = simulate(cfg, 300);
    expect(s.worstLosingStreak).toBeGreaterThanOrEqual(6);
  });

  it('reports a 5th-percentile outcome far below the median', () => {
    const s = simulate(cfg, 400);
    expect(s.p5Final).toBeLessThan(s.medianFinal);
  });
});

describe('Kelly', () => {
  it('is zero or negative-clamped with no edge', () => {
    expect(kellyFraction(0.5, 1)).toBe(0);
    expect(kellyFraction(0.4, 1)).toBe(0);
  });

  it('gives 10% for a 55/45 even-money edge', () => {
    expect(kellyFraction(0.55, 1)).toBeCloseTo(0.1, 6);
  });

  it('grows with reward-to-risk', () => {
    expect(kellyFraction(0.5, 2)).toBeGreaterThan(kellyFraction(0.5, 1));
  });

  it('is dangerous when the edge is overestimated — the reason for half-Kelly', () => {
    const believed = kellyFraction(0.6, 1); // 20%
    const actual = { ...DEFAULT_RUIN_CONFIG, winRate: 0.55, riskFraction: believed, trades: 200 };
    // Bet full Kelly for a 60% edge while the real edge is 55%, and ruin is
    // no longer a tail event.
    expect(simulate(actual, 300).ruinProbability).toBeGreaterThan(0.2);
  });
});

describe('expectancy', () => {
  it('is positive for a real edge and negative without one', () => {
    expect(expectancy(0.55, 1)).toBeCloseTo(0.1, 6);
    expect(expectancy(0.45, 1)).toBeLessThan(0);
  });

  it('can be positive at a low win rate with a big reward ratio', () => {
    expect(expectancy(0.35, 3)).toBeGreaterThan(0);
  });
});
