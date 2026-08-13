'use client';

/**
 * IndicatorLagExplainer — "every indicator is arithmetic on prices you
 * already have, and smoother always means later", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (a
 * 20-day average sitting ~₹95 behind a steady ₹10-a-day rise). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'price', caption: 'Price rises steadily, ₹10 a day, with no down days at all.' },
  { id: 'ma20', caption: 'A 20-day average follows — but it is the mean of the last 20 days, including all the lower ones.' },
  { id: 'gap20', caption: 'After 20 days, price is at ₹1,200. The average shows ₹1,105 — about ₹95 behind.' },
  { id: 'ma50', caption: 'Switch to a 50-day average for a smoother line, and the gap roughly doubles.' },
  { id: 'gap50', caption: 'From about ₹95 behind, to about ₹190 behind — nearly double. The 50-day line is smoother to look at, and it tells you the trend changed nearly twice as late.' },
  { id: 'lesson', caption: 'Every indicator is arithmetic on prices you already have. Smoother always means later — no setting escapes both.' },
];

const X0 = 20;
const X_END = 180;
const Y_BASE = 178;
const Y_TOP = 20;

export function IndicatorLagExplainer() {
  return (
    <SceneExplainer
      title="Smoother always means later"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showMa20 = scene >= 1;
        const showGapLabel = scene === 2;
        const showMa50 = scene >= 3;
        const showGap50Label = scene === 4;

        const priceLine = `M ${X0} ${Y_BASE} L ${X_END} ${Y_TOP}`;
        const ma20Line = `M ${X0} ${Y_BASE} L ${X_END} ${Y_TOP + 40}`;
        const ma50Line = `M ${X0} ${Y_BASE} L ${X_END} ${Y_TOP + 75}`;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A steadily rising price line with a 20-day and 50-day moving average trailing behind it by an increasing gap">
            <path d={priceLine} fill="none" stroke="var(--color-ink)" strokeWidth={2} />
            <text x={X_END - 4} y={Y_TOP + 6} textAnchor="end" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
              price
            </text>

            {showMa20 && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <path d={ma20Line} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="4 2" />
                <text x={X_END - 4} y={Y_TOP + 40 + 12} textAnchor="end" style={{ fontSize: 8, fill: 'var(--color-accent)', fontWeight: 600 }}>
                  20-day average
                </text>
              </g>
            )}

            {showGapLabel && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={X_END - 2} y1={Y_TOP} x2={X_END - 2} y2={Y_TOP + 40} stroke="var(--color-down)" strokeWidth={2} />
                <text x={X_END - 40} y={Y_TOP + 20} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                  ₹95 behind
                </text>
              </g>
            )}

            {showMa50 && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <path d={ma50Line} fill="none" stroke="var(--color-ink-faint)" strokeWidth={2} strokeDasharray="2 2" />
                <text x={X_END - 4} y={Y_TOP + 75 + 12} textAnchor="end" style={{ fontSize: 8, fill: 'var(--color-ink-faint)', fontWeight: 600 }}>
                  50-day average
                </text>
              </g>
            )}

            {showGap50Label && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={X_END - 2} y1={Y_TOP} x2={X_END - 2} y2={Y_TOP + 75} stroke="var(--color-down)" strokeWidth={2} />
                <rect x={X_END - 78} y={Y_TOP + 30} width={70} height={16} rx={4} fill="var(--color-down)" fillOpacity={0.12} />
                <text x={X_END - 43} y={Y_TOP + 42} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                  ≈₹190 behind
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
