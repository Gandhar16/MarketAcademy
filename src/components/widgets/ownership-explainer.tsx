'use client';

/**
 * OwnershipExplainer — "what did you actually buy", as a short animated
 * walkthrough rather than a paragraph. See `scene-explainer.tsx` for why
 * this is a diagram and not a real video, and for the shared play/pause/
 * back/next/dots/caption chrome every lesson's explainer reuses.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'wallet', caption: 'You have ₹1,000 to invest.' },
  { id: 'company', caption: 'Mango Motors, a fictional company, is divided into 1,000 equal shares.' },
  { id: 'buy', caption: 'You use your ₹1,000 to buy 10 of those shares, at ₹100 each.' },
  { id: 'own', caption: '10 out of 1,000 shares is 1% — you now own 1% of Mango Motors, permanently, until you sell.' },
  { id: 'price-up', caption: 'A year later the share price rises to ₹120. Your 10 shares — still the same 1% — are now worth ₹1,200. Nobody paid you that; the market simply re-priced what you already owned.' },
  { id: 'price-down', caption: 'Or picture the price falling to ₹80 instead. Same 10 shares, same 1%, now worth ₹800. Ownership does not change with the price — only what it is worth does.' },
  { id: 'grow', caption: 'Mango Motors keeps your original ₹1,000 to run and grow the business, whichever way the price moves. You keep the 1% slice — its value moves with the price, not with a promise.' },
];

const GRID_SIZE = 10; // 10x10 = 100 tiles, each representing 1% (10 real shares) of the 1,000

export function OwnershipExplainer() {
  return (
    <SceneExplainer
      title="What did you actually buy — in one picture"
      scenes={SCENES}
      renderVisual={(scene) => {
        const owned = scene >= 2; // from the 'buy' scene onward, one tile is highlighted
        const priceUp = scene === 4;
        const priceDown = scene === 5;
        const tileColour = priceUp ? 'var(--color-up)' : priceDown ? 'var(--color-down)' : 'var(--color-accent)';
        const valueLabel = priceUp ? '₹1,200' : priceDown ? '₹800' : owned ? '₹1,000' : null;
        return (
          <svg
            viewBox="0 0 200 200"
            className="h-40 w-40"
            role="img"
            aria-label={owned ? 'A 10 by 10 grid representing Mango Motors, with one tile highlighted to show your 1% ownership, and its current value' : 'A 10 by 10 grid representing the 1,000 shares of Mango Motors'}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const x = (i % GRID_SIZE) * 20;
              const y = Math.floor(i / GRID_SIZE) * 20;
              const isYours = owned && i === 0;
              return (
                <rect
                  key={i}
                  x={x + 1}
                  y={y + 1}
                  width={18}
                  height={18}
                  rx={2}
                  style={{
                    fill: isYours ? tileColour : 'var(--color-surface-2)',
                    stroke: 'var(--color-line)',
                    strokeWidth: 1,
                    transition: 'fill 400ms ease-out',
                  }}
                />
              );
            })}
            {valueLabel && (
              <g>
                {/* A backing band, not transparent text-on-tiles — the grid
                    already fills the full 200x200 viewBox, so the label
                    needs its own opaque strip rather than floating over the
                    bottom row of tiles. */}
                <rect x={0} y={178} width={200} height={22} fill="var(--color-surface)" fillOpacity={0.92} />
                <text
                  x={100}
                  y={193}
                  textAnchor="middle"
                  style={{ fontSize: 11, fontWeight: 700, fill: tileColour, transition: 'fill 400ms ease-out' }}
                >
                  Your 1% is worth {valueLabel}
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
