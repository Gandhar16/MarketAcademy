/**
 * One composition per explainer, generated rather than listed.
 *
 * Adding a fourth explainer to `src/content/explainers.ts` makes a fourth video
 * renderable with no edit here. The alternative — a hand-kept list — is a place
 * for the set of videos to quietly fall behind the set of explainers, which is
 * the same class of staleness the whole pipeline exists to avoid.
 */
import { Composition } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { EXPLAINERS } from '@/content/explainers';
import { ExplainerVideo, VIDEO, framesFor } from './ExplainerVideo';

// The site gets these through `next/font`, which does not exist outside Next.
// Loading them here is not decoration: `--font-mono` is what makes every rupee
// figure tabular, and a proportional fallback makes columns of numbers wobble
// line to line — the exact thing the token was introduced to prevent.
//
// The weights and subsets are pinned rather than left to default. Unpinned,
// each of these pulls every weight of every alphabet — 126 requests for Inter
// and 96 for JetBrains Mono, PER TAB, and the renderer opens one tab per unit
// of concurrency. That is a few hundred round trips before the first frame is
// drawn, repeated for every tab, on a render that has no business touching the
// network at all. Two weights of latin is what these frames actually use.
// Written out twice rather than shared: the two families expose different
// weight unions, so a shared literal has to be widened to `string[]` to fit
// both — which throws away the exact checking that catches a weight the family
// does not publish.
loadInter('normal', {
  weights: ['400', '500'],
  subsets: ['latin', 'latin-ext'],
  ignoreTooManyRequestsWarning: true,
});
loadMono('normal', {
  weights: ['400', '500'],
  subsets: ['latin', 'latin-ext'],
  ignoreTooManyRequestsWarning: true,
});

// The site's own stylesheet — tokens, themes, fonts, the lot. The video is
// painted with the same variables as the page, so `bg-accent` in a scene is
// the same amber in the file as it is on screen.
import '../src/app/globals.css';

export function RemotionRoot() {
  return (
    <>
      {EXPLAINERS.map((explainer) => (
        <Composition
          key={explainer.id}
          id={explainer.id}
          component={ExplainerVideo}
          durationInFrames={framesFor(explainer)}
          fps={VIDEO.fps}
          width={VIDEO.width}
          height={VIDEO.height}
          defaultProps={{ explainerId: explainer.id }}
        />
      ))}
    </>
  );
}
