'use client';

/**
 * DispositionEffectExplainer — "the winner gets sold, the loser gets held,
 * and that habit alone turns a working method into a losing year", as a
 * short animated walkthrough. Figures match the worked example in the same
 * lesson (12 winners cut at ₹3,000, 8 losers held to ₹12,000, vs. the same
 * 20 trades with the plan honoured). See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'A is up 30%. B is down 30%. Prospects are stated as identical.' },
  { id: 'sell', caption: 'Most people sell A, the winner — booking a gain feels like success.' },
  { id: 'hold', caption: 'B, the loser, gets held. Selling it would make the loss real.' },
  { id: 'habit', caption: 'Applied across a year: 12 winners cut at ₹3,000, 8 losers held to ₹12,000.' },
  { id: 'cost', caption: 'Same 60% win rate. Habit result: −₹60,000. Plan honoured: +₹50,000.' },
  { id: 'fix', caption: 'The fix is not willpower — it is removing the moment where the bias operates. A target and a stop, decided in advance and followed without exceptions, take the choice out of your hands entirely.' },
];

export function DispositionEffectExplainer() {
  return (
    <SceneExplainer
      title="Why the winner gets sold and the loser gets held"
      scenes={SCENES}
      renderVisual={(scene) => {
        const highlightSell = scene === 1;
        const highlightHold = scene === 2;
        const showHabit = scene >= 3 && scene !== 5;
        const showCost = scene >= 4 && scene !== 5;

        if (scene === 5) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A target and a stop, both decided in advance, removing the moment where the sell-the-winner, hold-the-loser bias would otherwise operate">
              <rect x={20} y={30} width={160} height={40} rx={8} fill="var(--color-up)" fillOpacity={0.15} stroke="var(--color-up)" strokeWidth={1.5} />
              <text x={100} y={54} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-up)' }}>
                target: decided in advance
              </text>
              <rect x={20} y={90} width={160} height={40} rx={8} fill="var(--color-down)" fillOpacity={0.15} stroke="var(--color-down)" strokeWidth={1.5} />
              <text x={100} y={114} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-down)' }}>
                stop: decided in advance
              </text>
              <text x={100} y={160} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                no in-the-moment choice left
              </text>
              <text x={100} y={178} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                to sell the winner or hold the loser
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Holding A, up 30 percent, and holding B, down 30 percent, showing which one gets sold and the year-end cost of that habit">
            {!showHabit && (
              <g>
                <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  Which one do you sell?
                </text>

                <g style={{ transition: 'all 400ms ease-out' }}>
                  <rect x={24} y={40} width={64} height={110} rx={6} fill="var(--color-surface-2)" stroke={highlightSell ? 'var(--color-accent)' : 'var(--color-line)'} strokeWidth={highlightSell ? 2.5 : 1.5} />
                  <rect x={24} y={40 + 110 * 0.3} width={64} height={110 * 0.7} fill="var(--color-up)" fillOpacity={0.6} />
                  <text x={56} y={30} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>A · +30%</text>
                  {highlightSell && (
                    <text x={56} y={165} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-accent)', fontWeight: 700 }}>sold first</text>
                  )}
                </g>

                <g style={{ transition: 'all 400ms ease-out' }}>
                  <rect x={112} y={40} width={64} height={110} rx={6} fill="var(--color-surface-2)" stroke={highlightHold ? 'var(--color-down)' : 'var(--color-line)'} strokeWidth={highlightHold ? 2.5 : 1.5} />
                  <rect x={112} y={40} width={64} height={110 * 0.3} fill="var(--color-down)" fillOpacity={0.6} />
                  <text x={144} y={30} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>B · −30%</text>
                  {highlightHold && (
                    <text x={144} y={165} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>held instead</text>
                  )}
                </g>
              </g>
            )}

            {showHabit && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  Over 20 trades a year
                </text>
                <rect x={24} y={140 - 36} width={64} height={36} rx={4} fill="var(--color-up)" fillOpacity={0.6} />
                <text x={56} y={30} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>12 wins</text>
                <text x={56} y={155} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>cut at ₹3,000</text>

                <rect x={112} y={140 - 96} width={64} height={96} rx={4} fill="var(--color-down)" fillOpacity={0.6} />
                <text x={144} y={30} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>8 losses</text>
                <text x={144} y={155} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>held to ₹12,000</text>

                {showCost && (
                  <g style={{ transition: 'opacity 400ms ease-out' }}>
                    <line x1={20} y1={168} x2={180} y2={168} stroke="var(--color-line-strong)" strokeWidth={1} />
                    <text x={56} y={184} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-down)', fontWeight: 700 }}>−₹60,000</text>
                    <text x={144} y={184} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-up)', fontWeight: 700 }}>+₹50,000</text>
                  </g>
                )}
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
