/**
 * Server-side replay sessions.
 *
 * This closes the gap flagged in PLAN.md: previously the whole replay window
 * was fetched in one request, so although no *code* could read ahead, a human
 * with a network tab could. Now the server holds the bars and hands them over
 * one at a time, refusing to serve bar N+2 before bar N+1 has been taken.
 *
 * The guarantee is therefore no longer "our code cannot cheat" but "the future
 * is not on the client at all". That is what PLAN.md §7.2 actually promised.
 *
 * State lives in a module-level Map. That is deliberate and sufficient: a
 * replay is a short, disposable, single-player thing, losing one on a deploy
 * costs a learner ten minutes, and a database for this would be architecture
 * for its own sake. It is documented as a constraint rather than hidden.
 */
import { randomUUID } from 'node:crypto';
import type { Candle } from '../market/types';
import { getHistory } from '../market/service';
import { MarketDataError } from '../market/types';

/**
 * A round-trip the server itself watched happen: opened at a price it dealt,
 * closed at a price it dealt, everything else derived from those two numbers
 * — not accepted as an assertion from the browser. See `openPosition` and
 * `closePosition` for why this exists and what it deliberately does not cover.
 */
export interface RecordedTrade {
  pnl: number;
  stoppedOut: boolean;
  plannedRR: number | null;
  preCommitted: boolean;
  riskFraction: number;
  sizedFromStop: true;
}

export interface OpenPosition {
  id: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  entryIndex: number;
  stopPrice: number;
  targetPrice: number | null;
  hasThesis: boolean;
}

export interface ServerReplaySession {
  id: string;
  symbol: string;
  /** ALL bars. Never serialised to a response in full before the end. */
  candles: Candle[];
  warmupBars: number;
  /** Index of the last bar the client has been given. */
  cursor: number;
  tickSize: number;
  createdAt: number;
  lastTouchedAt: number;
  /** At most one position at a time — this game never lets you hold two. */
  open: OpenPosition | null;
  /** Every round-trip closed in this session, in the order it happened. */
  positions: RecordedTrade[];
}

const SESSIONS = new Map<string, ServerReplaySession>();

/** Sessions older than this without a step are dropped. */
export const SESSION_TTL_MS = 60 * 60_000;
/** Hard cap so a scripted client cannot exhaust server memory. */
export const MAX_SESSIONS = 500;

export const REPLAY_POOL = [
  'RELIANCE.NS',
  'HDFCBANK.NS',
  'INFY.NS',
  'ITC.NS',
  'TATAMOTORS.NS',
  'SBIN.NS',
  'MARUTI.NS',
  'SUNPHARMA.NS',
];

/**
 * Roughly seven months of daily bars shown before the learner has to act —
 * enough to actually mark a trendline, a support zone or a chart pattern on
 * real history rather than guessing from a handful of candles. Raised from
 * 60 (three months) after feedback that there was not enough history on
 * screen to analyse before the replay portion began.
 */
export const WARMUP_BARS = 150;
export const SESSION_BARS = 60;

function sweep(now = Date.now()): void {
  for (const [id, s] of SESSIONS) {
    if (now - s.lastTouchedAt > SESSION_TTL_MS) SESSIONS.delete(id);
  }
  // If still over the cap, drop the least recently touched.
  if (SESSIONS.size >= MAX_SESSIONS) {
    const sorted = [...SESSIONS.values()].sort((a, b) => a.lastTouchedAt - b.lastTouchedAt);
    for (const s of sorted.slice(0, Math.ceil(MAX_SESSIONS * 0.2))) SESSIONS.delete(s.id);
  }
}

export interface StartedReplay {
  sessionId: string;
  /** Only the warm-up bars. The rest do not leave the server yet. */
  warmup: Candle[];
  totalBars: number;
  remaining: number;
  tickSize: number;
}

