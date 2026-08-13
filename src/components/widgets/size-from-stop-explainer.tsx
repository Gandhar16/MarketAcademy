'use client';

/**
 * SizeFromStopExplainer — "a tighter stop lets you buy MORE shares, not
 * fewer", as a short animated walkthrough. Figures match the worked example
 * in the same lesson. See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'budget', caption: 'You decide: risk ₹2,000, no matter what you end up buying.' },
  { id: 'wide', caption: 'Entry ₹1,400, stop ₹1,372 — ₹28 of risk per share.' },
  { id: 'wide-size', caption: '₹2,000 ÷ ₹28 = 71 shares.' },
  { id: 'tight', caption: 'Now a tighter stop instead: ₹1,386 — only ₹14 of risk per share.' },
  { id: 'tight-size', caption: 'Same ₹2,000 budget ÷ ₹14 = 142 shares — twice as many.' },
  { id: 'compare', caption: 'Side by side: 71 shares risking ₹28 each, or 142 shares risking ₹14 each. Either way, exactly ₹2,000 is at risk if the stop is hit — the risk budget never changed.' },
  { id: 'lesson', caption: 'A tighter stop lets you buy MORE, not less. Size and risk move in opposite directions.' },
];

// risk-per-share (28 or 14) mapped to a bar width
const DIST_SCALE = 3.2;

export function SizeFromStopExplainer() {
  return (
    <SceneExplainer
      title="Why a tighter stop means a bigger position"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showWide = scene >= 1;
        const showWideSize = scene === 2;
        const showTight = scene >= 3;
        const showTightSize = scene >= 4;
        const distance = showTight ? 14 : 28;

        if (scene === 5) {
          // A dedicated side-by-side view — the point of this scene only
          // lands if both trades are visible together, which the single
          // accumulating column above never shows.
          const ROWS = [
            { label: '71 shares × ₹28 risk', value: 71 * 28 },
            { label: '142 shares × ₹14 risk', value: 142 * 14 },
          ];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two trades side by side, one with 71 shares at ₹28 risk each and one with 142 shares at ₹14 risk each, both totalling exactly ₹2,000 of risk">
              {ROWS.map((row, i) => (
                <g key={row.label}>
                  <text x={8} y={40 + i * 60} style={{ fontSize: 8.5, fill: 'var(--color-ink)', fontWeight: 600 }}>
                    {row.label}
                  </text>
                  <rect x={8} y={48 + i * 60} width={184} height={22} rx={5} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1.5} />
                  <text x={100} y={63 + i * 60} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-accent)' }}>
                    = ₹{row.value.toLocaleString('en-IN')} at risk
                  </text>
                </g>
              ))}
              <text x={100} y={190} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                Same risk budget, either way
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A fixed risk budget divided by a shrinking stop distance, producing a growing share count">
            <rect x={10} y={10} width={180} height={30} rx={6} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1.5} />
            <text x={100} y={29} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-ink)', fontWeight: 700 }}>
              Risk budget: ₹2,000
            </text>

            {showWide && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={10} y={62} style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  Stop distance
                </text>
                <rect x={10} y={68} width={distance * DIST_SCALE} height={16} rx={3} fill="var(--color-down)" style={{ transition: 'width 500ms ease-out' }} />
                <text x={10} y={100} style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                  ₹{distance} per share
                </text>
              </g>
            )}

            {(showWideSize || showTightSize) && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={100} y={140} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
                  ₹2,000 ÷ ₹{distance} =
                </text>
                <text x={100} y={172} textAnchor="middle" style={{ fontSize: 26, fill: 'var(--color-up)', fontWeight: 700 }}>
                  {showTightSize ? 142 : 71}
                </text>
                <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  shares
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
