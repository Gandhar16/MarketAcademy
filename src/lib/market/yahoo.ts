/**
 * Yahoo Finance provider.
 *
 * Chosen because it is the only free source that covers NSE (`RELIANCE.NS`,
 * `^NSEI`) and US equities behind one interface, with real intraday quotes and
 * long daily history. It is called ONLY from server-side API routes — never
 * from the browser — so we control caching, rate limiting, and the shape of
 * what reaches the client.
 *
 * Known limitations, stated rather than hidden:
 *  - NSE quotes can lag real-time by a short interval. Anything time-critical
 *    in a lesson uses bundled snapshots instead (see PLAN.md §2).
 *  - Intraday history is capped by Yahoo at ~60 days for 1m/5m bars.
 *  - Volume for indices is frequently null. We pass null through rather than
 *    substituting zero, which would read as "no trading happened".
 */
import YahooFinance from 'yahoo-finance2';
import {
  MarketDataError,
  type Candle,
  type HistoryRequest,
  type Interval,
  type MarketProvider,
  type Quote,
  type Series,
  type SymbolInfo,
} from './types';

/**
 * One client for the process. Yahoo requires a cookie/crumb handshake before it
 * will answer, and the client caches that across calls — constructing a new one
 * per request would repeat the handshake every time.
 *
 * `suppressNotices` silences the survey prompt that otherwise prints on every
 * cold start; `versionCheck` off keeps a build from making a network call to npm
 * when a market request happens to fail.
 */
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
});

/** Map our interval vocabulary onto Yahoo's. */
const YF_INTERVAL: Record<Interval, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '1d': '1d',
  '1wk': '1wk',
  '1mo': '1mo',
};

/** Yahoo's hard caps on how far back each intraday interval goes. */
export const MAX_LOOKBACK_DAYS: Record<Interval, number> = {
  '1m': 30,
  '5m': 60,
  '15m': 60,
  '1h': 730,
  '1d': 36_500,
  '1wk': 36_500,
  '1mo': 36_500,
};

/**
 * Yahoo's chart endpoint fails transiently far more than its status code
 * implies — a dropped connection, a stale cookie/crumb handshake on a cold
 * server instance, a plain rate-limit blip. None of those are "this symbol
 * has no data"; they are "ask again in a moment and it will probably work."
 * A couple of short, cheap retries turns most of them invisible instead of
 * surfacing a 502 for something that would have succeeded on the next try.
 */
const HISTORY_RETRIES = 2;
const RETRY_DELAY_MS = 300;

async function withRetry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

function marketState(raw: string | undefined): Quote['marketState'] {
  switch (raw) {
    case 'PRE':
    case 'PREPRE':
      return 'PRE';
    case 'REGULAR':
      return 'REGULAR';
    case 'POST':
    case 'POSTPOST':
      return 'POST';
    case 'CLOSED':
      return 'CLOSED';
    default:
      return 'UNKNOWN';
  }
}

export class YahooProvider implements MarketProvider {
  readonly id = 'yahoo';

