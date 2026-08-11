/**
 * Pure geometry for the technical-analysis figures — finding real swing
 * points and pivot lows on real bars, and the Fibonacci retracement formula.
 *
 * Split out from the React components in `components/visuals/ta-tools.tsx`
 * for the same reason `patterns.ts` is split from `patterns.tsx`: these are
 * deterministic functions over real OHLCV, and they should be testable
 * without a browser. None of this invents data — it finds real features in
 * whatever real bars the caller passes in.
 */
import type { Candle } from '../market/types';

/**
 * The single largest low-to-high rally in the series — a classic
 * max-profit-style scan. This is the swing a Fibonacci or trendline figure
 * anchors to: found by scanning, not chosen by eye, so it is not cherry-picked
 * to make a nicer-looking chart.
 */
export function findLargestSwing(bars: Candle[]): { lowIdx: number; highIdx: number } {
  if (bars.length === 0) return { lowIdx: 0, highIdx: 0 };
  let bestLowIdx = 0;
  let bestHighIdx = 0;
  let bestRange = -Infinity;
  let runningLowIdx = 0;
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].low < bars[runningLowIdx].low) runningLowIdx = i;
    const range = bars[i].high - bars[runningLowIdx].low;
    if (range > bestRange) {
      bestRange = range;
      bestLowIdx = runningLowIdx;
      bestHighIdx = i;
    }
  }
  return { lowIdx: bestLowIdx, highIdx: bestHighIdx };
}

/**
 * The single largest high-to-low decline in the series — the mirror of
 * `findLargestSwing`, a max-drawdown-style scan. This is what a Fibonacci
 * figure anchors to for a DOWNTREND: the swing high a decline started from,
 * and the swing low it reached, so a retracement can be measured as a
 * bounce back UP toward the high rather than a pullback down from one.
 */
export function findLargestDecline(bars: Candle[]): { highIdx: number; lowIdx: number } {
  if (bars.length === 0) return { highIdx: 0, lowIdx: 0 };
  let bestHighIdx = 0;
  let bestLowIdx = 0;
  let bestRange = -Infinity;
  let runningHighIdx = 0;
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].high > bars[runningHighIdx].high) runningHighIdx = i;
    const range = bars[runningHighIdx].high - bars[i].low;
    if (range > bestRange) {
      bestRange = range;
      bestHighIdx = runningHighIdx;
      bestLowIdx = i;
    }
  }
  return { highIdx: bestHighIdx, lowIdx: bestLowIdx };
}

/** Bars whose low is lower than every bar within `window` places on either side. */
export function findPivotLows(bars: Candle[], window: number): number[] {
  const pivots: number[] = [];
  for (let i = window; i < bars.length - window; i++) {
    let isPivot = true;
    for (let k = 1; k <= window; k++) {
      if (bars[i].low > bars[i - k].low || bars[i].low > bars[i + k].low) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) pivots.push(i);
  }
  return pivots;
}

/**
 * Two real swing lows a rising trendline could be drawn through: the first
 * pivot low found, and the next pivot low after it that sits HIGHER (a
 * genuine higher low, not just any second point). Widens the pivot window
 * on failure rather than inventing a point, so it can return `null` — an
 * honest "no clean two-point line in this window" rather than a fake one.
 */
export function findTrendlineAnchors(bars: Candle[]): { p1: number; p2: number } | null {
  for (const window of [3, 2, 1]) {
    const pivots = findPivotLows(bars, window);
    if (pivots.length < 2) continue;
    const p1 = pivots[0];
    const p2 = pivots.slice(1).find((i) => bars[i].low > bars[p1].low);
    if (p2 != null) return { p1, p2 };
  }
  return null;
}

/** Bars whose high is higher than every bar within `window` places on either side. */
export function findPivotHighs(bars: Candle[], window: number): number[] {
  const pivots: number[] = [];
  for (let i = window; i < bars.length - window; i++) {
    let isPivot = true;
    for (let k = 1; k <= window; k++) {
      if (bars[i].high < bars[i - k].high || bars[i].high < bars[i + k].high) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) pivots.push(i);
  }
  return pivots;
}

