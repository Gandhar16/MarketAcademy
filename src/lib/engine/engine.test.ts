import { describe, expect, it } from 'vitest';
import {
  checkBand,
  canTradeAtBand,
  indiaMarketWideBreaker,
  indiaPriceBand,
  luldBandPercent,
  usMarketWideBreaker,
} from './halts';
import { newOrderState, validateOrder, type InstrumentSpec, type OrderRequest } from './order';
import { DEFAULT_FILL_CONFIG, fillAgainstBar, type LiquidityContext } from './fill';
import type { Candle } from '../market/types';

// ── halts ───────────────────────────────────────────────────────────────────

describe('India market-wide circuit breakers', () => {
  const at = (h: number, m: number) => h * 60 + m;

  it('halts 45 minutes for a 10% fall before 1pm', () => {
    const b = indiaMarketWideBreaker(-10.2, at(11, 0));
    expect(b?.level).toBe('L1');
    expect(b?.haltMinutes).toBe(45);
    expect(b?.preOpenMinutes).toBe(15);
  });

  it('halts only 15 minutes for the same fall after 1pm', () => {
    expect(indiaMarketWideBreaker(-10.2, at(13, 30))?.haltMinutes).toBe(15);
  });

  it('does not halt at all for a 10% fall after 2:30pm', () => {
    expect(indiaMarketWideBreaker(-10.2, at(14, 45))?.haltMinutes).toBe(0);
  });

  it('closes the day on a 15% fall after 2pm', () => {
    expect(indiaMarketWideBreaker(-15.5, at(14, 30))?.haltMinutes).toBe('rest_of_day');
  });

  it('closes the day on a 20% fall at any time', () => {
    expect(indiaMarketWideBreaker(-20, at(9, 20))?.haltMinutes).toBe('rest_of_day');
    expect(indiaMarketWideBreaker(-25, at(15, 25))?.level).toBe('L3');
  });

  it('does nothing below 10%', () => {
    expect(indiaMarketWideBreaker(-9.9, at(10, 0))).toBeNull();
  });
});

describe('US market-wide circuit breakers', () => {
  const at = (h: number, m: number) => h * 60 + m;

  it('halts 15 minutes at level 1 before 3:25pm', () => {
    const b = usMarketWideBreaker(-7.4, at(10, 0));
    expect(b?.level).toBe('L1');
    expect(b?.haltMinutes).toBe(15);
  });

  it('does not halt at level 2 at or after 3:25pm', () => {
    expect(usMarketWideBreaker(-13.2, at(15, 25))?.haltMinutes).toBe(0);
  });

  it('closes the day at level 3 regardless of time', () => {
    expect(usMarketWideBreaker(-20, at(15, 59))?.haltMinutes).toBe('rest_of_day');
  });
});

describe('price bands and the circuit trap', () => {
  it('computes a symmetric band around the previous close', () => {
    const band = indiaPriceBand(1000, 10);
    expect(band.lower).toBe(900);
    expect(band.upper).toBe(1100);
  });

  it('blocks buying at an upper circuit and selling at a lower circuit', () => {
    const band = indiaPriceBand(1000, 20);
    expect(checkBand(1200, band)).toBe('upper_circuit');
    expect(canTradeAtBand('upper_circuit', 'buy').allowed).toBe(false);
    expect(canTradeAtBand('upper_circuit', 'sell').allowed).toBe(true);

    expect(checkBand(800, band)).toBe('lower_circuit');
    expect(canTradeAtBand('lower_circuit', 'sell').allowed).toBe(false);
    expect(canTradeAtBand('lower_circuit', 'buy').allowed).toBe(true);
  });
});

describe('US LULD bands', () => {
  it('uses 5% for a tier 1 stock above $3 in the middle of the day', () => {
    expect(luldBandPercent(1, 200, 12 * 60)).toBe(5);
  });

  it('uses 10% for tier 2', () => {
    expect(luldBandPercent(2, 200, 12 * 60)).toBe(10);
  });

  it('doubles the band during the open and close windows', () => {
    expect(luldBandPercent(1, 200, 9 * 60 + 35)).toBe(10);
    expect(luldBandPercent(1, 200, 15 * 60 + 40)).toBe(10);
  });

  it('widens to 20% for stocks between $0.75 and $3', () => {
    expect(luldBandPercent(1, 1.5, 12 * 60)).toBe(20);
  });
});

// ── order validation ────────────────────────────────────────────────────────

