'use client';

/**
 * CorrelationSpikeExplainer — "ten positions delivered ten stories in the
 * calm week and one story in the bad one — correlation goes to one exactly
 * when it matters", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (a ₹20,00,000 account, ten unrelated
 * positions, an ordinary bad week against a panic week). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'calm', caption: 'Ten unrelated positions. In an ordinary bad week, three fall 8% and the rest are flat.' },
  { id: 'calmresult', caption: 'Result: about −2.4% on the account. Diversification did its job.' },
  { id: 'panic', caption: 'Now a genuine panic arrives. Nobody is trading on company news any more.' },
  { id: 'panicresult', caption: 'All ten fall together, about 18% each — the portfolio behaves as one position.' },
  { id: 'lesson', caption: 'Correlation measured at 0.3 for years arrives at 0.9 inside a fortnight.' },
  { id: 'implication', caption: 'Size the portfolio for the −18% panic-week number, not the −2.4% calm-week one. The calm number is what shows up almost every week; the panic number is the one that actually decides whether you survive it.' },
];

const GRID_COLS = 5;
const GRID_ROWS = 2;
const CELL = 26;
const GRID_X = 30;
const GRID_Y = 40;

export function CorrelationSpikeExplainer() {
  return (
    <SceneExplainer
      title="Ten stories in the calm, one story in the storm"
      scenes={SCENES}
      renderVisual={(scene) => {
        const isPanic = scene >= 2 && scene !== 5;
        const showResult = scene === 1 || scene === 3;
        const fallingCalm = new Set([0, 4, 7]);

        if (scene === 5) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Sizing the portfolio for the 18 percent panic-week outcome rather than the 2.4 percent calm-week one, since the panic number is the one that decides survival">
              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Which number do you size for?
              </text>
              <rect x={30} y={40} width={60} height={90} rx={6} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1} />
              <text x={60} y={90} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--color-accent)' }}>
                −2.4%
              </text>
              <text x={60} y={140} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                almost every week
              </text>
              <rect x={110} y={40} width={60} height={90} rx={6} fill="var(--color-down)" fillOpacity={0.18} stroke="var(--color-down)" strokeWidth={2} />
              <text x={140} y={90} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--color-down)' }}>
                −18%
              </text>
              <text x={140} y={140} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                size for this one
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A grid of ten positions, three falling independently in a calm week versus all ten falling together in a panic week">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {isPanic ? 'Panic week' : 'Ordinary bad week'}
            </text>

            {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
              const col = i % GRID_COLS;
              const row = Math.floor(i / GRID_COLS);
              const falls = isPanic || fallingCalm.has(i);
              return (
                <rect
                  key={i}
                  x={GRID_X + col * (CELL + 4)}
                  y={GRID_Y + row * (CELL + 4)}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={falls ? 'var(--color-down)' : 'var(--color-accent)'}
                  fillOpacity={falls ? 0.8 : 0.5}
                  style={{ transition: 'all 500ms ease-out' }}
                />
              );
            })}

            {showResult && (
              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                {isPanic ? '−18% overall' : '−2.4% overall'}
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
