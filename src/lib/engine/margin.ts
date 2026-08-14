/**
 * Leverage and forced liquidation — the mechanics "Margin Call" teaches.
 *
 * Deliberately a single simplified number rather than a faithful model of any
 * one broker's maintenance-margin schedule (those vary by stock, by product,
 * and change without notice). What has to be true regardless of the exact
 * schedule — and what this models honestly — is the shape of the danger:
 * higher leverage means a smaller price move erases the margin you posted,
 * and the exchange closes you out at ITS price the moment it does, not
 * whatever price you would have chosen.
 *
 * Long positions only. A short version would need the mirrored inequality
 * throughout; not built because the game does not need it yet.
 */

export const LEVERAGE_OPTIONS = [2, 5, 10] as const;
export type Leverage = (typeof LEVERAGE_OPTIONS)[number];

/**
 * The fraction of posted margin you are allowed to lose before the position
 * is force-closed. 0.5 means: once a mark-to-market loss has eaten half of
 * what you put up, you are out — standing in for the initial-margin /
 * maintenance-margin gap every real leveraged product has.
 */
export const LIQUIDATION_FRACTION = 0.5;

/** How much of the account balance is required to control one share at this leverage. */
export function marginRequiredFor(notional: number, leverage: number): number {
  return notional / leverage;
}

/** How many shares a given margin post controls at a given leverage. */
export function sharesForMargin(entryPrice: number, marginPosted: number, leverage: number): number {
  if (entryPrice <= 0) return 0;
  return (marginPosted * leverage) / entryPrice;
}

export function equityAt(opts: { entryPrice: number; price: number; shares: number; marginPosted: number }): number {
  return opts.marginPosted + opts.shares * (opts.price - opts.entryPrice);
}

/**
 * The price a long is force-closed at. Derived from `equity(t) <= f * margin`:
 * the position is out the moment its equity has fallen to `liquidationFraction`
 * of whatever margin is currently posted — recomputing this after a margin
 * top-up (more `marginPosted`, same `shares`) is what pushes the line down.
 */
export function liquidationPriceFor(opts: {
  entryPrice: number;
  shares: number;
  marginPosted: number;
  liquidationFraction?: number;
}): number {
  const f = opts.liquidationFraction ?? LIQUIDATION_FRACTION;
  if (opts.shares <= 0) return 0;
  return opts.entryPrice - (opts.marginPosted * (1 - f)) / opts.shares;
}

export interface MarginState {
  equity: number;
  liquidationPrice: number;
  /** How far the current price is above the liquidation price, as a percentage of the current price. Floored at 0. */
  distanceToCallPercent: number;
  liquidated: boolean;
}

export function marginStateAt(opts: {
  entryPrice: number;
  price: number;
  shares: number;
  marginPosted: number;
  liquidationFraction?: number;
}): MarginState {
  const equity = equityAt(opts);
  const liquidationPrice = liquidationPriceFor(opts);
  const distanceToCallPercent = opts.price > 0 ? Math.max(0, ((opts.price - liquidationPrice) / opts.price) * 100) : 0;
  return { equity, liquidationPrice, distanceToCallPercent, liquidated: opts.price <= liquidationPrice };
}
