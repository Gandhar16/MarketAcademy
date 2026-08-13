'use client';

/**
 * IvCrushExplainer — "the share moved 3% and the position lost money,
 * because you paid for a move much larger than the one you got", as a
 * short animated walkthrough. Figures match the worked example in the same
 * lesson (a straddle bought before results, volatility 55 the evening
 * before collapsing to 22 the morning after). See `scene-explainer.tsx`
 * for the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'before', caption: 'The evening before results: volatility at 55. Both legs of the straddle are expensive.' },
  { id: 'event', caption: 'Results land. The share moves 3% — a real, ordinary move.' },
  { id: 'collapse', caption: 'Volatility collapses from 55 to 22 — the uncertainty that was priced in is now resolved.' },
  { id: 'after', caption: 'Both legs reprice downward at once, on top of the move being the wrong size for one of them.' },
  { id: 'bar', caption: 'To profit, the move needed to be large enough to beat both the cost paid AND the volatility collapse at once — a much higher bar than "the stock moved," and higher than most single-day moves ever clear.' },
  { id: 'lesson', caption: 'Right that something would happen. Wrong that it would be big enough to beat the volatility repricing.' },
];

export function IvCrushExplainer() {
  return (
    <SceneExplainer
      title="The move happened. The price of uncertainty still fell."
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const before = 108; // combined premium, before
        const after = 44; // combined premium, after
        const showAfter = scene >= 2 && scene !== 4;
        const h = showAfter ? after : before;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The actual 3 percent move falling well short of the larger move needed to overcome both the cost paid and the volatility collapse">
              <line x1={20} y1={150} x2={190} y2={150} stroke="var(--color-line)" strokeWidth={1} />
              <line x1={20} y1={60} x2={190} y2={60} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
              <text x={186} y={54} textAnchor="end" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                bar to clear
              </text>
              <rect x={80} y={120} width={40} height={30} rx={4} fill="var(--color-ink-faint)" />
              <text x={100} y={112} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                actual move
              </text>
              <text x={100} y={186} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                fell well short
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Combined straddle premium falling sharply once volatility collapses after results, even though the share moved">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {showAfter ? 'IV: 22' : 'IV: 55'}
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={80} y={baseY - h} width={44} height={h} rx={4} fill={showAfter ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.7} style={{ transition: 'all 600ms ease-out' }} />
            <text x={102} y={baseY - h - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {showAfter ? '≈ ₹64' : '≈ ₹154'}
            </text>
            <text x={102} y={186} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              call + put, combined
            </text>

            {scene === 1 && (
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)', fontWeight: 700 }}>share moves 3%</text>
            )}
            {scene >= 3 && (
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>position still loses</text>
            )}
          </svg>
        );
      }}
    />
  );
}
