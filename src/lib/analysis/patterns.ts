/**
 * Candlestick pattern detection and BASE RATES.
 *
 * This module exists to answer one question honestly: does this pattern
 * actually work? PLAN.md T2 promises "technical analysis *with base rates*",
 * and the base rate is the comparison nobody makes.
 *
 * A pattern that is followed by an up move 54% of the time sounds like an edge
 * until you notice the market was up 53% of the time anyway. The number that
 * matters is not the hit rate — it is the hit rate MINUS the unconditional
 * base rate, and whether that difference survives the sample size.
 *
 * Everything here runs on real OHLCV. No pattern is scored against generated
 * data, because a pattern's usefulness is an empirical claim about a real
 * market and nothing else.
 */
import type { Candle } from '../market/types';

export type PatternId =
  | 'bullish-engulfing'
  | 'bearish-engulfing'
  | 'hammer'
  | 'shooting-star'
  | 'doji'
  | 'gap-up'
  | 'gap-down'
  | 'inside-bar'
  | 'three-up-days'
  | 'three-down-days'
  | 'morning-star'
  | 'evening-star'
  | 'three-white-soldiers'
  | 'three-black-crows'
  | 'bullish-harami'
  | 'bearish-harami';

export interface PatternDefinition {
  id: PatternId;
  label: string;
  /** What the folklore says it means. Deliberately quoted, not endorsed. */
  folklore: string;
  /** Bars of history the detector needs before it can fire. */
  lookback: number;
  detect: (bars: Candle[], i: number) => boolean;
}

const body = (c: Candle) => Math.abs(c.close - c.open);
const range = (c: Candle) => c.high - c.low;
const upperWick = (c: Candle) => c.high - Math.max(c.open, c.close);
const lowerWick = (c: Candle) => Math.min(c.open, c.close) - c.low;
const isUp = (c: Candle) => c.close > c.open;
const isDown = (c: Candle) => c.close < c.open;

