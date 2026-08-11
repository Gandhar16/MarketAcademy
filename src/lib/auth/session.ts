/**
 * Session cookie plumbing for the App Router.
 *
 * Server-only. The cookie is httpOnly, so no client script can read the token —
 * including any script that manages to get itself onto the page.
 */
// Server-only by construction: `next/headers` throws if this module is ever
// pulled into a client bundle, which is the guard the `server-only` package
// would otherwise provide.
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { SESSION_TTL_MS, createSession, destroySession, userForToken, type User } from '@/lib/db/users';

export const SESSION_COOKIE = 'ma_session';

/** The signed-in user, or null. Safe to call from any server component. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  return userForToken(await getDb(), jar.get(SESSION_COOKIE)?.value);
}

export async function startSession(userId: string, userAgent?: string): Promise<void> {
  const { token } = await createSession(await getDb(), userId, userAgent);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure in production only — a localhost dev server is plain http, and a
    // Secure cookie there is simply dropped, which looks like broken auth.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  await destroySession(await getDb(), jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
}

/**
 * Guard for API routes. Returns the user or a 401 Response, so a handler reads
 * as `const u = await requireUser(); if (u instanceof Response) return u;`
 */
export async function requireUser(): Promise<User | Response> {
  const user = await currentUser();
  if (user) return user;
  return Response.json({ error: 'unauthorised', message: 'Sign in to do that.' }, { status: 401 });
}
