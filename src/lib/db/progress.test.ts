import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { createUser } from './users';
import {
  PROCESS_WINDOW,
  loadSnapshot,
  mergeSnapshot,
  recordGameRun,
  type IncomingSnapshot,
  type Snapshot,
} from './progress';
import type { TradeRecord } from '@/lib/progress/mastery';

const T0 = 1_700_000_000_000;

const DISCIPLINED: TradeRecord = {
  preCommitted: true,
  riskFraction: 0.01,
  honouredStop: true,
  exitedPerPlan: true,
  sizedFromStop: true,
  pnl: -100,
};
const RECKLESS: TradeRecord = {
  preCommitted: false,
  riskFraction: 0.4,
  honouredStop: false,
  exitedPerPlan: false,
  sizedFromStop: false,
  pnl: 5_000,
};

let db: Db;
let userId: string;

beforeEach(async () => {
  db = await openTestDb();
  const r = await createUser(db, { email: 'a@b.com', displayName: 'Ann', password: 'a-long-enough-passphrase' });
  if (!r.ok) throw new Error(r.message);
  userId = r.value.id;
});

/** What a client SENDS: no server-owned totals. */
function snapshot(patch: Partial<IncomingSnapshot> = {}): IncomingSnapshot {
  return {
    lessons: [],
    mastery: [],
    stats: { xp: 0, streak: { current: 0, longest: 0, lastActiveAt: 0 }, lessonsDone: 0, processScore: 0 },
    ...patch,
  };
}

const NO_TOTALS = {
  xp: 0,
  lessonXp: 0,
  gameXp: 0,
  netPnl: 0,
  runs: 0,
  wins: 0,
  losses: 0,
  bestProcess: 0,
  processScore: 0,
};

/** What the server RETURNS: the same thing with the totals attached. */
function stored(patch: Partial<IncomingSnapshot> = {}): Snapshot {
  const s = snapshot(patch);
  return { ...s, stats: { ...s.stats, totals: NO_TOTALS } };
}