export async function startReplay(opts: { symbol?: string; seed?: number } = {}): Promise<StartedReplay> {
  sweep();

  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const symbol = opts.symbol ?? REPLAY_POOL[seed % REPLAY_POOL.length];

  const to = Date.now();
  const from = to - 5 * 366 * 86_400_000;
  const series = await getHistory({ symbol, interval: '1d', from, to });

  const need = WARMUP_BARS + SESSION_BARS;
  if (series.candles.length < need + 10) {
    throw new MarketDataError(`Not enough history for ${symbol} to run a replay.`, 503);
  }

  // A deterministic-but-varied window, so the same symbol does not always
  // replay the same stretch of history.
  const maxStart = series.candles.length - need;
  const startAt = seed % Math.max(1, maxStart);
  const candles = series.candles.slice(startAt, startAt + need);

  const now = Date.now();
  const session: ServerReplaySession = {
    id: randomUUID(),
    symbol,
    candles,
    warmupBars: WARMUP_BARS,
    cursor: WARMUP_BARS - 1,
    tickSize: 0.05,
    createdAt: now,
    lastTouchedAt: now,
    open: null,
    positions: [],
  };
  SESSIONS.set(session.id, session);

  return {
    sessionId: session.id,
    warmup: candles.slice(0, WARMUP_BARS),
    totalBars: candles.length,
    remaining: candles.length - WARMUP_BARS,
    tickSize: session.tickSize,
  };
}

export interface SteppedBar {
  bar: Candle;
  index: number;
  remaining: number;
  finished: boolean;
  /** Everything the client's fill engine needs, computed server-side. */
  averageVolume: number | null;
  previousClose: number;
}

export const VOLUME_WINDOW = 20;

/**
 * Hand over exactly one bar and advance the cursor.
 *
 * There is no index parameter. The client cannot ask for a bar; it can only ask
 * for THE NEXT one. That is what makes reading ahead impossible rather than
 * merely inconvenient.
 */
export function stepReplay(sessionId: string): SteppedBar {
  const s = SESSIONS.get(sessionId);
  if (!s) {
    throw new MarketDataError('Replay session not found or expired. Start a new replay.', 404);
  }

  s.lastTouchedAt = Date.now();

  if (s.cursor >= s.candles.length - 1) {
    return {
      bar: s.candles[s.cursor],
      index: s.cursor,
      remaining: 0,
      finished: true,
      averageVolume: averageVolumeAt(s, s.cursor),
      previousClose: s.candles[Math.max(0, s.cursor - 1)].close,
    };
  }

  const previousClose = s.candles[s.cursor].close;
  const averageVolume = averageVolumeAt(s, s.cursor);
  s.cursor += 1;

  return {
    bar: s.candles[s.cursor],
    index: s.cursor,
    remaining: s.candles.length - 1 - s.cursor,
    finished: s.cursor >= s.candles.length - 1,
    averageVolume,
    previousClose,
  };
}

function averageVolumeAt(s: ServerReplaySession, cursor: number): number | null {
  const start = Math.max(0, cursor - VOLUME_WINDOW + 1);
  const vols = s.candles.slice(start, cursor + 1).map((c) => c.volume).filter((v): v is number => v != null);
  if (vols.length === 0) return null;
  return vols.reduce((a, b) => a + b, 0) / vols.length;
}

/**
 * The stop, as a percentage of entry. Mirrors the 0.5–10% range the
 * ChartReplay slider actually offers — enforced here too, so a client that
 * skips the slider and calls this endpoint directly cannot declare a stop a
 * tick away from entry to manufacture a near-zero `riskFraction`.
 */
const MIN_STOP_PCT = 0.5;
const MAX_STOP_PCT = 10;
/** Mirrors the target slider's 0.5–20% range. */
const MIN_TARGET_PCT = 0.5;
const MAX_TARGET_PCT = 20;
/** Position sizing here is always "half the account, sized from the stop" — see ChartReplay.tsx. */
const FIXED_RISK_SIZING = 0.5;

/**
 * Open a position at the CURRENT bar's close — the same number the client is
 * already showing as "Last", since that is exactly what `s.candles[s.cursor]`
 * is. There is no separate "declare a price" step for a hostile client to lie
 * about: the price used here is the one the server itself just dealt.
 */
