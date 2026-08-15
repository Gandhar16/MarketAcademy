'use client';

/**
 * The player. It behaves like a video and is not one.
 *
 * The clock is the whole design. One number — elapsed seconds — drives which
 * scene is showing, which caption is under it, which chapter is highlighted,
 * and where the scrub handle sits. Everything else is derived from it, so there
 * is no way for the caption to disagree with the picture, which is the bug that
 * makes home-made players feel broken.
 *
 * Three decisions worth keeping:
 *
 *  - **It does not autoplay.** A page that starts moving and talking the moment
 *    it loads is the behaviour everyone has learned to resent, and it is
 *    actively hostile to anyone reading with a screen reader.
 *  - **The caption is text on the page, not an overlay.** It can be selected,
 *    searched, translated by the browser, and read by anything that reads
 *    pages. A subtitle burned into a frame can do none of that.
 *  - **Scrubbing remounts the scene.** Scenes replay their animation on mount,
 *    so jumping back to chapter one shows chapter one from the start rather
 *    than its final frame. That falls out of keying on the scene index.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { runtimeOf, timeline, type Explainer } from '@/content/explainers';
import { SceneView } from './Scenes';

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function ExplainerPlayer({ explainer }: { explainer: Explainer }) {
  const scenes = useMemo(() => timeline(explainer), [explainer]);
  const runtime = useMemo(() => runtimeOf(explainer), [explainer]);

  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);

  // The rAF loop. Wall-clock deltas rather than a fixed increment per frame, so
  // a background tab or a slow device does not silently run the explainer in
  // slow motion.
  const lastFrame = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) {
      lastFrame.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current;
      lastFrame.current = now;
      if (previous != null) {
        setElapsed((t) => {
          const next = t + (now - previous) / 1000;
          if (next >= runtime) {
            setPlaying(false);
            return runtime;
          }
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, runtime]);

  const index = useMemo(() => {
    // The last scene whose start time is at or before now. Clamped at the end so
    // the final frame holds rather than blanking.
    let i = 0;
    for (let k = 0; k < scenes.length; k++) if (scenes[k].startsAt <= elapsed + 1e-6) i = k;
    return i;
  }, [scenes, elapsed]);

  const current = scenes[index];
  const atEnd = elapsed >= runtime - 1e-6;

  const seek = useCallback(
    (seconds: number) => setElapsed(Math.max(0, Math.min(runtime, seconds))),
    [runtime],
  );

  const jumpScene = useCallback(
    (delta: number) => {
      const target = scenes[Math.max(0, Math.min(scenes.length - 1, index + delta))];
      seek(target.startsAt);
    },
    [scenes, index, seek],
  );

  const toggle = useCallback(() => {
    // Pressing play at the very end restarts rather than doing nothing, which is
    // what every player does and what everyone expects.
    setElapsed((t) => (t >= runtime - 1e-6 ? 0 : t));
    setPlaying((p) => !p);
  }, [runtime]);

  return (
    <div className="rounded-2xl border border-line bg-surface">
      {/* The stage. Fixed minimum height so the page does not jump between a
          four-step chain and a five-bar breakdown. */}
      <div className="min-h-[19rem] px-4 py-6 sm:min-h-[17rem] sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <SceneView scene={current.scene} key={index} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* The caption. Live region so a screen reader announces each new line as
          it arrives, which is this player's substitute for a voice track. */}
      <div className="border-t border-line px-4 py-4 sm:px-6">
        <p aria-live="polite" className="min-h-[4.5rem] text-sm leading-relaxed text-ink-muted sm:min-h-[3.5rem]">
          {current.caption}
        </p>
      </div>

      {/* Transport. */}
      <div className="flex items-center gap-3 border-t border-line px-4 py-3 sm:px-6">
        <button
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-ground transition-opacity hover:opacity-90"
          aria-label={playing ? 'Pause' : atEnd ? 'Play again from the start' : 'Play'}
        >
          <span aria-hidden className="text-sm">
            {playing ? '❚❚' : atEnd ? '↻' : '▶'}
          </span>
        </button>

        <button
          onClick={() => jumpScene(-1)}
          className="shrink-0 rounded px-1.5 py-1 text-xs text-ink-faint transition-colors hover:text-ink"
          aria-label="Previous scene"
        >
          ⏮
        </button>
        <button
          onClick={() => jumpScene(1)}
          className="shrink-0 rounded px-1.5 py-1 text-xs text-ink-faint transition-colors hover:text-ink"
          aria-label="Next scene"
        >
          ⏭
        </button>

        <input
          type="range"
          min={0}
          max={runtime}
          step={0.1}
          value={elapsed}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          className="min-w-0 flex-1 accent-[var(--color-accent)]"
        />

        <span className="num shrink-0 text-xs tabular-nums text-ink-faint">
          {mmss(elapsed)} / {mmss(runtime)}
        </span>
      </div>

      {/* Chapters. A list, not a menu — every one is a link into the timeline. */}
      <div className="border-t border-line px-4 py-4 sm:px-6">
        <h2 className="text-[10px] uppercase tracking-wider text-ink-faint">Chapters</h2>
        <ol className="mt-2 space-y-1">
          {explainer.chapters.map((chapter, ci) => {
            const first = scenes.find((s) => s.chapterIndex === ci);
            const active = current.chapterIndex === ci;
            return (
              <li key={chapter.title}>
                <button
                  onClick={() => seek(first?.startsAt ?? 0)}
                  className={`flex w-full items-baseline gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                    active ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <span className="num shrink-0 text-xs text-ink-faint">{mmss(first?.startsAt ?? 0)}</span>
                  <span className="min-w-0">{chapter.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/**
 * The whole script as plain text, under the player.
 *
 * Present for the same reason a transcript sits under a podcast: some people
 * would rather read eight lines in fifteen seconds than watch them arrive over
 * two minutes, and search engines and screen readers are firmly in that camp.
 * It is generated from the captions, so it cannot drift out of sync with what
 * the player says.
 */
export function ExplainerTranscript({ explainer }: { explainer: Explainer }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm uppercase tracking-[0.2em] text-ink-faint">The whole thing, in writing</h2>
      <p className="mt-2 text-sm text-ink-faint">
        Every word the player says, in order. Faster to read than to watch, and here for anyone who would rather.
      </p>
      <div className="mt-4 space-y-6">
        {explainer.chapters.map((chapter) => (
          <div key={chapter.title}>
            <h3 className="text-sm font-medium text-ink">{chapter.title}</h3>
            <div className="mt-2 space-y-2 border-l-2 border-line pl-4">
              {chapter.scenes.map((s, i) => (
                <p key={i} className="text-sm leading-relaxed text-ink-muted">
                  {s.caption}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
