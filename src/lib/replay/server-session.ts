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

export const WARMUP_BARS = 60;
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
