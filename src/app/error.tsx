'use client';

/**
 * Route error boundary.
 *
 * Market data comes from a third party that can and does fail. When it does,
 * the learner should get a plain explanation and a retry — not a blank page,
 * and not a stack trace. `reset()` re-runs the failed segment.
 */
import { useEffect } from 'react';
import Link from 'next/link';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[route-error]', error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="text-[11px] uppercase tracking-[0.2em] text-down">Something broke</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page could not load</h1>
      <p className="mt-3 text-ink-muted">
        Most often this is the market data provider being briefly unavailable. Retrying usually works; if it does not,
        the rest of the site is unaffected.
      </p>
      {error.digest && <p className="num mt-2 text-[11px] text-ink-faint">Reference {error.digest}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={reset} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-on-emphasis">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-line-strong px-5 py-2.5 text-ink-muted">
          Home
        </Link>
      </div>
    </main>
  );
}
