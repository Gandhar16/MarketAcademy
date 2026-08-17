import Link from 'next/link';
import { forMedium, runtimeOf, timeline, type Explainer } from '@/content/explainers';
import { ExplainerPlayer } from './ExplainerPlayer';

/**
 * The explainer that belongs to a lesson, shown inside the lesson.
 *
 * WHY IT LIVES HERE AND NOT ONLY AT /explain
 *
 * A separate explainers section asks the learner to go and find it, which
 * means the people who most need the animated version — the ones who did not
 * follow the written one — are exactly the people who will not go looking. So
 * the explainer sits at the foot of the lesson it explains, where somebody who
 * has just read the words and not quite got them will actually meet it.
 *
 * WHAT IS SHOWN AND WHAT IS NOT
 *
 * One player, for the best-matching explainer. Any others that touch the same
 * terms are offered as links rather than as more players, for two reasons: a
 * page with three video players on it invites none of them to be watched, and
 * each embedded explainer is a few tens of kilobytes of scenes serialised into
 * the lesson HTML. One is a feature; three is a payload.
 *
 * The page cut, always — `forMedium(e, 'page')` drops the video-only scenes so
 * they are never serialised into a document that has no way to show them.
 */

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function LessonExplainer({ explainers }: { explainers: Explainer[] }) {
  if (explainers.length === 0) return null;

  const [primary, ...others] = explainers;
  const pageCut = forMedium(primary, 'page');

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
      <div className="border-t border-line pt-10">
        <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">Watch it instead</h2>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">{primary.title}</h3>
        <p className="mt-2 text-lg italic text-ink-faint">“{primary.question}”</p>
        <p className="mt-3 text-sm text-ink-muted">
          {primary.blurb} <span className="num text-ink-faint">{mmss(runtimeOf(pageCut))}</span>
        </p>

        <div className="mt-6">
          <ExplainerPlayer explainer={pageCut} scenes={timeline(pageCut)} runtime={runtimeOf(pageCut)} />
        </div>

        {others.length > 0 && (
          <p className="mt-4 text-sm text-ink-faint">
            Also on this lesson&rsquo;s words:{' '}
            {others.map((e, i) => (
              <span key={e.id}>
                {i > 0 && ', '}
                <Link href={`/explain/${e.id}`} className="underline underline-offset-2 hover:text-ink-muted">
                  {e.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
