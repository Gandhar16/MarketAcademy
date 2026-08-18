/**
 * Server-side progress, for signed-in learners.
 *
 * The localStorage store stays exactly as it is. This is a mirror, not a
 * replacement: a signed-out learner keeps working with no account, and signing
 * in later merges what they already did rather than discarding it. Nobody
 * should lose three lessons of work because they decided to register.
 */
import { randomUUID } from 'node:crypto';
import type { SkillMastery, Streak, TradeRecord } from '@/lib/progress/mastery';
import { processScore, runXp, type RunOutcome, type RunXp } from '@/lib/progress/mastery';
import { encouragement } from '@/lib/progress/encouragement';
import { TRADE_DISCIPLINE_GAMES } from '@/lib/games/catalogue';
import type { Db } from './driver';

export interface StoredLesson {
  lessonId: string;
  completedAt: number | null;
  attempts: number;
  bestScore: number;
  lastBlockIndex: number;
}

export interface StoredStats {
  /**
   * LESSON xp only.
   *
   * This is the field that round-trips to the browser store, and the browser
   * store only ever awards XP from checkpoints. Returning the combined total
   * here would be a slow-motion corruption: the client would receive it, treat
   * it as its own, and push it back on the next sync, folding game XP into
   * lesson XP a little more on every device swap.
   */
  xp: number;
  streak: Streak;
  lessonsDone: number;
  processScore: number;
  /** Server-owned totals, for display. Never written back by the client. */
  totals: RunTotals;
}

export interface Snapshot {
  lessons: StoredLesson[];
  mastery: SkillMastery[];
  stats: StoredStats;
}

/**
 * What a client SENDS. The same shape minus `totals`, because the totals are
 * server-owned — accumulated from recorded runs and never authored by a
 * browser. Splitting the type is what makes that unforgeable rather than a
 * convention somebody has to remember.
 */
export interface IncomingSnapshot {
  lessons: StoredLesson[];
  mastery: SkillMastery[];
  stats: Omit<StoredStats, 'totals'>;
}

interface LessonRow {
  lesson_id: string;
  completed_at: number | null;
  attempts: number;
  best_score: number;
  last_block: number;
}

interface MasteryRow {
  skill: string;
  strength: number;
  half_life_days: number;
  last_review_at: number;
  reviews: number;
}

interface StatsRow {
  lesson_xp: number;
  streak_current: number;
  streak_longest: number;
  last_active_at: number;
  lessons_done: number;
  process_score: number;
}

/**
 * SQLite integer columns can come back as bigint from the remote driver, where
 * node:sqlite hands back a number. Everything downstream does arithmetic, so
 * the boundary normalises rather than leaving each caller to discover it.
 */
const n = (v: unknown): number => Number(v ?? 0);

export async function loadSnapshot(db: Db, userId: string): Promise<Snapshot> {
  const lessons = (
    await db.all<LessonRow>(
      'SELECT lesson_id, completed_at, attempts, best_score, last_block FROM lesson_progress WHERE user_id = ?',
      userId,
    )
  ).map((r) => ({
    lessonId: r.lesson_id,
    completedAt: r.completed_at == null ? null : n(r.completed_at),
    attempts: n(r.attempts),
    bestScore: n(r.best_score),
    lastBlockIndex: n(r.last_block),
  }));

  const mastery = (
    await db.all<MasteryRow>(
      'SELECT skill, strength, half_life_days, last_review_at, reviews FROM skill_mastery WHERE user_id = ?',
      userId,
    )
  ).map((r) => ({
    skill: r.skill,
    strength: n(r.strength),
    halfLifeDays: n(r.half_life_days),
    lastReviewedAt: n(r.last_review_at),
    reviews: n(r.reviews),
  }));

  const s = await db.get<StatsRow>(
    'SELECT lesson_xp, streak_current, streak_longest, last_active_at, lessons_done, process_score FROM user_stats WHERE user_id = ?',
    userId,
  );

  return {
    lessons,
    mastery,
    stats: {
      xp: n(s?.lesson_xp),
      streak: {
        current: n(s?.streak_current),
        longest: n(s?.streak_longest),
        lastActiveAt: n(s?.last_active_at),
      },
      lessonsDone: n(s?.lessons_done),
      processScore: n(s?.process_score),
      totals: await loadTotals(db, userId),
    },
  };
}

