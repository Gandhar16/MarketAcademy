/**
 * GET  /api/auth/me   — who am I, and what does the server have for me
 * PATCH /api/auth/me  — { displayName?, leaderboardOptIn?, market? }
 * DELETE /api/auth/me — delete the account and everything attached to it
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { deleteUser, updateProfile } from '@/lib/db/users';
import { loadSnapshot } from '@/lib/db/progress';
import { currentUser, endSession, requireUser } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user, snapshot: await loadSnapshot(await getDb(), user.id) });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'bad_request', message: 'Pass a JSON object.' }, { status: 400 });
  }

  const result = await updateProfile(await getDb(), user.id, {
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
    leaderboardOptIn: typeof body.leaderboardOptIn === 'boolean' ? body.leaderboardOptIn : undefined,
    market: body.market === 'IN' || body.market === 'US' ? body.market : undefined,
  });

  if (!result.ok) return NextResponse.json({ error: result.error, message: result.message }, { status: 400 });
  return NextResponse.json({ user: result.value });
}

export async function DELETE() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  await deleteUser(await getDb(), user.id);
  await endSession();
  return NextResponse.json({ ok: true });
}
