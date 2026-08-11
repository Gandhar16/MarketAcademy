/**
 * Automatic glossary linking.
 *
 * The audit that prompted this found 192 uses of jargon across 11 lessons with
 * not one definition attached. The obvious fix — ask authors to mark terms up by
 * hand — is the same fix that fails everywhere it is tried, because the author
 * is the one person in the world who cannot see which words are unfamiliar.
 *
 * So nobody marks anything up. The renderer finds glossary terms itself and
 * annotates the FIRST occurrence of each within a lesson, which is where a
 * definition is useful and after which it is clutter. Adding a term to the
 * glossary retroactively annotates every lesson that already used it.
 *
 * The awkward part is doing this to a string that already contains HTML. The
 * function below splits on tags and only ever rewrites the text between them,
 * so `<strong class="text-ink">` is never mangled by a match on "in" or "ink".
 */
import { GLOSSARY_BY_ID, GLOSSARY_LOOKUP } from '@/content/glossary';
import type { Block } from './dsl';

/** Tracks which terms have already been annotated, across a whole lesson. */
export type SeenTerms = Set<string>;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Acronyms match case-sensitively; everything else does not. See jargon.ts. */
function isAcronym(phrase: string): boolean {
  return /^[A-Z][A-Z&+.0-9]*$/.test(phrase) || /^T\+\d/.test(phrase);
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Annotates the first occurrence of each not-yet-seen glossary term.
 *
 * `html` must already be escaped and may contain tags. `seen` is mutated, which
 * is how "first occurrence in the LESSON" is achieved rather than "first
 * occurrence in this paragraph".
 */
export function annotateJargon(html: string, seen: SeenTerms): string {
  let working = html;

  for (const { phrase, id } of GLOSSARY_LOOKUP) {
    if (seen.has(id)) continue;
    const entry = GLOSSARY_BY_ID.get(id);
    if (!entry) continue;

    // A `neverAfter` word immediately before the term means it is not the term
    // at all: "in order to" is not an order. The lookbehind sits after the lead
    // group so that "an order" still matches.
    const guard = entry.neverAfter?.length
      ? `(?<!\\b(?:${entry.neverAfter.map(escapeRegExp).join('|')})\\s)`
      : '';
    const re = new RegExp(
      `(^|[^\\w-])${guard}(${escapeRegExp(phrase)})(?=$|[^\\w-])`,
      isAcronym(phrase) ? '' : 'i',
    );

    // Re-split on every term rather than once up front. The previous term's
    // replacement inserted a tag into what used to be a text segment, and a
    // stale split would let the NEXT term match inside that inserted markup —
    // which is how "market order" ended up also annotated as "order", with the
    // second button nested inside the first.
    const parts = working.split(/(<[^>]*>)/);
    let changed = false;

    for (let i = 0; i < parts.length; i += 2) {
      const text = parts[i];
      if (!text) continue;
      // Never annotate inside a term button. Otherwise re-running this on
      // already-annotated HTML nests buttons inside each other.
      if (i > 0 && /^<button[^>]*class="term"/.test(parts[i - 1])) continue;
      if (!re.test(text)) continue;

      parts[i] = text.replace(
        re,
        (_m, lead: string, matched: string) =>
          `${lead}<button type="button" class="term" data-term="${id}" aria-label="${escapeAttr(
            `What ${entry.term} means`,
          )}">${matched}</button>`,
      );
      changed = true;
      break;
    }

    if (changed) {
      working = parts.join('');
      seen.add(id);
    }
  }

  return working;
}

/**
 * The prose pipeline: escape, then inline markdown, then glossary annotation.
 *
 * Annotation runs LAST so that a term inside `**bold**` is still found — by
 * then the bold is a tag pair and the term is ordinary text between them, which
 * is exactly the case annotateJargon is built to handle.
 */
export function renderProse(md: string, seen: SeenTerms): string[] {
  return md
    .split(/\n\n+/)
    .map((p) =>
      annotateJargon(
        p
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink font-medium">$1</strong>')
          .replace(/`(.+?)`/g, '<code class="num text-accent">$1</code>'),
        seen,
      ),
    );
}

/**
 * Pre-renders every prose and callout body in a lesson, in reading order.
 *
 * Done up front rather than inside each Prose component because "first
 * occurrence" is a property of the lesson, not of a paragraph, and a Set
 * mutated during render would give different results on React's second pass.
 * Keyed by the source markdown, which is what the renderer has in hand.
 */
export function annotateLesson(blocks: Block[]): Map<string, string[]> {
  const seen: SeenTerms = new Set();
  const out = new Map<string, string[]>();

  const take = (text: unknown) => {
    if (typeof text !== 'string' || text.length === 0 || out.has(text)) return;
    out.set(text, renderProse(text, seen));
  };

  // Walked in the order a learner meets the text, not in field order, so that
  // "first occurrence" means the first one they actually read.
  for (const block of blocks) {
    switch (block.kind) {
      case 'prose':
        take(block.md);
        break;
      case 'callout':
        take(block.md);
        break;
      case 'widget':
        take(block.takeaway);
        break;
      case 'predict':
        take(block.prompt);
        // block.reveal is stripped server-side and arrives later from the API,
        // so it cannot participate in this pass. See annotateReveal below.
        break;
      case 'chart':
        take(block.takeaway);
        break;
      case 'example':
        take(block.setup);
        take(block.conclusion);
        break;
      case 'figure':
        take(block.caption);
        break;
      case 'checkpoint':
        for (const t of block.tasks) {
          take(t.prompt);
          take(t.explanation);
        }
        break;
      case 'game':
        break;
    }
  }

  return out;
}

/**
 * Annotates a reveal fetched from the server.
 *
 * A reveal is deliberately absent from the page until the learner commits, so
 * it cannot join the lesson-wide first-occurrence pass — by the time it exists,
 * that pass has already run. It therefore gets its own `seen` set, which means
 * a term already explained earlier in the lesson may be annotated a second time
 * here. That redundancy is the right trade: a spare dotted underline costs
 * nothing, and a reveal is often the densest paragraph in the whole lesson.
 */
export function annotateReveal(text: string): string[] {
  return renderProse(text, new Set());
}

/**
 * How much of a lesson's jargon is now explained. Used by the validator and
 * shown on the lesson page, so the number is visible rather than assumed.
 */
export function coverage(termsUsed: string[]): { used: number; defined: number; ratio: number } {
  const used = new Set(termsUsed);
  const defined = [...used].filter((id) => GLOSSARY_BY_ID.has(id)).length;
  return { used: used.size, defined, ratio: used.size === 0 ? 1 : defined / used.size };
}
