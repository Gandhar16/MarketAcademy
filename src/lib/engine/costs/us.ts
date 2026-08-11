/**
 * United States cost engine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RATE SOURCES — verified 2026-08-09.
 *
 * SEC Section 31 fee ... $20.60 per $1,000,000 of SELL proceeds, effective
 *                        2026-04-04 (FY2026 annual adjustment).
 *                        https://www.federalregister.gov/documents/2026/03/04/2026-04233/order-making-fiscal-year-2026-annual-adjustments-to-transaction-fee-rates
 *                        https://www.finra.org/rules-guidance/notices/information-notice-20260317
 * FINRA TAF ............ $0.000166 per share sold, capped at $8.30 per trade.
 *                        $0.00279 per option contract sold.
 *                        FINRA By-Laws Schedule A, Section 1.
 *                        https://www.finra.org/rules-guidance/rulebooks/corporate-organization/section-1-member-regulatory-fees
 * Commission ........... $0 stock commission is the retail norm; options are
 *                        typically $0.65/contract. Modelled as broker data, not
 *                        as a law, because it genuinely varies.
 * ORF / exchange fees .. Options Regulatory Fee and per-venue exchange fees
 *                        differ by exchange and change quarterly. Rather than
 *                        invent a blended number we default it to zero and let a
 *                        broker plan set it explicitly. See note emitted below.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The structural lesson for a learner coming from India: US costs are tiny on
 * equities (a $10,000 sale costs about 21 cents in regulatory fees) but the
 * REAL costs are elsewhere — the bid-ask spread, payment-for-order-flow price
 * improvement you did not get, and the tax rules (wash sale, PDT, short-term
 * capital gains at ordinary income rates). Cheap commissions are not cheap
 * trading, and that is the point of the US content pack.
 */

import type { BrokeragePlan, CostBreakdown, CostInput, CostLine } from './types';
import { applyBrokerageRule } from './india';

/** SEC Section 31, in dollars per $1,000,000 of sell-side proceeds. */
export const SEC_31_PER_MILLION = 20.6;
/** FINRA TAF, per share sold. */
export const TAF_PER_SHARE = 0.000166;
/** FINRA TAF cap, per trade, equities. */
export const TAF_EQUITY_MAX = 8.3;
/** FINRA TAF, per option contract sold. */
export const TAF_PER_OPTION_CONTRACT = 0.00279;

export const BROKER_US_ZERO_COMMISSION: BrokeragePlan = {
  id: 'us-zero',
  label: 'Zero-commission broker ($0 stock, $0.65/contract options)',
  market: 'US',
  rules: {
    delivery: { flat: 0 },
    intraday: { flat: 0 },
    options: { perUnit: 0.65 },
  },
};

export const BROKER_US_LEGACY: BrokeragePlan = {
  id: 'us-legacy',
  label: 'Legacy full-service broker ($4.95/trade, $0.75/contract)',
  market: 'US',
  rules: {
    delivery: { flat: 4.95 },
    intraday: { flat: 4.95 },
    options: { flat: 4.95, perUnit: 0.75, combine: 'sum' },
  },
};

export const US_BROKER_PLANS = [BROKER_US_ZERO_COMMISSION, BROKER_US_LEGACY];

const cents = (n: number) => Math.round(n * 100) / 100;

