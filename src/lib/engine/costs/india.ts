/**
 * India (NSE/BSE/MCX) cost engine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RATE SOURCES — verified 2026-08-09. Every rate below is a real, current,
 * citable number. If you change one, change the citation with it.
 *
 * STT/CTT ......... Budget 2026 schedule, effective 2026-04-01.
 *                   https://cleartax.in/s/securities-transaction-tax
 *                   https://support.zerodha.com/category/account-opening/resident-individual/ri-charges/articles/how-is-the-securities-transaction-tax-stt-calculated
 * Exchange txn .... NSE/BSE revised schedule effective 2026-03-01 (IPFT merged in).
 *                   https://support.zerodha.com/category/trading-and-markets/charges/charges-explained/articles/exchange-transaction-charges
 * SEBI turnover ... ₹10 per crore = 0.0001% of turnover, both sides.
 * Stamp duty ...... Uniform national rates, Indian Stamp Act as amended 2020.
 *                   BUY SIDE ONLY.
 * GST ............. 18%, levied on (brokerage + SEBI + exchange txn charges).
 *                   Note it is NOT levied on STT or stamp duty — tax on tax is
 *                   not a thing here, and learners routinely get this wrong.
 * DP charges ...... ₹3.50 CDSL + ₹9.50 broker per scrip per day on DELIVERY
 *                   SELL only, + 18% GST → ₹15.34 all-in.
 *                   https://zerodha.com/charges/
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  BrokeragePlan,
  BrokerageRule,
  CostBreakdown,
  CostInput,
  CostLine,
  Product,
  Venue,
} from './types';

// ── Statutory rates, as percentages of the stated base ──────────────────────

/** STT/CTT. `null` = not levied on that side. */
export const STT_IN = {
  /** Equity delivery: 0.1% on BOTH buy and sell. */
  delivery: { buy: 0.1, sell: 0.1 },
  /** Equity intraday: sell side only. */
  intraday: { buy: null, sell: 0.025 },
  /** Equity/index futures: sell side only, on contract value. */
  futures: { buy: null, sell: 0.05 },
  /**
   * Options: 0.15% of PREMIUM on sell. On exercise, 0.15% of INTRINSIC VALUE,
   * charged to the long holder. See §4 "the classic account-killer".
   */
  options: { buy: null, sell: 0.15, exercise: 0.15 },
  currency_futures: { buy: null, sell: null },
  currency_options: { buy: null, sell: null },
  /** CTT, non-agri commodities. */
  commodity_futures: { buy: null, sell: 0.01 },
  commodity_options: { buy: null, sell: 0.05 },
} as const;

/** Exchange transaction charges, % of turnover (options: % of premium turnover). */
export const EXCHANGE_TXN_IN: Record<Venue, Partial<Record<Product, number>>> = {
  NSE: {
    delivery: 0.00307,
    intraday: 0.00307,
    futures: 0.00183,
    options: 0.03553,
    currency_futures: 0.00035,
    currency_options: 0.0311,
  },
  BSE: {
    delivery: 0.00375,
    intraday: 0.00375,
    futures: 0,
    options: 0.005,
    currency_futures: 0.00045,
    currency_options: 0.001,
  },
  MCX: {
    commodity_futures: 0.0021,
    commodity_options: 0.0418,
  },
  US: {},
};

/** SEBI turnover fee: ₹10 per crore, both sides, every segment. */
export const SEBI_TURNOVER_PERCENT = 0.0001;

/** Stamp duty, BUY SIDE ONLY, % of turnover. */
export const STAMP_DUTY_IN: Partial<Record<Product, number>> = {
  delivery: 0.015,
  intraday: 0.003,
  futures: 0.002,
  options: 0.003,
  currency_futures: 0.0001,
  currency_options: 0.0001,
  commodity_futures: 0.002,
  commodity_options: 0.003,
};

export const GST_RATE = 18;

/** CDSL depository fee per scrip, per day, on delivery sell. */
export const DP_DEPOSITORY_FEE = 3.5;
/** Broker's slice of the DP charge. */
export const DP_BROKER_FEE = 9.5;

// ── Broker plans ────────────────────────────────────────────────────────────

const DISCOUNT_RULE: BrokerageRule = { percent: 0.03, max: 20 };

/** The default plan: a modern Indian discount broker. */
export const BROKER_IN_DISCOUNT: BrokeragePlan = {
  id: 'in-discount',
  label: 'Discount broker (₹20 or 0.03%, whichever is lower)',
  market: 'IN',
  rules: {
    delivery: { flat: 0 },
    intraday: DISCOUNT_RULE,
    futures: DISCOUNT_RULE,
    options: { flat: 20 },
    currency_futures: DISCOUNT_RULE,
    currency_options: { flat: 20 },
    commodity_futures: DISCOUNT_RULE,
    commodity_options: { flat: 20 },
  },
};

