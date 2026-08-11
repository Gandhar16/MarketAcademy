/**
 * GET /api/reasons?game=<slug>&only=exemplary
 *
 * The public reasoning feed. No authentication: reading other learners'
 * reasoning is the point, and requiring an account to see it would make the
 * most valuable thing on the site the thing behind the sign-up wall.
 *
 * Only runs by learners who opted in appear at all — see recentReasons().
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { REASON_FEED_LIMIT, exemplaryReasons, recentReasons } from '@/lib/db/reasons';
import { GAMES_BY_SLUG } from '@/lib/games/catalogue';
import { enforceRateLimit } from '@/lib/market/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const url = new URL(req.url);
  const game = url.searchParams.get('game');
  if (game && !GAMES_BY_SLUG.has(game)) {
    return NextResponse.json({ error: 'not_found', message: `Unknown game "${game}".` }, { status: 404 });
  }

  const limit = Math.min(REASON_FEED_LIMIT, Math.max(1, Number(url.searchParams.get('limit')) || REASON_FEED_LIMIT));
  const db = await getDb();
  const entries =
    url.searchParams.get('only') === 'exemplary'
      ? await exemplaryReasons(db, limit)
      : await recentReasons(db, game ?? undefined, limit);

  return NextResponse.json({ entries });
}
