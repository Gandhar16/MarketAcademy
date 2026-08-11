/**
 * Technical indicators.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE NO-LOOKAHEAD PROPERTY, which is the whole reason this file is careful.
 *
 * Every function here computes value[i] from bars[0..i] ONLY. Nothing reads
 * forward. That is not a stylistic preference — in Chart Replay the learner
 * sees indicators drawn on the bars revealed so far, and an indicator that
 * peeked one bar ahead would silently hand them the future through the back
 * door after all the work spent keeping it off the client.
 *
 * The tests assert this directly: computing an indicator over a prefix must
 * produce exactly the same values as computing it over the whole series and
 * truncating. Any centred or forward-looking smoother would fail that.
 *
 * Series are returned aligned to the input, with `null` where there is not yet
 * enough history. Callers filter nulls out for plotting; they must never be
 * back-filled with a guess.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Candle } from '../market/types';

export type Series = (number | null)[];

// ── Moving averages ─────────────────────────────────────────────────────────

/** Simple moving average over `period` closes. */
export function sma(values: number[], period: number): Series {
  if (period < 1) throw new Error('sma: period must be >= 1');
  const out: Series = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Exponential moving average.
 *
 * Seeded with an SMA of the first `period` values, which is the convention
 * every charting package uses — seeding with the first close alone makes the
 * early values wrong in a way that never quite washes out.
 */
export function ema(values: number[], period: number): Series {
  if (period < 1) throw new Error('ema: period must be >= 1');
  const out: Series = new Array(values.length).fill(null);
  if (values.length < period) return out;

  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;

  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/**
 * Wilder's smoothing — the averaging used by RSI and ATR.
 *
 * It is NOT the same as an EMA of the same period: Wilder uses 1/period as the
 * factor where an EMA uses 2/(period+1). Charting packages that conflate the
 * two produce RSI values that disagree with everyone else's.
 */
export function wilderSmooth(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length < period) return out;

  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = (prev * (period - 1) + values[i]) / period;
    out[i] = prev;
  }
  return out;
}

// ── Momentum ────────────────────────────────────────────────────────────────

/**
 * Relative Strength Index, Wilder's original formulation.
 *
 * Bounded 0–100. The folklore says above 70 is overbought and below 30 is
 * oversold; the T2 base-rate machinery exists precisely so a learner can check
 * that claim rather than inherit it.
 */
export function rsi(closes: number[], period = 14): Series {
  const out: Series = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;

  const gains: number[] = [0];
  const losses: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  // Wilder's seed is the mean of the first `period` changes, which start at
  // index 1 — hence the slice from 1.
  let avgGain = gains.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = rsiFrom(avgGain, avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    out[i] = rsiFrom(avgGain, avgLoss);
  }
  return out;
}

function rsiFrom(avgGain: number, avgLoss: number): number {
  // No losses at all means maximum strength; the RS ratio would divide by zero.
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export interface MacdResult {
  macd: Series;
  signal: Series;
  histogram: Series;
}

/** MACD: the gap between two EMAs, and an EMA of that gap. */
export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);

  const line: Series = closes.map((_, i) =>
    fastEma[i] == null || slowEma[i] == null ? null : (fastEma[i] as number) - (slowEma[i] as number),
  );

  // The signal line is an EMA of the MACD line, which only exists from the
  // point the slow EMA does — so it is computed on the defined tail and mapped
  // back into place rather than being fed nulls.
  const firstDefined = line.findIndex((v) => v != null);
  const signal: Series = new Array(closes.length).fill(null);
  const histogram: Series = new Array(closes.length).fill(null);

  if (firstDefined !== -1) {
    const defined = line.slice(firstDefined).map((v) => v as number);
    const sig = ema(defined, signalPeriod);
    for (let i = 0; i < sig.length; i++) {
      const at = firstDefined + i;
      signal[at] = sig[i];
      if (sig[i] != null && line[at] != null) histogram[at] = (line[at] as number) - (sig[i] as number);
    }
  }

  return { macd: line, signal, histogram };
}

// ── Volatility ──────────────────────────────────────────────────────────────

export interface BollingerResult {
  middle: Series;
  upper: Series;
  lower: Series;
  /** (upper − lower) ÷ middle. Narrow bands are the "squeeze" traders watch. */
  bandwidth: Series;
}

/** Bollinger Bands: an SMA with a standard-deviation envelope. */
export function bollinger(closes: number[], period = 20, stdDevs = 2): BollingerResult {
  const middle = sma(closes, period);
  const upper: Series = new Array(closes.length).fill(null);
  const lower: Series = new Array(closes.length).fill(null);
  const bandwidth: Series = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const mean = middle[i] as number;
    const window = closes.slice(i - period + 1, i + 1);
    // Population standard deviation, matching the charting convention.
    const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + stdDevs * sd;
    lower[i] = mean - stdDevs * sd;
    bandwidth[i] = mean === 0 ? null : ((upper[i] as number) - (lower[i] as number)) / mean;
  }

  return { middle, upper, lower, bandwidth };
}

