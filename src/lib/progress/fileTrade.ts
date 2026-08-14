'use client';

/**
 * Files one closed trade/round the instant it closes, for every cash-based
 * game — not batched to a manual "file this run" click at the end of a
 * session. See ChartReplay.tsx for where this pattern started and why:
 * XP, the reasoning feed, and the leaderboard should all see a result the
 * moment it happens, same as the balance itself already does via
 * lib/account/store.ts's bankFill.
 */
import type { TradeRecord } from './mastery';
import { useAccountStore } from '@/lib/account/store';

export interface FiledTrade {
  pnl: number;
  xp: number;
  encouragement: string | null;
}

/**
 * Silent no-op for a signed-out learner — there is no account to file it
 * under, same reasoning as bankFill. Best-effort on the network: a dropped
 * connection loses the XP/reasoning entry for this one trade, not the P&L,
 * which bankFill already banked separately and unconditionally.
 */
export async function fileTrade(
  game: string,
  record: TradeRecord,
  reason: string,
  opts: { sessionId?: string; accuracy?: number } = {},
): Promise<FiledTrade | null> {
  if (!useAccountStore.getState().signedIn) return null;
  try {
    const res = await fetch('/api/progress/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        game,
        trades: [record],
        reason,
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
        ...(opts.accuracy != null ? { accuracy: opts.accuracy } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Reconciles with the server's own running total — it should already
    // match the optimistic bankFill delta from the same trade closing.
    useAccountStore.getState().setNetPnl(data.totals.netPnl);
    return { pnl: record.pnl, xp: data.xpAwarded, encouragement: data.encouragement ?? null };
  } catch {
    return null;
  }
}
