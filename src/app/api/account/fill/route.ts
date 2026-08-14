/**
 * POST /api/account/fill
 *
 * Banks one closed trade's realised P&L into the shared account balance, the
 * instant the trade closes — not later, when (and if) the learner writes a
 * reason and files the run for XP. See lib/db/gameFills.ts for why this is a
 * separate path from /api/progress/run rather than folded into it.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';
import { recordGameFill } from '@/lib/db/gameFills';
import { GAME_CATALOGUE } from '@/lib/games/catalogue';
import { loadTotals } from '@/lib/db/progress';
import { startingCashFor } from '@/lib/account/balance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GAMES = new Set(GAME_CATALOGUE.map((g) => g.slug));
/** A win or a loss on one trade beyond this is not a trade, it is a malformed request. */
const MAX_PNL = 10_000_000;

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const valid =
    body &&
    typeof body.id === 'string' &&
    body.id.length > 0 &&
    body.id.length <= 100 &&
    typeof body.game === 'string' &&
    GAMES.has(body.game) &&
    typeof body.pnl === 'number' &&
    Number.isFinite(body.pnl);

  if (!valid) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Pass { id, game, pnl }.' },
      { status: 400 },
    );
  }

  const db = await getDb();
  await recordGameFill(db, user.id, {
    id: body.id,
    game: body.game,
    at: Date.now(),
    pnl: Math.max(-MAX_PNL, Math.min(MAX_PNL, body.pnl)),
  });

  const totals = await loadTotals(db, user.id);
  return NextResponse.json({ netPnl: totals.netPnl, startingCash: startingCashFor(totals.netPnl) });
}
