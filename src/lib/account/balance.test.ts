import { describe, expect, it } from 'vitest';
import { BASE_STARTING_CASH, MIN_STARTING_CASH, startingCashFor } from './balance';

describe('startingCashFor', () => {
  it('is the base amount for a learner with no recorded pnl', () => {
    expect(startingCashFor(0)).toBe(BASE_STARTING_CASH);
  });

  it('adds a positive running pnl on top of the base', () => {
    expect(startingCashFor(10_000)).toBe(BASE_STARTING_CASH + 10_000);
  });

  it('subtracts a negative running pnl from the base', () => {
    expect(startingCashFor(-20_000)).toBe(BASE_STARTING_CASH - 20_000);
  });

  it('floors at MIN_STARTING_CASH rather than letting a losing streak zero the account out', () => {
    expect(startingCashFor(-1_000_000)).toBe(MIN_STARTING_CASH);
  });
});
