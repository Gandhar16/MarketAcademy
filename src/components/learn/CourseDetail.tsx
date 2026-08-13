'use client';

/**
 * A single course's lesson list — what a stage in `SYLLABUS` looks like once
 * you have picked it from the grid on `/learn`. Same topic-row rendering the
 * old single-page course track used, just scoped to one stage instead of
 * all twelve at once.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { SEQUENCE_BY_ID, resumeAt, type SyllabusStage } from '@/content/syllabus';
import { TIER_LABELS } from '@/lib/lesson/dsl';
import { useProgress } from '@/lib/progress/store';
import { useHydrated } from '@/lib/util/client-hooks';
import { CourseRing } from './CourseRing';
import { TopicRow } from './TopicRow';

export function CourseDetail({ stage }: { stage: SyllabusStage }) {
  const hydrated = useHydrated();
  const lessons = useProgress((s) => s.lessons);

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

  const built = stage.topics.filter((t) => t.built);
  const done = built.filter((t) => completed.has(t.id)).length;
  const pct = built.length === 0 ? 0 : Math.round((done / built.length) * 100);

  // "Continue" here means the next unfinished lesson IN THIS COURSE, unlike
  // the global continue button on the grid — a learner who came here to
  // finish this specific course wants the gap inside it, not wherever the
  // whole-site sequence would send them next.
  const nextInStage = stage.topics.find((t) => t.built && !completed.has(t.id));

  return (
    <div>
      <Link href="/learn" className="text-sm text-ink-faint transition-colors hover:text-ink">
        ← All courses
      </Link>

      <div className="mt-4 flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">{TIER_LABELS[stage.tier]}</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{stage.courseTitle}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{stage.question}</p>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-faint">{stage.why}</p>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <CourseRing percent={pct} />
          <span className="num text-sm text-ink-muted">
            {done}/{built.length} done
          </span>
        </div>
      </div>

      {nextInStage && (
        <Link href={`/learn/${nextInStage.id}`} className="btn-primary mt-4 inline-flex">
          {done === 0 ? 'Start this course' : 'Continue this course'}
        </Link>
      )}

      <ol className="mt-6 space-y-2">
        {stage.topics.map((t) => (
          <TopicRow
            key={t.id}
            topic={SEQUENCE_BY_ID.get(t.id)!}
            done={completed.has(t.id)}
            inProgress={!completed.has(t.id) && started.has(t.id)}
            isNext={resumeAt(completed)?.id === t.id}
          />
        ))}
      </ol>
    </div>
  );
}
