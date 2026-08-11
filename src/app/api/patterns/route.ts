/**
 * GET /api/patterns?symbol=RELIANCE.NS&horizon=5&years=5
 *
 * Scores every candlestick pattern against REAL history for a symbol and
 * returns hit rates alongside base rates. Runs server-side so the scoring uses
 * the same cached history as everything else and the client never has to hold
 * five years of bars to compute a percentage.
 */
import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/market/service';
import { cacheHeaders, enforceRateLimit, errorResponse } from '@/lib/market/http';
import { MarketDataError } from '@/lib/market/types';
import { allPatternStats, patternStats, PATTERNS_BY_ID, type PatternId } from '@/lib/analysis/patterns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_YEARS = 10;

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  try {
    const p = new URL(req.url).searchParams;

    const symbol = p.get('symbol')?.trim();
    if (!symbol) throw new MarketDataError('Pass ?symbol=', 400);

    const horizon = Number(p.get('horizon') ?? 5);
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > 60) {
      throw new MarketDataError('horizon must be a whole number of bars between 1 and 60', 400);
    }

    const years = Math.min(MAX_YEARS, Math.max(1, Number(p.get('years') ?? 5)));
    const patternId = p.get('pattern') as PatternId | null;
    if (patternId && !PATTERNS_BY_ID.has(patternId)) {
      throw new MarketDataError(`Unknown pattern "${patternId}"`, 400);
    }

    const to = Date.now();
    const from = to - years * 366 * 86_400_000;
    const series = await getHistory({ symbol, interval: '1d', from, to });

    if (series.candles.length < 200) {
      throw new MarketDataError(
        `Only ${series.candles.length} bars available for ${symbol}. Base rates computed on less than 200 bars are not worth reporting.`,
        422,
      );
    }

    const stats = patternId
      ? [patternStats(series.candles, patternId, horizon)]
      : allPatternStats(series.candles, horizon);

    return NextResponse.json(
      {
        symbol,
        horizon,
        bars: series.candles.length,
        from: series.candles[0].time,
        to: series.candles[series.candles.length - 1].time,
        stats,
      },
      { headers: cacheHeaders(3600) },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
