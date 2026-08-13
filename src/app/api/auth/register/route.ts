/**
 * POST /api/auth/register
 * { email, displayName, password, leaderboardOptIn? }
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createUser } from '@/lib/db/users';
import { startSession } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.email !== 'string' ||
    typeof body.displayName !== 'string' ||
    typeof body.password !== 'string'
  ) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Pass { email, displayName, password }.' },
      { status: 400 },
    );
  }

  const result = await createUser(await getDb(), {
    email: body.email,
    displayName: body.displayName,
    password: body.password,
    leaderboardOptIn: body.leaderboardOptIn === true,
    market: body.market === 'US' ? 'US' : 'IN',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.error === 'email_taken' ? 409 : 400 },
    );
  }

  await startSession(result.value.id, req.headers.get('user-agent') ?? undefined);
  return NextResponse.json({ user: result.value });
}
