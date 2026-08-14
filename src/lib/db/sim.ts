/**
 * The simulator's persisted fills.
 *
 * The simulator's live state (positions, resting orders, quotes) is otherwise
 * memory-only — see lib/sim/reducer.ts. What is written here is the one thing
 * that must never be silently lost: every fill that actually executed. On
 * load, the client fetches these and replays them through the same fill logic
 * that produced them, which reconstructs cash, positions, and the blotter
 * exactly — there is no separate "saved state" to drift from the reducer.
 */
import type { Db } from './driver';
import type { Product } from '../engine/costs/types';

export interface SimFillInput {
  id: string;
  at: number;
  symbol: string;
  product: Product;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  /** Realised P&L from this fill, net of charges. Zero for a fill that only opened or added to a position. */
  realised: number;
}

export type SimFillRow = SimFillInput;

const n = (v: unknown): number => Number(v ?? 0);

/**
 * Records one fill, and banks its realised P&L into the shared account
 * balance in the same transaction.
 *
 * Idempotent on `id`: a fill already on file is left exactly as it is and its
 * P&L is not banked a second time, so a retried request from a flaky
 * connection cannot double-count.
 */
export async function recordSimFill(db: Db, userId: string, fill: SimFillInput): Promise<{ recorded: boolean }> {
  return db.tx(async (t) => {
    const existing = await t.get<{ id: string }>('SELECT id FROM sim_fills WHERE id = ?', fill.id);
    if (existing) return { recorded: false };

    await t.run(
      `INSERT INTO sim_fills (id, user_id, at, symbol, product, side, quantity, price, realised)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      fill.id,
      userId,
      fill.at,
      fill.symbol,
      fill.product,
      fill.side,
      fill.quantity,
      fill.price,
      fill.realised,
    );

    if (fill.realised !== 0) {
      await t.run(
        `INSERT INTO user_stats (user_id, net_pnl, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           net_pnl    = user_stats.net_pnl + excluded.net_pnl,
           updated_at = excluded.updated_at`,
        userId,
        fill.realised,
        Date.now(),
      );
    }

    return { recorded: true };
  });
}

/**
 * Deletes every fill this learner's simulator has executed, and reverses
 * their combined effect on the shared account balance — "reset the
 * simulator" should not leave a P&L trail behind on an account it no longer
 * has any fills to show for.
 */
export async function clearSimFills(db: Db, userId: string): Promise<void> {
  await db.tx(async (t) => {
    const total = await t.get<{ total: number }>(
      'SELECT COALESCE(SUM(realised), 0) AS total FROM sim_fills WHERE user_id = ?',
      userId,
    );
    await t.run('DELETE FROM sim_fills WHERE user_id = ?', userId);
    const reversal = -n(total?.total);
    if (reversal !== 0) {
      await t.run(
        `INSERT INTO user_stats (user_id, net_pnl, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           net_pnl    = user_stats.net_pnl + excluded.net_pnl,
           updated_at = excluded.updated_at`,
        userId,
        reversal,
        Date.now(),
      );
    }
  });
}

/** Every fill this learner's simulator has executed, oldest first — the replay order. */
export async function loadSimFills(db: Db, userId: string): Promise<SimFillRow[]> {
  const rows = await db.all<{
    id: string;
    at: number;
    symbol: string;
    product: string;
    side: string;
    quantity: number;
    price: number;
    realised: number;
  }>(
    'SELECT id, at, symbol, product, side, quantity, price, realised FROM sim_fills WHERE user_id = ? ORDER BY at ASC',
    userId,
  );

  return rows.map((r) => ({
    id: r.id,
    at: n(r.at),
    symbol: r.symbol,
    product: r.product as Product,
    side: r.side as 'buy' | 'sell',
    quantity: n(r.quantity),
    price: n(r.price),
    realised: n(r.realised),
  }));
}
