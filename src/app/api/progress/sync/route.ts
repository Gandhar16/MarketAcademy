/**
 * POST /api/progress/sync
 *
 * Send the browser's snapshot, receive the merged one. Both directions in one
 * round trip, because the interesting case is a learner who worked signed-out
 * on one device and signed-in on another — that is a merge, not an upload.
 *
 * A signed-out caller gets 401 and the client simply keeps using localStorage.
 * Nothing about being logged out is a degraded experience.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mergeSnapshot, type IncomingSnapshot } from '@/lib/db/progress';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A cap, so a malformed or hostile client cannot push an unbounded payload. */
const MAX_ROWS = 2_000;

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'bad_request', message: 'Pass a snapshot object.' }, { status: 400 });
  }

  const rawLessons: unknown[] = Array.isArray(body.lessons) ? body.lessons : [];
  const rawMastery: unknown[] = Array.isArray(body.mastery) ? body.mastery : [];
  if (rawLessons.length > MAX_ROWS || rawMastery.length > MAX_ROWS) {
    return NextResponse.json({ error: 'too_large', message: 'Snapshot is too large.' }, { status: 413 });
  }

  const incoming: IncomingSnapshot = {
    lessons: rawLessons
      .filter((l: unknown): l is Record<string, unknown> => !!l && typeof l === 'object')
      .filter((l) => typeof l.lessonId === 'string')
      .map((l) => ({
        lessonId: l.lessonId as string,
        completedAt: typeof l.completedAt === 'number' ? l.completedAt : null,
        attempts: Math.max(0, Math.trunc(num(l.attempts))),
        // Scores are a percentage. A client claiming 8000 gets 100.
        bestScore: Math.min(100, Math.max(0, num(l.bestScore))),
        lastBlockIndex: Math.max(0, Math.trunc(num(l.lastBlockIndex))),
      })),
    mastery: rawMastery
      .filter((m: unknown): m is Record<string, unknown> => !!m && typeof m === 'object')
      .filter((m) => typeof m.skill === 'string')
      .map((m) => ({
        skill: m.skill as string,
        strength: Math.min(1, Math.max(0, num(m.strength))),
        halfLifeDays: Math.min(365, Math.max(0.5, num(m.halfLifeDays, 3))),
        lastReviewedAt: Math.max(0, num(m.lastReviewedAt)),
        reviews: Math.max(0, Math.trunc(num(m.reviews))),
      })),
    stats: {
      xp: Math.max(0, Math.trunc(num(body.stats?.xp))),
      streak: {
        current: Math.max(0, Math.trunc(num(body.stats?.streak?.current))),
        longest: Math.max(0, Math.trunc(num(body.stats?.streak?.longest))),
        lastActiveAt: Math.max(0, num(body.stats?.streak?.lastActiveAt)),
      },
      lessonsDone: 0, // Recomputed server-side from the rows; never taken on trust.
      processScore: 0, // Derived from recorded game runs only.
    },
  };

  return NextResponse.json({ snapshot: await mergeSnapshot(await getDb(), user.id, incoming) });
}