export function computeUSCost(input: CostInput): CostBreakdown {
  const {
    product,
    side,
    price,
    quantity,
    // US listed options are quoted per share but traded in 100-share contracts.
    // The default here is the single most common source of a 100x error, so we
    // make it explicit rather than clever.
    multiplier = product === 'options' ? 100 : 1,
    disposal = 'traded',
    brokerage = BROKER_US_ZERO_COMMISSION,
  } = input;

  if (price < 0) throw new Error('costs: price must be >= 0');
  if (quantity <= 0) throw new Error('costs: quantity must be > 0');

  const contracts = quantity; // for options, quantity is contracts
  const units = quantity * multiplier; // shares, or shares-equivalent
  const turnover = price * units;
  const lines: CostLine[] = [];
  const notes: string[] = [];

  const push = (key: string, label: string, amount: number, basis: string, payee: CostLine['payee']) => {
    const rounded = cents(amount);
    if (rounded > 0) lines.push({ key, label, amount: rounded, basis, payee });
  };

  if (product === 'options' && disposal === 'expired_worthless') {
    return {
      lines: [],
      total: 0,
      turnover,
      costPercent: 0,
      breakevenPerUnit: 0,
      currency: 'USD',
      notes: [
        'Option expired out of the money. No commission, no regulatory fees.',
        'Unlike India there is no exercise tax — but assignment risk on a SHORT option is the real hazard here.',
      ],
    };
  }

  // 1. Commission ───────────────────────────────────────────────────────────
  const commission =
    disposal === 'exercised'
      ? 0
      : applyBrokerageRule(brokerage.rules[product], turnover, product === 'options' ? contracts : units);
  push('commission', 'Commission', commission, describeUSCommission(brokerage, product, contracts, units, commission), 'broker');

  if (disposal === 'exercised') {
    notes.push(
      'Exercise/assignment usually carries no commission at modern US brokers, but it converts your ' +
        'option into a 100-share stock position per contract — which you must be able to fund or deliver.',
    );
  }

  // 2. SEC Section 31 — SELL SIDE ONLY ──────────────────────────────────────
  if (side === 'sell') {
    const sec = (turnover / 1_000_000) * SEC_31_PER_MILLION;
    push(
      'sec31',
      'SEC Section 31 fee',
      sec,
      `$${SEC_31_PER_MILLION} per $1M x $${fmt(turnover)} proceeds (sell side only)`,
      'regulator',
    );
  } else {
    notes.push('SEC Section 31 and FINRA TAF are charged on SELLS only — buying is free of regulatory fees.');
  }

  // 3. FINRA TAF — SELL SIDE ONLY ───────────────────────────────────────────
  if (side === 'sell') {
    if (product === 'options') {
      const taf = TAF_PER_OPTION_CONTRACT * contracts;
      push('taf', 'FINRA TAF', taf, `$${TAF_PER_OPTION_CONTRACT} x ${contracts} contracts`, 'regulator');
    } else {
      const raw = TAF_PER_SHARE * units;
      const taf = Math.min(raw, TAF_EQUITY_MAX);
      push(
        'taf',
        'FINRA TAF',
        taf,
        raw > TAF_EQUITY_MAX
          ? `$${TAF_PER_SHARE} x ${fmt(units)} shares = $${fmt(raw)}, capped at $${TAF_EQUITY_MAX}`
          : `$${TAF_PER_SHARE} x ${fmt(units)} shares`,
        'regulator',
      );
    }
  }

  if (product === 'options') {
    notes.push(
      'Exchange fees and the Options Regulatory Fee (ORF) vary by venue and are revised quarterly; ' +
        'they are not modelled here rather than being guessed at. Expect a few cents per contract on top.',
    );
  }

  const total = cents(lines.reduce((s, l) => s + l.amount, 0));

  return {
    lines,
    total,
    turnover,
    costPercent: turnover > 0 ? (total / turnover) * 100 : 0,
    breakevenPerUnit: units > 0 ? total / units : 0,
    currency: 'USD',
    notes,
  };
}

function describeUSCommission(
  plan: BrokeragePlan,
  product: CostInput['product'],
  contracts: number,
  units: number,
  charged: number,
): string {
  const rule = plan.rules[product];
  if (!rule) return 'No commission on this product';
  const parts: string[] = [];
  if (rule.flat != null) parts.push(`$${fmt(rule.flat)} per trade`);
  if (rule.perUnit != null) {
    const n = product === 'options' ? contracts : units;
    parts.push(`$${rule.perUnit} x ${fmt(n)} = $${fmt(rule.perUnit * n)}`);
  }
  if (rule.percent != null) parts.push(`${rule.percent}%`);
  return `${parts.join(' + ')} → $${fmt(charged)}`;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
