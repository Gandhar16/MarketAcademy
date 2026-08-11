/**
 * Live network tests. Skipped by default — CI must not depend on an external
 * market data provider being up. Run them deliberately:
 *
 *   MARKET_LIVE=1 npx vitest run src/lib/market/live.integration.test.ts
 *
 * Their job is to catch the thing unit tests structurally cannot: the provider
 * changing its response shape under us.
 */
import { describe, expect, it } from 'vitest';
import { yahooProvider } from './yahoo';

const live = process.env.MARKET_LIVE === '1';
const d = live ? describe : describe.skip;

d('live provider', () => {
  it('quotes an Indian equity and an Indian index', async () => {
    const quotes = await yahooProvider.quote(['RELIANCE.NS', '^NSEI']);
    expect(quotes).toHaveLength(2);
    for (const q of quotes) {
      expect(q.price).toBeGreaterThan(0);
      expect(q.source).toBe('live');
      expect(Number.isFinite(q.changePercent)).toBe(true);
    }
    expect(quotes[0].currency).toBe('INR');
  }, 30_000);

  it('quotes a US equity', async () => {
    const [q] = await yahooProvider.quote(['AAPL']);
    expect(q.price).toBeGreaterThan(0);
    expect(q.currency).toBe('USD');
  }, 30_000);

  it('returns real daily OHLCV with sane bar invariants', async () => {
    const to = Date.now();
    const from = to - 400 * 86_400_000;
    const s = await yahooProvider.history({ symbol: 'RELIANCE.NS', interval: '1d', from, to });

    expect(s.candles.length).toBeGreaterThan(200);
    for (const c of s.candles) {
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.high).toBeGreaterThanOrEqual(c.open);
      expect(c.high).toBeGreaterThanOrEqual(c.close);
      expect(c.low).toBeLessThanOrEqual(c.open);
      expect(c.low).toBeLessThanOrEqual(c.close);
    }
    // Strictly increasing time — the replay engine depends on this ordering.
    for (let i = 1; i < s.candles.length; i++) {
      expect(s.candles[i].time).toBeGreaterThan(s.candles[i - 1].time);
    }
  }, 30_000);

  it('rejects an intraday range beyond the provider cap with a useful message', async () => {
    const to = Date.now();
    const from = to - 200 * 86_400_000;
    await expect(yahooProvider.history({ symbol: 'AAPL', interval: '1m', from, to })).rejects.toThrow(
      /only available for the last 30 days/,
    );
  });

  it('searches symbols', async () => {
    const res = await yahooProvider.search('reliance');
    expect(res.length).toBeGreaterThan(0);
    expect(res.some((r) => r.symbol.includes('RELIANCE'))).toBe(true);
  }, 30_000);
});
