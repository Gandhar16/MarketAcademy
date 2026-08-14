import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccountStore } from './store';
import { BASE_STARTING_CASH, startingCashFor } from './balance';

beforeEach(() => {
  useAccountStore.setState({ startingCash: BASE_STARTING_CASH, netPnl: 0, status: 'idle', signedIn: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
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

  describe('bankFill', () => {
    it('applies the delta immediately, whether signed in or not', () => {
      useAccountStore.getState().bankFill('chart-replay', -750);
      expect(useAccountStore.getState().netPnl).toBe(-750);
      expect(useAccountStore.getState().startingCash).toBe(startingCashFor(-750));
    });

    it('does not touch the network for a signed-out learner', () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      useAccountStore.getState().bankFill('chart-replay', 500);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('persists the fill for a signed-in learner', () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal('fetch', fetchMock);
      useAccountStore.getState().setNetPnl(0);
      useAccountStore.getState().bankFill('margin-call', 1_200);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/account/fill',
        expect.objectContaining({ method: 'POST' }),
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body).toMatchObject({ game: 'margin-call', pnl: 1_200 });
    });

    it('is a no-op for a zero-pnl round, so a sandbox game never spams the network', () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      useAccountStore.getState().setNetPnl(0);
      useAccountStore.getState().bankFill('bias-buster', 0);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(useAccountStore.getState().netPnl).toBe(0);
    });
  });
});
