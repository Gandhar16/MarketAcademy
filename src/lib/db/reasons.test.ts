import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { createUser, updateProfile } from './users';
import { recordGameRun } from './progress';
import { exemplaryReasons, reasonsByUser, recentReasons } from './reasons';
import { MIGRATED_COLUMNS, applyMigrations } from './migrate';
import type { TradeRecord } from '@/lib/progress/mastery';

const T0 = 1_770_000_000_000;
const REASON =
  'Entered on the retest because the level held twice before, and the stop sits below the swing low at 1,372.';

/** A well-run trade that paid — the shape that earns XP. */
function trade(over: Partial<TradeRecord> = {}): TradeRecord {
  return {
    preCommitted: true,
    riskFraction: 0.01,
    honouredStop: true,
    exitedPerPlan: true,
    sizedFromStop: true,
    pnl: 2_500,
    plannedRR: 2.5,
    stoppedOut: false,
    ...over,
  };
}

/** The same decisions, stopped out. Earns nothing, records everything. */
const stopped = (over: Partial<TradeRecord> = {}) => trade({ pnl: -1_000, stoppedOut: true, ...over });

/** scrypt at OWASP parameters is slow on purpose, so tests make few users. */
async function makeUser(db: Db, email: string, displayName: string): Promise<string> {
  const r = await createUser(db, { email, displayName, password: 'correct-horse-battery' });
  if (!r.ok) throw new Error(r.message);
  return r.value.id;
}

describe('additive migrations', () => {
  it('brings a database created before the columns existed up to date', async () => {
    const db = await openTestDb();
    // Simulate the old shape by dropping the added columns.
    await db.exec('DROP TABLE game_runs');
    await db.exec(`CREATE TABLE game_runs (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, game TEXT NOT NULL, played_at INTEGER NOT NULL,
      process_score REAL NOT NULL, accuracy REAL, pnl REAL, trades INTEGER NOT NULL DEFAULT 0,
      process_json TEXT NOT NULL DEFAULT '[]')`);

    // Only the game_runs additions are missing; user_stats is already current.
    expect(await applyMigrations(db)).toEqual(MIGRATED_COLUMNS.filter((c) => c.startsWith('game_runs.')));
    // Idempotent: running it again does nothing at all.
    expect(await applyMigrations(db)).toEqual([]);
  });

  it('is a no-op on a fresh database, so schema.ts and this file agree', async () => {
    // If a column were added here and forgotten in SCHEMA_SQL, this would
    // report it as newly applied instead of already present.
    expect(await applyMigrations(await openTestDb())).toEqual([]);
  });
});

