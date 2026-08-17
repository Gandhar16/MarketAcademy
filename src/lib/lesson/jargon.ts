/**
 * Finds jargon in lesson text.
 *
 * The lessons are written in plain-sounding English, which turned out not to be
 * the same thing as being readable by a beginner. This module measures the gap
 * instead of arguing about it: given a lesson, it reports which glossary terms
 * the lesson uses and, of those, which one appears FIRST for each — because the
 * first appearance is the one that has to carry a definition.
 *
 * Matching is deliberately conservative. It is word-boundary-anchored,
 * case-insensitive except for all-caps acronyms, and skips anything already
 * inside a `[[term]]` marker. A false positive here costs an author thirty
 * seconds; a false negative ships a lesson that loses a beginner on line one.
 */
import { GLOSSARY_BY_ID, GLOSSARY_LOOKUP, type GlossaryEntry } from '@/content/glossary';
import type { Block, Lesson } from './dsl';

/** `[[stop-loss]]` or `[[stop-loss|the stop]]` — the author's mark that a term is introduced here. */
export const TERM_MARKER = /\[\[([a-z0-9-]+)(\|[^\]]+)?\]\]/g;

export interface JargonHit {
  id: string;
  phrase: string;
  /** Index of the block the term first appears in. */
  blockIndex: number;
  /** True when that first appearance is inside a `[[...]]` marker. */
  introduced: boolean;
}

/** All human-readable text in a block, in the order a reader meets it. */
export function blockText(block: Block): string {
  const parts: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string') parts.push(v);
  };

  switch (block.kind) {
    case 'prose':
      push(block.md);
      break;
    case 'callout':
      push(block.title);
      push(block.md);
      break;
    case 'widget':
      push(block.takeaway);
      break;
    case 'predict':
      push(block.prompt);
      block.options.forEach(push);
      push(block.reveal);
      break;
    case 'chart':
      push(block.takeaway);
      break;
    case 'game':
      break;
    case 'example':
      push(block.title);
      push(block.setup);
      push(block.conclusion);
      for (const s of block.steps) {
        push(s.label);
        push(s.detail);
      }
      break;
    case 'figure':
      push(block.caption);
      break;
    case 'checkpoint':
      for (const t of block.tasks) {
        push(t.prompt);
        push(t.explanation);
      }
      break;
  }

  return parts.filter(Boolean).join('\n');
}

/** Strips `[[id|label]]` down to its label so matching sees ordinary prose. */
export function stripMarkers(text: string): string {
  return text.replace(TERM_MARKER, (_m, id: string, label?: string) => (label ? label.slice(1) : id.replace(/-/g, ' ')));
}

