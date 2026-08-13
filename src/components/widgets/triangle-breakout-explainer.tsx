'use client';

/**
 * TriangleBreakoutExplainer — "the breakout direction is the only thing the
 * shape genuinely cannot tell you in advance", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (a
 * ₹40-wide base, breaking out at ₹860). See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'converge', caption: 'Two trendlines converge — one under the lows, one over the highs.' },
  { id: 'narrow', caption: 'The range narrows. Which way will it break?' },
  { id: 'unknown', caption: 'The shape itself cannot tell you — that is the one thing it genuinely does not know.' },
  { id: 'break', caption: 'It breaks upward, in this case.' },
  { id: 'mirror', caption: 'It could just as easily have broken down instead — the exact same shape, the exact same setup, a different resolution.' },
  { id: 'target', caption: "The measured-move target is the triangle's base height, projected from the breakout — upward if it broke up, downward if it broke down." },
];

const X0 = 20;
const X_APEX = 120;
const Y_MID = 100;

export function TriangleBreakoutExplainer() {
  return (
    <SceneExplainer
      title="Triangles: the breakout is the only new information"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showBothArrows = scene === 1 || scene === 2;
        const showUpBreak = scene === 3 || scene === 5;
        const showMirror = scene === 4;
        const showTarget = scene >= 5;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two converging trendlines forming a triangle, with an ambiguous breakout that eventually resolves upward, and a measured-move target">
            <line x1={X0} y1={Y_MID - 55} x2={X_APEX} y2={Y_MID} stroke="var(--color-ink-faint)" strokeWidth={2} />
            <line x1={X0} y1={Y_MID + 55} x2={X_APEX} y2={Y_MID} stroke="var(--color-ink-faint)" strokeWidth={2} />

            {showBothArrows && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={X_APEX} y1={Y_MID} x2={X_APEX + 30} y2={Y_MID - 40} stroke="var(--color-ink-faint)" strokeWidth={1.5} strokeDasharray="3 2" markerEnd="url(#tri-up)" />
                <line x1={X_APEX} y1={Y_MID} x2={X_APEX + 30} y2={Y_MID + 40} stroke="var(--color-ink-faint)" strokeWidth={1.5} strokeDasharray="3 2" markerEnd="url(#tri-down)" />
                <text x={X_APEX + 10} y={Y_MID - 4} style={{ fontSize: 14, fill: 'var(--color-ink-faint)' }}>
                  ?
                </text>
                <defs>
                  <marker id="tri-up" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto">
                    <path d="M0,7 L4,0 L7,7 z" fill="var(--color-ink-faint)" />
                  </marker>
                  <marker id="tri-down" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto">
                    <path d="M0,0 L7,0 L3.5,7 z" fill="var(--color-ink-faint)" />
                  </marker>
                </defs>
              </g>
            )}

            {showUpBreak && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={X_APEX} y1={Y_MID} x2={X_APEX + 50} y2={Y_MID - 55} stroke="var(--color-up)" strokeWidth={2.5} markerEnd="url(#tri-up-solid)" />
                <defs>
                  <marker id="tri-up-solid" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <path d="M0,8 L4,0 L8,8 z" fill="var(--color-up)" />
                  </marker>
                </defs>
              </g>
            )}

            {showMirror && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={X_APEX} y1={Y_MID} x2={X_APEX + 50} y2={Y_MID + 55} stroke="var(--color-down)" strokeWidth={2.5} markerEnd="url(#tri-down-solid)" />
                <defs>
                  <marker id="tri-down-solid" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <path d="M0,0 L8,0 L4,8 z" fill="var(--color-down)" />
                  </marker>
                </defs>
                <text x={X_APEX + 30} y={Y_MID + 70} style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                  or this
                </text>
              </g>
            )}

            {showTarget && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={X_APEX + 50} y1={Y_MID - 55} x2={X_APEX + 50} y2={Y_MID - 55 - 55} stroke="var(--color-up)" strokeWidth={1.5} strokeDasharray="2 2" />
                <text x={X_APEX + 58} y={Y_MID - 55 - 25} style={{ fontSize: 7.5, fill: 'var(--color-up)', fontWeight: 700 }}>
                  target: +₹40
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
