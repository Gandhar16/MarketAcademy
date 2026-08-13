/**
 * Replay session API.
 *
 *   POST /api/replay            { symbol?, seed? }  → start, returns warm-up bars only
 *   POST /api/replay?step       { sessionId }       → exactly one more bar
 *   POST /api/replay?reveal     { sessionId }       → full series, only once finished
 *
 * The server holds the bars. There is no endpoint that takes a bar index, so a
 * client cannot request the future — only the next bar.
 */
import { NextResponse } from 'next/server';
import { closePosition, openPosition, revealReplay, startReplay, stepReplay } from '@/lib/replay/server-session';
import { enforceRateLimit, errorResponse } from '@/lib/market/http';
import { MarketDataError } from '@/lib/market/types';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    if (url.searchParams.has('step')) {
      const sessionId = requireSessionId(body);
      return NextResponse.json(stepReplay(sessionId));
    }

    if (url.searchParams.has('reveal')) {
      const sessionId = requireSessionId(body);
      return NextResponse.json(revealReplay(sessionId));
    }

    if (url.searchParams.has('open-position')) {
      const sessionId = requireSessionId(body);
      const side = body.side === 'buy' || body.side === 'sell' ? body.side : null;
      if (!side) throw new MarketDataError('side must be "buy" or "sell".', 400);
      const stopPct = Number(body.stopPct);
      const targetPct = body.targetPct == null ? null : Number(body.targetPct);
      return NextResponse.json(
        openPosition(sessionId, { side, stopPct, targetPct, hasThesis: body.hasThesis === true }),
      );
    }

    if (url.searchParams.has('close-position')) {
      const sessionId = requireSessionId(body);
      const positionId = (body as { positionId?: unknown }).positionId;
      if (typeof positionId !== 'string' || positionId.length === 0) {
        throw new MarketDataError('positionId is required', 400);
      }
      return NextResponse.json(closePosition(sessionId, positionId));
    }

    const started = await startReplay({
      symbol: typeof body.symbol === 'string' ? body.symbol : undefined,
      seed: Number.isInteger(body.seed) ? body.seed : undefined,
    });
    return NextResponse.json(started);
  } catch (err) {
    return errorResponse(err);
  }
}

function requireSessionId(body: unknown): string {
  const id = (body as { sessionId?: unknown })?.sessionId;
  if (typeof id !== 'string' || id.length === 0) {
    throw new MarketDataError('sessionId is required', 400);
  }
  return id;
}
