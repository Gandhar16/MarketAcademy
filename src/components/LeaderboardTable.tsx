'use client';

/**
 * The leaderboard.
 *
 * The P&L column is deliberately present and deliberately last, greyed, and
 * unsortable. Hiding it would be dishonest — people want to know — but making
 * it rankable would quietly teach the opposite of everything the lessons say.
 * Showing a top-ranked learner who is down money is the single clearest way to
 * make the point that this site scores how you traded, not how it turned out.
 */
import { useState } from 'react';
import Link from 'next/link';
import type { Board, RankedEntry } from '@/lib/db/leaderboard';
import { MIN_RUNS_FOR_DISCIPLINE, WEIGHTS } from '@/lib/db/leaderboard';

const BOARDS: { id: Board; label: string; blurb: string }[] = [
  {
    id: 'overall',
    label: 'Overall',
    blurb: `Discipline ${WEIGHTS.discipline}%, knowledge ${WEIGHTS.knowledge}%, consistency ${WEIGHTS.consistency}%.`,
  },
  {
    id: 'discipline',
    label: 'Discipline',
    blurb: 'How you traded: planned before entering, sized from the stop, honoured it, exited as planned.',
  },
  { id: 'knowledge', label: 'Knowledge', blurb: 'Lessons completed and checkpoints passed, on a log scale.' },
  { id: 'consistency', label: 'Consistency', blurb: 'Longest run of days practised.' },
];

export function LeaderboardTable({
  initialBoard,
  initialEntries,
  you,
}: {
  initialBoard: Board;
  initialEntries: RankedEntry[];
  you: RankedEntry | null;
}) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [entries, setEntries] = useState(initialEntries);
  const [mine, setMine] = useState(you);
  const [loading, setLoading] = useState(false);

  async function switchBoard(next: Board) {
    if (next === board) return;
    setBoard(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?board=${next}`);
      const data = (await res.json()) as { entries: RankedEntry[]; you: RankedEntry | null };
      setEntries(data.entries);
      setMine(data.you);
    } finally {
      setLoading(false);
    }
  }

  const active = BOARDS.find((b) => b.id === board)!;
  const onPage = mine && entries.some((e) => e.userId === mine.userId);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Leaderboard">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={b.id === board}
            onClick={() => switchBoard(b.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              b.id === board
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink-muted">{active.blurb}</p>

      {entries.length === 0 ? (
        <p className="mt-8 rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
          Nobody has opted in yet. Turn it on from your account page and you will be the first.
        </p>
      ) : (
        <>
          {/* Below md the table becomes a list of cards. Eight columns behind a
              horizontal scrollbar is technically responsive and practically
              unreadable: on a phone you can see the rank or the score but never
              both at once, and nobody scrolls sideways to compare rows. */}
          <ul className={`mt-6 space-y-2 md:hidden ${loading ? 'opacity-50' : ''} transition-opacity`}>
            {entries.map((e) => (
              <Card key={e.userId} entry={e} highlight={e.userId === mine?.userId} />
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Learner</th>
                <th className="py-2 pr-3 text-right font-medium">Score</th>
                <th className="py-2 pr-3 text-right font-medium">Discipline</th>
                <th className="py-2 pr-3 text-right font-medium">Lessons</th>
                <th className="py-2 pr-3 text-right font-medium">Streak</th>
                <th className="py-2 pr-3 text-right font-medium">Runs</th>
                <th className="py-2 text-right font-medium text-ink-faint" title="Shown for interest. Not ranked on.">
                  P&amp;L*
                </th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
              {entries.map((e) => (
                <Row key={e.userId} entry={e} highlight={e.userId === mine?.userId} />
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {mine && !onPage && (
        <>
          <ul className="mt-4 md:hidden">
            <Card entry={mine} highlight />
          </ul>
          <div className="mt-4 hidden overflow-x-auto rounded-lg border border-accent/40 bg-accent/5 md:block">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <tbody>
                <Row entry={mine} highlight />
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        * Profit and loss is shown because hiding it would be evasive, and is not part of any ranking on this page. Over
        a short contest the biggest number belongs to whoever took the most risk and got away with it, so ranking by it
        would reward exactly the behaviour the lessons spend their time arguing against. A learner needs{' '}
        {MIN_RUNS_FOR_DISCIPLINE} recorded runs before their discipline score counts at full weight.
      </p>
    </div>
  );
}

/**
 * The same row, for a phone. Rank and score lead; the supporting numbers wrap
 * underneath as labelled pairs; P&L stays last and grey, exactly as in the
 * table — the ordering is the argument, so it survives the layout change.
 */
function Card({ entry, highlight }: { entry: RankedEntry; highlight?: boolean }) {
  const provisional = entry.runs < MIN_RUNS_FOR_DISCIPLINE;
  return (
    <li
      className={`rounded-lg border p-3 ${highlight ? 'border-accent/40 bg-accent/5' : 'border-line bg-surface'}`}
    >
      <div className="flex items-baseline gap-3">
        <span className="num shrink-0 text-ink-faint">#{entry.rank}</span>
        <Link
          href={`/leaderboard/${entry.userId}`}
          className={`min-w-0 flex-1 truncate hover:underline ${highlight ? 'font-medium text-accent' : ''}`}
        >
          {entry.displayName}
        </Link>
        <span className="num shrink-0 text-base">{entry.score.toFixed(1)}</span>
      </div>
      {provisional && (
        <span className="mt-1 inline-block rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
          provisional
        </span>
      )}
      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <Pair label="Discipline" value={entry.discipline.toFixed(0)} />
        <Pair label="Lessons" value={String(entry.lessonsDone)} />
        <Pair label="Streak" value={`${entry.streakLongest}d`} />
        <Pair label="Runs" value={String(entry.runs)} />
        <Pair
          label="P&L*"
          value={entry.netPnl == null ? '—' : entry.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          faint
        />
      </dl>
    </li>
  );
}

function Pair({ label, value, faint }: { label: string; value: string; faint?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className={faint ? 'text-ink-faint' : ''}>{label}</dt>
      <dd className={`num ${faint ? 'text-ink-faint' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}

function Row({ entry, highlight }: { entry: RankedEntry; highlight?: boolean }) {
  const provisional = entry.runs < MIN_RUNS_FOR_DISCIPLINE;
  return (
    <tr className={`border-b border-line/60 ${highlight ? 'bg-accent/5' : ''}`}>
      <td className="py-2.5 pr-3 font-mono text-ink-muted">{entry.rank}</td>
      <td className="py-2.5 pr-3">
        <Link href={`/leaderboard/${entry.userId}`} className={`hover:underline ${highlight ? 'font-medium text-accent' : ''}`}>
          {entry.displayName}
        </Link>
        {provisional && (
          <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
            provisional
          </span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono">{entry.score.toFixed(1)}</td>
      <td className="py-2.5 pr-3 text-right font-mono text-ink-muted">{entry.discipline.toFixed(0)}</td>
      <td className="py-2.5 pr-3 text-right font-mono text-ink-muted">{entry.lessonsDone}</td>
      <td className="py-2.5 pr-3 text-right font-mono text-ink-muted">{entry.streakLongest}d</td>
      <td className="py-2.5 pr-3 text-right font-mono text-ink-muted">{entry.runs}</td>
      <td
        className={`py-2.5 text-right font-mono text-xs ${
          entry.netPnl == null ? 'text-ink-faint' : entry.netPnl >= 0 ? 'text-up/60' : 'text-down/60'
        }`}
      >
        {entry.netPnl == null ? '—' : entry.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </td>
    </tr>
  );
}
