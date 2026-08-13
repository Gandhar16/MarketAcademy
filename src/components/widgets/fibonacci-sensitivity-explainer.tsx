'use client';

/**
 * FibonacciSensitivityExplainer — "the arithmetic is exact, the two anchors
 * feeding it were chosen by eye", as a short animated walkthrough. Figures
 * match the worked example in the same lesson (₹840→₹1,040, a ten-rupee
 * anchor shift). See `scene-explainer.tsx` for the shared chrome and why
 * this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'grid', caption: 'Swing low ₹840, swing high ₹1,040 — a ₹200 move. The retracement grid appears.' },
  { id: 'levels', caption: '23.6%, 50% and 61.8% retracements, each a fixed percentage of that ₹200 range.' },
  { id: 'shift', caption: 'Move the low anchor by just ₹10, to ₹850 — a difference most people would call close enough.' },
  { id: 'moved', caption: 'Every level shifts too. The 61.8% level alone moves by about ₹6.' },
  { id: 'all-shift', caption: 'Every single level moved: 23.6% by ₹2.4, 50% by ₹5, and 61.8% by ₹6.2 — all from one ₹10 nudge to an anchor picked by eye.' },
  { id: 'lesson', caption: 'The arithmetic is exact. The two points feeding it were chosen by eye — and 50% is not even part of the real Fibonacci sequence.' },
];

const priceY = (p: number) => 180 - ((p - 820) / (1060 - 820)) * 160;
const LEVELS = [
  { pct: 23.6, price: 992.8 },
  { pct: 50, price: 940 },
  { pct: 61.8, price: 916.4 },
];
const LEVELS_SHIFTED = [
  { pct: 23.6, price: 995.2 },
  { pct: 50, price: 945 },
  { pct: 61.8, price: 922.58 },
];

export function FibonacciSensitivityExplainer() {
  return (
    <SceneExplainer
      title="Two anchors, chosen by eye"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showLevels = scene >= 1;
        const shifted = scene >= 2;
        const levels = shifted ? LEVELS_SHIFTED : LEVELS;

        if (scene === 4) {
          const DELTAS = [
            { pct: '23.6%', delta: 2.4 },
            { pct: '50%', delta: 5 },
            { pct: '61.8%', delta: 6.2 },
          ];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A table showing every retracement level's shift from a single ten-rupee anchor move: 2.4, 5, and 6.2 rupees">
              <text x={100} y={18} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                From one ₹10 anchor shift
              </text>
              {DELTAS.map((d, i) => (
                <g key={d.pct}>
                  <text x={16} y={50 + i * 40} style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                    {d.pct}
                  </text>
                  <rect x={16} y={58 + i * 40} width={d.delta * 24} height={16} rx={4} fill="var(--color-accent)" />
                  <text x={20 + d.delta * 24} y={70 + i * 40} style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-accent)' }}>
                    ₹{d.delta}
                  </text>
                </g>
              ))}
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A vertical price axis with a swing low and high, and three retracement levels between them that shift when the low anchor moves">
            <line x1={30} y1={14} x2={30} y2={188} stroke="var(--color-line)" strokeWidth={1.5} />

            <circle cx={30} cy={priceY(1040)} r={3.5} fill="var(--color-ink)" />
            <text x={38} y={priceY(1040) + 3} style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
              high ₹1,040
            </text>

            <circle cx={30} cy={priceY(shifted ? 850 : 840)} r={3.5} fill={shifted ? 'var(--color-down)' : 'var(--color-ink)'} style={{ transition: 'all 400ms ease-out' }} />
            <text x={38} y={priceY(shifted ? 850 : 840) + 3} style={{ fontSize: 7.5, fill: shifted ? 'var(--color-down)' : 'var(--color-ink-faint)', fontWeight: shifted ? 700 : 400 }}>
              low ₹{shifted ? '850' : '840'}
            </text>

            {showLevels &&
              levels.map((l) => (
                <g key={l.pct} style={{ transition: 'all 500ms ease-out' }}>
                  <line x1={26} y1={priceY(l.price)} x2={110} y2={priceY(l.price)} stroke="var(--color-accent)" strokeWidth={1.5} />
                  <text x={116} y={priceY(l.price) + 3} style={{ fontSize: 7.5, fill: 'var(--color-accent)' }}>
                    {l.pct}% · ₹{l.price.toFixed(1)}
                  </text>
                </g>
              ))}
          </svg>
        );
      }}
    />
  );
}
