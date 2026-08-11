'use client';

/**
 * The course map: one numbered road from step 1 to the end.
 *
 * What this replaced was six tier buckets, each holding one or two lessons.
 * That layout answered "how is the material organised" — a question the author
 * has and the learner does not. This one answers "where do I start and what
 * comes next", which is the only question anybody actually arrives with.
 *
 * Three deliberate choices:
 *
 *  1. ONE COLUMN AT EVERY WIDTH. A track is a line. Two columns of a sequence
 *     forces the reader to decide whether to read down or across, which is
 *     exactly the "scattered" feeling this replaced. The layout adapts by
 *     changing density and what the gutter holds, never by splitting the road.
 *
 *  2. GAPS ARE VISIBLE. A topic with no lesson written yet still gets its step
 *     number and its one-line description, marked plainly as not written.
 *     Hiding it would make the course look finished by making the missing
 *     parts invisible, which is the same dishonesty as a fake progress bar.
 *
 *  3. NOTHING IS LOCKED. Prerequisites are stated, not enforced. A learner who
 *     already knows what a candle is should not have to sit through it, and a
 *     lock would teach them that the site does not believe them.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { SYLLABUS, SEQUENCE, SEQUENCE_BY_ID, TOTAL_TOPICS, resumeAt, type SequencedTopic } from '@/content/syllabus';
import { TIER_LABELS } from '@/lib/lesson/dsl';
import { useProgress } from '@/lib/progress/store';
import { useHydrated } from '@/lib/util/client-hooks';

const BUILT = SEQUENCE.filter((t) => t.built);

export function CourseTrack() {
  const hydrated = useHydrated();
  const lessons = useProgress((s) => s.lessons);

  // Before hydration the server and client must agree, so we render the map
  // with no progress on it rather than flashing a wrong state.
  const completed = useMemo(
    () =>
      new Set(
        hydrated
          ? Object.values(lessons)
              .filter((l) => l.completedAt != null)
              .map((l) => l.lessonId)
          : [],
      ),
    [hydrated, lessons],
  );

  const started = useMemo(
    () => new Set(hydrated ? Object.values(lessons).map((l) => l.lessonId) : []),
    [hydrated, lessons],
  );

  const next = resumeAt(completed);
  const doneCount = BUILT.filter((t) => completed.has(t.id)).length;

  return (
    <div>
      <ProgressHeader done={doneCount} available={BUILT.length} planned={TOTAL_TOPICS} next={next} />

      <div className="mt-10 space-y-12 sm:mt-14 sm:space-y-16">
        {SYLLABUS.map((stage, si) => {
          const stageBuilt = stage.topics.filter((t) => t.built);
          const stageDone = stageBuilt.filter((t) => completed.has(t.id)).length;

          return (
            <section key={stage.id} aria-labelledby={`${stage.id}-heading`}>
              <header className="border-b border-line pb-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-ink-faint">
                  <span className="num text-accent">Stage {si + 1}</span>
                  <span aria-hidden>·</span>
                  <span>{stage.name}</span>
                  <span aria-hidden>·</span>
                  <span>{TIER_LABELS[stage.tier]}</span>
                  {stageBuilt.length > 0 && (
                    <span className="num ml-auto shrink-0">
                      {stageDone}/{stageBuilt.length} done
                    </span>
                  )}
                </div>
                <h2
                  id={`${stage.id}-heading`}
                  className="mt-2 text-lg font-medium leading-snug sm:text-xl md:text-2xl"
                >
                  {stage.question}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">{stage.why}</p>
              </header>

              <ol className="mt-5 space-y-2">
                {stage.topics.map((t) => (
                  <TopicRow
                    key={t.id}
                    topic={SEQUENCE_BY_ID.get(t.id)!}
                    done={completed.has(t.id)}
                    inProgress={!completed.has(t.id) && started.has(t.id)}
                    isNext={next?.id === t.id}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProgressHeader({
  done,
  available,
  planned,
  next,
}: {
  done: number;
  available: number;
  planned: number;
  next: SequencedTopic | null;
}) {
  const pct = available === 0 ? 0 : Math.round((done / available) * 100);

  return (
    <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-ink-faint">Your position on the road</p>
          <p className="num mt-1 text-2xl sm:text-3xl">
            {done}
            <span className="text-ink-faint"> / {available}</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            lessons finished of {available} written, out of {planned} planned for the full course.
          </p>
        </div>

        {next && (
          <Link
            href={`/learn/${next.id}`}
            className="btn-primary w-full justify-center sm:w-auto sm:justify-start"
          >
            {done === 0 ? 'Start at step 1' : `Continue — step ${next.step}`}
          </Link>
        )}
      </div>

      <div
        className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lessons completed"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TopicRow({
  topic,
  done,
  inProgress,
  isNext,
}: {
  topic: SequencedTopic;
  done: boolean;
  inProgress: boolean;
  isNext: boolean;
}) {
  const marker = (
    <span
      aria-hidden
      className={[
        'num mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px]',
        done
          ? 'border-up bg-up/15 text-up'
          : isNext
            ? 'border-accent bg-accent/15 text-accent'
            : topic.built
              ? 'border-line-strong text-ink-muted'
              : 'border-dashed border-line text-ink-faint',
      ].join(' ')}
    >
      {done ? '✓' : topic.step}
    </span>
  );

  const body = (
    <>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={topic.built ? 'font-medium' : 'font-medium text-ink-faint'}>{topic.title}</span>
        {isNext && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
            next
          </span>
        )}
        {inProgress && !isNext && (
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">in progress</span>
        )}
        {!topic.built && (
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">not written yet</span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{topic.covers}</p>
    </>
  );

  if (!topic.built) {
    return (
      <li className="flex gap-3 rounded-lg border border-dashed border-line px-3 py-3 sm:gap-4 sm:px-4">
        {marker}
        <div className="min-w-0">{body}</div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={`/learn/${topic.id}`}
        className={[
          'flex gap-3 rounded-lg border px-3 py-3 transition-colors sm:gap-4 sm:px-4',
          isNext ? 'border-accent/40 bg-surface' : 'border-line bg-surface',
          'hover:border-line-strong hover:bg-surface-2',
        ].join(' ')}
      >
        {marker}
        <div className="min-w-0">{body}</div>
      </Link>
    </li>
  );
}
