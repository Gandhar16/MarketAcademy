'use client';

/**
 * The lesson player.
 *
 * The pedagogically load-bearing decision here is GATING. Blocks are revealed
 * one at a time, and a `predict` block will not let the learner past until they
 * have committed to an answer.
 *
 * The lesson arrives here with its answers already stripped out server-side
 * (src/lib/lesson/sanitize.ts) — a reveal is not in the DOM, not in the RSC
 * payload, and not in view-source. It is fetched from /api/lesson/reveal at the
 * moment of commitment. See that file for what this does and does not
 * guarantee.
 *
 * That is the mechanical answer to pain point P2 (quizzes test recall, not
 * judgement). Recall questions are answerable by scrolling back; judgement
 * questions are only meaningful if you were forced to decide first.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Block, Lesson } from '@/lib/lesson/dsl';
import { renderWidget } from '@/components/widgets/registry';
import { renderGame } from '@/components/games/registry';
import { useProgress } from '@/lib/progress/store';
import { Checkpoint } from './Checkpoint';
import { WorkedExample } from './WorkedExample';
import { renderFigure } from '@/components/visuals/registry';
import { annotateLesson, annotateReveal, renderProse } from '@/lib/lesson/annotate';
import { GlossaryPopover } from './GlossaryPopover';

/**
 * Pre-annotated prose for the lesson currently being read, keyed by its source
 * markdown. Empty outside a lesson, in which case Prose annotates on its own.
 */
export const AnnotationContext = createContext<Map<string, string[]>>(new Map());

/**
 * Any lesson text that is not markdown but still deserves glossary links —
 * example setups, checkpoint explanations, widget takeaways. Looks the string
 * up in the lesson-wide pass so the same first-occurrence rule applies.
 */
