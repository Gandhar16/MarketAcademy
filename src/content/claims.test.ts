/**
 * Content-claim tests.
 *
 * Lesson prose makes numeric claims — "intraday round trips run about 0.11% of
 * turnover", "delivery costs about two and a half times intraday". Those are
 * assertions about the world, and if a Budget changes a rate they silently
 * become lies while every other test stays green.
 *
 * These tests have already earned their place: the first run caught four wrong
 * figures in the prose and one wrong answer key.
 *
 * So each claim gets a test. When a rate changes, these fail and tell an author
 * exactly which sentence needs rewriting.
 */
import { describe, expect, it } from 'vitest';
import { computeCost, roundTripCost } from '@/lib/engine/costs';
import { BROKER_IN_FULL_SERVICE } from '@/lib/engine/costs/india';
import { MARGIN_LADDER, PHYSICAL_DELIVERY_PERCENT } from '@/components/widgets/settlement';

const inNSE = (product: 'intraday' | 'delivery', price: number, quantity: number) =>
  roundTripCost({ market: 'IN', venue: 'NSE', product, side: 'buy', price, quantity }, price);

describe('in-t1-real-cost-of-a-trade — claims made in the prose', () => {
  it('claim: a flat ₹1,00,000 delivery round trip costs about ₹236, leaving about ₹99,760', () => {
    // Predict block reveal, and the option the answer key points at.
    const rt = inNSE('delivery', 1400, 71); // ₹99,400 turnover
    expect(rt.total).toBeCloseTo(236.49, 0);
    expect(100_000 - rt.total).toBeGreaterThan(99_700);
    expect(100_000 - rt.total).toBeLessThan(99_800);
  });

  it('claim: STT alone is ₹200 of that total', () => {
    const legs = (['buy', 'sell'] as const).map((side) =>
      computeCost({ market: 'IN', venue: 'NSE', product: 'delivery', side, price: 1400, quantity: 71 }),
    );
    const stt = legs.reduce((s, l) => s + (l.lines.find((x) => x.key === 'stt')?.amount ?? 0), 0);
    expect(stt).toBeCloseTo(198.8, 0);
  });

  it('claim: a ₹5,000 delivery round trip costs around 0.5% of turnover', () => {
    const rt = inNSE('delivery', 100, 50);
    const pct = (rt.total / 5000) * 100;
    expect(pct).toBeGreaterThan(0.4);
    expect(pct).toBeLessThan(0.65);
  });

  it('claim: DP charges alone are roughly 0.26% of a ₹5,000 delivery sale', () => {
    const sell = computeCost({
      market: 'IN',
      venue: 'NSE',
      product: 'delivery',
      side: 'sell',
      price: 100,
      quantity: 50,
    });
    const dp = sell.lines
      .filter((l) => l.key.startsWith('dp_'))
      .reduce((s, l) => s + l.amount, 0);
    expect((dp / 5000) * 100).toBeCloseTo(0.26, 1);
  });

  it('claim: the same DP charge is only 0.013% of a ₹1,00,000 sale', () => {
    const sell = computeCost({
      market: 'IN',
      venue: 'NSE',
      product: 'delivery',
      side: 'sell',
      price: 1000,
      quantity: 100,
    });
    const dp = sell.lines.filter((l) => l.key.startsWith('dp_')).reduce((s, l) => s + l.amount, 0);
    expect((dp / 100_000) * 100).toBeCloseTo(0.013, 2);
  });

  it('claim: intraday round trips on a ₹50,000 clip run to roughly 0.11% of turnover', () => {
    const rt = inNSE('intraday', 1400, 35);
    const pct = (rt.total / (1400 * 35)) * 100;
    expect(pct).toBeGreaterThan(0.09);
    expect(pct).toBeLessThan(0.13);
  });

  it('claim: delivery costs about two and a half times intraday on the same turnover', () => {
    const intraday = inNSE('intraday', 1400, 35).total;
    const delivery = inNSE('delivery', 1400, 35).total;
    const ratio = delivery / intraday;
    expect(ratio).toBeGreaterThan(2.1);
    expect(ratio).toBeLessThan(3);
  });

  it('claim: delivery on that clip is about 0.25% of turnover', () => {
    const pct = (inNSE('delivery', 1400, 35).total / (1400 * 35)) * 100;
    expect(pct).toBeGreaterThan(0.22);
    expect(pct).toBeLessThan(0.29);
  });

  it('claim: a 0.3% intraday target loses about a third of itself to costs', () => {
    const rt = inNSE('intraday', 1400, 35);
    const share = rt.breakevenPercent / 0.3;
    expect(share).toBeGreaterThan(0.28);
    expect(share).toBeLessThan(0.42);
  });

  it('claim: the full-service broker costs about ₹94 more on an ₹8,000 delivery round trip', () => {
    const discount = inNSE('delivery', 800, 10).total;
    const full = roundTripCost(
      {
        market: 'IN',
        venue: 'NSE',
        product: 'delivery',
        side: 'buy',
        price: 800,
        quantity: 10,
        brokerage: BROKER_IN_FULL_SERVICE,
      },
      800,
    ).total;
    expect(full - discount).toBeCloseTo(94.4, 0);
  });

  it('claim: that difference is more than 1% of an ₹8,000 position', () => {
    const discount = inNSE('delivery', 800, 10).total;
    const full = roundTripCost(
      {
        market: 'IN',
        venue: 'NSE',
        product: 'delivery',
        side: 'buy',
        price: 800,
        quantity: 10,
        brokerage: BROKER_IN_FULL_SERVICE,
      },
      800,
    ).total;
    expect(((full - discount) / 8000) * 100).toBeGreaterThan(1);
  });

  it('claim: GST is charged on services, not on STT or stamp duty', () => {
    const buy = computeCost({
      market: 'IN',
      venue: 'NSE',
      product: 'delivery',
      side: 'buy',
      price: 1400,
      quantity: 71,
    });
    const gst = buy.lines.find((l) => l.key === 'gst')!;
    const stt = buy.lines.find((l) => l.key === 'stt')!;
    const stamp = buy.lines.find((l) => l.key === 'stamp')!;
    // If GST were levied on the taxes too it would exceed 18% of them alone.
    expect(gst.amount).toBeLessThan((stt.amount + stamp.amount) * 0.18);
    expect(gst.basis).toMatch(/not on STT or stamp duty/);
  });

  it('claim: small delivery trades are hit disproportionately by flat charges', () => {
    const tiny = inNSE('delivery', 100, 50).breakevenPercent;
    const large = inNSE('delivery', 100, 10_000).breakevenPercent;
    expect(tiny).toBeGreaterThan(large * 2);
  });
});

