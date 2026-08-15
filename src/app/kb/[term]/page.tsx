/**
 * One page per term — a permanent, linkable, shareable definition.
 *
 * WHY THIS EXISTS SEPARATELY FROM /kb
 *
 * `/kb` is a search box over 116 entries, which serves the reader who knows
 * they want to look something up. It serves nobody else. It has no URL per
 * term, so a definition cannot be linked to, sent to somebody, bookmarked, or
 * found by anyone searching the web for the words they are stuck on — which is
 * how most people meet a glossary in the first place.
 *
 * The entries were already rich enough for a page each (plain, analogy, the
 * mechanism, a worked instance, and a dependency graph in both directions);
 * they were being rendered as a collapsed row in a long list. This page is
 * mostly a matter of showing what was already written.
 *
 * The section ORDER is the design, and it is deliberately not the order a
 * finance site usually uses. Plain words first, then the everyday comparison,
 * and only then the mechanism — because the reader arriving here is by
 * definition the one who did not understand the sentence they came from, and
 * leading with precision is what already failed them once.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORY_LABELS, GLOSSARY, GLOSSARY_BY_ID, type GlossaryEntry } from '@/content/glossary';
import { LESSONS } from '@/content/registry';
import { scanLesson } from '@/lib/lesson/jargon';
import { relatedTerms, spellingsFor } from '@/lib/glossary/related';
import { explainersForTerm } from '@/content/explainers';

export function generateStaticParams() {
  return GLOSSARY.map((e) => ({ term: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const entry = GLOSSARY_BY_ID.get(term);
  if (!entry) return { title: 'Term not found — Market Academy' };
  return {
    title: `${entry.term} — what it means, in plain words`,
    // The plain definition IS the description. It was written for exactly this
    // reader: someone who has never traded and met the word somewhere else.
    description: entry.plain,
  };
}

/** Which lessons actually use this term, computed rather than maintained. */
function lessonsUsing(id: string): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  for (const lesson of LESSONS) {
    if (scanLesson(lesson).some((hit) => hit.id === id)) out.push({ id: lesson.id, title: lesson.title });
  }
  return out;
}

export default async function TermPage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const entry = GLOSSARY_BY_ID.get(term);
  if (!entry) notFound();

  const { buildsOn, leadsTo, alsoIn } = relatedTerms(entry.id);
  const lessons = lessonsUsing(entry.id);
  const explainers = explainersForTerm(entry.id);
  const otherNames = spellingsFor(entry).filter((s) => s.toLowerCase() !== entry.term.toLowerCase());

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <Link href="/kb" className="text-sm text-ink-faint transition-colors hover:text-ink">
        ← Glossary
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-accent">{CATEGORY_LABELS[entry.category]}</span>
          {entry.tier && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
              {entry.tier}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{entry.term}</h1>
        {otherNames.length > 0 && (
          <p className="mt-2 text-sm text-ink-faint">Also called {otherNames.join(', ')}.</p>
        )}
      </header>

      <p className="mt-6 text-lg leading-relaxed text-ink">{entry.plain}</p>

      {entry.analogy && (
        <section className="mt-8 rounded-2xl border border-accent/30 bg-accent/[0.06] p-5 sm:p-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Think of it like…</h2>
          <p className="mt-3 leading-relaxed text-ink">{entry.analogy}</p>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            An analogy, not a definition. Everything strictly true is above and below this box — this is here to give
            you something to hang it on, and every comparison breaks down somewhere.
          </p>
        </section>
      )}

      {explainers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">Watch it happen</h2>
          <div className="mt-3 space-y-2">
            {explainers.map((ex) => (
              <Link
                key={ex.id}
                href={`/explain/${ex.id}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong"
              >
                <span aria-hidden className="text-accent">
                  ▶
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink">{ex.title}</span>
                  <span className="block text-xs text-ink-faint">{ex.blurb}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {entry.more && (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">How it actually works</h2>
          <p className="mt-3 leading-relaxed text-ink-muted">{entry.more}</p>
        </section>
      )}

      {entry.example && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">A real instance</h2>
          <p className="mt-3 leading-relaxed text-ink-muted">{entry.example}</p>
        </section>
      )}

      {buildsOn.length > 0 && (
        <TermList
          heading="Read these first"
          note="This definition is written in terms of these. If the words above did not land, the gap is usually here."
          entries={buildsOn}
        />
      )}

      {leadsTo.length > 0 && (
        <TermList
          heading="What this unlocks"
          note="These are defined using the word you just read, so they should make sense now."
          entries={leadsTo}
        />
      )}

      {lessons.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">Where this is taught properly</h2>
          <p className="mt-2 text-sm text-ink-faint">
            A definition tells you what a word means. These tell you what to do about it.
          </p>
          <ul className="mt-3 space-y-2">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/learn/${l.id}`}
                  className="block rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-line-strong"
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {alsoIn.length > 0 && (
        <TermList
          heading={`More in ${CATEGORY_LABELS[entry.category].toLowerCase()}`}
          note="Same area, no stated relationship — a way sideways if you have landed on the wrong word."
          entries={alsoIn}
        />
      )}

      <p className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-ink-faint">
        If you met this word on this site and this page did not clear it up, that is a defect in the glossary rather
        than a gap in your knowledge.{' '}
        <Link href="/kb" className="text-accent underline underline-offset-2">
          Search all {GLOSSARY.length} terms
        </Link>
        .
      </p>
    </main>
  );
}

function TermList({ heading, note, entries }: { heading: string; note: string; entries: GlossaryEntry[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">{heading}</h2>
      <p className="mt-2 text-sm text-ink-faint">{note}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((e) => (
          <Link
            key={e.id}
            href={`/kb/${e.id}`}
            className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
          >
            {e.term}
          </Link>
        ))}
      </div>
    </section>
  );
}
