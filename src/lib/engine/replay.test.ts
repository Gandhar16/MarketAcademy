import { describe, expect, it } from 'vitest';
import { ReplaySession } from './replay';
import { newOrderState, type OrderRequest } from './order';
import { newAccount } from './portfolio';
import type { Candle, Series } from '../market/types';

/** A deterministic ramp: close rises by 10 each bar, so outcomes are checkable. */
function ramp(n: number, start = 1000): Candle[] {
  return Array.from({ length: n }, (_, i) => {
    const base = start + i * 10;
    return { time: 1_700_000_000 + i * 86_400, open: base, high: base + 5, low: base - 5, close: base + 2, volume: 1_000_000 };
  });
}

const series = (candles: Candle[]): Series => ({
  symbol: 'TEST.NS',
  interval: '1d',
  candles,
  currency: 'INR',
  source: 'snapshot',
});

const order = (o: Partial<OrderRequest> = {}) =>
  newOrderState({
    id: 'o1',
    symbol: 'TEST.NS',
    side: 'buy',
    quantity: 100,
    type: 'MARKET',
    product: 'intraday',
    validity: 'DAY',
    placedAt: 0,
    ...o,
  });

describe('replay engine — the no-lookahead invariant', () => {
  it('exposes only bars up to the cursor', () => {
    const s = new ReplaySession(series(ramp(200)), 0.05, { warmupBars: 60 });
    expect(s.visible()).toHaveLength(60);
    s.step();
    expect(s.visible()).toHaveLength(61);
  });

  it('returns copies, so a caller cannot mutate its way to future bars', () => {
    const s = new ReplaySession(series(ramp(200)), 0.05, { warmupBars: 60 });
    const v = s.visible();
    v.push({ time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 });
    v[0].close = -1;
    expect(s.visible()).toHaveLength(60);
    expect(s.visible()[0].close).not.toBe(-1);
  });

  it('is unaffected by mutation of the source series after construction', () => {
    const candles = ramp(200);
    const s = new ReplaySession(series(candles), 0.05, { warmupBars: 60 });
    const before = s.current().close;
    candles[59].close = 999_999;
    expect(s.current().close).toBe(before);
  });

  it('refuses to reveal the full series before the replay is finished', () => {
    const s = new ReplaySession(series(ramp(200)), 0.05, { warmupBars: 60 });
    expect(() => s.revealAll()).toThrow(/about to introduce lookahead/);
  });

  it('allows the full reveal once finished, for the debrief', () => {
    const s = new ReplaySession(series(ramp(70)), 0.05, { warmupBars: 60 });
    while (!s.finished) s.step();
    expect(s.revealAll()).toHaveLength(70);
  });

  it('exposes a remaining count but no future prices', () => {
    const s = new ReplaySession(series(ramp(100)), 0.05, { warmupBars: 60 });
    expect(s.remaining).toBe(40);
    // The public surface must not leak candles beyond the cursor.
    const surface = JSON.stringify({ visible: s.visible(), current: s.current() });
    expect(surface).not.toContain(String(ramp(100)[99].close));
  });

  it('refuses to construct with too few bars rather than silently truncating', () => {
    expect(() => new ReplaySession(series(ramp(30)), 0.05, { warmupBars: 60 })).toThrow(/Replay needs more than/);
  });
});

