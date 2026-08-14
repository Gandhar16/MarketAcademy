/**
 * GET /api/account/balance
 *
 * The starting cash for a new cash-based game session. Signed-out learners
 * always get the base amount, since nothing they do can be persisted. A
 * signed-in learner gets the base plus their running P&L across every
 * recorded game run — the same number `user_stats.net_pnl` feeds the
 * leaderboard's P&L column with — so the balance a game hands you to start
 * with is always the balance you actually finished at last time.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { currentUser } from '@/lib/auth/session';
import { loadTotals } from '@/lib/db/progress';
import { BASE_STARTING_CASH, startingCashFor } from '@/lib/account/balance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ startingCash: BASE_STARTING_CASH, netPnl: 0, base: BASE_STARTING_CASH });
  }

  const db = await getDb();
  const totals = await loadTotals(db, user.id);
  return NextResponse.json({
    startingCash: startingCashFor(totals.netPnl),
    netPnl: totals.netPnl,
    base: BASE_STARTING_CASH,
  });
}
