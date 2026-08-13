'use client';

/**
 * FourCausesExplainer — "four separate causes, four different sizes, and
 * only one of them was about being right on direction", as a short
 * animated walkthrough. Figures match the worked example in the same
 * lesson (a NIFTY 24,000 call at ₹180, then delta, theta and vega changed
 * one at a time). See `scene-explainer.tsx` for the shared chrome and why
 * this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'start', caption: 'A NIFTY 24,000 call at ₹180. Everything else held still, one change at a time.' },
  { id: 'delta', caption: 'Delta: NIFTY moves up 100 points, nothing else touched. Price rises to about ₹230.' },
  { id: 'theta', caption: 'Theta: back to 24,000, one day passes instead. Price falls to about ₹174 — charged regardless.' },
  { id: 'vega', caption: 'Vega: same price, same day. Expectations rise from 14 to 20. Price rises to about ₹235.' },
  { id: 'together', caption: 'In a real market these three never happen alone — a single day bundles all of them together, which is exactly why an option\'s price so often does not seem to match what the direction of the move alone would suggest.' },
  { id: 'lesson', caption: 'Three different causes, three different prices — only the first was about direction.' },
];

export function FourCausesExplainer() {
  return (
    <SceneExplainer
      title="One number, four separate reasons it can move"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const values = [180, 230, 174, 235, 180];
        const labels = ['start', 'delta', 'theta', 'vega', 'start'];
        const colors = ['var(--color-ink-faint)', 'var(--color-up)', 'var(--color-down)', 'var(--color-accent)'];
        const idx = Math.min(scene, 3);

        const h = (values[idx] / 235) * 130;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Delta, theta and vega all acting on the same option price at once, bundled together in any single real trading day">
              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                One real day, all at once
              </text>
              {['delta', 'theta', 'vega'].map((label, i) => (
                <g key={label}>
                  <circle cx={100} cy={70 + i * 34} r={9} fill={colors[i + 1]} fillOpacity={0.25} stroke={colors[i + 1]} strokeWidth={1.5} />
                  <text x={100} y={74 + i * 34} textAnchor="middle" style={{ fontSize: 7, fontWeight: 700, fill: colors[i + 1] }}>
                    {label[0].toUpperCase()}
                  </text>
                  <line x1={112} y1={70 + i * 34} x2={150} y2={100} stroke={colors[i + 1]} strokeWidth={1.5} strokeDasharray="2 2" />
                </g>
              ))}
              <circle cx={160} cy={100} r={14} fill="var(--color-ink)" fillOpacity={0.12} stroke="var(--color-ink)" strokeWidth={1.5} />
              <text x={160} y={104} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                ?
              </text>
              <text x={100} y={186} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                one price, three causes bundled
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="An option price of 180 rupees changing to different values depending on which single cause — delta, theta or vega — is isolated">
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={80} y={baseY - h} width={44} height={h} rx={4} fill={colors[idx]} fillOpacity={0.75} style={{ transition: 'all 500ms ease-out' }} />
            <text x={102} y={baseY - h - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              ₹{values[idx]}
            </text>
            <text x={102} y={186} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              {labels[idx] === 'start' ? 'unchanged' : labels[idx]} changed
            </text>

            {scene >= 4 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                same starting price, three different causes
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
