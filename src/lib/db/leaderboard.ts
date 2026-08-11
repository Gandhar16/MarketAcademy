/**
 * Rankings.
 *
 * PLAN.md §7 rule 4 says a disciplined loss ranks above a reckless win. A
 * leaderboard is where that rule either holds or quietly dies, because a
 * leaderboard is the single loudest statement a product makes about what it
 * values. Every trading game that ranks by returns teaches people to gamble:
 * over a short contest the winner is whoever took the most risk and got away
 * with it, and everybody watching learns that lesson whether or not it was
 * intended.
 *
 * So P&L is stored, shown, and never ranked. `leaderboardInputs()` below is the
 * complete list of what a rank is made of, and a test asserts that a learner
 * who doubles their P&L with no change in behaviour does not move.
 *
 * ONE SUBTLETY, ADDED WHEN GAME XP STARTED REWARDING WINS
 *
 * XP for a game run now requires the run to have paid, on top of four gates
 * about the decision. That makes total XP an outcome-carrying number, and this
 * board would have ranked on it. So the query reads `lesson_xp`, which is
 * earned from checkpoints alone and cannot be moved by a profitable trade.
 * P&L would otherwise have walked back in through the knowledge component,
 * quietly, with nobody having decided to let it.
 */
import type { Db } from './driver';

export type Board = 'overall' | 'discipline' | 'knowledge' | 'consistency';

export interface RankedEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  /** The three components, exposed so the page can show why a rank is what it is. */
  discipline: number;
  knowledge: number;
  consistency: number;
  xp: number;
  lessonsDone: number;
  streakLongest: number;
  runs: number;
  /** Shown for interest. Not an input to any rank. */
  netPnl: number | null;
}

/** Weights. They sum to 100 so a score reads as a percentage of the ideal. */
export const WEIGHTS = { discipline: 50, knowledge: 35, consistency: 15 } as const;

/**
 * XP needed to max the knowledge component. Log-scaled below it, because the
 * gap between someone who has done nothing and someone who has done ten lessons
 * matters far more than the gap between two hundred and two hundred and ten.
 */
export const XP_CEILING = 20_000;

/** Days of streak that count as fully consistent. Beyond this it stops paying. */
export const STREAK_CEILING = 60;

/**
 * A rank cannot be earned on one lucky run. Below this, a learner appears on
 * the board with a provisional marker instead of a competitive score.
 */
export const MIN_RUNS_FOR_DISCIPLINE = 5;

export function knowledgeScore(xp: number): number {
  if (xp <= 0) return 0;
  const ratio = Math.min(1, Math.log1p(xp) / Math.log1p(XP_CEILING));
  return ratio * 100;
}

export function consistencyScore(longestStreak: number): number {
  return Math.min(1, longestStreak / STREAK_CEILING) * 100;
}

/**
 * The full set of inputs to a ranking. If a field is not on this object, it
 * cannot influence a rank — which is the property the P&L test relies on.
 */
export interface RankInputs {
  processScore: number;
  xp: number;
  longestStreak: number;
  runs: number;
}

export function leaderboardInputs(): (keyof RankInputs)[] {
  return ['processScore', 'xp', 'longestStreak', 'runs'];
}

export function overallScore(input: RankInputs): number {
  // Below the minimum, discipline is scaled down rather than zeroed: a beginner
  // with two good runs should still be on the board and still be behind the
  // person who has proved it twenty times.
  const confidence = Math.min(1, input.runs / MIN_RUNS_FOR_DISCIPLINE);
  const discipline = input.processScore * confidence;

  return (
    (discipline * WEIGHTS.discipline +
      knowledgeScore(input.xp) * WEIGHTS.knowledge +
      consistencyScore(input.longestStreak) * WEIGHTS.consistency) /
    100
  );
}

interface BoardRow {
  user_id: string;
  display_name: string;
  xp: number;
  process_score: number;
  streak_longest: number;
  lessons_done: number;
  runs: number;
  net_pnl: number | null;
}

/**
 * Only users who opted in are selected at all. Nobody is on this board because
 * they forgot to find a setting.
 */
