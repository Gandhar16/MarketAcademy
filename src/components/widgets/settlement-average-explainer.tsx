'use client';

/**
 * SettlementAverageExplainer — "settlement uses an average of the last
 * half hour, not the closing tick — a late jump barely moves it", as a
 * short animated walkthrough. Figures match the opening predict in the
 * same lesson (an afternoon at 23,980, a two-minute jump to 24,030 against
 * a 24,000 level). See `scene-explainer.tsx` for the shared chrome and why
 * this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'afternoon', caption: 'The afternoon: NIFTY sits at 23,980, below your 24,000 call, for most of the last half hour.' },
  { id: 'jump', caption: 'In the final two minutes, it jumps to 24,030 — above the level.' },
  { id: 'average', caption: 'Settlement uses the AVERAGE of the whole last half hour, not that final tick.' },
  { id: 'dominated', caption: 'Thirty minutes at 23,980 dominates two minutes at 24,030 — the average barely moves.' },
  { id: 'why', caption: 'This is deliberate design, not an accident: averaging over the last half hour makes it far harder for one large, late trade to manipulate the settlement price in the final seconds.' },
  { id: 'lesson', caption: 'A contract that looks like it just came good on the live price may not actually have.' },
];

export function SettlementAverageExplainer() {
  return (
    <SceneExplainer
      title="Settled against an average, not the last tick"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showJump = scene >= 1;
        const showAverage = scene >= 2;
        const levelY = 90;
        const width = 150;
        const startX = 20;

        // path: flat at 23980 for most of the width, jump up at the very end
        const flatY = 110; // below level
        const jumpY = 70; // above level
        const jumpStartX = startX + width * 0.9;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="NIFTY sitting below the 24,000 level for most of the last half hour, jumping above it only in the final two minutes, with the settlement average staying below the level">
            <line x1={startX} y1={levelY} x2={startX + width} y2={levelY} stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="3 2" />
            <text x={startX + width + 4} y={levelY + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>24,000</text>

            <path
              d={`M ${startX} ${flatY} L ${jumpStartX} ${flatY} ${showJump ? `L ${startX + width} ${jumpY}` : ''}`}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={2}
              style={{ transition: 'all 400ms ease-out' }}
            />

            {showAverage && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={startX} y1={106} x2={startX + width} y2={106} stroke="var(--color-down)" strokeWidth={2} />
                <text x={startX + width / 2} y={122} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                  settlement average
                </text>
              </g>
            )}

            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              last half hour
            </text>

            {scene === 4 && (
              <g>
                <rect x={30} y={130} width={140} height={30} rx={6} fill="var(--color-accent)" fillOpacity={0.12} stroke="var(--color-accent)" strokeWidth={1.5} />
                <text x={100} y={149} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-accent)' }}>
                  designed against late manipulation
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
