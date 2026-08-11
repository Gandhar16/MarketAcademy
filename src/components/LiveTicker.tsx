'use client';

import { useEffect, useState } from 'react';
import type { Quote } from '@/lib/market/types';

const SYMBOLS = ['^NSEI', '^NSEBANK', 'RELIANCE.NS', 'HDFCBANK.NS', '^GSPC', 'AAPL'];
const LABELS: Record<string, string> = {
  '^NSEI': 'NIFTY 50',
  '^NSEBANK': 'NIFTY BANK',
  'RELIANCE.NS': 'RELIANCE',
  'HDFCBANK.NS': 'HDFC BANK',
  '^GSPC': 'S&P 500',
  AAPL: 'AAPL',
};

/**
 * Live quotes on the landing page.
 *
 * This exists to make a promise verifiable in the first three seconds: the
 * numbers on this site are real. It also demonstrates the marketState handling
 * — when the Indian market is shut, it says so rather than showing a stale
 * price as though it were live.
 */
export function LiveTicker() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/quote?symbols=${SYMBOLS.join(',')}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.message ?? 'Could not load market data.');
          return;
        }
        setError(null);
        setQuotes(json.quotes);
      } catch {
        if (!cancelled) setError('Could not reach the market data service.');
      }
    };

    load();
    // Matches the server-side cache TTL — polling faster would only return the
    // same cached payload.
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-[--radius-card] border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
        {error}
      </div>
    );
  }

  if (!quotes) {
    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-6">
        {SYMBOLS.map((s) => (
          <div key={s} className="h-[74px] animate-pulse bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-6">
        {quotes.map((q) => {
          const up = q.change >= 0;
          return (
            <div key={q.symbol} className="bg-surface px-4 py-3">
              <div className="truncate text-[11px] uppercase tracking-wider text-ink-faint">
                {LABELS[q.symbol] ?? q.symbol}
              </div>
              <div className="num mt-1 text-[15px] text-ink">
                {q.price.toLocaleString(q.currency === 'INR' ? 'en-IN' : 'en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="num text-[12px]" style={{ color: up ? 'var(--color-up)' : 'var(--color-down)' }}>
                {up ? '+' : ''}
                {q.changePercent.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">
        Live from the exchange, cached 15 seconds.{' '}
        {quotes.every((q) => q.marketState !== 'REGULAR')
          ? 'All these markets are currently closed — these are the last traded prices, not live ones.'
          : 'Prices update while the market is open.'}
      </p>
    </div>
  );
}
