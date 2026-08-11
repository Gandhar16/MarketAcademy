import { describe, expect, it } from 'vitest';
import { applyFill, equity, markToMarket, newAccount, sizeFromStop, unrealisedPnl } from './portfolio';

const acct = () => newAccount({ market: 'IN', venue: 'NSE', startingCash: 100_000 });

const buy = (a: ReturnType<typeof acct>, quantity: number, price: number) =>
  applyFill(a, { symbol: 'RELIANCE.NS', product: 'intraday', side: 'buy', quantity, price, at: 0 });

const sell = (a: ReturnType<typeof acct>, quantity: number, price: number) =>
  applyFill(a, { symbol: 'RELIANCE.NS', product: 'intraday', side: 'sell', quantity, price, at: 0 });

describe('portfolio accounting', () => {
  it('debits charges from cash immediately on entry, not at exit', () => {
    const a = acct();
    const r = buy(a, 50, 1400);
    expect(r.costs.total).toBeGreaterThan(0);
    expect(r.account.cash).toBeCloseTo(100_000 - 50 * 1400 - r.costs.total, 2);
    expect(r.account.totalCharges).toBeCloseTo(r.costs.total, 2);
  });

  it('reports a LOSS on a flat round trip, because costs are real', () => {
    let a = acct();
    a = buy(a, 50, 1400).account;
    const out = sell(a, 50, 1400);
    expect(out.realised).toBeLessThan(0);
    expect(out.account.realisedPnl).toBeLessThan(0);
    expect(out.note).toMatch(/net -/);
  });

  it('returns the account to cash-only after a full close', () => {
    let a = acct();
    a = buy(a, 50, 1400).account;
    const out = sell(a, 50, 1400);
    expect(Object.keys(out.account.positions)).toHaveLength(0);
    expect(out.account.cash).toBeCloseTo(100_000 + out.account.realisedPnl, 2);
  });

  it('weights the average price when adding to a position', () => {
    let a = acct();
    a = buy(a, 10, 1000).account;
    a = buy(a, 10, 1200).account;
    expect(a.positions['RELIANCE.NS::intraday'].averagePrice).toBeCloseTo(1100, 6);
  });

  it('realises only the closed portion on a partial exit', () => {
    let a = acct();
    a = buy(a, 100, 1000).account;
    const out = sell(a, 40, 1100);
    expect(out.account.positions['RELIANCE.NS::intraday'].quantity).toBe(60);
    // Gross on 40 units is 4,000; net must be a bit less after charges.
    expect(out.realised).toBeGreaterThan(3_800);
    expect(out.realised).toBeLessThan(4_000);
  });

  it('resets the basis when a trade reverses through zero', () => {
    let a = acct();
    a = buy(a, 50, 1000).account;
    const out = sell(a, 80, 1100);
    const pos = out.account.positions['RELIANCE.NS::intraday'];
    expect(pos.quantity).toBe(-30);
    // The new short's basis is this fill's price, NOT the old long average.
    expect(pos.averagePrice).toBe(1100);
    expect(out.note).toMatch(/Reversed/);
  });

  it('tracks unrealised P&L and equity against marks', () => {
    let a = acct();
    a = buy(a, 50, 1000).account;
    const marks = { 'RELIANCE.NS': 1100 };
    expect(unrealisedPnl(a, marks)).toBeCloseTo(5_000, 6);
    expect(equity(a, marks)).toBeGreaterThan(104_000);
  });

  it('records drawdown from the equity peak, including while a position is open', () => {
    let a = acct();
    a = buy(a, 50, 1000).account;
    a = markToMarket(a, { 'RELIANCE.NS': 1200 }); // peak
    a = markToMarket(a, { 'RELIANCE.NS': 900 }); // trough
    expect(a.maxDrawdown).toBeGreaterThan(0.1);
    // Recovering does not erase the recorded drawdown.
    a = markToMarket(a, { 'RELIANCE.NS': 1300 });
    expect(a.maxDrawdown).toBeGreaterThan(0.1);
  });
});

describe('position sizing from a stop', () => {
  it('sizes so that the stop distance equals the risk budget', () => {
    const r = sizeFromStop({ equity: 100_000, riskFraction: 0.01, entry: 1000, stop: 980 });
    expect(r.quantity).toBe(50); // 1,000 risk / 20 per unit
    expect(r.riskAmount).toBe(1_000);
  });

  it('rounds down to whole lots for derivatives', () => {
    const r = sizeFromStop({ equity: 500_000, riskFraction: 0.02, entry: 24_000, stop: 23_900, lotSize: 65 });
    expect(r.quantity % 65).toBe(0);
  });

  it('says the trade is too big rather than quietly widening the stop', () => {
    const r = sizeFromStop({ equity: 50_000, riskFraction: 0.01, entry: 24_000, stop: 23_800, lotSize: 65 });
    expect(r.quantity).toBe(0);
    expect(r.note).toMatch(/too big for this account/);
  });

  it('refuses a zero stop distance', () => {
    const r = sizeFromStop({ equity: 100_000, riskFraction: 0.01, entry: 1000, stop: 1000 });
    expect(r.quantity).toBe(0);
  });

  it('warns that the realised risk can exceed the budget', () => {
    const r = sizeFromStop({ equity: 100_000, riskFraction: 0.01, entry: 1000, stop: 980 });
    expect(r.note).toMatch(/Slippage and gaps can make it worse/);
  });
});