/** The glossary ids explicitly introduced in a piece of text. */
export function markedTerms(text: string): string[] {
  return [...text.matchAll(TERM_MARKER)].map((m) => m[1]);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * An acronym is matched case-sensitively. Otherwise "IV" collides with the
 * pronoun in "I've", and "R" with every capital R in the document.
 */
function isAcronym(phrase: string): boolean {
  return /^[A-Z][A-Z&+.0-9]*$/.test(phrase) || /^T\+\d/.test(phrase);
}

/**
 * Compiled matchers, kept rather than rebuilt.
 *
 * This function is called once per glossary phrase per block, which across the
 * whole curriculum is hundreds of thousands of calls — and it was compiling a
 * fresh RegExp on every one of them. The pattern depends only on the phrase and
 * its guard, so it is the same object every time and caching it is free.
 *
 * Note the missing `g` flag, which the old pattern carried. `.test()` on a
 * global regex advances `lastIndex` and resumes from there on the next call, so
 * a cached one would start answering "no" to matches it had already found. The
 * flag never did anything useful here — the result is a boolean either way —
 * and dropping it is what makes the cache correct rather than subtly broken.
 */
const MATCHERS = new Map<string, RegExp>();

export function mentionsTerm(text: string, phrase: string, neverAfter?: string[]): boolean {
  // Case sensitivity is the only flag that changes the answer: an all-caps
  // acronym must not match the ordinary word that shares its letters.
  const flags = isAcronym(phrase) ? '' : 'i';
  // Kept deliberately in step with annotate.ts. If the scanner and the
  // annotator disagree, the validator either complains about a word the reader
  // was never shown a definition for, or stays silent about one they were.
  const guard = neverAfter?.length ? `(?<!\\b(?:${neverAfter.map(escapeRegExp).join('|')})\\s)` : '';

  // JSON rather than a joined string: a `neverAfter` guard contains `|` and
  // regex punctuation, so an ad-hoc separator could collide across entries.
  const key = JSON.stringify([flags, guard, phrase]);
  let matcher = MATCHERS.get(key);
  if (!matcher) {
    matcher = new RegExp(`(^|[^\\w-])${guard}${escapeRegExp(phrase)}(?=$|[^\\w-])`, flags);
    MATCHERS.set(key, matcher);
  }
  return matcher.test(text);
}

/**
 * Scans are memoised on the lesson object itself.
 *
 * `inheritedTerms` walks the whole prerequisite chain beneath a lesson and
 * scans every ancestor it reaches. Run that for all 87 lessons and the deep
 * ones near the end of the curriculum re-scan the same handful of foundational
 * lessons over and over — the same answer, recomputed hundreds of times, at
 * roughly a glossary-sized pass each. It is what made validating the curriculum
 * take two and a half seconds.
 *
 * A `WeakMap` keyed on identity, so this is sound for the only shapes that
 * exist: the registry's lessons are module constants that never change, and a
 * test that builds a synthetic lesson gets a new object and therefore a new
 * entry. Nothing is held alive that would otherwise be collected.
 */
const SCANS = new WeakMap<Lesson, JargonHit[]>();

/**
 * Every glossary term a lesson uses, with the block it first appears in and
 * whether that first appearance was marked up as an introduction.
 */
export function scanLesson(lesson: Lesson): JargonHit[] {
  const cached = SCANS.get(lesson);
  if (cached) return cached;

  const first = new Map<string, JargonHit>();

  lesson.blocks.forEach((block, blockIndex) => {
    const raw = blockText(block);
    if (!raw) return;

    const introducedHere = new Set(markedTerms(raw));
    const plain = stripMarkers(raw);

    for (const { phrase, id } of GLOSSARY_LOOKUP) {
      if (first.has(id)) continue;
      if (!introducedHere.has(id) && !mentionsTerm(plain, phrase, GLOSSARY_BY_ID.get(id)?.neverAfter)) continue;
      first.set(id, { id, phrase, blockIndex, introduced: introducedHere.has(id) });
    }
  });

  const hits = [...first.values()].sort((a, b) => a.blockIndex - b.blockIndex);
  SCANS.set(lesson, hits);
  return hits;
}

/**
 * Terms a learner can be assumed to already have, because a prerequisite lesson
 * introduced them. Walks the prerequisite graph, so a T3 lesson inherits from
 * the whole chain beneath it rather than only its immediate parents.
 */
export function inheritedTerms(lesson: Lesson, byId: Map<string, Lesson>): Set<string> {
  const known = new Set<string>();
  const seen = new Set<string>();

  const walk = (id: string) => {
    if (seen.has(id)) return; // Also the cycle guard.
    seen.add(id);
    const parent = byId.get(id);
    if (!parent) return;
    for (const term of parent.introduces ?? []) known.add(term);
    for (const hit of scanLesson(parent)) {
      if (hit.introduced) known.add(hit.id);
    }
    for (const p of parent.prerequisites ?? []) walk(p);
  };

  for (const p of lesson.prerequisites ?? []) walk(p);
  return known;
}

export interface UndefinedTerm {
  id: string;
  term: string;
  phrase: string;
  blockIndex: number;
  entry: GlossaryEntry;
}

/**
 * The actual audit: terms used without ever being introduced here, and not
 * available from a prerequisite either.
 */
export function undefinedTerms(lesson: Lesson, byId: Map<string, Lesson>): UndefinedTerm[] {
  const inherited = inheritedTerms(lesson, byId);
  const here = new Set(lesson.introduces ?? []);

  return scanLesson(lesson)
    .filter((hit) => !hit.introduced && !here.has(hit.id) && !inherited.has(hit.id))
    .map((hit) => {
      const entry = GLOSSARY_BY_ID.get(hit.id)!;
      return { id: hit.id, term: entry.term, phrase: hit.phrase, blockIndex: hit.blockIndex, entry };
    });
}