/**
 * Average True Range — the practical measure of how far a thing moves in a bar.
 *
 * True range includes the gap from the previous close, which is why it is the
 * right input to a stop distance and a plain high-minus-low is not.
 */
export function atr(bars: Candle[], period = 14): Series {
  if (bars.length === 0) return [];
  const trueRanges: number[] = [bars[0].high - bars[0].low];
  for (let i = 1; i < bars.length; i++) {
    const prevClose = bars[i - 1].close;
    trueRanges.push(
      Math.max(bars[i].high - bars[i].low, Math.abs(bars[i].high - prevClose), Math.abs(bars[i].low - prevClose)),
    );
  }
  return wilderSmooth(trueRanges, period);
}

// ── Volume-based ────────────────────────────────────────────────────────────

/**
 * Volume-weighted average price, cumulative from the first bar supplied.
 *
 * A genuine intraday VWAP resets each session. On a daily series there is no
 * session to reset, so this is an anchored VWAP from the start of the window —
 * which is a real tool traders use, and is labelled as such in the UI rather
 * than pretending to be the intraday one.
 */
export function vwap(bars: Candle[]): Series {
  const out: Series = new Array(bars.length).fill(null);
  let cumPV = 0;
  let cumV = 0;
  for (let i = 0; i < bars.length; i++) {
    const v = bars[i].volume;
    if (v == null || v <= 0) {
      out[i] = cumV > 0 ? cumPV / cumV : null;
      continue;
    }
    const typical = (bars[i].high + bars[i].low + bars[i].close) / 3;
    cumPV += typical * v;
    cumV += v;
    out[i] = cumPV / cumV;
  }
  return out;
}

// ── Registry ────────────────────────────────────────────────────────────────

export type IndicatorId =
  | 'sma20'
  | 'sma50'
  | 'ema9'
  | 'ema21'
  | 'bollinger'
  | 'vwap'
  | 'rsi'
  | 'macd'
  | 'atr'
  | 'volume';

export interface IndicatorDef {
  id: IndicatorId;
  label: string;
  /** 'overlay' draws on the price chart; 'pane' gets its own strip below. */
  placement: 'overlay' | 'pane';
  /** One line on what it is for, shown in the toolbar. */
  hint: string;
  /** Bars needed before the first value exists. Shown so nobody wonders why it is blank. */
  warmup: number;
}

export const INDICATORS: IndicatorDef[] = [
  { id: 'sma20', label: 'SMA 20', placement: 'overlay', hint: 'Average close of the last 20 bars', warmup: 20 },
  { id: 'sma50', label: 'SMA 50', placement: 'overlay', hint: 'Slower average — the longer-term drift', warmup: 50 },
  { id: 'ema9', label: 'EMA 9', placement: 'overlay', hint: 'Fast exponential average, weights recent bars', warmup: 9 },
  { id: 'ema21', label: 'EMA 21', placement: 'overlay', hint: 'Medium exponential average', warmup: 21 },
  { id: 'bollinger', label: 'Bollinger', placement: 'overlay', hint: '20-bar average ± 2 standard deviations', warmup: 20 },
  { id: 'vwap', label: 'VWAP', placement: 'overlay', hint: 'Volume-weighted average from the start of the window', warmup: 1 },
  { id: 'volume', label: 'Volume', placement: 'pane', hint: 'Shares traded per bar', warmup: 1 },
  { id: 'rsi', label: 'RSI 14', placement: 'pane', hint: 'Momentum, 0–100. Folklore: >70 overbought, <30 oversold', warmup: 15 },
  { id: 'macd', label: 'MACD', placement: 'pane', hint: 'Gap between a fast and slow EMA, plus its own average', warmup: 26 },
  { id: 'atr', label: 'ATR 14', placement: 'pane', hint: 'Average true range — how far it moves in a bar', warmup: 14 },
];

export const INDICATORS_BY_ID = new Map(INDICATORS.map((i) => [i.id, i]));

export interface ComputedIndicators {
  sma20: Series;
  sma50: Series;
  ema9: Series;
  ema21: Series;
  bollinger: BollingerResult;
  vwap: Series;
  rsi: Series;
  macd: MacdResult;
  atr: Series;
}

/**
 * Compute everything at once from the bars the learner can currently see.
 *
 * Callers MUST pass only visible bars. In Chart Replay that is the whole point:
 * the indicator redraws as each bar arrives, exactly as it would live, and it
 * cannot know anything the learner does not.
 */
export function computeIndicators(bars: Candle[]): ComputedIndicators {
  const closes = bars.map((b) => b.close);
  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    ema9: ema(closes, 9),
    ema21: ema(closes, 21),
    bollinger: bollinger(closes, 20, 2),
    vwap: vwap(bars),
    rsi: rsi(closes, 14),
    macd: macd(closes),
    atr: atr(bars, 14),
  };
}

/** The latest defined value of a series — what a readout should show. */
export function latest(series: Series): number | null {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] != null) return series[i];
  }
  return null;
}
