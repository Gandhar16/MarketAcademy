import { describe, expect, it } from 'vitest';
import { findLargestSwing, findLineTouch, findPivotLows, findTrendlineAnchors, retracementLevel, toHeikinAshi } from './chart-drawing';
import type { Candle } from '../market/types';

function bar(low: number, high: number, open = low, close = high): Candle {
  return { time: 0, open, high, low, close, volume: 1000 };
}

describe('findLargestSwing', () => {
  it('finds the single largest low-to-high rally', () => {
    const bars = [bar(100, 105), bar(90, 95), bar(85, 90), bar(88, 200), bar(190, 195)];
    // Global low is at index 2 (85), and the biggest range from any running low is
    // low=85 (index 2) to high=200 (index 3): a range of 115.
    const swing = findLargestSwing(bars);
    expect(swing.lowIdx).toBe(2);
    expect(swing.highIdx).toBe(3);
  });

  it('picks the larger of two separate rallies', () => {
    const bars = [
      bar(100, 110), // small rally: 10
      bar(95, 96),
      bar(50, 55), // low
      bar(52, 300), // big rally from the low: 250
    ];
    const swing = findLargestSwing(bars);
    expect(swing.lowIdx).toBe(2);
    expect(swing.highIdx).toBe(3);
  });

  it('handles a single bar without throwing', () => {
    expect(findLargestSwing([bar(10, 12)])).toEqual({ lowIdx: 0, highIdx: 0 });
  });
});

describe('findPivotLows', () => {
  it('finds a low surrounded by higher lows on both sides', () => {
    const bars = [bar(50, 55), bar(45, 48), bar(40, 42), bar(46, 49), bar(52, 54)];
    expect(findPivotLows(bars, 2)).toEqual([2]);
  });

  it('finds nothing when the series is monotonic', () => {
    const bars = [bar(10, 11), bar(20, 21), bar(30, 31), bar(40, 41), bar(50, 51)];
    expect(findPivotLows(bars, 2)).toEqual([]);
  });
});

describe('findTrendlineAnchors', () => {
  it('picks the first pivot and the next HIGHER pivot low', () => {
    // Pivots (window 2) at index 2 (low 40) and index 6 (low 44) — a genuine higher low.
    const bars = [
      bar(50, 55), bar(45, 48), bar(40, 42), bar(46, 49), bar(52, 54),
      bar(48, 50), bar(44, 47), bar(50, 53), bar(60, 62),
    ];
    const anchors = findTrendlineAnchors(bars);
    expect(anchors).not.toBeNull();
    expect(anchors!.p1).toBe(2);
    expect(bars[anchors!.p2].low).toBeGreaterThan(bars[anchors!.p1].low);
  });

  it('returns null rather than inventing a point when no two-pivot line exists', () => {
    const bars = [bar(50, 55), bar(48, 52)];
    expect(findTrendlineAnchors(bars)).toBeNull();
  });
});

describe('findLineTouch', () => {
  it('finds a real bar whose low sits on the projected line', () => {
    // p1 = index 0 (low 100), p2 = index 4 (low 120): slope = 5/bar.
    // At index 8 the line projects to 140 — put a bar there with low 140.1, within tolerance.
    const bars = [
      bar(100, 105), bar(105, 108), bar(110, 112), bar(115, 118), bar(120, 122),
      bar(130, 135), bar(150, 155), bar(160, 165), bar(140.1, 145),
    ];
    const touch = findLineTouch(bars, 0, 4, 5);
    expect(touch).toBe(8);
  });

  it('returns null when the line has not been tested again', () => {
    const bars = [bar(100, 105), bar(105, 108), bar(110, 112), bar(115, 118), bar(120, 122), bar(200, 210)];
    expect(findLineTouch(bars, 0, 4, 5)).toBeNull();
  });
});

describe('retracementLevel', () => {
  it('computes standard retracement percentages', () => {
    expect(retracementLevel(1040, 840, 0)).toBeCloseTo(1040);
    expect(retracementLevel(1040, 840, 100)).toBeCloseTo(840);
    expect(retracementLevel(1040, 840, 38.2)).toBeCloseTo(963.6, 1);
    expect(retracementLevel(1040, 840, 61.8)).toBeCloseTo(916.4, 1);
  });

  it('extends above the high for percentages over 100', () => {
    expect(retracementLevel(1040, 840, 161.8)).toBeCloseTo(1163.6, 1);
  });
});

describe('toHeikinAshi', () => {
  it('closes each bar at the average of its own four real prices', () => {
    const bars = [bar(95, 105, 100, 104)];
    const ha = toHeikinAshi(bars);
    // (open 100 + high 105 + low 95 + close 104) / 4 = 101
    expect(ha[0].close).toBeCloseTo(101);
  });

  it('opens each bar at the midpoint of the PREVIOUS Heikin-Ashi bar, not the real open', () => {
    const bars = [bar(95, 105, 100, 104), bar(100, 110, 104, 108)];
    const ha = toHeikinAshi(bars);
    const expectedSecondOpen = (ha[0].open + ha[0].close) / 2;
    expect(ha[1].open).toBeCloseTo(expectedSecondOpen);
    // And it is NOT the real second bar's open (104) — the whole point of the series.
    expect(ha[1].open).not.toBeCloseTo(104, 0);
  });

  it('produces the same number of bars as it was given, preserving time', () => {
    const bars = [bar(95, 105), bar(100, 110), bar(105, 115)];
    const ha = toHeikinAshi(bars);
    expect(ha.length).toBe(3);
    expect(ha.map((b) => b.time)).toEqual(bars.map((b) => b.time));
  });
});
