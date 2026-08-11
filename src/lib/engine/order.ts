/**
 * Orders: the vocabulary, and the validation that rejects bad ones.
 *
 * The "Order Gauntlet" game (PLAN.md §5) trains order-type selection, so the
 * type system here has to carry the real distinctions — particularly the one
 * beginners collapse: SL and SL-M are NOT the same order, and the difference
 * shows up precisely when it hurts, in a fast market.
 */

import type { Product, Side } from './costs/types';

export type OrderType =
  /** Executes immediately at whatever the book offers. Certain execution, uncertain price. */
  | 'MARKET'
  /** Executes at your price or better, or not at all. Certain price, uncertain execution. */
  | 'LIMIT'
  /**
   * Stop-loss LIMIT. Two prices: a trigger, and a limit. When the trigger is
   * hit, a LIMIT order enters the book. In a gap-down, the limit is below the
   * market and it never fills — you are still holding the position, now much
   * lower. This is the classic "my stop loss didn't work" story.
   */
  | 'SL'
  /**
   * Stop-loss MARKET. One price: the trigger. When hit, a MARKET order enters.
   * You WILL get out; you may hate the price. In a fast market this is usually
   * the correct trade-off, and beginners usually pick the other one.
   */
  | 'SL-M';

export type Validity =
  /** Cancelled at the end of the session if unfilled. */
  | 'DAY'
  /** Immediate-or-cancel: fill what you can right now, cancel the rest. */
  | 'IOC';

export interface OrderRequest {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  type: OrderType;
  product: Product;
  /** Required for LIMIT and SL. */
  limitPrice?: number;
  /** Required for SL and SL-M. */
  triggerPrice?: number;
  validity: Validity;
  /** Epoch ms the order was placed. */
  placedAt: number;
}

export type OrderStatus =
  | 'pending' // resting in the book
  | 'triggered' // stop hit, now working as market/limit
  | 'filled'
  | 'partial'
  | 'cancelled'
  | 'rejected';

export interface OrderState extends OrderRequest {
  status: OrderStatus;
  filledQuantity: number;
  averageFillPrice: number;
  rejectReason?: string;
}

export interface InstrumentSpec {
  symbol: string;
  market: 'IN' | 'US';
  tickSize: number;
  /** F&O only. Orders must be whole multiples of this. */
  lotSize?: number;
  /**
   * Exchange freeze quantity — the largest single order the exchange accepts.
   * Bigger positions must be sliced into multiple orders. Most retail learners
   * never hit it; anyone trading index options at size hits it constantly.
   */
  freezeQuantity?: number;
  /** Price band for the session, if the security has one. */
  band?: { lower: number; upper: number };
}

export interface ValidationResult {
  ok: boolean;
  /** Populated when ok is false. Written to be shown verbatim to the learner. */
  reason?: string;
  /** A concrete suggestion, e.g. the nearest valid price. */
  hint?: string;
}

const EPS = 1e-9;

function isMultipleOf(value: number, step: number): boolean {
  if (step <= 0) return true;
  const q = value / step;
  return Math.abs(q - Math.round(q)) < 1e-6;
}

/**
 * Validates an order the way an exchange would: structurally first, then
 * economically. Every rejection message names the rule, because a rejected
 * order is a teaching moment and "Order rejected" wastes it.
 */
