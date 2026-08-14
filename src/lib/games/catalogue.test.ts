/**
 * The catalogue must never disagree with the registry: a game listed on /play
 * with no component behind it is a dead link, and a component with no catalogue
 * entry is unreachable.
 */
import { describe, expect, it } from 'vitest';
import { GAMES_BY_SLUG, GAME_CATALOGUE } from './catalogue';
import { GAMES } from '@/components/games/registry';
import { BIAS_SCENARIOS, GAUNTLET_SCENARIOS } from './scenarios';
import { PATTERNS_BY_ID } from '@/lib/analysis/patterns';

describe('game catalogue', () => {
  it('has a registered component for every listed game', () => {
    for (const g of GAME_CATALOGUE) {
      expect(GAMES[g.slug], `no component registered for "${g.slug}"`).toBeDefined();
    }
  });

  it('has a catalogue entry for every registered component', () => {
    for (const slug of Object.keys(GAMES)) {
      expect(GAMES_BY_SLUG.get(slug), `"${slug}" is registered but not in the catalogue`).toBeDefined();
    }
  });

  it('uses unique, url-safe slugs', () => {
    const slugs = GAME_CATALOGUE.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it('gives every game a skill, a blurb and an intro', () => {
    for (const g of GAME_CATALOGUE) {
      // "IV crush" is eight characters and is a perfectly good skill name.
      expect(g.skill.length).toBeGreaterThanOrEqual(8);
      expect(g.blurb.length).toBeGreaterThan(30);
      expect(g.intro.length).toBeGreaterThan(60);
    }
  });

  it('delivers the twelve games the plan promised', () => {
    expect(GAME_CATALOGUE).toHaveLength(12);
  });
});

describe('Order Gauntlet scenarios', () => {
  it('covers every order type as a correct answer at least once', () => {
    const covered = new Set(GAUNTLET_SCENARIOS.map((s) => s.correct));
    expect(covered).toContain('MARKET');
    expect(covered).toContain('LIMIT');
    expect(covered).toContain('SL');
    expect(covered).toContain('SL-M');
  });

  it('explains the cost of the wrong answers', () => {
    for (const s of GAUNTLET_SCENARIOS) {
      const wrongOnes = Object.keys(s.costs);
      expect(wrongOnes.length, `${s.id} explains no wrong answers`).toBeGreaterThanOrEqual(2);
      expect(wrongOnes).not.toContain(s.correct);
      for (const text of Object.values(s.costs)) expect(text!.length).toBeGreaterThan(40);
    }
  });

  it('gives a workable amount of time and a real reason', () => {
    for (const s of GAUNTLET_SCENARIOS) {
      expect(s.seconds).toBeGreaterThanOrEqual(10);
      expect(s.seconds).toBeLessThanOrEqual(40);
      expect(s.reasoning.length).toBeGreaterThan(40);
      expect(s.situation.length).toBeGreaterThan(50);
    }
  });

  it('uses unique ids', () => {
    const ids = GAUNTLET_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Bias Buster scenarios', () => {
  it('keeps every index in range', () => {
    for (const s of BIAS_SCENARIOS) {
      expect(s.correctIndex).toBeLessThan(s.options.length);
      expect(s.trapIndex).toBeLessThan(s.options.length);
      expect(s.correctIndex).toBeGreaterThanOrEqual(0);
      expect(s.trapIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it('sets a trap that is not the correct answer — otherwise there is no bias to bust', () => {
    for (const s of BIAS_SCENARIOS) {
      expect(s.trapIndex, `${s.id} traps the correct answer`).not.toBe(s.correctIndex);
    }
  });

  it('explains WHY, at length, for every scenario', () => {
    for (const s of BIAS_SCENARIOS) {
      expect(s.reveal.length, `${s.id} reveal is too short to teach`).toBeGreaterThan(120);
      expect(s.bias.length).toBeGreaterThan(3);
    }
  });

  it('covers the biases that actually cost retail traders money', () => {
    const biases = BIAS_SCENARIOS.map((s) => s.bias.toLowerCase()).join(' ');
    for (const expected of ['disposition', 'anchoring', 'framing', 'sunk cost', 'outcome']) {
      expect(biases).toContain(expected);
    }
  });

  it('uses unique ids', () => {
    const ids = BIAS_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Candle Sprint choices', () => {
  it('offers only patterns the detector actually knows', () => {
    for (const id of ['bullish-engulfing', 'bearish-engulfing', 'doji', 'inside-bar', 'gap-up', 'gap-down'] as const) {
      expect(PATTERNS_BY_ID.has(id), `${id} is offered but not implemented`).toBe(true);
    }
  });
});
