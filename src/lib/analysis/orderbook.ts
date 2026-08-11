/**
 * An order book model, and what a market order actually does to it.
 *
 * MODEL, NOT MARKET DATA. Free data sources do not publish depth, so this book
 * is generated from a stated shape. Per PLAN.md §7.1 every surface that renders
 * it must label it a model. What it teaches is nonetheless exactly right: a
 * market order does not execute "at the price" — it walks the book, paying more
 * for each successive level, and the average you get is worse than the touch.
 *
 * That single mechanic explains slippage, why size matters, why illiquid names
 * are dangerous, and why the number on the screen is not the number you get.
 */

export interface BookLevel {
  price: number;
  /** Quantity resting at this price. */
  quantity: number;
  /** Number of individual orders — real books show this and it shapes intuition. */
  orders: number;
}

export interface OrderBook {
  /** Highest price a buyer will pay, descending. */
  bids: BookLevel[];
  /** Lowest price a seller will accept, ascending. */
  asks: BookLevel[];
}

export interface BookShape {
  /** Mid price the book is centred on. */
  mid: number;
  tickSize: number;
  /** Ticks between best bid and best ask. 1 is a very liquid large-cap. */
  spreadTicks: number;
  /** Quantity at the touch. */
  topQuantity: number;
  /**
   * How quantity grows as you move away from the touch. Real books are thin at
   * the touch and thicker behind it — which is why a big order gets a much
   * worse average than the quote suggests.
   */
  depthGrowth: number;
  levels: number;
  /** Skew > 0 puts more size on the bid, < 0 on the ask. */
  imbalance?: number;
}

export const LIQUID_LARGE_CAP: BookShape = {
  mid: 1400,
  tickSize: 0.05,
  spreadTicks: 1,
  topQuantity: 450,
  depthGrowth: 1.35,
  levels: 10,
};

export const ILLIQUID_SMALL_CAP: BookShape = {
  mid: 240,
  tickSize: 0.05,
  spreadTicks: 8,
  topQuantity: 25,
  depthGrowth: 1.1,
  levels: 10,
};

/**
 * Build a book from a shape. Deterministic — no randomness, so lessons repeat.
 *
 * Prices are computed in INTEGER TICK UNITS and converted at the end. Working
 * in rupees and rounding afterwards collapses adjacent levels onto the same
 * price whenever the spread is an odd number of ticks, because the half-tick
 * offset lands exactly on a rounding boundary and floating point decides
 * arbitrarily which way it goes. Integers make the ladder exact by
 * construction.
 */
export function buildBook(shape: BookShape): OrderBook {
  const skew = shape.imbalance ?? 0;
  const midTicks = Math.round(shape.mid / shape.tickSize);
  const bidTopTicks = midTicks - Math.floor(shape.spreadTicks / 2);
  const askTopTicks = bidTopTicks + shape.spreadTicks;

  const level = (n: number, side: 'bid' | 'ask'): BookLevel => {
    const ticks = side === 'bid' ? bidTopTicks - n : askTopTicks + n;
    const bias = side === 'bid' ? 1 + skew : 1 - skew;
    return {
      price: Number((ticks * shape.tickSize).toFixed(4)),
      quantity: Math.max(1, Math.round(shape.topQuantity * Math.pow(shape.depthGrowth, n) * bias)),
      orders: Math.max(1, Math.round((shape.topQuantity * Math.pow(shape.depthGrowth, n)) / 60) + 1),
    };
  };

  return {
    bids: Array.from({ length: shape.levels }, (_, n) => level(n, 'bid')),
    asks: Array.from({ length: shape.levels }, (_, n) => level(n, 'ask')),
  };
}

export const bestBid = (book: OrderBook): number | null => book.bids[0]?.price ?? null;
export const bestAsk = (book: OrderBook): number | null => book.asks[0]?.price ?? null;

export function spread(book: OrderBook): number | null {
  const b = bestBid(book);
  const a = bestAsk(book);
  return b == null || a == null ? null : Number((a - b).toFixed(4));
}

export function midPrice(book: OrderBook): number | null {
  const b = bestBid(book);
  const a = bestAsk(book);
  return b == null || a == null ? null : Number(((a + b) / 2).toFixed(4));
}

export interface WalkStep {
  price: number;
  quantity: number;
  value: number;
}

export interface WalkResult {
  /** Levels consumed, in order. */
  steps: WalkStep[];
  filledQuantity: number;
  /** Quantity that could not be filled — the book ran out. */
  unfilledQuantity: number;
  averagePrice: number;
  /** The price shown at the touch before the order was sent. */
  touchPrice: number;
  /** averagePrice − touchPrice for a buy, signed so positive is always worse. */
  slippage: number;
  slippagePercent: number;
  /** Levels the order ate through. One means it did not move the market. */
  levelsConsumed: number;
}

/**
 * Walk a market order through the book.
 *
 * A buy consumes asks from the best upward; a sell consumes bids from the best
 * downward. This is the whole mechanic, and it is why "I'll just use a market
 * order" is a decision with a price attached rather than a free convenience.
 */
export function walkBook(book: OrderBook, side: 'buy' | 'sell', quantity: number): WalkResult {
  if (quantity <= 0) throw new Error('walkBook: quantity must be positive');

  const levels = side === 'buy' ? book.asks : book.bids;
  const touchPrice = levels[0]?.price ?? 0;

  const steps: WalkStep[] = [];
  let remaining = quantity;

  for (const level of levels) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, level.quantity);
    steps.push({ price: level.price, quantity: take, value: take * level.price });
    remaining -= take;
  }

  const filledQuantity = quantity - remaining;
  const value = steps.reduce((s, x) => s + x.value, 0);
  const averagePrice = filledQuantity > 0 ? value / filledQuantity : 0;

  // Signed so positive always means "worse for you", whichever side you are on.
  const slippage = filledQuantity === 0 ? 0 : side === 'buy' ? averagePrice - touchPrice : touchPrice - averagePrice;

  return {
    steps,
    filledQuantity,
    unfilledQuantity: remaining,
    averagePrice,
    touchPrice,
    slippage,
    slippagePercent: touchPrice > 0 ? (slippage / touchPrice) * 100 : 0,
    levelsConsumed: steps.length,
  };
}

/** Total quantity resting on each side — the imbalance traders watch. */
export function bookDepth(book: OrderBook): { bidQuantity: number; askQuantity: number; imbalance: number } {
  const bidQuantity = book.bids.reduce((s, l) => s + l.quantity, 0);
  const askQuantity = book.asks.reduce((s, l) => s + l.quantity, 0);
  const total = bidQuantity + askQuantity;
  return {
    bidQuantity,
    askQuantity,
    // −1 (all sellers) to +1 (all buyers).
    imbalance: total === 0 ? 0 : (bidQuantity - askQuantity) / total,
  };
}

/**
 * The largest order that can fill without moving past the touch.
 *
 * This is the number that should determine your size in an illiquid name, and
 * almost nobody looks at it.
 */
export function sizeAtTouch(book: OrderBook, side: 'buy' | 'sell'): number {
  const levels = side === 'buy' ? book.asks : book.bids;
  return levels[0]?.quantity ?? 0;
}