export const PATTERNS: PatternDefinition[] = [
  {
    id: 'bullish-engulfing',
    label: 'Bullish engulfing',
    folklore: 'A big green candle swallowing the prior red one signals a reversal upward.',
    lookback: 1,
    detect: (b, i) => {
      const prev = b[i - 1];
      const cur = b[i];
      return isDown(prev) && isUp(cur) && cur.open <= prev.close && cur.close >= prev.open && body(cur) > body(prev);
    },
  },
  {
    id: 'bearish-engulfing',
    label: 'Bearish engulfing',
    folklore: 'A big red candle swallowing the prior green one signals a reversal downward.',
    lookback: 1,
    detect: (b, i) => {
      const prev = b[i - 1];
      const cur = b[i];
      return isUp(prev) && isDown(cur) && cur.open >= prev.close && cur.close <= prev.open && body(cur) > body(prev);
    },
  },
  {
    id: 'hammer',
    label: 'Hammer',
    folklore: 'A long lower wick after a decline means buyers stepped in — a bottom is forming.',
    lookback: 3,
    detect: (b, i) => {
      const c = b[i];
      if (range(c) <= 0) return false;
      const downtrend = b[i].close < b[i - 3].close;
      return downtrend && lowerWick(c) >= 2 * body(c) && upperWick(c) <= body(c) * 0.5;
    },
  },
  {
    id: 'shooting-star',
    label: 'Shooting star',
    folklore: 'A long upper wick after a rally means sellers took over — a top is forming.',
    lookback: 3,
    detect: (b, i) => {
      const c = b[i];
      if (range(c) <= 0) return false;
      const uptrend = b[i].close > b[i - 3].close;
      return uptrend && upperWick(c) >= 2 * body(c) && lowerWick(c) <= body(c) * 0.5;
    },
  },
  {
    id: 'doji',
    label: 'Doji',
    folklore: 'Open and close nearly equal means indecision, and indecision precedes a turn.',
    lookback: 1,
    detect: (b, i) => {
      const c = b[i];
      return range(c) > 0 && body(c) <= range(c) * 0.1;
    },
  },
  {
    id: 'gap-up',
    label: 'Gap up',
    folklore: 'An opening gap up shows demand and tends to keep running.',
    lookback: 1,
    detect: (b, i) => b[i].open > b[i - 1].high,
  },
  {
    id: 'gap-down',
    label: 'Gap down',
    folklore: 'An opening gap down shows panic and tends to keep falling.',
    lookback: 1,
    detect: (b, i) => b[i].open < b[i - 1].low,
  },
  {
    id: 'inside-bar',
    label: 'Inside bar',
    folklore: 'A bar contained inside the previous one means compression before a breakout.',
    lookback: 1,
    detect: (b, i) => b[i].high <= b[i - 1].high && b[i].low >= b[i - 1].low,
  },
  {
    id: 'three-up-days',
    label: 'Three up days',
    folklore: 'Momentum begets momentum.',
    lookback: 3,
    detect: (b, i) => isUp(b[i]) && isUp(b[i - 1]) && isUp(b[i - 2]),
  },
  {
    id: 'three-down-days',
    label: 'Three down days',
    folklore: 'Three red days means capitulation and a bounce is due.',
    lookback: 3,
    detect: (b, i) => isDown(b[i]) && isDown(b[i - 1]) && isDown(b[i - 2]),
  },
  {
    id: 'morning-star',
    label: 'Morning star',
    folklore: 'A big down day, a small indecisive day, then a big up day marks a bottom.',
    lookback: 5,
    detect: (b, i) => {
      const c1 = b[i - 2];
      const c2 = b[i - 1];
      const c3 = b[i];
      if (range(c1) <= 0 || range(c2) <= 0 || range(c3) <= 0) return false;
      const downtrend = c1.close < b[i - 5].close;
      const firstBearish = isDown(c1) && body(c1) >= range(c1) * 0.5;
      const secondSmall = body(c2) <= body(c1) * 0.4;
      const midpoint = (c1.open + c1.close) / 2;
      const thirdBullish = isUp(c3) && c3.close > midpoint;
      return downtrend && firstBearish && secondSmall && thirdBullish;
    },
  },
  {
    id: 'evening-star',
    label: 'Evening star',
    folklore: 'A big up day, a small indecisive day, then a big down day marks a top.',
    lookback: 5,
    detect: (b, i) => {
      const c1 = b[i - 2];
      const c2 = b[i - 1];
      const c3 = b[i];
      if (range(c1) <= 0 || range(c2) <= 0 || range(c3) <= 0) return false;
      const uptrend = c1.close > b[i - 5].close;
      const firstBullish = isUp(c1) && body(c1) >= range(c1) * 0.5;
      const secondSmall = body(c2) <= body(c1) * 0.4;
      const midpoint = (c1.open + c1.close) / 2;
      const thirdBearish = isDown(c3) && c3.close < midpoint;
      return uptrend && firstBullish && secondSmall && thirdBearish;
    },
  },
  {
    id: 'three-white-soldiers',
    label: 'Three white soldiers',
    folklore: 'Three solid up days in a row, each closing higher, confirms a new uptrend.',
    lookback: 2,
    detect: (b, i) => {
      const c1 = b[i - 2];
      const c2 = b[i - 1];
      const c3 = b[i];
      const solid = (c: Candle) => range(c) > 0 && body(c) >= range(c) * 0.5;
      return (
        isUp(c1) && isUp(c2) && isUp(c3) &&
        solid(c1) && solid(c2) && solid(c3) &&
        c2.close > c1.close && c3.close > c2.close &&
        c2.open > c1.open && c3.open > c2.open
      );
    },
  },
  {
    id: 'three-black-crows',
    label: 'Three black crows',
    folklore: 'Three solid down days in a row, each closing lower, confirms a new downtrend.',
    lookback: 2,
    detect: (b, i) => {
      const c1 = b[i - 2];
      const c2 = b[i - 1];
      const c3 = b[i];
      const solid = (c: Candle) => range(c) > 0 && body(c) >= range(c) * 0.5;
      return (
        isDown(c1) && isDown(c2) && isDown(c3) &&
        solid(c1) && solid(c2) && solid(c3) &&
        c2.close < c1.close && c3.close < c2.close &&
        c2.open < c1.open && c3.open < c2.open
      );
    },
  },
  {
    id: 'bullish-harami',
    label: 'Bullish harami',
    folklore: 'A small green body tucked inside the prior big red one signals selling has stalled.',
    lookback: 1,
    detect: (b, i) => {
      const prev = b[i - 1];
      const cur = b[i];
      if (body(prev) <= 0) return false;
      const prevLo = Math.min(prev.open, prev.close);
      const prevHi = Math.max(prev.open, prev.close);
      return isDown(prev) && isUp(cur) && cur.open >= prevLo && cur.close <= prevHi && body(cur) < body(prev) * 0.6;
    },
  },
  {
    id: 'bearish-harami',
    label: 'Bearish harami',
    folklore: 'A small red body tucked inside the prior big green one signals buying has stalled.',
    lookback: 1,
    detect: (b, i) => {
      const prev = b[i - 1];
      const cur = b[i];
      if (body(prev) <= 0) return false;
      const prevLo = Math.min(prev.open, prev.close);
      const prevHi = Math.max(prev.open, prev.close);
      return isUp(prev) && isDown(cur) && cur.open <= prevHi && cur.close >= prevLo && body(cur) < body(prev) * 0.6;
    },
  },
];