export function openPosition(
  sessionId: string,
  opts: { side: 'buy' | 'sell'; stopPct: number; targetPct: number | null; hasThesis: boolean },
): OpenPosition {
  const s = SESSIONS.get(sessionId);
  if (!s) throw new MarketDataError('Replay session not found or expired. Start a new replay.', 404);
  if (s.open) throw new MarketDataError('A position is already open in this session.', 409);
  if (!Number.isFinite(opts.stopPct) || opts.stopPct < MIN_STOP_PCT || opts.stopPct > MAX_STOP_PCT) {
    throw new MarketDataError(`Stop must be between ${MIN_STOP_PCT}% and ${MAX_STOP_PCT}%.`, 400);
  }
  if (
    opts.targetPct != null &&
    (!Number.isFinite(opts.targetPct) || opts.targetPct < MIN_TARGET_PCT || opts.targetPct > MAX_TARGET_PCT)
  ) {
    throw new MarketDataError(`Target must be between ${MIN_TARGET_PCT}% and ${MAX_TARGET_PCT}%.`, 400);
  }

  s.lastTouchedAt = Date.now();
  const entryPrice = s.candles[s.cursor].close;
  const stopPrice = opts.side === 'buy' ? entryPrice * (1 - opts.stopPct / 100) : entryPrice * (1 + opts.stopPct / 100);
  const targetPrice =
    opts.targetPct == null
      ? null
      : opts.side === 'buy'
        ? entryPrice * (1 + opts.targetPct / 100)
        : entryPrice * (1 - opts.targetPct / 100);

  const open: OpenPosition = {
    id: `${sessionId}-${s.positions.length}`,
    side: opts.side,
    entryPrice,
    entryIndex: s.cursor,
    stopPrice,
    targetPrice,
    hasThesis: opts.hasThesis === true,
  };
  s.open = open;
  return open;
}

/**
 * Close the open position at the CURRENT bar's close and record the trade.
 *
 * `pnl`, `stoppedOut`, `plannedRR`, `preCommitted`, `riskFraction` and
 * `sizedFromStop` all come from this — never from the client's own claim
 * about what happened. What is deliberately NOT decided here is whether the
 * exit was calm or a panic: `honouredStop`/`exitedPerPlan` in the game ask
 * about the trader's state of mind at the moment they clicked, which is not
 * a property of prices and bars and has no mechanical test. That half stays
 * self-reported by design, the same way the written reason does.
 */
export function closePosition(sessionId: string, positionId: string): RecordedTrade {
  const s = SESSIONS.get(sessionId);
  if (!s) throw new MarketDataError('Replay session not found or expired. Start a new replay.', 404);
  if (!s.open || s.open.id !== positionId) {
    throw new MarketDataError('No matching open position in this session.', 409);
  }

  s.lastTouchedAt = Date.now();
  const open = s.open;
  const exitPrice = s.candles[s.cursor].close;

  const pnl = open.side === 'buy' ? exitPrice - open.entryPrice : open.entryPrice - exitPrice;
  const stoppedOut = open.side === 'buy' ? exitPrice <= open.stopPrice : exitPrice >= open.stopPrice;
  const plannedRR =
    open.targetPrice == null
      ? null
      : Math.abs(open.targetPrice - open.entryPrice) / Math.abs(open.entryPrice - open.stopPrice);
  const stopDistance = Math.abs(open.entryPrice - open.stopPrice) / open.entryPrice;

  const trade: RecordedTrade = {
    pnl,
    stoppedOut,
    plannedRR,
    preCommitted: open.hasThesis,
    riskFraction: stopDistance * FIXED_RISK_SIZING,
    sizedFromStop: true,
  };

  s.positions.push(trade);
  s.open = null;
  return trade;
}

/** Every trade this session has actually closed, in order. */
export function getRecordedTrades(sessionId: string): RecordedTrade[] | null {
  const s = SESSIONS.get(sessionId);
  return s ? s.positions : null;
}

export interface RevealedReplay {
  symbol: string;
  candles: Candle[];
}

/**
 * The debrief. Refuses to reveal anything until the replay is genuinely over —
 * the same guard as the client engine, enforced where it actually counts.
 */
export function revealReplay(sessionId: string): RevealedReplay {
  const s = SESSIONS.get(sessionId);
  if (!s) throw new MarketDataError('Replay session not found or expired.', 404);
  if (s.cursor < s.candles.length - 1) {
    throw new MarketDataError(
      'The replay is not finished. There is nothing to reveal yet, and asking is how lookahead gets in.',
      409,
    );
  }
  s.lastTouchedAt = Date.now();
  return { symbol: s.symbol, candles: s.candles };
}

/** Test seam. */
export function _sessionCount(): number {
  return SESSIONS.size;
}
export function _clearSessions(): void {
  SESSIONS.clear();
}
export function _getSession(id: string): ServerReplaySession | undefined {
  return SESSIONS.get(id);
}
export function _putSession(s: ServerReplaySession): void {
  SESSIONS.set(s.id, s);
}
