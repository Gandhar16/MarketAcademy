/**
 * Positions, cash, and honest P&L accounting.
 *
 * The design rule: costs are realised at the moment they are incurred, never
 * netted out at the end. A learner must see their cash balance drop by the
 * charges on the way IN, because that is what actually happens and it is what
 * makes the cost lesson stick.
 *
 * Realised P&L here is TRUE realised P&L — proceeds minus cost basis minus all
 * charges on both legs. It is not the gross number every simulator shows.
 */
import { computeCost, type CostBreakdown, type Market, type Product, type Venue } from './costs';

export interface Position {
  symbol: string;
  product: Product;
  /** Signed: positive is long, negative is short. */
  quantity: number;
  /**
   * Weighted average entry price, EXCLUDING charges. Charges are held
   * separately so the UI can show gross and net side by side rather than
   * burying costs inside an adjusted basis nobody can audit.
   */
  averagePrice: number;
  /** Total charges paid so far attributable to this position. */
  chargesPaid: number;
  openedAt: number;
}

export interface Account {
  market: Market;
  venue: Venue;
  cash: number;
  /** Starting equity, kept for drawdown and return calculations. */
  startingEquity: number;
  positions: Record<string, Position>;
  realisedPnl: number;
  totalCharges: number;
  /** Highest equity ever reached. Drawdown is measured from here. */
  peakEquity: number;
  maxDrawdown: number;
}

export function newAccount(opts: {
  market: Market;
  venue: Venue;
  /**
   * Deliberately small. PLAN.md P4: an infinite balance removes consequence.
   * ₹1,00,000 is a realistic first account and small enough that a ₹15 DP
   * charge is visible in the numbers.
   */
  startingCash: number;
}): Account {
  return {
    market: opts.market,
    venue: opts.venue,
    cash: opts.startingCash,
    startingEquity: opts.startingCash,
    positions: {},
    realisedPnl: 0,
    totalCharges: 0,
    peakEquity: opts.startingCash,
    maxDrawdown: 0,
  };
}

const key = (symbol: string, product: Product) => `${symbol}::${product}`;

export interface TradeApplication {
  account: Account;
  costs: CostBreakdown;
  /** Realised P&L from the portion of the trade that closed an existing position. */
  realised: number;
  /** Human-readable summary for the trade blotter. */
  note: string;
}

/**
 * Apply a fill to the account.
 *
 * Handles the four cases that trip up naive implementations: opening, adding to
 * a position, partially closing, and closing THROUGH zero into a reversal.
 */
export function applyFill(
  account: Account,
  fill: {
    symbol: string;
    product: Product;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    multiplier?: number;
    scripCount?: number;
    at: number;
  },
): TradeApplication {
  const { symbol, product, side, quantity, price, multiplier = 1, at } = fill;
  const k = key(symbol, product);
  const existing = account.positions[k];

  const costs = computeCost({
    market: account.market,
    venue: account.venue,
    product,
    side,
    price,
    quantity,
    multiplier,
    scripCount: fill.scripCount,
  });

  const signed = side === 'buy' ? quantity : -quantity;
  const notional = price * quantity * multiplier;

  const positions = { ...account.positions };
  let realised = 0;
  let note: string;

  if (!existing || existing.quantity === 0) {
    positions[k] = {
      symbol,
      product,
      quantity: signed,
      averagePrice: price,
      chargesPaid: costs.total,
      openedAt: at,
    };
    note = `Opened ${side === 'buy' ? 'long' : 'short'} ${quantity} ${symbol} at ${price}.`;
  } else if (Math.sign(existing.quantity) === Math.sign(signed)) {
    // Adding to the position — recompute the weighted average.
    const totalQty = existing.quantity + signed;
    positions[k] = {
      ...existing,
      quantity: totalQty,
      averagePrice:
        (existing.averagePrice * Math.abs(existing.quantity) + price * quantity) / Math.abs(totalQty),
      chargesPaid: existing.chargesPaid + costs.total,
    };
    note = `Added ${quantity} to ${symbol}; average now ${positions[k].averagePrice.toFixed(2)}.`;
  } else {
    // Reducing, closing, or reversing.
    const closingQty = Math.min(Math.abs(existing.quantity), quantity);
    const wasLong = existing.quantity > 0;
    // Gross P&L on the closed portion, before charges.
    const gross = (wasLong ? price - existing.averagePrice : existing.averagePrice - price) * closingQty * multiplier;

    // Charges attributable to the closed portion: the entry charges that were
    // capitalised against it, plus this exit's charges pro-rata.
    const entryShare = existing.chargesPaid * (closingQty / Math.abs(existing.quantity));
    const exitShare = costs.total * (closingQty / quantity);
    realised = gross - entryShare - exitShare;

    const remaining = existing.quantity + signed;
    if (remaining === 0) {
      delete positions[k];
      note =
        `Closed ${closingQty} ${symbol}. Gross ${gross.toFixed(2)}, charges ${(entryShare + exitShare).toFixed(2)}, ` +
        `net ${realised.toFixed(2)}.`;
    } else if (Math.sign(remaining) === Math.sign(existing.quantity)) {
      positions[k] = {
        ...existing,
        quantity: remaining,
        chargesPaid: existing.chargesPaid - entryShare,
      };
      note = `Reduced ${symbol} by ${closingQty}; ${Math.abs(remaining)} still open.`;
    } else {
      // Reversal: the leftover opens a fresh position in the other direction,
      // at this fill's price. Carrying the old average across a reversal is a
      // classic accounting bug that silently corrupts every later number.
      positions[k] = {
        symbol,
        product,
        quantity: remaining,
        averagePrice: price,
        chargesPaid: costs.total - exitShare,
        openedAt: at,
      };
      note = `Reversed ${symbol}: closed ${closingQty}, opened ${Math.abs(remaining)} the other way.`;
    }
  }

  // Cash moves by the notional AND the charges. Charges leave immediately.
  const cash = account.cash + (side === 'buy' ? -notional : notional) - costs.total;

  const next: Account = {
    ...account,
    cash,
    positions,
    realisedPnl: account.realisedPnl + realised,
    totalCharges: account.totalCharges + costs.total,
  };

  return { account: next, costs, realised, note };
}

