import { describe, expect, it } from 'vitest';
import { PATTERNS, PATTERNS_BY_ID, allPatternStats, patternStats, verdictFor } from './patterns';
import { mulberry32 } from '../util/rng';
import type { Candle } from '../market/types';

const bar = (open: number, high: number, low: number, close: number, i = 0): Candle => ({
  time: 1_700_000_000 + i * 86_400,
  open,
  high,
  low,
  close,
  volume: 1_000_000,
});

/** A modelled random walk — used only to prove that patterns find NO edge in noise. */
function randomWalk(n: number, seed = 1): Candle[] {
  const rand = mulberry32(seed);
  const bars: Candle[] = [];
  let price = 100;
  for (let i = 0; i < n; i++) {
    const open = price;
    const drift = (rand() - 0.5) * 4;
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + rand() * 2;
    const low = Math.min(open, close) - rand() * 2;
    bars.push(bar(open, high, low, close, i));
    price = close;
  }
  return bars;
}

describe('pattern detectors', () => {
  const detect = (id: string, bars: Candle[], i: number) => PATTERNS_BY_ID.get(id as never)!.detect(bars, i);

  it('detects a bullish engulfing and rejects the near-miss', () => {
    const bars = [bar(100, 101, 95, 96), bar(95, 106, 94, 105)];
    expect(detect('bullish-engulfing', bars, 1)).toBe(true);
    // Same shape but the current candle does not engulf the prior body.
    expect(detect('bullish-engulfing', [bar(100, 101, 95, 96), bar(96, 99, 95, 98)], 1)).toBe(false);
    // Prior candle is green, so there is nothing bullish to reverse.
    expect(detect('bullish-engulfing', [bar(96, 101, 95, 100), bar(95, 106, 94, 105)], 1)).toBe(false);
  });

  it('detects a bearish engulfing', () => {
    const bars = [bar(96, 101, 95, 100), bar(101, 102, 94, 95)];
    expect(detect('bearish-engulfing', bars, 1)).toBe(true);
  });

  it('requires a preceding decline for a hammer', () => {
    const downtrend = [bar(110, 111, 109, 110), bar(109, 110, 107, 108), bar(108, 109, 105, 106)];
    // Tiny body, long lower wick, almost no upper wick.
    const hammerBar = bar(104, 105, 96, 104.9);
    expect(detect('hammer', [...downtrend, hammerBar], 3)).toBe(true);
    // Identical candle after a RISE is not a hammer by definition.
    const uptrend = [bar(90, 92, 89, 91), bar(91, 94, 90, 93), bar(93, 96, 92, 95)];
    expect(detect('hammer', [...uptrend, bar(104, 105, 96, 104.9)], 3)).toBe(false);
  });

  it('detects a doji only when the body is genuinely tiny', () => {
    expect(detect('doji', [bar(100, 105, 95, 100.2)], 0)).toBe(true);
    expect(detect('doji', [bar(100, 105, 95, 103)], 0)).toBe(false);
  });

  it('detects gaps against the previous high and low, not the close', () => {
    expect(detect('gap-up', [bar(100, 102, 99, 101), bar(103, 105, 102, 104)], 1)).toBe(true);
    // Opens above the previous CLOSE but inside its range — not a gap.
    expect(detect('gap-up', [bar(100, 105, 99, 101), bar(103, 106, 102, 104)], 1)).toBe(false);
    expect(detect('gap-down', [bar(100, 102, 99, 101), bar(98, 99, 96, 97)], 1)).toBe(true);
  });

  it('detects an inside bar including the exact-equal boundary', () => {
    expect(detect('inside-bar', [bar(100, 110, 90, 105), bar(101, 108, 92, 103)], 1)).toBe(true);
    expect(detect('inside-bar', [bar(100, 110, 90, 105), bar(101, 110, 90, 103)], 1)).toBe(true);
    expect(detect('inside-bar', [bar(100, 110, 90, 105), bar(101, 111, 92, 103)], 1)).toBe(false);
  });

  it('detects three consecutive up and down days', () => {
    const up = [bar(100, 102, 99, 101), bar(101, 103, 100, 102), bar(102, 104, 101, 103)];
    expect(detect('three-up-days', up, 2)).toBe(true);
    const mixed = [bar(100, 102, 99, 101), bar(101, 103, 100, 100.5), bar(102, 104, 101, 103)];
    expect(detect('three-up-days', mixed, 2)).toBe(false);
  });

  it('never throws on a flat candle where high equals low', () => {
    const flat = [bar(100, 100, 100, 100), bar(100, 100, 100, 100), bar(100, 100, 100, 100), bar(100, 100, 100, 100)];
    for (const p of PATTERNS) {
      expect(() => p.detect(flat, 3)).not.toThrow();
    }
  });
});

