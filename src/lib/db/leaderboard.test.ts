import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { createUser, updateProfile } from './users';
import { recordGameRun } from './progress';
import {
  MIN_RUNS_FOR_DISCIPLINE,
  consistencyScore,
  gameLeaderboard,
  gameRankOf,
  knowledgeScore,
  leaderboard,
  leaderboardInputs,
  overallScore,
  rankOf,
} from './leaderboard';
import type { TradeRecord } from '@/lib/progress/mastery';

const DISCIPLINED: TradeRecord = {
  preCommitted: true,
  riskFraction: 0.01,
  honouredStop: true,
  exitedPerPlan: true,
  sizedFromStop: true,
  pnl: -1_200,
};

const RECKLESS: TradeRecord = {
  preCommitted: false,
  riskFraction: 0.35,
  honouredStop: false,
  exitedPerPlan: false,
  sizedFromStop: false,
  pnl: 90_000,
};

let db: Db;
beforeEach(async () => {
  db = await openTestDb();
});

async function member(name: string, opts: { xp?: number; streak?: number } = {}) {
  const r = await createUser(db, {
    email: `${name}@example.com`,
    displayName: name,
    password: 'a-long-enough-passphrase',
    leaderboardOptIn: true,
  });
  if (!r.ok) throw new Error(r.message);
  // lesson_xp, because that is what the knowledge component reads. Game XP is
  // deliberately excluded from ranking — it now requires a winning run, and a
  // board that read it would be ranking on P&L with extra steps.
  await db.run('UPDATE user_stats SET lesson_xp = ?, xp = ?, streak_longest = ? WHERE user_id = ?', 
    opts.xp ?? 0,
    opts.xp ?? 0,
    opts.streak ?? 0,
    r.value.id,
  );
  return r.value;
}

async function play(userId: string, trade: TradeRecord, runs = MIN_RUNS_FOR_DISCIPLINE, game = 'chart-replay') {
  for (let i = 0; i < runs; i++) {
    await recordGameRun(db, userId, { game, trades: [trade] }, 1_700_000_000_000 + i * 1000);
  }
}

describe('the leaderboard ranks process, not profit', () => {
  it('places a disciplined loser above a reckless winner', async () => {
    const careful = await member('Careful');
    const reckless = await member('Reckless');
    await play(careful.id, DISCIPLINED);
    await play(reckless.id, RECKLESS);

    const board = await leaderboard(db, 'discipline');
    expect(board[0].displayName).toBe('Careful');
    // And the board is honest about it: the winner is down money.
    expect(board[0].netPnl).toBeLessThan(0);
    expect(board[1].netPnl).toBeGreaterThan(0);
  });

  it('does not move anyone when P&L changes and behaviour does not', async () => {
    const a = await member('Alpha', { xp: 500, streak: 10 });
    const b = await member('Beta', { xp: 400, streak: 8 });
    await play(a.id, DISCIPLINED);
    await play(b.id, DISCIPLINED);

    const before = (await leaderboard(db)).map((e) => ({ name: e.displayName, rank: e.rank, score: e.score }));

    // Multiply every recorded P&L by a hundred. Nothing about how these trades
    // were taken has changed, so nothing about the ranking may change either.
    await db.run('UPDATE game_runs SET pnl = pnl * 100', );

    const after = (await leaderboard(db)).map((e) => ({ name: e.displayName, rank: e.rank, score: e.score }));
    expect(after).toEqual(before);
  });

  it('does not move anyone when game XP is earned from winning', async () => {
    // The route by which P&L nearly walked back in. Game XP now requires a
    // winning run, so it carries an outcome signal; if the knowledge component
    // read total XP, winning would buy rank. It reads lesson_xp instead.
    const a = await member('Alpha', { xp: 500, streak: 10 });
    const b = await member('Beta', { xp: 400, streak: 8 });
    await play(a.id, DISCIPLINED);
    await play(b.id, DISCIPLINED);

    const before = (await leaderboard(db)).map((e) => ({ name: e.displayName, rank: e.rank, score: e.score }));

    const winner: TradeRecord = { ...DISCIPLINED, pnl: 50_000, plannedRR: 4, stoppedOut: false };
    for (let i = 0; i < 10; i++) {
      await recordGameRun(
        db,
        a.id,
        {
          game: 'chart-replay',
          trades: [winner],
          reason: 'Took the retest with the stop under the swing low and the target at the prior high.',
        },
        1_800_000_000_000 + i * 1000,
      );
    }

    // Alpha has banked real game XP.
    const gameXp = (await db.get('SELECT game_xp FROM user_stats WHERE user_id = ?', a.id) as { game_xp: number })
      .game_xp;
    expect(gameXp).toBeGreaterThan(0);

    // And the board has not noticed, because it is not allowed to.
    const after = (await leaderboard(db)).map((e) => ({ name: e.displayName, rank: e.rank, score: e.score }));
    expect(after).toEqual(before);
  });

  it('lists its ranking inputs, and P&L is not among them', async () => {
    expect(leaderboardInputs()).not.toContain('pnl');
    expect(leaderboardInputs()).toContain('processScore');
  });

  it('keeps no index that would make ranking by P&L cheap', async () => {
    const indexes = (await db.all("SELECT sql FROM sqlite_master WHERE type = 'index'") as { sql: string | null }[])
      .map((r) => r.sql ?? '')
      .join(' ')
      .toLowerCase();
    expect(indexes).not.toContain('pnl');
  });
});

