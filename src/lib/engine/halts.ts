/**
 * Circuit breakers, price bands, and trading halts.
 *
 * These are the mechanics behind the Edge Cases track (PLAN.md §4) and the
 * "Circuit Breaker" game (§5). They are also the reason a paper-trading account
 * is not a toy: a learner who has never met an upper circuit does not know that
 * "I'll just sell if it drops" is sometimes not an available action.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SOURCES — verified 2026-08-09.
 *
 * India market-wide circuit breakers (SEBI/NSE/BSE):
 *   https://www.nseindia.com/products-services/equity-market-circuit-breakers
 *   https://upstox.com/learning-center/online-trading/how-circuit-breakers-on-nifty-and-sensex-work/article-1579/
 *   Triggered by Nifty 50 OR Sensex, whichever breaches first. Levels computed
 *   daily from the previous close and rounded to the nearest tick.
 *
 * India individual stock price bands: 2% / 5% / 10% / 20% as assigned by the
 *   exchange. Securities in the F&O segment have no fixed band but a dynamic
 *   10% flexing mechanism instead.
 *
 * US LULD (NMS Plan) and market-wide circuit breakers:
 *   https://www.nasdaqtrader.com/content/MarketRegulation/LULD_FAQ.pdf
 *   https://www.investor.gov/introduction-investing/investing-basics/glossary/stock-market-circuit-breakers
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type HaltLevel = 'L1' | 'L2' | 'L3';

export interface MarketWideBreaker {
  level: HaltLevel;
  /** Percentage decline from the previous close that triggers this level. */
  triggerPercent: number;
  /** Halt in minutes, or 'rest_of_day'. */
  haltMinutes: number | 'rest_of_day';
  /** Minutes of pre-open call auction before continuous trading resumes. */
  preOpenMinutes: number;
  description: string;
}

/** Minutes since midnight, in the exchange's local time. */
const hhmm = (h: number, m: number) => h * 60 + m;

/** NSE/BSE continuous session: 09:15–15:30 IST. */
export const IN_SESSION = { open: hhmm(9, 15), close: hhmm(15, 30) };
/** NYSE/Nasdaq continuous session: 09:30–16:00 ET. */
export const US_SESSION = { open: hhmm(9, 30), close: hhmm(16, 0) };

/**
 * India's halt duration depends on WHEN the level is breached — a detail that
 * catches out even experienced traders. A 10% fall at 12:59 stops the market
 * for 45 minutes; the same fall at 13:01 stops it for 15.
 */
export function indiaMarketWideBreaker(
  declinePercent: number,
  minutesSinceMidnightIST: number,
): MarketWideBreaker | null {
  const t = minutesSinceMidnightIST;
  const d = Math.abs(declinePercent);

  if (d >= 20) {
    return {
      level: 'L3',
      triggerPercent: 20,
      haltMinutes: 'rest_of_day',
      preOpenMinutes: 0,
      description: 'A 20% fall closes the market for the remainder of the session, at any time of day.',
    };
  }

  if (d >= 15) {
    if (t < hhmm(13, 0)) {
      return mw('L2', 15, 105, 'Breached before 1:00 pm — 1 hour 45 minutes halt.');
    }
    if (t < hhmm(14, 0)) {
      return mw('L2', 15, 45, 'Breached between 1:00 and 2:00 pm — 45 minutes halt.');
    }
    return {
      level: 'L2',
      triggerPercent: 15,
      haltMinutes: 'rest_of_day',
      preOpenMinutes: 0,
      description: 'Breached after 2:00 pm — the market closes for the day.',
    };
  }

  if (d >= 10) {
    if (t < hhmm(13, 0)) return mw('L1', 10, 45, 'Breached before 1:00 pm — 45 minutes halt.');
    if (t < hhmm(14, 30)) return mw('L1', 10, 15, 'Breached between 1:00 and 2:30 pm — 15 minutes halt.');
    return {
      level: 'L1',
      triggerPercent: 10,
      haltMinutes: 0,
      preOpenMinutes: 0,
      description: 'Breached after 2:30 pm — no halt; trading continues to the close.',
    };
  }

  return null;
}

function mw(level: HaltLevel, trigger: number, minutes: number, description: string): MarketWideBreaker {
  // Every India halt resumes through a 15-minute pre-open call auction, never
  // straight back into continuous trading. Learners who expect to "get out at
  // the reopen" need to understand they are entering an auction, not a queue.
  return { level, triggerPercent: trigger, haltMinutes: minutes, preOpenMinutes: 15, description };
}

/**
 * US market-wide circuit breakers, keyed off the S&P 500's decline from the
 * previous close.
 */
