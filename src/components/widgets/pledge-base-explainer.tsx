'use client';

/**
 * PledgeBaseExplainer — "the same pledged shares produce different
 * percentages depending on which base you measure against — always check
 * the denominator", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (1.56cr pledged, out of 5.2cr promoter
 * holding, out of 8cr total shares). See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Promoters hold 5.2cr of 8cr total shares. Of that holding, 1.56cr shares are pledged.' },
  { id: 'whole', caption: 'As a share of the WHOLE company: 1.56 ÷ 8 = 19.5%.' },
  { id: 'own', caption: "As a share of the promoters' OWN holding: 1.56 ÷ 5.2 = 30%." },
  { id: 'both', caption: 'Same 1.56cr shares, same disclosure — two very different-sounding numbers.' },
  { id: 'trend', caption: 'More informative than either single number: is that percentage rising or falling quarter after quarter? Pledging climbing steadily is a far stronger signal than any one snapshot.' },
  { id: 'lesson', caption: 'Headlines usually quote the bigger one. Always check which base a stated percentage is measured against.' },
];

export function PledgeBaseExplainer() {
  return (
    <SceneExplainer
      title="Same shares, two different percentages"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showWhole = scene === 1 || (scene >= 3 && scene !== 4);
        const showOwn = scene === 2 || (scene >= 3 && scene !== 4);
        const emphasizeOwn = scene >= 3;

        if (scene === 4) {
          const QTRS = [18, 21, 26, 30];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Pledging as a percentage of the promoter holding, rising steadily over four quarters from 18 to 30 percent">
              {QTRS.map((v, i) => (
                <g key={i}>
                  <rect x={20 + i * 42} y={170 - v * 4} width={30} height={v * 4} rx={4} fill="var(--color-down)" fillOpacity={0.3 + i * 0.15} />
                  <text x={35 + i * 42} y={170 - v * 4 - 6} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                    {v}%
                  </text>
                  <text x={35 + i * 42} y={184} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                    Q{i + 1}
                  </text>
                </g>
              ))}
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                climbing steadily — the real signal
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="1.56 crore pledged shares expressed as 19.5 percent of the whole company and as 30 percent of the promoters' own holding">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              1.56cr shares pledged
            </text>

            {showWhole && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={20} y={30} width={80} height={140} rx={6} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
                <rect x={20} y={30 + 140 * (1 - 0.195)} width={80} height={140 * 0.195} fill="var(--color-down)" fillOpacity={0.6} />
                <text x={60} y={186} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                  19.5% of company
                </text>
              </g>
            )}

            {showOwn && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={110} y={30} width={70} height={140} rx={6} fill="var(--color-surface-2)" stroke={emphasizeOwn ? 'var(--color-accent)' : 'var(--color-line)'} strokeWidth={emphasizeOwn ? 2 : 1.5} />
                <rect x={110} y={30 + 140 * (1 - 0.3)} width={70} height={140 * 0.3} fill="var(--color-down)" fillOpacity={0.6} />
                <text x={145} y={186} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                  30% of holding
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
