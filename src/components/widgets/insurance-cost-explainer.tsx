'use client';

/**
 * InsuranceCostExplainer — "ten years of protection costs ₹4,80,000 and
 * one serious crash returns ₹1,50,000 — you need roughly three of them a
 * decade to break even", as a short animated walkthrough. Figures match
 * the worked example in the same lesson (₹10,00,000 holding, 1.2% a
 * quarter, a 25% crash with a 10% strike). See `scene-explainer.tsx` for
 * the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: '₹10,00,000 held. Protection costs 1.2% a quarter, renewed four times a year.' },
  { id: 'annual', caption: 'That is 4.8% a year — ₹48,000 — paid whether or not a fall ever arrives.' },
  { id: 'decade', caption: 'Over ten years: ₹4,80,000 spent on protection, ignoring compounding.' },
  { id: 'payout', caption: 'One 25% crash, with a 10% strike, pays out about ₹1,50,000.' },
  { id: 'historical', caption: 'A 25%+ broad-market crash has historically arrived far less often than three times a decade — which is exactly why sellers of this protection can offer it and still expect to profit, on average, over time.' },
  { id: 'lesson', caption: 'Roughly three such crashes a decade needed just to break even on the cost.' },
];

export function InsuranceCostExplainer() {
  return (
    <SceneExplainer
      title="What a decade of protection actually costs"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const showAnnual = scene >= 1;
        const showDecade = scene >= 2;
        const showPayout = scene >= 3;

        const costH = showDecade ? 130 : showAnnual ? 26 : 8;
        const payoutH = 41; // scaled roughly relative to costH at decade scale (150k vs 480k)

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A ten-year timeline with only one or two genuine 25 percent crash markers, showing why sellers of this protection can profit on average">
              <line x1={16} y1={100} x2={184} y2={100} stroke="var(--color-line)" strokeWidth={2} />
              {Array.from({ length: 10 }, (_, i) => (
                <line key={i} x1={16 + i * 18.7} y1={94} x2={16 + i * 18.7} y2={106} stroke="var(--color-line)" strokeWidth={1} />
              ))}
              <circle cx={16 + 3 * 18.7} cy={100} r={5} fill="var(--color-down)" />
              <circle cx={16 + 8 * 18.7} cy={100} r={5} fill="var(--color-down)" />
              <text x={100} y={80} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                genuine crashes: rare
              </text>
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                fewer than 3 in most decades
              </text>
              <text x={100} y={150} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                which is why sellers can profit on average
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The cost of ten years of protection at 480,000 rupees compared against the payout of one crash at 150,000 rupees">
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={40} y={baseY - costH} width={50} height={costH} rx={4} fill="var(--color-down)" fillOpacity={0.65} style={{ transition: 'all 500ms ease-out' }} />
            <text x={65} y={baseY - costH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {showDecade ? '₹4,80,000' : showAnnual ? '₹48,000 / yr' : '1.2% / qtr'}
            </text>
            <text x={65} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>cost of protection</text>

            {showPayout && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={120} y={baseY - payoutH} width={50} height={payoutH} rx={4} fill="var(--color-up)" fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
                <text x={145} y={baseY - payoutH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹1,50,000</text>
                <text x={145} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>one crash, paid out</text>
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                need ≈3 crashes a decade to break even
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
