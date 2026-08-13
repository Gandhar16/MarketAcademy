'use client';

/**
 * TwoDirectionShortfallExplainer — "the collateral shrank and the
 * requirement grew — the shortfall arrives from both ends on the same
 * afternoon", as a short animated walkthrough. Figures match the worked
 * example in the same lesson (₹10,00,000 pledged at a 20% haircut, an
 * ensuing 15% market fall shrinking the collateral while the requirement
 * rises). See `scene-explainer.tsx` for the shared chrome and why this is
 * a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'pledge', caption: '₹10,00,000 pledged at a 20% haircut gives ₹8,00,000 of usable collateral.' },
  { id: 'fall', caption: 'The market falls 15%. Your pledged shares are ordinary shares — they fell too.' },
  { id: 'shrink', caption: 'Collateral value shrinks to ₹6,80,000 — the same haircut, on a smaller number.' },
  { id: 'rise', caption: 'At the same time, the margin requirement typically RISES — volatility went up.' },
  { id: 'small-fraction', caption: 'The practical defence: pledge only a small fraction of a long-term holding, if any at all. A shortfall on a small pledge is manageable; a shortfall on the whole portfolio can force a sale of shares you meant to keep for a decade.' },
  { id: 'lesson', caption: 'The shortfall arrives from both directions on the same afternoon.' },
];

export function TwoDirectionShortfallExplainer() {
  return (
    <SceneExplainer
      title="The collateral falls while the requirement rises"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const showFall = scene >= 1 && scene !== 4;
        const showShrink = scene >= 2 && scene !== 4;
        const showRise = scene >= 3 && scene !== 4;

        const collateralH = showShrink ? 96 : 112;
        const requirementH = showRise ? 130 : showFall ? 105 : 105;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A small pledged slice of a holding next to a much larger unpledged remainder, keeping any shortfall manageable">
              <rect x={30} y={40} width={140} height={110} rx={8} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <rect x={30} y={40} width={140} height={20} fill="var(--color-down)" fillOpacity={0.4} />
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                pledged — a small slice
              </text>
              <text x={100} y={105} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                unpledged — safe from a margin call
              </text>
              <text x={100} y={168} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                a shortfall here stays manageable
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Collateral value shrinking from 800,000 to 680,000 rupees while the margin requirement rises to 850,000, opening a shortfall from both sides">
            <line x1={16} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={40} y={baseY - collateralH} width={46} height={collateralH} rx={4} fill={showShrink ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
            <text x={63} y={baseY - collateralH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {showShrink ? '₹6,80,000' : '₹8,00,000'}
            </text>
            <text x={63} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>collateral</text>

            {showFall && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={116} y={baseY - requirementH} width={46} height={requirementH} rx={4} fill={showRise ? 'var(--color-down)' : 'var(--color-ink-faint)'} fillOpacity={0.75} style={{ transition: 'all 500ms ease-out' }} />
                <text x={139} y={baseY - requirementH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                  {showRise ? '₹8,50,000' : '₹7,50,000'}
                </text>
                <text x={139} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>requirement</text>
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                squeezed from both sides
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
