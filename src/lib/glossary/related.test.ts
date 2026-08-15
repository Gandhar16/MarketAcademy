import { describe, expect, it } from 'vitest';
import { relatedTerms, spellingsFor } from './related';
import { COST_LINE_TERMS, termForCostLine } from './cost-terms';
import { GLOSSARY, GLOSSARY_BY_ID } from '@/content/glossary';

describe('relatedTerms', () => {
  it('reads the dependency graph downward', () => {
    const gst = GLOSSARY_BY_ID.get('gst')!;
    const { buildsOn } = relatedTerms('gst');
    expect(buildsOn.map((e) => e.id).sort()).toEqual([...(gst.needs ?? [])].sort());
  });

  it('reads the same graph upward', () => {
    // Nothing maintains this list; it is the reverse of every `needs` in the
    // glossary, which is exactly why it cannot rot.
    const { leadsTo } = relatedTerms('share');
    expect(leadsTo.length).toBeGreaterThan(0);
    for (const e of leadsTo) expect(e.needs).toContain('share');
  });

  it('never shows the same term in two lists', () => {
    // A term appearing twice on one page reads as a bug, and the stronger
    // relationship is the one worth keeping.
    for (const entry of GLOSSARY) {
      const { buildsOn, leadsTo, alsoIn } = relatedTerms(entry.id);
      const all = [...buildsOn, ...leadsTo, ...alsoIn].map((e) => e.id);
      expect(new Set(all).size, `${entry.id} repeats a related term`).toBe(all.length);
      expect(all, `${entry.id} lists itself`).not.toContain(entry.id);
    }
  });

  it('returns empty lists for an unknown id rather than throwing', () => {
    expect(relatedTerms('not-a-term')).toEqual({ buildsOn: [], leadsTo: [], alsoIn: [] });
  });
});

describe('spellingsFor', () => {
  it('includes the ambiguous spellings, which search should still find', () => {
    // `searchAliases` exists to stop "put" being auto-linked in prose. That is
    // a rule about annotation; somebody who types "put" and lands on the put
    // option page has been served correctly.
    const put = GLOSSARY_BY_ID.get('put-option')!;
    for (const alias of put.searchAliases ?? []) expect(spellingsFor(put)).toContain(alias);
  });
});

describe('cost line terms', () => {
  it('maps every key to a term that exists', () => {
    for (const [key, termId] of Object.entries(COST_LINE_TERMS)) {
      if (termId === null) continue;
      expect(GLOSSARY_BY_ID.has(termId), `cost line "${key}" maps to "${termId}", which does not exist`).toBe(true);
    }
  });

  it('covers every charge the India engine can emit', () => {
    // This is the mapping that answers the original complaint — a row labelled
    // "STT" with nowhere to go. A new charge line added to the engine without
    // a definition behind it should fail here rather than ship unexplained.
    for (const key of ['brokerage', 'stt', 'stamp', 'gst', 'exchange_txn', 'sebi', 'dp_cdsl', 'dp_broker']) {
      expect(termForCostLine(key), `no definition behind the "${key}" charge`).not.toBeNull();
    }
  });

  it('returns null for an unmapped key rather than guessing', () => {
    expect(termForCostLine('something-new')).toBeNull();
  });
});