describe('snapshot merge', () => {
  it('starts empty', async () => {
    expect(await loadSnapshot(db, userId)).toEqual(stored());
  });

  it('stores what the client sends', async () => {
    const merged = await mergeSnapshot(
      db,
      userId,
      snapshot({
        lessons: [{ lessonId: 'l1', completedAt: T0, attempts: 2, bestScore: 80, lastBlockIndex: 5 }],
        stats: { xp: 120, streak: { current: 3, longest: 4, lastActiveAt: T0 }, lessonsDone: 1, processScore: 0 },
      }),
    );
    expect(merged.lessons[0]).toMatchObject({ lessonId: 'l1', bestScore: 80 });
    expect(merged.stats.xp).toBe(120);
  });

  it('keeps the better of two devices rather than the more recent', async () => {
    await mergeSnapshot(
      db,
      userId,
      snapshot({ lessons: [{ lessonId: 'l1', completedAt: T0, attempts: 3, bestScore: 90, lastBlockIndex: 9 }] }),
    );
    // A phone that is behind syncs afterwards. It must not undo the laptop.
    const merged = await mergeSnapshot(
      db,
      userId,
      snapshot({ lessons: [{ lessonId: 'l1', completedAt: null, attempts: 1, bestScore: 40, lastBlockIndex: 2 }] }),
    );
    expect(merged.lessons[0]).toMatchObject({ attempts: 3, bestScore: 90, lastBlockIndex: 9, completedAt: T0 });
  });

  it('keeps the earliest completion, because that is when it happened', async () => {
    await mergeSnapshot(
      db,
      userId,
      snapshot({ lessons: [{ lessonId: 'l1', completedAt: T0 + 5_000, attempts: 1, bestScore: 70, lastBlockIndex: 1 }] }),
    );
    const merged = await mergeSnapshot(
      db,
      userId,
      snapshot({ lessons: [{ lessonId: 'l1', completedAt: T0, attempts: 1, bestScore: 70, lastBlockIndex: 1 }] }),
    );
    expect(merged.lessons[0].completedAt).toBe(T0);
  });

  it('never lowers XP or a longest streak', async () => {
    await mergeSnapshot(
      db,
      userId,
      snapshot({ stats: { xp: 900, streak: { current: 7, longest: 12, lastActiveAt: T0 }, lessonsDone: 0, processScore: 0 } }),
    );
    const merged = await mergeSnapshot(
      db,
      userId,
      snapshot({ stats: { xp: 10, streak: { current: 1, longest: 1, lastActiveAt: T0 }, lessonsDone: 0, processScore: 0 } }),
    );
    expect(merged.stats.xp).toBe(900);
    expect(merged.stats.streak.longest).toBe(12);
  });

  it('counts completed lessons itself rather than believing the client', async () => {
    const merged = await mergeSnapshot(
      db,
      userId,
      snapshot({
        lessons: [
          { lessonId: 'l1', completedAt: T0, attempts: 1, bestScore: 100, lastBlockIndex: 1 },
          { lessonId: 'l2', completedAt: null, attempts: 1, bestScore: 20, lastBlockIndex: 1 },
        ],
        stats: { xp: 0, streak: { current: 0, longest: 0, lastActiveAt: 0 }, lessonsDone: 99, processScore: 0 },
      }),
    );
    expect(merged.stats.lessonsDone).toBe(1);
  });

  it('takes the more recent mastery strength but the longer half-life', async () => {
    await mergeSnapshot(
      db,
      userId,
      snapshot({ mastery: [{ skill: 'sizing', strength: 0.9, halfLifeDays: 20, lastReviewedAt: T0 + 1000, reviews: 4 }] }),
    );
    const merged = await mergeSnapshot(
      db,
      userId,
      snapshot({ mastery: [{ skill: 'sizing', strength: 0.2, halfLifeDays: 3, lastReviewedAt: T0, reviews: 1 }] }),
    );
    expect(merged.mastery[0]).toMatchObject({ strength: 0.9, halfLifeDays: 20, reviews: 4 });
  });

  it('is idempotent — syncing the same snapshot twice changes nothing', async () => {
    const s = snapshot({
      lessons: [{ lessonId: 'l1', completedAt: T0, attempts: 2, bestScore: 75, lastBlockIndex: 4 }],
      stats: { xp: 300, streak: { current: 2, longest: 5, lastActiveAt: T0 }, lessonsDone: 1, processScore: 0 },
    });
    const once = await mergeSnapshot(db, userId, s);
    const twice = await mergeSnapshot(db, userId, s);
    expect(twice).toEqual(once);
  });

  it('leaves the database untouched when a merge fails partway', async () => {
    await mergeSnapshot(db, userId, snapshot({ lessons: [{ lessonId: 'l1', completedAt: T0, attempts: 1, bestScore: 50, lastBlockIndex: 1 }] }));
    const before = await loadSnapshot(db, userId);

    await expect(
      mergeSnapshot(db, userId, {
        lessons: [
          { lessonId: 'l2', completedAt: null, attempts: 1, bestScore: 60, lastBlockIndex: 1 },
          // A lesson id of the wrong type reaches the driver and is rejected.
          { lessonId: { bad: true } as unknown as string, completedAt: null, attempts: 1, bestScore: 1, lastBlockIndex: 0 },
        ],
        mastery: [],
        stats: { xp: 5_000, streak: { current: 0, longest: 0, lastActiveAt: 0 }, lessonsDone: 0, processScore: 0 },
      }),
    ).rejects.toThrow();

    expect(await loadSnapshot(db, userId)).toEqual(before);
  });
});

