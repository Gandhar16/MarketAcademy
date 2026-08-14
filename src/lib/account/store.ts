'use client';

/**
 * The client-side mirror of the shared account balance.
 *
 * One store, read by the header (always visible) and every cash-based game
 * (Chart Replay, Simulator). Whichever one learns the balance changed first —
 * usually a game filing a run — writes it here directly instead of waiting
 * for the header to poll, so "updated everywhere" means everywhere on the
 * SAME render, not eventually.
 */
import { create } from 'zustand';
import { BASE_STARTING_CASH, startingCashFor } from './balance';

interface AccountState {
  startingCash: number;
  netPnl: number;
  status: 'idle' | 'loading' | 'ready';
  signedIn: boolean;
  /** Fetches the real balance from the server. Safe to call more than once — a second call while one is in flight is a no-op. */
  hydrate: () => Promise<void>;
  /** Applies a running-total P&L the caller already knows (e.g. a run verdict's `totals.netPnl`) without a round trip. */
  setNetPnl: (netPnl: number) => void;
  /** Applies a single delta on top of whatever is currently known, for callers that only know the change, not the new total. */
  applyDelta: (delta: number) => void;
}

let inFlight: Promise<void> | null = null;

export const useAccountStore = create<AccountState>((set, get) => ({
  startingCash: BASE_STARTING_CASH,
  netPnl: 0,
  status: 'idle',
  signedIn: false,

  hydrate: async () => {
    if (inFlight) return inFlight;
    set({ status: 'loading' });
    inFlight = fetch('/api/account/balance')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { startingCash: number; netPnl: number } | null) => {
        if (data) set({ startingCash: data.startingCash, netPnl: data.netPnl, signedIn: true, status: 'ready' });
        else set({ status: 'ready' });
      })
      .catch(() => set({ status: 'ready' }))
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  },

  setNetPnl: (netPnl) => set({ netPnl, startingCash: startingCashFor(netPnl), signedIn: true, status: 'ready' }),

  applyDelta: (delta) => {
    const netPnl = get().netPnl + delta;
    set({ netPnl, startingCash: startingCashFor(netPnl) });
  },
}));
