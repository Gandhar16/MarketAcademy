import { describe, expect, it } from 'vitest';
import { ANALOGIES } from './analogies';
import { GLOSSARY, GLOSSARY_BY_ID } from './glossary';

describe('analogies', () => {
  it('is keyed only by terms that exist', () => {
    // A renamed term should fail loudly here rather than silently dropping its
    // analogy, which nothing else on the site would notice.
    for (const id of Object.keys(ANALOGIES)) {
      expect(GLOSSARY_BY_ID.has(id), `ANALOGIES has "${id}", which is not a glossary term`).toBe(true);
    }
  });

  it('reaches every entry a beginner meets first', () => {
    // T0 and T1 are the tiers where a reader has nothing to hang a definition
    // on yet, so an analogy matters most there and is optional later.
    const missing = GLOSSARY.filter((e) => (e.tier === 'T0' || e.tier === 'T1') && !e.analogy).map((e) => e.id);
    expect(missing, `no analogy for beginner terms: ${missing.join(', ')}`).toEqual([]);
  });

  it('is attached to the entries the rest of the site reads', () => {
    // The merge in glossary.ts is easy to break and hard to notice, because
    // every page keeps rendering — just without the analogy section.
    const count = GLOSSARY.filter((e) => e.analogy).length;
    expect(count).toBe(Object.keys(ANALOGIES).length);
  });

  it('stays short enough to be a handhold rather than a second lesson', () => {
    for (const [id, text] of Object.entries(ANALOGIES)) {
      expect(text.length, `${id} is ${text.length} characters`).toBeLessThanOrEqual(400);
      expect(text.length, `${id} is too short to be an analogy`).toBeGreaterThan(40);
    }
  });

  it('never promises a result, which is the one voice this site argues with', () => {
    // Same rule the encouragement pool follows. An analogy is a friendly
    // register, and friendly registers are where "it always bounces back"
    // sneaks in.
    for (const [id, text] of Object.entries(ANALOGIES)) {
      expect(text, id).not.toMatch(/\b(guaranteed to (rise|go up|profit)|always (goes|comes) back|cannot lose|risk-free)\b/i);
    }
  });
});
