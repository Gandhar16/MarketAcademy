/**
 * The curriculum registry.
 *
 * Lessons are imported explicitly rather than glob-loaded. It is more typing,
 * and it is worth it: the registry is the single place that answers "what is in
 * the course", the CI validator walks exactly this list, and a lesson file that
 * exists but was never registered cannot silently ship half-finished.
 */
import type { Lesson } from '@/lib/lesson/dsl';
import whatIsAShare from './in/t0-what-is-a-share';
import whoDoesWhat from './in/t0-who-does-what';
import orderBook from './in/t0-order-book';
import settlement from './in/t0-settlement';
import whatMovesPrice from './in/t0-what-moves-price';
import indexLesson from './in/t0-index';
import realCostOfATrade from './in/t1-real-cost-of-a-trade';
import contractNote from './in/t1-contract-note';
import readingCandles from './in/t1-reading-candles';
import firstTrade from './in/t1-first-trade';
import orderTypes from './in/t1-order-types';
import positionSizing from './in/t1-position-sizing';
import stops from './in/t1-stops';
import expectancyLesson from './in/t1-expectancy';
import journal from './in/t1-journal';
import compounding from './in/t1-compounding';
import sip from './in/t1-sip';
import indexVsStock from './in/t1-index-vs-stock';
import dividends from './in/t1-dividends';
import doesThisPatternWork from './in/t2-does-this-pattern-work';
import supportResistance from './in/t2-support-resistance';
import trend from './in/t2-trend';
import volumeLesson from './in/t2-volume';
import patternCatalogue from './in/t2-pattern-catalogue';
import indicators from './in/t2-indicators';
import financials from './in/t2-financials';
import profitVsCash from './in/t2-profit-vs-cash';
import valuation from './in/t2-valuation';
import screening from './in/t2-screening';
import sectors from './in/t2-sectors';
import lossAversion from './in/t2-loss-aversion';
import anchoring from './in/t2-anchoring';
import overtrading from './in/t2-overtrading';
import optionsFirstPrinciples from './in/t3-options-from-first-principles';
import riskOfRuin from './in/t4-risk-of-ruin';
import backtestPitfalls from './in/t4-backtest-pitfalls';
import kelly from './in/t4-kelly';
import microstructure from './in/t4-microstructure';
import portfolio from './in/t4-portfolio';
import correlation from './in/t4-correlation';
import algo from './in/t4-algo';
import tax from './in/t4-tax';
import circuitLock from './in/t5-circuit-lock';
import physicalSettlement from './in/t5-physical-settlement-trap';
import shortDelivery from './in/t5-short-delivery';
import freezeQuantity from './in/t5-freeze-quantity';
import surveillance from './in/t5-surveillance';
import corporateActions from './in/t5-corporate-actions';
import freakTrades from './in/t5-freak-trades';
import mtf from './in/t5-mtf';
import pledge from './in/t5-pledge';
import slb from './in/t5-slb';
import gaps from './in/t5-gaps';
import liquidityLesson from './in/t5-liquidity';
import whatIsADerivative from './in/t3-what-is-a-derivative';
import futures from './in/t3-futures';
import callAndPut from './in/t3-call-and-put';
import vix from './in/t3-vix';
import margin from './in/t3-margin';
import strikePrices from './in/t3-strike-prices';
import greeks from './in/t3-greeks';
import impliedVolatility from './in/t3-iv';
import spreads from './in/t3-spreads';
import expiryMechanics from './in/t3-expiry';
import hedging from './in/t3-hedging';

export const LESSONS: Lesson[] = [whatIsAShare, whoDoesWhat, orderBook, settlement, whatMovesPrice, indexLesson, orderTypes, realCostOfATrade, contractNote, readingCandles, firstTrade, positionSizing, stops, expectancyLesson, journal, compounding, sip, indexVsStock, dividends, trend, supportResistance, volumeLesson, doesThisPatternWork, patternCatalogue, indicators, financials, profitVsCash, valuation, screening, sectors, lossAversion, anchoring, overtrading, margin, whatIsADerivative, futures, callAndPut, strikePrices, optionsFirstPrinciples, greeks, vix, impliedVolatility, spreads, expiryMechanics, hedging, riskOfRuin, kelly, backtestPitfalls, microstructure, portfolio, correlation, algo, tax, circuitLock, physicalSettlement, shortDelivery, freezeQuantity, surveillance, corporateActions, freakTrades, mtf, pledge, slb, gaps, liquidityLesson];

export const LESSONS_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

export function lessonsForTier(tier: Lesson['tier']): Lesson[] {
  return LESSONS.filter((l) => l.tier === tier);
}

export function lessonsForMarket(market: 'IN' | 'US'): Lesson[] {
  return LESSONS.filter((l) => l.market === market || l.market === 'BOTH');
}
