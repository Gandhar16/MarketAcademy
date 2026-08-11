/**
 * GET /api/quote?symbols=RELIANCE.NS,^NSEI
 *
 * Live quotes. Cached 15s server-side and coalesced, so a lesson page with six
 * quote widgets produces one upstream call.
 */
import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/market/service';
import { cacheHeaders, enforceRateLimit, errorResponse } from '@/lib/market/http';
import { MarketDataError } from '@/lib/market/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get('symbols') ?? url.searchParams.get('symbol');
    if (!raw) throw new MarketDataError('Pass ?symbols=SYM1,SYM2', 400);

    const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const quotes = await getQuotes(symbols);

    if (quotes.length === 0) {
      throw new MarketDataError(`No quotes found for ${symbols.join(', ')}`, 404);
    }

    return NextResponse.json(
      { quotes, fetchedAt: Date.now() },
      { headers: cacheHeaders(15) },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
