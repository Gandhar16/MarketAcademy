'use client';

/**
 * BollingerSqueezeExplainer — "band width is volatility, not direction —
 * the calculation contains nothing about which way price eventually
 * breaks", as a short animated walkthrough. See `scene-explainer.tsx` for
 * the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'wide', caption: 'A 20-day average, with bands two standard deviations above and below it.' },
  { id: 'squeeze', caption: 'Volatility drops. The bands squeeze together.' },
  { id: 'means', caption: 'That is all a squeeze means — volatility is low. Nothing about direction.' },
  { id: 'either', caption: 'Eventually, volatility tends to expand again — but which way?' },
  { id: 'fakeout', caption: 'Price can even push through the upper band, then snap straight back inside it — a false breakout, indistinguishable from a real one until it has already happened.' },
  { id: 'lesson', caption: 'The calculation contains nothing about direction. A squeeze is a reason to pay attention, not a signal to act.' },
];

const X0 = 20;
const X_END = 180;
const MID_Y = 100;

export function BollingerSqueezeExplainer() {
  return (
    <SceneExplainer
      title="A squeeze measures volatility, never direction"
      scenes={SCENES}
      renderVisual={(scene) => {
        const squeezed = scene >= 1;
        const bandHalf = squeezed ? 8 : 55;
        const showArrows = scene === 3 || scene === 5;
        const showFakeout = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A moving average with bands that squeeze together as volatility drops, followed by two equally possible directions once it expands">
            <line x1={X0} y1={MID_Y} x2={X_END} y2={MID_Y} stroke="var(--color-ink)" strokeWidth={2} />
            <path
              d={`M ${X0} ${MID_Y - bandHalf} L ${X_END} ${MID_Y - bandHalf}`}
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="3 2"
              style={{ transition: 'all 500ms ease-out' }}
            />
            <path
              d={`M ${X0} ${MID_Y + bandHalf} L ${X_END} ${MID_Y + bandHalf}`}
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="3 2"
              style={{ transition: 'all 500ms ease-out' }}
            />

            {squeezed && scene < 3 && (
              <text x={100} y={MID_Y - bandHalf - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-accent)', fontWeight: 600 }}>
                squeeze
              </text>
            )}

            {showArrows && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={X_END - 10} y1={MID_Y} x2={X_END + 5} y2={MID_Y - 45} stroke="var(--color-up)" strokeWidth={2} strokeDasharray="3 2" markerEnd="url(#bb-up)" />
                <line x1={X_END - 10} y1={MID_Y} x2={X_END + 5} y2={MID_Y + 45} stroke="var(--color-down)" strokeWidth={2} strokeDasharray="3 2" markerEnd="url(#bb-down)" />
                <defs>
                  <marker id="bb-up" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto">
                    <path d="M0,7 L4,0 L7,7 z" fill="var(--color-up)" />
                  </marker>
                  <marker id="bb-down" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto">
                    <path d="M0,0 L7,0 L3.5,7 z" fill="var(--color-down)" />
                  </marker>
                </defs>
                <text x={100} y={20} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)', fontWeight: 600 }}>
                  either way — unknown
                </text>
              </g>
            )}

            {showFakeout && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <path
                  d={`M ${X_END - 40} ${MID_Y} Q ${X_END - 15} ${MID_Y - bandHalf - 30}, ${X_END} ${MID_Y - bandHalf - 5} T ${X_END + 15} ${MID_Y}`}
                  fill="none"
                  stroke="var(--color-down)"
                  strokeWidth={2}
                />
                <text x={X_END - 20} y={MID_Y - bandHalf - 35} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                  false breakout
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
