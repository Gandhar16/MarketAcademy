'use client';

/**
 * TrendlineConfirmExplainer — "two points always make a line; a third
 * touch is what turns it into a hypothesis worth watching", as a short
 * animated walkthrough. See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'two', caption: 'Two swing lows, connected with a straight line.' },
  { id: 'hypothesis', caption: 'That is a hypothesis, not a fact — any two points on a chart can be joined this way.' },
  { id: 'approach', caption: 'Price approaches the line a third time.' },
  { id: 'confirm', caption: 'It respects the line. Now, for the first time, the line means something.' },
  { id: 'fails', caption: 'It could just as easily have broken straight through instead — that happens just as often. The line was never "wrong"; it simply was not confirmed yet.' },
  { id: 'lesson', caption: 'The third touch is the only part of this you did not choose in advance.' },
];

const P1 = { x: 30, y: 150 };
const P2 = { x: 100, y: 100 };
const SLOPE = (P2.y - P1.y) / (P2.x - P1.x);
const lineY = (x: number) => P1.y + SLOPE * (x - P1.x);

export function TrendlineConfirmExplainer() {
  return (
    <SceneExplainer
      title="Two points make a line — a third confirms it"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showThird = scene >= 2;
        const confirmed = scene === 3 || scene === 5;
        const broken = scene === 4;
        const p3x = 165;
        const p3y = confirmed ? lineY(p3x) : broken ? lineY(p3x) + 26 : lineY(p3x) - 22;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two points forming a rising trendline, with a third point either confirming it, missing it, or breaking straight through it">
            <line x1={10} y1={lineY(10)} x2={190} y2={lineY(190)} stroke={confirmed ? 'var(--color-up)' : broken ? 'var(--color-down)' : 'var(--color-ink-faint)'} strokeWidth={2} strokeDasharray={confirmed || broken ? 'none' : '4 3'} style={{ transition: 'stroke 400ms ease-out' }} />

            <circle cx={P1.x} cy={P1.y} r={4} fill="var(--color-accent)" />
            <circle cx={P2.x} cy={P2.y} r={4} fill="var(--color-accent)" />

            {showThird && (
              <g style={{ transition: 'all 500ms ease-out' }}>
                <circle cx={p3x} cy={p3y} r={4} fill={confirmed ? 'var(--color-up)' : broken ? 'var(--color-down)' : 'var(--color-ink-faint)'} />
                <text x={p3x} y={p3y - 12} textAnchor="middle" style={{ fontSize: 8, fill: confirmed ? 'var(--color-up)' : broken ? 'var(--color-down)' : 'var(--color-ink-faint)', fontWeight: 600 }}>
                  {confirmed ? 'confirmed' : broken ? 'broke through' : 'approaching…'}
                </text>
              </g>
            )}

            <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              rising trendline through two swing lows
            </text>
          </svg>
        );
      }}
    />
  );
}
