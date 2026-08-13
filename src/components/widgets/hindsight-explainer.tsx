'use client';

/**
 * HindsightExplainer — "obvious on a finished chart, invisible on the
 * right-hand edge", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (a 400-point move, rule captures the
 * middle 220). See `scene-explainer.tsx` for the shared chrome and why this
 * is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'finished', caption: 'A finished chart: obviously a rise from ₹1,000 to ₹1,400, then back down to ₹1,050.' },
  { id: 'edge', caption: 'But on the right-hand edge, bar by bar, that future does not exist yet — the trend has to be judged without it.' },
  { id: 'buy', caption: 'A trend rule needs the averages to cross before it acts — so it actually buys late, around ₹1,090.' },
  { id: 'sell', caption: 'And it needs the turn to happen before it reverses — so it sells late too, around ₹1,310.' },
  { id: 'percent', caption: '₹1,090 to ₹1,310 is 220 points, out of the full 400-point move from ₹1,000 to ₹1,400. That is 55%.' },
  { id: 'lesson', caption: 'The rule captured the middle 220 points of a 400-point move — 55%. That is the price of a definition you could actually apply at the time.' },
];

// price 1000..1400 mapped to y
const priceY = (p: number) => 180 - ((p - 1000) / (1400 - 1000)) * 130;
const X0 = 20;
const X_PEAK = 110;
const X_END = 180;

function fullPath() {
  return `M ${X0} ${priceY(1000)} L ${X_PEAK} ${priceY(1400)} L ${X_END} ${priceY(1050)}`;
}

export function HindsightExplainer() {
  return (
    <SceneExplainer
      title="Obvious in hindsight, hidden at the edge"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showEdgeCursor = scene === 1;
        const showBuy = scene >= 2;
        const showSell = scene >= 3;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A bar showing the full 400-point move, with the 220 points the rule actually captured highlighted as 55 percent">
              <rect x={20} y={90} width={160} height={30} rx={5} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <rect x={64} y={90} width={88} height={30} rx={5} fill="var(--color-up)" fillOpacity={0.35} />
              <text x={20} y={84} style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                ₹1,000
              </text>
              <text x={180} y={84} textAnchor="end" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                ₹1,400
              </text>
              <text x={108} y={109} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                220 pts captured
              </text>
              <text x={100} y={148} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: 'var(--color-up)' }}>
                55%
              </text>
              <text x={100} y={166} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                of the full move
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A price path rising then falling, with a lagging trend rule buying after the rise starts and selling after the fall starts">
            <path d={fullPath()} fill="none" stroke={scene === 1 ? 'var(--color-ink-faint)' : 'var(--color-accent)'} strokeWidth={2} style={{ transition: 'stroke 400ms ease-out' }} />

            {showEdgeCursor && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={70} y1={10} x2={70} y2={195} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
                <text x={70} y={8} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)' }}>
                  right edge — future unknown
                </text>
              </g>
            )}

            {showBuy && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={54} cy={priceY(1090)} r={4} fill="var(--color-up)" />
                <text x={54} y={priceY(1090) + 16} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-up)', fontWeight: 600 }}>
                  buys ₹1,090
                </text>
              </g>
            )}

            {showSell && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={144} cy={priceY(1310)} r={4} fill="var(--color-down)" />
                <text x={144} y={priceY(1310) - 8} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 600 }}>
                  sells ₹1,310
                </text>
              </g>
            )}

            <text x={X0} y={192} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              ₹1,000
            </text>
            <text x={X_PEAK} y={priceY(1400) - 6} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              ₹1,400
            </text>
          </svg>
        );
      }}
    />
  );
}
