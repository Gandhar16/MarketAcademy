'use client';

/**
 * The mastery dashboard.
 *
 * Deliberately shows DECAY, not a completion percentage. A progress bar that
 * only goes up is a lie about how learning works, and it is the reason people
 * finish courses believing they know things they cannot do three months later.
 *
 * Reads from localStorage via the progress store, so it renders empty on the
 * server and fills in after hydration. That is handled explicitly rather than
 * left to a hydration mismatch.
 */
import Link from 'next/link';
import { useProgress } from '@/lib/progress/store';
import { currentRetention, daysUntilDue, REVIEW_THRESHOLD } from '@/lib/progress/mastery';
import { useHydrated, useNow } from '@/lib/util/client-hooks';

export function ProgressDashboard({
  lessons,
}: {
  lessons: { id: string; title: string; tier: string }[];
}) {
  const hydrated = useHydrated();
  // Quantised to the minute so the 'due in N days' figures tick over without
  // making render impure.
  const now = useNow(60_000);

  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const mastery = useProgress((s) => s.mastery);
  const lessonProgress = useProgress((s) => s.lessons);
  const reset = useProgress((s) => s.reset);

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-xl border border-line bg-surface" />;
  }

  const skills = Object.values(mastery);
  const completed = Object.values(lessonProgress).filter((l) => l.completedAt != null);

  if (skills.length === 0 && completed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-8 text-center">
        <p className="text-ink-muted">Nothing recorded yet.</p>
        <Link href="/learn" className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-ground">
          Start the first lesson
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="XP" value={xp.toLocaleString()} />
        <Stat label="Streak" value={`${streak.current} day${streak.current === 1 ? '' : 's'}`} note={`Longest ${streak.longest}`} />
        <Stat label="Lessons completed" value={`${completed.length} of ${lessons.length}`} />
      </div>

      <section>
        <h2 className="text-lg font-medium">Skill retention</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Anything below {Math.round(REVIEW_THRESHOLD * 100)}% is due for review. Half-life extends each time you
          practise successfully, so the same skill needs refreshing less and less often.
        </p>

        <ul className="mt-4 space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {skills
            .map((m) => ({ m, retention: currentRetention(m, now) }))
            .sort((a, b) => a.retention - b.retention)
            .map(({ m, retention }) => {
              const due = retention < REVIEW_THRESHOLD;
              const days = daysUntilDue(m, now);
              return (
                <li key={m.skill} className="bg-surface p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="text-sm">{m.skill}</span>
                    <span className="num text-[13px]" style={{ color: due ? 'var(--color-down)' : 'var(--color-up)' }}>
                      {Math.round(retention * 100)}%
                      <span className="ml-3 text-ink-faint">
                        {due ? 'due now' : `due in ${days < 1 ? 'under a day' : `${Math.round(days)} days`}`}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, retention * 100)}%`,
                        background: due ? 'var(--color-down)' : 'var(--color-up)',
                      }}
                    />
                  </div>
                  <div className="num mt-1.5 text-[11px] text-ink-faint">
                    {m.reviews} review{m.reviews === 1 ? '' : 's'} · half-life {m.halfLifeDays.toFixed(1)} days
                  </div>
                </li>
              );
            })}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium">Lessons</h2>
        <ul className="mt-4 space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {lessons.map((l) => {
            const p = lessonProgress[l.id];
            return (
              <li key={l.id}>
                <Link href={`/learn/${l.id}`} className="flex items-baseline justify-between gap-4 bg-surface p-4 transition-colors hover:bg-surface-2">
                  <span className="text-sm">
                    <span className="num mr-3 text-ink-faint">{l.tier}</span>
                    {l.title}
                  </span>
                  <span className="num shrink-0 text-[13px] text-ink-faint">
                    {p?.completedAt
                      ? `${p.bestScore}% · ${p.attempts} attempt${p.attempts === 1 ? '' : 's'}`
                      : p
                        ? 'started'
                        : 'not started'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        onClick={() => {
          if (confirm('Erase all local progress? This cannot be undone.')) reset();
        }}
        className="text-[13px] text-ink-faint underline underline-offset-4 transition-colors hover:text-down"
      >
        Erase my progress
      </button>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="num mt-1 text-2xl">{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-ink-faint">{note}</div>}
    </div>
  );
}
