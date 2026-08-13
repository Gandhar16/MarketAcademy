'use client';

/**
 * MarkToMarketExplainer — "a futures position settles every evening, not at
 * expiry, and a shortfall you cannot fund closes it before any recovery
 * arrives", as a short animated walkthrough. Figures match the worked
 * example in the same lesson (₹1,80,000 deposit, NIFTY futures lot of 75,
 * two down days then a recovery). See `scene-explainer.tsx` for the shared
 * chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'day1', caption: 'Day 1: ₹1,80,000 deposited. One NIFTY futures lot, 75 units, opened at 24,000.' },
  { id: 'day2', caption: 'Day 2: NIFTY falls 200 points. ₹15,000 debited from the deposit that evening.' },
  { id: 'day3', caption: 'Day 3: falls another 300 points. ₹22,500 more debited — deposit now ₹1,42,500.' },
  { id: 'shortfall', caption: 'If a top-up is not funded here, the broker closes the position — at whatever price is available.' },
  { id: 'day4', caption: 'Day 4: NIFTY recovers 400 points. Real money — but only for someone still holding the position.' },
  { id: 'compare', caption: "Two traders, same starting deposit. One found the top-up on day 3 and kept the position — they see the recovery. The other could not, was closed out, and the recovery happens to somebody else's account." },
];

export function MarkToMarketExplainer() {
  return (
    <SceneExplainer
      title="Settled every evening, not at expiry"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const barW = 26;
        // deposit levels across the 4 days: 180000, 165000, 142500, closed/recovering
        const levels = [180000, 165000, 142500, 142500, 180000 - 15000 - 22500 + 30000];
        const maxLevel = 180000;
        const scale = 120 / maxLevel;

        const barsToShow = Math.min(scene + 1, 4);

        if (scene === 5) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two paths diverging after day 3: a trader who topped up and sees the recovery, and a trader who was closed out and does not">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Same deposit, day 3 onward
              </text>
              <line x1={20} y1={70} x2={80} y2={70} stroke="var(--color-ink-faint)" strokeWidth={2} />
              <line x1={80} y1={70} x2={180} y2={30} stroke="var(--color-up)" strokeWidth={2.5} />
              <text x={182} y={30} style={{ fontSize: 7, fill: 'var(--color-up)', fontWeight: 700 }}>
                topped up
              </text>

              <line x1={80} y1={70} x2={180} y2={130} stroke="var(--color-down)" strokeWidth={2.5} strokeDasharray="3 2" />
              <text x={182} y={130} style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                closed out
              </text>

              <circle cx={80} cy={70} r={3.5} fill="var(--color-ink)" />
              <text x={80} y={90} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                day 3 shortfall
              </text>

              <text x={100} y={175} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                the recovery goes to one of them
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A deposit of 180,000 rupees debited across two down days, breaching a shortfall, then a fourth day recovering">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Deposit, evening by evening
            </text>
            <line x1={16} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            {Array.from({ length: barsToShow }, (_, i) => {
              const x = 24 + i * 40;
              const h = levels[i] * scale;
              const isBreach = i === 2 && scene >= 3;
              const isRecovery = i === 3 && scene >= 4;
              const displayH = isRecovery ? levels[4] * scale : h;
              const color = isBreach ? 'var(--color-down)' : isRecovery ? 'var(--color-up)' : i === 0 ? 'var(--color-ink-faint)' : 'var(--color-down)';
              return (
                <g key={i} style={{ transition: 'all 500ms ease-out' }}>
                  <rect x={x} y={baseY - displayH} width={barW} height={displayH} rx={3} fill={color} fillOpacity={0.7} />
                  <text x={x + barW / 2} y={baseY + 12} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                    Day {i + 1}
                  </text>
                </g>
              );
            })}

            {scene === 3 && (
              <line x1={16} y1={baseY - 75000 * scale} x2={190} y2={baseY - 75000 * scale} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
            )}
            {scene === 3 && (
              <text x={100} y={baseY - 75000 * scale - 6} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                required floor
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
