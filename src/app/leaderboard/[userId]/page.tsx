/**
 * A learner's public leaderboard snapshot — a link anyone can be sent, signed
 * in or not, that shows the same numbers the main board already shows for
 * them: rank, score, the three components, and P&L last and grey, same
 * disclaimer as everywhere else on this site.
 *
 * Deliberately thin. This is not a profile page — no reasoning entries, no
 * game history — just what a leaderboard row already says, worth a URL of
 * its own. `rankOf` already applies the leaderboard's own opt-in gate, so a
 * learner who has not opted in (or does not exist) 404s here exactly as they
 * are absent from the board itself.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { MIN_RUNS_FOR_DISCIPLINE, rankOf } from '@/lib/db/leaderboard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const db = await getDb();
  const entry = await rankOf(db, userId, 'overall');
  return {
    title: entry ? `${entry.displayName} — Market Academy Leaderboard` : 'Learner — Market Academy',
  };
}

export default async function LearnerSnapshotPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const db = await getDb();
  const entry = await rankOf(db, userId, 'overall');
  if (!entry) notFound();

  const provisional = entry.runs < MIN_RUNS_FOR_DISCIPLINE;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <Link href="/leaderboard" className="text-sm text-ink-faint transition-colors hover:text-ink">
        ← Leaderboard
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{entry.displayName}</h1>
          {provisional && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
              provisional
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="num text-4xl font-semibold text-accent">#{entry.rank}</span>
          <span className="text-sm text-ink-muted">overall, {entry.score.toFixed(1)} / 100</span>
        </div>

        <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-muted">
          Ranked on how they traded — planned before entering, sized from the stop, honoured it, exited as planned —
          not on how much they made.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Discipline" value={entry.discipline.toFixed(0)} />
          <Stat label="Lessons" value={String(entry.lessonsDone)} />
          <Stat label="Streak" value={`${entry.streakLongest}d`} />
          <Stat label="Runs" value={String(entry.runs)} />
        </dl>

        <div className="mt-6 border-t border-line pt-4">
          <dl>
            <dt className="text-[10px] uppercase tracking-wider text-ink-faint" title="Shown for interest. Not ranked on.">
              P&amp;L*
            </dt>
            <dd
              className={`num mt-1 text-lg ${
                entry.netPnl == null ? 'text-ink-faint' : entry.netPnl >= 0 ? 'text-up/70' : 'text-down/70'
              }`}
            >
              {entry.netPnl == null ? '—' : entry.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </dd>
          </dl>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            * Shown because hiding it would be evasive. It is not part of this rank — over a short contest the
            biggest number belongs to whoever took the most risk and got away with it.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-faint">
        This is a public snapshot — anyone with this link can see it.{' '}
        <Link href="/leaderboard" className="text-accent underline underline-offset-2">
          See the full leaderboard
        </Link>
        .
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="num mt-0.5 text-lg">{value}</dd>
    </div>
  );
}