const UPSERT_LESSON = `INSERT INTO lesson_progress (user_id, lesson_id, completed_at, attempts, best_score, last_block, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(user_id, lesson_id) DO UPDATE SET
     completed_at = COALESCE(MIN(COALESCE(excluded.completed_at, lesson_progress.completed_at),
                                 COALESCE(lesson_progress.completed_at, excluded.completed_at)), NULL),
     attempts   = MAX(lesson_progress.attempts, excluded.attempts),
     best_score = MAX(lesson_progress.best_score, excluded.best_score),
     last_block = MAX(lesson_progress.last_block, excluded.last_block),
     updated_at = excluded.updated_at`;

const UPSERT_MASTERY = `INSERT INTO skill_mastery (user_id, skill, strength, half_life_days, last_review_at, reviews)
   VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT(user_id, skill) DO UPDATE SET
     strength       = CASE WHEN excluded.last_review_at >= skill_mastery.last_review_at
                           THEN excluded.strength ELSE skill_mastery.strength END,
     half_life_days = MAX(skill_mastery.half_life_days, excluded.half_life_days),
     last_review_at = MAX(skill_mastery.last_review_at, excluded.last_review_at),
     reviews        = MAX(skill_mastery.reviews, excluded.reviews)`;

/**
 * Merges a client snapshot into the server's, taking the better of the two on
 * every field rather than letting the last writer win.
 *
 * This matters more than it looks. A learner who studies on a phone and a
 * laptop generates two divergent histories, and "last write wins" silently
 * throws one away. Merging by best-score and furthest-progress means the worst
 * case is that they keep an achievement twice, never that they lose one.
 */
export async function mergeSnapshot(db: Db, userId: string, incoming: IncomingSnapshot): Promise<Snapshot> {
  const now = Date.now();

  await db.tx(async (t) => {
    for (const l of incoming.lessons) {
      await t.run(UPSERT_LESSON, userId, l.lessonId, l.completedAt, l.attempts, l.bestScore, l.lastBlockIndex, now);
    }
    for (const m of incoming.mastery) {
      await t.run(UPSERT_MASTERY, userId, m.skill, m.strength, m.halfLifeDays, m.lastReviewedAt, m.reviews);
    }

    const done = n(
      (await t.get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM lesson_progress WHERE user_id = ? AND completed_at IS NOT NULL',
        userId,
      ))?.n,
    );

    // The client's XP is LESSON xp — the localStorage store only ever awards it
    // from checkpoints. It goes into lesson_xp, and syncTotalXp then rebuilds
    // the total. Writing it to `xp` directly, as this used to, would have let a
    // stale client wipe out game XP the server knew about and the phone did not.
    await t.run(
      `INSERT INTO user_stats (user_id, lesson_xp, streak_current, streak_longest, last_active_at, lessons_done, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         lesson_xp      = MAX(user_stats.lesson_xp, excluded.lesson_xp),
         streak_current = MAX(user_stats.streak_current, excluded.streak_current),
         streak_longest = MAX(user_stats.streak_longest, excluded.streak_longest),
         last_active_at = MAX(user_stats.last_active_at, excluded.last_active_at),
         lessons_done   = excluded.lessons_done,
         updated_at     = excluded.updated_at`,
      userId,
      incoming.stats.xp,
      incoming.stats.streak.current,
      incoming.stats.streak.longest,
      incoming.stats.streak.lastActiveAt,
      done,
      now,
    );
    await syncTotalXp(t, userId);
  });

  return loadSnapshot(db, userId);
}

export interface GameRunInput {
  game: string;
  accuracy?: number | null;
  pnl?: number | null;
  trades: TradeRecord[];
  /**
   * The learner's own account of what they were trying to do. Required for the
   * run to earn XP, and published to other learners when they have opted in.
   */
  reason?: string;
}

