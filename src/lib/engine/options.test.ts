import { describe, expect, it } from 'vitest';
import {
  blackScholesPrice,
  daysToYears,
  greeks,
  impliedVolatility,
  intrinsicValue,
  legPayoff,
  normalCdf,
  payoffProfile,
  strategyPayoff,
  type Leg,
  type OptionInputs,
} from './options';

const atm = (over: Partial<OptionInputs> = {}): OptionInputs => ({
  spot: 100,
  strike: 100,
  timeToExpiry: daysToYears(30),
  volatility: 0.2,
  rate: 0.06,
  type: 'call',
  ...over,
});

describe('normalCdf', () => {
  it('is 0.5 at zero and symmetric', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1) + normalCdf(-1)).toBeCloseTo(1, 5);
  });

  it('matches known values', () => {
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.645)).toBeCloseTo(0.05, 3);
  });

  it('saturates without overflowing', () => {
    expect(normalCdf(10)).toBeCloseTo(1, 6);
    expect(normalCdf(-10)).toBeCloseTo(0, 6);
  });
});

describe('Black–Scholes pricing', () => {
  it('prices an ATM call above zero and below the spot', () => {
    const p = blackScholesPrice(atm());
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(100);
  });

  it('satisfies put–call parity', () => {
    // C - P = S·e^(-qT) - K·e^(-rT)
    const call = blackScholesPrice(atm({ type: 'call' }));
    const put = blackScholesPrice(atm({ type: 'put' }));
    const i = atm();
    const expected = i.spot - i.strike * Math.exp(-i.rate * i.timeToExpiry);
    expect(call - put).toBeCloseTo(expected, 6);
  });

  it('is worth at least intrinsic value', () => {
    for (const spot of [60, 80, 100, 120, 140]) {
      const call = blackScholesPrice(atm({ spot }));
      expect(call).toBeGreaterThanOrEqual(intrinsicValue(spot, 100, 'call') - 1e-9);
    }
  });

  it('rises with volatility — the entire reason IV matters', () => {
    const low = blackScholesPrice(atm({ volatility: 0.1 }));
    const high = blackScholesPrice(atm({ volatility: 0.4 }));
    expect(high).toBeGreaterThan(low * 2);
  });

  it('rises with time to expiry', () => {
    expect(blackScholesPrice(atm({ timeToExpiry: daysToYears(60) }))).toBeGreaterThan(
      blackScholesPrice(atm({ timeToExpiry: daysToYears(7) })),
    );
  });

  it('collapses to intrinsic value at expiry rather than returning NaN', () => {
    expect(blackScholesPrice(atm({ timeToExpiry: 0, spot: 120 }))).toBe(20);
    expect(blackScholesPrice(atm({ timeToExpiry: 0, spot: 80 }))).toBe(0);
    expect(blackScholesPrice(atm({ timeToExpiry: 0, spot: 80, type: 'put' }))).toBe(20);
  });

  it('collapses to intrinsic value at zero volatility rather than returning NaN', () => {
    expect(Number.isFinite(blackScholesPrice(atm({ volatility: 0 })))).toBe(true);
  });

  it('prices a deep OTM option near zero without going negative', () => {
    const p = blackScholesPrice(atm({ spot: 20, timeToExpiry: daysToYears(1) }));
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThan(0.01);
  });
});

