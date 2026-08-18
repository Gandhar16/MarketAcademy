import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SceneView } from '@/components/explain/Scenes';
import type { Medium } from './explainers';
import { ANALOGIES } from './analogies';
import { SECOND_ANALOGIES } from './analogies-second';
import { GLOSSARY_BY_ID } from './glossary';
import { EXPLAINERS } from './explainers';

describe('the second analogies', () => {
  it('is keyed only by terms that exist', () => {
    for (const id of Object.keys(SECOND_ANALOGIES)) {
      expect(GLOSSARY_BY_ID.has(id), `SECOND_ANALOGIES has "${id}", which is not a glossary term`).toBe(true);
    }
  });

  it('only pairs with a concept that already has a first one', () => {
    // A second comparison with no first is not a pair, it is a replacement that
    // skipped the no-jargon test the glossary applies to `analogies.ts`.
    for (const id of Object.keys(SECOND_ANALOGIES)) {
      expect(ANALOGIES[id], `"${id}" has a second analogy but no first`).toBeTruthy();
    }
  });

  /**
   * The reason the pair exists. Two comparisons drawn from the same corner of
   * life are one comparison written twice, and reach exactly the people the
   * first one already reached.
   */
  it('never restates the first in different words', () => {
    for (const [id, text] of Object.entries(SECOND_ANALOGIES)) {
      expect(text, id).not.toBe(ANALOGIES[id]);

      // Crude but effective: if the two share most of their distinctive words,
      // they are the same comparison.
      const words = (s: string) =>
        new Set(
          s
            .toLowerCase()
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 4),
        );
      const first = words(ANALOGIES[id]);
      const second = words(text);
      const shared = [...second].filter((w) => first.has(w)).length;
      const overlap = shared / Math.max(1, second.size);
      expect(overlap, `${id}: the two analogies share ${Math.round(overlap * 100)}% of their words`).toBeLessThan(0.4);
    }
  });

  it('stays short enough to be a handhold rather than a second lesson', () => {
    for (const [id, text] of Object.entries(SECOND_ANALOGIES)) {
      expect(text.length, `${id} is ${text.length} characters`).toBeLessThanOrEqual(400);
      expect(text.length, `${id} is too short to be an analogy`).toBeGreaterThan(40);
    }
  });

  it('never promises a result', () => {
    for (const [id, text] of Object.entries(SECOND_ANALOGIES)) {
      expect(text, id).not.toMatch(
        /\b(guaranteed to (rise|go up|profit)|always (goes|comes) back|cannot lose|risk-free)\b/i,
      );
    }
  });

  /**
   * Kept out of `glossary.ts`'s import graph on purpose: three client
   * components import the glossary, so anything it reaches is downloaded on
   * every route including /login. These are read by `explainers.ts` alone,
   * which is server-side, and arrive in the browser as the props of the single
   * explainer being watched.
   */
  it('is not merged into the glossary', () => {
    for (const id of Object.keys(SECOND_ANALOGIES)) {
      expect(GLOSSARY_BY_ID.get(id)?.analogy, `"${id}"`).not.toBe(SECOND_ANALOGIES[id]);
    }
  });
});

describe('comparison scenes', () => {
  it('takes its second comparison from the shared list, never retyped', () => {
    const known = new Set(Object.values(SECOND_ANALOGIES));
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          if (s.scene.kind !== 'compare' || !s.scene.everydaySecond) continue;
          expect(known.has(s.scene.everydaySecond), `${e.id} / ${chapter.title} invents a second analogy`).toBe(true);
        }
      }
    }
  });

  it('gives every comparison scene both halves of the pair', () => {
    const missing: string[] = [];
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          if (s.scene.kind === 'compare' && !s.scene.everydaySecond) missing.push(`${e.id} / ${chapter.title}`);
        }
      }
    }
    expect(missing, `comparison scenes with only one everyday example: ${missing.join(', ')}`).toEqual([]);
  });
});


/**
 * Rendered rather than merely wired.
 *
 * The player mounts only the scene it is currently showing, so nothing in the
 * page's initial HTML proves the second panel exists — the strings appear in
 * the payload whether or not anything draws them. Rendering the component is
 * what actually checks it, and it pins the one thing that would otherwise be
 * silently wrong forever: the video cut showing text the narrator never reads.
 *
 * `createElement` rather than JSX only because this suite collects `.test.ts`,
 * and widening that pattern for one file is a worse trade than one plain call.
 */
describe('drawing a comparison scene', () => {
  const scene = EXPLAINERS.flatMap((e) => e.chapters)
    .flatMap((c) => c.scenes)
    .map((s) => s.scene)
    .find((s) => s.kind === 'compare' && s.everydaySecond);

  // `elapsed` far past the end, so every staggered entrance has finished.
  const draw = (medium: Medium) => renderToStaticMarkup(createElement(SceneView, { scene: scene!, elapsed: 99, medium }));

  it('finds a paired comparison scene to draw', () => {
    expect(scene).toBeDefined();
  });

  it('shows both everyday comparisons on the page', () => {
    const html = draw('page');
    expect(html).toContain('Or, if that is not your world');
    if (scene?.kind === 'compare') {
      expect(html).toContain(scene.everyday.slice(0, 40));
      expect(html).toContain(scene.everydaySecond!.slice(0, 40));
    }
  });

  it('shows only the narrated one in the video', () => {
    const html = draw('video');
    expect(html).not.toContain('Or, if that is not your world');
    if (scene?.kind === 'compare') {
      expect(html).toContain(scene.everyday.slice(0, 40));
      expect(html).not.toContain(scene.everydaySecond!.slice(0, 40));
    }
  });

  it('always says where the comparison breaks, in both cuts', () => {
    for (const medium of ['page', 'video'] as const) {
      expect(draw(medium), medium).toContain('Where the comparison breaks');
    }
  });
});
