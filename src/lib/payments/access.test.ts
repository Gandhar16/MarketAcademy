import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FLAGSHIP_GAMES, FREE_TIERS, hasProAccess, isGameGated, isTierGated, paywallEnabled } from './access';
import { TIERS } from '@/lib/lesson/dsl';

describe('isTierGated', () => {
  it('leaves T0 and T1 free', () => {
    expect(isTierGated('T0')).toBe(false);
    expect(isTierGated('T1')).toBe(false);
  });

  it('gates T2 through T5', () => {
    for (const tier of TIERS.filter((t) => !FREE_TIERS.includes(t))) {
      expect(isTierGated(tier)).toBe(true);
    }
  });
});

describe('isGameGated', () => {
  it('gates exactly the flagship games', () => {
    expect(FLAGSHIP_GAMES).toEqual([
      'chart-replay',
      'payoff-builder',
      'circuit-breaker',
      'earnings-roulette',
      'margin-call',
      'expiry-day',
    ]);
    for (const slug of FLAGSHIP_GAMES) expect(isGameGated(slug)).toBe(true);
  });

  it('leaves everything else free', () => {
    for (const slug of ['order-gauntlet', 'cost-cutter', 'risk-roulette', 'bias-buster', 'candle-sprint', 'the-long-game']) {
      expect(isGameGated(slug)).toBe(false);
    }
  });
});

describe('hasProAccess', () => {
  const NOW = 1_800_000_000_000;

  it('is false for no plan state at all', () => {
    expect(hasProAccess(null, NOW)).toBe(false);
    expect(hasProAccess(undefined, NOW)).toBe(false);
  });

  it('is false on the free plan regardless of expiry', () => {
    expect(hasProAccess({ plan: 'free', planExpiresAt: null }, NOW)).toBe(false);
    expect(hasProAccess({ plan: 'free', planExpiresAt: NOW + 1000 }, NOW)).toBe(false);
  });

  it('is true for a lifetime grant — plan pro, expiry null', () => {
    expect(hasProAccess({ plan: 'pro', planExpiresAt: null }, NOW)).toBe(true);
  });

  it('is true for a recurring plan whose period has not yet ended', () => {
    expect(hasProAccess({ plan: 'pro', planExpiresAt: NOW + 1 }, NOW)).toBe(true);
  });

  it('is false the instant a recurring plan expires — no grace period', () => {
    expect(hasProAccess({ plan: 'pro', planExpiresAt: NOW }, NOW)).toBe(false);
    expect(hasProAccess({ plan: 'pro', planExpiresAt: NOW - 1 }, NOW)).toBe(false);
  });
});

describe('paywallEnabled', () => {
  const original = process.env.PAYWALL_ENABLED;
  afterEach(() => {
    if (original === undefined) delete process.env.PAYWALL_ENABLED;
    else process.env.PAYWALL_ENABLED = original;
  });

  it('defaults to off — unset means enforcement is off', () => {
    delete process.env.PAYWALL_ENABLED;
    expect(paywallEnabled()).toBe(false);
  });

  it('is off for anything other than the literal string "true"', () => {
    for (const v of ['1', 'yes', 'True', 'TRUE', '']) {
      process.env.PAYWALL_ENABLED = v;
      expect(paywallEnabled()).toBe(false);
    }
  });

  it('is on only for the exact string "true"', () => {
    process.env.PAYWALL_ENABLED = 'true';
    expect(paywallEnabled()).toBe(true);
  });
});

describe('paywallEnabled does not affect hasProAccess', () => {
  const original = process.env.PAYWALL_ENABLED;
  beforeEach(() => {
    process.env.PAYWALL_ENABLED = 'false';
  });
  afterEach(() => {
    if (original === undefined) delete process.env.PAYWALL_ENABLED;
    else process.env.PAYWALL_ENABLED = original;
  });

  it('reports the true plan state regardless of the kill switch — account/pricing pages must stay honest', () => {
    // hasProAccess is deliberately independent of the switch; enforcement
    // call sites check paywallEnabled() themselves. See access.ts.
    expect(hasProAccess({ plan: 'free', planExpiresAt: null })).toBe(false);
    expect(hasProAccess({ plan: 'pro', planExpiresAt: null })).toBe(true);
  });
});
