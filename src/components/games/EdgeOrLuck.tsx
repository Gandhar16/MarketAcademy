'use client';

/**
 * Edge or Luck — can you tell a real record from a coin flip?
 *
 * The design constraint, same as Bias Buster: the learner must COMMIT before
 * anything is revealed. Being shown that twelve trades prove nothing changes
 * nothing. Calling a record "a real edge", and then being told the computer
 * generated it with a coin, is what makes the point land.
 *
 * The second half is what makes it more than a quiz. It runs the identical test
 * on the learner's own filed runs and reports how many more they would need
 * before their own record could be told apart from chance. That number is
 * almost always much larger than they expect, and it is the whole reason the
 * game exists — SEBI found more than 75% of loss-making traders kept going
 * after consecutive losing years, which is what happens when a person cannot
 * read their own sample.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ANSWER_LABELS,
  MIN_TRADES_FOR_A_VERDICT,
  TRACK_RECORDS,
  assess,
  assessOwnRuns,
  type Answer,
  type Assessment,
  type TrackRecord,
} from '@/lib/games/edge';
import { useSession } from '@/components/auth/SessionProvider';
import type { TradeRecord } from '@/lib/progress/mastery';
import { RunSubmit } from './RunSubmit';

const ANSWERS: Answer[] = ['edge', 'no-edge', 'unproven'];

export function EdgeOrLuck() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Answer | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedAsProven, setMissedAsProven] = useState(0);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [finished, setFinished] = useState(false);

  const record = TRACK_RECORDS[index];
  const stats = assess(record.trades, 1);

  function choose(answer: Answer) {
    if (picked) return;
    setPicked(answer);
    if (answer === record.correct) setCorrectCount((c) => c + 1);
    // Tracked separately because it is the dangerous error. Calling an
    // unreadable record "a real edge" is how people size up on noise; the
    // opposite mistake only costs them an opportunity.
    if (answer === 'edge' && record.correct !== 'edge') setMissedAsProven((m) => m + 1);

    setTrades((t) => [
      ...t,
      {
        preCommitted: true,
        riskFraction: 0,
        honouredStop: true,
        exitedPerPlan: true,
        pnl: 0,
        sizedFromStop: false,
        plannedRR: null,
        stoppedOut: false,
      },
    ]);
  }

  function next() {
    if (index + 1 >= TRACK_RECORDS.length) setFinished(true);
    else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  }

  if (finished) {
    return (
      <Results
        correct={correctCount}
        total={TRACK_RECORDS.length}
        missedAsProven={missedAsProven}
        trades={trades}
        onReset={() => {
          setIndex(0);
          setPicked(null);
          setCorrectCount(0);
          setMissedAsProven(0);
          setTrades([]);
          setFinished(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-ink-faint">
        <span>
          Record {index + 1} of {TRACK_RECORDS.length}
        </span>
        <span className="num">
          {correctCount} right so far
        </span>
      </div>

      <div className="rounded-xl border border-line bg-surface-2 p-5">
        <p className="text-[15px] leading-relaxed text-ink">{record.claim}</p>
        <p className="mt-2 text-sm text-ink-muted">{record.context}</p>

        <EquityCurve curve={stats.curve} />

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Stat label="Trades" value={String(stats.n)} />
          <Stat label="Win rate" value={`${Math.round(stats.winRate * 100)}%`} />
          <Stat label="Total" value={`${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(1)}R`} />
          <Stat label="Worst fall" value={`−${stats.maxDrawdownR.toFixed(1)}R`} />
        </dl>
      </div>

      {!picked ? (
        <div className="space-y-2">
          <p className="text-sm text-ink-muted">Is there enough here to say this trader has an edge?</p>
          {ANSWERS.map((answer) => (
            <button
              key={answer}
              onClick={() => choose(answer)}
              className="block w-full rounded-lg border border-line bg-surface px-4 py-3 text-left text-sm text-ink transition-colors hover:border-accent-dim hover:bg-surface-2"
            >
              {ANSWER_LABELS[answer]}
            </button>
          ))}
        </div>
      ) : (
        <Reveal record={record} stats={stats} picked={picked} onNext={next} last={index + 1 === TRACK_RECORDS.length} />
      )}
    </div>
  );
}

function Reveal({
  record,
  stats,
  picked,
  onNext,
  last,
}: {
  record: TrackRecord;
  stats: Assessment;
  picked: Answer;
  onNext: () => void;
  last: boolean;
}) {
  const right = picked === record.correct;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: right ? 'var(--color-up)' : 'var(--color-down)',
          background: right ? 'color-mix(in srgb, var(--color-up) 10%, transparent)' : 'color-mix(in srgb, var(--color-down) 10%, transparent)',
        }}
      >
        <div className="text-[11px] uppercase tracking-wider" style={{ color: right ? 'var(--color-up)' : 'var(--color-down)' }}>
          {right ? 'Correct' : 'Not quite'}
        </div>
        <p className="mt-1 text-sm text-ink">
          The answer was <strong>{ANSWER_LABELS[record.correct].toLowerCase()}</strong>.
          {!right && <> You said {ANSWER_LABELS[picked].toLowerCase()}.</>}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{record.explanation}</p>

        <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-[13px] leading-relaxed text-ink-muted">
            {/* The number the whole game turns on, stated the same way every time. */}
            Chance alone produces a record at least this good{' '}
            <strong className="num text-ink">{(stats.pValue * 100).toFixed(0)}%</strong> of the time.{' '}
            {stats.n < MIN_TRADES_FOR_A_VERDICT ? (
              <>
                With only {stats.n} trades, nothing here could have been called either way — {MIN_TRADES_FOR_A_VERDICT} is
                the fewest this site will draw any conclusion from.
              </>
            ) : stats.tradesNeeded == null ? (
              <>It is losing money, so no number of further trades turns it into evidence of an edge.</>
            ) : stats.significant ? (
              <>That is low enough to take seriously.</>
            ) : (
              <>
                Carrying on exactly like this, it would take about{' '}
                <strong className="num text-ink">{stats.tradesNeeded}</strong> trades before the record proved anything.
              </>
            )}
          </p>
        </div>
      </div>

      <button onClick={onNext} className="btn-primary w-full justify-center">
        {last ? 'See your results' : 'Next record'}
      </button>
    </div>
  );
}

