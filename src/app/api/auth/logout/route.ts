import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth/session';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  await endSession();
  return NextResponse.json({ ok: true });
}
