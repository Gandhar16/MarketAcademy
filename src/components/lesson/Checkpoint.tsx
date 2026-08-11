'use client';

/**
 * The graded checkpoint.
 *
 * Answers go to /api/lesson/grade, which runs the real graders server-side —
 * including a `compute` grader that recomputes the expected figure from the
 * cost engine rather than comparing against a stored number.
 */
import { useState } from 'react';
import type { Block } from '@/lib/lesson/dsl';
import { AnnotatedText } from './LessonPlayer';

type Task = Extract<Block, { kind: 'checkpoint' }>['tasks'][number];

interface GradeResult {
  correct: boolean;
  credit: number;
  feedback: string;
  expected?: string;
}

interface GradeResponse {
  score: number;
  results: GradeResult[];
  explanations: string[];
}

export function Checkpoint({
  block,
  lessonId,
  blockIndex,
  onGraded,
}: {
  block: Extract<Block, { kind: 'checkpoint' }>;
  lessonId: string;
  blockIndex: number;
  onGraded: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [graded, setGraded] = useState<GradeResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/lesson/grade', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lesson: lessonId,
          block: blockIndex,
          answers: block.tasks.map((_, i) => answers[i] ?? ''),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Grading failed.');
      setGraded(json);
      onGraded(json.score);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit the checkpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-line-strong bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-accent">Checkpoint</div>
      <p className="mt-1 text-sm text-ink-muted">
        No definitions. Each of these asks you to decide or compute something.
      </p>

      <ol className="mt-5 space-y-7">
        {block.tasks.map((task, i) => (
          <li key={i} className="flex gap-3">
            <span className="num text-ink-faint">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px]">{task.prompt}</p>

              <div className="mt-3">
                <TaskInput
                  task={task}
                  value={answers[i]}
                  disabled={graded != null}
                  onChange={(v) => setAnswers((a) => ({ ...a, [i]: v }))}
                />
              </div>

              {graded && (
                <div className="mt-3 space-y-2">
                  <div
                    className="flex items-baseline gap-2 text-[13px]"
                    style={{
                      color: graded.results[i]?.correct
                        ? 'var(--color-up)'
                        : graded.results[i]?.credit
                          ? 'var(--color-accent)'
                          : 'var(--color-down)',
                    }}
                  >
                    <span className="num">
                      {Math.round((graded.results[i]?.credit ?? 0) * 100)}%
                    </span>
                    <span>{graded.results[i]?.feedback}</span>
                  </div>
                  <p className="rounded-lg border-l-2 border-accent bg-surface-2 px-3 py-2 text-[13px] leading-relaxed text-ink-muted">
                    <AnnotatedText text={graded.explanations[i]} />
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 text-[13px] text-danger">{error}</p>}

      {!graded ? (
        <button
          onClick={() => void submit()}
          disabled={submitting}
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 font-medium text-ground disabled:opacity-40"
        >
          {submitting ? 'Grading…' : 'Submit checkpoint'}
        </button>
      ) : (
        <div className="mt-6 flex items-baseline gap-3">
          <span className="num text-2xl">{graded.score}%</span>
          <span className="text-sm text-ink-muted">
            {graded.score >= 80
              ? 'Solid. This will stay with you longer than a definition would.'
              : graded.score >= 60
                ? 'Passed. Worth rereading the parts that cost you marks — they are the expensive ones in practice.'
                : 'Below the pass mark. Nothing is lost; this lesson will come back around for review.'}
          </span>
        </div>
      )}
    </div>
  );
}

function TaskInput({
  task,
  value,
  disabled,
  onChange,
}: {
  task: Task;
  value: unknown;
  disabled: boolean;
  onChange: (v: unknown) => void;
}) {
  const spec = task.spec as Record<string, unknown>;

  if (task.type === 'decision') {
    const options = (spec.options as string[]) ?? [];
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            disabled={disabled}
            onClick={() => onChange(o)}
            className="rounded-lg border px-4 py-2 text-sm transition-colors disabled:cursor-default"
            style={{
              borderColor: value === o ? 'var(--color-accent)' : 'var(--color-line)',
              background: value === o ? 'var(--color-surface-2)' : 'transparent',
              color: value === o ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            }}
          >
            {o}
          </button>
        ))}
      </div>
    );
  }

  if (task.type === 'compute') {
    const unit = (spec.unit as string) ?? '';
    return (
      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={(value as string) ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your figure"
          className="num w-40 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-line-strong disabled:opacity-60"
        />
        {unit && <span className="text-sm text-ink-faint">{unit}</span>}
      </div>
    );
  }

  if (task.type === 'classify') {
    const categories = (spec.categories as string[]) ?? [];
    const items = (spec.items as { label: string }[]) ?? [];
    const current = (value as Record<string, string>) ?? {};
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-wrap items-center gap-2">
            <span className="w-44 shrink-0 text-sm text-ink-muted">{item.label}</span>
            {categories.map((c) => (
              <button
                key={c}
                disabled={disabled}
                onClick={() => onChange({ ...current, [item.label]: c })}
                className="rounded-md px-2.5 py-1 text-[13px] transition-colors"
                style={{
                  background: current[item.label] === c ? 'var(--color-accent)' : 'var(--color-surface-2)',
                  color: current[item.label] === c ? 'var(--color-ground)' : 'var(--color-ink-muted)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // construct
  const current = (value as Record<string, unknown>) ?? {};
  const set = (k: string, v: unknown) => onChange({ ...current, [k]: v });
  const lastPrice = Number(spec.lastPrice ?? 0);

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-faint">
        Last traded price <span className="num text-ink">{lastPrice}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {(['buy', 'sell'] as const).map((s) => (
          <Toggle key={s} label={s} active={current.side === s} disabled={disabled} onClick={() => set('side', s)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(['MARKET', 'LIMIT', 'SL', 'SL-M'] as const).map((t) => (
          <Toggle key={t} label={t} active={current.type === t} disabled={disabled} onClick={() => set('type', t)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Field label="Quantity" value={current.quantity} disabled={disabled} onChange={(v) => set('quantity', v)} />
        <Field label="Trigger" value={current.triggerPrice} disabled={disabled} onChange={(v) => set('triggerPrice', v)} />
        <Field label="Limit" value={current.limitPrice} disabled={disabled} onChange={(v) => set('limitPrice', v)} />
      </div>
    </div>
  );
}

function Toggle({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="num rounded-md px-2.5 py-1 text-[13px] uppercase transition-colors"
      style={{
        background: active ? 'var(--color-accent)' : 'var(--color-surface-2)',
        color: active ? 'var(--color-ground)' : 'var(--color-ink-muted)',
      }}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: unknown;
  disabled: boolean;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>
      <input
        inputMode="decimal"
        disabled={disabled}
        value={value == null ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value.trim();
          onChange(raw === '' ? undefined : Number(raw));
        }}
        className="num mt-0.5 block w-28 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-line-strong disabled:opacity-60"
      />
    </label>
  );
}
