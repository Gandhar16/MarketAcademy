'use client';

/**
 * DailyInterestExplainer — "the loan costs interest every day, whether the
 * position is winning or losing, and it changes the arithmetic completely
 * in both directions", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (₹1,00,000 of own capital, ₹4,00,000
 * borrowed at 18%, a 6% move either way over 60 days). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: '₹1,00,000 of your own money, ₹4,00,000 borrowed at 18% a year, held 60 days.' },
  { id: 'up', caption: 'Shares rise 6%. Gross gain: ₹30,000 on the ₹5,00,000 position.' },
  { id: 'upnet', caption: 'Interest and charges take about ₹13,000. You keep roughly ₹17,000 — on ₹1,00,000 of your own capital.' },
  { id: 'down', caption: 'Now the same shares fall 6% instead. The loss and the interest both apply.' },
  { id: 'longer', caption: 'Hold the same borrowed position for six months instead of sixty days and the interest alone is roughly 9% of the borrowed amount — a hurdle the shares have to clear before you make a single rupee, regardless of which way they eventually move.' },
  { id: 'lesson', caption: 'Your ₹1,00,000 falls to about ₹55,000 — a 45% hit from a 6% move, once borrowing is counted.' },
];

export function DailyInterestExplainer() {
  return (
    <SceneExplainer
      title="The same loan, working in both directions"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const isDown = scene >= 3 && scene !== 4;
        const values = [100000, 100000, 117000, 100000, 55000];
        const idx = Math.min(scene, 4);
        const v = values[idx];
        const h = (v / 120000) * 130;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Six months of borrowing costing roughly 9 percent of the borrowed amount, a hurdle the shares must clear before any profit at all">
              <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />
              <line x1={20} y1={baseY - 9 * 6} x2={190} y2={baseY - 9 * 6} stroke="var(--color-down)" strokeWidth={2} strokeDasharray="3 2" />
              <text x={186} y={baseY - 9 * 6 - 6} textAnchor="end" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                ≈9% hurdle
              </text>
              <text x={100} y={40} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                6 months, same 18% rate
              </text>
              <text x={100} y={186} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                clear this before any real profit
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Your own 100,000 rupee capital rising to about 117,000 on a good outcome or falling to about 55,000 on an equal and opposite move, once borrowing interest is counted">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Your ₹1,00,000, after 60 days
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={80} y={baseY - h} width={44} height={h} rx={4} fill={isDown ? 'var(--color-down)' : idx >= 1 && idx <= 2 ? 'var(--color-up)' : 'var(--color-ink-faint)'} fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
            <text x={102} y={baseY - h - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              ₹{v.toLocaleString('en-IN')}
            </text>

            {scene >= 4 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                a 6% move, a 45% result
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
