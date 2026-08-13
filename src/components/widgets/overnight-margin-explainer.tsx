'use client';

/**
 * OvernightMarginExplainer — "the company did nothing, the price did
 * nothing, and you owe ₹1,50,000 by this evening", as a short animated
 * walkthrough. Figures match the worked example in the same lesson
 * (₹5,00,000 held against a 20% deposit, requirement jumping to 50%
 * overnight when surveillance is applied). See `scene-explainer.tsx` for
 * the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'yesterday', caption: 'You hold ₹5,00,000 of a share against a ₹1,00,000 deposit — a 20% requirement.' },
  { id: 'listed', caption: 'Overnight, the share enters surveillance. Nothing about the price or the company changed.' },
  { id: 'jump', caption: 'The requirement jumps to 50% — applied to the position you already hold.' },
  { id: 'gap', caption: 'You now need ₹2,50,000 of deposit. That is ₹1,50,000 more, due today.' },
  { id: 'check', caption: 'The exchanges publish current surveillance lists for free. Checking before buying anything outside the largest, best-known names is a one-minute habit almost nobody actually keeps.' },
  { id: 'lesson', caption: "Can't fund it? The position is reduced for you — in a share already moving strangely." },
];

export function OvernightMarginExplainer() {
  return (
    <SceneExplainer
      title="The requirement changes, the position does not"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const showJump = scene >= 2 && scene !== 4;
        const requiredH = showJump ? 100 : 40;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Checking a public surveillance list before buying, a one-minute habit almost nobody keeps">
              <circle cx={90} cy={80} r={38} fill="none" stroke="var(--color-accent)" strokeWidth={3} />
              <line x1={116} y1={106} x2={150} y2={140} stroke="var(--color-accent)" strokeWidth={4} strokeLinecap="round" />
              <text x={90} y={86} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-accent)' }}>
                check list
              </text>
              <text x={100} y={175} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                free, public, one minute
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A 500,000 rupee position where the required deposit jumps from 100,000 to 250,000 rupees overnight after surveillance is applied">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              ₹5,00,000 position, unchanged
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={70} y={baseY - requiredH} width={60} height={requiredH} rx={4} fill={showJump ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.7} style={{ transition: 'all 600ms ease-out' }} />
            <text x={100} y={baseY - requiredH - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {showJump ? '₹2,50,000' : '₹1,00,000'}
            </text>
            <text x={100} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              {showJump ? 'required today' : 'required yesterday'}
            </text>

            {scene >= 3 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>+₹1,50,000, by this evening</text>
            )}
          </svg>
        );
      }}
    />
  );
}
