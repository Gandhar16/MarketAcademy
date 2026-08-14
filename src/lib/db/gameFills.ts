/**
 * Real-time P&L banking for cash-based games.
 *
 * A game's own local state (equity, blotter, whatever) is a rehearsal space —
 * it can be reset, replayed, restarted. The one number that must never be
 * fictional is the shared account balance the header shows, and it has to be
 * true the instant a trade closes, not after a learner finishes a whole
 * session, writes a reason, and clicks "file this run". This is that path:
 * see recordGameFill in the API route at /api/account/fill, called from each
 * game's engine the moment a position/round actually closes.
 */
import type { Db } from './driver';

export interface GameFillInput {
  id: string;
  game: string;
  at: number;
  pnl: number;
}

const n = (v: unknown): number => Number(v ?? 0);

/**
 * Records one closed trade's realised P&L, and banks it into the shared
 * account balance in the same transaction.
 *
 * Idempotent on `id`: a fill already on file is left exactly as it is and its
 * P&L is not banked a second time, so a retried request from a flaky
 * connection cannot double-count.
 */
export async function recordGameFill(db: Db, userId: string, fill: GameFillInput): Promise<{ recorded: boolean }> {
  return db.tx(async (t) => {
    const existing = await t.get<{ id: string }>('SELECT id FROM game_fills WHERE id = ?', fill.id);
    if (existing) return { recorded: false };

    await t.run(
      `INSERT INTO game_fills (id, user_id, game, at, pnl) VALUES (?, ?, ?, ?, ?)`,
      fill.id,
      userId,
      fill.game,
      fill.at,
      fill.pnl,
    );

    if (fill.pnl !== 0) {
      await t.run(
        `INSERT INTO user_stats (user_id, net_pnl, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           net_pnl    = user_stats.net_pnl + excluded.net_pnl,
           updated_at = excluded.updated_at`,
        userId,
        fill.pnl,
        Date.now(),
      );
    }

    return { recorded: true };
  });
}

/** Every trade this learner has banked across every cash-based game, oldest first. */
export async function loadGameFills(db: Db, userId: string): Promise<GameFillInput[]> {
  const rows = await db.all<{ id: string; game: string; at: number; pnl: number }>(
    'SELECT id, game, at, pnl FROM game_fills WHERE user_id = ? ORDER BY at ASC',
    userId,
  );
  return rows.map((r) => ({ id: r.id, game: r.game, at: n(r.at), pnl: n(r.pnl) }));
}