describe('game runs', () => {
  it('scores a run from the trades, not from anything the client claims', async () => {
    const disciplined = await recordGameRun(db, userId, { game: 'chart-replay', trades: [DISCIPLINED] }, T0);
    const reckless = await recordGameRun(db, userId, { game: 'chart-replay', trades: [RECKLESS] }, T0 + 1);
    expect(disciplined.processScore).toBeGreaterThan(reckless.processScore);
  });

  it('sums P&L when it is not supplied', async () => {
    await recordGameRun(db, userId, { game: 'chart-replay', trades: [DISCIPLINED, DISCIPLINED] }, T0);
    expect(await db.get('SELECT pnl FROM game_runs')).toEqual({ pnl: -200 });
  });

  it('keeps the raw trades so old runs can be rescored', async () => {
    await recordGameRun(db, userId, { game: 'chart-replay', trades: [DISCIPLINED] }, T0);
    const row = await db.get('SELECT process_json FROM game_runs') as { process_json: string };
    expect(JSON.parse(row.process_json)[0]).toMatchObject({ honouredStop: true });
  });

  it('averages only the recent window, so improvement actually shows', async () => {
    for (let i = 0; i < PROCESS_WINDOW; i++) {
      await recordGameRun(db, userId, { game: 'chart-replay', trades: [RECKLESS] }, T0 + i);
    }
    const bad = (await db.get('SELECT process_score FROM user_stats WHERE user_id = ?', userId) as { process_score: number })
      .process_score;

    for (let i = 0; i < PROCESS_WINDOW; i++) {
      await recordGameRun(db, userId, { game: 'chart-replay', trades: [DISCIPLINED] }, T0 + PROCESS_WINDOW + i);
    }
    const good = (await db.get('SELECT process_score FROM user_stats WHERE user_id = ?', userId) as { process_score: number })
      .process_score;

    expect(good).toBeGreaterThan(bad);
    // The old runs are gone from the average entirely, not merely outweighed.
    expect(good).toBeGreaterThan(90);
  });

  it('does not let one good run outweigh a long bad record', async () => {
    for (let i = 0; i < 10; i++) await recordGameRun(db, userId, { game: 'chart-replay', trades: [RECKLESS] }, T0 + i);
    await recordGameRun(db, userId, { game: 'chart-replay', trades: [DISCIPLINED] }, T0 + 100);
    const score = (await db.get('SELECT process_score FROM user_stats WHERE user_id = ?', userId) as { process_score: number })
      .process_score;
    expect(score).toBeLessThan(50);
  });

  it('does not let a non-trade-discipline game move the global process score', async () => {
    // A quiz game submitting the worst possible trade-discipline fields —
    // which it must, having no stop or thesis of its own to report.
    await recordGameRun(db, userId, { game: 'order-gauntlet', trades: [RECKLESS] }, T0);
    const score = (await db.get('SELECT process_score FROM user_stats WHERE user_id = ?', userId) as { process_score: number })
      .process_score;
    expect(score).toBe(0);
  });

  it('keeps a trade-discipline game unaffected by non-trade-discipline runs mixed in around it', async () => {
    const chartReplay = await recordGameRun(db, userId, { game: 'chart-replay', trades: [DISCIPLINED] }, T0);
    await recordGameRun(db, userId, { game: 'order-gauntlet', trades: [RECKLESS] }, T0 + 1);
    await recordGameRun(db, userId, { game: 'bias-buster', trades: [RECKLESS] }, T0 + 2);
    const score = (await db.get('SELECT process_score FROM user_stats WHERE user_id = ?', userId) as { process_score: number })
      .process_score;
    // Only the one chart-replay run counts, so the average IS that run's own score.
    expect(score).toBeCloseTo(chartReplay.processScore, 6);
  });
});

