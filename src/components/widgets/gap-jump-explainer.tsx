'use client';

/**
 * GapJumpExplainer — "a perfectly executed plan produced 4.6 times the
 * intended loss, and every rule was followed", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (entry
 * ₹1,400, stop ₹1,352, a weekend gap opening the share at ₹1,180). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'plan', caption: 'Entry ₹1,400, stop at ₹1,352 — a planned 1% risk, sized correctly.' },
  { id: 'closed', caption: 'Over the weekend the market is closed. News arrives. Nothing can be done about it.' },
  { id: 'gap', caption: 'Monday opens at ₹1,180 — the price simply reopens there. The levels in between never traded.' },
  { id: 'fill', caption: 'The stop becomes active at the open and fills at ₹1,180 — not at ₹1,352.' },
  { id: 'known-event', caption: 'When the closed-market window contains a known event — results, a policy decision — the fix is decided in advance: reduce the position or close it before the close, because the stop simply cannot act while the market is shut.' },
  { id: 'lesson', caption: 'Planned loss: 1% of the account. Actual loss: 4.6%. Every rule was followed.' },
];

export function GapJumpExplainer() {
  return (
    <SceneExplainer
      title="The stop was never reached — the price just skipped it"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showClosed = scene >= 1 && scene !== 4;
        const showGap = scene >= 2 && scene !== 4;
        const entryY = 60;
        const stopY = 85;
        const openY = 140;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Reducing or closing a position before a known event, decided in advance, rather than relying on a stop that cannot act while the market is shut">
              <rect x={30} y={40} width={140} height={40} rx={8} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1.5} />
              <text x={100} y={64} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-accent)' }}>
                reduce or close before the close
              </text>
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                decided in advance
              </text>
              <text x={100} y={150} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                not left to the stop
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A stop set at 1352 rupees that the price jumps straight over, reopening at 1180 rupees after a weekend gap">
            <line x1={20} y1={entryY} x2={170} y2={entryY} stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="2 2" />
            <text x={20} y={entryY - 4} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>entry ₹1,400</text>

            <line x1={20} y1={stopY} x2={170} y2={stopY} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="3 2" />
            <text x={20} y={stopY - 4} style={{ fontSize: 7, fill: 'var(--color-accent)' }}>stop ₹1,352</text>

            {showClosed && (
              <text x={100} y={110} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)', fontWeight: 700 }}>
                market closed
              </text>
            )}

            {showGap && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={openY} x2={170} y2={openY} stroke="var(--color-down)" strokeWidth={2} />
                <text x={20} y={openY + 14} style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>opens ₹1,180</text>
                <line x1={95} y1={stopY} x2={95} y2={openY} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="2 2" />
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                planned 1% · actual 4.6%
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
