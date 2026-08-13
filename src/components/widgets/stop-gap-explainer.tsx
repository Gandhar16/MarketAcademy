'use client';

/**
 * StopGapExplainer — "a stop-loss is an instruction, not a guarantee", as a
 * short animated walkthrough. See `scene-explainer.tsx` for the shared
 * chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'entry', caption: 'You are long from ₹1,400, with a protective stop set to trigger at ₹1,350.' },
  { id: 'gap', caption: 'Overnight, bad news. The stock opens at ₹1,200 the next morning — it never trades anywhere between ₹1,350 and ₹1,200.' },
  { id: 'sl', caption: 'SL (stop-limit): triggers at ₹1,350, places a LIMIT order at ₹1,345. But the market is at ₹1,200 — nobody will pay ₹1,345. It sits there, unfilled.' },
  { id: 'slm', caption: 'SL-M (stop-market): triggers at ₹1,350, becomes a MARKET order — and fills immediately, at ₹1,200.' },
  { id: 'stuck', caption: 'The SL order just sits there, unfilled, while the stock keeps falling. By the time that trader gives up and manually sells at market, the price is ₹1,150 — 50 rupees worse than SL-M already locked in.' },
  { id: 'lesson', caption: 'A bad price beats no price. SL-M got you out. SL left you still holding a falling stock.' },
];

// prices mapped to a y position on a small vertical axis (higher price = lower y)
const priceY = (price: number) => 190 - ((price - 1150) / (1450 - 1150)) * 170;

export function StopGapExplainer() {
  return (
    <SceneExplainer
      title="SL vs. SL-M, on a real gap"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showGap = scene >= 1;
        const showSL = scene === 2 || scene >= 4;
        const showSLM = scene === 3 || scene >= 4;
        const showStuck = scene >= 4;
        const bothFinal = scene >= 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A vertical price axis showing a gap down through a stop order, with the stop-limit order left unfilled and the stop-market order filled at the open">
            <line x1={30} y1={20} x2={30} y2={196} stroke="var(--color-line)" strokeWidth={1.5} />

            {/* entry */}
            <g>
              <circle cx={30} cy={priceY(1400)} r={3} fill="var(--color-ink-faint)" />
              <text x={38} y={priceY(1400) + 3} style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Entry ₹1,400
              </text>
            </g>

            {/* trigger */}
            <g>
              <circle cx={30} cy={priceY(1350)} r={3} fill="var(--color-accent)" />
              <text x={38} y={priceY(1350) + 3} style={{ fontSize: 8, fill: 'var(--color-accent)' }}>
                Trigger ₹1,350
              </text>
            </g>

            {/* the gap, a dashed jump from 1350 straight to 1200 */}
            {showGap && (
              <line
                x1={30}
                y1={priceY(1350)}
                x2={30}
                y2={priceY(1200)}
                stroke="var(--color-down)"
                strokeWidth={2}
                strokeDasharray="3 3"
                style={{ transition: 'opacity 400ms ease-out' }}
              />
            )}

            {/* SL: unfilled limit sitting at 1345, above where price now is */}
            {showSL && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={70} y={priceY(1345) - 9} width={62} height={18} rx={4} fill="var(--color-down)" fillOpacity={0.12} stroke="var(--color-down)" strokeWidth={1.5} />
                <text x={101} y={priceY(1345) + 4} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 600 }}>
                  SL: unfilled ✕
                </text>
              </g>
            )}

            {/* SL-M: filled at 1200 */}
            {showSLM && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={30} cy={priceY(1200)} r={3} fill="var(--color-up)" />
                <rect x={70} y={priceY(1200) - 9} width={62} height={18} rx={4} fill="var(--color-up)" fillOpacity={0.15} stroke="var(--color-up)" strokeWidth={1.5} />
                <text x={101} y={priceY(1200) + 4} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)', fontWeight: 600 }}>
                  SL-M: filled ✓
                </text>
              </g>
            )}

            {/* the eventual manual sale, once the stuck SL trader gives up */}
            {showStuck && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={30} cy={priceY(1150)} r={3} fill="var(--color-down)" />
                <rect x={70} y={priceY(1150) - 9} width={62} height={18} rx={4} fill="var(--color-down)" fillOpacity={0.12} stroke="var(--color-down)" strokeWidth={1.5} />
                <text x={101} y={priceY(1150) + 4} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 600 }}>
                  sold late: ₹1,150
                </text>
              </g>
            )}

            {bothFinal && (
              <text x={100} y={14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Same gap, two very different outcomes
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
