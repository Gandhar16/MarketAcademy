'use client';

/**
 * RoeRoceGapExplainer — "the gap between ROE and ROCE is exactly what debt
 * alone contributed to the headline number", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (₹40cr
 * profit / ₹200cr equity vs. ₹70cr operating profit / ₹500cr capital
 * employed). See `scene-explainer.tsx` for the shared chrome and why this
 * is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'roe-setup', caption: 'A company earns ₹40cr net profit on ₹200cr of shareholder equity.' },
  { id: 'roe', caption: 'Return on equity: 20%.' },
  { id: 'roce-setup', caption: 'It also carries ₹300cr of debt — ₹500cr of total capital employed, earning ₹70cr operating profit.' },
  { id: 'roce', caption: 'Return on capital employed: just 14%.' },
  { id: 'more-debt', caption: 'Add even more debt-funded buybacks and equity shrinks further — say to ₹100cr. ROE can rocket to 40% on the identical ₹40cr profit, while ROCE barely moves, because capital employed and operating profit have not changed at all.' },
  { id: 'lesson', caption: 'The 6-point gap is exactly what the debt alone added to the headline number.' },
];

const BASE_Y = 178;

export function RoeRoceGapExplainer() {
  return (
    <SceneExplainer
      title="What the gap between ROE and ROCE reveals"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showRoe = scene >= 1;
        const showRoce = scene >= 3;
        const showGap = scene === 4 || scene === 5;

        const roeH = (scene === 4 ? 40 : 20) * 5;
        const roceH = 14 * 5;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="ROE jumping to 40 percent from a debt-funded buyback while ROCE stays flat at 14 percent, showing the identical business underneath">
              <line x1={15} y1={BASE_Y} x2={190} y2={BASE_Y} stroke="var(--color-line)" strokeWidth={1} />
              <rect x={40} y={BASE_Y - 40 * 3.2} width={40} height={40 * 3.2} rx={4} fill="var(--color-down)" />
              <text x={60} y={BASE_Y - 40 * 3.2 - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-down)', fontWeight: 700 }}>
                40%
              </text>
              <text x={60} y={BASE_Y + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                ROE (smaller equity)
              </text>

              <rect x={120} y={BASE_Y - 14 * 5} width={40} height={14 * 5} rx={4} fill="var(--color-ink-faint)" />
              <text x={140} y={BASE_Y - 14 * 5 - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
                14%
              </text>
              <text x={140} y={BASE_Y + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                ROCE — unchanged
              </text>

              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 700, fill: 'var(--color-ink)' }}>
                identical business underneath
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A return-on-equity bar at 20 percent next to a lower return-on-capital-employed bar at 14 percent, with the gap between them highlighted as the effect of debt">
            <line x1={15} y1={BASE_Y} x2={190} y2={BASE_Y} stroke="var(--color-line)" strokeWidth={1} />

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showRoe ? 1 : 0.3 }}>
              <rect x={40} y={BASE_Y - roeH} width={40} height={roeH} rx={4} fill="var(--color-accent)" style={{ transition: 'all 500ms ease-out' }} />
              <text x={60} y={BASE_Y - roeH - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
                20%
              </text>
              <text x={60} y={BASE_Y + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                ROE
              </text>
            </g>

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showRoce ? 1 : 0.15 }}>
              <rect x={120} y={BASE_Y - roceH} width={40} height={roceH} rx={4} fill="var(--color-ink-faint)" style={{ transition: 'all 500ms ease-out' }} />
              <text x={140} y={BASE_Y - roceH - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
                14%
              </text>
              <text x={140} y={BASE_Y + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                ROCE
              </text>
            </g>

            {showGap && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={100} y1={BASE_Y - roeH} x2={100} y2={BASE_Y - roceH} stroke="var(--color-down)" strokeWidth={3} />
                <text x={100} y={BASE_Y - roeH - 18} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                  6 pts — from debt
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
