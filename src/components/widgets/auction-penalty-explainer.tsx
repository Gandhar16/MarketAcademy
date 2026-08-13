'use client';

/**
 * AuctionPenaltyExplainer — "the exchange is not shopping around — it has
 * to deliver, so it pays what it must, and the difference lands on you",
 * as a short animated walkthrough. Figures match the worked example in the
 * same lesson (200 shares sold at ₹800, market at ₹840 on auction day, the
 * auction filling at ₹890). See `scene-explainer.tsx` for the shared
 * chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'sold', caption: 'You sold 200 shares at ₹800 and could not deliver them on settlement day.' },
  { id: 'market', caption: 'The market price that day is ₹840 — what you would have paid to fix it yourself.' },
  { id: 'auction', caption: 'Instead, the exchange runs an auction. It is compelled to buy, so it pays what it must.' },
  { id: 'fills', caption: 'The auction fills at ₹890 — well above the ₹840 market price.' },
  { id: 'act-first', caption: 'The fix is entirely about timing: confirm you can actually deliver before settlement day, and fix any shortfall yourself in the open market, at the market price, rather than letting the exchange do it for you at its own.' },
  { id: 'lesson', caption: 'Fixing it yourself: −₹8,000. The auction: −₹18,000. The extra ₹10,000 was the price of not acting first.' },
];

export function AuctionPenaltyExplainer() {
  return (
    <SceneExplainer
      title="A compelled buyer does not shop around"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 150;
        const marketY = scene >= 1 ? 110 : 0;
        const auctionY = scene === 3 || scene === 5 ? 60 : 0;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Confirming delivery before settlement day and fixing any shortfall at the market price, avoiding the auction entirely">
              <rect x={30} y={40} width={140} height={40} rx={8} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1.5} />
              <text x={100} y={64} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-accent)' }}>
                confirm delivery, before settlement
              </text>
              <text x={100} y={120} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                fix it yourself, at the market price
              </text>
              <text x={100} y={160} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                the auction never gets a chance to run
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A sale price of 800 rupees, a market price of 840, and an auction fill of 890 rupees, showing the extra cost of a compelled buyer">
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line-strong)" strokeWidth={1.5} />
            <text x={20} y={baseY + 14} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>₹800 sold</text>

            {scene >= 1 && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={marketY} x2={190} y2={marketY} stroke="var(--color-ink-faint)" strokeWidth={1.5} strokeDasharray="3 2" />
                <text x={20} y={marketY - 4} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>₹840 market</text>
              </g>
            )}

            {scene >= 3 && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={auctionY} x2={190} y2={auctionY} stroke="var(--color-down)" strokeWidth={2} />
                <text x={20} y={auctionY - 4} style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>₹890 auction</text>
              </g>
            )}

            {scene >= 4 && (
              <text x={110} y={185} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                −₹8,000 self-fix vs −₹18,000 auction
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
