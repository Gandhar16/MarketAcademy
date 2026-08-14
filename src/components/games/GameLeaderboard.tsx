'use client';

/**
 * The board for one game, shown beside it — not on a separate page reached
 * only by deliberate navigation. The point is the moment right after filing
 * a run: the verdict panel is already on screen, and "did that beat anyone"
 * should be answerable by glancing right, not by leaving the game.
 *
 * Ranked on process score, same as every other board on this site (PLAN.md
 * §7 rule 4) — this is not a different, P&L-flavoured leaderboard for games,
 * it is the same one, filtered to one game.
 */
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { GameBoardEntry } from '@/lib/db/leaderboard';
import { MIN_RUNS_FOR_DISCIPLINE } from '@/lib/db/leaderboard';

export function GameLeaderboard({ entries, you }: { entries: GameBoardEntry[]; you: GameBoardEntry | null }) {
  const reduceMotion = useReducedMotion();
  const onPage = you != null && entries.some((e) => e.userId === you.userId);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h2 className="text-[11px] uppercase tracking-wider text-ink-faint">Leaderboard, this game</h2>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Nobody has {MIN_RUNS_FOR_DISCIPLINE}+ opted-in runs here yet. File one and you are the first name on it.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {entries.map((e, i) => (
            <motion.li
              key={e.userId}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : i * 0.035, ease: [0.16, 1, 0.3, 1] }}
            >
              <Entry entry={e} highlight={you?.userId === e.userId} />
            </motion.li>
          ))}
        </ul>
      )}

      {you && !onPage && (
        <div className="mt-3 border-t border-line pt-3">
          <Entry entry={you} highlight />
          <p className="mt-1.5 text-[11px] text-ink-faint">
            Off the visible list — file {MIN_RUNS_FOR_DISCIPLINE} runs here for it to count at full weight.
          </p>
        </div>
      )}

      <Link
        href="/leaderboard"
        className="mt-4 block text-center text-[11px] uppercase tracking-wider text-ink-faint underline underline-offset-2 transition-colors hover:text-ink"
      >
        Full leaderboard →
      </Link>
    </div>
  );
}

function Entry({ entry, highlight }: { entry: GameBoardEntry; highlight?: boolean }) {
  const provisional = entry.runs < MIN_RUNS_FOR_DISCIPLINE;
  return (
    <div
      className={`flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
        highlight ? 'bg-accent/10 text-accent' : 'text-ink-muted'
      }`}
    >
      <span className="num w-5 shrink-0 text-right">{entry.rank}</span>
      <span className={`min-w-0 flex-1 truncate ${highlight ? 'font-medium' : 'text-ink'}`}>{entry.displayName}</span>
      {provisional && (
        <span className="shrink-0 rounded bg-surface-2 px-1 py-0.5 text-[9px] uppercase tracking-wide text-ink-faint">
          provisional
        </span>
      )}
      <span className="num shrink-0">{entry.processScore.toFixed(0)}</span>
      {/* Shown for interest, same greyed-and-unranked treatment as the global board — this game's process score is what determines `rank`, not this. */}
      <span
        className={`num w-16 shrink-0 text-right text-[11px] ${
          entry.netPnl == null ? 'text-ink-faint' : entry.netPnl >= 0 ? 'text-up/60' : 'text-down/60'
        }`}
        title="Net P&L in this game — shown for interest, not ranked"
      >
        {entry.netPnl == null ? '—' : entry.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}
