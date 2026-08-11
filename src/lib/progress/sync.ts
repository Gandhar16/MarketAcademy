'use client';

/**
 * Bridge between the localStorage store and the server.
 *
 * The design rule here is that being signed out is not a degraded experience.
 * localStorage stays the source of truth for the running session; the server is
 * a merge target that makes progress survive a new device. If the network is
 * down, or the learner never registers, nothing in the app behaves differently.
 *
 * Consequently every function here fails soft. A sync error is logged and
 * dropped, never surfaced as a blocking dialog over a lesson.
 */
import { useProgress } from './store';
import type { IncomingSnapshot, Snapshot } from '@/lib/db/progress';
import type { TradeRecord } from './mastery';

/** Reads the current store into the wire shape. */
export function localSnapshot(): IncomingSnapshot {
  const s = useProgress.getState();
  return {
    lessons: Object.values(s.lessons).map((l) => ({
      lessonId: l.lessonId,
      completedAt: l.completedAt,
      attempts: l.attempts,
      bestScore: l.bestScore,
      lastBlockIndex: l.lastBlockIndex,
    })),
    mastery: Object.values(s.mastery),
    stats: {
      xp: s.xp,
      streak: s.streak,
      lessonsDone: 0, // Server counts this itself.
      processScore: 0, // Server derives this from recorded runs.
    },
  };
}

/**
 * Pushes local progress up and applies whatever comes back.
 *
 * Returns the merged snapshot, or null when signed out — which is an ordinary
 * outcome, not an error.
 */
export async function pushLocalProgress(): Promise<Snapshot | null> {
  try {
    const res = await fetch('/api/progress/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(localSnapshot()),
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;

    const { snapshot } = (await res.json()) as { snapshot: Snapshot };
    applySnapshot(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

/**
 * Folds a server snapshot into the local store, taking the better value on
 * every field — the same merge rule the server uses, so that after a round trip
 * both sides agree regardless of which one was ahead.
 */
export function applySnapshot(snapshot: Snapshot): void {
  useProgress.setState((state) => {
    const lessons = { ...state.lessons };
    for (const l of snapshot.lessons) {
      const existing = lessons[l.lessonId];
      lessons[l.lessonId] = existing
        ? {
            lessonId: l.lessonId,
            completedAt:
              existing.completedAt === null
                ? l.completedAt
                : l.completedAt === null
                  ? existing.completedAt
                  : Math.min(existing.completedAt, l.completedAt),
            attempts: Math.max(existing.attempts, l.attempts),
            bestScore: Math.max(existing.bestScore, l.bestScore),
            lastBlockIndex: Math.max(existing.lastBlockIndex, l.lastBlockIndex),
          }
        : { ...l };
    }

    const mastery = { ...state.mastery };
    for (const m of snapshot.mastery) {
      const existing = mastery[m.skill];
      mastery[m.skill] = !existing || m.lastReviewedAt >= existing.lastReviewedAt ? m : existing;
    }

    return {
      lessons,
      mastery,
      xp: Math.max(state.xp, snapshot.stats.xp),
      streak: {
        current: Math.max(state.streak.current, snapshot.stats.streak.current),
        longest: Math.max(state.streak.longest, snapshot.stats.streak.longest),
        lastActiveAt: Math.max(state.streak.lastActiveAt, snapshot.stats.streak.lastActiveAt),
      },
    };
  });
}

/**
 * Reports a finished game run for the leaderboard.
 *
 * Sends the trade records, not a score. The server does the scoring — a
 * leaderboard that accepts scores from the thing being ranked is decoration.
 */
export async function reportGameRun(args: {
  game: string;
  trades: TradeRecord[];
  accuracy?: number;
  pnl?: number;
}): Promise<number | null> {
  try {
    const res = await fetch('/api/progress/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    const { processScore } = (await res.json()) as { processScore: number };
    return processScore;
  } catch {
    return null;
  }
}
