import { describe, expect, it } from 'vitest';
import { fillPriceFor, initialSimState, shouldFill, simReducer, STARTING_CASH, type SimAction, type SimState } from './reducer';
import { newOrderState, type OrderRequest, type OrderState } from '../engine/order';
import type { Quote } from '../market/types';

const quote = (over: Partial<Quote> = {}): Quote => ({
  symbol: 'RELIANCE.NS',
  price: 1400,
  previousClose: 1390,
  change: 10,
  changePercent: 0.72,
  dayHigh: 1410,
  dayLow: 1385,
  open: 1395,
  volume: 5_000_000,
  currency: 'INR',
  exchange: 'NSE',
  timestamp: 0,
  marketState: 'REGULAR',
  source: 'live',
  ...over,
});

const order = (over: Partial<OrderRequest> = {}): OrderRequest => ({
  id: 'o1',
  symbol: 'RELIANCE.NS',
  side: 'buy',
  quantity: 10,
  type: 'MARKET',
  product: 'intraday',
  validity: 'DAY',
  placedAt: 1000,
  ...over,
});

const run = (state: SimState, ...actions: SimAction[]) => actions.reduce(simReducer, state);
const withQuote = (q = quote()) => run(initialSimState(), { type: 'quotes', quotes: [q], at: 1000 });

describe('order placement', () => {
  it('fills a market order immediately and charges for it', () => {
    const s = run(withQuote(), { type: 'place', order: order() });
    expect(s.blotter).toHaveLength(1);
    expect(s.blotter[0].chargeTotal).toBeGreaterThan(0);
    expect(s.account.positions['RELIANCE.NS::intraday'].quantity).toBe(10);
    expect(s.account.cash).toBeLessThan(STARTING_CASH);
  });

  it('rests a limit order instead of filling it', () => {
    const s = run(withQuote(), { type: 'place', order: order({ type: 'LIMIT', limitPrice: 1300 }) });
    expect(s.resting).toHaveLength(1);
    expect(s.blotter).toHaveLength(0);
  });

  it('rejects an order with no quote yet, without crashing', () => {
    const s = simReducer(initialSimState(), { type: 'place', order: order() });
    expect(s.rejection?.reason).toMatch(/No live price/);
    expect(s.blotter).toHaveLength(0);
  });

  it('rejects an invalid tick price and surfaces the exchange rule', () => {
    const s = run(withQuote(), { type: 'place', order: order({ type: 'LIMIT', limitPrice: 1399.123 }) });
    expect(s.rejection?.reason).toMatch(/tick size/);
    expect(s.resting).toHaveLength(0);
  });

  it('rejects an order the account cannot fund and suggests a size', () => {
    const s = run(withQuote(), { type: 'place', order: order({ quantity: 10_000 }) });
    expect(s.rejection?.reason).toMatch(/Insufficient funds/);
    expect(s.rejection?.hint).toMatch(/largest quantity/);
  });

  it('rejects a stop on the wrong side of the market', () => {
    const s = run(withQuote(), { type: 'place', order: order({ side: 'sell', type: 'SL-M', triggerPrice: 1450 }) });
    expect(s.rejection?.reason).toMatch(/must sit BELOW/);
  });

  it('clears a previous rejection once a valid order goes through', () => {
    let s = run(withQuote(), { type: 'place', order: order({ quantity: 10_000 }) });
    expect(s.rejection).not.toBeNull();
    s = simReducer(s, { type: 'place', order: order({ id: 'o2' }) });
    expect(s.rejection).toBeNull();
  });

  it('cancels a resting order', () => {
    let s = run(withQuote(), { type: 'place', order: order({ type: 'LIMIT', limitPrice: 1300 }) });
    s = simReducer(s, { type: 'cancel', orderId: 'o1' });
    expect(s.resting).toHaveLength(0);
  });
});

