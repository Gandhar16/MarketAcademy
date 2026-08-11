import { getDb } from '@/lib/db';
import { recentReasons } from '@/lib/db/reasons';
import { ReasonFeed } from '@/components/ReasonFeed';
import { MIN_PLANNED_RR } from '@/lib/progress/mastery';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reasoning — Market Academy',
  description: 'What other learners were thinking when they took a trade, in their own words, next to the numbers.',
};

export default async function ReasonsPage() {
  const entries = await recentReasons(await getDb());

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">Why they did it</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">
        Every game run here carries the learner&apos;s own account of what they were trying to do. Read them. Disagree
        with them. The reasoning is the part worth copying — a return is just the part you can see.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        A run earns XP only when the plan behind it holds up: a reason written down, a planned reward-to-risk of at
        least {MIN_PLANNED_RR}:1, risk inside budget, and stops honoured. Making money is not one of the conditions,
        and neither is losing it.
      </p>

      <div className="mt-8 sm:mt-10">
        <ReasonFeed initial={entries} />
      </div>
    </main>
  );
}
