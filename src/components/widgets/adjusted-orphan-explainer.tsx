'use client';

/**
 * AdjustedOrphanExplainer — "the value is intact and the exit is not —
 * volume moves to the standard series and your contract becomes an
 * orphan", as a short animated walkthrough. Figures match the worked
 * example in the same lesson (a ₹2,400 strike, lot 250, adjusted to
 * ₹1,200 and lot 500 after a 2-for-1 split). See `scene-explainer.tsx` for
 * the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'before', caption: 'You hold a ₹2,400 strike call, lot 250 — a standard, actively traded contract.' },
  { id: 'split', caption: 'A 2-for-1 split is announced. The exchange rewrites the contract to keep it whole.' },
  { id: 'adjusted', caption: 'New terms: strike ₹1,200, lot 500. The value controlled is exactly preserved.' },
  { id: 'standard', caption: 'But the market has moved on to NEW standard strikes at the new price level, like ₹1,250.' },
  { id: 'timing', caption: 'Corporate actions are announced with a public record date well in advance. Trading out of a standard, liquid contract before that date is easy — trading out of the orphaned one after is not.' },
  { id: 'lesson', caption: 'Your ₹1,200 strike sits on no standard row. Value intact, liquidity gone.' },
];

export function AdjustedOrphanExplainer() {
  return (
    <SceneExplainer
      title="Preserved in value, orphaned from the market"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showAdjusted = scene >= 2 && scene !== 4;
        const showStandard = scene >= 3 && scene !== 4;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A timeline with the record date announced in advance, and a window before it where closing the contract is still easy">
              <line x1={20} y1={100} x2={180} y2={100} stroke="var(--color-line)" strokeWidth={2} />
              <rect x={20} y={90} width={90} height={20} rx={4} fill="var(--color-up)" fillOpacity={0.2} />
              <text x={65} y={80} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 700, fill: 'var(--color-up)' }}>
                easy to close here
              </text>
              <circle cx={130} cy={100} r={5} fill="var(--color-down)" />
              <text x={130} y={124} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 700, fill: 'var(--color-down)' }}>
                record date
              </text>
              <text x={100} y={160} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                announced well in advance
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A 2400 rupee strike adjusted to 1200 after a split, sitting apart from the new standard strikes the rest of the market trades">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {showAdjusted ? 'After the split' : 'Before the split'}
            </text>

            {!showAdjusted && (
              <g>
                <rect x={70} y={80} width={60} height={40} rx={5} fill="var(--color-accent)" fillOpacity={0.7} />
                <text x={100} y={104} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹2,400 · lot 250</text>
              </g>
            )}

            {showAdjusted && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={30} y={80} width={60} height={40} rx={5} fill={showStandard ? 'var(--color-ink-faint)' : 'var(--color-accent)'} fillOpacity={0.6} style={{ transition: 'all 500ms ease-out' }} />
                <text x={60} y={104} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)', fontWeight: 700 }}>₹1,200</text>
                <text x={60} y={130} textAnchor="middle" style={{ fontSize: 6, fill: 'var(--color-ink-faint)' }}>your contract</text>

                {showStandard && (
                  <g style={{ transition: 'opacity 400ms ease-out' }}>
                    <rect x={110} y={80} width={60} height={40} rx={5} fill="var(--color-accent)" fillOpacity={0.85} stroke="var(--color-accent)" strokeWidth={1.5} />
                    <text x={140} y={104} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)', fontWeight: 700 }}>₹1,250</text>
                    <text x={140} y={130} textAnchor="middle" style={{ fontSize: 6, fill: 'var(--color-ink-faint)' }}>everyone else</text>
                  </g>
                )}
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                value preserved, buyer gone
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
