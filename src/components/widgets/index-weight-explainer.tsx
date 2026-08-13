'use client';

/**
 * IndexWeightExplainer — "a weighted index can rise while most of its
 * companies fall", as a short animated walkthrough. See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'A tiny index of three companies, weighted by size: Big 70%, Mid 20%, Small 10%.' },
  { id: 'big-up', caption: 'Today Big rises 2%.' },
  { id: 'others-down', caption: 'Mid and Small both fall 3% — two out of three companies are down.' },
  { id: 'weighted', caption: "Weight each move by size. Big's 70% weight makes its contribution far bigger than the other two combined." },
  { id: 'sum', caption: 'Add the three weighted contributions: +1.4 points from Big, −0.6 from Mid, −0.3 from Small.' },
  { id: 'net', caption: '+1.4 − 0.6 − 0.3 = +0.5%. The index rises — even though two of its three companies fell.' },
];

const ROWS = [
  { id: 'big', label: 'Big', weight: 70, move: 2 },
  { id: 'mid', label: 'Mid', weight: 20, move: -3 },
  { id: 'small', label: 'Small', weight: 10, move: -3 },
];

const ROW_H = 34;
const TOP = 14;
const MAX_W = 100;

export function IndexWeightExplainer() {
  return (
    <SceneExplainer
      title="How a weighted index can rise while most fall"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showMoves = scene >= 1; // Big's move shows first
        const showAllMoves = scene >= 2; // Mid/Small moves show
        const showContribution = scene >= 3;
        const showEquation = scene >= 4;
        const showNet = scene === 5;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three weighted bars for Big, Mid and Small companies, showing how their price moves combine into the index">
            {ROWS.map((row, i) => {
              const y = TOP + i * ROW_H;
              const w = (row.weight / 70) * MAX_W;
              const moveVisible = row.id === 'big' ? showMoves : showAllMoves;
              const isUp = row.move > 0;
              const colour = moveVisible ? (isUp ? 'var(--color-up)' : 'var(--color-down)') : 'var(--color-surface-2)';
              return (
                <g key={row.id}>
                  <rect x={4} y={y} width={w} height={ROW_H - 10} rx={4} fill={colour} style={{ transition: 'fill 400ms ease-out' }} />
                  <text x={4} y={y - 3} style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                    {row.label} · {row.weight}% weight
                  </text>
                  {moveVisible && (
                    <text x={w + 10} y={y + 16} style={{ fontSize: 9, fill: colour, fontWeight: 700 }}>
                      {row.move > 0 ? '+' : ''}
                      {row.move}%
                    </text>
                  )}
                  {showContribution && (
                    <text x={w + 44} y={y + 16} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                      ({((row.move * row.weight) / 100).toFixed(1)} pts)
                    </text>
                  )}
                </g>
              );
            })}

            {showEquation && (
              <text x={100} y={196} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: showNet ? 'var(--color-up)' : 'var(--color-ink)' }}>
                {showNet ? '+1.4 − 0.6 − 0.3 = +0.5%' : '+1.4 − 0.6 − 0.3 = ?'}
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