describe('replay engine — execution timing', () => {
  it('does not fill an order in the bar the decision was made on', () => {
    const s = new ReplaySession(series(ramp(200)), 0.05, { warmupBars: 60 });
    const barAtDecision = s.current();
    s.submit(order());
    const { result } = s.step();
    expect(result.fills).toHaveLength(1);
    // The fill happened against the NEXT bar, not the one visible at decision time.
    expect(result.bar.time).toBeGreaterThan(barAtDecision.time);
    expect(result.fills[0].result.price).toBeGreaterThan(barAtDecision.close - 20);
  });

  it('fills a market order against the next bar and updates the account', () => {
    const s = new ReplaySession(series(ramp(200)), 0.05, { warmupBars: 60 });
    const acct = newAccount({ market: 'IN', venue: 'NSE', startingCash: 1_000_000 });
    s.submit(order({ quantity: 100 }));
    const { account } = s.step(acct);
    expect(account!.positions['TEST.NS::intraday'].quantity).toBe(100);
    expect(account!.totalCharges).toBeGreaterThan(0);
    expect(account!.cash).toBeLessThan(1_000_000);
  });

  it('keeps a DAY limit order working across bars until it fills', () => {
    // Falling market so a low limit eventually gets hit.
    const falling = ramp(200).map((c, i) => {
      const base = 2000 - i * 10;
      return { ...c, open: base, high: base + 5, low: base - 5, close: base - 2 };
    });
    const s = new ReplaySession(series(falling), 0.05, { warmupBars: 60 });
    s.submit(order({ type: 'LIMIT', limitPrice: 1000, validity: 'DAY' }));

    let filled = false;
    let steps = 0;
    while (!s.finished && !filled && steps < 200) {
      const { result } = s.step();
      filled = result.fills.some((f) => f.result.quantity > 0);
      steps += 1;
    }
    expect(filled).toBe(true);
    expect(s.workingOrders()).toHaveLength(0);
  });

  it('cancels the remainder of an IOC order instead of working it', () => {
    const thin = ramp(200).map((c) => ({ ...c, volume: 1000 }));
    const s = new ReplaySession(series(thin), 0.05, { warmupBars: 60 });
    s.submit(order({ quantity: 100_000, validity: 'IOC' }));
    const { result } = s.step();
    expect(result.fills.some((f) => f.order.status === 'cancelled')).toBe(true);
    expect(s.workingOrders()).toHaveLength(0);
  });

  it('works the remainder of a partially filled DAY order', () => {
    const thin = ramp(200).map((c) => ({ ...c, volume: 1000 }));
    const s = new ReplaySession(series(thin), 0.05, { warmupBars: 60 });
    s.submit(order({ quantity: 1000, validity: 'DAY' }));
    const { result } = s.step();
    expect(result.fills[0].order.status).toBe('partial');
    expect(s.workingOrders()).toHaveLength(1);
    expect(s.workingOrders()[0].filledQuantity).toBe(100); // 10% of 1000
  });

  it('cancels a resting order on request', () => {
    const s = new ReplaySession(series(ramp(200)), 0.05, { warmupBars: 60 });
    s.submit(order({ type: 'LIMIT', limitPrice: 1 }));
    expect(s.cancel('o1')).toBe(true);
    expect(s.workingOrders()).toHaveLength(0);
  });

  it('marks the account to market on every step, so drawdown accrues while holding', () => {
    const falling = ramp(200).map((c, i) => {
      const base = 2000 - i * 10;
      return { ...c, open: base, high: base + 5, low: base - 5, close: base - 2 };
    });
    const s = new ReplaySession(series(falling), 0.05, { warmupBars: 60 });
    let acct = newAccount({ market: 'IN', venue: 'NSE', startingCash: 1_000_000 });
    s.submit(order({ quantity: 100 }));
    for (let i = 0; i < 50 && !s.finished; i++) {
      acct = s.step(acct).account!;
    }
    expect(acct.maxDrawdown).toBeGreaterThan(0);
  });

  it('stops cleanly at the end of the series', () => {
    const s = new ReplaySession(series(ramp(65)), 0.05, { warmupBars: 60 });
    let steps = 0;
    while (!s.finished && steps < 100) {
      s.step();
      steps += 1;
    }
    expect(steps).toBe(5);
    // Stepping past the end is a no-op, not a crash.
    expect(() => s.step()).not.toThrow();
    expect(s.step().result.finished).toBe(true);
  });
});