/**
 * A traditional full-service broker. Deliberately included so the Cost Cutter
 * game can show a learner that the *same* ₹50,000 delivery trade costs ₹0 in
 * brokerage at one broker and ₹250 at another — a 0.5% headwind before the
 * position has moved a paisa.
 */
export const BROKER_IN_FULL_SERVICE: BrokeragePlan = {
  id: 'in-full-service',
  label: 'Full-service broker (0.50% delivery / 0.05% intraday)',
  market: 'IN',
  rules: {
    delivery: { percent: 0.5, min: 25 },
    intraday: { percent: 0.05, min: 25 },
    futures: { percent: 0.05, min: 25 },
    options: { perUnit: 100, min: 100 },
  },
};

export const IN_BROKER_PLANS = [BROKER_IN_DISCOUNT, BROKER_IN_FULL_SERVICE];

// ── Engine ──────────────────────────────────────────────────────────────────

export function applyBrokerageRule(rule: BrokerageRule | undefined, turnover: number, units: number): number {
  if (!rule) return 0;
  const candidates: number[] = [];
  if (rule.percent != null) candidates.push((turnover * rule.percent) / 100);
  if (rule.flat != null) candidates.push(rule.flat);
  if (rule.perUnit != null) candidates.push(rule.perUnit * units);
  if (candidates.length === 0) return 0;
  // Indian discount brokers charge "whichever is LOWER" — that is the whole
  // pitch. US brokers stack a per-trade fee on top of a per-contract fee.
  let fee =
    rule.combine === 'sum'
      ? candidates.reduce((a, b) => a + b, 0)
      : Math.min(...candidates);
  if (rule.max != null) fee = Math.min(fee, rule.max);
  if (rule.min != null) fee = Math.max(fee, rule.min);
  return fee;
}

/** Rounds to paise. Real brokers bill to 2dp; showing 7dp noise teaches nothing. */
const paise = (n: number) => Math.round(n * 100) / 100;

