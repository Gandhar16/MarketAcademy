/**
 * The curated symbol universe used by lessons, games, and the simulator.
 *
 * Lessons deliberately draw from a small, stable, liquid set rather than the
 * whole market. Three reasons:
 *  1. A lesson that references a stock which later gets delisted is a broken
 *     lesson. These names are large, liquid, and boring on purpose.
 *  2. Liquid names have tight spreads, so the fill engine's spread model stays
 *     honest without needing per-symbol calibration.
 *  3. Learners recognise them, which removes one variable while they are busy
 *     learning a mechanic.
 *
 * INDEX LOT SIZES — verified 2026-08-09, effective 2026-01-01 (NSE/BSE revision).
 * https://algotest.in/blog/nifty-lot-size/
 * https://www.venturasecurities.com/blog/fo-lot-size-changes-in-india-what-traders-need-to-know-effective-jan-2026/
 * Lot sizes are revised periodically by the exchange. `lotSizeAsOf` is stamped
 * so a stale value is visible rather than silently wrong.
 */
import type { SymbolInfo } from './types';

export const LOT_SIZE_AS_OF = '2026-01-01';

export const INDIA_INDICES: SymbolInfo[] = [
  { symbol: '^NSEI', name: 'NIFTY 50', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'index', lotSize: 65 },
  { symbol: '^NSEBANK', name: 'NIFTY BANK', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'index', lotSize: 30 },
  { symbol: '^BSESN', name: 'BSE SENSEX', market: 'IN', exchange: 'BSE', currency: 'INR', type: 'index', lotSize: 20 },
];

/** Extra index lots that have no clean Yahoo symbol but matter for lessons. */
export const INDIA_INDEX_LOT_SIZES: Record<string, number> = {
  NIFTY: 65,
  BANKNIFTY: 30,
  FINNIFTY: 60,
  MIDCPNIFTY: 120,
  SENSEX: 20,
};

export const INDIA_EQUITIES: SymbolInfo[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'INFY.NS', name: 'Infosys', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'ITC.NS', name: 'ITC', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', market: 'IN', exchange: 'NSE', currency: 'INR', type: 'equity' },
];

export const US_INDICES: SymbolInfo[] = [
  { symbol: '^GSPC', name: 'S&P 500', market: 'US', exchange: 'SNP', currency: 'USD', type: 'index' },
  { symbol: '^IXIC', name: 'NASDAQ Composite', market: 'US', exchange: 'NIM', currency: 'USD', type: 'index' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', market: 'US', exchange: 'PCX', currency: 'USD', type: 'etf' },
];

export const US_EQUITIES: SymbolInfo[] = [
  { symbol: 'AAPL', name: 'Apple', market: 'US', exchange: 'NMS', currency: 'USD', type: 'equity' },
  { symbol: 'MSFT', name: 'Microsoft', market: 'US', exchange: 'NMS', currency: 'USD', type: 'equity' },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'US', exchange: 'NMS', currency: 'USD', type: 'equity' },
  { symbol: 'AMZN', name: 'Amazon', market: 'US', exchange: 'NMS', currency: 'USD', type: 'equity' },
  { symbol: 'TSLA', name: 'Tesla', market: 'US', exchange: 'NMS', currency: 'USD', type: 'equity' },
  { symbol: 'JPM', name: 'JPMorgan Chase', market: 'US', exchange: 'NYQ', currency: 'USD', type: 'equity' },
];

export const UNIVERSE: SymbolInfo[] = [
  ...INDIA_INDICES,
  ...INDIA_EQUITIES,
  ...US_INDICES,
  ...US_EQUITIES,
];

const BY_SYMBOL = new Map(UNIVERSE.map((s) => [s.symbol.toUpperCase(), s]));

export function lookup(symbol: string): SymbolInfo | undefined {
  return BY_SYMBOL.get(symbol.toUpperCase());
}

export function isKnown(symbol: string): boolean {
  return BY_SYMBOL.has(symbol.toUpperCase());
}

/**
 * India tick size on the cash segment. Orders must be a multiple of this — the
 * order validator rejects ₹101.237 rather than silently rounding it, because
 * "your order was rejected for an invalid tick" is itself a lesson.
 */
export const TICK_SIZE_IN = 0.05;
/** US equities quote in pennies above $1.00, and in $0.0001 below it (Rule 612). */
export const TICK_SIZE_US = 0.01;
export const TICK_SIZE_US_SUB_DOLLAR = 0.0001;

export function tickSizeFor(info: Pick<SymbolInfo, 'market'>, price: number): number {
  if (info.market === 'IN') return TICK_SIZE_IN;
  return price < 1 ? TICK_SIZE_US_SUB_DOLLAR : TICK_SIZE_US;
}