/** Mark-to-market equity given current prices. */
export function equity(account: Account, marks: Record<string, number>): number {
  let value = account.cash;
  for (const p of Object.values(account.positions)) {
    const mark = marks[p.symbol];
    if (mark == null) continue;
    value += mark * p.quantity;
  }
  return value;
}

export function unrealisedPnl(account: Account, marks: Record<string, number>): number {
  let total = 0;
  for (const p of Object.values(account.positions)) {
    const mark = marks[p.symbol];
    if (mark == null) continue;
    total += (mark - p.averagePrice) * p.quantity;
  }
  return total;
}

/**
 * Update the drawdown watermark. Call this on every mark, not just on trades —
 * drawdown that happens while you sit in a position is still drawdown, and it
 * is the kind that actually makes people abandon a plan.
 */
export function markToMarket(account: Account, marks: Record<string, number>): Account {
  const eq = equity(account, marks);
  const peakEquity = Math.max(account.peakEquity, eq);
  const drawdown = peakEquity > 0 ? (peakEquity - eq) / peakEquity : 0;
  return {
    ...account,
    peakEquity,
    maxDrawdown: Math.max(account.maxDrawdown, drawdown),
  };
}

/**
 * Position size from a stop distance and a risk budget — the single most
 * useful calculation in retail trading, and the one most people never do.
 *
 * quantity = (equity x riskFraction) / |entry - stop|
 */
export function sizeFromStop(opts: {
  equity: number;
  riskFraction: number;
  entry: number;
  stop: number;
  lotSize?: number;
}): { quantity: number; riskAmount: number; note: string } {
  const distance = Math.abs(opts.entry - opts.stop);
  if (distance <= 0) {
    return { quantity: 0, riskAmount: 0, note: 'Stop must differ from entry — otherwise risk per unit is zero.' };
  }
  const riskAmount = opts.equity * opts.riskFraction;
  let quantity = Math.floor(riskAmount / distance);

  if (opts.lotSize) {
    const lots = Math.floor(quantity / opts.lotSize);
    quantity = lots * opts.lotSize;
    if (quantity === 0) {
      return {
        quantity: 0,
        riskAmount,
        note:
          `One lot of ${opts.lotSize} risks ${(opts.lotSize * distance).toFixed(2)}, which is more than your ` +
          `${(opts.riskFraction * 100).toFixed(1)}% budget of ${riskAmount.toFixed(2)}. The honest answer is that this ` +
          `trade is too big for this account — not that you should widen the stop.`,
      };
    }
  }

  return {
    quantity,
    riskAmount,
    note:
      `${quantity} units risks ${(quantity * distance).toFixed(2)} if the stop fills exactly — ` +
      `${((quantity * distance) / opts.equity * 100).toFixed(2)}% of equity. Slippage and gaps can make it worse.`,
  };
}
