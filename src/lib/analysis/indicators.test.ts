import { describe, expect, it } from 'vitest';
import {
  INDICATORS,
  INDICATORS_BY_ID,
  atr,
  bollinger,
  computeIndicators,
  ema,
  latest,
  macd,
  rsi,
  sma,
  vwap,
  wilderSmooth,
} from './indicators';
import { mulberry32 } from '../util/rng';
import type { Candle } from '../market/types';

function walk(n: number, seed = 3): Candle[] {
  const rand = mulberry32(seed);
  const bars: Candle[] = [];
  let price = 100;
  for (let i = 0; i < n; i++) {
    const open = price;
    const close = Math.max(1, open + (rand() - 0.5) * 4);
    bars.push({
      time: 1_700_000_000 + i * 86_400,
      open,
      high: Math.max(open, close) + rand() * 2,
      low: Math.min(open, close) - rand() * 2,
      close,
      volume: Math.round(500_000 + rand() * 1_000_000),
    });
    price = close;
  }
  return bars;
}

describe('SMA', () => {
  it('averages the window', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('is null until there is enough history', () => {
    expect(sma([1, 2], 5)).toEqual([null, null]);
  });

  it('handles a period of one as the identity', () => {
    expect(sma([4, 7, 2], 1)).toEqual([4, 7, 2]);
  });

  it('rejects a nonsensical period', () => {
    expect(() => sma([1, 2, 3], 0)).toThrow(/period/);
  });

  it('does not drift over a long series', () => {
    const flat = new Array(500).fill(42);
    const out = sma(flat, 20);
    expect(out[499]).toBeCloseTo(42, 10);
  });
});

describe('EMA', () => {
  it('seeds from an SMA of the first window, as charting packages do', () => {
    const out = ema([1, 2, 3, 4, 5], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(2); // SMA of 1,2,3
  });

  it('weights recent values more than an SMA does', () => {
    // A step up: EMA should react faster than SMA.
    const values = [...new Array(20).fill(10), ...new Array(5).fill(20)];
    const e = ema(values, 10);
    const s = sma(values, 10);
    expect(e[24] as number).toBeGreaterThan(s[24] as number);
  });

  it('converges to a constant series', () => {
    const out = ema(new Array(200).fill(7), 10);
    expect(out[199]).toBeCloseTo(7, 8);
  });

  it('returns all nulls when there is not enough data', () => {
    expect(ema([1, 2], 10).every((v) => v === null)).toBe(true);
  });
});

describe("Wilder's smoothing", () => {
  it('is NOT the same as an EMA of the same period', () => {
    const values = [...new Array(20).fill(10), ...new Array(10).fill(20)];
    const w = wilderSmooth(values, 14);
    const e = ema(values, 14);
    expect(w[29]).not.toBeCloseTo(e[29] as number, 3);
    // Wilder is slower, so it lags further behind the step.
    expect(w[29] as number).toBeLessThan(e[29] as number);
  });
});

describe('RSI', () => {
  it('stays inside 0–100 on real-shaped data', () => {
    const out = rsi(walk(400).map((b) => b.close), 14);
    for (const v of out) {
      if (v == null) continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('pins to 100 when every bar rises', () => {
    const rising = Array.from({ length: 60 }, (_, i) => 100 + i);
    expect(latest(rsi(rising, 14))).toBe(100);
  });

  it('pins near 0 when every bar falls', () => {
    const falling = Array.from({ length: 60 }, (_, i) => 200 - i);
    expect(latest(rsi(falling, 14))).toBeCloseTo(0, 6);
  });

  it('sits at 50 on a perfectly flat series rather than dividing by zero', () => {
    const flat = new Array(60).fill(100);
    expect(latest(rsi(flat, 14))).toBe(50);
  });

  it('produces its first value exactly at the period index', () => {
    const out = rsi(walk(60).map((b) => b.close), 14);
    expect(out[13]).toBeNull();
    expect(out[14]).not.toBeNull();
  });

  it('returns all nulls when the series is shorter than the period', () => {
    expect(rsi([1, 2, 3], 14).every((v) => v === null)).toBe(true);
  });
});

describe('MACD', () => {
  const closes = walk(300).map((b) => b.close);

  it('is the difference between the two EMAs', () => {
    const { macd: line } = macd(closes, 12, 26, 9);
    const fast = ema(closes, 12);
    const slow = ema(closes, 26);
    const i = 200;
    expect(line[i] as number).toBeCloseTo((fast[i] as number) - (slow[i] as number), 10);
  });

  it('makes the histogram the gap between the line and its signal', () => {
    const { macd: line, signal, histogram } = macd(closes);
    const i = 250;
    expect(histogram[i] as number).toBeCloseTo((line[i] as number) - (signal[i] as number), 10);
  });

  it('leaves the signal null until the line has existed long enough', () => {
    const { signal } = macd(closes, 12, 26, 9);
    // Slow EMA starts at index 25; the signal needs 9 more line values.
    expect(signal[30]).toBeNull();
    expect(signal[40]).not.toBeNull();
  });

  it('goes positive when a fast rally pulls the fast EMA above the slow one', () => {
    const rallying = [...new Array(60).fill(100), ...Array.from({ length: 40 }, (_, i) => 100 + i * 2)];
    expect(latest(macd(rallying).macd) as number).toBeGreaterThan(0);
  });

  it('survives a series too short to produce anything', () => {
    const { macd: line, signal, histogram } = macd([1, 2, 3]);
    expect(line.every((v) => v === null)).toBe(true);
    expect(signal.every((v) => v === null)).toBe(true);
    expect(histogram.every((v) => v === null)).toBe(true);
  });
});

describe('Bollinger Bands', () => {
  const closes = walk(200).map((b) => b.close);

  it('brackets the middle band', () => {
    const { middle, upper, lower } = bollinger(closes, 20, 2);
    for (let i = 19; i < closes.length; i++) {
      expect(upper[i] as number).toBeGreaterThanOrEqual(middle[i] as number);
      expect(lower[i] as number).toBeLessThanOrEqual(middle[i] as number);
    }
  });

  it('collapses to the mean when there is no volatility', () => {
    const { upper, lower, middle } = bollinger(new Array(50).fill(100), 20, 2);
    expect(upper[49]).toBeCloseTo(100, 8);
    expect(lower[49]).toBeCloseTo(100, 8);
    expect(middle[49]).toBeCloseTo(100, 8);
  });

  it('widens with volatility', () => {
    const calm = bollinger([...new Array(40).fill(100)], 20, 2);
    const wild = bollinger(
      Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 90 : 110)),
      20,
      2,
    );
    const calmWidth = (calm.upper[39] as number) - (calm.lower[39] as number);
    const wildWidth = (wild.upper[39] as number) - (wild.lower[39] as number);
    expect(wildWidth).toBeGreaterThan(calmWidth);
  });

  it('reports bandwidth relative to the middle band', () => {
    const { bandwidth, upper, lower, middle } = bollinger(closes, 20, 2);
    const i = 100;
    expect(bandwidth[i] as number).toBeCloseTo(
      ((upper[i] as number) - (lower[i] as number)) / (middle[i] as number),
      10,
    );
  });
});

describe('ATR', () => {
  it('includes the gap from the previous close, not just high minus low', () => {
    const bars: Candle[] = [
      { time: 1, open: 100, high: 102, low: 98, close: 100, volume: 1 },
      // Gaps down to 80: high-low is 4, but the true range is 22.
      { time: 2, open: 80, high: 82, low: 78, close: 80, volume: 1 },
    ];
    const out = atr(bars, 2);
    expect(out[1] as number).toBeGreaterThan(4);
  });

  it('is never negative', () => {
    for (const v of atr(walk(300), 14)) {
      if (v != null) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles an empty series', () => {
    expect(atr([], 14)).toEqual([]);
  });
});

describe('VWAP', () => {
  it('weights by volume', () => {
    const bars: Candle[] = [
      { time: 1, open: 10, high: 10, low: 10, close: 10, volume: 1 },
      { time: 2, open: 20, high: 20, low: 20, close: 20, volume: 99 },
    ];
    // Almost all the volume traded at 20, so VWAP must sit near 20.
    expect(latest(vwap(bars)) as number).toBeGreaterThan(19);
  });

  it('carries the previous value through a bar with no volume', () => {
    const bars: Candle[] = [
      { time: 1, open: 10, high: 10, low: 10, close: 10, volume: 100 },
      { time: 2, open: 20, high: 20, low: 20, close: 20, volume: null },
    ];
    expect(vwap(bars)[1]).toBeCloseTo(10, 8);
  });

  it('is null before any volume has traded', () => {
    expect(vwap([{ time: 1, open: 10, high: 10, low: 10, close: 10, volume: null }])[0]).toBeNull();
  });
});

// ── The property that matters most ──────────────────────────────────────────

describe('NO LOOKAHEAD — every indicator is causal', () => {
  const bars = walk(300, 11);

  /**
   * Computing an indicator over the first N bars must give exactly the same
   * values as computing it over all 300 and taking the first N. If any
   * indicator peeked forward — a centred average, a future-anchored VWAP — this
   * test would fail, and Chart Replay would be leaking the future.
   */
  const prefixes = [60, 120, 200, 299];

  it.each(prefixes)('agrees with the full series at prefix %i', (n) => {
    const partial = computeIndicators(bars.slice(0, n));
    const full = computeIndicators(bars);

    const check = (a: (number | null)[], b: (number | null)[], label: string) => {
      for (let i = 0; i < n; i++) {
        if (a[i] == null && b[i] == null) continue;
        expect(a[i], `${label} diverged at bar ${i} of prefix ${n}`).toBeCloseTo(b[i] as number, 8);
      }
    };

    check(partial.sma20, full.sma20, 'sma20');
    check(partial.sma50, full.sma50, 'sma50');
    check(partial.ema9, full.ema9, 'ema9');
    check(partial.ema21, full.ema21, 'ema21');
    check(partial.vwap, full.vwap, 'vwap');
    check(partial.rsi, full.rsi, 'rsi');
    check(partial.atr, full.atr, 'atr');
    check(partial.macd.macd, full.macd.macd, 'macd line');
    check(partial.macd.signal, full.macd.signal, 'macd signal');
    check(partial.bollinger.upper, full.bollinger.upper, 'bollinger upper');
    check(partial.bollinger.lower, full.bollinger.lower, 'bollinger lower');
  });

  it('grows one value at a time as bars arrive, exactly as a live chart would', () => {
    let previousDefined = 0;
    for (let n = 50; n <= 80; n++) {
      const defined = computeIndicators(bars.slice(0, n)).sma20.filter((v) => v != null).length;
      expect(defined).toBe(previousDefined === 0 ? defined : previousDefined + 1);
      previousDefined = defined;
    }
  });
});

describe('the indicator registry', () => {
  it('has unique ids', () => {
    const ids = INDICATORS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every indicator a hint and a stated warm-up', () => {
    for (const i of INDICATORS) {
      expect(i.hint.length).toBeGreaterThan(15);
      expect(i.warmup).toBeGreaterThanOrEqual(1);
      expect(INDICATORS_BY_ID.get(i.id)).toBe(i);
    }
  });

  it('declares a warm-up that matches when values actually appear', () => {
    const bars = walk(200);
    const c = computeIndicators(bars);
    const firstDefined = (s: (number | null)[]) => s.findIndex((v) => v != null) + 1;
    expect(firstDefined(c.sma20)).toBe(INDICATORS_BY_ID.get('sma20')!.warmup);
    expect(firstDefined(c.sma50)).toBe(INDICATORS_BY_ID.get('sma50')!.warmup);
    expect(firstDefined(c.ema9)).toBe(INDICATORS_BY_ID.get('ema9')!.warmup);
    expect(firstDefined(c.rsi)).toBe(INDICATORS_BY_ID.get('rsi')!.warmup);
  });
});

describe('computeIndicators', () => {
  it('handles a short series without throwing', () => {
    expect(() => computeIndicators(walk(3))).not.toThrow();
  });

  it('handles an empty series without throwing', () => {
    expect(() => computeIndicators([])).not.toThrow();
  });

  it('returns series aligned to the input length', () => {
    const bars = walk(120);
    const c = computeIndicators(bars);
    expect(c.sma20).toHaveLength(120);
    expect(c.rsi).toHaveLength(120);
    expect(c.macd.histogram).toHaveLength(120);
    expect(c.bollinger.upper).toHaveLength(120);
  });
});