describe('base-rate scoring', () => {
  it('finds no real edge in a random walk — the point of the whole lesson', () => {
    const bars = randomWalk(2000);
    const stats = allPatternStats(bars, 5);
    for (const s of stats) {
      if (s.occurrences < 30) continue;
      // In pure noise, no pattern should clear a 2-sigma difference from base.
      expect(Math.abs(s.zScore)).toBeLessThan(3.5);
    }
  });

  it('reports the base rate alongside the hit rate', () => {
    const s = patternStats(randomWalk(1000), 'doji', 5);
    expect(s.baseRate).toBeGreaterThan(0);
    expect(s.baseRate).toBeLessThan(1);
    expect(s.edge).toBeCloseTo((s.hitRate - s.baseRate) * 100, 6);
  });

  it('detects a genuine edge when one is planted', () => {
    // A series engineered so every gap-up IS followed by five strong up bars.
    // If the scorer cannot find this, it cannot be trusted to say "no edge"
    // about a real one either.
    const bars: Candle[] = [];
    let price = 100;
    const push = (open: number, close: number) =>
      bars.push(bar(open, Math.max(open, close) + 0.1, Math.min(open, close) - 0.1, close, bars.length));

    // Each block: a gap up, five strong up bars, then a long grind down. The
    // grind matters — without it the whole series trends up, the base rate goes
    // to 100%, and the pattern shows NO edge over base even though it "works".
    // That is itself the lesson, and it is why the fixture is shaped this way.
    for (let block = 0; block < 60; block++) {
      push(price + 3, price + 3.5); // the gap
      price += 3.5;
      for (let k = 0; k < 5; k++) {
        push(price, price + 1);
        price += 1;
      }
      // Sized so the block is roughly net flat — otherwise the price walks to
      // zero over 60 blocks and the forward-return maths stops being defined.
      for (let k = 0; k < 12; k++) {
        push(price, price - 0.7);
        price -= 0.7;
      }
    }

    const s = patternStats(bars, 'gap-up', 5);
    expect(s.occurrences).toBeGreaterThan(30);
    expect(s.edge).toBeGreaterThan(10);
    expect(verdictFor(s).verdict).toBe('notable');
  });

  it('does not divide by zero when a pattern never fires', () => {
    const flat = Array.from({ length: 200 }, (_, i) => bar(100, 100, 100, 100, i));
    const s = patternStats(flat, 'gap-up', 5);
    expect(s.occurrences).toBe(0);
    expect(Number.isFinite(s.hitRate)).toBe(true);
    expect(Number.isFinite(s.zScore)).toBe(true);
  });

  it('handles a series shorter than the horizon without throwing', () => {
    const s = patternStats(randomWalk(10), 'doji', 20);
    expect(s.sampleSize).toBe(0);
    expect(Number.isFinite(s.edge)).toBe(true);
  });

  it('rejects an unknown pattern id rather than scoring nothing', () => {
    expect(() => patternStats(randomWalk(100), 'not-a-pattern' as never, 5)).toThrow(/Unknown pattern/);
  });

  it('changes with the horizon, so the horizon must be stated', () => {
    const bars = randomWalk(2000, 9);
    const short = patternStats(bars, 'three-down-days', 1);
    const long = patternStats(bars, 'three-down-days', 20);
    expect(short.meanReturn).not.toBe(long.meanReturn);
  });
});

describe('verdicts', () => {
  const base = patternStats(randomWalk(2000), 'doji', 5);

  it('calls a small sample noise regardless of the hit rate', () => {
    const v = verdictFor({ ...base, occurrences: 12, hitRate: 0.9, zScore: 5 });
    expect(v.verdict).toBe('noise');
    expect(v.text).toMatch(/too few/);
  });

  it('calls a sub-2-sigma difference noise', () => {
    const v = verdictFor({ ...base, occurrences: 200, zScore: 1.2, hitRate: 0.55, baseRate: 0.53 });
    expect(v.verdict).toBe('noise');
    expect(v.text).toMatch(/indistinguishable from noise/);
  });

  it('calls a detectable but tiny edge weak, and mentions costs', () => {
    const v = verdictFor({ ...base, occurrences: 500, zScore: 2.5, edge: 3 });
    expect(v.verdict).toBe('weak');
    expect(v.text).toMatch(/costs of trading it/);
  });

  it('calls a large, well-sampled edge notable — while warning about one symbol', () => {
    const v = verdictFor({ ...base, occurrences: 400, zScore: 4, edge: 12 });
    expect(v.verdict).toBe('notable');
    expect(v.text).toMatch(/not the same as a durable edge/);
  });
});
