/**
 * GET /api/search?q=reliance
 *
 * Symbol lookup. Results from the curated universe (src/lib/market/symbols.ts)
 * are hoisted to the top, because lessons and the simulator behave best on
 * names we have vetted for liquidity.
 */
import { NextResponse } from 'next/server';
import { searchSymbols } from '@/lib/market/service';
import { cacheHeaders, enforceRateLimit, errorResponse } from '@/lib/market/http';
import { UNIVERSE } from '@/lib/market/symbols';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  try {
    const q = (new URL(req.url).searchParams.get('q') ?? '').trim();
    if (q.length === 0) return NextResponse.json({ results: [] });

    const needle = q.toLowerCase();
    const curated = UNIVERSE.filter(
      (s) => s.symbol.toLowerCase().includes(needle) || s.name.toLowerCase().includes(needle),
    );

    const remote = await searchSymbols(q).catch(() => []);
    const seen = new Set(curated.map((s) => s.symbol.toUpperCase()));
    const merged = [
      ...curated.map((s) => ({ ...s, curated: true })),
      ...remote.filter((s) => !seen.has(s.symbol.toUpperCase())).map((s) => ({ ...s, curated: false })),
    ];

    return NextResponse.json({ results: merged.slice(0, 20) }, { headers: cacheHeaders(600) });
  } catch (err) {
    return errorResponse(err);
  }
}
