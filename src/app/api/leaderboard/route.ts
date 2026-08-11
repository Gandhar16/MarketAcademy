/**
 * GET /api/leaderboard?board=overall|discipline|knowledge|consistency&game=<slug>
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { gameLeaderboard, leaderboard, rankOf, type Board } from '@/lib/db/leaderboard';
import { currentUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOARDS: Board[] = ['overall', 'discipline', 'knowledge', 'consistency'];

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const url = new URL(req.url);
  const game = url.searchParams.get('game');
  const db = await getDb();

  if (game) {
    return NextResponse.json({ game, entries: await gameLeaderboard(db, game) });
  }

  const requested = url.searchParams.get('board') as Board | null;
  const board: Board = requested && BOARDS.includes(requested) ? requested : 'overall';

  const me = await currentUser();
  return NextResponse.json({
    board,
    entries: await leaderboard(db, board),
    // A learner outside the visible page still gets told where they stand.
    you: me ? await rankOf(db, me.id, board) : null,
  });
}
