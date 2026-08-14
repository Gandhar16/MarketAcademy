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
  /**
   * How the position actually closed. 'stop' and 'target' are mechanical —
   * the server closed it because the level was reached, not because the
   * learner clicked anything — 'session-end' is the replay running out of
   * bars with a position still open (squared off at the last price, the way
   * a real position would be marked at the close of trading), and 'manual'
   * is the one genuinely self-reported case: the learner chose to exit
   * before either level was reached. See closePosition() for why only the
   * manual case still asks the learner about their state of mind.
   */
  reason: 'stop' | 'target' | 'session-end' | 'manual';
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
  /**
   * How many of `positions`, from the front, have already been filed as a
   * scored run — see nextUnfiledTrade/markTradeFiled. A trade is filed the
   * instant it closes (see ChartReplay.tsx), not batched to the end of the
   * session, so this is almost always `positions.length - 1` or
   * `positions.length` rather than 0.
   */
  filedCount: number;
}

const SESSIONS = new Map<string, ServerReplaySession>();

/** Sessions older than this without a step are dropped. */
export const SESSION_TTL_MS = 60 * 60_000;
/** Hard cap so a scripted client cannot exhaust server memory. */
export const MAX_SESSIONS = 500;

/**
 * A large, liquid Nifty 50-style basket — the same "boring on purpose"
 * reasoning as INDIA_EQUITIES in lib/market/symbols.ts: long-tenured
 * large-caps that are unlikely to be delisted or renamed out from under a
 * replay. Index membership itself drifts a little over time (additions and
 * removals happen every few months), so this is not asserted as the exact
 * current 50 names — it is a wide, varied set of the kind of stock that
 * genuinely is one, which is what a replay actually needs.
 *
 * Wide on purpose: a pool of 8 meant every session was drawing from the same
 * handful of charts, and any one symbol's Yahoo history request failing
 * (rate limits, a cold cookie handshake — see withRetry in lib/market/yahoo.ts)
 * had an outsized chance of being the one just picked. `startReplay` below
 * also falls back to a different symbol from this pool on failure rather
 * than surfacing it, so a single flaky name can no longer block the game.
 */
export const REPLAY_POOL = [
  'RELIANCE.NS',
  'HDFCBANK.NS',
  'ICICIBANK.NS',
  'INFY.NS',
  'TCS.NS',
  'ITC.NS',
  'SBIN.NS',
  'BHARTIARTL.NS',
  'HINDUNILVR.NS',
  'LT.NS',
  'KOTAKBANK.NS',
  'AXISBANK.NS',
  'BAJFINANCE.NS',
  'ASIANPAINT.NS',
  'MARUTI.NS',
  'SUNPHARMA.NS',
  'TATAMOTORS.NS',
  'TITAN.NS',
  'ULTRACEMCO.NS',
  'WIPRO.NS',
  'NESTLEIND.NS',
  'POWERGRID.NS',
  'NTPC.NS',
  'ONGC.NS',
  'HCLTECH.NS',
  'TATASTEEL.NS',
  'JSWSTEEL.NS',
  'ADANIENT.NS',
  'ADANIPORTS.NS',
  'BAJAJFINSV.NS',
  'BRITANNIA.NS',
  'CIPLA.NS',
  'COALINDIA.NS',
  'DIVISLAB.NS',
  'DRREDDY.NS',
  'EICHERMOT.NS',
  'GRASIM.NS',
  'HDFCLIFE.NS',
  'HEROMOTOCO.NS',
  'HINDALCO.NS',
  'INDUSINDBK.NS',
  'M&M.NS',
  'SBILIFE.NS',
  'SHREECEM.NS',
  'TECHM.NS',
  'UPL.NS',
  'BPCL.NS',
];

/** How many different symbols `startReplay` will try before giving up. */
const MAX_SYMBOL_ATTEMPTS = 4;

/** Fisher–Yates, seeded so the same seed always tries symbols in the same order — useful for reproducing a report. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = seed >>> 0 || 1;
  const next = () => {
    // xorshift32 — small, fast, and deterministic, which Math.random() is not.
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Roughly nine months of daily bars shown before the learner has to act —
 * enough to actually mark a trendline, a support zone or a chart pattern on
 * real history rather than guessing from a handful of candles. Raised from
 * 60 (three months), then again from 150, after feedback that there was not
 * enough history on screen to analyse before the replay portion began.
 */
