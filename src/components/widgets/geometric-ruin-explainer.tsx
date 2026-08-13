'use client';

/**
 * GeometricRuinExplainer — "the edge is real, and it does not save you —
 * losses compound geometrically, so a 20% bet size ruins a genuinely
 * winning system more than half the time", as a short animated
 * walkthrough. Figures match the opening predict in the same lesson (a
 * 55%-at-1:1 edge, sized at 20% of the account, over an ordinary losing
 * streak). See `scene-explainer.tsx` for the shared chrome and why this is
 * a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'A 55%-at-1:1 edge — genuinely positive. You bet 20% of the account each time.' },
  { id: 'streak', caption: 'Six or seven losses in a row across 200 trades is completely ordinary at 55%.' },
  { id: 'shrink', caption: 'Each 20% loss shrinks a smaller account. The bet size never adjusts back up.' },
  { id: 'hole', caption: 'After six losses, the account is down to about a quarter of where it started.' },
  { id: 'recover', caption: 'To get back to the starting line from 26.2%, the account now needs to grow by about 280% — not the 20% it lost on any single trade. The hole gets proportionally deeper every time it is dug.' },
  { id: 'lesson', caption: 'A 50% fall needs a 100% gain to recover. The edge is real — the arithmetic still wins.' },
];

export function GeometricRuinExplainer() {
  return (
    <SceneExplainer
      title="A real edge, and a losing streak it cannot outrun"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const maxH = 140;
        // account value after successive 20% losses, starting at 100
        const values = [100, 100, 80, 51.2, 26.2];
        const idx = Math.min(scene, 4);
        const v = values[idx];
        const h = (v / 100) * maxH;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="An account at 26.2 percent of starting capital needing about 280 percent growth to recover, compared to the 20 percent it lost per trade">
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
                From 26.2% back to 100%
              </text>
              <text x={100} y={90} textAnchor="middle" style={{ fontSize: 30, fontWeight: 700, fill: 'var(--color-down)' }}>
                +280%
              </text>
              <text x={100} y={112} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                needed just to get back to even
              </text>
              <line x1={30} y1={140} x2={170} y2={140} stroke="var(--color-line)" strokeWidth={1} />
              <text x={100} y={162} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                vs. 20% lost, per losing trade
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="An account shrinking through repeated 20 percent losses during an ordinary losing streak, despite a genuinely positive edge">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Account value, 20% bets
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={80} y={baseY - h} width={44} height={h} rx={4} fill={idx >= 3 ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
            <text x={102} y={baseY - h - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {v.toFixed(1)}%
            </text>
            <text x={102} y={186} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              of starting capital
            </text>

            {scene >= 4 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                needs a 280% gain to recover
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
