import Link from 'next/link';
import { EXPLAINERS, runtimeOf } from '@/content/explainers';

export const metadata = {
  title: 'Explainers — Market Academy',
  description:
    'Short animated walkthroughs of the mechanisms that catch people out — where your money goes, what happens when you press buy, why an option expires worthless.',
};

export default function ExplainIndexPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Explainers</h1>
      <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
        Short animated walkthroughs of the mechanisms that catch people out. Each one answers a question in the words
        somebody stuck would actually use, and each is under three minutes.
      </p>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-faint">
        These are drawn in code rather than recorded, which is why the figures in them come from the same engine that
        prices real trades. Change a tax rate and the explainer re-derives itself — a recorded video would go on
        confidently stating the old one.
      </p>

      <div className="mt-8 space-y-3">
        {EXPLAINERS.map((ex) => (
          <Link
            key={ex.id}
            href={`/explain/${ex.id}`}
            className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:p-6"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium text-ink">{ex.title}</h2>
              <span className="num shrink-0 text-xs text-ink-faint">
                {Math.round(runtimeOf(ex) / 60)} min
              </span>
            </div>
            <p className="mt-1 text-sm italic text-ink-faint">“{ex.question}”</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{ex.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
