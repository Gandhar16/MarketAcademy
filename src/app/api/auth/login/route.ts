/**
 * POST /api/auth/login
 * { email, password }
 *
 * Failures are throttled per email+address. The failure message is deliberately
 * identical whether the account is missing or the password is wrong — telling
 * someone which of the two it was hands them a way to enumerate registered
 * addresses.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  checkCredentials,
  clearLoginFailures,
  emailKey,
  loginBackoffSeconds,
  recordLoginFailure,
} from '@/lib/db/users';
import { startSession } from '@/lib/auth/session';
import { clientKey, enforceRateLimit } from '@/lib/market/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'bad_request', message: 'Pass { email, password }.' }, { status: 400 });
  }

  const db = await getDb();
  const throttleKey = `${emailKey(body.email)}|${clientKey(req)}`;

  const wait = await loginBackoffSeconds(db, throttleKey);
  if (wait > 0) {
    return NextResponse.json(
      {
        error: 'too_many_attempts',
        message: `Too many failed attempts. Try again in about ${Math.ceil(wait / 60)} minute(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(wait) } },
    );
  }

  const user = await checkCredentials(db, body.email, body.password);
  if (!user) {
    await recordLoginFailure(db, throttleKey);
    return NextResponse.json({ error: 'invalid_credentials', message: 'Email or password is incorrect.' }, { status: 401 });
  }

  await clearLoginFailures(db, throttleKey);
  await startSession(user.id, req.headers.get('user-agent') ?? undefined);
  return NextResponse.json({ user });
}
