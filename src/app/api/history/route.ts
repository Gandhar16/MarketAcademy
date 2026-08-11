/**
 * GET /api/history?symbol=RELIANCE.NS&interval=1d&from=<ms>&to=<ms>
 * GET /api/history?symbol=AAPL&interval=1d&range=1y     (convenience form)
 *
 * Real OHLCV. This is the only path by which historical bars reach the client,
 * and the replay engine consumes it one bar at a time so the future is never in
 * the browser's memory (PLAN.md §7.2).
 */
import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/market/service';
import { cacheHeaders, enforceRateLimit, errorResponse } from '@/lib/market/http';
import { MarketDataError, type Interval } from '@/lib/market/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INTERVALS: Interval[] = ['1m', '5m', '15m', '1h', '1d', '1wk', '1mo'];

/** Convenience ranges, in days. */
const RANGES: Record<string, number> = {
  '1d': 1,
  '5d': 5,
  '1mo': 31,
  '3mo': 92,
  '6mo': 183,
  '1y': 366,
  '2y': 731,
  '5y': 1827,
  '10y': 3653,
  max: 12_000,
};

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  try {
    const p = new URL(req.url).searchParams;

    const symbol = p.get('symbol')?.trim();
    if (!symbol) throw new MarketDataError('Pass ?symbol=', 400);

    const interval = (p.get('interval') ?? '1d') as Interval;
    if (!INTERVALS.includes(interval)) {
      throw new MarketDataError(`interval must be one of ${INTERVALS.join(', ')}`, 400);
    }

    let from: number;
    let to: number;
    const range = p.get('range');
    if (range) {
      const days = RANGES[range];
      if (!days) throw new MarketDataError(`range must be one of ${Object.keys(RANGES).join(', ')}`, 400);
      to = Date.now();
      from = to - days * 86_400_000;
    } else {
      from = Number(p.get('from'));
      to = Number(p.get('to') ?? Date.now());
      if (!Number.isFinite(from) || !Number.isFinite(to)) {
        throw new MarketDataError('Pass either ?range= or numeric ?from=&?to= epoch milliseconds', 400);
      }
    }

    const series = await getHistory({ symbol, interval, from, to });

    const intraday = !['1d', '1wk', '1mo'].includes(interval);
    return NextResponse.json(series, { headers: cacheHeaders(intraday ? 60 : 3600) });
  } catch (err) {
    return errorResponse(err);
  }
}