export interface RecordedRun {
  id: string;
  processScore: number;
  xpAwarded: number;
  meanRR: number | null;
  /** Every XP gate with its verdict, so the learner is told WHY, not just what. */
  notes: RunXp['notes'];
  outcome: RunOutcome;
  /** Set when the run earned nothing. Varied per run, stored so it is stable. */
  encouragement: string | null;
  /** The learner's totals after this run, so the client never has to refetch. */
  totals: RunTotals;
}

export interface RunTotals {
  xp: number;
  lessonXp: number;
  gameXp: number;
  netPnl: number;
  runs: number;
  wins: number;
  losses: number;
  bestProcess: number;
  processScore: number;
}

/**
 * Records a finished game run and refreshes the user's rolling process score.
 *
 * The individual TradeRecords are stored, not just the resulting number. If the
 * process scorer is ever changed — and it will be — every historical run can be
 * rescored instead of the leaderboard mixing two different definitions of the
 * same metric.
 */
export async function recordGameRun(
  db: Db,
  userId: string,
  input: GameRunInput,
  now = Date.now(),
): Promise<RecordedRun> {
  const scored = processScore(input.trades);
  const reason = (input.reason ?? '').trim();
  const earned = runXp(input.trades, reason, scored.score);
  const id = randomUUID();

  // The client may report a net P&L for a game whose accounting is richer than
  // a sum of trade records — Chart Replay includes charges, for instance. Where
  // it does not, the trades are the source of truth.
  const pnl = input.pnl ?? earned.outcome.netPnl;
  const outcome = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'flat';

  // Seeded on the run id, so this run always shows these words and the next one
  // shows different words. See encouragement.ts for why not Math.random().
  const message = earned.mood ? encouragement(earned.mood, id) : null;

  await db.tx(async (t) => {
    await t.run(
      `INSERT INTO game_runs (id, user_id, game, played_at, process_score, accuracy, pnl, trades, process_json,
                              reason, planned_rr, xp_awarded, outcome, stopped_out, winning_trades, losing_trades,
                              encouragement)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      userId,
      input.game,
      now,
      scored.score,
      input.accuracy ?? null,
      pnl,
      input.trades.length,
      JSON.stringify(input.trades),
      reason,
      earned.meanRR,
      earned.xp,
      outcome,
      earned.outcome.stoppedOut ? 1 : 0,
      earned.outcome.wins,
      earned.outcome.losses,
      message ?? '',
    );

    // Every run updates the running totals, win or lose — runs/wins/losses
    // here, same as always. `net_pnl` is NOT touched here: every cash-based
    // game banks its trades' realised P&L the instant each one closes (see
    // lib/db/gameFills.ts, POST /api/account/fill), well before a run ever
    // reaches this point, so adding `pnl` again here would double-count it.
    // Filing a run is about XP and the written reason now, not about money —
    // the money was already real the moment the trade closed.
    //
    // `game_xp` is separate from `lesson_xp` on purpose: game XP now carries an
    // outcome signal, and the leaderboard's knowledge component reads lesson_xp
    // only, so a profitable run cannot move a rank.
    await t.run(
      `INSERT INTO user_stats (user_id, game_xp, runs, wins, losses, best_process, updated_at)
       VALUES (?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         game_xp      = user_stats.game_xp + excluded.game_xp,
         runs         = user_stats.runs + 1,
         wins         = user_stats.wins + excluded.wins,
         losses       = user_stats.losses + excluded.losses,
         best_process = MAX(user_stats.best_process, excluded.best_process),
         updated_at   = excluded.updated_at`,
      userId,
      earned.xp,
      outcome === 'win' ? 1 : 0,
      outcome === 'loss' ? 1 : 0,
      scored.score,
      now,
    );

    await syncTotalXp(t, userId);
  });

  await refreshProcessScore(db, userId, now);

  return {
    id,
    processScore: scored.score,
    xpAwarded: earned.xp,
    meanRR: earned.meanRR,
    notes: earned.notes,
    outcome: { ...earned.outcome, netPnl: pnl, won: outcome === 'win' },
    encouragement: message,
    totals: await loadTotals(db, userId),
  };
}

/**
 * Keeps `xp` equal to `lesson_xp + game_xp`.
 *
 * The total is stored rather than computed on read because it is displayed in a
 * dozen places and read far more often than it is written. Kept in one function
 * so there is exactly one definition of what "XP" means.
 */
export async function syncTotalXp(db: Db, userId: string): Promise<void> {
  await db.run('UPDATE user_stats SET xp = lesson_xp + game_xp WHERE user_id = ?', userId);
}

interface TotalsRow {
  xp: number;
  lesson_xp: number;
  game_xp: number;
  net_pnl: number;
  runs: number;
  wins: number;
  losses: number;
  best_process: number;
  process_score: number;
}

/**
 * The learner's own filed runs, newest first.
 *
 * Exists for Edge or Luck, which asks the same statistical question of the
 * learner's record that it asks of the invented ones. Deliberately returns only
 * what that needs — when it happened, which game, and the P&L — rather than the
 * whole row: the process JSON is large, and nothing here should tempt a caller
 * into ranking anybody by profit (PLAN.md §7 rule 4).
 */
export interface FiledRun {
  game: string;
  playedAt: number;
  pnl: number;
}

export async function recentRunsForUser(db: Db, userId: string, limit = 200): Promise<FiledRun[]> {
  const rows = await db.all<{ game: string; played_at: number; pnl: number | null }>(
    `SELECT game, played_at, pnl FROM game_runs
      WHERE user_id = ? AND pnl IS NOT NULL
      ORDER BY played_at DESC
      LIMIT ?`,
    userId,
    // A cap rather than the lot: the statistics stop moving long before this,
    // and an unbounded query is a slow page waiting for a heavy user.
    Math.max(1, Math.min(limit, 500)),
  );
  return rows.map((r) => ({ game: r.game, playedAt: Number(r.played_at), pnl: Number(r.pnl) }));
}

export async function loadTotals(db: Db, userId: string): Promise<RunTotals> {
  const r = await db.get<TotalsRow>(
    `SELECT xp, lesson_xp, game_xp, net_pnl, runs, wins, losses, best_process, process_score
       FROM user_stats WHERE user_id = ?`,
    userId,
  );

  return {
    xp: n(r?.xp),
    lessonXp: n(r?.lesson_xp),
    gameXp: n(r?.game_xp),
    netPnl: n(r?.net_pnl),
    runs: n(r?.runs),
    wins: n(r?.wins),
    losses: n(r?.losses),
    bestProcess: n(r?.best_process),
    processScore: n(r?.process_score),
  };
}

/** Rolling average over the learner's most recent runs. Recent, so that
 *  improving actually shows up, and averaged, so one lucky run does not. */
export const PROCESS_WINDOW = 20;

export async function refreshProcessScore(db: Db, userId: string, now = Date.now()): Promise<number> {
  // Only games with a real trade-discipline story move this number — see
  // TRADE_DISCIPLINE_GAMES for why. A quiz game with nothing here would
  // otherwise pull the average toward zero for a dimension it never tested.
  const placeholders = TRADE_DISCIPLINE_GAMES.map(() => '?').join(', ');
  const rows = await db.all<{ process_score: number }>(
    `SELECT process_score FROM game_runs
      WHERE user_id = ? AND game IN (${placeholders})
      ORDER BY played_at DESC LIMIT ?`,
    userId,
    ...TRADE_DISCIPLINE_GAMES,
    PROCESS_WINDOW,
  );

  const score = rows.length === 0 ? 0 : rows.reduce((a, r) => a + n(r.process_score), 0) / rows.length;

  await db.run(
    `INSERT INTO user_stats (user_id, process_score, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET process_score = excluded.process_score, updated_at = excluded.updated_at`,
    userId,
    score,
    now,
  );

  return score;
}