export const PATTERNS_BY_ID = new Map(PATTERNS.map((p) => [p.id, p]));

export interface PatternStats {
  patternId: PatternId;
  label: string;
  folklore: string;
  /** How many times the pattern fired in this sample. */
  occurrences: number;
  /** Bars held after the signal. */
  horizon: number;
  /** Share of signals followed by a positive return over the horizon. */
  hitRate: number;
  /** Share of ALL bars followed by a positive return — the comparison that matters. */
  baseRate: number;
  /** hitRate − baseRate, in percentage points. The actual claim being tested. */
  edge: number;
  /** Mean forward return after the signal, as a percentage. */
  meanReturn: number;
  /** Mean forward return over all bars, as a percentage. */
  baseMeanReturn: number;
  /**
   * Rough two-proportion z-score for hitRate vs baseRate. |z| under about 2
   * means the difference is indistinguishable from noise at this sample size.
   */
  zScore: number;
  /** Total bars examined. */
  sampleSize: number;
}

/** Forward return from bar i to bar i+horizon, as a percentage of close. */
function forwardReturn(bars: Candle[], i: number, horizon: number): number | null {
  const target = i + horizon;
  if (target >= bars.length) return null;
  const from = bars[i].close;
  if (from <= 0) return null;
  return ((bars[target].close - from) / from) * 100;
}

/**
 * Score one pattern against a real series.
 *
 * Note what this deliberately does NOT do: it does not optimise the horizon, or
 * the detection thresholds, or select the best-performing symbol. Every one of
 * those is a way to manufacture an edge that will not repeat, and teaching the
 * learner to distrust exactly that is the point of the lesson.
 */
export function patternStats(bars: Candle[], patternId: PatternId, horizon = 5): PatternStats {
  const def = PATTERNS_BY_ID.get(patternId);
  if (!def) throw new Error(`Unknown pattern: ${patternId}`);

  const signalReturns: number[] = [];
  const allReturns: number[] = [];

  for (let i = def.lookback; i < bars.length - horizon; i++) {
    const r = forwardReturn(bars, i, horizon);
    if (r == null) continue;
    allReturns.push(r);
    if (def.detect(bars, i)) signalReturns.push(r);
  }

  const share = (xs: number[]) => (xs.length === 0 ? 0 : xs.filter((r) => r > 0).length / xs.length);
  const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

  const hitRate = share(signalReturns);
  const baseRate = share(allReturns);

  // Two-proportion z-test. Approximate and stated as such — its job is to tell
  // a learner "this sample is too small to conclude anything", which it does
  // well enough without a statistics library.
  const n1 = signalReturns.length;
  const n2 = allReturns.length;
  let zScore = 0;
  if (n1 > 0 && n2 > 0) {
    const pooled = (hitRate * n1 + baseRate * n2) / (n1 + n2);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
    zScore = se > 0 ? (hitRate - baseRate) / se : 0;
  }

  return {
    patternId,
    label: def.label,
    folklore: def.folklore,
    occurrences: n1,
    horizon,
    hitRate,
    baseRate,
    edge: (hitRate - baseRate) * 100,
    meanReturn: mean(signalReturns),
    baseMeanReturn: mean(allReturns),
    zScore,
    sampleSize: n2,
  };
}

export function allPatternStats(bars: Candle[], horizon = 5): PatternStats[] {
  return PATTERNS.map((p) => patternStats(bars, p.id, horizon));
}

/** A plain-language verdict, so the UI does not have to interpret a z-score. */
export function verdictFor(stats: PatternStats): { verdict: 'noise' | 'weak' | 'notable'; text: string } {
  if (stats.occurrences < 30) {
    return {
      verdict: 'noise',
      text: `Only ${stats.occurrences} occurrences. That is too few to conclude anything at all — any apparent edge here is a coin-flip artefact.`,
    };
  }
  if (Math.abs(stats.zScore) < 2) {
    return {
      verdict: 'noise',
      text: `The hit rate is ${(stats.hitRate * 100).toFixed(1)}% against a base rate of ${(stats.baseRate * 100).toFixed(1)}%. With ${stats.occurrences} occurrences that difference is indistinguishable from noise.`,
    };
  }
  if (Math.abs(stats.edge) < 5) {
    return {
      verdict: 'weak',
      text: `Statistically detectable but small: ${stats.edge > 0 ? '+' : ''}${stats.edge.toFixed(1)} points over the base rate. Before trading it, check whether the costs of trading it exceed that.`,
    };
  }
  return {
    verdict: 'notable',
    text: `${stats.edge > 0 ? '+' : ''}${stats.edge.toFixed(1)} points over the base rate across ${stats.occurrences} occurrences. Worth investigating — on this one symbol, over this one period, which is not the same as a durable edge.`,
  };
}
