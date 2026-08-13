'use client';

/**
 * LookaheadBiasExplainer — "you cannot act on the close at the close — the
 * fix is to act on the NEXT bar, which is exactly what a lookahead-safe
 * replay engine does", as a short animated walkthrough. Figures match the
 * opening predict in the same lesson (a rule reading "buy at today's
 * close" once it crosses the 20-day average). See `scene-explainer.tsx`
 * for the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'rule', caption: '"Buy when today closes above the 20-day average, at today\'s close."' },
  { id: 'problem', caption: 'By the time the close is known, the session is already over.' },
  { id: 'impossible', caption: 'You cannot place an order at a price that has already stopped existing.' },
  { id: 'fix', caption: 'The honest fix: act on the NEXT bar — tomorrow\'s open, which can gap.' },
  { id: 'honest', caption: 'That gap is not a bug in the backtest — it is the real cost of not knowing the close until it happens. A lookahead-safe engine keeps that cost in, which is exactly why its numbers look worse, and are trustworthy.' },
  { id: 'lesson', caption: 'Every backtest that skips this step is quietly trading a price nobody could have gotten.' },
];

export function LookaheadBiasExplainer() {
  return (
    <SceneExplainer
      title="You cannot buy a price after it has closed"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showProblem = scene >= 1 && scene !== 4;
        const showFix = scene >= 3 && scene !== 4;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Tomorrow's open landing away from today's close, the real cost a lookahead-safe backtest deliberately keeps in its numbers">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Kept in, not hidden
              </text>
              <line x1={20} y1={70} x2={180} y2={70} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="2 2" />
              <text x={16} y={73} textAnchor="end" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                close
              </text>
              <circle cx={60} cy={70} r={4} fill="var(--color-ink-faint)" />
              <circle cx={140} cy={110} r={4} fill="var(--color-down)" />
              <line x1={60} y1={70} x2={140} y2={110} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
              <text x={140} y={128} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                real gap, real cost
              </text>
              <text x={100} y={170} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                worse numbers, trustworthy ones
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A trading day bar with an attempted order at the close, crossed out, and the honest fix placed on the next bar's open">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Today
            </text>
            <rect x={30} y={60} width={50} height={90} rx={4} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
            <text x={55} y={30} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>bar closes</text>

            {showProblem && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={30} y1={60} x2={80} y2={150} stroke="var(--color-down)" strokeWidth={2} />
                <line x1={80} y1={60} x2={30} y2={150} stroke="var(--color-down)" strokeWidth={2} />
                <text x={55} y={166} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>too late</text>
              </g>
            )}

            {showFix && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={140} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>Tomorrow</text>
                <rect x={115} y={60} width={50} height={90} rx={4} fill="var(--color-surface-2)" stroke="var(--color-up)" strokeWidth={2} />
                <circle cx={140} cy={60} r={5} fill="var(--color-up)" />
                <text x={140} y={166} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-up)', fontWeight: 700 }}>fill here</text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
