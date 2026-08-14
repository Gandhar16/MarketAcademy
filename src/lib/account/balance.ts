/**
 * The one trading balance every cash-based game shares.
 *
 * Chart Replay used to start every session from its own hardcoded pile of
 * play money (200,000), disconnected from anything that happened last time.
 * That gave a losing streak nowhere to show up and a winning streak nothing
 * to carry forward — every session was a fresh, unrelated number, and the
 * P&L on the leaderboard was tracking a total that no game's own balance
 * ever agreed with.
 *
 * There is one account now. Everyone starts at BASE_STARTING_CASH. Every
 * recorded game run adds its pnl to `user_stats.net_pnl` (see
 * recordGameRun in lib/db/progress.ts) — the exact running total the
 * leaderboard's P&L column already reads. A new session's starting cash is
 * BASE_STARTING_CASH + that running total, so a win is still there the next
 * time you play, a loss is too, and "your balance" means the same number
 * everywhere it appears.
 */
export const BASE_STARTING_CASH = 50_000;

/**
 * A losing streak should not be able to lock a learner out of practising
 * with an account that has gone to zero or below.
 */
export const MIN_STARTING_CASH = 5_000;

export function startingCashFor(netPnl: number): number {
  return Math.max(MIN_STARTING_CASH, BASE_STARTING_CASH + netPnl);
}
