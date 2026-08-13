'use client';

/**
 * TimeDecayExplainer — "you were exactly right about direction and lost
 * every rupee — an at-the-money option's whole price is time value, and
 * time value is guaranteed to reach zero", as a short animated walkthrough.
 * Figures match the worked example in the same lesson (a NIFTY 24,000
 * call, 30 days out, spot never moving, decaying to zero — faster near the
 * end). See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'start', caption: 'A NIFTY 24,000 call, 30 days out, spot exactly at 24,000. Entirely time value.' },
  { id: 'twoweeks', caption: 'Two weeks pass. Spot is unchanged — you were right that it would not fall.' },
  { id: 'threedays', caption: '3 days from expiry. Decay accelerates — the last week costs far more per day than the first.' },
  { id: 'expiry', caption: 'At expiry, spot is still exactly 24,000. The option is worth zero.' },
  { id: 'seller-side', caption: 'This is exactly why professional option sellers favour the last week of an option\'s life — decay is fastest right there, and it is money moving from the buyer\'s side to theirs, every single day, whether or not the market does anything at all.' },
  { id: 'lesson', caption: 'Perfectly right about direction. 100% of the premium gone — the market being flat was the worst outcome.' },
];

export function TimeDecayExplainer() {
  return (
    <SceneExplainer
      title="Right about direction, wrong about enough"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        // premium values across scenes, roughly matching the lesson's arithmetic shape
        const heights = [120, 78, 22, 0, 0, 0];
        const h = heights[Math.min(scene, 5)];

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Decay accelerating sharply in the option's last week, money moving steadily from the buyer's side to the seller's side">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Decay speed, over the option&apos;s life
              </text>
              <line x1={20} y1={150} x2={190} y2={150} stroke="var(--color-line)" strokeWidth={1} />
              <path d="M 20 148 L 100 140 L 150 110 L 175 60 L 190 20" fill="none" stroke="var(--color-down)" strokeWidth={2.5} />
              <text x={185} y={14} textAnchor="end" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                fastest here
              </text>
              <text x={30} y={165} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                30 days out
              </text>
              <text x={160} y={165} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                last week
              </text>
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                the seller&apos;s favourite week
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The price of an at-the-money option decaying from full value to zero as the calendar advances with the underlying unchanged">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Spot fixed at 24,000 throughout
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={80} y={baseY - h} width={44} height={h} rx={4} fill={scene >= 3 ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.7} style={{ transition: 'all 600ms ease-out' }} />

            <text x={102} y={baseY - h - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {scene === 0 ? '₹180' : scene === 1 ? '₹117' : scene === 2 ? '₹33' : '₹0'}
            </text>

            <text x={102} y={186} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              {scene === 0 ? '30 days left' : scene === 1 ? '16 days left' : scene === 2 ? '3 days left' : 'expiry'}
            </text>

            {scene >= 4 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                right on direction, still zero
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
