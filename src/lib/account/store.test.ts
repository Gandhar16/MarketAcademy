import { beforeEach, describe, expect, it } from 'vitest';
import { useAccountStore } from './store';
import { BASE_STARTING_CASH, startingCashFor } from './balance';

beforeEach(() => {
  useAccountStore.setState({ startingCash: BASE_STARTING_CASH, netPnl: 0, status: 'idle', signedIn: false });
});

describe('useAccountStore', () => {
  it('setNetPnl recomputes startingCash from the same rule as the server', () => {
    useAccountStore.getState().setNetPnl(12_000);
    expect(useAccountStore.getState().startingCash).toBe(startingCashFor(12_000));
  });

  it('applyDelta accumulates on top of whatever net P&L is already known', () => {
    useAccountStore.getState().setNetPnl(1_000);
    useAccountStore.getState().applyDelta(-400);
    expect(useAccountStore.getState().netPnl).toBe(600);
    expect(useAccountStore.getState().startingCash).toBe(startingCashFor(600));
  });

  it('setNetPnl marks the learner as signed in, so the header knows to show a balance', () => {
    expect(useAccountStore.getState().signedIn).toBe(false);
    useAccountStore.getState().setNetPnl(0);
    expect(useAccountStore.getState().signedIn).toBe(true);
  });
});
