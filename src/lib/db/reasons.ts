/**
 * The reasoning feed — the one place on this site where one learner's thinking
 * is visible to another.
 *
 * WHY PUBLISH REASONS AND NOT RESULTS
 *
 * A leaderboard of returns teaches you to copy whoever got lucky, because from
 * the outside a lucky decision and a good one look identical. Their reasoning
 * does not. "I sized this at 0.8% because the stop had to sit under the swing
 * low, which was 4% away" is a sentence you can learn from, disagree with, or
 * catch an error in. "+18.4%" is not.
 *
 * So this feed carries the reason, the planned reward-to-risk, and the process
 * score — and it carries the P&L too, greyed and last, for the same reason the
 * leaderboard does: hiding it would be evasive, and a learner who spots a run
 * with excellent reasoning and a loss has just been taught the actual lesson.
 *
 * WHAT IS AND IS NOT SHOWN
 *
 * Only runs by learners who opted in to the leaderboard appear here, and only
 * runs that actually carry a reason. A learner who never ticked the box is
 * absent from the query, not filtered out of its results.
 *
 * The reason text is learner-supplied and is rendered as TEXT, never as HTML.
 * Nothing in this file escapes anything, because nothing downstream of it
 * interprets markup — see ReasonFeed.tsx.
 */
import type { Db, SqlValue } from './driver';
import { MIN_PLANNED_RR, MIN_REASON_CHARS } from '@/lib/progress/mastery';

export interface ReasonEntry {
  id: string;
  displayName: string;
  game: string;
  playedAt: number;
  reason: string;
  processScore: number;
  plannedRR: number | null;
  xpAwarded: number;
  trades: number;
  /** Shown, greyed and last. Never sorted or ranked on. */
  pnl: number | null;
}

interface Row {
  id: string;
  display_name: string;
  game: string;
  played_at: number;
  reason: string;
  process_score: number;
  planned_rr: number | null;
  xp_awarded: number;
  trades: number;
  pnl: number | null;
}

export const REASON_FEED_LIMIT = 40;
/** Trim on display. The full text stays in the database. */
export const REASON_MAX_CHARS = 1200;

const SELECT = `
  SELECT r.id, u.display_name, r.game, r.played_at, r.reason, r.process_score,
         r.planned_rr, r.xp_awarded, r.trades, r.pnl
    FROM game_runs r
    JOIN users u ON u.id = r.user_id
   WHERE u.leaderboard_opt_in = 1
     AND LENGTH(TRIM(r.reason)) >= ?`;

function toEntry(r: Row): ReasonEntry {
  return {
    id: r.id,
    displayName: r.display_name,
    game: r.game,
    // Integers come back as bigint from the remote driver and as number from
    // node:sqlite. Normalised here so nothing downstream has to know which.
    playedAt: Number(r.played_at),
    reason: r.reason.slice(0, REASON_MAX_CHARS),
    processScore: Number(r.process_score),
    plannedRR: r.planned_rr == null ? null : Number(r.planned_rr),
    xpAwarded: Number(r.xp_awarded),
    trades: Number(r.trades),
    pnl: r.pnl == null ? null : Number(r.pnl),
  };
}

/**
 * Recent reasoning, newest first.
 *
 * Newest rather than best, deliberately. Sorting by process score would turn
 * the feed into a second leaderboard and would show the same handful of runs
 * for weeks; sorting by time shows what people are actually thinking today,
 * including the runs that went wrong, which are the more instructive half.
 */
export async function recentReasons(db: Db, game?: string, limit = REASON_FEED_LIMIT): Promise<ReasonEntry[]> {
  const sql = `${SELECT} ${game ? 'AND r.game = ?' : ''} ORDER BY r.played_at DESC LIMIT ?`;
  const args: SqlValue[] = game ? [MIN_REASON_CHARS, game, limit] : [MIN_REASON_CHARS, limit];
  return (await db.all<Row>(sql, ...args)).map(toEntry);
}

/**
 * Runs worth reading: cleared every XP gate, so the reasoning behind them met
 * a stated bar rather than merely existing.
 *
 * `xp_awarded > 0` is the whole filter, and that is the point of storing it:
 * the gates live in one function (runXp), and every consumer asks the same
 * question of the same recorded answer instead of re-deriving it differently.
 */
export async function exemplaryReasons(db: Db, limit = REASON_FEED_LIMIT): Promise<ReasonEntry[]> {
  return (
    await db.all<Row>(
      `${SELECT} AND r.xp_awarded > 0 AND r.planned_rr >= ? ORDER BY r.played_at DESC LIMIT ?`,
      MIN_REASON_CHARS,
      MIN_PLANNED_RR,
      limit,
    )
  ).map(toEntry);
}

/** One learner's own reasoning history, opt-in irrelevant — it is their data. */
export async function reasonsByUser(db: Db, userId: string, limit = REASON_FEED_LIMIT): Promise<ReasonEntry[]> {
  return (
    await db.all<Row>(
      `SELECT r.id, u.display_name, r.game, r.played_at, r.reason, r.process_score,
              r.planned_rr, r.xp_awarded, r.trades, r.pnl
         FROM game_runs r JOIN users u ON u.id = r.user_id
        WHERE r.user_id = ? AND LENGTH(TRIM(r.reason)) > 0
        ORDER BY r.played_at DESC LIMIT ?`,
      userId,
      limit,
    )
  ).map(toEntry);
}
