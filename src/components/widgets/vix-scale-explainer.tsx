'use client';

/**
 * VixScaleExplainer — "VIX is quoted annualised — divide by the square
 * root of 12 to get the coming month, and it says nothing about
 * direction", as a short animated walkthrough. Figures match the worked
 * example in the same lesson (VIX at 14, NIFTY at 24,000, converting to a
 * roughly ±970-point monthly range). See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'reading', caption: 'India VIX reads 14. That is an ANNUAL percentage, like an interest rate.' },
  { id: 'convert', caption: 'Divide by √12 (about 3.46) to get the coming month: roughly 4%.' },
  { id: 'range', caption: 'NIFTY at 24,000: 4% of that is about 970 points, either side.' },
  { id: 'band', caption: 'The market is pricing a range of roughly 23,030 to 24,970 for the month.' },
  { id: 'spikes', caption: 'VIX is not fixed at 14 — it can jump to 30 or higher within days during a real market fall. Option protection gets far more expensive exactly when it is needed most.' },
  { id: 'lesson', caption: 'That band says nothing about which way. It is a size, not a direction.' },
];

export function VixScaleExplainer() {
  return (
    <SceneExplainer
      title="An annual number, read for the month that matters"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showConvert = scene >= 1;
        const showRange = scene >= 2 && scene !== 4;
        const showBand = scene >= 3 && scene !== 4;
        const centerY = 100;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="VIX jumping from a calm 14 to 30 or higher during a market fall, showing protection costs rise exactly when it is needed most">
              <line x1={20} y1={150} x2={190} y2={150} stroke="var(--color-line)" strokeWidth={1} />
              <rect x={30} y={150 - 14 * 3} width={40} height={14 * 3} rx={4} fill="var(--color-ink-faint)" />
              <text x={50} y={150 - 14 * 3 - 8} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-ink)' }}>
                14
              </text>
              <text x={50} y={166} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                calm market
              </text>

              <rect x={120} y={150 - 30 * 3} width={40} height={30 * 3} rx={4} fill="var(--color-down)" />
              <text x={140} y={150 - 30 * 3 - 8} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-down)' }}>
                30+
              </text>
              <text x={140} y={166} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                during a fall
              </text>

              <text x={100} y={186} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                protection costs more when needed most
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="India VIX at 14 percent annualised, converted into a roughly 970 point monthly range around NIFTY at 24,000">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              India VIX: 14
            </text>

            {!showRange && (
              <text x={100} y={60} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--color-ink)', fontWeight: 700 }}>
                {showConvert ? '÷ √12 ≈ 4% / month' : '14% / year'}
              </text>
            )}

            {showRange && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={centerY} x2={180} y2={centerY} stroke="var(--color-line)" strokeWidth={1.5} />
                <circle cx={100} cy={centerY} r={4} fill="var(--color-ink)" />
                <text x={100} y={centerY - 10} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>24,000</text>

                {showBand && (
                  <g style={{ transition: 'opacity 400ms ease-out' }}>
                    <rect x={45} y={centerY - 10} width={110} height={20} rx={4} fill="var(--color-accent)" fillOpacity={0.25} />
                    <text x={45} y={centerY + 30} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>23,030</text>
                    <text x={155} y={centerY + 30} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>24,970</text>
                  </g>
                )}
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={175} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                a size, not a direction
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
