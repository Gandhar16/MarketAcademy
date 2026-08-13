'use client';

/**
 * TradeSequenceExplainer — "the decisions that must happen BEFORE the order
 * is placed", as a short animated walkthrough. See `scene-explainer.tsx`
 * for the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'habit', caption: 'The common habit: pick a share, buy it — THEN think about size, and think about the exit only once it is already going wrong.' },
  { id: 'before', caption: 'Before the order: is the idea good? Where does it stop being good? How many shares does that exit distance allow?' },
  { id: 'type', caption: 'Only then: which order type, given fill certainty or price certainty — placed, and filled.' },
  { id: 'hold', caption: 'Hold, with the exit already resting in the market. Exit for the reason that was in the plan. Settle, then check the note.' },
  { id: 'free', caption: 'Steps 1 to 3 are the ones people skip. They are also the only ones that are free.' },
  { id: 'callback', caption: 'That "Exit — too late" box from the very first picture is not a coincidence. It is what happens whenever the exit was never decided until the loss forced it.' },
];

const STEPS = [
  'Is the idea any good?',
  'Where does it stop being good?',
  'How many shares does that allow?',
  'Which order type?',
  'Placed, and filled',
  'Hold — exit already resting',
  'Exit, for the planned reason',
  'Settle, then check the note',
];

const ROW_H = 21;
const TOP = 12;

export function TradeSequenceExplainer() {
  return (
    <SceneExplainer
      title="The order decisions actually happen in"
      scenes={SCENES}
      renderVisual={(scene) => {
        if (scene === 0 || scene === 5) {
          const emphasize = scene === 5;
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The common habit: buy, then size, then exit too late">
              {['Buy', 'Size', 'Exit — too late'].map((label, i) => (
                <g key={label}>
                  <rect
                    x={20}
                    y={20 + i * 56}
                    width={160}
                    height={40}
                    rx={8}
                    fill={i === 2 ? 'var(--color-down)' : 'var(--color-surface-2)'}
                    fillOpacity={i === 2 ? (emphasize ? 0.25 : 0.15) : 1}
                    stroke={i === 2 ? 'var(--color-down)' : 'var(--color-line)'}
                    strokeWidth={i === 2 && emphasize ? 2.5 : 1.5}
                  />
                  <text x={100} y={20 + i * 56 + 24} textAnchor="middle" style={{ fontSize: 10, fill: i === 2 ? 'var(--color-down)' : 'var(--color-ink)', fontWeight: 600 }}>
                    {label}
                  </text>
                  {i < 2 && (
                    <text x={100} y={20 + i * 56 + 52} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--color-ink-faint)' }}>
                      ↓
                    </text>
                  )}
                </g>
              ))}
              {emphasize && (
                <text x={100} y={192} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                  the predictable result of skipping 1–3
                </text>
              )}
            </svg>
          );
        }

        // scene 1 -> rows 0-2 active (before); scene 2 -> rows 3-4; scene 3 -> rows 5-7; scene 4 -> rows 0-2 again, tagged "free"
        const activeRange: [number, number] =
          scene === 1 ? [0, 2] : scene === 2 ? [3, 4] : scene === 3 ? [5, 7] : [0, 2];
        const showFreeTag = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Eight steps of a trade, before and after the order is placed">
            {STEPS.map((step, i) => {
              const y = TOP + i * ROW_H;
              const isActive = i >= activeRange[0] && i <= activeRange[1];
              return (
                <g key={step} style={{ transition: 'opacity 400ms ease-out' }}>
                  <rect
                    x={4}
                    y={y}
                    width={192}
                    height={ROW_H - 4}
                    rx={4}
                    fill={isActive ? 'var(--color-accent)' : 'transparent'}
                    fillOpacity={isActive ? 0.13 : 0}
                  />
                  <text
                    x={10}
                    y={y + 12}
                    style={{ fontSize: 7.5, fill: isActive ? 'var(--color-ink)' : 'var(--color-ink-faint)', fontWeight: isActive ? 600 : 400 }}
                  >
                    {i + 1}. {step}
                    {showFreeTag && isActive && '  · free'}
                  </text>
                </g>
              );
            })}
          </svg>
        );
      }}
    />
  );
}
