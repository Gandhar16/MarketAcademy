'use client';

/**
 * Bias Buster — you fall for it, then it is explained.
 *
 * The design constraint that makes this work: the learner must ANSWER before
 * anything is revealed, and the app then tells them whether they picked the
 * trap. Reading a list of cognitive biases changes nothing. Watching yourself
 * pick the wrong one, having been warned that this is a bias test, is what
 * makes the point land.
 */
import { useState } from 'react';
import { BIAS_SCENARIOS } from '@/lib/games/scenarios';

export function BiasBuster() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [trapped, setTrapped] = useState<string[]>([]);
  const [correct, setCorrect] = useState<string[]>([]);

  const scenario = BIAS_SCENARIOS[index];
  const finished = index >= BIAS_SCENARIOS.length;

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === scenario.correctIndex) setCorrect((c) => [...c, scenario.id]);
    else if (i === scenario.trapIndex) setTrapped((t) => [...t, scenario.bias]);
  };

  if (finished) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
          <div className="text-[11px] uppercase tracking-wider text-accent">Results</div>
          <div className="num mt-2 text-3xl">
            {correct.length}
            <span className="text-lg text-ink-faint">/{BIAS_SCENARIOS.length}</span>
          </div>
          {trapped.length > 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              You took the common trap on{' '}
              <strong className="text-ink">{trapped.join(', ')}</strong>. That is not a failing — these are the default
              settings of a human brain, and knowing which ones are yours is most of the defence. The one that costs
              retail traders the most money is the disposition effect, and it is the one nearly everybody fails.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              You avoided every trap. Worth noting that you knew this was a bias test — the same questions inside a
              real position, with real money and a real clock, are considerably harder.
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setTrapped([]);
            setCorrect([]);
          }}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-ground"
        >
          Run it again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {BIAS_SCENARIOS.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i <= index ? 'var(--color-accent)' : 'var(--color-line)' }}
          />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-[15px] leading-relaxed">{scenario.prompt}</p>

        <div className="mt-5 space-y-2">
          {scenario.options.map((opt, i) => {
            const isAnswer = picked !== null && i === scenario.correctIndex;
            const isTrap = picked !== null && i === scenario.trapIndex && i !== scenario.correctIndex;
            const isPicked = picked === i;
            return (
              <button
                key={opt}
                onClick={() => choose(i)}
                disabled={picked !== null}
                className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default"
                style={{
                  borderColor: isAnswer
                    ? 'var(--color-up)'
                    : isTrap
                      ? 'var(--color-down)'
                      : isPicked
                        ? 'var(--color-accent)'
                        : 'var(--color-line)',
                  background: isPicked ? 'var(--color-surface-2)' : 'transparent',
                }}
              >
                <span className="num text-ink-faint">{String.fromCharCode(65 + i)}</span>
                <span className={isAnswer ? 'text-up' : 'text-ink-muted'}>{opt}</span>
                {isTrap && <span className="num ml-auto text-[10px] uppercase text-down">most common answer</span>}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="text-[11px] uppercase tracking-wider text-accent">{scenario.bias}</div>
            <p className="mt-2 leading-relaxed text-ink-muted">{scenario.reveal}</p>
            <button
              onClick={() => {
                setIndex((n) => n + 1);
                setPicked(null);
              }}
              className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ground"
            >
              {index === BIAS_SCENARIOS.length - 1 ? 'See results' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
