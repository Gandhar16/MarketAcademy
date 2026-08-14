/**
 * GET  /api/sim/fills — every fill this learner's simulator has executed, so
 *      the client can rebuild positions and the blotter on load instead of
 *      starting blank.
 * POST /api/sim/fills — records one fill the simulator's own reducer just
 *      executed and banks its realised P&L into the shared account balance.
 * DELETE /api/sim/fills — "reset the simulator": deletes every fill and
 *      reverses their combined effect on the shared balance.
 *
 * The simulator has no scoring, no XP, and no leaderboard tie-in — it is
 * free-play against live prices, not a graded run — so unlike
 * /api/progress/run there is nothing here to grade or verify server-side.
 * What still matters is that a fill, once it has happened, is never lost and
 * never double-counted; see lib/db/sim.ts for how idempotency is kept.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';
import { clearSimFills, loadSimFills, recordSimFill } from '@/lib/db/sim';
import { INDIA_EQUITIES } from '@/lib/market/symbols';
import type { Product } from '@/lib/engine/costs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYMBOLS = new Set(INDIA_EQUITIES.map((s) => s.symbol));
/** A losing (or winning) fill beyond this is not a fill, it is a malformed request. */
const MAX_REALISED = 10_000_000;

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const fills = await loadSimFills(await getDb(), user.id);
  return NextResponse.json({ fills });
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const productOk = body && (body.product === 'intraday' || body.product === 'delivery');
  const sideOk = body && (body.side === 'buy' || body.side === 'sell');
  const valid =
    body &&
    typeof body.id === 'string' &&
    body.id.length > 0 &&
    body.id.length <= 100 &&
    typeof body.at === 'number' &&
    Number.isFinite(body.at) &&
    typeof body.symbol === 'string' &&
    SYMBOLS.has(body.symbol) &&
    productOk &&
    sideOk &&
    typeof body.quantity === 'number' &&
    Number.isFinite(body.quantity) &&
    body.quantity > 0 &&
    typeof body.price === 'number' &&
    Number.isFinite(body.price) &&
    body.price > 0 &&
    typeof body.realised === 'number' &&
    Number.isFinite(body.realised);

  if (!valid) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Pass { id, at, symbol, product, side, quantity, price, realised }.' },
      { status: 400 },
    );
  }

  const { recorded } = await recordSimFill(await getDb(), user.id, {
    id: body.id,
    at: body.at,
    symbol: body.symbol,
    product: body.product as Product,
    side: body.side as 'buy' | 'sell',
    quantity: body.quantity,
    price: body.price,
    realised: Math.max(-MAX_REALISED, Math.min(MAX_REALISED, body.realised)),
  });

  return NextResponse.json({ recorded });
}

export async function DELETE(req: Request) {
  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  await clearSimFills(await getDb(), user.id);
  return NextResponse.json({ ok: true });
}