describe('membership', () => {
  it('excludes anyone who has not opted in', async () => {
    const shy = await createUser(db, {
      email: 'shy@example.com',
      displayName: 'Shy',
      password: 'a-long-enough-passphrase',
    });
    if (!shy.ok) throw new Error(shy.message);
    await play(shy.value.id, DISCIPLINED);

    expect(await leaderboard(db)).toHaveLength(0);
    expect(await rankOf(db, shy.value.id)).toBeNull();
  });

  it('adds them the moment they opt in, and removes them when they opt out', async () => {
    const user = await member('OnOff');
    expect(await leaderboard(db)).toHaveLength(1);
    await updateProfile(db, user.id, { leaderboardOptIn: false });
    expect(await leaderboard(db)).toHaveLength(0);
  });
});

describe('scoring', () => {
  it('discounts a discipline score earned on too few runs', async () => {
    const proven = await member('Proven');
    const novice = await member('Novice');
    await play(proven.id, DISCIPLINED, MIN_RUNS_FOR_DISCIPLINE);
    await play(novice.id, DISCIPLINED, 1);

    const board = await leaderboard(db, 'discipline');
    expect(board[0].displayName).toBe('Proven');
    // The novice is still on the board — discounted, not excluded.
    expect(board[1].displayName).toBe('Novice');
    expect(board[1].discipline).toBeGreaterThan(0);
  });

  it('scales XP logarithmically so grinding cannot dominate', async () => {
    const first = knowledgeScore(1_000) - knowledgeScore(0);
    const later = knowledgeScore(11_000) - knowledgeScore(10_000);
    expect(first).toBeGreaterThan(later * 5);
  });

  it('caps both XP and streak contributions', async () => {
    expect(knowledgeScore(1_000_000)).toBeLessThanOrEqual(100);
    expect(consistencyScore(10_000)).toBe(100);
  });

  it('gives a perfect learner exactly 100', async () => {
    expect(overallScore({ processScore: 100, xp: 1e9, longestStreak: 999, runs: 99 })).toBeCloseTo(100, 6);
  });

  it('gives someone who has done nothing exactly 0', async () => {
    expect(overallScore({ processScore: 0, xp: 0, longestStreak: 0, runs: 0 })).toBe(0);
  });

  it('weights discipline above knowledge', async () => {
    const disciplined = await member('Doer', { xp: 0 });
    await member('Reader', { xp: 20_000 });
    await play(disciplined.id, DISCIPLINED);

    // The reader has maxed the knowledge component and done nothing else; the
    // doer has proved discipline and read nothing. Discipline wins.
    const board = await leaderboard(db, 'overall');
    expect(board[0].displayName).toBe('Doer');
    expect(board[1].knowledge).toBeCloseTo(100, 0);
  });
});

