'use client';

/**
 * SameBetExplainer — "eight positions, four bets — five banks behave as
 * roughly one position of risk rather than five", as a short animated
 * walkthrough. Figures match the worked example in the same lesson
 * (₹10,00,000 account, eight 1%-risk positions, five of them banks). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'eight', caption: 'Eight positions, each risking 1% of the account. The sizing rule was followed exactly, every time.' },
  { id: 'grouped', caption: 'Five of them are banks. One bad morning for rates and credit hits all five at once.' },
  { id: 'onebet', caption: 'As a group they behave as roughly ONE bet, not five separate ones.' },
  { id: 'realbets', caption: 'Distinct bets actually held: banks, software, cement, pharma — four, not eight.' },
  { id: 'lesson', caption: 'A sector event takes 5% of the account in one morning, not the 1% any single trade implied.' },
  { id: 'fix', caption: 'The habit worth building: before sizing anything new, count distinct bets, not distinct positions. A fifth bank is not a new bet — it is a bigger one already on the table.' },
];

export function SameBetExplainer() {
  return (
    <SceneExplainer
      title="Eight positions, four bets"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showGrouped = scene >= 1 && scene !== 5;
        const showLoss = scene >= 4 && scene !== 5;
        const showFix = scene === 5;

        if (showFix) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Counting distinct bets before sizing a new position, so a fifth bank is recognised as a bigger existing bet rather than a new one">
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Before you size anything new
              </text>
              <rect x={30} y={50} width={140} height={40} rx={8} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <text x={100} y={74} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-ink)' }}>
                count bets, not positions
              </text>
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-accent)' }}>
                5th bank = bigger bet
              </text>
              <text x={100} y={150} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                not a new one
              </text>
            </svg>
          );
        }
        const positions = [
          { x: 24, bank: true }, { x: 56, bank: true }, { x: 88, bank: true }, { x: 120, bank: true }, { x: 152, bank: true },
          { x: 24, bank: false, row2: true }, { x: 56, bank: false, row2: true }, { x: 88, bank: false, row2: true },
        ];

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Eight one percent positions where five bank positions behave as one bet, taking five percent of the account on one bad morning">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Eight 1% positions
            </text>

            {positions.map((p, i) => {
              const y = p.row2 ? 90 : 40;
              const isBank = p.bank;
              return (
                <rect
                  key={i}
                  x={p.x}
                  y={y}
                  width={24}
                  height={24}
                  rx={4}
                  fill={isBank && showLoss ? 'var(--color-down)' : isBank && showGrouped ? 'var(--color-accent)' : 'var(--color-ink-faint)'}
                  fillOpacity={isBank && showGrouped ? 0.85 : 0.5}
                  stroke={isBank && showGrouped ? 'var(--color-accent)' : 'var(--color-line)'}
                  strokeWidth={isBank && showGrouped ? 1.5 : 1}
                  style={{ transition: 'all 500ms ease-out' }}
                />
              );
            })}

            {showGrouped && (
              <text x={88} y={135} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-accent)', fontWeight: 700 }}>
                5 banks = 1 bet
              </text>
            )}

            {showLoss && (
              <text x={100} y={155} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                −5% in one morning
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
