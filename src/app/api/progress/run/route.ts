/**
 * POST /api/progress/run
 * { game, accuracy?, pnl?, trades: TradeRecord[] }
 *
 * Records a finished game run. The process score is computed HERE from the
 * submitted trade records, never accepted from the client — a leaderboard whose
 * scores are supplied by the thing being ranked is not a leaderboard.
 *
 * The trade records themselves are still client-reported, which is an honest
 * limitation of a game that runs in the browser. What this buys is that every
 * score on the board was produced by one scorer with one set of rules, and that
 * inflating a score requires lying about behaviour rather than about a number.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { recordGameRun } from '@/lib/db/progress';
import type { TradeRecord } from '@/lib/progress/mastery';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { GAMES_BY_SLUG } from '@/lib/games/catalogue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TRADES = 500;
/** Long enough for any honest plan; short enough that the feed is not a blog. */
const MAX_REASON_CHARS = 1200;
/**
 * A reward-to-risk above this is not a plan, it is a typo or an attempt to game
 * the gate. Clamped rather than rejected, so an honest fat-fingered entry still
 * records the run.
 */
const MAX_PLANNED_RR = 50;

function toTrade(raw: unknown): TradeRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.pnl !== 'number' || !Number.isFinite(t.pnl)) return null;
  return {
    preCommitted: t.preCommitted === true,
    riskFraction:
      typeof t.riskFraction === 'number' && Number.isFinite(t.riskFraction)
        ? Math.min(1, Math.max(0, t.riskFraction))
        : 0,
    honouredStop: t.honouredStop === true,
    exitedPerPlan: t.exitedPerPlan === true,
    sizedFromStop: t.sizedFromStop === true,
    pnl: t.pnl,
    // Absent, non-numeric and non-positive all collapse to null, which the XP
    // gate reads as "entered without a target". That is deliberately the same
    // verdict as omitting the field: a client cannot earn the reward-to-risk
    // gate by simply not mentioning it.
    plannedRR:
      typeof t.plannedRR === 'number' && Number.isFinite(t.plannedRR) && t.plannedRR > 0
        ? Math.min(MAX_PLANNED_RR, t.plannedRR)
        : null,
    stoppedOut: t.stoppedOut === true,
  };
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.game !== 'string' || !Array.isArray(body.trades)) {
    return NextResponse.json({ error: 'bad_request', message: 'Pass { game, trades[] }.' }, { status: 400 });
  }
  if (!GAMES_BY_SLUG.has(body.game)) {
    return NextResponse.json({ error: 'not_found', message: `Unknown game "${body.game}".` }, { status: 404 });
  }
  if (body.trades.length > MAX_TRADES) {
    return NextResponse.json({ error: 'too_large', message: 'Too many trades in one run.' }, { status: 413 });
  }

  const trades = body.trades.map(toTrade).filter((t: TradeRecord | null): t is TradeRecord => t !== null);

  // The reason is stripped of markup here rather than at render time. It is
  // shown to other learners, and the safest thing to store is text that was
  // never markup in the first place.
  const reason =
    typeof body.reason === 'string' ? body.reason.replace(/[<>]/g, '').trim().slice(0, MAX_REASON_CHARS) : '';

  const run = await recordGameRun(await getDb(), user.id, {
    game: body.game,
    accuracy: typeof body.accuracy === 'number' && Number.isFinite(body.accuracy) ? body.accuracy : null,
    pnl: typeof body.pnl === 'number' && Number.isFinite(body.pnl) ? body.pnl : null,
    trades,
    reason,
  });

  // `notes` is returned in full, including the gates that failed. A learner who
  // earned nothing is owed the reason more than one who earned everything.
  return NextResponse.json({
    processScore: run.processScore,
    xpAwarded: run.xpAwarded,
    meanRR: run.meanRR,
    notes: run.notes,
    outcome: run.outcome,
    encouragement: run.encouragement,
    totals: run.totals,
    tradesRecorded: trades.length,
  });
}
