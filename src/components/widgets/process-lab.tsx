'use client';

/**
 * ProcessNotOutcomeLab — the Stage-1-safe sibling of the Bias Buster game.
 *
 * Reuses the SAME interaction mechanism as `BiasBuster`
 * (`src/components/games/BiasBuster.tsx`): answer before anything is
 * revealed, then the app tells you whether you graded the DECISION or
 * quietly graded the outcome instead. Deliberately a lesson-scoped widget
 * rather than a new catalogue game — it does not touch the game registry, XP
 * gates, or leaderboard, since this lesson only needs the mechanic, not a
 * new scored activity.
 *
 * The scenario set is built so that a disciplined LOSING decision scores full
 * credit and a reckless WINNING one scores none — the entire point being that
 * grading follows the process at the moment of decision, never the result.
 */
import { useState } from 'react';
import { useSequentialScenarios } from '@/lib/hooks/useSequentialScenarios';

interface Scenario {
  id: string;
  prompt: string;
  options: [string, string];
  /** Index of the option that correctly grades the PROCESS, not the outcome. */
  correctIndex: number;
  flaw: string;
  reveal: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'diversified-drawdown',
    prompt:
      'An investor researches a broad, diversified set of holdings, decides in advance to hold for years, and sticks to that plan through a rough year. After twelve months the holdings are down 12%.',
    options: ['Sound process — the plan was followed', 'A process flaw — a loss like that should not happen'],
    correctIndex: 0,
    flaw: 'none — this is the disciplined-but-losing case',
    reveal:
      'Sound process. A reasoned, long-horizon plan does not make the outcome certain — uncertainty is part of the definition of investing, not a sign something went wrong. A loss that arrives despite a sound process is the cost of taking a real risk, not evidence of a mistake.',
  },
  {
    id: 'concentrated-tip',
    prompt:
      'A trader puts most of their capital into a single small company after seeing a tip online, with no limit set for how much they are willing to lose. The position happens to double.',
    options: ['A process flaw — a lucky result does not fix it', 'Sound process — the result speaks for itself'],
    correctIndex: 0,
    flaw: 'extreme concentration, no pre-committed loss limit',
    reveal:
      'A process flaw, and the doubling does not change that. Betting most of your capital on one idea with no pre-set limit on the downside is the same decision whether it doubles or is wiped out — only the outcome differs, and outcome is exactly what this is not supposed to be graded on.',
  },
  {
    id: 'chasing-losses',
    prompt: 'After a trade loses money, an investor increases the size of the next position specifically to "win it back faster".',
    options: ['A process flaw — this is chasing losses', 'Sound process — making up a loss quickly is reasonable'],
    correctIndex: 0,
    flaw: 'chasing losses, raising risk to recover',
    reveal:
      'A process flaw. Raising the size of a bet specifically because of a prior loss — chasing it — has nothing to do with the new decision\'s own merits. It is a reaction to a feeling, not a reasoned choice, and it tends to compound a loss rather than recover it.',
  },
  {
    id: 'win-streak-skill',
    prompt:
      'After three wins in a row, a trader concludes they have "figured out the market" and starts sizing positions much larger, without changing anything else about how they decide.',
    options: ['A process flaw — a streak is not proof of skill', 'Sound process — three wins is a real track record'],
    correctIndex: 0,
    flaw: 'treating a win as proof of skill',
    reveal:
      'A process flaw. Three wins can easily happen by chance alone, and treating them as proof of skill — then sizing up on that belief — is a common route to a single large loss undoing all three gains. Nothing about the DECISION process changed; only the confidence did.',
  },
  {
    id: 'disciplined-stop',
    prompt:
      'A trader takes a short-horizon position, having decided in advance exactly how much they are willing to lose. The position loses that exact, pre-set amount, and they exit as planned.',
    options: ['Sound process — the plan was followed, win or lose', 'A process flaw — losing money is always a mistake'],
    correctIndex: 0,
    flaw: 'none — this is the disciplined-but-losing trading case',
    reveal:
      'Sound process. Trading on a shorter horizon is not itself gambling-like — it can be entirely disciplined, and a loss that matches the plan exactly is the plan working, not failing. Confusing "lost money" with "poor decision" is the single most common error in judging any of this.',
  },
  {
    id: 'no-limit-averaging',
    prompt:
      'An investor keeps adding more money to a losing position, hoping it recovers, without ever having decided in advance how much they were willing to lose in total.',
    options: ['A process flaw — no pre-committed loss limit', 'Sound process — buying more while it is cheaper is reasonable'],
    correctIndex: 0,
    flaw: 'no pre-committed loss limit',
    reveal:
      'A process flaw. Adding to a loser can be a reasoned decision when a limit was set in advance and this fits inside it. Adding with no limit at all, purely on hope, is different — there is no point at which the plan would say stop, which is exactly what a pre-committed limit exists to provide.',
  },
];

export function ProcessNotOutcomeLab() {
  const [scored, setScored] = useState<{ id: string; right: boolean }[]>([]);
  const { index, picked, current, finished, total, choose: pick, next, reset } = useSequentialScenarios(SCENARIOS);

  const choose = (i: number) => {
    pick(i, (choiceIndex, item) => {
      setScored((s) => [...s, { id: item.id, right: choiceIndex === item.correctIndex }]);
    });
  };

  if (finished) {
    const rightCount = scored.filter((s) => s.right).length;
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">Process, not outcome — results</div>
        <div className="num mt-2 text-3xl text-ink">
          {rightCount}
          <span className="text-lg text-ink-faint">/{total}</span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          Two of these six described a loss that came from a sound, disciplined process. One described a win that came
          from a reckless one. If you graded by what happened rather than by the decision, that is exactly the trap
          this lab exists to show you falling into.
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            setScored([]);
          }}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis"
        >
          Run it again
        </button>
      </div>
    );
  }

  const scenario = current as Scenario;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex gap-1">
        {SCENARIOS.map((s, i) => (
          <div
            key={s.id}
            aria-hidden
            className="h-1 flex-1 rounded-full"
            style={{ background: i <= index ? 'var(--color-accent)' : 'var(--color-line)' }}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-faint">
        Scenario {index + 1} of {total}
      </p>

      <p className="mt-3 text-[15px] leading-relaxed">{scenario.prompt}</p>

      <div className="mt-4 space-y-2" role="group" aria-label="Was this a sound process or a process flaw?">
        {scenario.options.map((opt, i) => {
          const isCorrect = picked !== null && i === scenario.correctIndex;
          const isWrongPick = picked === i && i !== scenario.correctIndex;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default"
              style={{
                borderColor: isCorrect ? 'var(--color-up)' : isWrongPick ? 'var(--color-down)' : 'var(--color-line)',
                background: picked === i ? 'var(--color-surface-2)' : 'transparent',
                color: 'var(--color-ink)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="mt-4 border-t border-line pt-4" aria-live="polite">
          <p className="text-[13px] leading-relaxed text-ink-muted">{scenario.reveal}</p>
          <button
            type="button"
            onClick={next}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis"
          >
            {index === SCENARIOS.length - 1 ? 'See results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
