import { describe, expect, it } from 'vitest';
import { ASSUMED_VOCABULARY, GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_LOOKUP } from './glossary';
import { TIERS } from '@/lib/lesson/dsl';
import { mentionsTerm } from '@/lib/lesson/jargon';

describe('glossary integrity', () => {
  it('has unique, url-safe ids', () => {
    const ids = GLOSSARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9-]+$/);
  });

  it('has no phrase claimed by two entries', () => {
    const byPhrase = new Map<string, string>();
    for (const { phrase, id } of GLOSSARY_LOOKUP) {
      const key = phrase.toLowerCase();
      const existing = byPhrase.get(key);
      expect(existing === undefined || existing === id, `"${phrase}" is claimed by ${existing} and ${id}`).toBe(true);
      byPhrase.set(key, id);
    }
  });

  it('resolves every `needs` reference', () => {
    for (const e of GLOSSARY) {
      for (const n of e.needs ?? []) {
        expect(GLOSSARY_BY_ID.has(n), `${e.id} needs "${n}", which does not exist`).toBe(true);
      }
    }
  });

  it('has no dependency cycles', () => {
    // A cycle means two definitions each assume the other, which is exactly the
    // circularity this glossary exists to eliminate.
    const state = new Map<string, 'visiting' | 'done'>();
    const path: string[] = [];

    const visit = (id: string) => {
      const s = state.get(id);
      if (s === 'done') return;
      expect(s, `cycle: ${[...path, id].join(' -> ')}`).not.toBe('visiting');
      state.set(id, 'visiting');
      path.push(id);
      for (const n of GLOSSARY_BY_ID.get(id)?.needs ?? []) visit(n);
      path.pop();
      state.set(id, 'done');
    };

    for (const e of GLOSSARY) visit(e.id);
  });

  it('never depends on a term introduced later', () => {
    // If `option` is a T3 term, nothing at T0 may need it to be understood.
    for (const e of GLOSSARY) {
      if (!e.tier) continue;
      for (const n of e.needs ?? []) {
        const dep = GLOSSARY_BY_ID.get(n)!;
        if (!dep.tier) continue;
        expect(
          TIERS.indexOf(dep.tier),
          `${e.id} (${e.tier}) depends on ${n} (${dep.tier}), which comes later`,
        ).toBeLessThanOrEqual(TIERS.indexOf(e.tier));
      }
    }
  });
});

describe('definitions are actually plain', () => {
  it('never uses jargon in `plain` without declaring it in `needs`', () => {
    // This is the rule that makes the glossary usable rather than merely
    // present. A definition that leans on an undefined term has moved the
    // problem rather than solved it.
    const problems: string[] = [];

    for (const e of GLOSSARY) {
      // The six foundational words are exempt — see ASSUMED_VOCABULARY.
      const declared = new Set<string>([...(e.needs ?? []), ...ASSUMED_VOCABULARY]);
      for (const { phrase, id } of GLOSSARY_LOOKUP) {
        if (id === e.id || declared.has(id)) continue;
        if (mentionsTerm(e.plain, phrase)) {
          problems.push(`${e.id}.plain uses "${phrase}" (${id}) without listing it in needs`);
        }
      }
    }

    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('keeps every `plain` short enough to read in one go', () => {
    for (const e of GLOSSARY) {
      expect(e.plain.length, `${e.id} is ${e.plain.length} characters`).toBeLessThanOrEqual(340);
      expect(e.plain.length, `${e.id} is suspiciously short`).toBeGreaterThan(30);
    }
  });

  it('starts by saying what the thing IS', () => {
    // "A stop is an instruction" beats "A stop protects you from losses".
    // Enforced loosely: the first sentence must not open with a verb of purpose.
    for (const e of GLOSSARY) {
      expect(e.plain, `${e.id} opens by describing purpose rather than identity`).not.toMatch(
        /^(Protects|Helps|Lets you|Allows you|Used to|Used for)\b/i,
      );
    }
  });

  it('never uses jargon in `analogy` either', () => {
    // An analogy exists to be the ONE thing on the page a beginner can read
    // without a second lookup. Jargon in it defeats the entire purpose, so it
    // is held to exactly the same standard as `plain`.
    const problems: string[] = [];

    for (const e of GLOSSARY) {
      if (!e.analogy) continue;
      const declared = new Set<string>([...(e.needs ?? []), ...ASSUMED_VOCABULARY]);
      for (const { phrase, id } of GLOSSARY_LOOKUP) {
        if (id === e.id || declared.has(id)) continue;
        if (mentionsTerm(e.analogy, phrase)) {
          problems.push(`${e.id}.analogy uses "${phrase}" (${id}) without listing it in needs`);
        }
      }
    }

    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('gives every entry a category the glossary page knows how to show', () => {
    const known = new Set([
      'basics',
      'orders',
      'costs',
      'charts',
      'risk',
      'derivatives',
      'structure',
      'analysis',
      'india',
      'us',
    ]);
    for (const e of GLOSSARY) expect(known.has(e.category), `${e.id}: ${e.category}`).toBe(true);
  });
});

describe('lookup ordering', () => {
  it('matches the longest phrase first', () => {
    // Otherwise "market order" is annotated as "order" and the reader gets the
    // wrong definition for the word in front of them.
    const lengths = GLOSSARY_LOOKUP.map((l) => l.phrase.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
  });

  it('resolves "market order" to the market-order entry, not to "order"', () => {
    const first = GLOSSARY_LOOKUP.find((l) => mentionsTerm('place a market order now', l.phrase));
    expect(first?.id).toBe('market-order');
  });
});
