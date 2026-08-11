'use client';

/**
 * Filing a finished run, and being told honestly what it earned.
 *
 * This is where the XP rules meet the learner. Three things are deliberate:
 *
 *  1. THE REASON IS REQUIRED, AND IT IS THEIRS. The box is pre-filled with the
 *     theses they wrote before each entry — they already did this thinking, and
 *     asking them to type it twice would get a shrug the second time — but it
 *     stays editable, because the run is over and they now know things they did
 *     not when they wrote the first line.
 *
 *  2. EVERY GATE IS SHOWN, PASSED OR FAILED. A learner who earned nothing is
 *     owed the reason more than one who earned everything. "0 XP" on its own
 *     teaches nothing; "0 XP — two stops were moved" teaches the whole lesson.
 *
 *  3. THE SERVER DECIDES. The gates are evaluated in runXp() on the server from
 *     the submitted trade records. Nothing on this screen computes XP; it
 *     renders what came back.
 *
 * The verdict is deliberately NOT hidden behind a good result. Filing a run that
 * earns zero is the normal case early on, and it is the case worth reading.
 */
import { useState } from 'react';
import Link from 'next/link';
import type { TradeRecord } from '@/lib/progress/mastery';
import { MIN_REASON_CHARS } from '@/lib/progress/mastery';
import { useSession } from '@/components/auth/SessionProvider';

interface Verdict {
  xpAwarded: number;
  processScore: number;
  meanRR: number | null;
  notes: { gate: string; passed: boolean; detail: string }[];
  outcome: { netPnl: number; won: boolean; stoppedOut: boolean; wins: number; losses: number };
  /** Present exactly when the run earned nothing. Varied per run. */
  encouragement: string | null;
  totals: {
    xp: number;
    lessonXp: number;
    gameXp: number;
    netPnl: number;
    runs: number;
    wins: number;
    losses: number;
  };
}

export function RunSubmit({
  game,
  trades,
  pnl,
  accuracy,
  defaultReason = '',
}: {
  game: string;
  trades: TradeRecord[];
  pnl?: number;
  accuracy?: number;
  defaultReason?: string;
}) {
  const user = useSession();
  const [reason, setReason] = useState(defaultReason);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="mt-5 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-ink-muted">
        <Link href="/register" className="text-accent underline underline-offset-2">
          Create an account
        </Link>{' '}
        to file this run, earn XP for it, and have your reasoning read by other learners. Everything you have done so
        far is kept and merged in — nothing is lost by signing up later.
      </div>
    );
  }

  if (verdict) return <VerdictPanel verdict={verdict} optedIn={user.leaderboardOptIn} />;

  const short = reason.trim().length < MIN_REASON_CHARS;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/progress/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ game, trades, pnl, accuracy, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'The run could not be filed.');
      setVerdict(data as Verdict);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The run could not be filed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-line pt-5">
      <label className="block">
        <span className="text-sm text-ink-muted">
          What were you doing, and why? This is what other learners will read.
        </span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="input mt-2 resize-y"
          placeholder="e.g. Took the retest of the level that held twice before. Stop under the swing low, target the prior high, so about 2.4 to 1."
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className={`num text-[11px] ${short ? 'text-ink-faint' : 'text-up'}`}>
          {reason.trim().length}/{MIN_REASON_CHARS} characters
        </span>
        <button type="button" onClick={() => void submit()} disabled={busy || short} className="btn-primary">
          {busy ? 'Filing…' : 'File this run'}
        </button>
      </div>

      {short && (
        <p className="mt-2 text-[13px] text-ink-faint">
          A run with no stated reason cannot be graded on reasoning, and cannot teach anybody else anything. Say what
          you were trying to do, where you were getting out, and what would have told you that you were wrong.
        </p>
      )}
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </div>
  );
}

const money = (n: number) =>
  `${n < 0 ? '−' : '+'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

function VerdictPanel({ verdict, optedIn }: { verdict: Verdict; optedIn: boolean }) {
  const earned = verdict.xpAwarded > 0;
  const { outcome, totals } = verdict;

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`num text-2xl ${earned ? 'text-accent' : 'text-ink-faint'}`}>+{verdict.xpAwarded} XP</span>
        <span className="num text-sm text-ink-faint">
          process {verdict.processScore.toFixed(1)}
          {verdict.meanRR != null && ` · planned ${verdict.meanRR.toFixed(2)}:1`}
        </span>
        <span className={`num ml-auto text-sm ${outcome.netPnl >= 0 ? 'text-up' : 'text-down'}`}>
          {money(outcome.netPnl)}
        </span>
      </div>

      {/* The encouragement comes BEFORE the gate list on a run that earned
          nothing. The gates are useful and they are also a column of red
          crosses; the first thing somebody reads after a stop-out should not
          be that. */}
      {verdict.encouragement && (
        <p className="mt-4 rounded-lg border-l-2 border-accent bg-surface-2 px-4 py-3 text-sm leading-relaxed">
          {verdict.encouragement}
        </p>
      )}

      <p className="mt-3 max-w-prose text-[13px] text-ink-muted">
        {earned
          ? 'The plan cleared every gate and it paid. The bonus above the base comes from your process score and how much reward the plan asked for — not from how large the win was.'
          : 'No XP for this run. Everything below is about the decision except the last line, which is about the result.'}
      </p>

      <ul className="mt-4 space-y-2">
        {verdict.notes.map((n) => (
          <li key={n.gate} className="flex gap-3">
            <span
              aria-hidden
              className={`num mt-0.5 shrink-0 text-sm ${n.passed ? 'text-up' : 'text-down'}`}
            >
              {n.passed ? '✓' : '✕'}
            </span>
            <div className="min-w-0">
              <span className="text-sm">{n.gate}</span>
              <span className="sr-only">{n.passed ? ' — passed' : ' — failed'}</span>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{n.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* The running record. Kept whichever way each run went — a learner is
          entitled to know what their decisions actually cost, and a scoreboard
          that only accumulated the good runs would be a broker's marketing
          page. */}
      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-4 text-xs">
        <Total label="Total XP" value={totals.xp.toLocaleString('en-IN')} />
        <Total label="From games" value={totals.gameXp.toLocaleString('en-IN')} />
        <Total label="Runs" value={`${totals.runs}`} />
        <Total label="Won / lost" value={`${totals.wins} / ${totals.losses}`} />
        <Total
          label="Net P&L"
          value={money(totals.netPnl)}
          tone={totals.netPnl >= 0 ? 'up' : 'down'}
        />
      </dl>

      <p className="mt-4 text-[13px] text-ink-faint">
        {optedIn ? (
          <>
            Your reasoning is now on the{' '}
            <Link href="/reasons" className="text-accent underline underline-offset-2">
              reasoning feed
            </Link>
            , where other learners can read it and disagree with you.
          </>
        ) : (
          <>
            This stays private. Turn on the leaderboard from your{' '}
            <Link href="/account" className="text-accent underline underline-offset-2">
              account page
            </Link>{' '}
            if you want your reasoning to be readable by others.
          </>
        )}
      </p>
    </div>
  );
}

function Total({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className={`num mt-0.5 ${tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}
