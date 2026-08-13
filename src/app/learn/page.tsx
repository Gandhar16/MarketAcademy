import { CourseGrid } from '@/components/learn/CourseGrid';
import { BUILT_TOPICS, SYLLABUS, TOTAL_TOPICS } from '@/content/syllabus';

export const metadata = {
  title: 'The course — Market Academy',
  description: `${SYLLABUS.length} courses covering the stock market end to end, from what a share is to the edge cases that end accounts. ${TOTAL_TOPICS} lessons, ${BUILT_TOPICS} written so far.`,
};

export default function LearnIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-5xl lg:py-20">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">The full course, by subject</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">
        {SYLLABUS.length} courses, {TOTAL_TOPICS} lessons in total, in the order they should be learnt — basics
        first, edge cases last. Pick any course below, or hit continue to pick up exactly where you left off.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Nothing here is locked. A course you have not started is still one click away — the ordering is a
        recommendation the material itself depends on, not a gate.
      </p>

      <div className="mt-8 sm:mt-10">
        <CourseGrid />
      </div>
    </main>
  );
}
