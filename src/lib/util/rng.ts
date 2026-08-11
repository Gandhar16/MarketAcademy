/**
 * Seeded pseudo-random number generation.
 *
 * Used only where the app is explicitly running a MODEL rather than showing the
 * market — Monte-Carlo ruin simulations, engineered losing streaks for the tilt
 * scenarios. Never used to generate prices that are presented as real
 * (PLAN.md §7.1).
 *
 * Seeded rather than Math.random for two reasons: a learner can be handed the
 * same sequence twice to compare two decisions on identical draws, and a
 * surprising result can be reproduced exactly when they ask "was that rigged?".
 */

/** mulberry32 — small, fast, good enough for teaching. Not cryptographic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic seed from a string, so a scenario id always replays identically. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