export function AnnotatedText({ text, className }: { text: string; className?: string }) {
  const annotated = useContext(AnnotationContext);
  const html = useMemo(() => (annotated.get(text) ?? renderProse(text, new Set())).join(' '), [annotated, text]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const commit = useProgress((s) => s.commit);
  const commitmentFor = useProgress((s) => s.commitmentFor);
  const setBlockIndex = useProgress((s) => s.setBlockIndex);
  const completeLesson = useProgress((s) => s.completeLesson);

  // Computed over the whole lesson up front, so "first occurrence" means first
  // in the lesson and stays stable no matter which blocks are currently visible.
  const annotations = useMemo(() => annotateLesson(lesson.blocks), [lesson.blocks]);

  const [unlocked, setUnlocked] = useState(0);
  const [checkpointResult, setCheckpointResult] = useState<{ score: number; xp: number } | null>(null);
  /** Answers fetched from the server, keyed by block index. Never present before commitment. */
  const [reveals, setReveals] = useState<Record<number, { correct: number; reveal: string }>>({});

  const fetchReveal = useCallback(
    async (blockIndex: number) => {
      const res = await fetch(`/api/lesson/reveal?lesson=${encodeURIComponent(lesson.id)}&block=${blockIndex}`);
      if (!res.ok) return;
      const json = await res.json();
      if ('reveal' in json) setReveals((r) => ({ ...r, [blockIndex]: json }));
    },
    [lesson.id],
  );

  // A learner returning to a lesson they already answered should see their
  // previous reveals rather than a blank block.
  useEffect(() => {
    lesson.blocks.forEach((b, i) => {
      if (b.kind === 'predict' && commitmentFor(lesson.id, i) && !reveals[i]) void fetchReveal(i);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on mount to rehydrate previously earned reveals
  }, []);

  const visible = lesson.blocks.slice(0, unlocked + 1);
  const atEnd = unlocked >= lesson.blocks.length - 1;

  const advance = () => {
    const next = Math.min(unlocked + 1, lesson.blocks.length - 1);
    setUnlocked(next);
    setBlockIndex(lesson.id, next);
  };

  return (
    <AnnotationContext.Provider value={annotations}>
      <GlossaryPopover>
        <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-accent">
          <span>{lesson.tier}</span>
          <span className="text-ink-faint">·</span>
          <span className="text-ink-faint">{lesson.estimatedMinutes} min</span>
          <span className="text-ink-faint">·</span>
          <span className="text-ink-faint">{lesson.market === 'IN' ? 'India' : lesson.market}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{lesson.title}</h1>
        <p className="mt-3 text-ink-muted">{lesson.summary}</p>

        {lesson.plainSummary && (
          // Placed above the objectives on purpose. Objectives are written in
          // the vocabulary of someone who already knows the subject, which is
          // exactly the wrong first thing for a beginner to read.
          <div className="mt-5 rounded-xl border-l-2 bg-surface p-4" style={{ borderLeftColor: 'var(--color-info)' }}>
            <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-info)' }}>
              In plain words
            </div>
            <p className="mt-1.5 leading-relaxed text-ink">{lesson.plainSummary}</p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-line bg-surface p-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">By the end you will be able to</div>
          <ul className="mt-2 space-y-1">
            {lesson.objectives.map((o) => (
              <li key={o} className="flex gap-2 text-sm text-ink-muted">
                <span className="text-accent">→</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <ProgressRail current={unlocked} total={lesson.blocks.length} />

      <div className="mt-8 space-y-8">
        {visible.map((block, i) => (
          <BlockView
            key={i}
            block={block}
            index={i}
            lessonId={lesson.id}
            isCurrent={i === unlocked}
            commitment={commitmentFor(lesson.id, i)}
            reveal={reveals[i]}
            onCommit={(choice, why) => {
              commit({ lessonId: lesson.id, blockIndex: i, choice, why });
              void fetchReveal(i);
            }}
            onCheckpointDone={(score) => {
              const xp = completeLesson({
                lessonId: lesson.id,
                tier: lesson.tier,
                skills: lesson.skills,
                score,
              });
              setCheckpointResult({ score, xp });
            }}
          />
        ))}
      </div>

      {!atEnd && (
        <ContinueGate
          block={lesson.blocks[unlocked]}
          committed={Boolean(commitmentFor(lesson.id, unlocked))}
          onAdvance={advance}
        />
      )}

      {checkpointResult && (
        <div className="mt-10 rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
          <div className="text-[11px] uppercase tracking-wider text-accent">Lesson complete</div>
          <div className="num mt-2 text-3xl">{checkpointResult.score}%</div>
          <p className="mt-2 text-sm text-ink-muted">
            +{checkpointResult.xp} XP. Mastery recorded for {lesson.skills.join(', ')} — these will fade over the next
            few weeks and resurface for review before they are gone.
          </p>
        </div>
      )}
        </article>
      </GlossaryPopover>
    </AnnotationContext.Provider>
  );
}

/** A gate that refuses to advance past an uncommitted prediction. */
function ContinueGate({
  block,
  committed,
  onAdvance,
}: {
  block: Block;
  committed: boolean;
  onAdvance: () => void;
}) {
  const blocked = block.kind === 'predict' && !committed;
  return (
    <div className="mt-10">
      <button
        onClick={onAdvance}
        disabled={blocked}
        className="rounded-lg bg-accent px-5 py-2.5 font-medium text-ground transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue
      </button>
      {blocked && (
        <p className="mt-2 text-[13px] text-ink-faint">
          Commit to an answer first. Guessing and being wrong teaches more than reading the right answer.
        </p>
      )}
    </div>
  );
}

function ProgressRail({ current, total }: { current: number; total: number }) {
  return (
    <div className="mt-8 flex gap-1" aria-label={`Block ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{ background: i <= current ? 'var(--color-accent)' : 'var(--color-line)' }}
        />
      ))}
    </div>
  );
}

function BlockView({
  block,
  index,
  lessonId,
  isCurrent,
  commitment,
  reveal,
  onCommit,
  onCheckpointDone,
}: {
  block: Block;
  index: number;
  lessonId: string;
  isCurrent: boolean;
  commitment: { choice: number; why?: string } | undefined;
  reveal: { correct: number; reveal: string } | undefined;
  onCommit: (choice: number, why?: string) => void;
  onCheckpointDone: (score: number) => void;
}) {
  switch (block.kind) {
    case 'prose':
      return <Prose md={block.md} />;

    case 'callout':
      return <Callout tone={block.tone} title={block.title} md={block.md} />;

    case 'widget':
      return (
        <figure>
          {renderWidget(block.component, block.props)}
          <figcaption className="mt-2 text-[13px] text-ink-faint">
            <AnnotatedText text={block.takeaway} />
          </figcaption>
        </figure>
      );

    case 'predict':
      return (
        <Predict
          block={block}
          commitment={commitment}
          reveal={reveal}
          onCommit={onCommit}
          disabled={!isCurrent && !commitment}
        />
      );

    case 'chart':
      return (
        <div className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-muted">
          Chart block ({block.mode}) — the replay renderer lands with the Chart Replay game.
          <div className="mt-2 text-[13px] text-ink-faint">{block.takeaway}</div>
        </div>
      );

    case 'example':
      return <WorkedExample block={block} />;

    case 'figure':
      return (
        <figure>
          {renderFigure(block.figure, block.props)}
          <figcaption className="mt-2 text-[13px] text-ink-faint">{block.caption}</figcaption>
        </figure>
      );

    case 'game':
      return <figure>{renderGame(block.game, block.config)}</figure>;

    case 'checkpoint':
      return (
        <Checkpoint block={block} lessonId={lessonId} blockIndex={index} onGraded={onCheckpointDone} />
      );
  }
}

/**
 * Minimal markdown: paragraphs, **bold**, `code`. Deliberately not a full
 * markdown engine — the DSL caps prose at 1,200 characters precisely so that
 * lessons cannot become documents, and a limited renderer keeps that honest.
 */
function Prose({ md }: { md: string }) {
  // Paragraphs arrive pre-rendered from the lesson-level pass, so that glossary
  // annotation can mark the first occurrence in the LESSON rather than the
  // first in this paragraph. The fallback covers prose reaching this component
  // from outside a lesson.
  const annotated = useContext(AnnotationContext);
  const html = useMemo(() => annotated.get(md) ?? renderProse(md, new Set()), [annotated, md]);

  return (
    <div className="space-y-4">
      {html.map((p, i) => (
        <p key={i} className="leading-relaxed text-ink-muted" dangerouslySetInnerHTML={{ __html: p }} />
      ))}
    </div>
  );
}

const TONE: Record<string, { border: string; label: string }> = {
  insight: { border: 'var(--color-info)', label: 'Insight' },
  warning: { border: 'var(--color-down)', label: 'Watch out' },
  myth: { border: '#a78bfa', label: 'Common myth' },
  cost: { border: 'var(--color-accent)', label: 'Cost reality' },
};

function Callout({ tone, title, md }: { tone: string; title: string; md: string }) {
  const t = TONE[tone] ?? TONE.insight;
  return (
    <aside className="rounded-xl border-l-2 bg-surface p-5" style={{ borderLeftColor: t.border }}>
      <div className="text-[11px] uppercase tracking-wider" style={{ color: t.border }}>
        {t.label}
      </div>
      <div className="mt-1 font-medium">{title}</div>
      <div className="mt-2">
        <Prose md={md} />
      </div>
    </aside>
  );
}

function Predict({
  block,
  commitment,
  reveal,
  onCommit,
  disabled,
}: {
  block: Extract<Block, { kind: 'predict' }>;
  commitment: { choice: number; why?: string } | undefined;
  reveal: { correct: number; reveal: string } | undefined;
  onCommit: (choice: number, why?: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [why, setWhy] = useState('');

  const committed = commitment != null;
  // `block.correct` is -1 here — the real answer only exists once the server
  // has handed it over, which happens on commitment.
  const correct = committed && reveal != null && commitment.choice === reveal.correct;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-accent">Predict, then reveal</div>
      <p className="mt-2 text-[15px]">
        <AnnotatedText text={block.prompt} />
      </p>

      <div className="mt-4 space-y-2">
        {block.options.map((opt, i) => {
          const chosen = committed ? commitment.choice === i : selected === i;
          const isAnswer = reveal != null && i === reveal.correct;
          return (
            <button
              key={opt}
              disabled={committed || disabled}
              onClick={() => setSelected(i)}
              className="flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-default"
              style={{
                borderColor: isAnswer
                  ? 'var(--color-up)'
                  : chosen
                    ? 'var(--color-accent)'
                    : 'var(--color-line)',
                background: chosen ? 'var(--color-surface-2)' : 'transparent',
              }}
            >
              <span className="num text-ink-faint">{String.fromCharCode(65 + i)}</span>
              <span className={isAnswer ? 'text-up' : 'text-ink-muted'}>{opt}</span>
            </button>
          );
        })}
      </div>

      {!committed && block.askWhy && (
        <label className="mt-4 block">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            Why? (one line — writing it down is what makes it stick)
          </span>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-line-strong"
          />
        </label>
      )}

      {!committed && (
        <button
          disabled={selected == null || disabled}
          onClick={() => selected != null && onCommit(selected, why || undefined)}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ground disabled:opacity-30"
        >
          Lock in my answer
        </button>
      )}

      {committed && (
        <div className="mt-5 border-t border-line pt-4">
          {reveal == null ? (
            <div className="text-sm text-ink-faint">Fetching the answer…</div>
          ) : (
            <>
              <div
                className="text-[11px] uppercase tracking-wider"
                style={{ color: correct ? 'var(--color-up)' : 'var(--color-down)' }}
              >
                {correct ? 'You had it' : 'Not this time — and this is the useful bit'}
              </div>
              {commitment.why && (
                <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-faint">
                  You said: &ldquo;{commitment.why}&rdquo;
                </p>
              )}
              <p
                className="mt-3 leading-relaxed text-ink-muted"
                dangerouslySetInnerHTML={{ __html: annotateReveal(reveal.reveal).join(' ') }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
