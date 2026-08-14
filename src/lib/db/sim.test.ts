import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './driver';
import { openTestDb } from './index';
import { createUser } from './users';
import { loadTotals } from './progress';
import { clearSimFills, loadSimFills, recordSimFill } from './sim';

let db: Db;
let userId: string;

beforeEach(async () => {
  db = await openTestDb();
  const r = await createUser(db, { email: 'a@b.com', displayName: 'Ann', password: 'a-long-enough-passphrase' });
  if (!r.ok) throw new Error(r.message);
  userId = r.value.id;
});

const fill = (over: Partial<Parameters<typeof recordSimFill>[2]> = {}) => ({
  id: 'f1',
  at: 1_700_000_000_000,
  symbol: 'RELIANCE.NS',
  product: 'intraday' as const,
  side: 'buy' as const,
  quantity: 10,
  price: 1_400,
  realised: 0,
  ...over,
});

describe('recordSimFill', () => {
  it('writes the fill and it can be read back', async () => {
    await recordSimFill(db, userId, fill());
    const fills = await loadSimFills(db, userId);
    expect(fills).toHaveLength(1);
    expect(fills[0]).toMatchObject({ id: 'f1', symbol: 'RELIANCE.NS', quantity: 10, price: 1_400 });
  });

  it('banks a nonzero realised P&L into the shared account balance', async () => {
    await recordSimFill(db, userId, fill({ id: 'open', realised: 0 }));
    await recordSimFill(db, userId, fill({ id: 'close', side: 'sell', realised: -350 }));
    const totals = await loadTotals(db, userId);
    expect(totals.netPnl).toBe(-350);
  });

  it('is idempotent on id: a retried write is not double-banked', async () => {
    const f = fill({ realised: 500 });
    const first = await recordSimFill(db, userId, f);
    const second = await recordSimFill(db, userId, f);
    expect(first.recorded).toBe(true);
    expect(second.recorded).toBe(false);
    expect((await loadSimFills(db, userId))).toHaveLength(1);
    expect((await loadTotals(db, userId)).netPnl).toBe(500);
  });

  it('keeps two learners separate', async () => {
    const other = await createUser(db, { email: 'b@c.com', displayName: 'Bea', password: 'a-long-enough-passphrase' });
    if (!other.ok) throw new Error(other.message);
    await recordSimFill(db, userId, fill());
    expect(await loadSimFills(db, other.value.id)).toHaveLength(0);
  });
});

describe('loadSimFills', () => {
  it('returns fills oldest first, the replay order', async () => {
    await recordSimFill(db, userId, fill({ id: 'later', at: 2_000 }));
    await recordSimFill(db, userId, fill({ id: 'earlier', at: 1_000 }));
    const fills = await loadSimFills(db, userId);
    expect(fills.map((f) => f.id)).toEqual(['earlier', 'later']);
  });
});

describe('clearSimFills', () => {
  it('deletes every fill and reverses their combined P&L off the account', async () => {
    await recordSimFill(db, userId, fill({ id: 'a', realised: 500 }));
    await recordSimFill(db, userId, fill({ id: 'b', realised: -200 }));
    await clearSimFills(db, userId);
    expect(await loadSimFills(db, userId)).toHaveLength(0);
    expect((await loadTotals(db, userId)).netPnl).toBe(0);
  });

  it('leaves P&L banked from elsewhere (e.g. a game run) untouched', async () => {
    await db.run(
      `INSERT INTO user_stats (user_id, net_pnl, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET net_pnl = excluded.net_pnl`,
      userId,
      1_000,
      Date.now(),
    );
    await recordSimFill(db, userId, fill({ realised: 500 }));
    await clearSimFills(db, userId);
    expect((await loadTotals(db, userId)).netPnl).toBe(1_000);
  });
});
