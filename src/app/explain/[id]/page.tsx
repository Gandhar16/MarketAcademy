import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EXPLAINER_BY_ID, EXPLAINERS } from '@/content/explainers';
import { GLOSSARY_BY_ID } from '@/content/glossary';
import { ExplainerPlayer, ExplainerTranscript } from '@/components/explain/ExplainerPlayer';

export function generateStaticParams() {
  return EXPLAINERS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const explainer = EXPLAINER_BY_ID.get(id);
  if (!explainer) return { title: 'Explainer not found — Market Academy' };
  return { title: `${explainer.title} — Market Academy`, description: explainer.blurb };
}

export default async function ExplainerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const explainer = EXPLAINER_BY_ID.get(id);
  if (!explainer) notFound();

  const terms = explainer.terms.map((t) => GLOSSARY_BY_ID.get(t)).filter((e) => e != null);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Link href="/explain" className="text-sm text-ink-faint transition-colors hover:text-ink">
        ← Explainers
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">{explainer.title}</h1>
      <p className="mt-2 text-lg italic text-ink-faint">“{explainer.question}”</p>

      <div className="mt-8">
        <ExplainerPlayer explainer={explainer} />
      </div>

      {terms.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">Words used here</h2>
          <p className="mt-2 text-sm text-ink-faint">Each one has a page of its own, in plain words.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {terms.map((t) => (
              <Link
                key={t.id}
                href={`/kb/${t.id}`}
                className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
              >
                {t.term}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ExplainerTranscript explainer={explainer} />
    </main>
  );
}
