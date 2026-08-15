import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { EXPLAINERS, runtimeOf } from '@/content/explainers';
import { STAGE_HEIGHT, VIDEO, framesFor, stageHeightOf } from './ExplainerVideo';

/**
 * The video build is only worth having if it cannot drift from the site.
 *
 * The risk is not that a render fails — a failed render is loud. It is that a
 * video succeeds and quietly says something the site no longer says: an old
 * rate, a dropped scene, a duration that cuts the last caption off mid-
 * sentence. These check the joins where that could happen.
 */
describe('video compositions', () => {
  it('gives every explainer enough frames for its full runtime', () => {
    // Rounded up, never down. Truncating means the final caption — which is
    // usually the one that says "and this is the part that costs you" — is cut
    // off before it can be read.
    for (const e of EXPLAINERS) {
      const seconds = framesFor(e) / VIDEO.fps;
      expect(seconds, `${e.id} is cut short`).toBeGreaterThanOrEqual(runtimeOf(e));
      // And not padded by more than the rounding, which would end on a dead frame.
      expect(seconds - runtimeOf(e), `${e.id} has dead air at the end`).toBeLessThan(1 / VIDEO.fps);
    }
  });

  it('renders at a size that scales to exactly 1920×1080', () => {
    // 1.5× is the documented render scale. If the composition size ever changed
    // to something that does not land on a standard frame, every platform that
    // ingests these would letterbox them.
    expect(VIDEO.width * 1.5).toBe(1920);
    expect(VIDEO.height * 1.5).toBe(1080);
  });

  it('generates one composition per explainer rather than listing them', () => {
    // A hand-kept list is where the set of videos falls behind the set of
    // explainers. Asserted on the source because the alternative is booting a
    // webpack bundle inside a unit test.
    const root = readFileSync(path.join(import.meta.dirname, 'Root.tsx'), 'utf8');
    expect(root).toContain('EXPLAINERS.map');
    for (const e of EXPLAINERS) {
      expect(root).not.toContain(`"${e.id}"`);
      expect(root).not.toContain(`'${e.id}'`);
    }
  });

  it('sizes every scene it will ever be asked to draw', () => {
    // The estimator is a switch over scene kinds. A new kind added to
    // `Scene` without a case here would fall through and return undefined,
    // which becomes `scale(NaN)` — an invisible scene, on a frame that renders
    // perfectly happily and says nothing.
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          const h = stageHeightOf(s.scene);
          expect(Number.isFinite(h), `${e.id}: ${s.scene.kind} has no height`).toBe(true);
          expect(h, `${e.id}: ${s.scene.kind}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('never shrinks a scene so far it stops being readable', () => {
    // Scaling to fit is the right call against clipping, but past a point a
    // legible diagram becomes a decorative one. If a scene ever trips this, the
    // fix is to split it across two scenes, not to shrink it further.
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          const fit = Math.min(1, STAGE_HEIGHT / stageHeightOf(s.scene));
          expect(fit, `${e.id} / ${chapter.title} draws at ${(fit * 100).toFixed(0)}%`).toBeGreaterThan(0.7);
        }
      }
    }
  });

  it('pins the fonts it loads', () => {
    // Unpinned, each font pulls every weight of every alphabet — hundreds of
    // requests, per browser tab, per render. It took frame throughput from
    // ~14 fps to ~2 fps when this was missed the first time.
    const root = readFileSync(path.join(import.meta.dirname, 'Root.tsx'), 'utf8');
    expect(root).toContain('weights:');
    expect(root).toContain('subsets:');
  });
});
