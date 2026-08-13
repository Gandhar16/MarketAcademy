/**
 * Server replay session tests.
 *
 * These are the tests that make the no-lookahead claim true rather than
 * aspirational: the API surface has no way to name a future bar, and the
 * reveal is refused until the run is genuinely over.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SESSION_TTL_MS,
  VOLUME_WINDOW,
  _clearSessions,
  _getSession,
  _putSession,
  _sessionCount,
  closePosition,
  getRecordedTrades,
  openPosition,
  revealReplay,
  stepReplay,
  type ServerReplaySession,
} from './server-session';
import type { Candle } from '../market/types';

function bars(n: number): Candle[] {
  return Array.from({ length: n }, (_, i) => ({
    time: 1_700_000_000 + i * 86_400,
    open: 1000 + i,
    high: 1005 + i,
    low: 995 + i,
    close: 1002 + i,
    volume: 1_000_000 + i * 1000,
  }));
}

function makeSession(over: Partial<ServerReplaySession> = {}): ServerReplaySession {
  const now = Date.now();
  const s: ServerReplaySession = {
    id: 'test-session',
    symbol: 'TEST.NS',
    candles: bars(120),
    warmupBars: 60,
    cursor: 59,
    tickSize: 0.05,
    createdAt: now,
    lastTouchedAt: now,
    open: null,
    positions: [],
    ...over,
  };
  _putSession(s);
  return s;
}

beforeEach(() => _clearSessions());

describe('stepping', () => {
  it('serves exactly one bar per call, in order', () => {
    makeSession();
    const first = stepReplay('test-session');
    const second = stepReplay('test-session');
    expect(first.index).toBe(60);
    expect(second.index).toBe(61);
    expect(second.bar.time).toBeGreaterThan(first.bar.time);
  });

  it('advances the server cursor, so the future is never re-servable out of order', () => {
    makeSession();
    stepReplay('test-session');
    expect(_getSession('test-session')!.cursor).toBe(60);
    // There is no argument by which a caller can ask for bar 90.
    expect(Object.keys(stepReplay('test-session'))).not.toContain('index_requested');
  });

  it('reports remaining accurately and finishes on the last bar', () => {
    makeSession({ candles: bars(63), cursor: 59 });
    expect(stepReplay('test-session').remaining).toBe(2);
    expect(stepReplay('test-session').remaining).toBe(1);
    const last = stepReplay('test-session');
    expect(last.remaining).toBe(0);
    expect(last.finished).toBe(true);
  });

  it('is idempotent once finished rather than throwing', () => {
    makeSession({ candles: bars(61), cursor: 59 });
    stepReplay('test-session');
    const again = stepReplay('test-session');
    expect(again.finished).toBe(true);
    expect(again.remaining).toBe(0);
  });

  it('computes trailing average volume over the configured window only', () => {
    const candles = bars(120).map((c, i) => ({ ...c, volume: i < 40 ? 1 : 1_000_000 }));
    makeSession({ candles });
    const stepped = stepReplay('test-session');
    // Cursor was 59, so the window is bars 40..59 — all at 1,000,000.
    expect(stepped.averageVolume).toBe(1_000_000);
    expect(VOLUME_WINDOW).toBe(20);
  });

  it('passes the previous close so the fill engine can measure gaps', () => {
    const s = makeSession();
    const stepped = stepReplay('test-session');
    expect(stepped.previousClose).toBe(s.candles[59].close);
  });

  it('tolerates missing volume without inventing a number', () => {
    makeSession({ candles: bars(120).map((c) => ({ ...c, volume: null })) });
    expect(stepReplay('test-session').averageVolume).toBeNull();
  });

  it('rejects an unknown session with a recoverable message', () => {
    expect(() => stepReplay('nope')).toThrow(/not found or expired/);
  });

  it('touches the session so an active replay does not expire under the learner', () => {
    const s = makeSession({ lastTouchedAt: Date.now() - SESSION_TTL_MS / 2 });
    const before = s.lastTouchedAt;
    stepReplay('test-session');
    expect(_getSession('test-session')!.lastTouchedAt).toBeGreaterThan(before);
  });
});

describe('reveal', () => {
  it('refuses before the replay is finished', () => {
    makeSession();
    expect(() => revealReplay('test-session')).toThrow(/not finished/);
  });

  it('refuses one bar short of the end', () => {
    makeSession({ candles: bars(62), cursor: 59 });
    stepReplay('test-session');
    expect(() => revealReplay('test-session')).toThrow(/not finished/);
  });

  it('reveals the symbol and full series once finished', () => {
    makeSession({ candles: bars(62), cursor: 59 });
    stepReplay('test-session');
    stepReplay('test-session');
    const revealed = revealReplay('test-session');
    expect(revealed.symbol).toBe('TEST.NS');
    expect(revealed.candles).toHaveLength(62);
  });

  it('rejects an unknown session', () => {
    expect(() => revealReplay('nope')).toThrow(/not found or expired/);
  });
});

describe('positions', () => {
  it('opens and closes at the current bar close, not a client-supplied price', () => {
    const s = makeSession(); // cursor 59, candles[59].close === 1061
    const open = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: 4, hasThesis: true });
    expect(open.entryPrice).toBe(s.candles[59].close);

    const trade = closePosition('test-session', open.id);
    expect(trade.pnl).toBe(0); // no bar advanced between open and close
    expect(trade.preCommitted).toBe(true);
    expect(trade.sizedFromStop).toBe(true);
    expect(trade.plannedRR).toBeCloseTo(2, 5); // 4% target ÷ 2% stop
  });

  it('derives pnl and stoppedOut from real bar movement, not the caller', () => {
    makeSession({ candles: bars(63), cursor: 59 });
    const open = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: null, hasThesis: false });
    stepReplay('test-session'); // cursor -> 60, close rises by 1
    const trade = closePosition('test-session', open.id);
    expect(trade.pnl).toBeGreaterThan(0);
    expect(trade.stoppedOut).toBe(false);
    expect(trade.plannedRR).toBeNull(); // no target declared
  });

  it('rejects a second open while one is already resting', () => {
    makeSession();
    openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: null, hasThesis: true });
    expect(() =>
      openPosition('test-session', { side: 'sell', stopPct: 2, targetPct: null, hasThesis: true }),
    ).toThrow(/already open/);
  });

  it('rejects a stop outside the range the UI ever offers', () => {
    makeSession();
    expect(() =>
      openPosition('test-session', { side: 'buy', stopPct: 0.01, targetPct: null, hasThesis: true }),
    ).toThrow(/between/);
    expect(() =>
      openPosition('test-session', { side: 'buy', stopPct: 50, targetPct: null, hasThesis: true }),
    ).toThrow(/between/);
  });

  it('rejects closing a position that does not match the recorded id', () => {
    makeSession();
    openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: null, hasThesis: true });
    expect(() => closePosition('test-session', 'not-the-real-id')).toThrow(/No matching open position/);
  });

  it('accumulates every closed trade in order, and exposes it read-only', () => {
    makeSession();
    const first = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: null, hasThesis: true });
    closePosition('test-session', first.id);
    const second = openPosition('test-session', { side: 'sell', stopPct: 3, targetPct: null, hasThesis: false });
    closePosition('test-session', second.id);

    const trades = getRecordedTrades('test-session');
    expect(trades).toHaveLength(2);
    expect(trades?.[0].preCommitted).toBe(true);
    expect(trades?.[1].preCommitted).toBe(false);
  });

  it('returns null for an unknown session rather than throwing', () => {
    expect(getRecordedTrades('nope')).toBeNull();
  });

  it('a manual close is tagged reason "manual"', () => {
    makeSession();
    const open = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: null, hasThesis: true });
    const trade = closePosition('test-session', open.id);
    expect(trade.reason).toBe('manual');
  });
});

describe('auto square-off', () => {
  /** entry bar at index 0 (close 100); the caller supplies bar 1. */
  function sessionWithNextBar(nextBar: Partial<Candle>): void {
    const entryBar: Candle = { time: 1_700_000_000, open: 100, high: 101, low: 99, close: 100, volume: 1_000_000 };
    const bar1: Candle = { time: 1_700_086_400, open: 100, high: 101, low: 99, close: 100.5, volume: 1_000_000, ...nextBar };
    makeSession({ candles: [entryBar, bar1], cursor: 0, warmupBars: 1 });
  }

  it('squares off a long at the exact stop when the bar touches it without gapping', () => {
    sessionWithNextBar({ open: 99, high: 100, low: 97, close: 98 });
    const open = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: null, hasThesis: true });
    expect(open.stopPrice).toBeCloseTo(98, 5);

    const stepped = stepReplay('test-session');
    expect(stepped.autoClosed?.positionId).toBe(open.id);
    expect(stepped.autoClosed?.exitPrice).toBeCloseTo(98, 5);
    expect(stepped.autoClosed?.trade.reason).toBe('stop');
    expect(stepped.autoClosed?.trade.pnl).toBeCloseTo(-2, 5);
    expect(stepped.autoClosed?.trade.stoppedOut).toBe(true);

    // The slot is freed and the trade is on the ledger.
    expect(() => closePosition('test-session', open.id)).toThrow(/No matching open position/);
    expect(getRecordedTrades('test-session')).toHaveLength(1);
  });

  it('exits at the open, not the stop, when the bar gaps straight through it', () => {
    sessionWithNextBar({ open: 90, high: 91, low: 85, close: 87 });
    openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: null, hasThesis: true });

    const stepped = stepReplay('test-session');
    expect(stepped.autoClosed?.trade.reason).toBe('stop');
    expect(stepped.autoClosed?.exitPrice).toBe(90); // the bar's open, not stopPrice (98)
    expect(stepped.autoClosed?.trade.pnl).toBeCloseTo(-10, 5);
  });

  it('squares off a long at the exact target when the bar reaches it without gapping', () => {
    sessionWithNextBar({ open: 101, high: 106, low: 100, close: 103 });
    const open = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: 4, hasThesis: true });
    expect(open.targetPrice).toBeCloseTo(104, 5);

    const stepped = stepReplay('test-session');
    expect(stepped.autoClosed?.trade.reason).toBe('target');
    expect(stepped.autoClosed?.exitPrice).toBeCloseTo(104, 5);
    expect(stepped.autoClosed?.trade.pnl).toBeCloseTo(4, 5);
    expect(stepped.autoClosed?.trade.stoppedOut).toBe(false);
  });

  it('resolves a bar that reaches both levels to the stop — pessimistic, same as the fill engine', () => {
    sessionWithNextBar({ open: 100, high: 106, low: 95, close: 101 });
    const open = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: 4, hasThesis: true });

    const stepped = stepReplay('test-session');
    expect(stepped.autoClosed?.trade.reason).toBe('stop');
    expect(stepped.autoClosed?.exitPrice).toBeCloseTo(open.stopPrice, 5);
  });

  it('squares off a short at the stop above entry and the target below it', () => {
    sessionWithNextBar({ open: 101, high: 103, low: 100, close: 101.5 });
    const open = openPosition('test-session', { side: 'sell', stopPct: 2, targetPct: 4, hasThesis: true });
    expect(open.stopPrice).toBeCloseTo(102, 5);
    expect(open.targetPrice).toBeCloseTo(96, 5);

    const stepped = stepReplay('test-session');
    expect(stepped.autoClosed?.trade.reason).toBe('stop');
    expect(stepped.autoClosed?.exitPrice).toBeCloseTo(102, 5);
    expect(stepped.autoClosed?.trade.pnl).toBeCloseTo(-2, 5); // entry 100, exit 102, short
  });

  it('does nothing when the bar never reaches either level and bars remain', () => {
    const entryBar: Candle = { time: 1_700_000_000, open: 100, high: 101, low: 99, close: 100, volume: 1_000_000 };
    const bar1: Candle = { time: 1_700_086_400, open: 100.2, high: 100.8, low: 99.7, close: 100.5, volume: 1_000_000 };
    const bar2: Candle = { time: 1_700_172_800, open: 100.5, high: 101, low: 100, close: 100.7, volume: 1_000_000 };
    makeSession({ candles: [entryBar, bar1, bar2], cursor: 0, warmupBars: 1 });
    openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: 4, hasThesis: true });

    const stepped = stepReplay('test-session'); // reveals bar1 — not the last bar
    expect(stepped.finished).toBe(false);
    expect(stepped.autoClosed).toBeUndefined();
    expect(getRecordedTrades('test-session')).toHaveLength(0);
  });

  it('squares off at the last price when the replay ends with a position still open', () => {
    sessionWithNextBar({ open: 100.2, high: 100.8, low: 99.7, close: 100.6 }); // never reaches either level
    const open = openPosition('test-session', { side: 'buy', stopPct: 2, targetPct: 4, hasThesis: true });

    const stepped = stepReplay('test-session'); // this is the last bar — candles has length 2, cursor -> 1
    expect(stepped.finished).toBe(true);
    expect(stepped.autoClosed?.trade.reason).toBe('session-end');
    expect(stepped.autoClosed?.exitPrice).toBe(100.6); // the bar's close
    expect(stepped.autoClosed?.positionId).toBe(open.id);
    expect(getRecordedTrades('test-session')).toHaveLength(1);
  });

  it('leaves a position untouched when nobody has one open', () => {
    sessionWithNextBar({ open: 90, high: 91, low: 85, close: 87 }); // would trigger a stop if a position existed
    const stepped = stepReplay('test-session');
    expect(stepped.autoClosed).toBeUndefined();
  });
});

describe('session lifecycle', () => {
  it('tracks sessions and can be cleared', () => {
    makeSession({ id: 'a' });
    makeSession({ id: 'b' });
    expect(_sessionCount()).toBe(2);
    _clearSessions();
    expect(_sessionCount()).toBe(0);
  });
});
