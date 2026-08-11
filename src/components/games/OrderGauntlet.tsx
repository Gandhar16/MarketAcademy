'use client';

/**
 * Order Gauntlet — trains order-type selection under time pressure.
 *
 * The timer matters. Given unlimited time everyone reasons their way to the
 * right answer; the mistakes that cost money happen in fifteen seconds with the
 * price moving. Running out of time counts as a wrong answer, deliberately.
 *
 * Every wrong choice shows what it would ACTUALLY have cost, which is the part
 * that makes it stick.
 */
import { useEffect, useMemo, useState } from 'react';
import { GAUNTLET_SCENARIOS, type GauntletScenario } from '@/lib/games/scenarios';
import type { OrderType } from '@/lib/engine/order';

const ORDER_TYPES: { id: OrderType; label: string; hint: string }[] = [
  { id: 'MARKET', label: 'MARKET', hint: 'Certain fill, uncertain price' },
  { id: 'LIMIT', label: 'LIMIT', hint: 'Certain price, uncertain fill' },
  { id: 'SL', label: 'SL', hint: 'Trigger → limit order' },
  { id: 'SL-M', label: 'SL-M', hint: 'Trigger → market order' },
];

interface Answer {
  scenario: GauntletScenario;
  picked: OrderType | null;
  correct: boolean;
  secondsTaken: number;
}

export function OrderGauntlet() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<OrderType | null>(null);
  const [remaining, setRemaining] = useState(GAUNTLET_SCENARIOS[0].seconds);

  const scenario = GAUNTLET_SCENARIOS[index];
  const answered = picked !== null || remaining <= 0;
  const finished = index >= GAUNTLET_SCENARIOS.length;

  // The clock. Stops the moment an answer is locked in.
  useEffect(() => {
    if (answered || finished) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [answered, finished, remaining]);

  const timedOut = remaining <= 0 && picked === null;

  const choose = (type: OrderType) => {
    if (answered) return;
    setPicked(type);
    setAnswers((a) => [
      ...a,
      { scenario, picked: type, correct: type === scenario.correct, secondsTaken: scenario.seconds - remaining },
    ]);
  };

  const next = () => {
    // Running out of time is a miss — hesitation is an answer. It is recorded
    // here rather than in an effect watching the clock, because the clock is
    // already an external system and one write is enough.
    if (timedOut) {
      setAnswers((a) => [...a, { scenario, picked: null, correct: false, secondsTaken: scenario.seconds }]);
    }
    const n = index + 1;
    setIndex(n);
    setPicked(null);
    setRemaining(GAUNTLET_SCENARIOS[n]?.seconds ?? 0);
  };

  const restart = () => {
    setIndex(0);
    setAnswers([]);
    setPicked(null);
    setRemaining(GAUNTLET_SCENARIOS[0].seconds);
  };

  const score = useMemo(() => answers.filter((a) => a.correct).length, [answers]);

  if (finished) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
          <div className="text-[11px] uppercase tracking-wider text-accent">Gauntlet complete</div>
          <div className="num mt-2 text-3xl">
            {score}
            <span className="text-lg text-ink-faint">/{GAUNTLET_SCENARIOS.length}</span>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            {score === GAUNTLET_SCENARIOS.length
              ? 'Every one. You are choosing on the trade-off — fill certainty against price certainty — rather than by habit.'
              : score >= GAUNTLET_SCENARIOS.length - 2
                ? 'Close. The ones people miss are almost always the stop orders: SL and SL-M are not interchangeable, and the difference only shows up on a gap.'
                : 'Worth running again. There is really only one question behind all six: do you need certainty of FILL or certainty of PRICE? Everything else follows from that.'}
          </p>
        </div>

        <ul className="space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {answers.map((a) => (
            <li key={a.scenario.id} className="bg-surface p-4">
              <div className="flex items-baseline gap-3">
                <span className="num text-[11px]" style={{ color: a.correct ? 'var(--color-up)' : 'var(--color-down)' }}>
                  {a.correct ? '✓' : '✗'}
                </span>
                <span className="flex-1 text-[13px] text-ink-muted">{a.scenario.situation}</span>
                <span className="num shrink-0 text-[11px] text-ink-faint">
                  {a.picked ?? 'timed out'} → {a.scenario.correct}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <button onClick={restart} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-ground">
          Run it again
        </button>
      </div>
    );
  }

  const timePct = (remaining / scenario.seconds) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="num text-[11px] text-ink-faint">
          {index + 1} of {GAUNTLET_SCENARIOS.length}
        </div>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.max(0, timePct)}%`,
              background: timePct > 40 ? 'var(--color-accent)' : 'var(--color-down)',
            }}
          />
        </div>
        <div className="num w-8 text-right text-sm" style={{ color: remaining <= 5 ? 'var(--color-down)' : undefined }}>
          {Math.max(0, remaining)}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-[15px] leading-relaxed">{scenario.situation}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {ORDER_TYPES.map((t) => {
            const isCorrect = answered && t.id === scenario.correct;
            const isPicked = picked === t.id;
            return (
              <button
                key={t.id}
                onClick={() => choose(t.id)}
                disabled={answered}
                className="rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-default"
                style={{
                  borderColor: isCorrect
                    ? 'var(--color-up)'
                    : isPicked
                      ? 'var(--color-down)'
                      : 'var(--color-line)',
                  background: isPicked || isCorrect ? 'var(--color-surface-2)' : 'transparent',
                }}
              >
                <div className="num text-sm" style={{ color: isCorrect ? 'var(--color-up)' : undefined }}>
                  {t.label}
                </div>
                <div className="mt-0.5 text-[11px] text-ink-faint">{t.hint}</div>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-5 space-y-3 border-t border-line pt-4">
            <p className="text-[13px] leading-relaxed">
              <span
                className="text-[11px] uppercase tracking-wider"
                style={{ color: picked === scenario.correct ? 'var(--color-up)' : 'var(--color-down)' }}
              >
                {picked === null ? 'Out of time. ' : picked === scenario.correct ? 'Correct. ' : 'Not this one. '}
              </span>
              <span className="text-ink-muted">{scenario.reasoning}</span>
            </p>

            {picked && picked !== scenario.correct && scenario.costs[picked] && (
              <p className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-[13px] text-ink-muted">
                <span className="text-down">What {picked} would have cost you: </span>
                {scenario.costs[picked]}
              </p>
            )}

            <button onClick={next} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ground">
              {index === GAUNTLET_SCENARIOS.length - 1 ? 'See results' : 'Next scenario'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
