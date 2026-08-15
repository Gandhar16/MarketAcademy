/**
 * What to show a reader at the bottom of a term page.
 *
 * The glossary already carries a dependency graph — `needs` says which other
 * definitions an entry leans on — and that graph is worth far more read in both
 * directions than it is as a validation rule.
 *
 * Read downward it answers "what do I have to understand before this sentence
 * makes sense", which is the question a confused reader actually has. Read
 * upward it answers "now that I have this, what does it unlock", which is the
 * question they have thirty seconds later. Neither list is maintained by hand,
 * so neither can go stale.
 *
 * The third list is the weakest and is labelled as such in the UI: same
 * category, no stated relationship. It exists because a reader who has landed
 * on the wrong term needs a way sideways, and an empty page is a dead end.
 */
import { GLOSSARY, GLOSSARY_BY_ID, type GlossaryEntry } from '@/content/glossary';

export interface RelatedTerms {
  /** Terms this one is defined in terms of — read these first. */
  buildsOn: GlossaryEntry[];
  /** Terms that lean on this one — read these next. */
  leadsTo: GlossaryEntry[];
  /** Same category, no stated relationship. A way sideways, not a path. */
  alsoIn: GlossaryEntry[];
}

const SIDEWAYS_LIMIT = 8;

export function relatedTerms(id: string): RelatedTerms {
  const entry = GLOSSARY_BY_ID.get(id);
  if (!entry) return { buildsOn: [], leadsTo: [], alsoIn: [] };

  const buildsOn = (entry.needs ?? [])
    .map((n) => GLOSSARY_BY_ID.get(n))
    .filter((e): e is GlossaryEntry => Boolean(e));

  const leadsTo = GLOSSARY.filter((e) => e.needs?.includes(id));

  // Anything already shown above is not shown again. A term appearing in two
  // lists reads as a bug, and the stronger relationship is the one worth
  // keeping.
  const claimed = new Set([id, ...buildsOn.map((e) => e.id), ...leadsTo.map((e) => e.id)]);
  const alsoIn = GLOSSARY.filter((e) => e.category === entry.category && !claimed.has(e.id)).slice(0, SIDEWAYS_LIMIT);

  return { buildsOn, leadsTo, alsoIn };
}

/**
 * Every spelling that should resolve to this entry's page.
 *
 * Includes the ambiguous ones. `searchAliases` exists to stop "put" being
 * auto-linked in prose, which is a rule about ANNOTATION — someone who types
 * "put" into a search box and lands here has been served correctly.
 */
export function spellingsFor(entry: GlossaryEntry): string[] {
  return [entry.term, ...(entry.aliases ?? []), ...(entry.searchAliases ?? [])];
}
