'use client';

/**
 * InterestCoverageExplainer — "interest coverage moves with profit, so it
 * warns you before debt-to-equity ever does", as a short animated
 * walkthrough. Figures match the worked example in the same lesson
 * (coverage falling from 2.0x to 1.33x while debt-to-equity stays at 2.0).
 * See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'de', caption: 'Debt-to-equity: 2.0. Looks worrying, on its own.' },
  { id: 'coverage', caption: 'But interest coverage — operating profit ÷ interest expense — is what tells you if that debt is dangerous right now: 2.0x.' },
  { id: 'profit-falls', caption: 'A year later, operating profit falls by a third.' },
  { id: 'coverage-falls', caption: 'Interest coverage drops to 1.33x — covering interest, but with far less room.' },
  { id: 'covenant', caption: 'Many loan agreements set a minimum coverage ratio, often around 1.5x. Cross below it and the lender can act — demand repayment, restrict dividends — even while debt-to-equity still reads exactly the same.' },
  { id: 'lesson', caption: 'Debt-to-equity has not moved at all — still 2.0. Interest coverage warns you first, because it tracks profit, not the balance sheet.' },
];

export function InterestCoverageExplainer() {
  return (
    <SceneExplainer
      title="The ratio that warns you before the balance sheet does"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showCoverage = scene >= 1;
        const falling = scene >= 3;
        const coverageValue = falling ? 1.33 : 2.0;
        const coverageH = coverageValue * 40;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A static debt-to-equity gauge next to a shrinking interest-coverage bar, showing the coverage ratio warns first">
            <g>
              <text x={50} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Debt-to-equity
              </text>
              <text x={50} y={50} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-ink)' }}>
                2.0
              </text>
              <text x={50} y={64} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                unchanged
              </text>
            </g>

            <line x1={100} y1={10} x2={100} y2={185} stroke="var(--color-line)" strokeWidth={1} />

            {showCoverage && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={150} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  Interest coverage
                </text>
                <line x1={130} y1={178} x2={170} y2={178} stroke="var(--color-line)" strokeWidth={1} />
                <rect
                  x={135}
                  y={178 - coverageH}
                  width={30}
                  height={coverageH}
                  rx={4}
                  fill={falling ? 'var(--color-down)' : 'var(--color-accent)'}
                  style={{ transition: 'all 500ms ease-out' }}
                />
                <text x={150} y={178 - coverageH - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
                  {coverageValue.toFixed(2)}x
                </text>

                {scene === 4 && (
                  <g style={{ transition: 'opacity 400ms ease-out' }}>
                    <line x1={110} y1={178 - 1.5 * 40} x2={190} y2={178 - 1.5 * 40} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
                    <text x={188} y={178 - 1.5 * 40 - 4} textAnchor="end" style={{ fontSize: 6.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                      covenant ≈1.5x
                    </text>
                  </g>
                )}
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
