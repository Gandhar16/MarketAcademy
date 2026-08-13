'use client';

/**
 * ReceivablesTrendExplainer — "receivables growing faster than sales for
 * several years running is the warning sign, not any single year", as a
 * short animated walkthrough. Figures match the worked example in the same
 * lesson (73 → 103 → 146 days). See `scene-explainer.tsx` for the shared
 * chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'y1', caption: 'Year 1: sales ₹500cr, customers owe ₹100cr — 73 days of sales. Ordinary.' },
  { id: 'y2sales', caption: 'Year 2: sales grow 20%, to ₹600cr.' },
  { id: 'y2owed', caption: 'But money owed jumps 70%, to ₹170cr — now 103 days.' },
  { id: 'y3', caption: 'Year 3: 146 days. Customers now take nearly five months to pay.' },
  { id: 'mismatch', caption: 'Sales grew 20% that year. What customers owe grew 70% — more than three times faster. That mismatch is the real warning, not the raw day count.' },
  { id: 'lesson', caption: 'One bad year is noise. Three years climbing in a row is a trend that ends somewhere.' },
];

const YEARS = [
  { days: 73, label: 'Year 1' },
  { days: 103, label: 'Year 2' },
  { days: 146, label: 'Year 3' },
];

const BASE_Y = 178;

export function ReceivablesTrendExplainer() {
  return (
    <SceneExplainer
      title="Days of sales sitting uncollected"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showYear = [1, 2, 2, 3, 3, 3][scene]; // how many year-bars are visible
        const highlightAll = scene === 5;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two bars, sales growth of 20 percent and receivables growth of 70 percent, showing receivables growing more than three times faster">
              <rect x={40} y={150 - 20 * 1.6} width={44} height={20 * 1.6} rx={4} fill="var(--color-up)" />
              <text x={62} y={122} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                +20%
              </text>
              <text x={62} y={166} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                sales
              </text>

              <rect x={116} y={150 - 70 * 1.6} width={44} height={70 * 1.6} rx={4} fill="var(--color-down)" />
              <text x={138} y={30} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-down)' }}>
                +70%
              </text>
              <text x={138} y={166} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                receivables
              </text>

              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                over 3× faster
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A rising bar chart of days of sales left uncollected, climbing from 73 to 103 to 146 days over three years">
            <line x1={20} y1={BASE_Y} x2={190} y2={BASE_Y} stroke="var(--color-line)" strokeWidth={1} />

            {YEARS.map((y, i) => {
              const visible = i < showYear;
              const h = y.days * 0.75;
              const isLast = i === 2;
              return (
                <g key={y.label} style={{ transition: 'opacity 400ms ease-out' }} opacity={visible ? 1 : 0.12}>
                  <rect
                    x={40 + i * 55}
                    y={BASE_Y - (visible ? h : 0)}
                    width={36}
                    height={visible ? h : 0}
                    rx={4}
                    fill={highlightAll && isLast ? 'var(--color-down)' : 'var(--color-accent)'}
                    style={{ transition: 'height 500ms ease-out, y 500ms ease-out' }}
                  />
                  {visible && (
                    <text x={58 + i * 55} y={BASE_Y - h - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                      {y.days}d
                    </text>
                  )}
                  <text x={58 + i * 55} y={BASE_Y + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                    {y.label}
                  </text>
                </g>
              );
            })}
          </svg>
        );
      }}
    />
  );
}