function Results({
  correct,
  total,
  missedAsProven,
  trades,
  onReset,
}: {
  correct: number;
  total: number;
  missedAsProven: number;
  trades: TradeRecord[];
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
        <div className="text-[11px] uppercase tracking-wider text-accent">Results</div>
        <div className="num mt-2 text-3xl">
          {correct}
          <span className="text-lg text-ink-faint">/{total}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {missedAsProven > 0 ? (
            <>
              You called <strong className="text-ink">{missedAsProven}</strong>{' '}
              {missedAsProven === 1 ? 'record' : 'records'} a real edge when the numbers could not support it. That is
              the expensive direction to be wrong in — it is the mistake that gets money sized up on noise. Being too
              slow to believe in an edge only costs you an opportunity; being too quick costs you the account.
            </>
          ) : (
            <>
              You did not once call a record proven when it was not. That restraint is the entire skill here — three of
              these six could not be called by anybody, and knowing when to say so is worth more than any pattern.
            </>
          )}
        </p>
      </div>

      <OwnRecord />

      <RunSubmit
        game="edge-or-luck"
        trades={trades}
        accuracy={total === 0 ? 0 : correct / total}
        defaultReason="What I was going on when I judged each record."
      />

      <button
        onClick={onReset}
        className="w-full rounded-lg border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        Play again
      </button>
    </div>
  );
}

/**
 * The mirror.
 *
 * Signed out, this is an invitation rather than an error — the whole site works
 * without an account, and a wall here would be the least welcome place to put
 * one.
 */
