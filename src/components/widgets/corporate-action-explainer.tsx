'use client';

/**
 * CorporateActionExplainer — "did money actually leave the company?", as a
 * short animated walkthrough. See `scene-explainer.tsx` for the shared
 * chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'start', caption: 'You hold shares worth ₹1,00,000.' },
  { id: 'dividend', caption: 'A ₹20-per-share dividend is paid: real cash leaves the company and arrives in your bank account.' },
  { id: 'bonus', caption: 'A 1-for-1 bonus instead: your shares double, the price halves. Nothing left the company.' },
  { id: 'split', caption: 'A 3-for-1 split: the same thing again, just more slices. Still nothing has left.' },
  { id: 'ex-date', caption: 'On the ex-dividend date, the share price itself typically drops by about that same ₹20. The total ₹1,00,000 does not jump — it was only ever split between cash in your bank and value still sitting in the share.' },
  { id: 'lesson', caption: 'Only the dividend actually put money in your pocket. The other two just changed how many slices you are holding.' },
];

export function CorporateActionExplainer() {
  return (
    <SceneExplainer
      title="Did money actually leave the company?"
      scenes={SCENES}
      renderVisual={(scene) => {
        const isDividend = scene === 1;
        const isBonus = scene === 2;
        const isSplit = scene === 3;
        const isExDate = scene === 4;
        const slices = isSplit ? 6 : isBonus ? 2 : 1;

        if (isExDate) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The same ₹1,00,000 total, split between cash already paid out and the share price adjusted down by the same amount">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8.5, fill: 'var(--color-ink-faint)' }}>
                Same ₹1,00,000 total
              </text>
              <rect x={40} y={26} width={120} height={100} rx={8} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <rect x={40} y={26} width={24} height={100} fill="var(--color-down)" fillOpacity={0.28} />
              <rect x={64} y={26} width={96} height={100} fill="var(--color-accent)" fillOpacity={0.25} />
              <text x={52} y={142} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                cash paid
              </text>
              <text x={112} y={142} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-accent)', fontWeight: 700 }}>
                share price, ₹20 lower
              </text>
              <text x={100} y={160} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                Nothing was created or destroyed
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A box representing your holding's value, either staying whole with more internal slices, or losing a piece that exits to a dividend">
            <rect x={40} y={30} width={120} height={100} rx={8} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
            <text x={100} y={20} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
              Your holding — ₹1,00,000 either way
            </text>

            {Array.from({ length: slices }, (_, i) => {
              const w = 120 / slices;
              return (
                <rect
                  key={i}
                  x={40 + i * w}
                  y={30}
                  width={w - 1}
                  height={100}
                  fill="var(--color-accent)"
                  fillOpacity={0.25 + (i % 2) * 0.15}
                  style={{ transition: 'all 500ms ease-out' }}
                />
              );
            })}

            {isDividend && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={40} y={30} width={20} height={100} fill="var(--color-down)" fillOpacity={0.3} />
                <line x1={50} y1={80} x2={50} y2={150} stroke="var(--color-down)" strokeWidth={2} markerEnd="url(#dividend-arrow)" />
                <defs>
                  <marker id="dividend-arrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto">
                    <path d="M0,0 L8,0 L4,8 z" fill="var(--color-down)" />
                  </marker>
                </defs>
                <rect x={20} y={152} width={60} height={26} rx={5} fill="var(--color-down)" fillOpacity={0.15} stroke="var(--color-down)" strokeWidth={1.5} />
                <text x={50} y={169} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                  ₹20/sh → you
                </text>
              </g>
            )}

            {(isBonus || isSplit) && (
              <text x={100} y={148} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                {isSplit ? 'more slices, same box' : 'one extra slice, same box'}
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
