'use client';

/**
 * SettlementExplainer — "a trade is a promise, settlement is when it's
 * kept", as a short animated walkthrough. See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'trade', caption: 'Monday, 10 a.m.: you buy 100 shares. The trade is agreed and binding right away.' },
  { id: 'money', caption: 'Your money is committed immediately — it leaves your side today.' },
  { id: 'claim', caption: 'But the shares have not arrived yet. Until settlement, you hold a claim, not shares.' },
  { id: 'settle', caption: 'Tuesday: settlement day. The shares are finally credited to your account.' },
  { id: 'weekend', caption: 'It is always one working day — trade on Friday and you settle on Monday, because weekends do not count.' },
];

export function SettlementExplainer() {
  return (
    <SceneExplainer
      title="Trading day vs. settlement day"
      scenes={SCENES}
      renderVisual={(scene) => {
        const moneyLeft = scene >= 1;
        const claimShown = scene >= 2;
        const settled = scene >= 3;
        const isWeekend = scene === 4;

        if (isWeekend) {
          // A dedicated day-strip for the weekend case, rather than reusing
          // the Monday/Tuesday boxes above — "one working day" only becomes
          // concrete once you can see Saturday and Sunday sitting there,
          // greyed out and skipped, between the trade and the settlement.
          const DAYS = ['FRI', 'SAT', 'SUN', 'MON'];
          const DAY_W = 42;
          const START_X = 8;
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A strip of four days — Friday, Saturday, Sunday, Monday — showing that settlement still lands one working day later, skipping the weekend">
              <text x={100} y={22} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
                Trade on a Friday
              </text>
              {DAYS.map((d, i) => {
                const x = START_X + i * DAY_W;
                const isWeekendDay = d === 'SAT' || d === 'SUN';
                const isTrade = d === 'FRI';
                const isSettle = d === 'MON';
                return (
                  <g key={d}>
                    <rect
                      x={x}
                      y={40}
                      width={DAY_W - 6}
                      height={40}
                      rx={6}
                      fill={isSettle ? 'var(--color-up)' : isWeekendDay ? 'var(--color-surface-2)' : 'var(--color-surface-2)'}
                      fillOpacity={isSettle ? 0.15 : isWeekendDay ? 0.4 : 1}
                      stroke={isSettle ? 'var(--color-up)' : isTrade ? 'var(--color-ink-faint)' : 'var(--color-line)'}
                      strokeWidth={1.5}
                      strokeDasharray={isWeekendDay ? '3 3' : 'none'}
                    />
                    <text
                      x={x + (DAY_W - 6) / 2}
                      y={64}
                      textAnchor="middle"
                      style={{ fontSize: 9, fontWeight: isTrade || isSettle ? 700 : 400, fill: isWeekendDay ? 'var(--color-ink-faint)' : 'var(--color-ink)' }}
                    >
                      {d}
                    </text>
                    {isWeekendDay && (
                      <text x={x + (DAY_W - 6) / 2} y={98} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--color-ink-faint)' }}>
                        ✕
                      </text>
                    )}
                  </g>
                );
              })}
              <line x1={30} y1={116} x2={170} y2={116} stroke="var(--color-line-strong)" strokeWidth={1.5} markerEnd="url(#weekend-arrow)" />
              <defs>
                <marker id="weekend-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="var(--color-line-strong)" />
                </marker>
              </defs>
              <text x={100} y={140} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                Still exactly 1 working day
              </text>
              <text x={100} y={156} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                weekends never count
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A diagram showing your money leaving on trade day and shares arriving on settlement day">
            {/* trade day box */}
            <g style={{ transition: 'opacity 400ms ease-out', opacity: scene === 0 ? 1 : 0.6 }}>
              <rect x={8} y={16} width={64} height={40} rx={8} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <text x={40} y={32} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                Monday
              </text>
              <text x={40} y={46} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                trade
              </text>
            </g>

            {/* settlement day box */}
            <g style={{ transition: 'opacity 400ms ease-out', opacity: settled ? 1 : 0.4 }}>
              <rect
                x={128}
                y={16}
                width={64}
                height={40}
                rx={8}
                fill={settled ? 'var(--color-up)' : 'var(--color-surface-2)'}
                fillOpacity={settled ? 0.15 : 1}
                stroke={settled ? 'var(--color-up)' : 'var(--color-line)'}
                strokeWidth={1.5}
              />
              <text x={160} y={32} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                Tuesday
              </text>
              <text x={160} y={46} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                settles
              </text>
            </g>

            <line x1={76} y1={36} x2={124} y2={36} stroke="var(--color-line-strong)" strokeWidth={1.5} markerEnd="url(#settle-arrow)" />
            <defs>
              <marker id="settle-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--color-line-strong)" />
              </marker>
            </defs>

            {/* money leaving, from below trade-day box */}
            <g style={{ transition: 'opacity 400ms ease-out, transform 500ms ease-out', opacity: moneyLeft ? 1 : 0, transform: moneyLeft ? 'translateY(0)' : 'translateY(-8px)' }}>
              <text x={40} y={78} textAnchor="middle" style={{ fontSize: 16 }}>
                ₹
              </text>
              <text x={40} y={92} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)' }}>
                blocked now
              </text>
            </g>

            {/* the claim / shares box, in the middle, below */}
            <g style={{ transition: 'opacity 400ms ease-out', opacity: claimShown ? 1 : 0 }}>
              <rect
                x={68}
                y={130}
                width={64}
                height={40}
                rx={8}
                fill={settled ? 'var(--color-accent)' : 'none'}
                fillOpacity={settled ? 0.15 : 1}
                stroke={settled ? 'var(--color-accent)' : 'var(--color-ink-faint)'}
                strokeWidth={1.5}
                strokeDasharray={settled ? 'none' : '4 3'}
              />
              <text x={100} y={148} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                {settled ? '100 shares' : 'a claim'}
              </text>
              <text x={100} y={162} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                {settled ? 'in your account' : 'not yet yours'}
              </text>
            </g>
          </svg>
        );
      }}
    />
  );
}
