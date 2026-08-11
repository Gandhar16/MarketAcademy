/**
 * Cost engine tests.
 *
 * Every expected value here is computed by hand from the published rate
 * schedule in the comments at the top of india.ts / us.ts. These are not
 * snapshots — a snapshot test would happily lock in a wrong number.
 */
import { describe, expect, it } from 'vitest';
import { computeCost, roundTripCost } from './index';
import { BROKER_IN_FULL_SERVICE } from './india';
import { BROKER_US_LEGACY } from './us';
import type { CostInput } from './types';

const line = (b: { lines: { key: string; amount: number }[] }, key: string) =>
  b.lines.find((l) => l.key === key)?.amount ?? 0;

describe('India — equity delivery', () => {
  // 100 shares @ ₹1,400 = ₹1,40,000 turnover, NSE, discount broker.
  const base: CostInput = {
    market: 'IN',
    venue: 'NSE',
    product: 'delivery',
    side: 'buy',
    price: 1400,
    quantity: 100,
  };

  it('charges STT on the BUY side for delivery (unlike every other product)', () => {
    const b = computeCost(base);
    expect(line(b, 'stt')).toBe(140); // 0.1% x 140000
  });

  it('itemises the full statutory stack correctly on a buy', () => {
    const b = computeCost(base);
    expect(line(b, 'brokerage')).toBe(0); // zero-brokerage delivery
    expect(line(b, 'exchange_txn')).toBe(4.3); // 0.00307% x 140000 = 4.298
    expect(line(b, 'sebi')).toBe(0.14); // ₹10/crore
    expect(line(b, 'stamp')).toBe(21); // 0.015% x 140000, buy side only
    expect(line(b, 'gst')).toBe(0.8); // 18% x (0 + 0.14 + 4.298)
    expect(b.total).toBeCloseTo(166.24, 2);
  });

  it('does NOT charge GST on STT or stamp duty', () => {
    const b = computeCost(base);
    const gstIfChargedOnEverything = (140 + 21 + 4.298 + 0.14) * 0.18;
    expect(line(b, 'gst')).toBeLessThan(gstIfChargedOnEverything / 10);
  });

  it('drops stamp duty on the sell side and adds DP charges instead', () => {
    const b = computeCost({ ...base, side: 'sell' });
    expect(line(b, 'stamp')).toBe(0);
    expect(line(b, 'dp_cdsl')).toBe(3.5);
    expect(line(b, 'dp_broker')).toBe(9.5);
    // GST now includes the DP fees: 18% x (0 + 0.14 + 4.298 + 3.5 + 9.5) = 3.139
    expect(line(b, 'gst')).toBeCloseTo(3.14, 2);
    // Cross-check against the published all-in DP charge of ₹15.34 per scrip:
    // ₹3.50 CDSL + ₹9.50 broker + 18% GST on both = ₹15.34.
    expect(3.5 + 9.5 + (3.5 + 9.5) * 0.18).toBeCloseTo(15.34, 2);
  });

  it('shows flat DP charges dominating a small delivery sale', () => {
    // ₹1,000 sale: ₹13 of DP charges is 1.3% before anything else.
    const b = computeCost({ ...base, side: 'sell', price: 100, quantity: 10 });
    expect(b.costPercent).toBeGreaterThan(1.5);
    expect(b.notes.join(' ')).toMatch(/FLAT/);
  });

  it('makes the broker choice visible', () => {
    const discount = computeCost(base);
    const full = computeCost({ ...base, brokerage: BROKER_IN_FULL_SERVICE });
    expect(line(full, 'brokerage')).toBe(700); // 0.50% x 140000
    expect(full.total).toBeGreaterThan(discount.total * 4);
  });
});

describe('India — intraday vs delivery', () => {
  const base: CostInput = {
    market: 'IN',
    venue: 'NSE',
    product: 'intraday',
    side: 'sell',
    price: 1400,
    quantity: 100,
  };

  it('charges 0.025% STT on the sell side only', () => {
    expect(line(computeCost(base), 'stt')).toBe(35); // 0.025% x 140000
    expect(line(computeCost({ ...base, side: 'buy' }), 'stt')).toBe(0);
  });

  it('is materially cheaper than delivery on a round trip', () => {
    const intraday = roundTripCost({ ...base, side: 'buy' }, 1400);
    const delivery = roundTripCost({ ...base, product: 'delivery', side: 'buy' }, 1400);
    expect(intraday.total).toBeLessThan(delivery.total);
  });
});

describe('India — options, and the exercise trap', () => {
  // One NIFTY lot (75), premium ₹5, expiring ₹50 in the money.
  const opt: CostInput = {
    market: 'IN',
    venue: 'NSE',
    product: 'options',
    side: 'sell',
    price: 5,
    quantity: 75,
  };

  it('charges 0.15% of PREMIUM when squared off in the market', () => {
    const b = computeCost(opt);
    expect(line(b, 'stt')).toBeCloseTo(0.56, 2); // 0.15% x 375
  });

  it('charges 0.15% of INTRINSIC VALUE on exercise — an order of magnitude more', () => {
    const traded = computeCost(opt);
    const exercised = computeCost({
      ...opt,
      disposal: 'exercised',
      intrinsicPerUnit: 50,
    });
    expect(line(exercised, 'stt')).toBeCloseTo(5.63, 2); // 0.15% x (50 x 75)
    expect(line(exercised, 'stt')).toBeGreaterThan(line(traded, 'stt') * 9);
    expect(exercised.notes.join(' ')).toMatch(/INTRINSIC VALUE/);
  });

  it('scales the trap with moneyness — deep ITM is where accounts die', () => {
    // A ₹0.50 premium option that finishes ₹300 ITM on 5 lots.
    const b = computeCost({
      ...opt,
      price: 0.5,
      quantity: 375,
      disposal: 'exercised',
      intrinsicPerUnit: 300,
    });
    const premiumPaid = 0.5 * 375; // ₹187.50
    expect(line(b, 'stt')).toBeCloseTo(168.75, 2); // 0.15% x 112500
    expect(line(b, 'stt') / premiumPaid).toBeGreaterThan(0.85);
  });

  it('charges nothing at all when an option expires worthless', () => {
    const b = computeCost({ ...opt, disposal: 'expired_worthless' });
    expect(b.total).toBe(0);
    expect(b.lines).toHaveLength(0);
  });

  it('refuses to guess the intrinsic value on exercise', () => {
    expect(() => computeCost({ ...opt, disposal: 'exercised' })).toThrow(/intrinsicPerUnit/);
  });

  it('uses the options transaction rate, not the cash rate', () => {
    const b = computeCost(opt);
    expect(line(b, 'exchange_txn')).toBeCloseTo(0.13, 2); // 0.03553% x 375
  });
});