const NIFTY: InstrumentSpec = {
  symbol: 'NIFTY',
  market: 'IN',
  tickSize: 0.05,
  lotSize: 65,
  freezeQuantity: 1800,
};

const RELIANCE: InstrumentSpec = { symbol: 'RELIANCE.NS', market: 'IN', tickSize: 0.05 };

const order = (o: Partial<OrderRequest>): OrderRequest => ({
  id: 'o1',
  symbol: 'RELIANCE.NS',
  side: 'buy',
  quantity: 10,
  type: 'MARKET',
  product: 'intraday',
  validity: 'DAY',
  placedAt: 0,
  ...o,
});

describe('order validation', () => {
  it('rejects a quantity that is not a whole number of lots, and names the lot size', () => {
    const r = validateOrder(order({ symbol: 'NIFTY', quantity: 100 }), NIFTY, { lastPrice: 100 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/lot size of 65/);
    expect(r.hint).toMatch(/130|65/);
  });

  it('accepts a whole number of lots', () => {
    expect(validateOrder(order({ symbol: 'NIFTY', quantity: 130 }), NIFTY, { lastPrice: 100 }).ok).toBe(true);
  });

  it('rejects an order above the exchange freeze quantity and says how to split it', () => {
    const r = validateOrder(order({ symbol: 'NIFTY', quantity: 65 * 40 }), NIFTY, { lastPrice: 100 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/freeze quantity/);
    expect(r.hint).toMatch(/Split it into 2 orders/);
  });

  it('rejects a price that is not a multiple of the tick size', () => {
    const r = validateOrder(order({ type: 'LIMIT', limitPrice: 1400.237 }), RELIANCE, { lastPrice: 1400 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/tick size/);
    expect(r.hint).toMatch(/1400.25/);
  });

  it('rejects a price outside the day price band', () => {
    const spec = { ...RELIANCE, band: { lower: 900, upper: 1100 } };
    const r = validateOrder(order({ type: 'LIMIT', limitPrice: 1200 }), spec, { lastPrice: 1000 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/price band/);
  });

  it('rejects a sell stop placed above the market, which would fire instantly', () => {
    const r = validateOrder(
      order({ side: 'sell', type: 'SL-M', triggerPrice: 1450 }),
      RELIANCE,
      { lastPrice: 1400 },
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/must sit BELOW/);
    expect(r.hint).toMatch(/LIMIT order/);
  });

  it('rejects a buy stop placed below the market', () => {
    const r = validateOrder(order({ type: 'SL-M', triggerPrice: 1350 }), RELIANCE, { lastPrice: 1400 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/must sit ABOVE/);
  });

  it('rejects an unfillable SL where the limit sits on the wrong side of the trigger', () => {
    const r = validateOrder(
      order({ side: 'sell', type: 'SL', triggerPrice: 1350, limitPrice: 1360 }),
      RELIANCE,
      { lastPrice: 1400 },
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/can never fill/);
  });

  it('accepts a correctly constructed protective stop', () => {
    const r = validateOrder(
      order({ side: 'sell', type: 'SL', triggerPrice: 1350, limitPrice: 1345 }),
      RELIANCE,
      { lastPrice: 1400 },
    );
    expect(r.ok).toBe(true);
  });

  it('rejects a MARKET order carrying a price', () => {
    const r = validateOrder(order({ type: 'MARKET', limitPrice: 1400 }), RELIANCE, { lastPrice: 1400 });
    expect(r.ok).toBe(false);
  });

  it('rejects an order the account cannot fund, and says what it can afford', () => {
    const r = validateOrder(order({ quantity: 100, type: 'LIMIT', limitPrice: 1400 }), RELIANCE, {
      lastPrice: 1400,
      availableCash: 50_000,
    });
    expect(r.ok).toBe(false);
    expect(r.hint).toMatch(/largest quantity you can afford at this price is 35/);
  });
});

// ── fills ───────────────────────────────────────────────────────────────────

const bar = (o: number, h: number, l: number, c: number, v: number | null = 1_000_000): Candle => ({
  time: 1,
  open: o,
  high: h,
  low: l,
  close: c,
  volume: v,
});

const ctx: LiquidityContext = { averageVolume: 1_000_000, tickSize: 0.05, previousClose: 1400 };

describe('fill engine — market orders', () => {
  it('fills a buy above the open, never below', () => {
    const st = newOrderState(order({ type: 'MARKET', quantity: 100 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1395, 1405), ctx);
    expect(r.quantity).toBe(100);
    expect(r.price).toBeGreaterThan(1400);
  });

  it('fills a sell below the open, never above', () => {
    const st = newOrderState(order({ side: 'sell', type: 'MARKET', quantity: 100 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1395, 1405), ctx);
    expect(r.price).toBeLessThan(1400);
  });

  it('charges more slippage in a thin, volatile bar than a fat, quiet one', () => {
    const st = newOrderState(order({ type: 'MARKET', quantity: 100 }));
    const quiet = fillAgainstBar(st, bar(1400, 1403, 1398, 1401, 2_000_000), ctx);
    const wild = fillAgainstBar(st, bar(1400, 1460, 1340, 1401, 100_000), ctx);
    expect(wild.components.halfSpread).toBeGreaterThan(quiet.components.halfSpread * 3);
  });

  it('charges more impact for a bigger order', () => {
    const small = fillAgainstBar(newOrderState(order({ quantity: 100 })), bar(1400, 1410, 1395, 1405), ctx);
    const large = fillAgainstBar(newOrderState(order({ quantity: 90_000 })), bar(1400, 1410, 1395, 1405), ctx);
    expect(large.components.impact).toBeGreaterThan(small.components.impact * 10);
  });
});

describe('fill engine — partial fills', () => {
  it('caps a fill at 10% of the bar volume and explains why', () => {
    const st = newOrderState(order({ quantity: 500_000 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1395, 1405, 1_000_000), ctx);
    expect(r.quantity).toBe(100_000);
    expect(r.explanation).toMatch(/did not have the volume/);
  });

  it('refuses to fill anything in a bar with no volume', () => {
    const st = newOrderState(order({ quantity: 100 }));
    const r = fillAgainstBar(st, bar(1400, 1400, 1400, 1400, 0), ctx);
    expect(r.quantity).toBe(0);
    expect(r.reason).toBe('no_volume');
  });

  it('does not invent a volume cap for instruments with no volume data (indices)', () => {
    const st = newOrderState(order({ quantity: 500_000 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1395, 1405, null), { ...ctx, averageVolume: null });
    expect(r.quantity).toBe(500_000);
  });
});

describe('fill engine — limit orders', () => {
  it('gives price improvement when the bar opens through the limit', () => {
    const st = newOrderState(order({ type: 'LIMIT', limitPrice: 1405, quantity: 100 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1395, 1408), ctx);
    // Marketable on the open: fills at the open, better than the 1405 limit.
    expect(r.price).toBeLessThanOrEqual(1405);
    expect(r.price).toBeGreaterThanOrEqual(1400);
  });

  it('never fills a limit order worse than its limit', () => {
    const st = newOrderState(order({ type: 'LIMIT', limitPrice: 1390, quantity: 100 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1380, 1405), ctx);
    expect(r.quantity).toBeGreaterThan(0);
    expect(r.price).toBeLessThanOrEqual(1390);
  });

  it('does not fill when the price merely touches the limit', () => {
    const st = newOrderState(order({ type: 'LIMIT', limitPrice: 1395, quantity: 100 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1395, 1405), ctx);
    expect(r.quantity).toBe(0);
    expect(r.explanation).toMatch(/touch is not a fill/);
  });

  it('does not fill when the price never reaches the limit', () => {
    const st = newOrderState(order({ type: 'LIMIT', limitPrice: 1300, quantity: 100 }));
    const r = fillAgainstBar(st, bar(1400, 1410, 1395, 1405), ctx);
    expect(r.quantity).toBe(0);
    expect(r.reason).toBe('limit_not_reached');
  });
});

describe('fill engine — stops, gaps, and the SL vs SL-M lesson', () => {
  const sellStop = (type: 'SL' | 'SL-M', limitPrice?: number) =>
    newOrderState(
      order({ side: 'sell', type, quantity: 100, triggerPrice: 1350, limitPrice }),
    );

  it('leaves the stop resting when the trigger is not hit', () => {
    const r = fillAgainstBar(sellStop('SL-M'), bar(1400, 1410, 1360, 1405), ctx);
    expect(r.triggered).toBe(false);
    expect(r.reason).toBe('trigger_not_hit');
  });

  it('fills an SL-M near the trigger on an ordinary drift down', () => {
    const r = fillAgainstBar(sellStop('SL-M'), bar(1400, 1402, 1330, 1340), ctx);
    expect(r.triggered).toBe(true);
    expect(r.quantity).toBe(100);
    expect(r.price).toBeLessThanOrEqual(1350);
    expect(r.components.gap).toBe(0);
  });

  it('fills an SL-M at the OPEN, not the trigger, when the bar gaps through it', () => {
    // Overnight gap: previous close 1400, opens at 1200, trigger was 1350.
    const r = fillAgainstBar(sellStop('SL-M'), bar(1200, 1210, 1180, 1195), ctx);
    expect(r.triggered).toBe(true);
    expect(r.quantity).toBe(100);
    expect(r.price).toBeLessThanOrEqual(1200);
    expect(r.components.gap).toBeCloseTo(150, 0);
    expect(r.explanation).toMatch(/Stops protect you from drift, not from gaps/);
  });

  it('leaves an SL holder STILL LONG when the gap blows through the limit', () => {
    // Same gap, but an SL with a 1345 limit. Triggered — and unfillable.
    const r = fillAgainstBar(sellStop('SL', 1345), bar(1200, 1210, 1180, 1195), ctx);
    expect(r.triggered).toBe(true);
    expect(r.quantity).toBe(0);
    expect(r.reason).toBe('stop_limit_gapped_through');
    expect(r.explanation).toMatch(/STILL LONG/);
    expect(r.explanation).toMatch(/SL-M order would have got you out/);
  });

  it('is the whole lesson: SL-M exits at a bad price, SL does not exit at all', () => {
    const gapBar = bar(1200, 1210, 1180, 1195);
    const slm = fillAgainstBar(sellStop('SL-M'), gapBar, ctx);
    const sl = fillAgainstBar(sellStop('SL', 1345), gapBar, ctx);
    expect(slm.quantity).toBe(100);
    expect(sl.quantity).toBe(0);
  });
});

describe('fill engine — circuit locks', () => {
  const band = indiaPriceBand(1400, 20); // 1120 – 1680

  it('refuses to sell into a locked lower circuit', () => {
    const st = newOrderState(order({ side: 'sell', type: 'MARKET', quantity: 100 }));
    const r = fillAgainstBar(st, bar(1130, 1135, 1120, 1120), { ...ctx, band });
    expect(r.quantity).toBe(0);
    expect(r.reason).toBe('circuit_locked');
    expect(r.explanation).toMatch(/nobody to buy from you/);
  });

  it('refuses to buy into a locked upper circuit', () => {
    const st = newOrderState(order({ type: 'MARKET', quantity: 100 }));
    const r = fillAgainstBar(st, bar(1670, 1680, 1665, 1680), { ...ctx, band });
    expect(r.quantity).toBe(0);
    expect(r.explanation).toMatch(/nobody to sell to you/);
  });

  it('still allows the side that has counterparties', () => {
    const st = newOrderState(order({ side: 'sell', type: 'MARKET', quantity: 100 }));
    const r = fillAgainstBar(st, bar(1670, 1680, 1665, 1680), { ...ctx, band });
    expect(r.quantity).toBe(100);
  });
});

describe('fill engine — invariants that must never break', () => {
  const bars: Candle[] = [
    bar(1400, 1410, 1395, 1405),
    bar(1200, 1260, 1180, 1195, 50_000),
    bar(100, 105, 99, 101, 10),
  ];

  it('never fills a buy below the bar low or a sell above the bar high', () => {
    for (const b of bars) {
      const buy = fillAgainstBar(newOrderState(order({ quantity: 10 })), b, ctx);
      const sell = fillAgainstBar(newOrderState(order({ side: 'sell', quantity: 10 })), b, ctx);
      if (buy.quantity > 0) expect(buy.price).toBeGreaterThanOrEqual(b.low);
      if (sell.quantity > 0) expect(sell.price).toBeLessThanOrEqual(b.high);
    }
  });

  it('never fills more than the order quantity', () => {
    const st = newOrderState(order({ quantity: 10 }));
    for (const b of bars) {
      expect(fillAgainstBar(st, b, ctx).quantity).toBeLessThanOrEqual(10);
    }
  });

  it('never reports negative slippage on a market order — costs only run one way', () => {
    for (const b of bars) {
      const st = newOrderState(order({ type: 'SL-M', side: 'sell', quantity: 10, triggerPrice: b.high + 1 }));
      const r = fillAgainstBar(st, b, ctx);
      if (r.quantity > 0) expect(r.slippage).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('fill config', () => {
  it('defaults to a conservative 10% participation cap', () => {
    expect(DEFAULT_FILL_CONFIG.maxParticipation).toBe(0.1);
    expect(DEFAULT_FILL_CONFIG.pessimisticIntrabar).toBe(true);
  });
});
