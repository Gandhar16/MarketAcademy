import { CourseTrack } from '@/components/learn/CourseTrack';
import { BUILT_TOPICS, SYLLABUS, TOTAL_TOPICS } from '@/content/syllabus';

export const metadata = {
  title: 'The course — Market Academy',
  description: `One ordered road through the stock market, from what a share is to the edge cases that end accounts. ${TOTAL_TOPICS} steps, ${BUILT_TOPICS} written so far.`,
};

export default function LearnIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-4xl lg:py-20">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
        One road, start to finish
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">
        {TOTAL_TOPICS} steps in {SYLLABUS.length} stages, in the order they should be learnt. Start at step 1 and go
        down. Nothing here assumes you already know anything, and nothing later depends on something you have not
        reached yet.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Every step ends by asking you to do something rather than to recall a definition. Steps still being written
        are shown in place, greyed out, so you can see the whole road rather than only the finished part of it.
      </p>

      <div className="mt-8 sm:mt-10">
        <CourseTrack />
      </div>
    </main>
  );
}
