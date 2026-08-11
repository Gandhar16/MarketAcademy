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

describe('session lifecycle', () => {
  it('tracks sessions and can be cleared', () => {
    makeSession({ id: 'a' });
    makeSession({ id: 'b' });
    expect(_sessionCount()).toBe(2);
    _clearSessions();
    expect(_sessionCount()).toBe(0);
  });
});
