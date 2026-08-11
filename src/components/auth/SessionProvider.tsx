'use client';

/**
 * Who is signed in, available anywhere in the tree.
 *
 * The user is resolved on the server and handed down as a prop, so the header
 * renders the right thing on the first paint rather than flashing "Sign in" and
 * then correcting itself.
 *
 * On mount, if someone is signed in, it syncs once. That single call is what
 * makes "I did three lessons on my phone" appear on the laptop.
 */
import { createContext, useContext, useEffect, useRef } from 'react';
import { pushLocalProgress } from '@/lib/progress/sync';

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  leaderboardOptIn: boolean;
  market: string;
}

const SessionContext = createContext<SessionUser | null>(null);

export function useSession(): SessionUser | null {
  return useContext(SessionContext);
}

export function SessionProvider({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  // Guards against a second sync in React's development double-mount.
  const synced = useRef(false);

  useEffect(() => {
    if (!user || synced.current) return;
    synced.current = true;
    void pushLocalProgress();
  }, [user]);

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
