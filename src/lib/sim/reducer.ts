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

/**
 * The default when nobody has told the simulator the learner's real balance
 * yet. In the app this is only ever a brief initial value — `Simulator.tsx`
 * fetches the shared account balance on mount and immediately dispatches
 * `hydrate` with the real one, same as Chart Replay does for its own
 * account. Kept independent of `BASE_STARTING_CASH` rather than reusing it:
 * this constant only has to hold up the reducer's own tests, which assume
 * enough capital for their fixture trade sizes.
 */
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
  product: Product;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  note: string;
  charges: { key: string; label: string; amount: number; basis: string }[];
  chargeTotal: number;
  /** Realised P&L from this fill, net of charges. Zero for a fill that only opened or added to a position. */
  realised: number;
}

/**
 * What a fill needs to be replayed through `applyFill` again — the same shape
 * whether it just executed live or is being loaded back from `sim_fills`.
 * Deliberately NOT a `Quote`: replay knows the price that was actually paid,
 * it does not re-derive one from a spread model. `realised` is not part of
 * this — `applyFill` recomputes it from the position it is replayed against,
 * the same way it did the first time.
 */
export interface PersistedFill {
  id: string;
  at: number;
  symbol: string;
  product: Product;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
}

/** The subset of a fill `executeInto` needs beyond the price and the id. */
interface FillInput {
  symbol: string;
  product: Product;
  side: 'buy' | 'sell';
  quantity: number;
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

export function initialSimState(startingCash: number = STARTING_CASH): SimState {
  return {
    account: newAccount({ market: 'IN', venue: 'NSE', startingCash }),
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
  | { type: 'reset'; startingCash?: number }
  /**
   * Rebuilds state from the learner's persisted fills (see lib/db/sim.ts),
   * oldest first, instead of a blank `initialSimState`. This is how a reload
   * gets its positions and blotter back — there is no separate saved
   * snapshot, only the same fill logic run again over the same fills.
   */
  | { type: 'hydrate'; startingCash: number; fills: PersistedFill[] };

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

/**
 * Applies one fill at a known price — live (the price just came from
 * `fillPriceFor`) or replayed (the price is whatever `sim_fills` recorded).
 * Either way the accounting is identical, which is the whole point: a reload
 * must reconstruct the exact same account a live session would have reached.
 */
function executeInto(state: SimState, fill: { id: string } & FillInput, price: number, at: number): SimState {
  const applied = applyFill(state.account, {
    symbol: fill.symbol,
    product: fill.product,
    side: fill.side,
    quantity: fill.quantity,
    price,
    scripCount: 1,
    at,
  });

  const entry: BlotterEntry = {
    id: fill.id,
    at,
    symbol: fill.symbol,
    product: fill.product,
    side: fill.side,
    quantity: fill.quantity,
    price,
    note: applied.note,
    charges: applied.costs.lines.map((l) => ({ key: l.key, label: l.label, amount: l.amount, basis: l.basis })),
    chargeTotal: applied.costs.total,
    realised: applied.realised,
  };

  return { ...state, account: applied.account, blotter: [entry, ...state.blotter] };
}

export function specFor(symbol: string): InstrumentSpec {
  return { symbol, market: 'IN', tickSize: TICK_SIZE_IN };
}

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'reset':
      return initialSimState(action.startingCash);

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
        next = executeInto(
          next,
          { id: order.id, symbol: order.symbol, product: order.product, side: order.side, quantity: order.quantity },
          fillPriceFor(order, q),
          action.at,
        );
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
        return executeInto(
          cleared,
          { id: order.id, symbol: order.symbol, product: order.product, side: order.side, quantity: order.quantity },
          fillPriceFor(order, quote),
          order.placedAt,
        );
      }
      return { ...cleared, resting: [...cleared.resting, order] };
    }

    case 'cancel':
      return { ...state, resting: state.resting.filter((o) => o.id !== action.orderId), rejection: null };

    case 'hydrate': {
      let next = initialSimState(action.startingCash);
      // Oldest first: replaying out of order would recompute a different
      // weighted-average entry price and different realised P&L on every
      // closing fill.
      const sorted = [...action.fills].sort((a, b) => a.at - b.at);
      for (const f of sorted) {
        next = executeInto(next, f, f.price, f.at);
      }
      return next;
    }
  }
}
