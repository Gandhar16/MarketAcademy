/**
 * An explainer, rendered to a frame of video.
 *
 * This file adds no content. Every word, number, scene and duration comes from
 * `src/content/explainers.ts`, and every picture is drawn by the same
 * `SceneView` the website uses. What lives here is only the things a file has
 * that a web page does not: a fixed canvas, a burned-in caption, and a title
 * that has to be on screen because there is no page around it.
 *
 * WHY THIS CAN EXIST AT ALL
 *
 * `SceneView` is a pure function of `elapsed`. A frame renderer asks for
 * t = 3.7s directly, out of order, with no clock running — and gets the same
 * pixels the site would show at 3.7s. That property is the entire reason a
 * video build is possible without a second copy of the content, and it is why
 * nothing in `Scenes.tsx` is allowed to read the wall clock again.
 *
 * THE PART THAT MATTERS FOR HONESTY
 *
 * An mp4 is the one artefact on this site that can go stale silently: it keeps
 * stating whatever rate it was rendered with, in a confident picture, long
 * after the law changed. The mitigation is not vigilance, it is derivation —
 * the file is a build output of the cost and options engines, so re-running the
 * render after a rate change produces a correct video, and a stale file is a
 * build that somebody did not re-run rather than a fact somebody has to
 * remember. `docs/video.md` records the re-render trigger.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { EXPLAINER_BY_ID, runtimeOf, timeline, type Explainer, type Scene } from '@/content/explainers';
import { SceneView } from '@/components/explain/Scenes';

/**
 * The canvas.
 *
 * 720p is the AUTHORING size, not the delivery size. Rendering with
 * `--scale=1.5` produces a true 1920×1080 file with text rasterised at the
 * larger size, which is sharp; laying the frame out at 1920 directly would mean
 * every size in here being a number nobody can picture. See `docs/video.md`.
 */
export const VIDEO = { fps: 30, width: 1280, height: 720 } as const;

/**
 * Frames a composition needs, rounded up.
 *
 * Derived from `runtimeOf`, which is derived from the captions, which are the
 * source of truth. Nobody types a duration anywhere in this pipeline.
 */
export function framesFor(explainer: Explainer): number {
  return Math.ceil(runtimeOf(explainer) * VIDEO.fps);
}

/**
 * Height the stage gives a scene, in composition pixels.
 *
 * Everything around it — header, caption, progress bar, padding — is fixed, so
 * this is simply what is left of 720 once they have had their share.
 */
export const STAGE_HEIGHT = 470;

/**
 * Roughly how tall a scene wants to be.
 *
 * This exists because a web page and a video frame disagree about what happens
 * when content does not fit. On the page the card grows and nobody notices. In
 * a frame there is nowhere to grow, so the seven-line cost breakdown ran off
 * the top into the title and off the bottom under the caption rule — which read
 * as a bug in the cost engine rather than as a layout overflow.
 *
 * Estimated rather than measured, on purpose. Measuring means render, read the
 * DOM, render again — a second pass the frame renderer has no reason to resolve
 * the same way twice. An estimate is a pure function of the scene, which is the
 * property this whole pipeline rests on. Being wrong by a few pixels costs a
 * slightly small picture; being non-deterministic costs a video that flickers
 * between two layouts.
 */
export function stageHeightOf(scene: Scene): number {
  switch (scene.kind) {
    case 'bars':
      // Label row, the bar itself, a note line where there is one, and the gap.
      return scene.bars.reduce((h, b) => h + (b.note ? 62 : 44), 0) + (scene.bars.length - 1) * 12;
    case 'chain':
      // One row of boxes whatever the step count — they lay out horizontally.
      return 120;
    case 'ladder':
      return 30 + Math.max(scene.bids.length, scene.asks.length) * 32 + 46;
  }
}

/**
 * Looked up rather than passed whole: composition props travel as JSON, and an
 * id cannot drift from the real explainer the way a copy can.
 *
 * A `type` rather than an `interface` on purpose — Remotion's `Composition`
 * wants props assignable to `Record<string, unknown>`, and only type aliases
 * get an implicit index signature in TypeScript.
 */
export type ExplainerVideoProps = {
  explainerId: string;
};

export function ExplainerVideo({ explainerId }: ExplainerVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const explainer = EXPLAINER_BY_ID.get(explainerId);

  if (!explainer) {
    // Cannot happen through the compositions below, which are generated from
    // EXPLAINERS. Rendered rather than thrown so a bad --props gives a legible
    // frame instead of a stack trace in a log nobody reads.
    return (
      <AbsoluteFill className="items-center justify-center bg-ground text-ink">
        <p className="text-2xl">Unknown explainer: {explainerId}</p>
      </AbsoluteFill>
    );
  }

  const scenes = timeline(explainer);
  const runtime = runtimeOf(explainer);
  const elapsed = frame / fps;

  // The last scene that has started. Same rule as the site player, deliberately
  // — if these two ever disagreed, the video would be a different explainer.
  const index = scenes.reduce((found, s, i) => (s.startsAt <= elapsed + 1e-6 ? i : found), 0);
  const current = scenes[index];

  return (
    <AbsoluteFill className="bg-ground font-sans">
      <div className="flex h-full flex-col justify-between px-14 pb-10 pt-9">
        {/* Header. On a page this is the <h1> and the breadcrumb above the
            player; in a file there is no page, so it has to be in frame. */}
        <header className="flex shrink-0 items-baseline justify-between gap-6">
          <h1 className="text-[22px] font-medium leading-tight text-ink">{explainer.title}</h1>
          <p className="shrink-0 text-[13px] uppercase tracking-[0.18em] text-ink-faint">
            {explainer.chapters[current.chapterIndex].title}
          </p>
        </header>

        {/* Stage. Fixed height so the caption never moves between a four-step
            chain and a seven-line breakdown — a caption that jumps around is
            the thing that makes home-made video look home-made.

            A scene too tall for the stage is scaled down to fit rather than
            clipped. Shrinking is the lesser harm: a slightly smaller diagram is
            still the diagram, whereas a clipped one silently drops the last
            row, and the last row of a cost breakdown is the SEBI fee — the one
            whose whole point is that it is small and still real. */}
        <div className="flex items-center justify-center" style={{ height: STAGE_HEIGHT }}>
          <div
            className="w-[980px]"
            style={{ transform: `scale(${Math.min(1, STAGE_HEIGHT / stageHeightOf(current.scene))})` }}
          >
            <SceneView scene={current.scene} elapsed={elapsed - current.startsAt} />
          </div>
        </div>

        {/* Caption. Burned in, because a video file has no page to put text on
            and no guarantee anyone ships a sidecar subtitle track with it. The
            transcript on the site remains the accessible copy. */}
        <div className="shrink-0 border-t border-line pt-6">
          <p className="min-h-[64px] text-[21px] leading-relaxed text-ink-muted">{current.caption}</p>

          <div className="mt-5 flex items-center gap-4">
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, (elapsed / runtime) * 100)}%` }}
              />
            </div>
            <span className="num shrink-0 text-[13px] tabular-nums text-ink-faint">market-academy.app</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
