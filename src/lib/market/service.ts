/**
 * Server-side market data service: provider + caching + rate limiting.
 *
 * Cache TTLs are chosen from what the data actually is, not from a round
 * number. Quotes move constantly but no lesson needs sub-15s freshness, and a
 * daily candle that has already closed never changes again.
 */
import { TTLCache, RateLimiter } from './cache';
import { yahooProvider } from './yahoo';
import { MarketDataError, type HistoryRequest, type Quote, type Series, type SymbolInfo } from './types';

const QUOTE_TTL_MS = 15_000;
/** Intraday history is still forming, so it expires quickly. */
const INTRADAY_HISTORY_TTL_MS = 60_000;
/** Closed daily/weekly/monthly bars are immutable. An hour is conservative. */
const DAILY_HISTORY_TTL_MS = 60 * 60_000;
const SEARCH_TTL_MS = 10 * 60_000;

const quoteCache = new TTLCache<Quote>(QUOTE_TTL_MS, 1000);
const intradayCache = new TTLCache<Series>(INTRADAY_HISTORY_TTL_MS, 200);
const dailyCache = new TTLCache<Series>(DAILY_HISTORY_TTL_MS, 400);
const searchCache = new TTLCache<SymbolInfo[]>(SEARCH_TTL_MS, 300);

/** 120 requests/minute per IP is generous for a human and stops a hot loop. */
export const apiLimiter = new RateLimiter(120, 60_000);

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const wanted = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))];
  if (wanted.length === 0) throw new MarketDataError('No symbols provided', 400);

  const out: Quote[] = [];
  const missing: string[] = [];
  for (const s of wanted) {
    const hit = quoteCache.get(s.toUpperCase());
    if (hit) out.push(hit);
    else missing.push(s);
  }

  if (missing.length > 0) {
    // Batched in one upstream call, then cached individually so a later request
    // for a different mix of symbols still hits cache.
    const fetched = await yahooProvider.quote(missing);
    for (const q of fetched) {
      quoteCache.set(q.symbol.toUpperCase(), q);
      out.push(q);
    }
  }

  // Preserve the caller's requested order — widgets render in the order asked.
  const bySymbol = new Map(out.map((q) => [q.symbol.toUpperCase(), q]));
  return wanted.map((s) => bySymbol.get(s.toUpperCase())).filter((q): q is Quote => Boolean(q));
}

export async function getHistory(req: HistoryRequest): Promise<Series> {
  const intraday = req.interval !== '1d' && req.interval !== '1wk' && req.interval !== '1mo';
  const cache = intraday ? intradayCache : dailyCache;
  // Bucket the range so that a chart nudging `to` forward by a few seconds on
  // every render does not miss the cache every single time.
  const bucket = intraday ? 60_000 : 3_600_000;
  const key = [
    req.symbol.toUpperCase(),
    req.interval,
    Math.floor(req.from / bucket),
    Math.floor(req.to / bucket),
  ].join('|');

  return cache.fetch(key, () => yahooProvider.history(req));
}

export async function searchSymbols(query: string): Promise<SymbolInfo[]> {
  const key = query.trim().toLowerCase();
  if (key.length < 1) return [];
  return searchCache.fetch(key, () => yahooProvider.search(key));
}

export function clearMarketCaches(): void {
  quoteCache.clear();
  intradayCache.clear();
  dailyCache.clear();
  searchCache.clear();
}