describe('greeks', () => {
  it('gives an ATM call a delta near 0.5', () => {
    expect(greeks(atm()).delta).toBeGreaterThan(0.45);
    expect(greeks(atm()).delta).toBeLessThan(0.65);
  });

  it('bounds call delta in [0,1] and put delta in [-1,0]', () => {
    for (const spot of [50, 80, 100, 120, 200]) {
      expect(greeks(atm({ spot })).delta).toBeGreaterThanOrEqual(0);
      expect(greeks(atm({ spot })).delta).toBeLessThanOrEqual(1);
      expect(greeks(atm({ spot, type: 'put' })).delta).toBeLessThanOrEqual(0);
      expect(greeks(atm({ spot, type: 'put' })).delta).toBeGreaterThanOrEqual(-1);
    }
  });

  it('peaks gamma at the money and drops away from it', () => {
    const atmGamma = greeks(atm()).gamma;
    expect(atmGamma).toBeGreaterThan(greeks(atm({ spot: 130 })).gamma);
    expect(atmGamma).toBeGreaterThan(greeks(atm({ spot: 70 })).gamma);
  });

  it('spikes gamma as expiry approaches — why short options get dangerous late', () => {
    const far = greeks(atm({ timeToExpiry: daysToYears(60) })).gamma;
    const near = greeks(atm({ timeToExpiry: daysToYears(1) })).gamma;
    expect(near).toBeGreaterThan(far * 5);
  });

  it('makes theta negative for long options and accelerating into expiry', () => {
    const far = greeks(atm({ timeToExpiry: daysToYears(60) })).theta;
    const near = greeks(atm({ timeToExpiry: daysToYears(2) })).theta;
    expect(far).toBeLessThan(0);
    expect(near).toBeLessThan(far);
  });

  it('gives vega in price per percentage point of IV', () => {
    const i = atm();
    const v = greeks(i).vega;
    const bumped = blackScholesPrice({ ...i, volatility: i.volatility + 0.01 });
    expect(bumped - blackScholesPrice(i)).toBeCloseTo(v, 2);
  });

  it('makes vega highest at the money and near zero deep in or out', () => {
    expect(greeks(atm()).vega).toBeGreaterThan(greeks(atm({ spot: 200 })).vega);
    expect(greeks(atm({ spot: 200 })).vega).toBeLessThan(0.01);
  });

  it('degenerates cleanly at expiry instead of returning NaN', () => {
    const g = greeks(atm({ timeToExpiry: 0, spot: 120 }));
    expect(g.delta).toBe(1);
    expect(g.gamma).toBe(0);
    expect(g.theta).toBe(0);
    expect(g.vega).toBe(0);
    const put = greeks(atm({ timeToExpiry: 0, spot: 80, type: 'put' }));
    expect(put.delta).toBe(-1);
  });

  it('matches a numerical derivative for delta', () => {
    const i = atm();
    const h = 0.01;
    const numeric =
      (blackScholesPrice({ ...i, spot: i.spot + h }) - blackScholesPrice({ ...i, spot: i.spot - h })) / (2 * h);
    expect(greeks(i).delta).toBeCloseTo(numeric, 4);
  });
});

describe('implied volatility', () => {
  it('round-trips: price at a vol, solve, get the vol back', () => {
    for (const vol of [0.1, 0.2, 0.45, 0.9]) {
      const i = atm({ volatility: vol });
      const price = blackScholesPrice(i);
      const solved = impliedVolatility(price, { ...i });
      expect(solved).toBeCloseTo(vol, 3);
    }
  });

  it('round-trips for puts and for away-from-the-money strikes', () => {
    const i = atm({ type: 'put', spot: 108, strike: 100, volatility: 0.33 });
    const solved = impliedVolatility(blackScholesPrice(i), { ...i });
    expect(solved).toBeCloseTo(0.33, 3);
  });

  it('returns null for a price below intrinsic value rather than inventing one', () => {
    expect(impliedVolatility(5, { ...atm({ spot: 130 }) })).toBeNull();
  });

  it('returns null at or past expiry', () => {
    expect(impliedVolatility(1, { ...atm({ timeToExpiry: 0 }) })).toBeNull();
  });

  it('returns null for an absurdly high price rather than running to the bound', () => {
    expect(impliedVolatility(95, { ...atm() })).toBeNull();
  });
});

