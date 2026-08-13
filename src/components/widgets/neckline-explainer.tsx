'use client';

/**
 * NecklineExplainer — "the neckline break is the confirmation, never the
 * three peaks alone", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (head ₹1,480, neckline ₹1,320). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'peaks', caption: 'Three peaks form: a tall head in the middle, two shorter shoulders on either side.' },
  { id: 'neckline', caption: 'A neckline is drawn under the two troughs between them.' },
  { id: 'unconfirmed', caption: 'The shape alone means nothing yet — plenty of these simply keep rising.' },
  { id: 'no-break', caption: 'Picture that instead: price touches the neckline, holds, and climbs straight back to new highs. The three peaks were real. The reversal never came.' },
  { id: 'break', caption: 'Only a close below the neckline actually confirms it.' },
  { id: 'target', caption: 'The height of the head above the neckline, projected below the breakout, gives the measured-move target.' },
];

const priceY = (p: number) => 190 - ((p - 1140) / (1480 - 1140)) * 170;
const NECK = 1320;

export function NecklineExplainer() {
  return (
    <SceneExplainer
      title="The neckline break, not the shape"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showNeckline = scene >= 1;
        const showNoBreak = scene === 3;
        const showBreak = scene >= 4;
        const showTarget = scene >= 5;

        const peakXs = [40, 100, 160];
        const peakYs = [priceY(1380), priceY(1480), priceY(1370)];

        if (showNoBreak) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The same three peaks, but instead of breaking the neckline, price touches it, holds, and climbs to a new high">
              <polyline
                points={`20,${priceY(1300)} ${peakXs[0]},${peakYs[0]} 70,${priceY(NECK)} ${peakXs[1]},${peakYs[1]} 130,${priceY(NECK)} ${peakXs[2]},${peakYs[2]} 155,${priceY(NECK) + 6} 180,${priceY(1500)}`}
                fill="none"
                stroke="var(--color-up)"
                strokeWidth={2}
              />
              <line x1={20} y1={priceY(NECK)} x2={180} y2={priceY(NECK)} stroke="var(--color-line-strong)" strokeWidth={1.5} strokeDasharray="3 2" />
              <text x={182} y={priceY(NECK) + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                ₹1,320
              </text>
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-up)' }}>
                held, then a new high
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three peaks with a neckline drawn under the troughs, breaking down with a measured-move target projected below">
            <polyline
              points={`20,${priceY(1300)} ${peakXs[0]},${peakYs[0]} 70,${priceY(NECK)} ${peakXs[1]},${peakYs[1]} 130,${priceY(NECK)} ${peakXs[2]},${peakYs[2]} 180,${showBreak ? priceY(1200) : priceY(NECK)}`}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={2}
              style={{ transition: 'points 500ms ease-out' }}
            />

            {showNeckline && (
              <line x1={20} y1={priceY(NECK)} x2={180} y2={priceY(NECK)} stroke={showBreak ? 'var(--color-down)' : 'var(--color-accent)'} strokeWidth={1.5} strokeDasharray="3 2" style={{ transition: 'stroke 400ms ease-out' }} />
            )}
            {showNeckline && (
              <text x={182} y={priceY(NECK) + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                ₹1,320
              </text>
            )}

            {showTarget && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={180} y1={priceY(NECK)} x2={180} y2={priceY(1150)} stroke="var(--color-down)" strokeWidth={2} markerEnd="url(#target-arrow)" />
                <defs>
                  <marker id="target-arrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto">
                    <path d="M0,0 L8,0 L4,8 z" fill="var(--color-down)" />
                  </marker>
                </defs>
                <text x={150} y={priceY(1150) + 4} textAnchor="end" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                  target ₹1,150
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
