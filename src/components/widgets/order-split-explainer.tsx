'use client';

/**
 * OrderSplitExplainer — "the regulation is easy to work around, and
 * working around it is where the money goes — several orders in sequence
 * get progressively worse prices", as a short animated walkthrough.
 * Figures match the worked example in the same lesson (5,000 shares
 * forced into four orders by a freeze-quantity limit). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'blocked', caption: 'One order for 5,000 shares exceeds the freeze quantity. It is rejected outright.' },
  { id: 'split', caption: 'The workaround is legal: send it as four separate orders instead.' },
  { id: 'first', caption: 'The first order fills near the screen price — the book is still fresh.' },
  { id: 'later', caption: 'Each later order starts from a book the earlier ones already ate into.' },
  { id: 'patience', caption: 'Spreading the four orders further apart in time, rather than firing them back to back, gives the book a chance to refill between each one — the difference between a bad average price and a genuinely damaging one.' },
  { id: 'lesson', caption: 'The rule made you split the order. The book made you pay for it — and that cost is the larger one.' },
];

export function OrderSplitExplainer() {
  return (
    <SceneExplainer
      title="Splitting is legal. The book still charges for it."
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const bars = [1, 2, 3, 4];
        const heights = [40, 55, 72, 92];
        const showSplit = scene >= 1;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A single large order rejected, then split into four orders with progressively worse fill prices as each one eats further into the book">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {showSplit ? 'Four orders, four prices' : 'One order: 5,000 shares'}
            </text>

            {!showSplit && (
              <g>
                <rect x={60} y={60} width={80} height={70} rx={6} fill="var(--color-surface-2)" stroke="var(--color-down)" strokeWidth={2} />
                <line x1={60} y1={60} x2={140} y2={130} stroke="var(--color-down)" strokeWidth={2} />
                <line x1={140} y1={60} x2={60} y2={130} stroke="var(--color-down)" strokeWidth={2} />
                <text x={100} y={150} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>rejected</text>
              </g>
            )}

            {scene === 4 && (
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-accent)' }}>
                spread the four orders out in time
              </text>
            )}

            {showSplit && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={16} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />
                {bars.map((n, i) => {
                  const shown = scene >= 2 + Math.max(0, i - 1) || (scene >= 2 && i === 0);
                  const active = scene - 2 >= i || scene >= 4;
                  const h = active ? heights[i] : 20;
                  const x = 24 + i * 40;
                  return (
                    <g key={n} style={{ transition: 'opacity 400ms ease-out' }} opacity={shown || scene >= 3 ? 1 : 0.25}>
                      <rect x={x} y={baseY - h} width={26} height={h} rx={3} fill={i >= 2 ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
                      <text x={x + 13} y={baseY + 12} textAnchor="middle" style={{ fontSize: 6, fill: 'var(--color-ink-faint)' }}>#{n}</text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
