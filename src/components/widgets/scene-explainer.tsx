'use client';

/**
 * SceneExplainer — the shared chrome behind every "short animated walkthrough"
 * widget (see `ownership-explainer.tsx` for the design rationale: no real
 * video, an honestly-labelled animated diagram instead, built the same way
 * every other visual on this site is).
 *
 * Pulled out once a second lesson needed the identical play/pause/back/next/
 * dots/caption/keyboard machinery — only the visual inside each scene and its
 * caption text are lesson-specific; the interaction shell is identical. The
 * prop shape (`title`, `scenes`, `intervalMs`, `renderVisual`) is unchanged
 * across every version of this file on purpose: ~90 widgets call this with
 * that exact signature, so all visual/pacing improvements happen here, once,
 * rather than requiring a pass over every individual explainer.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface Scene {
  id: string;
  caption: string;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SceneExplainer({
  title,
  scenes,
  intervalMs = 2600,
  renderVisual,
}: {
  title: string;
  scenes: Scene[];
  intervalMs?: number;
  renderVisual: (sceneIndex: number) => ReactNode;
}) {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const last = scene === scenes.length - 1;

  useEffect(() => {
    if (!playing) return;
    const step = prefersReducedMotion() ? 0 : intervalMs;
    timerRef.current = setInterval(() => {
      setScene((s) => {
        if (s >= scenes.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, Math.max(step, 400));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, intervalMs, scenes.length]);

  const goTo = (i: number) => {
    setPlaying(false);
    setScene(Math.max(0, Math.min(scenes.length - 1, i)));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">{title}</div>
        <div className="num text-[11px] text-ink-faint">
          Step {scene + 1} of {scenes.length}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* A crossfade between scenes rather than an instant swap — the shape
              underneath still updates instantly (each explainer's own SVG
              already transitions its internal values), this only smooths the
              handoff at the container level so a step change never reads as a
              flicker. Reduced-motion still gets the fade (it is a 200ms
              opacity change, not a transform/movement animation, so it stays
              on even for users who asked to skip motion — the global
              `prefers-reduced-motion` rule in globals.css caps its duration
              to ~0 anyway, which degrades this to an instant swap for them). */}
          <div
            key={scene}
            // Sized to exactly match the `h-40 w-40` every individual
            // explainer's own inner <svg> already declares (~90 files) —
            // anything larger just adds empty padding around a fixed-size
            // diagram rather than making it bigger.
            className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg bg-ground/40 p-1 [animation:scene-fade-in_320ms_ease-out]"
          >
            {renderVisual(scene)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex gap-1.5" role="group" aria-label="Scene">
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Scene ${i + 1} of ${scenes.length}: ${s.caption}`}
                  aria-current={i === scene}
                  className="h-2 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: i <= scene ? 'var(--color-accent)' : 'var(--color-line)',
                    boxShadow: i === scene ? '0 0 0 3px color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'none',
                  }}
                />
              ))}
            </div>

            <p
              key={`caption-${scene}`}
              aria-live="polite"
              className="mt-4 min-h-[4.5rem] text-[16px] font-medium leading-relaxed text-ink [animation:scene-fade-in_320ms_ease-out]"
            >
              {scenes[scene].caption}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (last) {
                    goTo(0);
                    setPlaying(true);
                  } else {
                    setPlaying((p) => !p);
                  }
                }}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis transition-all duration-150 hover:scale-[1.03] hover:opacity-90 active:scale-95"
              >
                {playing ? 'Pause' : last ? 'Play again' : scene === 0 ? 'Play' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={() => goTo(scene - 1)}
                disabled={scene === 0}
                className="rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition-all duration-150 hover:scale-[1.03] hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => goTo(scene + 1)}
                disabled={last}
                className="rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition-all duration-150 hover:scale-[1.03] hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
