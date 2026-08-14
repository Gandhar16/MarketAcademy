import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { createUser } from './users';
import { loadTotals } from './progress';
import { loadGameFills, recordGameFill } from './gameFills';

let db: Db;
let userId: string;

beforeEach(async () => {
  db = await openTestDb();
  const r = await createUser(db, { email: 'a@b.com', displayName: 'Ann', password: 'a-long-enough-passphrase' });
  if (!r.ok) throw new Error(r.message);
  userId = r.value.id;
});

const fill = (over: Partial<Parameters<typeof recordGameFill>[2]> = {}) => ({
  id: 'f1',
  game: 'chart-replay',
  at: 1_700_000_000_000,
  pnl: 0,
  ...over,
});

describe('recordGameFill', () => {
  it('writes the fill and it can be read back', async () => {
    await recordGameFill(db, userId, fill({ pnl: -500 }));
    const fills = await loadGameFills(db, userId);
    expect(fills).toHaveLength(1);
    expect(fills[0]).toMatchObject({ id: 'f1', game: 'chart-replay', pnl: -500 });
  });

  it('banks a nonzero P&L into the shared account balance immediately', async () => {
    await recordGameFill(db, userId, fill({ id: 'a', pnl: 1_200 }));
    await recordGameFill(db, userId, fill({ id: 'b', pnl: -350 }));
    expect((await loadTotals(db, userId)).netPnl).toBe(850);
  });

  it('is idempotent on id: a retried write is not double-banked', async () => {
    const f = fill({ pnl: 500 });
    const first = await recordGameFill(db, userId, f);
    const second = await recordGameFill(db, userId, f);
    expect(first.recorded).toBe(true);
    expect(second.recorded).toBe(false);
    expect(await loadGameFills(db, userId)).toHaveLength(1);
    expect((await loadTotals(db, userId)).netPnl).toBe(500);
  });

  it('does not touch the balance for a zero-pnl fill', async () => {
    await recordGameFill(db, userId, fill({ pnl: 0 }));
    expect((await loadTotals(db, userId)).netPnl).toBe(0);
  });

  it('keeps two learners separate', async () => {
    const other = await createUser(db, { email: 'b@c.com', displayName: 'Bea', password: 'a-long-enough-passphrase' });
    if (!other.ok) throw new Error(other.message);
    await recordGameFill(db, userId, fill({ pnl: 900 }));
    expect(await loadGameFills(db, other.value.id)).toHaveLength(0);
    expect((await loadTotals(db, other.value.id)).netPnl).toBe(0);
  });
});

describe('loadGameFills', () => {
  it('returns fills oldest first', async () => {
    await recordGameFill(db, userId, fill({ id: 'later', at: 2_000 }));
    await recordGameFill(db, userId, fill({ id: 'earlier', at: 1_000 }));
    const fills = await loadGameFills(db, userId);
    expect(fills.map((f) => f.id)).toEqual(['earlier', 'later']);
  });
});
