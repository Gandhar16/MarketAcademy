'use client';

/**
 * One lesson row inside a course's topic list. Extracted from the old
 * single-page `CourseTrack` so both the course-detail page and (if it is
 * ever needed again) any other listing can share it.
 */
import Link from 'next/link';
import type { SequencedTopic } from '@/content/syllabus';

export function TopicRow({
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
