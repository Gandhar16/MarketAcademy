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
  /**
   * The mark-to-market P&L of whichever position is open RIGHT NOW in
   * whichever game is on screen — zero when nothing is open. This is what
   * used to make a game's own "Equity" number drift from the header: a game
   * computed it locally and only banked money into `netPnl` once a position
   * closed, so the two numbers agreed only at the instant nothing was open.
   * Every game now writes its open position's live P&L HERE instead of
   * computing its own separate number, so there is exactly one balance —
   * `startingCash + liveUnrealized` — and the header and the game are
   * rendering that same store value, not two calculations that happen to
   * often match.
   */
  liveUnrealized: number;
  status: 'idle' | 'loading' | 'ready';
  signedIn: boolean;
  /** Fetches the real balance from the server. Safe to call more than once — a second call while one is in flight is a no-op. */
  hydrate: () => Promise<void>;
  /** Applies a running-total P&L the caller already knows (e.g. a run verdict's `totals.netPnl`) without a round trip. */
  setNetPnl: (netPnl: number) => void;
  /** Applies a single delta on top of whatever is currently known, for callers that only know the change, not the new total. */
  applyDelta: (delta: number) => void;
  /**
   * Banks one closed trade's realised P&L: applies it to the balance
   * immediately (so the header and every other open game reflect it on this
   * render) and persists it to `/api/account/fill` so it survives a reload
   * and a switch to a different game. Silent no-op for a signed-out learner —
   * there is nowhere to persist it, and the local delta already showed them
   * the result.
   */
  bankFill: (game: string, pnl: number) => void;
  /**
   * Called by whichever game currently has a position open, every time its
   * mark-to-market value changes (a new bar, a price tick) — and with `0`
   * the instant it goes flat, closes, or the game is left. Not persisted:
   * this is genuinely unrealised, so a reload correctly drops back to just
   * the banked balance, the same way a real broker's app would.
   */
  setLiveUnrealized: (amount: number) => void;
}

let inFlight: Promise<void> | null = null;

export const useAccountStore = create<AccountState>((set, get) => ({
  startingCash: BASE_STARTING_CASH,
  netPnl: 0,
  liveUnrealized: 0,
  status: 'idle',
  signedIn: false,

  hydrate: async () => {
    if (inFlight) return inFlight;
    set({ status: 'loading' });
    inFlight = fetch('/api/account/balance')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { startingCash: number; netPnl: number } | null) => {
        // `liveUnrealized` resets here too: the server's number is always
        // the fully-realised truth, and a stale open-position delta from
        // whatever game was last on screen must not leak into a fresh page.
        if (data) {
          set({ startingCash: data.startingCash, netPnl: data.netPnl, liveUnrealized: 0, signedIn: true, status: 'ready' });
        } else {
          set({ status: 'ready' });
        }
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

  bankFill: (game, pnl) => {
    if (pnl === 0) return;
    const netPnl = get().netPnl + pnl;
    set({ netPnl, startingCash: startingCashFor(netPnl) });
    if (!get().signedIn) return;
    const id = `${game}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    fetch('/api/account/fill', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, game, pnl }),
    }).catch(() => {
      // Best-effort. The optimistic delta already reflects it locally; the
      // next hydrate() (a fresh page, a different game) reconciles with the
      // server, which is the same recovery path a dropped sim fill takes.
    });
  },

  setLiveUnrealized: (amount) => {
    if (get().liveUnrealized === amount) return;
    set({ liveUnrealized: amount });
  },
}));

/** The one number every game and the header display — banked plus whatever is open right now. */
export function displayBalance(state: AccountState): number {
  return state.startingCash + state.liveUnrealized;
}