/**
 * Two real swing highs a falling trendline could be drawn through — the
 * mirror of `findTrendlineAnchors` for a downtrend: the first pivot high
 * found, and the next pivot high after it that sits LOWER (a genuine lower
 * high). Drawn through resistance instead of support, sloping down instead
 * of up. Same honesty rule: `null` rather than an invented second point.
 */
export function findFallingTrendlineAnchors(bars: Candle[]): { p1: number; p2: number } | null {
  for (const window of [3, 2, 1]) {
    const pivots = findPivotHighs(bars, window);
    if (pivots.length < 2) continue;
    const p1 = pivots[0];
    const p2 = pivots.slice(1).find((i) => bars[i].high < bars[p1].high);
    if (p2 != null) return { p1, p2 };
  }
  return null;
}

/**
 * The first bar, after `afterIdx`, whose low sits within `tolerance` of the
 * line projected from (p1, p2) through it — a real third touch, if one
 * exists in the window. Returns `null` when the line has not been tested
 * again yet, which is the ordinary case and worth showing honestly.
 */
export function findLineTouch(
  bars: Candle[],
  p1: number,
  p2: number,
  afterIdx: number,
  tolerance = 0.012,
): number | null {
  const slope = (bars[p2].low - bars[p1].low) / (p2 - p1);
  const lineAt = (i: number) => bars[p1].low + slope * (i - p1);
  for (let i = afterIdx; i < bars.length; i++) {
    const proj = lineAt(i);
    if (proj <= 0) continue;
    const gap = Math.abs(bars[i].low - proj) / proj;
    if (gap < tolerance) return i;
  }
  return null;
}

/**
 * The mirror of `findLineTouch` for a falling trendline drawn through swing
 * HIGHS: the first bar, after `afterIdx`, whose high sits within `tolerance`
 * of the line projected from (p1, p2) — a real test of resistance from
 * below, if one exists in the window.
 */
export function findLineTouchHigh(
  bars: Candle[],
  p1: number,
  p2: number,
  afterIdx: number,
  tolerance = 0.012,
): number | null {
  const slope = (bars[p2].high - bars[p1].high) / (p2 - p1);
  const lineAt = (i: number) => bars[p1].high + slope * (i - p1);
  for (let i = afterIdx; i < bars.length; i++) {
    const proj = lineAt(i);
    if (proj <= 0) continue;
    const gap = Math.abs(bars[i].high - proj) / proj;
    if (gap < tolerance) return i;
  }
  return null;
}

/**
 * A Fibonacci retracement/extension price. Direction-agnostic on purpose:
 * `from` is wherever the retracement STARTS (0%) and `to` is wherever it
 * ENDS (100%); `pct` above 100 extends past `from`, away from `to`, by the
 * same proportion of the range.
 *
 * For an UPTREND, call `retracementLevel(swingHigh, swingLow, pct)` — 0% is
 * the high, 100% is the low (a pullback down), and extensions project
 * further ABOVE the high (the next leg up, if the rally resumes).
 *
 * For a DOWNTREND, call it with the arguments swapped:
 * `retracementLevel(swingLow, swingHigh, pct)` — 0% is the low, 100% is the
 * high (a bounce up), and extensions project further BELOW the low (the
 * next leg down, if the decline resumes). Same formula, same function —
 * only which real price gets passed first changes.
 */
export function retracementLevel(from: number, to: number, pct: number): number {
  const range = to - from;
  return pct <= 100 ? from + (range * pct) / 100 : from - (range * (pct - 100)) / 100;
}

/**
 * Heikin-Ashi bars from real OHLC. Each HA close is the average of that
 * bar's own four real prices; each HA open is the midpoint of the PREVIOUS
 * HA bar, which is what makes the series smooth — and why HA prices are not
 * real trade prices. The first bar has no predecessor, so its HA open falls
 * back to the average of its own open and close, the standard convention.
 */
export function toHeikinAshi(bars: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const haClose = (b.open + b.high + b.low + b.close) / 4;
    const prev = out[i - 1];
    const haOpen = prev ? (prev.open + prev.close) / 2 : (b.open + b.close) / 2;
    const haHigh = Math.max(b.high, haOpen, haClose);
    const haLow = Math.min(b.low, haOpen, haClose);
    out.push({ time: b.time, open: haOpen, high: haHigh, low: haLow, close: haClose, volume: b.volume });
  }
  return out;
}
