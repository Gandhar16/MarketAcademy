'use client';

/**
 * HoldingPeriodExplainer — "two months of patience was worth ₹15,000 on
 * this trade, and it required no skill whatsoever", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (200
 * shares, ₹2,00,000 gain, sold at 11 months versus 13 months). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'gain', caption: '₹2,00,000 gain on 200 shares. The size of the gain is identical either way.' },
  { id: 'short', caption: 'Sold at 11 months: short-term treatment. Illustrative rate, 20% — tax of ₹40,000.' },
  { id: 'boundary', caption: 'The boundary is sharp. One day either side changes the rate on the WHOLE gain.' },
  { id: 'long', caption: 'Sold at 13 months instead: long-term treatment. Illustrative rate, 12.5% — tax of ₹25,000.' },
  { id: 'lesson', caption: 'Two extra months of patience, same trade, same gain: ₹15,000 kept — no skill required.' },
  { id: 'check', caption: 'The habit worth building: before selling anything near a year old, check the exact purchase date. It is the cheapest, most legal tax decision available — and the easiest one to forget under no other pressure at all.' },
];

export function HoldingPeriodExplainer() {
  return (
    <SceneExplainer
      title="The calendar changes the tax on an identical gain"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showShort = scene >= 1 && scene !== 5;
        const showLong = scene >= 3 && scene !== 5;
        const baseY = 170;

        if (scene === 5) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A calendar check before selling anything near a year old, the cheapest and most legal tax decision available">
              <rect x={50} y={30} width={100} height={90} rx={8} fill="var(--color-surface-2)" stroke="var(--color-accent)" strokeWidth={1.5} />
              <rect x={50} y={30} width={100} height={22} rx={8} fill="var(--color-accent)" fillOpacity={0.25} />
              <text x={100} y={45} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                purchase date?
              </text>
              <text x={100} y={80} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: 'var(--color-accent)' }}>
                ✓
              </text>
              <text x={100} y={104} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                check before every sale
              </text>
              <text x={100} y={150} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                cheapest, most legal move
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="An identical 200,000 rupee gain taxed at 40,000 rupees when sold at 11 months versus 25,000 rupees when sold at 13 months">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Same ₹2,00,000 gain
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            {showShort && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={40} y={baseY - 80} width={44} height={80} rx={4} fill="var(--color-down)" fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
                <text x={62} y={baseY - 88} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹40,000</text>
                <text x={62} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>11 months</text>
              </g>
            )}

            {showLong && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={116} y={baseY - 50} width={44} height={50} rx={4} fill="var(--color-up)" fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
                <text x={138} y={baseY - 58} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹25,000</text>
                <text x={138} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>13 months</text>
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)', fontWeight: 700 }}>
                ₹15,000 kept, no skill needed
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