export function validateOrder(
  order: OrderRequest,
  spec: InstrumentSpec,
  context: { availableCash?: number; lastPrice: number } ,
): ValidationResult {
  if (!Number.isFinite(order.quantity) || order.quantity <= 0) {
    return { ok: false, reason: 'Quantity must be a positive number.' };
  }

  if (spec.lotSize && !isMultipleOf(order.quantity, spec.lotSize)) {
    const nearest = Math.max(spec.lotSize, Math.round(order.quantity / spec.lotSize) * spec.lotSize);
    return {
      ok: false,
      reason: `Derivatives trade in lots. ${spec.symbol} has a lot size of ${spec.lotSize}, so quantity must be a multiple of ${spec.lotSize}.`,
      hint: `Nearest valid quantity: ${nearest} (${nearest / spec.lotSize} lot${nearest / spec.lotSize === 1 ? '' : 's'}).`,
    };
  }

  if (spec.freezeQuantity && order.quantity > spec.freezeQuantity) {
    return {
      ok: false,
      reason: `Exceeds the exchange freeze quantity of ${spec.freezeQuantity} for ${spec.symbol}. The exchange will not accept a single order this large.`,
      hint: `Split it into ${Math.ceil(order.quantity / spec.freezeQuantity)} orders of at most ${spec.freezeQuantity}.`,
    };
  }

  const needsLimit = order.type === 'LIMIT' || order.type === 'SL';
  const needsTrigger = order.type === 'SL' || order.type === 'SL-M';

  if (needsLimit && (order.limitPrice == null || order.limitPrice <= 0)) {
    return { ok: false, reason: `A ${order.type} order needs a limit price.` };
  }
  if (needsTrigger && (order.triggerPrice == null || order.triggerPrice <= 0)) {
    return { ok: false, reason: `A ${order.type} order needs a trigger price.` };
  }
  if (order.type === 'MARKET' && (order.limitPrice != null || order.triggerPrice != null)) {
    return { ok: false, reason: 'A MARKET order takes no price — that is the whole point of it.' };
  }

  for (const [label, price] of [
    ['Limit price', order.limitPrice],
    ['Trigger price', order.triggerPrice],
  ] as const) {
    if (price == null) continue;
    if (!isMultipleOf(price, spec.tickSize)) {
      const nearest = Math.round(price / spec.tickSize) * spec.tickSize;
      return {
        ok: false,
        reason: `${label} must be a multiple of the tick size ${spec.tickSize}. The exchange cannot represent ${price}.`,
        hint: `Nearest valid price: ${nearest.toFixed(countDecimals(spec.tickSize))}.`,
      };
    }
    if (spec.band && (price < spec.band.lower - EPS || price > spec.band.upper + EPS)) {
      return {
        ok: false,
        reason: `${label} ${price} is outside today's price band of ${spec.band.lower}–${spec.band.upper}. Orders outside the band are rejected outright.`,
      };
    }
  }

  // Stop direction. Getting this backwards turns a protective stop into an
  // instant market order, which is a real and common way to lose money by
  // accident — so it is a hard rejection with an explanation, not a warning.
  if (needsTrigger) {
    const trigger = order.triggerPrice as number;
    if (order.side === 'sell' && trigger >= context.lastPrice) {
      return {
        ok: false,
        reason: `A protective SELL stop must sit BELOW the current price (${context.lastPrice}). A trigger at ${trigger} would fire immediately.`,
        hint: 'If you meant to sell into strength at a higher price, you want a LIMIT order, not a stop.',
      };
    }
    if (order.side === 'buy' && trigger <= context.lastPrice) {
      return {
        ok: false,
        reason: `A BUY stop must sit ABOVE the current price (${context.lastPrice}). A trigger at ${trigger} would fire immediately.`,
        hint: 'If you meant to buy the dip at a lower price, you want a LIMIT order, not a stop.',
      };
    }
  }

  // SL limit sanity: the limit must be reachable once the trigger fires.
  if (order.type === 'SL') {
    const trigger = order.triggerPrice as number;
    const limit = order.limitPrice as number;
    if (order.side === 'sell' && limit > trigger) {
      return {
        ok: false,
        reason: `On a SELL SL order the limit (${limit}) must be at or below the trigger (${trigger}) — otherwise the order can never fill.`,
      };
    }
    if (order.side === 'buy' && limit < trigger) {
      return {
        ok: false,
        reason: `On a BUY SL order the limit (${limit}) must be at or above the trigger (${trigger}) — otherwise the order can never fill.`,
      };
    }
  }

  if (order.side === 'buy' && context.availableCash != null) {
    const price = order.limitPrice ?? order.triggerPrice ?? context.lastPrice;
    const required = price * order.quantity;
    if (required > context.availableCash + EPS) {
      return {
        ok: false,
        reason: `Insufficient funds: this order needs about ${required.toFixed(2)} but only ${context.availableCash.toFixed(2)} is available.`,
        hint: `The largest quantity you can afford at this price is ${Math.floor(context.availableCash / price)}.`,
      };
    }
  }

  return { ok: true };
}

function countDecimals(step: number): number {
  const s = String(step);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

export function newOrderState(order: OrderRequest): OrderState {
  return { ...order, status: 'pending', filledQuantity: 0, averageFillPrice: 0 };
}
