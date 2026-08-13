'use client';

/**
 * CappedShapeExplainer — "add a bought leg and the open end closes — the
 * position is the sum of its legs, at every price", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (a
 * sold 24,200 call capped by a bought 24,400 call, worst case about
 * −₹150). See `scene-explainer.tsx` for the shared chrome and why this is
 * a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'sold', caption: 'You sell a 24,200 call for ₹90. Above 24,200 the loss grows without limit.' },
  { id: 'far', caption: 'NIFTY runs to 26,000. On its own, this leg alone has lost a great deal.' },
  { id: 'add', caption: 'Now add a bought 24,400 call for ₹40 — the second leg of the position.' },
  { id: 'close', caption: 'Above 24,400 the two legs move together and cancel exactly, however far the index runs.' },
  { id: 'best-case', caption: 'The mirror question: what if NIFTY stays below 24,200 instead? Both legs expire worthless, and you simply keep the ₹50 net credit — the best case for this exact position.' },
  { id: 'lesson', caption: 'Worst case is now fixed at about −₹150, known before you enter — the trade-off for a small extra cost.' },
];

export function CappedShapeExplainer() {
  return (
    <SceneExplainer
      title="Add a leg, close the open end"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showFar = scene >= 1;
        const showAdd = scene >= 2;
        const showClose = scene === 3 || scene === 5;
        const showBestCase = scene === 4;
        const baseY = 60;
        const rightX = 180;

        // open (unlimited) loss line vs. capped loss line, both from the strike point
        const strikeX = 70;

        if (showBestCase) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="NIFTY staying below 24,200 at expiry, both legs expiring worthless, keeping the full net credit of 50 rupees">
              <line x1={16} y1={baseY} x2={190} y2={baseY} stroke="var(--color-up)" strokeWidth={2.5} />
              <text x={strikeX} y={baseY - 8} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                24,200
              </text>
              <circle cx={40} cy={baseY} r={4} fill="var(--color-up)" />
              <text x={40} y={baseY - 14} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-up)', fontWeight: 700 }}>
                NIFTY stays here
              </text>
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                best case: +₹50 kept
              </text>
              <text x={100} y={148} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                both legs expire worthless
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A sold call's loss line running open to the bottom right, then a bought call added above it closing that line into a fixed worst case">
            <line x1={16} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />
            <text x={strikeX} y={baseY - 8} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>24,200</text>

            <line
              x1={strikeX}
              y1={baseY}
              x2={showClose ? 110 : rightX}
              y2={showClose ? 150 : (showFar ? 180 : baseY + 10)}
              stroke="var(--color-down)"
              strokeWidth={2.5}
              style={{ transition: 'all 500ms ease-out' }}
            />

            {showClose && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={110} y1={150} x2={rightX} y2={150} stroke="var(--color-down)" strokeWidth={2.5} />
                <text x={110} y={162} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>24,400</text>
                <text x={150} y={140} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>flat: −₹150 max</text>
              </g>
            )}

            {showAdd && !showClose && (
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)', fontWeight: 700 }}>+ bought 24,400 call</text>
            )}

            {showFar && !showAdd && (
              <text x={150} y={190} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)' }}>loss keeps growing</text>
            )}
          </svg>
        );
      }}
    />
  );
}