describe('what a run records', () => {
  const REASON = 'Took the retest of the level that held twice, stop under the swing low, target the prior high.';
  const WIN: TradeRecord = { ...DISCIPLINED, pnl: 2_500, plannedRR: 2.5, stoppedOut: false };
  const STOPPED: TradeRecord = { ...DISCIPLINED, pnl: -1_000, plannedRR: 2.5, stoppedOut: true };

  it('stores the whole picture, not just a score', async () => {
    await recordGameRun(db, userId, { game: 'chart-replay', trades: [WIN, STOPPED], reason: REASON }, T0);
    const row = (await db.get(
      'SELECT outcome, stopped_out, winning_trades, losing_trades, planned_rr, reason, xp_awarded FROM game_runs',
    )) as Record<string, unknown>;

    expect(row).toMatchObject({
      outcome: 'win',
      stopped_out: 1,
      winning_trades: 1,
      losing_trades: 1,
      planned_rr: 2.5,
      reason: REASON,
    });
    expect(row.xp_awarded as number).toBeGreaterThan(0);
  });

  it('keeps the P&L whichever way it went', async () => {
    // A scoreboard that only accumulated the good runs would be the same lie as
    // a broker's marketing page.
    await recordGameRun(db, userId, { game: 'chart-replay', trades: [WIN], reason: REASON }, T0);
    await recordGameRun(db, userId, { game: 'chart-replay', trades: [STOPPED], reason: REASON }, T0 + 1);

    const { totals } = await recordGameRun(db, userId, { game: 'chart-replay', trades: [STOPPED], reason: REASON }, T0 + 2);
    expect(totals.netPnl).toBe(2_500 - 1_000 - 1_000);
    expect(totals).toMatchObject({ runs: 3, wins: 1, losses: 2 });
  });

  it('awards XP for the win and nothing for the stop-outs', async () => {
    const win = await recordGameRun(db, userId, { game: 'chart-replay', trades: [WIN], reason: REASON }, T0);
    const loss = await recordGameRun(db, userId, { game: 'chart-replay', trades: [STOPPED], reason: REASON }, T0 + 1);

    expect(win.xpAwarded).toBeGreaterThan(0);
    expect(win.encouragement).toBeNull();
    expect(loss.xpAwarded).toBe(0);
    expect(loss.encouragement).toBeTruthy();
    expect(loss.totals.gameXp).toBe(win.xpAwarded);
  });

  it('stores the encouragement so re-reading a run does not reshuffle it', async () => {
    const run = await recordGameRun(db, userId, { game: 'chart-replay', trades: [STOPPED], reason: REASON }, T0);
    const stored = (await db.get('SELECT encouragement FROM game_runs WHERE id = ?', run.id) as {
      encouragement: string;
    }).encouragement;
    expect(stored).toBe(run.encouragement);
  });

  it('varies the encouragement between runs', async () => {
    const messages = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const run = await recordGameRun(db, userId, { game: 'chart-replay', trades: [STOPPED], reason: REASON }, T0 + i);
      messages.add(run.encouragement!);
    }
    expect(messages.size).toBeGreaterThan(1);
  });

  it('keeps total XP equal to lesson XP plus game XP', async () => {
    await mergeSnapshot(db, userId, snapshot({ stats: { xp: 300, streak: { current: 1, longest: 1, lastActiveAt: T0 }, lessonsDone: 2, processScore: 0 } }));
    const run = await recordGameRun(db, userId, { game: 'chart-replay', trades: [WIN], reason: REASON }, T0);

    expect(run.totals.lessonXp).toBe(300);
    expect(run.totals.gameXp).toBe(run.xpAwarded);
    expect(run.totals.xp).toBe(300 + run.xpAwarded);
  });

  it('never lets a syncing client overwrite game XP it does not know about', async () => {
    // The bug this prevents: a phone that has never played pushes its lesson XP,
    // and the account silently loses every XP earned from a game on the laptop.
    const run = await recordGameRun(db, userId, { game: 'chart-replay', trades: [WIN], reason: REASON }, T0);
    await mergeSnapshot(db, userId, snapshot({ stats: { xp: 50, streak: { current: 0, longest: 0, lastActiveAt: 0 }, lessonsDone: 0, processScore: 0 } }));

    const after = await loadSnapshot(db, userId);
    expect(after.stats.totals.gameXp).toBe(run.xpAwarded);
    // And the client only ever gets its OWN xp back, never the combined total.
    expect(after.stats.xp).toBe(50);
  });
});
