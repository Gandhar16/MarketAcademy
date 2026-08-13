import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LESSONS, LESSONS_BY_ID } from '@/content/registry';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { stripAnswers } from '@/lib/lesson/sanitize';
import { SEQUENCE_BY_ID, TOTAL_TOPICS, nextBuilt, previousBuilt } from '@/content/syllabus';

export function generateStaticParams() {
  return LESSONS.map((l) => ({ lesson: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson: id } = await params;
  const lesson = LESSONS_BY_ID.get(id);
  if (!lesson) notFound();

  const here = SEQUENCE_BY_ID.get(id);
  const prev = previousBuilt(id);
  const next = nextBuilt(id);

  return (
    <>
      {/* Where you are on the road. A lesson reached from a search result or a
          shared link is otherwise context-free, and "step 7 of 59" is the
          difference between a page and a course. */}
      <nav className="mx-auto flex w-full max-w-3xl flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-6 text-sm sm:px-6 sm:pt-8">
        <Link
          href={here ? `/learn/course/${here.stage.id}` : '/learn'}
          className="text-ink-faint transition-colors hover:text-ink"
        >
          ← {here ? here.stage.courseTitle : 'The course'}
        </Link>
        {here && (
          <span className="num text-[11px] uppercase tracking-wider text-ink-faint">
            Step {here.step} of {TOTAL_TOPICS}
          </span>
        )}
      </nav>

      {/* Answers are stripped before the lesson crosses into client code — they
          are fetched from /api/lesson/reveal only once the learner commits. */}
      <LessonPlayer lesson={stripAnswers(lesson)} />

      <nav
        aria-label="Course navigation"
        className="mx-auto grid w-full max-w-3xl gap-3 px-4 pb-16 sm:grid-cols-2 sm:px-6"
      >
        {prev ? (
          <Link
            href={`/learn/${prev.id}`}
            className="rounded-card border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <span className="num text-[11px] uppercase tracking-wider text-ink-faint">← Step {prev.step}</span>
            <span className="mt-1 block text-sm font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span aria-hidden />
        )}
        {next && (
          <Link
            href={`/learn/${next.id}`}
            className="rounded-card border border-accent/40 bg-surface p-4 transition-colors hover:bg-surface-2 sm:text-right"
          >
            <span className="num text-[11px] uppercase tracking-wider text-accent">Step {next.step} →</span>
            <span className="mt-1 block text-sm font-medium">{next.title}</span>
          </Link>
        )}
      </nav>
    </>
  );
}
