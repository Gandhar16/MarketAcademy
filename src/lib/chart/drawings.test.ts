import { describe, expect, it } from 'vitest';
import {
  ANCHORS_NEEDED,
  FIB_LEVELS,
  NOT_FIBONACCI,
  isWithinMove,
  TOOLS,
  deserialise,
  distanceToSegment,
  extendAcross,
  magnetTo,
  measureBetween,
  positionMaths,
  rayTo,
  serialise,
  type Drawing,
} from './drawings';

describe('chart drawings', () => {
  it('gives every tool an anchor count and a plain-English hint', () => {
    for (const t of TOOLS) {
      expect(ANCHORS_NEEDED[t.kind], `${t.kind} has no anchor count`).toBeGreaterThan(0);
      expect(t.hint.length, `${t.kind} has no hint`).toBeGreaterThan(10);
    }
  });

  it('admits which of its levels are not Fibonacci numbers', () => {
    // The chart has to say the same thing t2-fibonacci.ts says in words. If
    // these levels were quietly dropped the lesson would contradict the tool;
    // if they were included unflagged, the tool would contradict the lesson.
    expect(FIB_LEVELS).toContain(0.5);
    expect(NOT_FIBONACCI.has(0.5)).toBe(true);
    // Square roots of 0.618 and 1.618 — arithmetic somebody did later, not
    // members of the sequence.
    expect(NOT_FIBONACCI.has(1.272)).toBe(true);
    expect(NOT_FIBONACCI.has(-0.272)).toBe(true);
    expect(NOT_FIBONACCI.has(0.618)).toBe(false);
  });

  it('projects fib levels past both ends of the move', () => {
    // A retracement grid that stops at the two points you dragged answers only
    // half the question. Beyond 1 is the move being given back and then some;
    // below 0 is it carrying on instead of turning.
    expect(FIB_LEVELS.some((l) => l < 0)).toBe(true);
    expect(FIB_LEVELS.some((l) => l > 1)).toBe(true);
    expect([...FIB_LEVELS].sort((a, b) => a - b)).toEqual([...FIB_LEVELS]);
  });

  it('separates levels inside the move from levels projected past it', () => {
    // The renderer draws these differently, because a projection marks
    // somewhere price has not been rather than a level it actually traded at.
    expect(isWithinMove(0.618)).toBe(true);
    expect(isWithinMove(0)).toBe(true);
    expect(isWithinMove(1)).toBe(true);
    expect(isWithinMove(1.618)).toBe(false);
    expect(isWithinMove(-0.618)).toBe(false);
  });

  describe('geometry', () => {
    it('measures distance to a segment, including past its ends', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 0 };
      expect(distanceToSegment({ x: 5, y: 3 }, a, b)).toBeCloseTo(3);
      // Past the end it is the distance to the endpoint, not to the infinite line.
      expect(distanceToSegment({ x: 20, y: 0 }, a, b)).toBeCloseTo(10);
    });

    it('extends a line to both edges of the viewport', () => {
      const [left, right] = extendAcross({ x: 10, y: 10 }, { x: 20, y: 20 }, 100, 50);
      expect(left).toEqual({ x: 0, y: 0 });
      expect(right).toEqual({ x: 100, y: 100 });
    });

    it('extends a vertical line without dividing by zero', () => {
      const [top, bottom] = extendAcross({ x: 7, y: 10 }, { x: 7, y: 40 }, 100, 50);
      expect(top).toEqual({ x: 7, y: 0 });
      expect(bottom).toEqual({ x: 7, y: 50 });
    });

    it('sends a ray forward only, in the direction it was drawn', () => {
      expect(rayTo({ x: 10, y: 0 }, { x: 20, y: 10 }, 100, 50).x).toBe(100);
      // Drawn right-to-left, it must run off the LEFT edge instead.
      expect(rayTo({ x: 90, y: 0 }, { x: 80, y: 10 }, 100, 50).x).toBe(0);
    });
  });

  describe('the risk picture', () => {
    const anchors = [
      { logical: 1, price: 100 },
      { logical: 1, price: 95 },
      { logical: 10, price: 115 },
    ];

    it('works out reward against risk for a long', () => {
      const m = positionMaths(anchors, 'long');
      expect(m?.riskPerUnit).toBeCloseTo(5);
      expect(m?.rewardPerUnit).toBeCloseTo(15);
      expect(m?.rr).toBeCloseTo(3);
      expect(m?.riskPercent).toBeCloseTo(5);
    });

    it('flips the arithmetic for a short rather than reporting a negative trade', () => {
      // Entry 100, "stop" 95, "target" 115 read as a short is a bad trade, and
      // it should read as one: risk above, reward below.
      const m = positionMaths(anchors, 'short');
      expect(m?.riskPerUnit).toBeCloseTo(-5);
      expect(m?.rewardPerUnit).toBeCloseTo(-15);
    });

    it('refuses to divide by a stop sitting on the entry', () => {
      const m = positionMaths(
        [
          { logical: 1, price: 100 },
          { logical: 1, price: 100 },
          { logical: 9, price: 120 },
        ],
        'long',
      );
      expect(m?.rr).toBeNull();
    });
  });

  describe('measuring', () => {
    it('reports change, percent and bars between two points', () => {
      const m = measureBetween({ logical: 0, price: 200 }, { logical: 5, price: 220 });
      expect(m.change).toBeCloseTo(20);
      expect(m.percent).toBeCloseTo(10);
      expect(m.bars).toBe(5);
      expect(m.forward).toBe(true);
    });

    it('counts bars along the chart axis, so a weekend cannot stretch the count', () => {
      // Bar distance is now the chart's own logical spacing rather than
      // elapsed seconds, so a market holiday between the two points does not
      // silently inflate "how many bars was that".
      const m = measureBetween({ logical: 3, price: 100 }, { logical: 10, price: 90 });
      expect(m.bars).toBe(7);
      expect(m.forward).toBe(true);
    });

    it('reports a backwards measurement as backwards', () => {
      expect(measureBetween({ logical: 10, price: 100 }, { logical: 4, price: 100 }).forward).toBe(false);
    });
  });

  describe('the magnet', () => {
    const candles = [
      { open: 10, high: 12, low: 9, close: 11 },
      { open: 11, high: 15, low: 10, close: 14 },
    ];

    it('pulls the price to a nearby high or low', () => {
      // One price unit per pixel, so a 12-pixel threshold is 12 price units.
      const snapped = magnetTo(candles, { logical: 1.2, price: 14.6 }, 1);
      expect(snapped.price).toBe(15);
    });

    it('never moves the drawing sideways, even when it snaps the price', () => {
      // The old version rounded onto the nearest bar, which is what made every
      // tool feel like it was fighting the mouse.
      const snapped = magnetTo(candles, { logical: 1.2, price: 14.6 }, 1);
      expect(snapped.logical).toBe(1.2);
    });

    it('leaves the anchor alone when nothing is near', () => {
      expect(magnetTo(candles, { logical: 1.2, price: 500 }, 0.001)).toEqual({ logical: 1.2, price: 500 });
    });

    it('has nothing to snap to past the end of the data', () => {
      expect(magnetTo(candles, { logical: 40, price: 2 }, 1)).toEqual({ logical: 40, price: 2 });
    });
  });

  describe('persistence', () => {
    const drawing: Drawing = {
      id: 'a',
      kind: 'trendline',
      anchors: [
        { logical: 1, price: 2 },
        { logical: 3, price: 4 },
      ],
      colour: '#fff',
    };

    it('survives a round trip', () => {
      expect(deserialise(serialise([drawing]))).toEqual([drawing]);
    });

    it('loses drawings rather than the chart when the stored data is rubbish', () => {
      // Every one of these has been a real bug in some app: no storage, a
      // half-written value, a shape from an older version.
      expect(deserialise(null)).toEqual([]);
      expect(deserialise('{not json')).toEqual([]);
      expect(deserialise('{"a":1}')).toEqual([]);
      expect(deserialise('[{"id":"x","kind":"not-a-tool","anchors":[]}]')).toEqual([]);
      expect(deserialise('[{"id":"x","kind":"trendline","anchors":[{"logical":"soon"}]}]')).toEqual([]);
    });

    it('keeps the good drawings out of a partly-corrupt list', () => {
      expect(deserialise(`[{"id":"bad","kind":"nope","anchors":[]},${JSON.stringify(drawing)}]`)).toEqual([drawing]);
    });
  });
});
