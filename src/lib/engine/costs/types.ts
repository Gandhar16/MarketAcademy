/**
 * Cost engine — shared types.
 *
 * Every simulated fill in Market Academy runs through this. The rule from
 * PLAN.md §7.3 is absolute: *every trade shows its true cost*. That means no
 * rounded-off "assume 0.1% costs" hand-waving anywhere in the app.
 */

export type Market = 'IN' | 'US';

/** Which exchange the order routed to. Rates genuinely differ. */
export type Venue = 'NSE' | 'BSE' | 'MCX' | 'US';

/**
 * Product decides the tax treatment, not the instrument alone. The same
 * RELIANCE share bought and sold on the same day is `intraday` (0.025% STT on
 * sell only) but held overnight is `delivery` (0.1% STT on BOTH sides) — a 8x
 * difference that most courses never mention.
 */
export type Product =
  | 'delivery' // equity, taken to demat, T+1 settled
  | 'intraday' // equity, MIS/squared off same session
  | 'futures' // equity/index futures
  | 'options' // equity/index options
  | 'currency_futures'
  | 'currency_options'
  | 'commodity_futures'
  | 'commodity_options';

export type Side = 'buy' | 'sell';

/**
 * How an options position ended. This matters enormously and is the single
 * biggest account-killer we teach (PLAN.md §4): an ITM option you let expire is
 * taxed at 0.15% of *intrinsic value*, not of the premium you paid. A ₹5
 * premium option that expires ₹50 ITM on a ₹500,000 contract costs ₹750 in STT
 * on a ₹500 position.
 */
export type OptionDisposal =
  | 'traded' // squared off in the market before expiry — STT on premium
  | 'exercised' // ITM at expiry, auto-exercised — STT on intrinsic value
  | 'expired_worthless'; // OTM at expiry — no STT, no charge

export interface CostInput {
  market: Market;
  venue: Venue;
  product: Product;
  side: Side;
  /**
   * Price per unit. For options this is the PREMIUM per unit, never the spot.
   * Getting this wrong is the classic beginner error and the cost engine will
   * throw rather than silently produce a plausible-looking wrong number.
   */
  price: number;
  /** Total units. For F&O this is lots x lotSize, i.e. the real quantity. */
  quantity: number;
  /** Contract multiplier. India F&O = 1 (quantity already includes lot size). US options = 100. */
  multiplier?: number;
  /** Options only — how the position was closed out. Defaults to 'traded'. */
  disposal?: OptionDisposal;
  /** Options only — intrinsic value per unit at expiry. Required when disposal = 'exercised'. */
  intrinsicPerUnit?: number;
  /**
   * Number of distinct scrips sold from demat in this order. Drives DP charges,
   * which are per-scrip-per-day and flat — so they dominate small trades.
   */
  scripCount?: number;
  /** Broker plan. Defaults to the discount-broker plan used across the app. */
  brokerage?: BrokeragePlan;
}

/**
 * A broker plan, modelled as data so the "Cost Cutter" game (PLAN.md §5) can
 * hand the learner different brokers and let them feel the difference.
 */
export interface BrokeragePlan {
  id: string;
  label: string;
  market: Market;
  /** Per-order rules keyed by product. Missing product = zero brokerage. */
  rules: Partial<Record<Product, BrokerageRule>>;
}

export interface BrokerageRule {
  /** Percentage of turnover, as a percentage (0.03 means 0.03%). */
  percent?: number;
  /** Flat rupees/dollars per executed order. */
  flat?: number;
  /** Per share/contract charge (US style). */
  perUnit?: number;
  /**
   * How to combine the components above when more than one is set.
   * - `min` (default): Indian discount-broker style — "0.03% OR ₹20, whichever
   *   is lower". The components are alternatives.
   * - `sum`: US style — "$4.95 per trade PLUS $0.75 per contract". The
   *   components stack.
   * Getting this wrong silently understates costs, so it is explicit.
   */
  combine?: 'min' | 'sum';
  /** Cap applied after percent/flat/perUnit are combined. */
  max?: number;
  /** Floor applied after the cap. */
  min?: number;
}

/** One line in the cost breakdown shown to the learner after every fill. */
export interface CostLine {
  key: string;
  label: string;
  amount: number;
  /** Human-readable derivation, e.g. "0.1% x ₹1,25,000". Shown on hover. */
  basis: string;
  /** Who takes the money — helps learners see what is tax vs fee vs broker. */
  payee: 'broker' | 'exchange' | 'regulator' | 'government' | 'depository';
}

export interface CostBreakdown {
  lines: CostLine[];
  /** Sum of all lines. Always a positive number — a cost, never a signed P&L. */
  total: number;
  /** Notional value the charges were computed on. */
  turnover: number;
  /** total / turnover, as a percentage. The number that actually matters. */
  costPercent: number;
  /**
   * What the price must move (per unit, in currency) just to break even on a
   * round trip at this size. The single most useful number for a beginner and
   * one that no mainstream simulator surfaces.
   */
  breakevenPerUnit: number;
  currency: 'INR' | 'USD';
  notes: string[];
}