export function usMarketWideBreaker(
  declinePercent: number,
  minutesSinceMidnightET: number,
): MarketWideBreaker | null {
  const d = Math.abs(declinePercent);
  const lateCutoff = hhmm(15, 25);

  if (d >= 20) {
    return {
      level: 'L3',
      triggerPercent: 20,
      haltMinutes: 'rest_of_day',
      preOpenMinutes: 0,
      description: 'A 20% S&P 500 decline halts trading for the remainder of the day, at any time.',
    };
  }

  const level: HaltLevel | null = d >= 13 ? 'L2' : d >= 7 ? 'L1' : null;
  if (!level) return null;

  if (minutesSinceMidnightET >= lateCutoff) {
    return {
      level,
      triggerPercent: level === 'L2' ? 13 : 7,
      haltMinutes: 0,
      preOpenMinutes: 0,
      description: 'Breached at or after 3:25 pm ET — trading continues to the close.',
    };
  }

  return {
    level,
    triggerPercent: level === 'L2' ? 13 : 7,
    haltMinutes: 15,
    preOpenMinutes: 0,
    description: 'Breached before 3:25 pm ET — 15 minute market-wide halt. Each level triggers only once per day.',
  };
}

// ── Individual security bands ───────────────────────────────────────────────

export type IndiaBand = 2 | 5 | 10 | 20;

export interface PriceBand {
  lower: number;
  upper: number;
  bandPercent: number;
  reference: number;
}

/** India: a fixed percentage band around the previous close. */
export function indiaPriceBand(previousClose: number, bandPercent: IndiaBand): PriceBand {
  const delta = (previousClose * bandPercent) / 100;
  return {
    lower: round2(previousClose - delta),
    upper: round2(previousClose + delta),
    bandPercent,
    reference: previousClose,
  };
}

export type BandBreach = 'none' | 'upper_circuit' | 'lower_circuit';

export function checkBand(price: number, band: PriceBand): BandBreach {
  if (price >= band.upper) return 'upper_circuit';
  if (price <= band.lower) return 'lower_circuit';
  return 'none';
}

/**
 * The upper-circuit trap, stated plainly because it is the single most
 * expensive thing a beginner does not know:
 *
 * At an upper circuit there are buyers and no sellers. If you are SHORT you
 * cannot cover. At a lower circuit there are sellers and no buyers — if you are
 * LONG you cannot exit, and your stop-loss will simply not fill. A stop-loss is
 * a request, not a guarantee.
 */
export function canTradeAtBand(breach: BandBreach, side: 'buy' | 'sell'): { allowed: boolean; reason?: string } {
  if (breach === 'none') return { allowed: true };
  if (breach === 'upper_circuit' && side === 'sell') return { allowed: true };
  if (breach === 'lower_circuit' && side === 'buy') return { allowed: true };
  return {
    allowed: false,
    reason:
      breach === 'upper_circuit'
        ? 'Locked at the upper circuit: there are only buy orders in the book. You cannot buy — there is nobody to sell to you.'
        : 'Locked at the lower circuit: there are only sell orders in the book. You cannot sell — there is nobody to buy from you.',
  };
}

export type LuldTier = 1 | 2;

/**
 * US LULD band width, as a percentage of the trailing 5-minute reference price.
 *
 * Bands DOUBLE during the opening period (09:30–09:45) and the closing period
 * (15:35–16:00), which is exactly when volatility clusters — so the protection
 * is weakest when it looks most needed.
 */
export function luldBandPercent(
  tier: LuldTier,
  referencePrice: number,
  minutesSinceMidnightET: number,
): number {
  let base: number;
  if (referencePrice > 3) base = tier === 1 ? 5 : 10;
  else if (referencePrice >= 0.75) base = 20;
  // Below $0.75 the band is the lesser of $0.15 or 75% — expressed as a
  // percentage so one function can serve every price regime.
  else base = Math.min(75, (0.15 / referencePrice) * 100);

  const doubled =
    minutesSinceMidnightET < hhmm(9, 45) || minutesSinceMidnightET >= hhmm(15, 35);
  return doubled ? base * 2 : base;
}

export function luldBand(
  tier: LuldTier,
  referencePrice: number,
  minutesSinceMidnightET: number,
): PriceBand {
  const pct = luldBandPercent(tier, referencePrice, minutesSinceMidnightET);
  const delta = (referencePrice * pct) / 100;
  return {
    lower: round2(referencePrice - delta),
    upper: round2(referencePrice + delta),
    bandPercent: pct,
    reference: referencePrice,
  };
}

/**
 * LULD does not halt on the first touch. Price must sit in a "limit state" at
 * the band for 15 seconds without moving back inside before a 5-minute pause
 * begins. This is why a stock can print at the band repeatedly without halting.
 */
export const LULD_LIMIT_STATE_SECONDS = 15;
export const LULD_PAUSE_MINUTES = 5;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
