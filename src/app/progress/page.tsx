import { ProgressDashboard } from '@/components/ProgressDashboard';
import { LESSONS } from '@/content/registry';

export const metadata = { title: 'Progress — Market Academy' };

export default function ProgressPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your progress</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Skills fade. What you see here is modelled retention, not a completion tick — a lesson you passed in March is
        not a skill you still have today, and this page is honest about that.
      </p>
      <div className="mt-10">
        <ProgressDashboard lessons={LESSONS.map((l) => ({ id: l.id, title: l.title, tier: l.tier }))} />
      </div>
    </main>
  );
}
