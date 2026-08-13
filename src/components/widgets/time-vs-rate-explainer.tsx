'use client';

/**
 * TimeVsRateExplainer — "starting earlier beats a higher rate", as a short
 * animated walkthrough. Figures match the opening predict in the same
 * lesson (Asha vs. Bharat, both at 10%, ten years apart). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'asha', caption: 'Asha invests ₹1,00,000 at 10% a year and leaves it for 30 years.' },
  { id: 'bharat', caption: 'Bharat invests the same amount, at the same rate — but starts 10 years later, so he only gets 20 years.' },
  { id: 'asha-end', caption: 'After 30 years, Asha has about ₹17.4 lakh.' },
  { id: 'bharat-end', caption: 'After only 20 years, Bharat has about ₹6.7 lakh.' },
  { id: 'ratio', caption: '₹17.4L is about 2.6 times ₹6.7L. Ten extra years of compounding did that — not a better rate, not a bigger contribution.' },
  { id: 'lesson', caption: 'Same money, same rate — Asha ends with about two and a half times as much. The extra ten years were the ten years when the balance was largest.' },
];

const X0 = 26;
const X_END = 180;
const Y_BASE = 178;
const Y_TOP = 20;

// simple compounding-shaped curve, illustrative not exact: y grows slowly then steeply
function curvePoints(startFrac: number, endFrac: number, endHeight: number) {
  const steps = 24;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0..1 across the curve's own span
    const x = X0 + (startFrac + t * (endFrac - startFrac)) * (X_END - X0);
    const growth = Math.pow(t, 2.1); // accelerating curve, like compounding
    const y = Y_BASE - growth * endHeight;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export function TimeVsRateExplainer() {
  return (
    <SceneExplainer
      title="Why ten extra years beats a better rate"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showAsha = scene >= 0;
        const showBharat = scene >= 1;
        const showAshaEnd = scene >= 2;
        const showBharatEnd = scene >= 3;

        const ashaHeight = Y_BASE - Y_TOP; // ends at the top — 30 years, larger
        const bharatHeight = (Y_BASE - Y_TOP) * 0.42; // ends lower — 20 years, smaller

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A bar comparison showing Asha's ₹17.4 lakh is about 2.6 times Bharat's ₹6.7 lakh">
              <rect x={46} y={Y_BASE - ashaHeight * 0.9} width={40} height={ashaHeight * 0.9} rx={4} fill="var(--color-accent)" />
              <text x={66} y={Y_BASE - ashaHeight * 0.9 - 8} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-accent)' }}>
                ₹17.4L
              </text>
              <text x={66} y={Y_BASE + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Asha
              </text>

              <rect x={114} y={Y_BASE - ashaHeight * 0.9 * (6.7 / 17.4)} width={40} height={ashaHeight * 0.9 * (6.7 / 17.4)} rx={4} fill="var(--color-ink-faint)" />
              <text x={134} y={Y_BASE - ashaHeight * 0.9 * (6.7 / 17.4) - 8} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-ink-muted)' }}>
                ₹6.7L
              </text>
              <text x={134} y={Y_BASE + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Bharat
              </text>

              <text x={100} y={192} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-up)' }}>
                2.6× as much
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two growth curves, Asha starting ten years before Bharat at the same rate, ending far higher">
            <line x1={X0} y1={Y_BASE} x2={X_END} y2={Y_BASE} stroke="var(--color-line)" strokeWidth={1} />

            {showAsha && (
              <polyline points={curvePoints(0, 1, ashaHeight)} fill="none" stroke="var(--color-accent)" strokeWidth={2} style={{ transition: 'opacity 400ms ease-out' }} />
            )}
            {showBharat && (
              <polyline points={curvePoints(0.33, 1, bharatHeight)} fill="none" stroke="var(--color-ink-faint)" strokeWidth={2} strokeDasharray="3 2" style={{ transition: 'opacity 400ms ease-out' }} />
            )}

            {showAshaEnd && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={X_END} cy={Y_BASE - ashaHeight} r={3} fill="var(--color-accent)" />
                <text x={X_END - 4} y={Y_BASE - ashaHeight - 8} textAnchor="end" style={{ fontSize: 9, fill: 'var(--color-accent)', fontWeight: 700 }}>
                  Asha: ₹17.4L
                </text>
              </g>
            )}
            {showBharatEnd && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={X_END} cy={Y_BASE - bharatHeight} r={3} fill="var(--color-ink-faint)" />
                <text x={X_END - 4} y={Y_BASE - bharatHeight + 14} textAnchor="end" style={{ fontSize: 9, fill: 'var(--color-ink-muted)', fontWeight: 700 }}>
                  Bharat: ₹6.7L
                </text>
              </g>
            )}

            <text x={X0} y={192} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              Asha starts here
            </text>
          </svg>
        );
      }}
    />
  );
}