export async function leaderboard(db: Db, board: Board = 'overall', limit = 50): Promise<RankedEntry[]> {
  const rows = await db.all<BoardRow>(
      `SELECT u.id AS user_id,
              u.display_name,
              -- lesson_xp, NOT xp. Game XP rewards a well-reasoned win and so
              -- carries an outcome signal; ranking on it would smuggle P&L into
              -- the board through the back door. Lesson XP comes from
              -- checkpoints and cannot be moved by a profitable trade.
              COALESCE(s.lesson_xp, 0)      AS xp,
              COALESCE(s.process_score, 0)  AS process_score,
              COALESCE(s.streak_longest, 0) AS streak_longest,
              COALESCE(s.lessons_done, 0)   AS lessons_done,
              COALESCE(s.runs, 0)           AS runs,
              -- Read from the running total rather than re-summed, so the number
              -- on the board is the same number on the account page.
              CASE WHEN COALESCE(s.runs, 0) = 0 THEN NULL ELSE COALESCE(s.net_pnl, 0) END AS net_pnl
         FROM users u
         LEFT JOIN user_stats s ON s.user_id = u.id
        WHERE u.leaderboard_opt_in = 1`,
  );

  const entries = rows.map((row) => {
    // The remote driver returns SQLite integers as bigint where node:sqlite
    // returns number. Normalised once, here, rather than in every comparison.
    const r = {
      user_id: row.user_id,
      display_name: row.display_name,
      xp: Number(row.xp),
      process_score: Number(row.process_score),
      streak_longest: Number(row.streak_longest),
      lessons_done: Number(row.lessons_done),
      runs: Number(row.runs),
      net_pnl: row.net_pnl == null ? null : Number(row.net_pnl),
    };

    const inputs: RankInputs = {
      processScore: r.process_score,
      xp: r.xp,
      longestStreak: r.streak_longest,
      runs: r.runs,
    };
    const confidence = Math.min(1, r.runs / MIN_RUNS_FOR_DISCIPLINE);
    return {
      rank: 0,
      userId: r.user_id,
      displayName: r.display_name,
      score: overallScore(inputs),
      discipline: r.process_score * confidence,
      knowledge: knowledgeScore(r.xp),
      consistency: consistencyScore(r.streak_longest),
      xp: r.xp,
      lessonsDone: r.lessons_done,
      streakLongest: r.streak_longest,
      runs: r.runs,
      netPnl: r.net_pnl,
    } satisfies RankedEntry;
  });

  const key: (e: RankedEntry) => number =
    board === 'discipline'
      ? (e) => e.discipline
      : board === 'knowledge'
        ? (e) => e.knowledge
        : board === 'consistency'
          ? (e) => e.consistency
          : (e) => e.score;

  entries.sort((a, b) => key(b) - key(a) || a.displayName.localeCompare(b.displayName));

  // Ties share a rank, and the next rank skips — 1, 2, 2, 4. Anything else
  // invents a distinction the data does not support.
  let lastScore = Number.NaN;
  let lastRank = 0;
  entries.forEach((e, i) => {
    const s = key(e);
    if (s !== lastScore) {
      lastRank = i + 1;
      lastScore = s;
    }
    e.rank = lastRank;
    e.score = s;
  });

  return entries.slice(0, limit);
}

/** A learner's own position, including when they are outside the visible page. */
export async function rankOf(db: Db, userId: string, board: Board = 'overall'): Promise<RankedEntry | null> {
  const all = await leaderboard(db, board, Number.MAX_SAFE_INTEGER);
  return all.find((e) => e.userId === userId) ?? null;
}

export interface GameBoardEntry {
  rank: number;
  displayName: string;
  processScore: number;
  runs: number;
  bestAccuracy: number | null;
}

/** Per-game board. Ranked on the learner's average process score in that game. */
export async function gameLeaderboard(db: Db, game: string, limit = 25): Promise<GameBoardEntry[]> {
  const rows = await db.all<{
    display_name: string;
    avg_process: number;
    runs: number;
    best_accuracy: number | null;
  }>(
      `SELECT u.display_name,
              AVG(g.process_score) AS avg_process,
              COUNT(*)             AS runs,
              MAX(g.accuracy)      AS best_accuracy
         FROM game_runs g
         JOIN users u ON u.id = g.user_id
        WHERE g.game = ? AND u.leaderboard_opt_in = 1
        GROUP BY u.id
       HAVING COUNT(*) >= ?
        ORDER BY avg_process DESC, runs DESC
        LIMIT ?`,
    game,
    MIN_RUNS_FOR_DISCIPLINE,
    limit,
  );

  return rows.map((r, i) => ({
    rank: i + 1,
    displayName: r.display_name,
    processScore: Number(r.avg_process),
    runs: Number(r.runs),
    bestAccuracy: r.best_accuracy == null ? null : Number(r.best_accuracy),
  }));
}