  async quote(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return [];
    if (symbols.length > 25) throw new MarketDataError('At most 25 symbols per request', 400);

    let raw: unknown;
    try {
      raw = await yahooFinance.quote(symbols);
    } catch (err) {
      throw new MarketDataError('Upstream quote request failed', 502, err);
    }

    const rows = (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[];
    return rows.filter(Boolean).map((r) => {
      const price = num(r.regularMarketPrice);
      const prev = num(r.regularMarketPreviousClose);
      if (price == null) {
        throw new MarketDataError(`No price returned for ${String(r.symbol)}`, 404);
      }
      return {
        symbol: String(r.symbol),
        price,
        previousClose: prev ?? price,
        // Recomputed rather than trusted: providers occasionally return a stale
        // change against a different previous close than the one they quote.
        change: prev == null ? 0 : price - prev,
        changePercent: prev ? ((price - prev) / prev) * 100 : 0,
        dayHigh: num(r.regularMarketDayHigh) ?? price,
        dayLow: num(r.regularMarketDayLow) ?? price,
        open: num(r.regularMarketOpen) ?? price,
        volume: num(r.regularMarketVolume),
        currency: String(r.currency ?? ''),
        exchange: String(r.fullExchangeName ?? r.exchange ?? ''),
        timestamp: toMs(r.regularMarketTime) ?? Date.now(),
        marketState: marketState(r.marketState as string | undefined),
        source: 'live' as const,
      };
    });
  }

  async history(req: HistoryRequest): Promise<Series> {
    const { symbol, interval, from, to } = req;
    if (!(from < to)) throw new MarketDataError('`from` must be before `to`', 400);

    const spanDays = (to - from) / 86_400_000;
    const cap = MAX_LOOKBACK_DAYS[interval];
    const ageDays = (Date.now() - from) / 86_400_000;
    if (ageDays > cap) {
      throw new MarketDataError(
        `${interval} bars are only available for the last ${cap} days (requested ${Math.round(ageDays)} days back). ` +
          `Use a coarser interval, or a bundled snapshot for a scripted replay.`,
        400,
      );
    }
    if (spanDays <= 0) throw new MarketDataError('Empty date range', 400);

    let result: { quotes?: Record<string, unknown>[]; meta?: Record<string, unknown> };
    try {
      result = await withRetry(
        () =>
          yahooFinance.chart(symbol, {
            period1: new Date(from),
            period2: new Date(to),
            interval: YF_INTERVAL[interval] as never,
          }) as never,
        HISTORY_RETRIES,
      );
    } catch (err) {
      throw new MarketDataError(`Upstream history request failed for ${symbol}`, 502, err);
    }

    const candles: Candle[] = (result.quotes ?? [])
      .map((q) => {
        const time = toMs(q.date);
        const open = num(q.open);
        const high = num(q.high);
        const low = num(q.low);
        const close = num(q.close);
        if (time == null || open == null || high == null || low == null || close == null) return null;
        return { time: Math.floor(time / 1000), open, high, low, close, volume: num(q.volume) };
      })
      // Yahoo emits null-filled placeholder bars for halts and holidays. A bar
      // with no trade is not a bar; dropping them is correct, and inventing a
      // flat candle in its place would be a lie the replay engine then teaches.
      .filter((c): c is Candle => c !== null);

    if (candles.length === 0) {
      throw new MarketDataError(`No data for ${symbol} in the requested range`, 404);
    }

    return {
      symbol,
      interval,
      candles,
      currency: String(result.meta?.currency ?? ''),
      source: 'live',
    };
  }

  async search(query: string): Promise<SymbolInfo[]> {
    const q = query.trim();
    if (q.length < 1) return [];

    let res: { quotes?: Record<string, unknown>[] };
    try {
      res = (await yahooFinance.search(q, { quotesCount: 12, newsCount: 0 })) as never;
    } catch (err) {
      throw new MarketDataError('Upstream search failed', 502, err);
    }

    return (res.quotes ?? [])
      .filter((r) => typeof r.symbol === 'string' && r.quoteType !== 'FUTURE')
      .map((r) => {
        const exch = String(r.exchange ?? '');
        const isIndia = exch === 'NSI' || exch === 'BSE' || String(r.symbol).endsWith('.NS');
        const type = r.quoteType === 'INDEX' ? 'index' : r.quoteType === 'ETF' ? 'etf' : 'equity';
        return {
          symbol: String(r.symbol),
          name: String(r.longname ?? r.shortname ?? r.symbol),
          market: (isIndia ? 'IN' : 'US') as 'IN' | 'US',
          exchange: exch,
          currency: (isIndia ? 'INR' : 'USD') as 'INR' | 'USD',
          type: type as SymbolInfo['type'],
        };
      });
  }
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function toMs(v: unknown): number | null {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000; // seconds vs ms
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

export const yahooProvider = new YahooProvider();
