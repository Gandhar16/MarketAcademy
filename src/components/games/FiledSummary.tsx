'use client';

/**
 * A receipt, not a form. Every trade/round in the session above was already
 * filed under the learner's name the instant it closed — see fileTrade.ts —
 * so there is nothing left to submit here, only to report.
 */
import Link from 'next/link';
import { MIN_PLANNED_RR, MIN_REASON_CHARS } from '@/lib/progress/mastery';
import type { FiledTrade } from '@/lib/progress/fileTrade';

const money = (n: number) => `${n < 0 ? '−' : '+'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

export function FiledSummary({
  filed,
  tradeCount,
  signedIn,
  noun = 'trade',
}: {
  filed: FiledTrade[];
  tradeCount: number;
  signedIn: boolean;
  /** "trade" | "round" | "position" — whatever this game calls one closed unit. */
  noun?: string;
}) {
  if (!signedIn) {
    return (
      <div className="mt-5 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-ink-muted">
        <Link href="/register" className="text-accent underline underline-offset-2">
          Create an account
        </Link>{' '}
        and every {noun} you close will be filed under your name — XP, reasoning feed and leaderboard — the instant
        it closes, not just kept on this screen.
      </div>
    );
  }

  const totalXp = filed.reduce((s, f) => s + f.xp, 0);
  const totalPnl = filed.reduce((s, f) => s + f.pnl, 0);
  const plural = tradeCount === 1 ? noun : `${noun}s`;

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`num text-2xl ${totalXp > 0 ? 'text-accent' : 'text-ink-faint'}`}>+{totalXp} XP</span>
        <span className="num text-sm text-ink-faint">
          {filed.length} of {tradeCount} {plural} filed
        </span>
        <span className={`num ml-auto text-sm ${totalPnl >= 0 ? 'text-up' : 'text-down'}`}>{money(totalPnl)}</span>
      </div>
      <p className="mt-2 text-[13px] text-ink-muted">
        Each {noun} above was filed under your name — scored, banked, and put on the{' '}
        <Link href="/reasons" className="text-accent underline underline-offset-2">
          reasoning feed
        </Link>{' '}
        (if you have opted in) — the instant it closed. Nothing left to submit.
      </p>
      {filed.some((f) => f.xp === 0) && (
        <p className="mt-2 text-[13px] text-ink-faint">
          At least one {noun} earned no XP — usually a stated reason under {MIN_REASON_CHARS} characters, or a
          reward-to-risk below {MIN_PLANNED_RR}:1. The P&L still banked either way.
        </p>
      )}
      {filed.length < tradeCount && (
        <p className="mt-2 text-[13px] text-danger">
          {tradeCount - filed.length} {tradeCount - filed.length === 1 ? noun : `${noun}s`} closed but could not be
          filed — most likely a dropped connection. The P&L is still banked; only the XP and reasoning entry are
          missing.
        </p>
      )}
    </div>
  );
}