describe('payoffs', () => {
  const longCall: Leg = { type: 'call', quantity: 1, strike: 100, premium: 5 };
  const shortCall: Leg = { type: 'call', quantity: -1, strike: 110, premium: 2 };

  it('prices a long call payoff correctly either side of the strike', () => {
    expect(legPayoff(longCall, 90)).toBe(-5);
    expect(legPayoff(longCall, 100)).toBe(-5);
    expect(legPayoff(longCall, 105)).toBe(0);
    expect(legPayoff(longCall, 120)).toBe(15);
  });

  it('mirrors a short call', () => {
    expect(legPayoff({ ...longCall, quantity: -1 }, 120)).toBe(-15);
    expect(legPayoff({ ...longCall, quantity: -1 }, 90)).toBe(5);
  });

  it('caps a bull call spread on both sides', () => {
    const legs = [longCall, shortCall];
    const profile = payoffProfile(legs, { from: 50, to: 160 });
    expect(profile.unlimitedProfit).toBe(false);
    expect(profile.unlimitedLoss).toBe(false);
    expect(profile.maxProfit).toBeCloseTo(7, 6); // 10 wide, 3 net debit
    expect(profile.maxLoss).toBeCloseTo(-3, 6);
    expect(strategyPayoff(legs, 200)).toBeCloseTo(7, 6);
  });

  it('detects unlimited upside on a naked long call', () => {
    const profile = payoffProfile([longCall], { from: 50, to: 160 });
    expect(profile.unlimitedProfit).toBe(true);
    expect(profile.maxProfit).toBeNull();
    expect(profile.maxLoss).toBeCloseTo(-5, 6);
  });

  it('detects unlimited LOSS on a naked short call — the risk people misjudge', () => {
    const profile = payoffProfile([{ ...longCall, quantity: -1 }], { from: 50, to: 200 });
    expect(profile.unlimitedLoss).toBe(true);
    expect(profile.unlimitedProfit).toBe(false);
    expect(profile.maxLoss).toBeNull();
    expect(profile.maxProfit).toBeCloseTo(5, 6);
  });

  it('caps a long put at the strike rather than calling it unlimited', () => {
    // A price cannot fall below zero, so put profit is bounded — even though
    // the payoff is still sloping at the left edge of any sane chart range.
    const profile = payoffProfile([{ type: 'put', quantity: 1, strike: 100, premium: 4 }], { from: 60, to: 140 });
    expect(profile.unlimitedProfit).toBe(false);
    expect(profile.maxProfit).toBeCloseTo(96, 6);
    expect(profile.maxLoss).toBeCloseTo(-4, 6);
  });

  it('reports the far slopes so a UI can draw the arrows honestly', () => {
    const profile = payoffProfile([longCall], { from: 50, to: 160 });
    expect(profile.slopeAbove).toBe(1);
    expect(profile.slopeBelow).toBe(0);
  });

  it('finds both breakevens of a straddle', () => {
    const legs: Leg[] = [
      { type: 'call', quantity: 1, strike: 100, premium: 4 },
      { type: 'put', quantity: 1, strike: 100, premium: 4 },
    ];
    const profile = payoffProfile(legs, { from: 60, to: 140, steps: 800 });
    expect(profile.breakevens).toHaveLength(2);
    expect(profile.breakevens[0]).toBeCloseTo(92, 0);
    expect(profile.breakevens[1]).toBeCloseTo(108, 0);
  });

  it('caps an iron condor both ways', () => {
    const legs: Leg[] = [
      { type: 'put', quantity: 1, strike: 90, premium: 1 },
      { type: 'put', quantity: -1, strike: 95, premium: 2 },
      { type: 'call', quantity: -1, strike: 105, premium: 2 },
      { type: 'call', quantity: 1, strike: 110, premium: 1 },
    ];
    const profile = payoffProfile(legs, { from: 60, to: 140 });
    expect(profile.unlimitedProfit).toBe(false);
    expect(profile.unlimitedLoss).toBe(false);
    expect(profile.maxProfit).toBeCloseTo(2, 6);
    // The loss is larger than the gain — the trade most people misjudge.
    expect(Math.abs(profile.maxLoss as number)).toBeGreaterThan(profile.maxProfit as number);
  });

  it('handles a covered call: long stock, short call', () => {
    const legs: Leg[] = [
      { type: 'stock', quantity: 1, premium: 100 },
      { type: 'call', quantity: -1, strike: 110, premium: 3 },
    ];
    const profile = payoffProfile(legs, { from: 60, to: 160 });
    expect(profile.unlimitedProfit).toBe(false);
    expect(profile.maxProfit).toBeCloseTo(13, 6);
    expect(strategyPayoff(legs, 90)).toBeCloseTo(-7, 6);
  });
});

describe('daysToYears', () => {
  it('uses calendar days, because options decay over weekends too', () => {
    expect(daysToYears(365)).toBe(1);
    expect(daysToYears(7)).toBeCloseTo(7 / 365, 12);
  });
});
