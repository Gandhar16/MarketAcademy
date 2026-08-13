'use client';

/**
 * ThreeStatementsExplainer — "profit, what you own and owe, and cash are
 * three different questions with three different answers", as a short
 * animated walkthrough. Figures match the worked example in the same
 * lesson (₹800cr sales, ₹100cr profit, ₹120cr uncollected). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'A company sells ₹800cr of goods, costing ₹560cr to make, plus ₹140cr of other expenses.' },
  { id: 'pnl', caption: 'Profit and loss: ₹100cr of profit for the year.' },
  { id: 'balance', caption: 'Balance sheet: owns ₹900cr, owes ₹600cr — ₹300cr belongs to shareholders.' },
  { id: 'cash', caption: '₹120cr of that reported profit is still sitting with customers, uncollected.' },
  { id: 'which-first', caption: 'If the three ever seem to disagree, check cash flow first — profit involves judgement calls, cash flow is closest to a bank statement, and it is the hardest of the three to dress up.' },
  { id: 'lesson', caption: '₹100cr of profit, but −₹20cr of actual cash. Same year, three different true answers.' },
];

export function ThreeStatementsExplainer() {
  return (
    <SceneExplainer
      title="Three statements, three different answers"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showPnl = scene >= 1;
        const showBalance = scene >= 2;
        const showCash = scene >= 3;
        const showFinal = scene === 5;
        const showCheckFirst = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three panels: profit and loss showing 100 crore profit, balance sheet showing 300 crore for shareholders, and cash flow showing negative 20 crore">
            <g style={{ transition: 'opacity 400ms ease-out', opacity: showPnl ? 1 : 0.4 }}>
              <rect x={8} y={14} width={58} height={44} rx={5} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1} />
              <text x={37} y={28} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                P&amp;L
              </text>
              <text x={37} y={44} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-up)', fontWeight: 700 }}>
                +₹100cr
              </text>
            </g>

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showBalance ? 1 : 0.15 }}>
              <rect x={71} y={14} width={58} height={44} rx={5} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1} />
              <text x={100} y={28} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                Balance
              </text>
              <text x={100} y={44} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-ink)', fontWeight: 700 }}>
                ₹300cr
              </text>
            </g>

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showCash ? 1 : 0.15 }}>
              <rect x={134} y={14} width={58} height={44} rx={5} fill="var(--color-surface-2)" stroke={showCheckFirst ? 'var(--color-down)' : 'var(--color-line)'} strokeWidth={showCheckFirst ? 2 : 1} />
              <text x={163} y={28} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                Cash flow
              </text>
              <text x={163} y={44} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-down)', fontWeight: 700 }}>
                −₹20cr
              </text>
            </g>

            {showCash && !showCheckFirst && (
              <text x={100} y={80} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                ₹120cr of profit still owed by customers
              </text>
            )}

            {showCheckFirst && (
              <text x={163} y={80} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 700, fill: 'var(--color-down)' }}>
                check this one first
              </text>
            )}

            {showFinal && (
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                Same year. Three true, different answers.
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
