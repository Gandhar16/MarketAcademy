import { describe, expect, it } from 'vitest';
import {
  ILLIQUID_SMALL_CAP,
  LIQUID_LARGE_CAP,
  bestAsk,
  bestBid,
  bookDepth,
  buildBook,
  midPrice,
  sizeAtTouch,
  spread,
  walkBook,
  type OrderBook,
} from './orderbook';

const book = buildBook(LIQUID_LARGE_CAP);
const thin = buildBook(ILLIQUID_SMALL_CAP);

describe('book construction', () => {
  it('puts the bid at or below the mid and the ask at or above it', () => {
    // With an odd tick spread one side necessarily sits ON the requested mid —
    // a half-tick price does not exist. What must always hold is bid < ask.
    expect(bestBid(book)!).toBeLessThanOrEqual(LIQUID_LARGE_CAP.mid);
    expect(bestAsk(book)!).toBeGreaterThanOrEqual(LIQUID_LARGE_CAP.mid);
    expect(bestBid(book)!).toBeLessThan(bestAsk(book)!);

    // With an even spread both sides straddle it strictly.
    expect(bestBid(thin)!).toBeLessThan(ILLIQUID_SMALL_CAP.mid);
    expect(bestAsk(thin)!).toBeGreaterThan(ILLIQUID_SMALL_CAP.mid);
  });

  it('orders bids descending and asks ascending', () => {
    for (let i = 1; i < book.bids.length; i++) {
      expect(book.bids[i].price).toBeLessThan(book.bids[i - 1].price);
      expect(book.asks[i].price).toBeGreaterThan(book.asks[i - 1].price);
    }
  });

  it('honours the requested spread in ticks', () => {
    expect(spread(book)).toBeCloseTo(LIQUID_LARGE_CAP.spreadTicks * LIQUID_LARGE_CAP.tickSize, 4);
    expect(spread(thin)).toBeCloseTo(ILLIQUID_SMALL_CAP.spreadTicks * ILLIQUID_SMALL_CAP.tickSize, 4);
  });

  it('gets thicker away from the touch, as real books do', () => {
    expect(book.asks[5].quantity).toBeGreaterThan(book.asks[0].quantity);
    expect(book.bids[5].quantity).toBeGreaterThan(book.bids[0].quantity);
  });

  it('snaps every price to the tick size', () => {
    for (const level of [...book.bids, ...book.asks]) {
      const ticks = level.price / LIQUID_LARGE_CAP.tickSize;
      expect(Math.abs(ticks - Math.round(ticks))).toBeLessThan(1e-6);
    }
  });

  it('is deterministic — the same shape builds the same book', () => {
    expect(buildBook(LIQUID_LARGE_CAP)).toEqual(buildBook(LIQUID_LARGE_CAP));
  });

  it('centres the touch prices around the requested mid, within half a tick', () => {
    // With an odd spread the true mid sits on a half-tick, which is not a
    // representable price — so "within half a tick" is the correct assertion.
    expect(Math.abs(midPrice(book)! - LIQUID_LARGE_CAP.mid)).toBeLessThanOrEqual(LIQUID_LARGE_CAP.tickSize / 2 + 1e-9);
    expect(midPrice(thin)).toBeCloseTo(ILLIQUID_SMALL_CAP.mid, 4);
  });

  it('never places two levels at the same price', () => {
    const prices = [...book.bids, ...book.asks].map((l) => l.price);
    expect(new Set(prices).size).toBe(prices.length);
    const thinPrices = [...thin.bids, ...thin.asks].map((l) => l.price);
    expect(new Set(thinPrices).size).toBe(thinPrices.length);
  });

  it('skews depth when an imbalance is requested', () => {
    const buyPressure = buildBook({ ...LIQUID_LARGE_CAP, imbalance: 0.5 });
    const d = bookDepth(buyPressure);
    expect(d.bidQuantity).toBeGreaterThan(d.askQuantity);
    expect(d.imbalance).toBeGreaterThan(0);
  });
});