function OwnRecord() {
  const user = useSession();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [pnls, setPnls] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/progress/runs')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then((data: { runs: { pnl: number }[] }) => {
        if (cancelled) return;
        setPnls(data.runs.map((r) => r.pnl));
        setState('ready');
      })
      .catch(() => !cancelled && setState('failed'));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <Panel>
        <p className="text-sm leading-relaxed text-ink-muted">
          The same test can be run on your own record.{' '}
          <Link href="/register" className="text-accent underline underline-offset-2">
            Create an account
          </Link>{' '}
          and every run you file gets measured the way these six just were.
        </p>
      </Panel>
    );
  }

  if (state === 'loading') return <Panel><p className="text-sm text-ink-faint">Reading your record…</p></Panel>;
  if (state === 'failed') return null;

  const own = assessOwnRuns(pnls);

  if (!own) {
    return (
      <Panel>
        <p className="text-sm leading-relaxed text-ink-muted">
          You have filed <strong className="num text-ink">{pnls.length}</strong>{' '}
          {pnls.length === 1 ? 'run' : 'runs'}. That is not enough to say anything at all about them — which is itself
          worth sitting with, because it is roughly the amount of evidence most people start a strategy on.
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">Now your own record</div>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Stat label="Runs filed" value={String(own.n)} />
        <Stat label="Win rate" value={`${Math.round(own.winRate * 100)}%`} />
        <Stat label="Average" value={`${own.meanR >= 0 ? '+' : ''}${own.meanR.toFixed(2)}R`} />
        <Stat label="By chance" value={`${(own.pValue * 100).toFixed(0)}%`} />
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        {own.n < MIN_TRADES_FOR_A_VERDICT ? (
          <>
            {own.n} runs is below the {MIN_TRADES_FOR_A_VERDICT} this site will draw any conclusion from, so this says
            nothing about whether you are good at it yet — in either direction.{' '}
            {own.meanR > 0
              ? 'You are ahead, and that is genuinely worth nothing as evidence so far.'
              : 'You are behind, and that is equally uninformative. It is far too early to conclude you cannot do this.'}
          </>
        ) : own.significant ? (
          <>
            Over {own.n} runs, chance produces a record this good about {(own.pValue * 100).toFixed(0)}% of the time.
            That is a real result. It is measured on games, against historical data, with no money and no fear — so it
            is evidence you can make decisions, not evidence you can trade.
          </>
        ) : own.tradesNeeded == null ? (
          <>
            Over {own.n} runs you are behind on average. That is not a verdict on you — it is what practice looks like
            while it is still practice. What it does rule out is the idea that you have found something and should now
            size up.
          </>
        ) : (
          <>
            Over {own.n} runs, chance produces a record this good about {(own.pValue * 100).toFixed(0)}% of the time —
            so it does not yet mean anything. Carrying on exactly as you are, it would take roughly{' '}
            <strong className="num text-ink">{own.tradesNeeded}</strong> runs before it did. Most people conclude they
            have an edge, or that they do not, after about a tenth of that.
          </>
        )}
      </p>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-surface-2 p-5">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="num mt-0.5 text-lg text-ink">{value}</dd>
    </div>
  );
}

/**
 * The curve, in R rather than rupees.
 *
 * Not a price chart — this is the running total of a made-up trader's results,
 * which PLAN.md §7.1 permits precisely because it is not being presented as
 * market data. Drawn from zero so the shape is honest: a curve auto-scaled to
 * its own minimum can make a losing record look like a rising one.
 */
function EquityCurve({ curve }: { curve: number[] }) {
  const width = 640;
  const height = 120;
  const points = [0, ...curve];
  const high = Math.max(0, ...points);
  const low = Math.min(0, ...points);
  const span = high - low || 1;

  const x = (i: number) => (i / (points.length - 1)) * width;
  const y = (v: number) => height - ((v - low) / span) * height;

  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const up = points[points.length - 1] >= 0;
  const colour = up ? 'var(--color-up)' : 'var(--color-down)';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 w-full"
      style={{ height }}
      role="img"
      aria-label={`Running total over ${curve.length} trades, ending ${points[points.length - 1].toFixed(1)}R`}
    >
      {/* Break-even, so a curve that never got above water cannot pretend it did. */}
      <line x1={0} y1={y(0)} x2={width} y2={y(0)} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="4 4" />
      <path d={`${path} L${width},${y(low)} L0,${y(low)} Z`} fill={colour} fillOpacity={0.1} />
      <path d={path} fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}