describe('India — futures', () => {
  const fut: CostInput = {
    market: 'IN',
    venue: 'NSE',
    product: 'futures',
    side: 'sell',
    price: 24000,
    quantity: 75,
  };

  it('charges 0.05% STT on the sell side of contract value', () => {
    expect(line(computeCost(fut), 'stt')).toBe(900); // 0.05% x 1,800,000
  });

  it('caps discount brokerage at ₹20 even on an ₹18 lakh contract', () => {
    expect(line(computeCost(fut), 'brokerage')).toBe(20);
  });
});

describe('India — venue matters', () => {
  it('prices BSE equity higher than NSE on the cash segment', () => {
    const on = (venue: 'NSE' | 'BSE') =>
      computeCost({ market: 'IN', venue, product: 'delivery', side: 'buy', price: 1000, quantity: 100 });
    expect(line(on('BSE'), 'exchange_txn')).toBeGreaterThan(line(on('NSE'), 'exchange_txn'));
  });

  it('charges no transaction fee on BSE equity futures', () => {
    const b = computeCost({ market: 'IN', venue: 'BSE', product: 'futures', side: 'buy', price: 1000, quantity: 100 });
    expect(line(b, 'exchange_txn')).toBe(0);
  });
});

describe('US', () => {
  const eq: CostInput = {
    market: 'US',
    venue: 'US',
    product: 'delivery',
    side: 'sell',
    price: 200,
    quantity: 50, // $10,000
  };

  it('charges regulatory fees on sells only', () => {
    const sell = computeCost(eq);
    const buy = computeCost({ ...eq, side: 'buy' });
    expect(line(sell, 'sec31')).toBeCloseTo(0.21, 2); // $20.60 per $1M x $10,000
    expect(line(sell, 'taf')).toBeCloseTo(0.01, 2); // $0.000166 x 50 shares
    expect(buy.total).toBe(0);
    expect(buy.notes.join(' ')).toMatch(/sells only/i);
  });

  it('caps the equity TAF at $8.30 per trade', () => {
    const b = computeCost({ ...eq, quantity: 10_000_000 });
    expect(line(b, 'taf')).toBe(8.3);
  });

  it('applies the 100x multiplier to options by default', () => {
    const b = computeCost({ market: 'US', venue: 'US', product: 'options', side: 'sell', price: 2.5, quantity: 10 });
    expect(b.turnover).toBe(2500); // 10 contracts x 100 x $2.50
    expect(line(b, 'taf')).toBeCloseTo(0.03, 2); // $0.00279 x 10 contracts
    expect(line(b, 'commission')).toBeCloseTo(6.5, 2); // $0.65 x 10
  });

  it('stacks per-trade and per-contract commissions on legacy plans', () => {
    const b = computeCost({
      market: 'US',
      venue: 'US',
      product: 'options',
      side: 'buy',
      price: 2.5,
      quantity: 10,
      brokerage: BROKER_US_LEGACY,
    });
    expect(line(b, 'commission')).toBeCloseTo(12.45, 2); // 4.95 + 0.75 x 10
  });

  it('is dramatically cheaper than India on the same equity turnover', () => {
    const us = roundTripCost({ ...eq, side: 'buy' }, 200);
    const india = roundTripCost(
      { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: 200, quantity: 50 },
      200,
    );
    // Same notional, ~two orders of magnitude apart in statutory cost.
    expect(us.total * 50).toBeLessThan(india.total);
  });
});

describe('round trip breakeven', () => {
  it('tells a scalper how far the price must move to break even', () => {
    const rt = roundTripCost(
      { market: 'IN', venue: 'NSE', product: 'intraday', side: 'buy', price: 1400, quantity: 100 },
      1400,
    );
    expect(rt.breakevenMove).toBeGreaterThan(0);
    expect(rt.breakevenPercent).toBeGreaterThan(0);
    // The move required must equal total cost spread over the units held.
    expect(rt.breakevenMove * 100).toBeCloseTo(rt.total, 6);
  });

  it('shows small delivery trades are crushed by fixed costs', () => {
    const tiny = roundTripCost(
      { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: 100, quantity: 10 },
      100,
    );
    const large = roundTripCost(
      { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: 100, quantity: 10_000 },
      100,
    );
    expect(tiny.breakevenPercent).toBeGreaterThan(large.breakevenPercent * 3);
  });
});

describe('input validation', () => {
  const ok: CostInput = { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: 100, quantity: 1 };
  it('rejects non-positive quantity', () => {
    expect(() => computeCost({ ...ok, quantity: 0 })).toThrow();
  });
  it('rejects negative price', () => {
    expect(() => computeCost({ ...ok, price: -1 })).toThrow();
  });
});
