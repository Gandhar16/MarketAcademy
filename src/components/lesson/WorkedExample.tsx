'use client';

/**
 * A worked example, rendered as a numbered chain of steps with the arithmetic
 * shown and a running result column.
 *
 * Steps whose value carries a `compute` spec are evaluated here, by the same
 * engines that price real fills. That is what stops a worked example rotting:
 * change a statutory rate and every example in the course re-derives itself.
 */
import { useState } from 'react';
import type { Block } from '@/lib/lesson/dsl';
import { evaluateExample } from '@/lib/lesson/examples';
import { AnnotatedText } from './LessonPlayer';

type ExampleBlock = Extract<Block, { kind: 'example' }>;

export function WorkedExample({ block }: { block: ExampleBlock }) {
  /**
   * Steps reveal one at a time by default. Watching an answer assemble is
   * meaningfully better than being handed a finished table — the learner gets a
   * beat to predict each line before it appears.
   */
  const [revealed, setRevealed] = useState(1);
  const all = revealed >= block.steps.length;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line bg-surface-2 px-5 py-3">
        <div className="text-[11px] uppercase tracking-wider text-accent">Worked example</div>
        <div className="mt-0.5 font-medium">{block.title}</div>
      </div>

      <div className="px-5 py-4">
        <p className="text-[13px] leading-relaxed text-ink-muted">
          <AnnotatedText text={block.setup} />
        </p>

        <ol className="mt-4 space-y-px overflow-hidden rounded-lg border border-line bg-line">
          {block.steps.slice(0, revealed).map((step, i) => {
            const value = step.compute ? evaluateExample(step.compute) : step.value;
            const isLast = i === block.steps.length - 1;
            return (
              <li key={i} className="bg-surface px-4 py-3">
                <div className="flex items-baseline gap-3">
                  <span
                    className="num flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
                    style={{
                      background: isLast ? 'var(--color-accent)' : 'var(--color-surface-2)',
                      color: isLast ? 'var(--color-on-emphasis)' : 'var(--color-ink-faint)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">{step.label}</div>
                    <div className="mt-0.5 text-[12px] leading-relaxed text-ink-faint">{step.detail}</div>
                  </div>
                  {value != null && (
                    <span
                      className="num shrink-0 text-sm"
                      style={{ color: isLast ? 'var(--color-accent)' : 'var(--color-ink)' }}
                    >
                      {value}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {!all ? (
          <button
            onClick={() => setRevealed((r) => r + 1)}
            className="mt-3 rounded-lg border border-line-strong px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            Next step ({revealed} of {block.steps.length})
          </button>
        ) : (
          <p className="mt-4 rounded-lg border-l-2 border-accent bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
            <AnnotatedText text={block.conclusion} />
          </p>
        )}
      </div>
    </div>
  );
}
