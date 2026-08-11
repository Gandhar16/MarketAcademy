'use client';

/**
 * Other people's reasoning.
 *
 * Everything else on this site tells you what to think about a decision. This
 * page shows you what somebody else actually thought, in their words, next to
 * the numbers that describe the decision — planned reward-to-risk, process
 * score, and whether it cleared the XP gates.
 *
 * Two rules in the presentation:
 *
 *  1. The reasoning is the headline and gets the most space. The metrics are a
 *     strip underneath it. If the numbers were on top people would sort by them
 *     with their eyes and never read a word.
 *  2. P&L is last, small and grey, exactly as on the leaderboard. A run with
 *     careful reasoning and a loss is the most useful card on this page, and it
 *     has to be possible to see that it lost.
 *
 * Reason text is rendered through React as a string — never dangerouslySet.
 * It is learner-supplied and arrives already stripped of angle brackets by the
 * API, so this is belt and braces on purpose.
 */
import { useEffect, useMemo, useState } from 'react';
import type { ReasonEntry } from '@/lib/db/reasons';
import { MIN_PLANNED_RR } from '@/lib/progress/mastery';
import { GAME_CATALOGUE } from '@/lib/games/catalogue';

const GAME_NAMES = new Map(GAME_CATALOGUE.map((g) => [g.slug, g.name]));

type Filter = { only: 'recent' | 'exemplary'; game: string | null };

export function ReasonFeed({ initial }: { initial: ReasonEntry[] }) {
  const [filter, setFilter] = useState<Filter>({ only: 'recent', game: null });
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (filter.only === 'exemplary') p.set('only', 'exemplary');
    if (filter.game) p.set('game', filter.game);
    return p.toString();
  }, [filter]);

  const isDefault = query === '';

  /**
   * The fetched page is stored WITH the query it answers. That one extra field
   * removes the need to flip a loading flag and clear the list on every filter
   * change: "loading" is simply "what I am holding does not answer what I am
   * asking", which cannot get out of step with reality the way a flag can.
   */
  const [result, setResult] = useState<{ query: string; entries: ReasonEntry[] } | null>(null);

  useEffect(() => {
    if (isDefault) return;
    let live = true;
    fetch(`/api/reasons?${query}`)
      .then((r) => r.json())
      .then((d: { entries?: ReasonEntry[] }) => {
        if (!live) return;
        setError(null);
        setResult({ query, entries: d.entries ?? [] });
      })
      .catch(() => {
        if (live) setError('Could not load the feed. Try again in a moment.');
      });
    return () => {
      live = false;
    };
  }, [query, isDefault]);

  const entries = isDefault ? initial : (result?.query === query ? result.entries : []);
  const loading = !isDefault && result?.query !== query && error === null;

  const games = useMemo(() => [...new Set(initial.map((e) => e.game))], [initial]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={filter.only === 'recent'}
          onClick={() => setFilter((f) => ({ ...f, only: 'recent' }))}
          label="Most recent"
        />
        <FilterChip
          active={filter.only === 'exemplary'}
          onClick={() => setFilter((f) => ({ ...f, only: 'exemplary' }))}
          label="Cleared every gate"
        />
        {games.length > 1 && (
          <>
            <span aria-hidden className="hidden text-ink-faint sm:inline">
              ·
            </span>
            <FilterChip active={filter.game === null} onClick={() => setFilter((f) => ({ ...f, game: null }))} label="All games" />
            {games.map((g) => (
              <FilterChip
                key={g}
                active={filter.game === g}
                onClick={() => setFilter((f) => ({ ...f, game: g }))}
                label={GAME_NAMES.get(g) ?? g}
              />
            ))}
          </>
        )}
      </div>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {entries.length === 0 && !loading && !error ? (
        <p className="mt-8 rounded-card border border-line bg-surface px-4 py-10 text-center text-sm text-ink-muted">
          Nothing here yet. Reasoning appears once a learner who has opted in to the leaderboard finishes a run and
          writes down what they were doing.
        </p>
      ) : (
        <ul className={`mt-6 space-y-3 ${loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}`}>
          {entries.map((e) => (
            <ReasonCard key={e.id} entry={e} />
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs leading-relaxed text-ink-faint">
        Only learners who have opted in to the leaderboard appear here, and only runs that carry a written reason. A run
        earns XP when it clears every gate: a stated reason, a planned reward-to-risk of at least {MIN_PLANNED_RR}:1,
        no oversized risk, no abandoned stops. Profit is not one of the gates and is not shown first, because from the
        outside a lucky decision and a good one produce the same number — and only one of them is worth copying.
      </p>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors sm:text-sm ${
        active ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function ReasonCard({ entry }: { entry: ReasonEntry }) {
  const rrOk = entry.plannedRR != null && entry.plannedRR >= MIN_PLANNED_RR;

  return (
    <li className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-ink-faint">
        <span className="font-medium text-ink-muted">{entry.displayName}</span>
        <span aria-hidden>·</span>
        <span>{GAME_NAMES.get(entry.game) ?? entry.game}</span>
        <span aria-hidden>·</span>
        <time dateTime={new Date(entry.playedAt).toISOString()}>{relative(entry.playedAt)}</time>
        {entry.xpAwarded > 0 && (
          <span className="num ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
            +{entry.xpAwarded} xp
          </span>
        )}
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{entry.reason}</p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3 text-xs">
        <Metric
          label="Planned R:R"
          value={entry.plannedRR == null ? 'none set' : `${entry.plannedRR.toFixed(2)}:1`}
          tone={entry.plannedRR == null ? 'warn' : rrOk ? 'good' : 'warn'}
        />
        <Metric label="Process" value={entry.processScore.toFixed(1)} tone={entry.processScore >= 60 ? 'good' : 'warn'} />
        <Metric label="Trades" value={String(entry.trades)} />
        <Metric
          label="P&L"
          value={entry.pnl == null ? '—' : entry.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          tone="faint"
        />
      </dl>
    </li>
  );
}

function Metric({ label, value, tone = 'plain' }: { label: string; value: string; tone?: 'good' | 'warn' | 'faint' | 'plain' }) {
  const colour =
    tone === 'good' ? 'text-up' : tone === 'warn' ? 'text-down' : tone === 'faint' ? 'text-ink-faint' : 'text-ink-muted';
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className={`num mt-0.5 ${colour}`}>{value}</dd>
    </div>
  );
}

function relative(ms: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
