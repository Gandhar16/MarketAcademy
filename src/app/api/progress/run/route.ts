/**
 * POST /api/progress/run
 * { game, accuracy?, pnl?, trades: TradeRecord[] }
 *
 * Records a finished game run. The process score is computed HERE from the
 * submitted trade records, never accepted from the client — a leaderboard whose
 * scores are supplied by the thing being ranked is not a leaderboard.
 *
 * chart-replay is currently the only game that submits TradeRecord[] built
 * from real trading decisions, and for it most of the record is no longer
 * taken on trust either: pnl, stoppedOut, plannedRR, preCommitted,
 * riskFraction and sizedFromStop are all overwritten below from the replay
 * session's own server-side ledger (see openPosition/closePosition in
 * lib/replay/server-session.ts). What is left client-reported —
 * honouredStop and exitedPerPlan — asks whether the exit was calm or a
 * panic, which is a fact about the trader's state of mind, not the market,
 * and has no mechanical test.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { recordGameRun } from '@/lib/db/progress';
import type { TradeRecord } from '@/lib/progress/mastery';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';
import { GAMES_BY_SLUG } from '@/lib/games/catalogue';
import { markTradeFiled, nextUnfiledTrade } from '@/lib/replay/server-session';

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

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

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

  let trades = body.trades.map(toTrade).filter((t: TradeRecord | null): t is TradeRecord => t !== null);

  // chart-replay is the one game that submits a scored TradeRecord built from
  // an actual trading decision, so it is the one game where a fabricated POST
  // body is worth anything — see the audit note in server-session.ts. It is
  // also filed ONE TRADE AT A TIME, the instant that trade closes, rather
  // than batched at the end of a session (see ChartReplay.tsx) — a win or a
  // loss is real the moment it happens, and XP for it should not wait on
  // however many more trades the learner takes afterwards. `nextUnfiledTrade`
  // is the server's own ledger telling us which trade that is; the client's
  // claim about which trade it is filing is never trusted, only its
  // honouredStop/exitedPerPlan self-report for a 'manual' close (see below).
  let filedTradeIndex: number | null = null;
  if (body.game === 'chart-replay') {
    if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
      return NextResponse.json(
        { error: 'bad_request', message: 'This run needs the replay session it was played through. Start a new replay.' },
        { status: 400 },
      );
    }
    const next = nextUnfiledTrade(body.sessionId);
    if (!next) {
      return NextResponse.json(
        {
          error: 'not_found',
          message:
            'No newly closed trade to file for that session — either nothing has closed yet, it was already filed, or the session expired.',
        },
        { status: 404 },
      );
    }
    // Every field that is a fact about prices (pnl, stoppedOut, plannedRR) or
    // about what was recorded at entry (preCommitted, riskFraction,
    // sizedFromStop) comes from the server's own ledger, never the client.
    // `honouredStop`/`exitedPerPlan` are ALSO overwritten whenever the server
    // knows the exit was not a choice — a 'stop' or 'target' close from
    // checkAutoClose(), or a 'session-end' close — since there is nothing to
    // self-report about a level the price reached on its own. Only a
    // 'manual' close (the learner clicked an exit button before either level
    // was reached) leaves those two fields as the client's claim — see the
    // comment on closePosition() in server-session.ts for why that one case
    // has no mechanical test.
    const clientClaim = trades[0];
    trades = [
      {
        pnl: next.trade.pnl,
        stoppedOut: next.trade.stoppedOut,
        plannedRR: next.trade.plannedRR,
        preCommitted: next.trade.preCommitted,
        riskFraction: next.trade.riskFraction,
        sizedFromStop: next.trade.sizedFromStop,
        honouredStop: next.trade.reason !== 'manual' ? true : (clientClaim?.honouredStop ?? false),
        exitedPerPlan: next.trade.reason !== 'manual' ? true : (clientClaim?.exitedPerPlan ?? false),
      },
    ];
    filedTradeIndex = next.index;
  }

  // The reason is stripped of markup here rather than at render time. It is
  // shown to other learners, and the safest thing to store is text that was
  // never markup in the first place.
  const reason =
    typeof body.reason === 'string' ? body.reason.replace(/[<>]/g, '').trim().slice(0, MAX_REASON_CHARS) : '';

  // `pnl` is normally allowed to be a richer client-computed number (Chart
  // Replay's own account P&L includes charges a bare sum of trade records
  // does not — see the comment on recordGameRun). But that richness is also
  // exactly what made it spoofable: nothing upstream of here checked it
  // against anything. For chart-replay it is dropped once trades are
  // server-verified, so recordGameRun falls back to summing the (now
  // verified) trades' pnl instead of trusting a bare number in the POST body.
  const trustClientPnl = body.game !== 'chart-replay';

  const run = await recordGameRun(await getDb(), user.id, {
    game: body.game,
    accuracy: typeof body.accuracy === 'number' && Number.isFinite(body.accuracy) ? body.accuracy : null,
    pnl: trustClientPnl && typeof body.pnl === 'number' && Number.isFinite(body.pnl) ? body.pnl : null,
    trades,
    reason,
  });

  // Only after the run is actually recorded — a crash between the two would
  // otherwise leave a trade permanently unfilable rather than merely retried.
  if (body.game === 'chart-replay' && filedTradeIndex != null) {
    markTradeFiled(body.sessionId, filedTradeIndex);
  }

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