describe('resting order matching', () => {
  it('fills a buy limit once price trades down to it', () => {
    let s = run(withQuote(), { type: 'place', order: order({ type: 'LIMIT', limitPrice: 1350 }) });
    s = simReducer(s, { type: 'quotes', quotes: [quote({ price: 1360 })], at: 2000 });
    expect(s.resting).toHaveLength(1);
    s = simReducer(s, { type: 'quotes', quotes: [quote({ price: 1340 })], at: 3000 });
    expect(s.resting).toHaveLength(0);
    expect(s.blotter).toHaveLength(1);
  });

  it('never fills a buy limit above its limit price', () => {
    let s = run(withQuote(), { type: 'place', order: order({ type: 'LIMIT', limitPrice: 1350 }) });
    s = simReducer(s, { type: 'quotes', quotes: [quote({ price: 1340 })], at: 3000 });
    expect(s.blotter[0].price).toBeLessThanOrEqual(1350);
  });

  it('triggers a protective sell stop when price falls through it', () => {
    let s = run(withQuote(), { type: 'place', order: order({ side: 'sell', type: 'SL-M', triggerPrice: 1350 }) });
    s = simReducer(s, { type: 'quotes', quotes: [quote({ price: 1345 })], at: 3000 });
    expect(s.blotter).toHaveLength(1);
    expect(s.resting).toHaveLength(0);
  });

  it('leaves an order resting when its symbol has no quote', () => {
    let s = run(withQuote(), { type: 'place', order: order({ type: 'LIMIT', limitPrice: 1300 }) });
    s = simReducer(s, { type: 'quotes', quotes: [quote({ symbol: 'INFY.NS' })], at: 3000 });
    expect(s.resting).toHaveLength(1);
  });

  it('marks to market after filling, not before', () => {
    let s = run(withQuote(), { type: 'place', order: order({ type: 'LIMIT', limitPrice: 1350, quantity: 50 }) });
    s = simReducer(s, { type: 'quotes', quotes: [quote({ price: 1340 })], at: 3000 });
    // Position exists and equity accounts for it in the same pass.
    expect(s.account.positions['RELIANCE.NS::intraday'].quantity).toBe(50);
    expect(s.account.peakEquity).toBeGreaterThan(0);
  });
});

describe('fill pricing', () => {
  it('makes a buy pay above the last price and a sell receive below it', () => {
    const q = quote();
    const buy = fillPriceFor(newOrderState(order({ side: 'buy' })), q);
    const sell = fillPriceFor(newOrderState(order({ side: 'sell' })), q);
    expect(buy).toBeGreaterThan(q.price);
    expect(sell).toBeLessThan(q.price);
  });

  it('widens the spread on a volatile, thin day', () => {
    const calm = fillPriceFor(newOrderState(order()), quote({ dayHigh: 1402, dayLow: 1398 }));
    const wild = fillPriceFor(newOrderState(order()), quote({ dayHigh: 1500, dayLow: 1300, volume: 10_000 }));
    expect(wild).toBeGreaterThan(calm);
  });

  it('loses money on an immediate round trip at an unchanged price', () => {
    let s = run(withQuote(), { type: 'place', order: order({ quantity: 50 }) });
    s = simReducer(s, { type: 'place', order: order({ id: 'o2', side: 'sell', quantity: 50 }) });
    expect(Object.keys(s.account.positions)).toHaveLength(0);
    expect(s.account.realisedPnl).toBeLessThan(0);
    expect(s.account.cash).toBeLessThan(STARTING_CASH);
  });
});

describe('shouldFill', () => {
  const o = (over: Partial<OrderState>): OrderState => ({ ...newOrderState(order()), ...over });

  it('always fills a market order', () => {
    expect(shouldFill(o({ type: 'MARKET' }), 999)).toBe(true);
  });

  it.each([
    ['buy', 'LIMIT', 1350, 1349, true],
    ['buy', 'LIMIT', 1350, 1351, false],
    ['sell', 'LIMIT', 1350, 1351, true],
    ['sell', 'LIMIT', 1350, 1349, false],
  ] as const)('%s %s at %d against %d', (side, type, limitPrice, last, expected) => {
    expect(shouldFill(o({ side, type, limitPrice }), last)).toBe(expected);
  });

  it.each([
    ['buy', 1450, 1451, true],
    ['buy', 1450, 1449, false],
    ['sell', 1350, 1349, true],
    ['sell', 1350, 1351, false],
  ] as const)('%s stop at %d against %d', (side, triggerPrice, last, expected) => {
    expect(shouldFill(o({ side, type: 'SL-M', triggerPrice }), last)).toBe(expected);
  });

  it('fills exactly at the limit or trigger price', () => {
    expect(shouldFill(o({ side: 'buy', type: 'LIMIT', limitPrice: 1350 }), 1350)).toBe(true);
    expect(shouldFill(o({ side: 'sell', type: 'SL-M', triggerPrice: 1350 }), 1350)).toBe(true);
  });
});

describe('quote failures and reset', () => {
  it('records a data error without discarding positions', () => {
    let s = run(withQuote(), { type: 'place', order: order() });
    s = simReducer(s, { type: 'quotes_failed', message: 'Market data unavailable.' });
    expect(s.error).toBe('Market data unavailable.');
    expect(s.account.positions['RELIANCE.NS::intraday'].quantity).toBe(10);
  });

  it('clears the error on the next successful quote', () => {
    let s = simReducer(initialSimState(), { type: 'quotes_failed', message: 'down' });
    s = simReducer(s, { type: 'quotes', quotes: [quote()], at: 1 });
    expect(s.error).toBeNull();
  });

  it('resets everything', () => {
    let s = run(withQuote(), { type: 'place', order: order() });
    s = simReducer(s, { type: 'reset' });
    expect(s.account.cash).toBe(STARTING_CASH);
    expect(s.blotter).toHaveLength(0);
    expect(Object.keys(s.account.positions)).toHaveLength(0);
  });
});
