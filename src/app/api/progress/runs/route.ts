/**
 * GET /api/progress/runs
 *
 * The signed-in learner's own filed runs. Theirs only — there is no user id in
 * the request and no way to ask for anybody else's, which is the point: this
 * returns P&L, and P&L is the one thing on this site that is never made public
 * about a named person (PLAN.md §7 rule 4).
 *
 * Used by Edge or Luck to run the same statistical test on the learner's record
 * that it runs on the invented ones.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { recentRunsForUser } from '@/lib/db/progress';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const runs = await recentRunsForUser(await getDb(), user.id);
  return NextResponse.json({ runs });
}
