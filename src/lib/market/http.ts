/**
 * Shared plumbing for the market API routes: client identification, rate-limit
 * enforcement, and a single error shape.
 *
 * Errors are returned as JSON with a human-readable `message`, because the
 * widgets surface them directly to the learner. "Something went wrong" teaches
 * nothing; "1-minute bars are only available for the last 30 days" teaches a
 * real constraint of real market data.
 */
import { NextResponse } from 'next/server';
import { MarketDataError } from './types';
import { apiLimiter } from './service';

export function clientKey(req: Request): string {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-real-ip') ?? 'local';
}

export function enforceRateLimit(req: Request): NextResponse | null {
  const { allowed, remaining, resetAt } = apiLimiter.check(clientKey(req));
  if (allowed) return null;
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: 'rate_limited',
      message: `Too many requests. Try again in ${retryAfter}s.`,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': String(remaining),
      },
    },
  );
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof MarketDataError) {
    return NextResponse.json({ error: 'market_data', message: err.message }, { status: err.status });
  }
  console.error('[market-api] unexpected error', err);
  return NextResponse.json(
    { error: 'internal', message: 'Market data is temporarily unavailable.' },
    { status: 500 },
  );
}

/** Cache-Control tuned per route so the CDN and browser agree with our TTLs. */
export function cacheHeaders(maxAgeSeconds: number): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 4}`,
  };
}
