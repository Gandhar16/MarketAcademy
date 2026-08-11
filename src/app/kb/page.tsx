import { KnowledgeBase } from '@/components/KnowledgeBase';
import { GLOSSARY } from '@/content/glossary';
import { LESSONS } from '@/content/registry';
import { scanLesson } from '@/lib/lesson/jargon';

export const metadata = {
  title: 'Glossary — Market Academy',
  description: 'Every term this site uses, defined in plain words for someone who has never traded.',
};

export default function KnowledgeBasePage() {
  // Which lessons actually use each term, computed from the lessons rather than
  // maintained by hand — a hand-kept list would be wrong within a week.
  const lessonsByTerm: Record<string, { id: string; title: string }[]> = {};
  for (const lesson of LESSONS) {
    for (const hit of scanLesson(lesson)) {
      (lessonsByTerm[hit.id] ??= []).push({ id: lesson.id, title: lesson.title });
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Glossary</h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        Every one of the {GLOSSARY.length} terms this site uses, written for someone who has never opened a trading
        account. No definition here relies on a word you have not already been given.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-faint">
        You should rarely need this page. Inside a lesson, the first time an unfamiliar word appears it carries a dotted
        underline — tap it and the definition comes to you.
      </p>

      <div className="mt-8">
        <KnowledgeBase lessonsByTerm={lessonsByTerm} />
      </div>
    </main>
  );
}
