/**
 * GET /api/health
 *
 * Exists for exactly one moment: the first request after a deploy, when the
 * only question is "did it connect to the database I think it did?" A deploy
 * that silently fell back to a local file would otherwise look perfectly
 * healthy right up until the next deploy wiped it.
 *
 * It reports the backend and whether a trivial query works. It does NOT report
 * the connection string, row counts, or anything else about the data — a health
 * endpoint is public by nature and should be boring to an attacker.
 */
import { NextResponse } from 'next/server';
import { chooseBackend, getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const backend = chooseBackend();

  try {
    const db = await getDb();
    const row = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM users');
    return NextResponse.json({
      ok: true,
      backend,
      // Whether the schema is actually there, without saying how many people
      // have signed up.
      schema: row ? 'ready' : 'missing',
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, backend, error: err instanceof Error ? err.message : 'unknown' },
      { status: 503 },
    );
  }
}