describe('walking the book — the mechanic the whole lesson turns on', () => {
  it('fills a small buy entirely at the touch with zero slippage', () => {
    const r = walkBook(book, 'buy', 100);
    expect(r.levelsConsumed).toBe(1);
    expect(r.averagePrice).toBe(bestAsk(book));
    expect(r.slippage).toBe(0);
  });

  it('pays progressively worse prices as the order eats levels', () => {
    const r = walkBook(book, 'buy', 3000);
    expect(r.levelsConsumed).toBeGreaterThan(1);
    for (let i = 1; i < r.steps.length; i++) {
      expect(r.steps[i].price).toBeGreaterThan(r.steps[i - 1].price);
    }
    expect(r.averagePrice).toBeGreaterThan(r.touchPrice);
    expect(r.slippage).toBeGreaterThan(0);
  });

  it('mirrors for a sell — the average is BELOW the touch', () => {
    const r = walkBook(book, 'sell', 3000);
    expect(r.averagePrice).toBeLessThan(r.touchPrice);
    // Slippage is signed so positive always means worse for the trader.
    expect(r.slippage).toBeGreaterThan(0);
  });

  it('costs far more in an illiquid book for the same quantity', () => {
    const liquid = walkBook(book, 'buy', 2000);
    const illiquid = walkBook(thin, 'buy', 2000);
    expect(illiquid.slippagePercent).toBeGreaterThan(liquid.slippagePercent * 3);
  });

  it('reports what it could not fill rather than pretending it did', () => {
    const total = book.asks.reduce((s, l) => s + l.quantity, 0);
    const r = walkBook(book, 'buy', total + 5000);
    expect(r.filledQuantity).toBe(total);
    expect(r.unfilledQuantity).toBe(5000);
    expect(r.levelsConsumed).toBe(book.asks.length);
  });

  it('never fills below the touch on a buy or above it on a sell', () => {
    for (const qty of [10, 500, 5000, 50_000]) {
      const buy = walkBook(book, 'buy', qty);
      const sell = walkBook(book, 'sell', qty);
      if (buy.filledQuantity > 0) expect(buy.averagePrice).toBeGreaterThanOrEqual(buy.touchPrice - 1e-9);
      if (sell.filledQuantity > 0) expect(sell.averagePrice).toBeLessThanOrEqual(sell.touchPrice + 1e-9);
    }
  });

  it('makes average price monotonically worse as size grows', () => {
    let previous = 0;
    for (const qty of [100, 500, 1500, 4000, 9000]) {
      const r = walkBook(book, 'buy', qty);
      expect(r.averagePrice).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = r.averagePrice;
    }
  });

  it('conserves quantity across the steps it reports', () => {
    const r = walkBook(book, 'buy', 3000);
    expect(r.steps.reduce((s, x) => s + x.quantity, 0)).toBe(r.filledQuantity);
  });

  it('rejects a non-positive quantity', () => {
    expect(() => walkBook(book, 'buy', 0)).toThrow(/positive/);
  });

  it('handles an empty book without dividing by zero', () => {
    const empty: OrderBook = { bids: [], asks: [] };
    const r = walkBook(empty, 'buy', 100);
    expect(r.filledQuantity).toBe(0);
    expect(r.unfilledQuantity).toBe(100);
    expect(Number.isFinite(r.averagePrice)).toBe(true);
    expect(spread(empty)).toBeNull();
  });
});

describe('sizing against the touch', () => {
  it('reports the largest order that will not move the price', () => {
    expect(sizeAtTouch(book, 'buy')).toBe(book.asks[0].quantity);
    const r = walkBook(book, 'buy', sizeAtTouch(book, 'buy'));
    expect(r.levelsConsumed).toBe(1);
    expect(r.slippage).toBe(0);
  });

  it('is dramatically smaller in an illiquid name', () => {
    expect(sizeAtTouch(thin, 'buy')).toBeLessThan(sizeAtTouch(book, 'buy') / 5);
  });
});