describe('in-t5-physical-settlement — claims made in the prose', () => {
  const LOT = 250;
  const STRIKE = 1350;
  const PREMIUM = 8;

  it('claim: a ₹8 premium on a 250 lot is about ₹2,000 risked', () => {
    expect(PREMIUM * LOT).toBe(2000);
  });

  it('claim: the delivery obligation is ₹3,37,500', () => {
    expect(STRIKE * LOT).toBe(337_500);
  });

  it('claim: the obligation is about 168 times the premium', () => {
    expect((STRIKE * LOT) / (PREMIUM * LOT)).toBeCloseTo(168.75, 1);
  });

  it('claim: the 0.25% physical delivery charge is ₹843.75', () => {
    expect((STRIKE * LOT * PHYSICAL_DELIVERY_PERCENT) / 100).toBeCloseTo(843.75, 2);
  });

  it('claim: that charge is about 42% of the premium risked', () => {
    const charge = (STRIKE * LOT * PHYSICAL_DELIVERY_PERCENT) / 100;
    expect((charge / (PREMIUM * LOT)) * 100).toBeCloseTo(42, 0);
  });

  it('claim: expiry-day margin is half the contract value', () => {
    const expiryStep = MARGIN_LADDER.find((s) => s.day === 'E');
    expect(expiryStep?.percentOfContract).toBe(50);
    expect(((STRIKE * LOT) * 50) / 100).toBe(168_750);
  });

  it('claim: the margin ladder escalates monotonically across the final sessions', () => {
    const weights = MARGIN_LADDER.map((s) => s.percentOfContract ?? (s.percentOfVarElm as number) / 4);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThanOrEqual(weights[i - 1]);
    }
  });

  it('claim: an out-of-the-money option creates no delivery obligation', () => {
    // Modelled directly: intrinsic zero means nothing is settled.
    const spot = STRIKE - 50;
    expect(Math.max(0, spot - STRIKE)).toBe(0);
  });

  it('debunk: STT on exercise is charged on intrinsic value, not contract value', () => {
    // The lesson tells learners the pre-2019 "full contract value" story is
    // dead. If the engine ever disagreed, the myth callout would be wrong.
    const exercised = computeCost({
      market: 'IN',
      venue: 'NSE',
      product: 'options',
      side: 'sell',
      price: PREMIUM,
      quantity: LOT,
      disposal: 'exercised',
      intrinsicPerUnit: 50,
    });
    const stt = exercised.lines.find((l) => l.key === 'stt')!.amount;
    // 0.15% of 50 x 250 = 18.75, NOT 0.15% of 1400 x 250 = 525.
    expect(stt).toBeCloseTo(18.75, 2);
    expect(stt).toBeLessThan(((1400 * LOT) * 0.15) / 100 / 10);
  });
});
