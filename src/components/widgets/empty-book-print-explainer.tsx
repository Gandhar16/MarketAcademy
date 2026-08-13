'use client';

/**
 * EmptyBookPrintExplainer — "a market order says fill me at any price — in
 * a thin book, the market takes that literally, because there is nobody
 * there to argue", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (a contract quoted at ₹4, ten lots
 * filling at an average of ₹37 — over nine times the quote). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'quote', caption: 'The screen shows ₹4. That is the price of the smallest possible trade — maybe one lot.' },
  { id: 'thin', caption: 'Behind it, the book is nearly empty: one lot at ₹4, two at ₹9, one at ₹18, then nothing sensible.' },
  { id: 'order', caption: 'You send a market order for 10 lots. It must fill — there is nobody to argue the price with.' },
  { id: 'walk', caption: 'It eats every level in its path, all the way up to whatever is resting far above.' },
  { id: 'limit', caption: 'A limit order at ₹6 instead caps the damage completely — never above ₹6 — at the cost of possibly not filling at all. On a thin book, not filling is the recoverable outcome.' },
  { id: 'lesson', caption: 'Average fill: ₹37. Over nine times the quoted price, in a fraction of a second.' },
];

export function EmptyBookPrintExplainer() {
  return (
    <SceneExplainer
      title="A market order takes the book literally"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const showThin = scene >= 1 && scene !== 4;
        const showWalk = scene >= 3 && scene !== 4;
        const levels = [4, 9, 18, 55];
        const heights = [8, 20, 45, 130];

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A limit order at 6 rupees capping the maximum possible fill price completely, even on the same thin book">
              <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />
              <rect x={40} y={baseY - 12} width={26} height={12} rx={3} fill="var(--color-ink-faint)" fillOpacity={0.5} />
              <rect x={78} y={baseY - 28} width={26} height={28} rx={3} fill="var(--color-ink-faint)" fillOpacity={0.5} />
              <line x1={16} y1={baseY - 32} x2={190} y2={baseY - 32} stroke="var(--color-up)" strokeWidth={2} strokeDasharray="3 2" />
              <text x={186} y={baseY - 38} textAnchor="end" style={{ fontSize: 7.5, fontWeight: 700, fill: 'var(--color-up)' }}>
                limit ₹6 — hard cap
              </text>
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-up)' }}>
                may not fill — that is fine
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A thin order book with levels at 4, 9, 18 and 55 rupees, walked through entirely by a ten-lot market order">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {scene === 0 ? 'Quoted: ₹4' : 'The book behind it'}
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            {showThin && levels.map((p, i) => {
              const eaten = showWalk && scene >= 3 + (i >= 2 ? 1 : 0);
              const x = 30 + i * 38;
              const h = heights[i];
              return (
                <g key={i} style={{ transition: 'opacity 400ms ease-out' }}>
                  <rect x={x} y={baseY - h} width={26} height={h} rx={3} fill={eaten ? 'var(--color-down)' : 'var(--color-ink-faint)'} fillOpacity={eaten ? 0.8 : 0.5} style={{ transition: 'all 500ms ease-out' }} />
                  <text x={x + 13} y={baseY + 12} textAnchor="middle" style={{ fontSize: 6, fill: 'var(--color-ink-faint)' }}>₹{p}</text>
                </g>
              );
            })}

            {scene >= 4 && (
              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                average ₹37 · 9.25× the quote
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
