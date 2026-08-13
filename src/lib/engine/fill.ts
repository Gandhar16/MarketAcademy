/**
 * The fill engine.
 *
 * This is the module that decides whether Market Academy is honest. Every
 * mainstream simulator fills you at the closing price, instantly, in full. That
 * single shortcut is why paper-trading results do not survive contact with a
 * real account, and it is pain point P4 in PLAN.md.
 *
 * What is modelled here:
 *   • bid-ask spread, widening with illiquidity and volatility
 *   • market impact, scaled by your size against the bar's actual volume
 *   • partial fills when you ask for more than the bar can absorb
 *   • gaps — a stop does NOT fill at your trigger when the bar opens through it
 *   • stop-limit orders that trigger and then never fill, which is the whole
 *     reason SL-M exists
 *   • circuit / limit states where one side of the book simply is not there
 *
 * What is NOT modelled, stated openly rather than pretended away:
 *   • the real order book. We have OHLCV bars, not depth. The spread and impact
 *     numbers below are a MODEL, calibrated to be conservative, and any UI that
 *     shows them must say so (PLAN.md §7.1).
 *   • intrabar path. Within one bar we know the high and the low but not the
 *     order they occurred in. Where that ambiguity matters we resolve it
 *     AGAINST the learner — see `pessimisticIntrabar` below.
 */

import type { Candle } from '../market/types';
import { canTradeAtBand, checkBand, type PriceBand } from './halts';
import type { OrderState } from './order';

export interface LiquidityContext {
  /** Average volume over a trailing window, same interval as the bar. */
  averageVolume: number | null;
  tickSize: number;
  /** Session price band, if the instrument has one. */
  band?: PriceBand;
  /** Previous bar's close, used to detect gaps. */
  previousClose?: number;
}

export interface FillConfig {
  /**
   * Baseline half-spread in ticks for a liquid instrument in a normal bar.
   * One tick each side is the tightest realistic assumption for a large-cap.
   */
  baseHalfSpreadTicks: number;
  /**
   * How much of a bar's volume a single participant can realistically take.
   * 10% is the standard conservative assumption in execution research; taking
   * more than that in one bar moves the price against you materially.
   */
  maxParticipation: number;
  /**
   * Market-impact coefficient. Impact is modelled as
   *   k x price x sqrt(orderQty / barVolume)
   * The square-root form is the standard empirical shape of impact — cost per
   * share grows sublinearly with size, not linearly.
   */
  impactK: number;
  /** When true, ambiguous intrabar sequencing resolves against the learner. */
  pessimisticIntrabar: boolean;
}

export const DEFAULT_FILL_CONFIG: FillConfig = {
  baseHalfSpreadTicks: 1,
  maxParticipation: 0.1,
  impactK: 0.1,
  pessimisticIntrabar: true,
};

export type NoFillReason =
  | 'limit_not_reached'
  | 'trigger_not_hit'
  | 'stop_limit_gapped_through'
  | 'circuit_locked'
  | 'no_volume';

export interface FillResult {
  /** Quantity actually filled in this bar. Zero is a legitimate outcome. */
  quantity: number;
  /** Volume-weighted average price of the fill, before costs. */
  price: number;
  /** Reference price the learner *expected* — used to show them the damage. */
  expectedPrice: number;
  /** price - expectedPrice, signed against the learner (positive = worse). */
  slippage: number;
  /** Decomposition, so the UI can explain rather than assert. */
  components: {
    halfSpread: number;
    impact: number;
    gap: number;
  };
  triggered: boolean;
  reason?: NoFillReason;
  /** Learner-facing explanation. Always populated when quantity is 0. */
  explanation: string;
}

/**
 * Estimated half-spread for this bar.
 *
 * Two multipliers on top of the baseline:
 *  • illiquidity — a bar trading at 20% of average volume gets a wider spread
 *  • volatility — a bar whose range is unusually large gets a wider spread
 * Both are capped so the model degrades gracefully rather than exploding on a
 * single weird bar.
 */
export function estimateHalfSpread(bar: Candle, ctx: LiquidityContext, cfg: FillConfig): number {
  const base = cfg.baseHalfSpreadTicks * ctx.tickSize;

  let illiquidity = 1;
  if (ctx.averageVolume && bar.volume != null && bar.volume > 0) {
    const ratio = bar.volume / ctx.averageVolume;
    // Thin bar → wider spread. Clamped to [1, 5].
    illiquidity = Math.min(5, Math.max(1, 1 / Math.max(0.2, ratio)));
  }

  let volatility = 1;
  const mid = (bar.high + bar.low) / 2;
  if (mid > 0) {
    const rangePct = ((bar.high - bar.low) / mid) * 100;
    // A 1% bar range is unremarkable; a 6% range is not. Clamped to [1, 4].
    volatility = Math.min(4, Math.max(1, rangePct / 1));
  }

  return base * illiquidity * volatility;
}