export function computeIndiaCost(input: CostInput): CostBreakdown {
  const {
    venue,
    product,
    side,
    price,
    quantity,
    multiplier = 1,
    disposal = 'traded',
    intrinsicPerUnit,
    scripCount = 1,
    brokerage = BROKER_IN_DISCOUNT,
  } = input;

  if (price < 0) throw new Error('costs: price must be >= 0');
  if (quantity <= 0) throw new Error('costs: quantity must be > 0');
  if (product === 'options' && disposal === 'exercised' && intrinsicPerUnit == null) {
    throw new Error('costs: intrinsicPerUnit is required when an option is exercised');
  }

  const units = quantity * multiplier;
  const turnover = price * units;
  const lines: CostLine[] = [];
  const notes: string[] = [];

  const push = (
    key: string,
    label: string,
    amount: number,
    basis: string,
    payee: CostLine['payee'],
  ) => {
    // Round first, then test: a ₹0.0004 SEBI fee on a tiny order is genuinely
    // zero once billed to paise, and a zero line in the breakdown is noise.
    const rounded = paise(amount);
    if (rounded > 0) lines.push({ key, label, amount: rounded, basis, payee });
  };

  // An option that expires out of the money is simply gone. No exchange, no
  // regulator, no broker charges anything — the loss is 100% of the premium and
  // nothing more. Modelling this explicitly stops the engine inventing fees.
  if (product === 'options' && disposal === 'expired_worthless') {
    return {
      lines: [],
      total: 0,
      turnover,
      costPercent: 0,
      breakevenPerUnit: 0,
      currency: 'INR',
      notes: [
        'Option expired out of the money. No STT, no brokerage, no exchange charges.',
        'The entire premium is lost — but there are no exit costs on top of it.',
      ],
    };
  }

  // 1. Brokerage ────────────────────────────────────────────────────────────
  const brokerageAmt =
    disposal === 'exercised'
      ? 0 // exercised/assigned contracts are not "executed orders"
      : applyBrokerageRule(brokerage.rules[product], turnover, units);
  push(
    'brokerage',
    'Brokerage',
    brokerageAmt,
    describeBrokerage(brokerage.rules[product], turnover, units, brokerageAmt),
    'broker',
  );
  if (disposal === 'exercised') {
    notes.push('No brokerage on exercise — the exchange settles it, your broker does not execute an order.');
  }

  // 2. STT / CTT ────────────────────────────────────────────────────────────
  let sttAmt = 0;
  let sttBasis = '';
  if (product === 'options' && disposal === 'exercised') {
    const intrinsicTurnover = (intrinsicPerUnit as number) * units;
    sttAmt = (intrinsicTurnover * STT_IN.options.exercise) / 100;
    sttBasis = `${STT_IN.options.exercise}% x intrinsic value ₹${fmt(intrinsicTurnover)} (${fmt(intrinsicPerUnit as number)} x ${units})`;
    notes.push(
      'STT on exercise is charged on INTRINSIC VALUE, not on the premium you paid. ' +
        'This is why letting a deep-ITM option expire can cost many times the premium. ' +
        'Squaring off before expiry would charge 0.15% of premium instead.',
    );
  } else {
    const table = STT_IN[product] as { buy: number | null; sell: number | null };
    const rate = side === 'buy' ? table.buy : table.sell;
    if (rate) {
      sttAmt = (turnover * rate) / 100;
      sttBasis = `${rate}% x ₹${fmt(turnover)} (${side} side)`;
    }
  }
  const sttLabel = product.startsWith('commodity') ? 'CTT' : 'STT';
  push('stt', sttLabel, sttAmt, sttBasis, 'government');
  if (sttAmt === 0 && product !== 'delivery') {
    notes.push(`No ${sttLabel} on the ${side} side for ${product} — it is levied on the sell side only.`);
  }

  // 3. Exchange transaction charges ─────────────────────────────────────────
  const txnRate = EXCHANGE_TXN_IN[venue]?.[product] ?? 0;
  const txnAmt = (turnover * txnRate) / 100;
  push(
    'exchange_txn',
    `${venue} transaction charges`,
    txnAmt,
    `${txnRate}% x ₹${fmt(turnover)}`,
    'exchange',
  );

  // 4. SEBI turnover fee ────────────────────────────────────────────────────
  const sebiAmt = (turnover * SEBI_TURNOVER_PERCENT) / 100;
  push('sebi', 'SEBI turnover fee', sebiAmt, `₹10 per crore x ₹${fmt(turnover)}`, 'regulator');

  // 5. Stamp duty — buy side only ───────────────────────────────────────────
  if (side === 'buy' && disposal !== 'exercised') {
    const stampRate = STAMP_DUTY_IN[product] ?? 0;
    const stampAmt = (turnover * stampRate) / 100;
    push('stamp', 'Stamp duty', stampAmt, `${stampRate}% x ₹${fmt(turnover)} (buy side only)`, 'government');
  }

  // 6. DP charges — delivery sell only, flat per scrip ──────────────────────
  //    Flat fees are regressive: on a ₹1,000 sale this alone is 1.5%.
  let dpBrokerPortion = 0;
  if (product === 'delivery' && side === 'sell') {
    const dep = DP_DEPOSITORY_FEE * scripCount;
    dpBrokerPortion = DP_BROKER_FEE * scripCount;
    push('dp_cdsl', 'DP charges (CDSL)', dep, `₹${DP_DEPOSITORY_FEE} x ${scripCount} scrip`, 'depository');
    push('dp_broker', 'DP charges (broker)', dpBrokerPortion, `₹${DP_BROKER_FEE} x ${scripCount} scrip`, 'broker');
    if (turnover > 0 && (dep + dpBrokerPortion) / turnover > 0.005) {
      notes.push(
        `DP charges are FLAT (₹${fmt(dep + dpBrokerPortion)}), not percentage-based. On this ₹${fmt(turnover)} ` +
          `sale they alone are ${(((dep + dpBrokerPortion) / turnover) * 100).toFixed(2)}% — small delivery trades are ` +
          'disproportionately punished by them.',
      );
    }
  }

  // 7. GST — 18% on brokerage + SEBI + exchange charges (+ DP fees) ─────────
  //    Explicitly NOT on STT or stamp duty.
  const gstBase = brokerageAmt + sebiAmt + txnAmt + DP_DEPOSITORY_FEE * (product === 'delivery' && side === 'sell' ? scripCount : 0) + dpBrokerPortion;
  const gstAmt = (gstBase * GST_RATE) / 100;
  push(
    'gst',
    'GST',
    gstAmt,
    `${GST_RATE}% x ₹${fmt(gstBase)} (brokerage + SEBI + exchange${dpBrokerPortion ? ' + DP' : ''}) — not on STT or stamp duty`,
    'government',
  );

  const total = paise(lines.reduce((s, l) => s + l.amount, 0));
  const costPercent = turnover > 0 ? (total / turnover) * 100 : 0;

  return {
    lines,
    total,
    turnover,
    costPercent,
    // A single leg's costs, expressed per unit. The simulator doubles this for
    // a round trip when it shows the learner their true breakeven.
    breakevenPerUnit: units > 0 ? total / units : 0,
    currency: 'INR',
    notes,
  };
}

function describeBrokerage(
  rule: BrokerageRule | undefined,
  turnover: number,
  units: number,
  charged: number,
): string {
  if (!rule) return 'No brokerage on this product';
  const parts: string[] = [];
  if (rule.percent != null) parts.push(`${rule.percent}% = ₹${fmt((turnover * rule.percent) / 100)}`);
  if (rule.flat != null) parts.push(`flat ₹${fmt(rule.flat)}`);
  if (rule.perUnit != null) parts.push(`₹${fmt(rule.perUnit)} x ${units} = ₹${fmt(rule.perUnit * units)}`);
  if (rule.max != null) parts.push(`capped at ₹${fmt(rule.max)}`);
  if (rule.min != null) parts.push(`floor ₹${fmt(rule.min)}`);
  return `${parts.join(', ')} → ₹${fmt(charged)}`;
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