export const WARMUP_BARS = 180;
/**
 * Roughly six months of tradeable bars. Raised from 60 (three months) after
 * feedback that a stop or target set inside the game's own allowed range
 * (0.5–20% away — see MIN/MAX_STOP_PCT and MIN/MAX_TARGET_PCT below) could
 * still run out of bars before either was ever reached, forcing a
 * 'session-end' square-off that was neither a plan paying off nor a mistake
 * being caught — just the replay ending arbitrarily underneath the learner.
 * Twice the room makes that a rare edge case again rather than a routine one.
 */
export const SESSION_BARS = 120;

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
  const need = WARMUP_BARS + SESSION_BARS;

  // A fixed symbol (tests, a "replay this one again" feature) gets exactly
  // one attempt, honestly — falling back away from a symbol the caller
  // specifically asked for would be surprising. Otherwise, a random symbol
  // whose upstream request fails or genuinely lacks enough history should
  // not fail the whole game; a different symbol from the same pool is just
  // as good a replay, so try a few before giving up.
  const candidates = opts.symbol ? [opts.symbol] : shuffled(REPLAY_POOL, seed).slice(0, MAX_SYMBOL_ATTEMPTS);

  // A full 25 years, ending now — so the window a replay is drawn from is
  // wide enough that `startAt` below (seeded, uniform across whatever came
  // back) genuinely can land anywhere from decades ago to recent history,
  // not just within however much a narrower fetch happened to cover.
  const to = Date.now();
  const from = to - 25 * 366 * 86_400_000;

  let symbol: string | null = null;
  let series: Awaited<ReturnType<typeof getHistory>> | null = null;
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const s = await getHistory({ symbol: candidate, interval: '1d', from, to });
      if (s.candles.length < need + 10) {
        throw new MarketDataError(`Not enough history for ${candidate} to run a replay.`, 503);
      }
      symbol = candidate;
      series = s;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!symbol || !series) {
    throw lastError instanceof MarketDataError
      ? lastError
      : new MarketDataError('Could not start a replay — every candidate symbol failed.', 502, lastError);
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
    filedCount: 0,
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

export interface AutoClosed {
  positionId: string;
  exitPrice: number;
  trade: RecordedTrade;
}

export interface SteppedBar {
  bar: Candle;
  index: number;
  remaining: number;
  finished: boolean;
  /** Everything the client's fill engine needs, computed server-side. */
  averageVolume: number | null;
  previousClose: number;
  /**
   * Present exactly when this bar closed the open position — its stop or
   * target was reached, or the replay just ran out of bars with a position
   * still open. The client did not choose this; it is being told it
   * happened.
   */
  autoClosed?: AutoClosed;
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
  const bar = s.candles[s.cursor];
  const finished = s.cursor >= s.candles.length - 1;

  let autoClosed: AutoClosed | undefined;
  if (s.open) {
    const trigger = checkAutoClose(s.open, bar);
    if (trigger) {
      const positionId = s.open.id;
      const trade = finishPosition(s, s.open, trigger.exitPrice, trigger.reason);
      autoClosed = { positionId, exitPrice: trigger.exitPrice, trade };
    } else if (finished) {
      // Out of bars with a position still open — squared off at the last
      // price, the way a real position is marked at the close of trading
      // rather than left open with no more market to close it against.
      const positionId = s.open.id;
      const trade = finishPosition(s, s.open, bar.close, 'session-end');
      autoClosed = { positionId, exitPrice: bar.close, trade };
    }
  }

  return {
    bar,
    index: s.cursor,
    remaining: s.candles.length - 1 - s.cursor,
    finished,
    averageVolume,
    previousClose,
    autoClosed,
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
 * Computes and records the trade, whatever caused it to close. `pnl`,
 * `stoppedOut`, `plannedRR`, `preCommitted`, `riskFraction` and
 * `sizedFromStop` all come from this — never from the client's own claim
 * about what happened.
 */
function finishPosition(
  s: ServerReplaySession,
  open: OpenPosition,
  exitPrice: number,
  reason: RecordedTrade['reason'],
): RecordedTrade {
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
    reason,
  };

  s.positions.push(trade);
  s.open = null;
  return trade;
}

/**
 * Close the open position at the CURRENT bar's close — the learner choosing
 * to exit before either level was reached. What is deliberately NOT decided
 * here is whether that exit was calm or a panic: `honouredStop`/
 * `exitedPerPlan` in the game ask about the trader's state of mind at the
 * moment they clicked, which is not a property of prices and bars and has
 * no mechanical test. That is the one part of this game that stays
 * self-reported by design, the same way the written reason does — and only
 * for THIS reason ('manual'). A 'stop' or 'target' close (see stepReplay)
 * was not a choice at all, so the API route that scores a filed run treats
 * those as mechanically honoured rather than asking the client.
 */
export function closePosition(sessionId: string, positionId: string): RecordedTrade {
  const s = SESSIONS.get(sessionId);
  if (!s) throw new MarketDataError('Replay session not found or expired. Start a new replay.', 404);
  if (!s.open || s.open.id !== positionId) {
    throw new MarketDataError('No matching open position in this session.', 409);
  }

  s.lastTouchedAt = Date.now();
  const exitPrice = s.candles[s.cursor].close;
  return finishPosition(s, s.open, exitPrice, 'manual');
}

/**
 * Did the bar just revealed take out the stop or the target? Checked against
 * the bar's actual high/low, not its close — a level "reached" means the
 * price touched it, whether or not the bar closed back through it.
 *
 * The stop is checked first, so if a single bar's range spans both levels —
 * only possible on a wide bar with a tight stop and a distant target — this
 * resolves to the stop. There is no intrabar sequencing in an OHLC bar to
 * say which was actually touched first, and the fill engine elsewhere in
 * this app resolves exactly this kind of ambiguity against the learner
 * rather than in their favour (`pessimisticIntrabar` in lib/engine/fill.ts)
 * — the same rule applies here for the same reason.
 *
 * A gap — the bar OPENING beyond the level — exits at the open, since the
 * level itself was never actually available to trade at. A level touched
 * within the bar's range without a gap exits AT the level exactly: the
 * position is "squared off at the point it reaches," not at the bar's close.
 */
function checkAutoClose(open: OpenPosition, bar: Candle): { exitPrice: number; reason: 'stop' | 'target' } | null {
  const isBuy = open.side === 'buy';

  const stopHit = isBuy ? bar.low <= open.stopPrice : bar.high >= open.stopPrice;
  if (stopHit) {
    const gapped = isBuy ? bar.open <= open.stopPrice : bar.open >= open.stopPrice;
    return { exitPrice: gapped ? bar.open : open.stopPrice, reason: 'stop' };
  }

  if (open.targetPrice != null) {
    const target = open.targetPrice;
    const targetHit = isBuy ? bar.high >= target : bar.low <= target;
    if (targetHit) {
      const gapped = isBuy ? bar.open >= target : bar.open <= target;
      return { exitPrice: gapped ? bar.open : target, reason: 'target' };
    }
  }

  return null;
}

/** Every trade this session has actually closed, in order. */
export function getRecordedTrades(sessionId: string): RecordedTrade[] | null {
  const s = SESSIONS.get(sessionId);
  return s ? s.positions : null;
}

/**
 * The one closed trade this session has not yet filed as a scored run, if
 * any. A trade is filed the instant it closes rather than batched to the end
 * of the session — see /api/progress/run and ChartReplay.tsx — so at most
 * one trade is ever "unfiled" at a time in the ordinary case; this exists
 * mainly so a client's filing POST is verified against the server's own
 * ledger instead of trusted, and so a retried POST cannot re-score a trade
 * that was already filed.
 */
export function nextUnfiledTrade(sessionId: string): { index: number; trade: RecordedTrade } | null {
  const s = SESSIONS.get(sessionId);
  if (!s || s.filedCount >= s.positions.length) return null;
  return { index: s.filedCount, trade: s.positions[s.filedCount] };
}

/**
 * Marks trade `index` as filed. Only advances when `index` is exactly the
 * next unfiled trade — filing out of order or filing the same trade twice
 * (a retry racing a success) is a no-op rather than an error, so the caller
 * can treat "not recorded" uniformly instead of having to distinguish why.
 */
export function markTradeFiled(sessionId: string, index: number): boolean {
  const s = SESSIONS.get(sessionId);
  if (!s || index !== s.filedCount) return false;
  s.filedCount += 1;
  return true;
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
