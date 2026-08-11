/**
 * Market data layer — types.
 *
 * PLAN.md §7.1: no invented market data. Anything that reaches a chart is
 * either a real print from a real exchange, or it is explicitly flagged as a
 * model. `Candle.source` and `Quote.source` exist to make that impossible to
 * forget.
 */

export type Market = 'IN' | 'US';

/** Where a bar or quote came from. Rendered in the UI, not just for debugging. */
export type DataSource =
  | 'live' // fetched now from the provider
  | 'snapshot' // bundled real OHLCV committed to the repo
  | 'model'; // generated — MUST be labelled in the UI as a model

export interface SymbolInfo {
  /** Provider symbol, e.g. "RELIANCE.NS", "^NSEI", "AAPL". */
  symbol: string;
  /** Human name, e.g. "Reliance Industries Ltd". */
  name: string;
  market: Market;
  exchange: string;
  currency: 'INR' | 'USD';
  type: 'equity' | 'index' | 'etf';
  /** F&O lot size where the symbol has a listed derivative. */
  lotSize?: number;
}

export interface Quote {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  volume: number | null;
  currency: string;
  exchange: string;
  /** Epoch ms of the last print, as reported by the provider. */
  timestamp: number;
  /**
   * Whether the market is open right now. The simulator uses this to decide
   * between "trade today's market" and replay mode, and lessons about market
   * hours read it directly.
   */
  marketState: 'PRE' | 'REGULAR' | 'POST' | 'CLOSED' | 'UNKNOWN';
  source: DataSource;
}

export interface Candle {
  /** Epoch seconds — the unit lightweight-charts expects. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export type Interval = '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo';

export interface Series {
  symbol: string;
  interval: Interval;
  candles: Candle[];
  currency: string;
  source: DataSource;
  /** Set when source is 'snapshot' — which bundled file this came from. */
  snapshotId?: string;
}

export interface HistoryRequest {
  symbol: string;
  interval: Interval;
  /** Epoch ms, inclusive. */
  from: number;
  /** Epoch ms, exclusive. */
  to: number;
}

export interface MarketProvider {
  readonly id: string;
  quote(symbols: string[]): Promise<Quote[]>;
  history(req: HistoryRequest): Promise<Series>;
  search(query: string): Promise<SymbolInfo[]>;
}

/** Thrown for anything the caller could reasonably fix (bad symbol, bad range). */
export class MarketDataError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MarketDataError';
  }
}
