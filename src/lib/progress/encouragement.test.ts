import { describe, expect, it } from 'vitest';
import { ENCOURAGEMENT_POOLS, encouragement, type Mood } from './encouragement';

const MOODS = Object.keys(ENCOURAGEMENT_POOLS) as Mood[];

describe('the pools themselves', () => {
  it('has messages for every mood', () => {
    for (const m of MOODS) expect(ENCOURAGEMENT_POOLS[m].length, m).toBeGreaterThan(2);
  });

  it('never repeats a line, within a pool or across them', () => {
    const all = MOODS.flatMap((m) => ENCOURAGEMENT_POOLS[m]);
    expect(new Set(all).size).toBe(all.length);
  });

  it('never predicts a future result', () => {
    // The one thing these messages may not do. "It will come good", "you'll get
    // the next one" — that is gambler's talk, and it is exactly the voice this
    // site exists to argue with.
    const forbidden = /\b(next time it|will come good|you'?ll win|due for|bound to|luck will)\b/i;
    for (const m of MOODS) {
      for (const line of ENCOURAGEMENT_POOLS[m]) expect(line, line).not.toMatch(forbidden);
    }
  });
});

describe('picking a message', () => {
  it('is stable for one run', () => {
    // Stored on the run and shown again on every read. A random pick would give
    // the same run different words each time the page loaded, which reads as a bug.
    const id = 'e3f1b0c2-run';
    expect(encouragement('stopped-out', id)).toBe(encouragement('stopped-out', id));
  });

  it('varies across runs', () => {
    const seen = new Set(
      Array.from({ length: 200 }, (_, i) => encouragement('stopped-out', `run-${i}`)),
    );
    expect(seen.size).toBe(ENCOURAGEMENT_POOLS['stopped-out'].length);
  });

  it('spreads reasonably evenly rather than favouring one line', () => {
    const pool = ENCOURAGEMENT_POOLS.lost;
    const counts = new Map<string, number>();
    for (let i = 0; i < 1_000; i++) {
      const m = encouragement('lost', `seed-${i}`);
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    const expected = 1_000 / pool.length;
    for (const [line, n] of counts) expect(n, line).toBeGreaterThan(expected * 0.5);
  });

  it('always returns a message from the mood asked for', () => {
    for (const m of MOODS) {
      expect(ENCOURAGEMENT_POOLS[m]).toContain(encouragement(m, 'x'));
    }
  });
});