function marketImpact(quantity: number, bar: Candle, price: number, cfg: FillConfig): number {
  if (bar.volume == null || bar.volume <= 0) return 0;
  const participation = Math.min(1, quantity / bar.volume);
  return cfg.impactK * price * Math.sqrt(participation);
}

/** How much of this order the bar can absorb. */
function fillableQuantity(want: number, bar: Candle, cfg: FillConfig): number {
  if (bar.volume == null) return want; // no volume data (indices) — do not invent a cap
  const cap = Math.floor(bar.volume * cfg.maxParticipation);
  return Math.max(0, Math.min(want, cap));
}

/**
 * Attempt to fill `order` against a single `bar`.
 *
 * The bar passed in must be the bar AFTER the one the learner made their
 * decision on. The replay engine enforces that; this function assumes it.
 */
export function fillAgainstBar(
  order: OrderState,
  bar: Candle,
  ctx: LiquidityContext,
  cfg: FillConfig = DEFAULT_FILL_CONFIG,
): FillResult {
  const remaining = order.quantity - order.filledQuantity;
  const isBuy = order.side === 'buy';
  const halfSpread = estimateHalfSpread(bar, ctx, cfg);

  const none = (reason: NoFillReason, explanation: string, triggered = false): FillResult => ({
    quantity: 0,
    price: 0,
    expectedPrice: 0,
    slippage: 0,
    components: { halfSpread: 0, impact: 0, gap: 0 },
    triggered,
    reason,
    explanation,
  });

  if (remaining <= 0) return none('no_volume', 'Order is already complete.');

  // ── Circuit / limit state ────────────────────────────────────────────────
  // Checked first: if one side of the book is empty, nothing else matters.
  if (ctx.band) {
    const breach = checkBand(bar.close, ctx.band);
    const gate = canTradeAtBand(breach, order.side);
    if (!gate.allowed) {
      return none('circuit_locked', gate.reason as string);
    }
  }

  if (bar.volume === 0) {
    return none('no_volume', 'No trades printed in this bar. An order cannot fill against nothing.');
  }

  // ── Trigger evaluation for stop orders ───────────────────────────────────
  let triggered = order.status === 'triggered';
  let gapComponent = 0;
  /** Where a triggered stop actually becomes live. */
  let triggerFillReference: number | null = null;

  if ((order.type === 'SL' || order.type === 'SL-M') && !triggered) {
    const trigger = order.triggerPrice as number;
    if (isBuy) {
      if (bar.open >= trigger) {
        // The bar OPENED through the trigger. There was never an opportunity to
        // transact at the trigger price — the market gapped past it overnight.
        triggered = true;
        triggerFillReference = bar.open;
        gapComponent = bar.open - trigger;
      } else if (bar.high >= trigger) {
        triggered = true;
        triggerFillReference = trigger;
      }
    } else {
      if (bar.open <= trigger) {
        triggered = true;
        triggerFillReference = bar.open;
        gapComponent = trigger - bar.open;
      } else if (bar.low <= trigger) {
        triggered = true;
        triggerFillReference = trigger;
      }
    }

    if (!triggered) {
      return none(
        'trigger_not_hit',
        `Price never reached your trigger of ${order.triggerPrice} in this bar (range ${bar.low}–${bar.high}). The order is still resting.`,
      );
    }
  }

  // ── Determine the reference price this order works at ────────────────────
  const effectiveType = order.type === 'SL-M' ? 'MARKET' : order.type === 'SL' ? 'LIMIT' : order.type;
  const workingFrom = triggerFillReference ?? bar.open;

  let rawPrice: number;
  let expectedPrice: number;

  if (effectiveType === 'MARKET') {
    rawPrice = workingFrom;
    // What the learner thought they were getting: the trigger, or the price
    // they saw when they hit the button.
    expectedPrice = order.triggerPrice ?? (ctx.previousClose ?? bar.open);
  } else {
    const limit = order.limitPrice as number;

    if (isBuy) {
      if (bar.open <= limit) {
        // Marketable on the open — you cross the spread and get the open price,
        // which is BETTER than your limit. Price improvement is real; we do not
        // withhold it just to look conservative.
        rawPrice = bar.open;
      } else if (bar.low <= limit) {
        // Price came down to you. You are in a queue at the limit, and in a
        // pessimistic model a touch is not a guaranteed fill unless the bar
        // traded through your price.
        if (cfg.pessimisticIntrabar && bar.low >= limit - ctx.tickSize) {
          return none(
            'limit_not_reached',
            `Price touched your limit of ${limit} (bar low ${bar.low}) but did not trade through it. ` +
              `At the exact limit price you are behind everyone who queued earlier — a touch is not a fill.`,
            triggered,
          );
        }
        rawPrice = limit;
      } else {
        return none(
          'limit_not_reached',
          order.type === 'SL'
            ? `Your stop triggered, but the market gapped past your limit of ${limit} (bar range ${bar.low}–${bar.high}) and never came back. ` +
                `You are still holding the position. This is exactly what SL-M exists to prevent.`
            : `Price never fell to your limit of ${limit} (bar low ${bar.low}). The order is still resting.`,
          triggered,
        );
      }
    } else {
      if (bar.open >= limit) {
        rawPrice = bar.open;
      } else if (bar.high >= limit) {
        if (cfg.pessimisticIntrabar && bar.high <= limit + ctx.tickSize) {
          return none(
            'limit_not_reached',
            `Price touched your limit of ${limit} (bar high ${bar.high}) but did not trade through it. A touch is not a fill.`,
            triggered,
          );
        }
        rawPrice = limit;
      } else {
        return none(
          order.type === 'SL' ? 'stop_limit_gapped_through' : 'limit_not_reached',
          order.type === 'SL'
            ? `Your stop triggered at ${order.triggerPrice}, but the market gapped straight through your limit of ${limit} ` +
                `(bar range ${bar.low}–${bar.high}) and never traded back up to it. You are STILL LONG, now at ${bar.close}. ` +
                `An SL-M order would have got you out — at a bad price, but out.`
            : `Price never rose to your limit of ${limit} (bar high ${bar.high}). The order is still resting.`,
          triggered,
        );
      }
    }

    expectedPrice = limit;
  }

  // ── Size, spread, impact ─────────────────────────────────────────────────
  const quantity = fillableQuantity(remaining, bar, cfg);
  if (quantity <= 0) {
    return none(
      'no_volume',
      `This bar traded only ${bar.volume?.toLocaleString('en-IN') ?? 'an unknown number of'} shares. ` +
        `Taking more than ${Math.round(cfg.maxParticipation * 100)}% of a bar's volume is not realistic, so nothing filled. ` +
        `Size down, or accept that this instrument cannot absorb you.`,
      triggered,
    );
  }

  const impact = marketImpact(quantity, bar, rawPrice, cfg);

  // Crossing the spread and paying impact always works against you: buys fill
  // higher, sells fill lower. There is no configuration in which this is kind.
  const direction = isBuy ? 1 : -1;
  let price = rawPrice + direction * (halfSpread + impact);

  // A limit order can never fill worse than its limit — that is its contract.
  // The spread/impact adjustment is capped accordingly, and the shortfall shows
  // up as a partial fill in the real world rather than a worse price.
  if (effectiveType === 'LIMIT') {
    const limit = order.limitPrice as number;
    price = isBuy ? Math.min(price, limit) : Math.max(price, limit);
  }

  price = roundToTick(price, ctx.tickSize);

  const partial = quantity < remaining;

  return {
    quantity,
    price,
    expectedPrice,
    slippage: direction * (price - expectedPrice),
    components: { halfSpread, impact, gap: gapComponent },
    triggered,
    explanation: buildExplanation({
      order,
      bar,
      price,
      expectedPrice,
      quantity,
      remaining,
      partial,
      gapComponent,
      halfSpread,
      impact,
    }),
  };
}

