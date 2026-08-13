import { describe, expect, it } from 'vitest';
import { FLAGSHIP_GAMES, FREE_TIERS, hasProAccess, isGameGated, isTierGated } from './access';
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
  it('gates exactly the four flagship games', () => {
    expect(FLAGSHIP_GAMES).toEqual(['chart-replay', 'payoff-builder', 'circuit-breaker', 'earnings-roulette']);
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
