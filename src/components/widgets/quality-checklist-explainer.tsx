'use client';

/**
 * QualityChecklistExplainer — "none of these prove anything alone;
 * together, sustained over time, they are the real checklist", as a short
 * animated walkthrough. See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'cash', caption: 'Profit rising while operating cash flow stays flat — for more than a year or two.' },
  { id: 'receivables', caption: 'Receivable days rising — customers taking longer to pay.' },
  { id: 'related', caption: 'Related-party transactions, worth checking even when disclosed and legal.' },
  { id: 'auditor', caption: 'Frequent, unexplained auditor changes.' },
  { id: 'threshold', caption: 'A rough guide, not a rule: three or four of these showing up together, and persisting for more than a year or two, is worth a serious second look. One appearing once is usually nothing.' },
  { id: 'lesson', caption: 'None of these proves anything alone. Together, sustained over time, they are the real checklist.' },
];

const ITEMS = ['Profit vs. cash flow', 'Receivable days', 'Related-party deals', 'Auditor changes'];

export function QualityChecklistExplainer() {
  return (
    <SceneExplainer
      title="One signal is a question — four together are a pattern"
      scenes={SCENES}
      renderVisual={(scene) => {
        const litCount = Math.min(scene + 1, 4);
        const allLit = scene >= 4;
        const showThreshold = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Four checklist items lighting up one at a time, then connecting together as a combined pattern">
            {ITEMS.map((item, i) => {
              const lit = i < litCount;
              const y = 20 + i * 42;
              return (
                <g key={item} style={{ transition: 'opacity 400ms ease-out' }}>
                  <rect
                    x={20}
                    y={y}
                    width={160}
                    height={30}
                    rx={6}
                    fill={lit ? 'var(--color-accent)' : 'var(--color-surface-2)'}
                    fillOpacity={lit ? 0.18 : 1}
                    stroke={lit ? 'var(--color-accent)' : 'var(--color-line)'}
                    strokeWidth={1.5}
                  />
                  <text x={30} y={y + 19} style={{ fontSize: 8, fill: lit ? 'var(--color-ink)' : 'var(--color-ink-faint)', fontWeight: lit ? 600 : 400 }}>
                    {lit ? '✓ ' : '○ '}
                    {item}
                  </text>
                </g>
              );
            })}

            {allLit && !showThreshold && (
              <text x={100} y={196} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                together, sustained — worth a real question
              </text>
            )}

            {showThreshold && (
              <text x={100} y={196} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                3–4 together, 1–2 years+ — look closer
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
