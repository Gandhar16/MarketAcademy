import { describe, expect, it } from 'vitest';
import {
  equityAt,
  liquidationPriceFor,
  marginRequiredFor,
  marginStateAt,
  sharesForMargin,
  LIQUIDATION_FRACTION,
} from './margin';

describe('marginRequiredFor', () => {
  it('is notional divided by leverage', () => {
    expect(marginRequiredFor(10_000, 5)).toBe(2_000);
  });
});

describe('sharesForMargin', () => {
  it('gives more shares at higher leverage for the same margin', () => {
    const at2x = sharesForMargin(100, 1_000, 2);
    const at10x = sharesForMargin(100, 1_000, 10);
    expect(at10x).toBeGreaterThan(at2x);
    expect(at2x).toBe(20);
    expect(at10x).toBe(100);
  });
});

describe('liquidationPriceFor', () => {
  it('sits below entry for a long, and further below at higher leverage', () => {
    const entryPrice = 100;
    const shares5x = sharesForMargin(entryPrice, 1_000, 5);
    const shares10x = sharesForMargin(entryPrice, 1_000, 10);
    const liq5x = liquidationPriceFor({ entryPrice, shares: shares5x, marginPosted: 1_000 });
    const liq10x = liquidationPriceFor({ entryPrice, shares: shares10x, marginPosted: 1_000 });
    expect(liq5x).toBeLessThan(entryPrice);
    expect(liq10x).toBeLessThan(entryPrice);
    // Same margin, more leverage: a smaller price move wipes it out, so the
    // liquidation line sits closer to entry, not further away.
    expect(liq10x).toBeGreaterThan(liq5x);
  });

  it('is exactly liquidationFraction/leverage below entry, as a fraction', () => {
    const entryPrice = 200;
    const leverage = 4;
    const marginPosted = 1_000;
    const shares = sharesForMargin(entryPrice, marginPosted, leverage);
    const liq = liquidationPriceFor({ entryPrice, shares, marginPosted });
    const expectedDrop = entryPrice * (LIQUIDATION_FRACTION / leverage);
    expect(liq).toBeCloseTo(entryPrice - expectedDrop, 6);
  });

  it('moves down when more margin is posted against the same shares', () => {
    const entryPrice = 100;
    const shares = sharesForMargin(entryPrice, 1_000, 5);
    const before = liquidationPriceFor({ entryPrice, shares, marginPosted: 1_000 });
    const after = liquidationPriceFor({ entryPrice, shares, marginPosted: 1_500 });
    expect(after).toBeLessThan(before);
  });
});

describe('equityAt', () => {
  it('equals margin posted when price has not moved', () => {
    const entryPrice = 100;
    const shares = sharesForMargin(entryPrice, 1_000, 5);
    expect(equityAt({ entryPrice, price: entryPrice, shares, marginPosted: 1_000 })).toBe(1_000);
  });

  it('amplifies a price move by the leverage implied in the share count', () => {
    const entryPrice = 100;
    const shares5x = sharesForMargin(entryPrice, 1_000, 5);
    const shares10x = sharesForMargin(entryPrice, 1_000, 10);
    const gain5x = equityAt({ entryPrice, price: 110, shares: shares5x, marginPosted: 1_000 }) - 1_000;
    const gain10x = equityAt({ entryPrice, price: 110, shares: shares10x, marginPosted: 1_000 }) - 1_000;
    expect(gain10x).toBeCloseTo(gain5x * 2, 6);
  });
});

describe('marginStateAt', () => {
  it('is not liquidated while price sits above the liquidation price', () => {
    const entryPrice = 100;
    const shares = sharesForMargin(entryPrice, 1_000, 5);
    const s = marginStateAt({ entryPrice, price: 98, shares, marginPosted: 1_000 });
    expect(s.liquidated).toBe(false);
    expect(s.distanceToCallPercent).toBeGreaterThan(0);
  });

  it('is liquidated once price reaches the liquidation price', () => {
    const entryPrice = 100;
    const leverage = 5;
    const marginPosted = 1_000;
    const shares = sharesForMargin(entryPrice, marginPosted, leverage);
    const liq = liquidationPriceFor({ entryPrice, shares, marginPosted });
    const s = marginStateAt({ entryPrice, price: liq, shares, marginPosted });
    expect(s.liquidated).toBe(true);
    expect(s.distanceToCallPercent).toBe(0);
  });

  it('a higher leverage position is liquidated by a smaller adverse move', () => {
    const entryPrice = 100;
    const marginPosted = 1_000;
    const shares2x = sharesForMargin(entryPrice, marginPosted, 2);
    const shares10x = sharesForMargin(entryPrice, marginPosted, 10);
    // A 6% drop: survivable unleveraged/lightly leveraged, fatal at 10x.
    const price = entryPrice * 0.94;
    const low = marginStateAt({ entryPrice, price, shares: shares2x, marginPosted });
    const high = marginStateAt({ entryPrice, price, shares: shares10x, marginPosted });
    expect(low.liquidated).toBe(false);
    expect(high.liquidated).toBe(true);
  });
});
