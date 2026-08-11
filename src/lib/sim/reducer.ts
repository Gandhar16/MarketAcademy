/**
 * Simulator state, as a pure reducer.
 *
 * Everything that matters — order validation, resting-order matching, fills,
 * charges, mark-to-market, drawdown — happens here, with no React and no
 * network. That makes it unit-testable, which for the component that decides
 * whether a learner's P&L is honest is not optional.
 *
 * The component becomes a thin renderer plus a fetch loop that dispatches
 * `quotes` actions.
 */
import { estimateHalfSpread, type FillConfig } from '../engine/fill';
import { newOrderState, validateOrder, type InstrumentSpec, type OrderRequest, type OrderState } from '../engine/order';
import { applyFill, markToMarket, newAccount, type Account } from '../engine/portfolio';
import { TICK_SIZE_IN } from '../market/symbols';
import type { Quote } from '../market/types';
import type { Product } from '../engine/costs/types';

export const STARTING_CASH = 100_000;

const SIM_FILL_CONFIG: FillConfig = {
  baseHalfSpreadTicks: 1,
  maxParticipation: 0.1,
  impactK: 0.1,
  pessimisticIntrabar: true,
};

export interface BlotterEntry {
  id: string;
  at: number;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  note: string;
  charges: { key: string; label: string; amount: number; basis: string }[];
  chargeTotal: number;
}

export interface SimState {
  account: Account;
  quotes: Record<string, Quote>;
  resting: OrderState[];
  blotter: BlotterEntry[];
  /** Set when the last placed order was rejected. Cleared on the next action. */
  rejection: { reason: string; hint?: string } | null;
  error: string | null;
}

export function initialSimState(): SimState {
  return {
    account: newAccount({ market: 'IN', venue: 'NSE', startingCash: STARTING_CASH }),
    quotes: {},
    resting: [],
    blotter: [],
    rejection: null,
    error: null,
  };
}

export type SimAction =
  | { type: 'quotes'; quotes: Quote[]; at: number }
  | { type: 'quotes_failed'; message: string }
  | { type: 'place'; order: OrderRequest }
  | { type: 'cancel'; orderId: string }
  | { type: 'reset' };

/** Should this resting order fill against `last`? */
export function shouldFill(o: OrderState, last: number): boolean {
  switch (o.type) {
    case 'MARKET':
      return true;
    case 'LIMIT':
      return o.side === 'buy' ? last <= (o.limitPrice as number) : last >= (o.limitPrice as number);
    case 'SL':
    case 'SL-M':
      return o.side === 'buy' ? last >= (o.triggerPrice as number) : last <= (o.triggerPrice as number);
  }
}

/**
 * Fill price for a quote-driven simulator.
 *
 * We have a last-traded price, not a depth book, so the spread is MODELLED from
 * the day's range and volume. Buys pay up, sells get hit — never the reverse.
 * A limit order still cannot fill worse than its limit.
 */
export function fillPriceFor(order: OrderState, quote: Quote): number {
  const halfSpread = estimateHalfSpread(
    { time: 0, open: quote.open, high: quote.dayHigh, low: quote.dayLow, close: quote.price, volume: quote.volume },
    { averageVolume: quote.volume, tickSize: TICK_SIZE_IN },
    SIM_FILL_CONFIG,
  );

  const reference =
    order.type === 'LIMIT' || order.type === 'SL'
      ? // A resting limit fills at your price or better; where the market has
        // moved through it, you get the better of the two.
        order.side === 'buy'
        ? Math.min(order.limitPrice as number, quote.price)
        : Math.max(order.limitPrice as number, quote.price)
      : quote.price;

  const crossed = order.side === 'buy' ? reference + halfSpread : reference - halfSpread;

  const capped =
    order.type === 'LIMIT' || order.type === 'SL'
      ? order.side === 'buy'
        ? Math.min(crossed, order.limitPrice as number)
        : Math.max(crossed, order.limitPrice as number)
      : crossed;

  return Number(capped.toFixed(2));
}

function executeInto(state: SimState, order: OrderState, quote: Quote, at: number): SimState {
  const price = fillPriceFor(order, quote);
  const applied = applyFill(state.account, {
    symbol: order.symbol,
    product: order.product as Product,
    side: order.side,
    quantity: order.quantity,
    price,
    scripCount: 1,
    at,
  });

  const entry: BlotterEntry = {
    id: `${order.id}-${at}`,
    at,
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    price,
    note: applied.note,
    charges: applied.costs.lines.map((l) => ({ key: l.key, label: l.label, amount: l.amount, basis: l.basis })),
    chargeTotal: applied.costs.total,
  };

  return { ...state, account: applied.account, blotter: [entry, ...state.blotter] };
}

export function specFor(symbol: string): InstrumentSpec {
  return { symbol, market: 'IN', tickSize: TICK_SIZE_IN };
}

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'reset':
      return initialSimState();

    case 'quotes_failed':
      return { ...state, error: action.message };

    case 'quotes': {
      const quotes: Record<string, Quote> = {};
      for (const q of action.quotes) quotes[q.symbol] = q;

      let next: SimState = { ...state, quotes, error: null };

      // Match resting orders against the new prices, oldest first so that a
      // learner's queue behaves predictably.
      const stillResting: OrderState[] = [];
      for (const order of state.resting) {
        const q = quotes[order.symbol];
        if (!q || !shouldFill(order, q.price)) {
          stillResting.push(order);
          continue;
        }
        next = executeInto(next, order, q, action.at);
      }
      next = { ...next, resting: stillResting };

      // Mark to market AFTER fills, so drawdown reflects the position you
      // actually hold at this price rather than the one you held a moment ago.
      const marks = Object.fromEntries(Object.entries(quotes).map(([s, q]) => [s, q.price]));
      return { ...next, account: markToMarket(next.account, marks) };
    }

    case 'place': {
      const quote = state.quotes[action.order.symbol];
      if (!quote) {
        return { ...state, rejection: { reason: 'No live price for this symbol yet. Wait for the quote to load.' } };
      }

      const order = newOrderState(action.order);
      const check = validateOrder(order, specFor(order.symbol), {
        lastPrice: quote.price,
        availableCash: state.account.cash,
      });

      if (!check.ok) {
        return { ...state, rejection: { reason: check.reason ?? 'Order rejected.', hint: check.hint } };
      }

      const cleared = { ...state, rejection: null };
      if (order.type === 'MARKET') {
        return executeInto(cleared, order, quote, order.placedAt);
      }
      return { ...cleared, resting: [...cleared.resting, order] };
    }

    case 'cancel':
      return { ...state, resting: state.resting.filter((o) => o.id !== action.orderId), rejection: null };
  }
}