describe('the reasoning feed', () => {
  let db: Db;
  let shown: string;
  let hidden: string;

  beforeEach(async () => {
    db = await openTestDb();
    shown = await makeUser(db, 'a@x.com', 'Asha');
    hidden = await makeUser(db, 'b@x.com', 'Bala');
    await updateProfile(db, shown, { leaderboardOptIn: true });
  });

  it('shows only learners who opted in', async () => {
    await recordGameRun(db, shown, { game: 'chart-replay', trades: [trade()], reason: REASON }, T0);
    await recordGameRun(db, hidden, { game: 'chart-replay', trades: [trade()], reason: REASON }, T0 + 1);

    const feed = await recentReasons(db);
    expect(feed.map((e) => e.displayName)).toEqual(['Asha']);
  });

  it('omits runs with no reason written', async () => {
    await recordGameRun(db, shown, { game: 'chart-replay', trades: [trade()] }, T0);
    expect(await recentReasons(db)).toHaveLength(0);
  });

  it('orders by time, not by score', async () => {
    // Newest-first shows what people are thinking today, including the runs
    // that went wrong. Best-first would show the same handful for weeks.
    await recordGameRun(db, shown, { game: 'chart-replay', trades: [trade()], reason: `${REASON} one` }, T0);
    await recordGameRun(
      db,
      shown,
      { game: 'chart-replay', trades: [trade({ preCommitted: false, sizedFromStop: false })], reason: `${REASON} two` },
      T0 + 5_000,
    );
    expect((await recentReasons(db)).map((e) => e.reason.endsWith('two'))).toEqual([true, false]);
  });

  it('filters to one game', async () => {
    await recordGameRun(db, shown, { game: 'chart-replay', trades: [trade()], reason: REASON }, T0);
    await recordGameRun(db, shown, { game: 'order-gauntlet', trades: [trade()], reason: REASON }, T0 + 1);
    expect((await recentReasons(db, 'order-gauntlet')).map((e) => e.game)).toEqual(['order-gauntlet']);
  });

  it('carries the planned reward-to-risk and the XP the run earned', async () => {
    await recordGameRun(db, shown, { game: 'chart-replay', trades: [trade({ plannedRR: 3 })], reason: REASON }, T0);
    const [e] = await recentReasons(db);
    expect(e.plannedRR).toBe(3);
    expect(e.xpAwarded).toBeGreaterThan(0);
    // P&L is carried so it can be shown, greyed and last — never ranked on.
    expect(e.pnl).toBe(2_500);
  });

  it('publishes a stopped-out run, and is honest that it earned nothing', async () => {
    // The most useful card on the page: careful reasoning, and a loss. It has
    // to be readable, and it has to be possible to see that it lost.
    const run = await recordGameRun(db, shown, { game: 'chart-replay', trades: [stopped()], reason: REASON }, T0);
    expect(run.xpAwarded).toBe(0);
    expect(run.encouragement).toBeTruthy();

    const [e] = await recentReasons(db);
    expect(e.reason).toBe(REASON);
    expect(e.xpAwarded).toBe(0);
    expect(e.pnl).toBe(-1_000);
    // The reasoning still met the bar even though the result did not.
    expect(e.plannedRR).toBe(2.5);
  });

  it('keeps failed runs in the recent feed but out of the exemplary one', async () => {
    // A run that earned nothing is often the more instructive card. It belongs
    // on the page; it does not belong under "cleared every gate".
    await recordGameRun(db, shown, { game: 'chart-replay', trades: [trade({ honouredStop: false })], reason: REASON }, T0);
    await recordGameRun(db, shown, { game: 'chart-replay', trades: [trade()], reason: `${REASON} good` }, T0 + 1);

    expect(await recentReasons(db)).toHaveLength(2);
    const good = await exemplaryReasons(db);
    expect(good).toHaveLength(1);
    expect(good[0].xpAwarded).toBeGreaterThan(0);
  });

  it("shows a learner their own reasoning whether or not they opted in", async () => {
    await recordGameRun(db, hidden, { game: 'chart-replay', trades: [trade()], reason: REASON }, T0);
    expect(await reasonsByUser(db, hidden)).toHaveLength(1);
    expect(await recentReasons(db)).toHaveLength(0);
  });
});

describe('XP awarded by a run reaches the account', () => {
  it('adds only for a run that cleared the gates, and never for profit alone', async () => {
    const db = await openTestDb();
    const id = await makeUser(db, 'c@x.com', 'Chitra');

    const gamble = await recordGameRun(
      db,
      id,
      { game: 'chart-replay', trades: [trade({ riskFraction: 0.4, pnl: 100_000 })], reason: REASON },
      T0,
    );
    expect(gamble.xpAwarded).toBe(0);
    // The stats row exists — refreshProcessScore writes it — and holds no XP.
    expect(await db.get('SELECT xp FROM user_stats WHERE user_id = ?', id)).toEqual({ xp: 0 });

    const good = await recordGameRun(db, id, { game: 'chart-replay', trades: [trade()], reason: REASON }, T0 + 1);
    expect(good.xpAwarded).toBeGreaterThan(0);
    expect(await db.get('SELECT xp FROM user_stats WHERE user_id = ?', id)).toEqual({ xp: good.xpAwarded });

    // And it accumulates rather than overwriting.
    const again = await recordGameRun(db, id, { game: 'chart-replay', trades: [trade()], reason: REASON }, T0 + 2);
    expect(await db.get('SELECT xp FROM user_stats WHERE user_id = ?', id)).toEqual({
      xp: good.xpAwarded + again.xpAwarded,
    });
  });
});
