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
import { useReducedMotion } from 'framer-motion';
import type { Explainer, TimelineEntry } from '@/content/explainers';
import { SceneView } from './Scenes';

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The timeline and runtime arrive as props rather than being computed here.
 *
 * They used to be derived in this component, which meant importing
 * `explainers.ts` at runtime — and because this is a client component, that
 * dragged all eleven explainers' captions into a shared browser chunk that
 * loaded on EVERY page of the site, `/login` included. Measured, not guessed.
 * Both values are pure functions of the explainer, so the server that already
 * holds the content computes them once and sends the answer.
 */
export function ExplainerPlayer({
  explainer,
  scenes,
  runtime,
}: {
  explainer: Explainer;
  scenes: TimelineEntry[];
  runtime: number;
}) {
  const reduced = useReducedMotion();

  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);

  /**
   * Narration, off unless asked for.
   *
   * Two reasons it is not the default. A page that starts speaking is the
   * behaviour everyone has learned to resent — the same argument that already
   * keeps this from autoplaying — and the audio is a few hundred kilobytes per
   * explainer that nobody reading in an office wants spent on their behalf.
   * Off by default means the files are not even requested until the toggle is
   * pressed.
   */
  const [listening, setListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasNarration = useMemo(() => scenes.some((s) => s.narration), [scenes]);

  // `elapsed` changes sixty times a second, and the audio effects below need to
  // read it without re-running that often. A ref is the only way to have the
  // current value without subscribing to it — kept up to date in an effect
  // rather than during render, which is a real rule and not a lint preference:
  // a ref written during render is wrong under concurrent rendering, where a
  // render can be thrown away after it has already scribbled on the ref.
  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

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

  /**
   * Point the audio element at the current scene's line and put the needle
   * where the clock is.
   *
   * Keyed on the scene index rather than on `elapsed`, because reassigning
   * `currentTime` every animation frame is what makes home-made players stutter
   * — each assignment restarts the decoder. Within a scene the audio is simply
   * left alone to run at its own pace; it and the rAF clock are both real time,
   * so they cannot meaningfully drift over the twelve seconds a scene lasts.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!listening || !current.narration) {
      audio.pause();
      return;
    }

    const src = `/narration/${current.narration.file}`;
    // Comparing against the resolved URL, so re-running this effect for an
    // unrelated reason does not reload a file that is already playing.
    if (!audio.src.endsWith(src)) audio.src = src;
    audio.currentTime = Math.max(0, elapsedRef.current - current.startsAt);
    if (playing) void audio.play().catch(() => undefined);
  }, [listening, current, playing]);

  const seek = useCallback(
    (seconds: number) => {
      const next = Math.max(0, Math.min(runtime, seconds));
      setElapsed(next);
      // A seek is the only way the clock moves discontinuously, so it is the
      // only place the audio needs dragging back into line by hand. Scrubbing
      // across a scene boundary is handled by the effect above instead.
      const audio = audioRef.current;
      if (audio && listening) {
        const scene = scenes.reduce((found, s, i) => (s.startsAt <= next + 1e-6 ? i : found), 0);
        if (scene === index) audio.currentTime = Math.max(0, next - current.startsAt);
      }
    },
    [runtime, listening, scenes, index, current],
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

  // Pausing the picture has to pause the voice too, including when the clock
  // stops itself at the end of the last scene.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && listening) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [playing, listening]);

  return (
    <div className="rounded-2xl border border-line bg-surface">
      {/* The stage. Fixed minimum height so the page does not jump between a
          four-step chain and a five-bar breakdown.

          There is no crossfade between scenes and no remount on scrub. The
          scene is a pure function of how far into itself it is, so seeking to
          0:47 draws 0:47 — the same picture the video renderer draws for that
          moment, which is the point. */}
      <div className="min-h-[19rem] px-4 py-6 sm:min-h-[17rem] sm:px-6">
        <SceneView scene={current.scene} elapsed={elapsed - current.startsAt} reduced={Boolean(reduced)} />
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

        {hasNarration && (
          <button
            onClick={() => setListening((l) => !l)}
            aria-pressed={listening}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              listening
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-ink-faint hover:border-line-strong hover:text-ink'
            }`}
            title={listening ? 'Turn the narration off' : 'Read the captions aloud'}
          >
            <span aria-hidden className="mr-1">
              {listening ? '🔊' : '🔈'}
            </span>
            Narrate
          </button>
        )}
      </div>

      {/* The voice. `preload="none"` is load-bearing rather than tidy: without
          it every explainer page pulls a few hundred kilobytes of speech that
          most readers never play. */}
      <audio ref={audioRef} preload="none" />

      {hasNarration && listening && (
        <p className="px-4 pb-1 text-xs text-ink-faint sm:px-6">
          Synthetic voice, generated from the captions below — so it can only ever say what they say.
        </p>
      )}

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
