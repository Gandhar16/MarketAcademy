'use client';

/**
 * TwoRisksExplainer — "diversification removes company risk and leaves
 * market risk completely untouched", as a short animated walkthrough.
 * Figures match the worked example in the same lesson (₹10,00,000, one
 * company vs. twenty). See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Case A: all ₹10,00,000 in one company. Case B: the same money spread across 20 companies, ₹50,000 each.' },
  { id: 'fraud', caption: 'One company turns out to be a fraud — it goes to zero.' },
  { id: 'fraud-result', caption: 'Case A: total loss. Case B: down 5% — a bad month, not a catastrophe.' },
  { id: 'crash', caption: 'Now imagine the whole market falls 30% instead.' },
  { id: 'crash-result', caption: 'Both cases fall by the same 30%. Diversification did nothing here — this is the risk it cannot touch.' },
  { id: 'recap', caption: 'Company risk — one business failing — is removed by diversifying. Market risk — everything falling together — is not. Diversification only cancels the risk that is specific to one company.' },
];

const GRID_COLS = 5;
const GRID_ROWS = 4;
const CELL = 14;
const GRID_X = 106;
const GRID_Y = 22;

export function TwoRisksExplainer() {
  return (
    <SceneExplainer
      title="What diversification removes, and what it doesn't"
      scenes={SCENES}
      renderVisual={(scene) => {
        const failedIndex = scene >= 1 && scene < 3 ? 0 : null; // one cell fails in scenes 1-2
        const marketCrash = scene >= 3 && scene < 5;

        if (scene === 5) {
          const ROWS = [
            { risk: 'Company risk', removed: true, note: '−100% vs −5%' },
            { risk: 'Market risk', removed: false, note: '−30% either way' },
          ];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A recap table: company risk is removed by diversifying, market risk is not">
              {ROWS.map((row, i) => {
                const y = 30 + i * 74;
                return (
                  <g key={row.risk}>
                    <rect x={10} y={y} width={180} height={60} rx={8} fill={row.removed ? 'var(--color-up)' : 'var(--color-down)'} fillOpacity={0.1} stroke={row.removed ? 'var(--color-up)' : 'var(--color-down)'} strokeWidth={1.5} />
                    <text x={22} y={y + 22} style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-ink)' }}>
                      {row.risk}
                    </text>
                    <text x={22} y={y + 38} style={{ fontSize: 9, fontWeight: 700, fill: row.removed ? 'var(--color-up)' : 'var(--color-down)' }}>
                      {row.removed ? '✓ removed by diversifying' : '✕ not removed'}
                    </text>
                    <text x={22} y={y + 52} style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                      {row.note}
                    </text>
                  </g>
                );
              })}
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Case A, a single concentrated holding, next to case B, twenty diversified holdings, under a single company failure and then a market-wide fall">
            {/* Case A: single block */}
            <g>
              <text x={44} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Case A
              </text>
              <rect
                x={14}
                y={22}
                width={60}
                height={60}
                rx={6}
                fill={scene >= 2 && !marketCrash ? 'var(--color-down)' : marketCrash ? 'var(--color-down)' : 'var(--color-accent)'}
                fillOpacity={marketCrash ? 0.5 : scene >= 2 ? 0.5 : 0.85}
                stroke="var(--color-line)"
                strokeWidth={1}
                style={{ transition: 'all 500ms ease-out' }}
              />
              <text x={44} y={56} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                {marketCrash ? '−30%' : scene >= 2 ? '−100%' : '₹10L'}
              </text>
            </g>

            {/* Case B: 20-cell grid */}
            <g>
              <text x={GRID_X + 34} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Case B
              </text>
              {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
                const col = i % GRID_COLS;
                const row = Math.floor(i / GRID_COLS);
                const isFailed = i === failedIndex;
                return (
                  <rect
                    key={i}
                    x={GRID_X + col * (CELL + 2)}
                    y={GRID_Y + row * (CELL + 2)}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={isFailed ? 'var(--color-down)' : 'var(--color-accent)'}
                    fillOpacity={marketCrash ? 0.5 : isFailed ? 0.9 : 0.85}
                    style={{ transition: 'all 500ms ease-out' }}
                  />
                );
              })}
              <text x={GRID_X + 34} y={GRID_Y + GRID_ROWS * (CELL + 2) + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                {marketCrash ? '−30%' : scene >= 2 ? '−5%' : '20 × ₹50k'}
              </text>
            </g>

            {marketCrash && (
              <text x={100} y={186} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 600 }}>
                same fall, both cases
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
