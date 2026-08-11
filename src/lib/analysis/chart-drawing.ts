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
 * A Fibonacci retracement/extension price. `pct` in [0, 100] retraces DOWN
 * from `hi` toward `lo`; `pct` above 100 extends UP past `hi` by the same
 * proportion of the range — the standard convention for a rising swing.
 */
export function retracementLevel(hi: number, lo: number, pct: number): number {
  const range = hi - lo;
  return pct <= 100 ? hi - (range * pct) / 100 : hi + (range * (pct - 100)) / 100;
}
