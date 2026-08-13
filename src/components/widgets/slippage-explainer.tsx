'use client';

/**
 * SlippageExplainer — "the price you see is not the price you get", as a
 * short animated walkthrough, complementing the full interactive
 * `OrderBookLadder` widget in the same lesson. See `scene-explainer.tsx` for
 * the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'screen', caption: 'The screen shows Mango Motors offered at ₹100.05, with 450 shares waiting at that price.' },
  { id: 'small', caption: 'A small order for 100 shares fills entirely inside that first level, at exactly ₹100.05.' },
  { id: 'large', caption: 'Now send a much bigger order: 3,000 shares.' },
  { id: 'eating', caption: 'It takes all 450 shares at ₹100.05, then moves to the next level, and the next…' },
  { id: 'done', caption: '…until all 3,000 are filled — several levels higher than the price you first saw.' },
  { id: 'gap', caption: 'That gap between the price you saw and the price you got is slippage. Nobody charged you a fee for it — it is simply what the queue cost.' },
  { id: 'lesson', caption: 'This is exactly why large investors split big orders into smaller pieces, and why "the price on screen" is only ever a guarantee for a small order.' },
];

const LEVELS = [
  { price: '100.05', qty: 450 },
  { price: '100.10', qty: 610 },
  { price: '100.15', qty: 820 },
  { price: '100.20', qty: 900 },
  { price: '100.25', qty: 1000 },
];

// how many levels are "consumed" (highlighted) at each scene index
const CONSUMED_BY_SCENE = [0, 1, 0, 2, 5, 5, 5];
// scene index 1 consumes only PART of level 1 (a 100-share bite, not the full 450)
const PARTIAL_FIRST_LEVEL = [false, true, false, false, false, false, false];

const ROW_H = 26;
const TOP = 10;

export function SlippageExplainer() {
  return (
    <SceneExplainer
      title="The price you see vs. the price you get"
      scenes={SCENES}
      renderVisual={(scene) => {
        const consumed = CONSUMED_BY_SCENE[scene];
        const partial = PARTIAL_FIRST_LEVEL[scene];

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A ladder of five price levels, showing how much of each is consumed by an order">
            {LEVELS.map((level, i) => {
              const y = TOP + i * ROW_H;
              const isConsumed = i < consumed;
              const isPartial = i === 0 && partial;
              return (
                <g key={level.price}>
                  <rect
                    x={4}
                    y={y}
                    width={150}
                    height={ROW_H - 4}
                    rx={3}
                    fill="var(--color-surface-2)"
                    stroke="var(--color-line)"
                    strokeWidth={1}
                  />
                  <rect
                    x={4}
                    y={y}
                    width={isPartial ? 34 : isConsumed ? 150 : 0}
                    height={ROW_H - 4}
                    rx={3}
                    fill="var(--color-accent)"
                    style={{ transition: 'width 500ms ease-out' }}
                  />
                  <text x={10} y={y + 14} style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                    ₹{level.price}
                  </text>
                  <text x={158} y={y + 14} textAnchor="end" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                    {level.qty}
                  </text>
                </g>
              );
            })}

            {scene === 6 && (
              <g>
                <rect x={20} y={150} width={26} height={16} rx={3} fill="var(--color-accent)" fillOpacity={0.6} />
                <rect x={54} y={150} width={26} height={16} rx={3} fill="var(--color-accent)" fillOpacity={0.6} />
                <rect x={88} y={150} width={26} height={16} rx={3} fill="var(--color-accent)" fillOpacity={0.6} />
                <text x={65} y={178} textAnchor="middle" style={{ fontSize: 8, fontWeight: 600, fill: 'var(--color-ink-muted)' }}>
                  split into smaller pieces
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