describe('presentation', () => {
  it('shares a rank on a tie and skips the next one', async () => {
    await member('Ann', { xp: 100, streak: 5 });
    await member('Bob', { xp: 100, streak: 5 });
    await member('Cid', { xp: 10, streak: 1 });

    const board = await leaderboard(db);
    expect(board.map((e) => e.rank)).toEqual([1, 1, 3]);
  });

  it('breaks a tie by name so the order is stable between requests', async () => {
    await member('Zed', { xp: 100 });
    await member('Ann', { xp: 100 });
    expect((await leaderboard(db)).map((e) => e.displayName)).toEqual(['Ann', 'Zed']);
    expect((await leaderboard(db)).map((e) => e.displayName)).toEqual(['Ann', 'Zed']);
  });

  it('tells a learner their rank even when they are off the visible page', async () => {
    const me = await member('Me', { xp: 1 });
    for (let i = 0; i < 5; i++) await member(`Other${i}`, { xp: 1_000 + i });
    expect(await leaderboard(db, 'overall', 3)).toHaveLength(3);
    expect((await rankOf(db, me.id))?.rank).toBe(6);
  });
});

describe('per-game board', () => {
  it('ranks by average process score and hides provisional players', async () => {
    const steady = await member('Steady');
    const oneOff = await member('OneOff');
    await play(steady.id, DISCIPLINED, MIN_RUNS_FOR_DISCIPLINE);
    await play(oneOff.id, DISCIPLINED, 1);

    const board = await gameLeaderboard(db, 'chart-replay');
    expect(board.map((e) => e.displayName)).toEqual(['Steady']);
  });

  it('keeps games separate', async () => {
    const user = await member('Player');
    await play(user.id, DISCIPLINED, MIN_RUNS_FOR_DISCIPLINE, 'chart-replay');
    expect(await gameLeaderboard(db, 'chart-replay')).toHaveLength(1);
    expect(await gameLeaderboard(db, 'cost-cutter')).toHaveLength(0);
  });

  it('carries the userId, so a caller can tell which row is "you"', async () => {
    const user = await member('Player');
    await play(user.id, DISCIPLINED, MIN_RUNS_FOR_DISCIPLINE, 'chart-replay');
    const board = await gameLeaderboard(db, 'chart-replay');
    expect(board[0].userId).toBe(user.id);
  });

  it('sums pnl across every run of that game, for the P&L column', async () => {
    const user = await member('Player');
    await play(user.id, DISCIPLINED, MIN_RUNS_FOR_DISCIPLINE, 'chart-replay');
    const board = await gameLeaderboard(db, 'chart-replay');
    expect(board[0].netPnl).toBe(DISCIPLINED.pnl * MIN_RUNS_FOR_DISCIPLINE);
  });
});

describe('gameRankOf', () => {
  it('finds a learner even below the visible page size', async () => {
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        member(`P${i}`).then(async (u) => {
          await play(u.id, DISCIPLINED, MIN_RUNS_FOR_DISCIPLINE, 'chart-replay');
        }),
      ),
    );

    // Ask for a page smaller than the field, so at least one player is off it.
    const page = await gameLeaderboard(db, 'chart-replay', 2);
    expect(page).toHaveLength(2);
    const full = await gameLeaderboard(db, 'chart-replay', Number.MAX_SAFE_INTEGER);
    expect(full).toHaveLength(5);

    // Every trade here is identical, so ties are broken by whatever the SQL
    // gives — not asserted here, only that gameRankOf agrees with the
    // unpaginated board about who is at the bottom.
    const lastOnBoard = full[full.length - 1];
    const found = await gameRankOf(db, lastOnBoard.userId, 'chart-replay');
    expect(found?.userId).toBe(lastOnBoard.userId);
    expect(found?.rank).toBe(5);
    expect(page.some((e) => e.userId === lastOnBoard.userId)).toBe(false);
  });

  it('is null for a learner with no runs on that game', async () => {
    const user = await member('Spectator');
    expect(await gameRankOf(db, user.id, 'chart-replay')).toBeNull();
  });
});
