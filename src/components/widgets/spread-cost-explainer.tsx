'use client';

/**
 * SpreadCostExplainer — "you lost the full spread, not half of it — the
 * people on the other side collected it for doing nothing but waiting", as
 * a short animated walkthrough. Figures match the opening predict in the
 * same lesson (bid ₹1,399.80, ask ₹1,400.20, an instant round trip at
 * market). See `scene-explainer.tsx` for the shared chrome and why this is
 * a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'book', caption: 'Bid ₹1,399.80. Ask ₹1,400.20. A 40-paise gap between them.' },
  { id: 'buy', caption: 'You buy at market — you pay the ask, ₹1,400.20.' },
  { id: 'sell', caption: 'You sell again instantly — you receive the bid, ₹1,399.80.' },
  { id: 'crossed', caption: 'You crossed the gap twice, once each way.' },
  { id: 'scale', caption: 'On 500 shares that is ₹200 gone before the market has moved a single paisa in your favour — invisible on the contract note, paid on every round trip, whether the trade wins or loses.' },
  { id: 'lesson', caption: 'The full 40 paise is gone — never on a contract note, paid every single time.' },
];

export function SpreadCostExplainer() {
  return (
    <SceneExplainer
      title="Crossing the spread costs the whole gap, not half"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showBuy = scene >= 1 && scene !== 4;
        const showSell = scene >= 2 && scene !== 4;
        const showCrossed = scene === 3 || scene === 5;
        const bidY = 130;
        const askY = 70;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="40 paise per share scaled to 500 shares, costing 200 rupees on a single round trip regardless of the outcome">
              <text x={100} y={40} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
                ₹0.40 × 500 shares
              </text>
              <text x={100} y={100} textAnchor="middle" style={{ fontSize: 32, fontWeight: 700, fill: 'var(--color-down)' }}>
                −₹200
              </text>
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                before the market moves at all
              </text>
              <text x={100} y={175} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                not on any contract note
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Buying at the ask of 1400.20 and selling at the bid of 1399.80, losing the full 40 paise spread">
            <line x1={30} y1={askY} x2={170} y2={askY} stroke="var(--color-line)" strokeWidth={1.5} />
            <text x={20} y={askY + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>ask</text>
            <text x={175} y={askY + 3} style={{ fontSize: 7, fill: 'var(--color-ink)' }}>1400.20</text>

            <line x1={30} y1={bidY} x2={170} y2={bidY} stroke="var(--color-line)" strokeWidth={1.5} />
            <text x={20} y={bidY + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>bid</text>
            <text x={175} y={bidY + 3} style={{ fontSize: 7, fill: 'var(--color-ink)' }}>1399.80</text>

            {showBuy && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={70} cy={askY} r={5} fill="var(--color-down)" />
                <text x={70} y={askY - 10} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>buy</text>
              </g>
            )}

            {showSell && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={120} cy={bidY} r={5} fill="var(--color-down)" />
                <text x={120} y={bidY + 18} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>sell</text>
              </g>
            )}

            {showCrossed && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={70} y1={askY} x2={120} y2={bidY} stroke="var(--color-down)" strokeWidth={2} strokeDasharray="3 2" />
                <text x={100} y={100} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>−₹0.40</text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