function buildExplanation(a: {
  order: OrderState;
  bar: Candle;
  price: number;
  expectedPrice: number;
  quantity: number;
  remaining: number;
  partial: boolean;
  gapComponent: number;
  halfSpread: number;
  impact: number;
}): string {
  const parts: string[] = [];
  parts.push(`Filled ${a.quantity.toLocaleString('en-IN')} at ${a.price}.`);

  if (a.gapComponent > 0.0001) {
    parts.push(
      `The bar OPENED at ${a.bar.open}, through your trigger of ${a.order.triggerPrice} — ` +
        `a gap of ${a.gapComponent.toFixed(2)} per unit that no stop order could have avoided. ` +
        `Stops protect you from drift, not from gaps.`,
    );
  }

  if (a.partial) {
    parts.push(
      `Only ${a.quantity.toLocaleString('en-IN')} of ${a.remaining.toLocaleString('en-IN')} filled — the bar did not have the volume ` +
        `for the rest. The remainder is still working.`,
    );
  }

  if (a.halfSpread > 0) {
    parts.push(`Half-spread cost ${a.halfSpread.toFixed(4)}/unit; market impact ${a.impact.toFixed(4)}/unit (modelled).`);
  }

  return parts.join(' ');
}

export function roundToTick(price: number, tick: number): number {
  if (tick <= 0) return price;
  const decimals = Math.max(0, Math.ceil(-Math.log10(tick)) + 2);
  return Number((Math.round(price / tick) * tick).toFixed(decimals));
}
