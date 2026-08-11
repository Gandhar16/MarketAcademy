'use client';

/**
 * The knowledge base: every term the site uses, searchable, in plain words.
 *
 * Search matches the definition text as well as the term, because the reader who
 * most needs this page is the one who does not know the word yet. Someone who
 * types "the price I get if I sell" should land on `bid` — searching only titles
 * would help exactly the people who need no help.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CATEGORY_LABELS,
  GLOSSARY,
  GLOSSARY_BY_ID,
  type GlossaryCategory,
  type GlossaryEntry,
} from '@/content/glossary';

const CATEGORY_ORDER: GlossaryCategory[] = [
  'basics',
  'orders',
  'structure',
  'charts',
  'costs',
  'risk',
  'derivatives',
  'analysis',
  'india',
  'us',
];

export function KnowledgeBase({ lessonsByTerm }: { lessonsByTerm: Record<string, { id: string; title: string }[]> }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (!q) return true;
      return (
        e.term.toLowerCase().includes(q) ||
        [...(e.aliases ?? []), ...(e.searchAliases ?? [])].some((a) => a.toLowerCase().includes(q)) ||
        e.plain.toLowerCase().includes(q) ||
        (e.more ?? '').toLowerCase().includes(q) ||
        (e.example ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const grouped = useMemo(() => {
    const map = new Map<GlossaryCategory, GlossaryEntry[]>();
    for (const e of results) {
      const list = map.get(e.category) ?? [];
      list.push(e);
      map.set(e.category, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.term.localeCompare(b.term));
    return map;
  }, [results]);

  const categoriesPresent = CATEGORY_ORDER.filter((c) => grouped.has(c));

  return (
    <div>
      <div className="sticky top-[3.5rem] z-30 -mx-6 bg-ground/95 px-6 pb-4 pt-4 backdrop-blur">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — a word, or a description of what you mean"
          aria-label="Search the glossary"
          className="input"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            Everything ({GLOSSARY.length})
          </Chip>
          {CATEGORY_ORDER.map((c) => {
            const count = GLOSSARY.filter((e) => e.category === c).length;
            if (count === 0) return null;
            return (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {CATEGORY_LABELS[c]} ({count})
              </Chip>
            );
          })}
        </div>
      </div>

      {results.length === 0 && (
        <p className="mt-10 rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
          Nothing matches “{query}”. If it is a word you met on this site and it is not here, that is a bug in the
          glossary rather than a gap in your knowledge.
        </p>
      )}

      {categoriesPresent.map((c) => (
        <section key={c} className="mt-12">
          <h2 className="text-sm uppercase tracking-[0.2em] text-accent">{CATEGORY_LABELS[c]}</h2>
          <div className="mt-4 space-y-3">
            {grouped.get(c)!.map((entry) => (
              <Entry key={entry.id} entry={entry} lessons={lessonsByTerm[entry.id] ?? []} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Entry({ entry, lessons }: { entry: GlossaryEntry; lessons: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const hasMore = Boolean(entry.more || entry.example || entry.needs?.length || lessons.length);

  return (
    <article id={entry.id} className="scroll-mt-32 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-medium text-ink">{entry.term}</h3>
        {entry.tier && (
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
            {entry.tier}
          </span>
        )}
        {entry.aliases && entry.aliases.length > 0 && (
          <span className="text-xs text-ink-faint">also: {entry.aliases.slice(0, 4).join(', ')}</span>
        )}
      </div>

      <p className="mt-2 leading-relaxed text-ink-muted">{entry.plain}</p>

      {hasMore && !open && (
        <button onClick={() => setOpen(true)} className="mt-3 text-xs text-accent hover:underline">
          More →
        </button>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {entry.more && <p className="text-sm leading-relaxed text-ink-muted">{entry.more}</p>}

          {entry.example && (
            <p className="rounded-lg bg-ground/60 px-3 py-2 text-sm leading-relaxed text-ink-faint">{entry.example}</p>
          )}

          {entry.needs && entry.needs.length > 0 && (
            <p className="text-xs text-ink-faint">
              Builds on:{' '}
              {entry.needs.map((n, i) => (
                <span key={n}>
                  {i > 0 && ', '}
                  <a href={`#${n}`} className="text-accent hover:underline">
                    {GLOSSARY_BY_ID.get(n)?.term ?? n}
                  </a>
                </span>
              ))}
            </p>
          )}

          {lessons.length > 0 && (
            <p className="text-xs text-ink-faint">
              Taught in:{' '}
              {lessons.map((l, i) => (
                <span key={l.id}>
                  {i > 0 && ', '}
                  <Link href={`/learn/${l.id}`} className="text-accent hover:underline">
                    {l.title}
                  </Link>
                </span>
              ))}
            </p>
          )}

          <button onClick={() => setOpen(false)} className="text-xs text-ink-faint hover:text-ink">
            Less
          </button>
        </div>
      )}
    </article>
  );
}
