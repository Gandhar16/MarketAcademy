'use client';

/**
 * MarginGapExplainer — "the deposit is a small fraction of the position, so
 * the percentage that matters is the one on the position, not the cash",
 * as a short animated walkthrough. Figures match the worked example in the
 * same lesson (₹1,00,000 deposit behind a ₹5,00,000 position, a 4% fall
 * costing ₹20,000 — 20% of the deposit). See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: '₹1,00,000 deposit lets you hold ₹5,00,000 of a share — five times your cash.' },
  { id: 'fall', caption: 'The share falls 4%. That percentage is charged on the ₹5,00,000 position.' },
  { id: 'loss', caption: '4% of ₹5,00,000 is ₹20,000 — debited from your ₹1,00,000 deposit.' },
  { id: 'reframe', caption: 'As a share of your actual cash, that is 20% gone. A quiet 4% day, a loud result.' },
  { id: 'compound', caption: 'One more day like that and 40% of the original deposit is gone — from an 8% move in the underlying share. The multiplier applies every single day, not just once.' },
  { id: 'lesson', caption: 'Leverage does not change your odds. It only changes what a given move is worth in rupees.' },
];

export function MarginGapExplainer() {
  return (
    <SceneExplainer
      title="The gap between what you hold and what you put down"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showFall = scene >= 1 && scene !== 4;
        const showLoss = scene >= 2 && scene !== 4;
        const positionH = 130;
        const depositH = 26; // 1/5 of position

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The deposit shrinking to 60 percent of its original size after a second 4 percent fall, 40 percent gone in total from an 8 percent move">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Deposit, two 4% days later
              </text>
              <rect x={70} y={40} width={60} height={130} rx={5} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <rect x={70} y={40 + 130 * 0.6} width={60} height={130 * 0.4} fill="var(--color-down)" fillOpacity={0.85} />
              <text x={100} y={190} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-down)' }}>
                −40% of original deposit
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A 500,000 rupee position held against a 100,000 rupee deposit, showing a 20,000 rupee loss from a 4 percent fall">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Position vs. deposit
            </text>

            <rect x={30} y={170 - positionH} width={60} height={positionH} rx={5} fill="var(--color-accent)" fillOpacity={0.55} style={{ transition: 'all 500ms ease-out' }} />
            <text x={60} y={170 - positionH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹5,00,000</text>
            <text x={60} y={184} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>position</text>

            <rect x={120} y={170 - depositH} width={50} height={depositH} rx={4} fill="var(--color-ink-faint)" fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
            <text x={145} y={170 - depositH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹1,00,000</text>
            <text x={145} y={184} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>deposit</text>

            {showFall && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={30} y={170 - positionH} width={60} height={positionH * 0.04} fill="var(--color-down)" fillOpacity={0.85} />
              </g>
            )}

            {showLoss && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={120} y={170 - depositH} width={50} height={depositH * 0.2} fill="var(--color-down)" fillOpacity={0.9} />
                <text x={145} y={40} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>−₹20,000</text>
                <text x={145} y={52} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)' }}>= 20% of cash</text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
