'use client';

/**
 * MoatCompoundExplainer — "a moat's entire economic value shows up in
 * whether the margin holds, not in how fast revenue grows", as a short
 * animated walkthrough. Figures match the worked example in the same
 * lesson (identical revenue growth, margin 20% flat vs. fading to 12%).
 * See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Two companies, both starting at ₹1,000cr revenue, both growing 10% a year for ten years.' },
  { id: 'a-holds', caption: "Company A holds its 20% margin the whole time — competitors cannot erode it." },
  { id: 'b-fades', caption: "Company B's margin fades from 20% to 12% as competitors copy its edge." },
  { id: 'year10', caption: 'Year 10: Company A earns ₹519cr profit. Company B earns ₹311cr — on identical revenue.' },
  { id: 'ratio', caption: '₹519cr ÷ ₹311cr ≈ 1.67 — Company A earns about two-thirds more profit than Company B, purely from a margin that never gave any ground.' },
  { id: 'lesson', caption: 'Growth was identical for both. The moat is entirely about whether the margin holds.' },
];

const BASE_Y = 178;

export function MoatCompoundExplainer() {
  return (
    <SceneExplainer
      title="What a moat is actually worth"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showA = scene >= 1;
        const showB = scene >= 2;
        const showProfit = scene >= 3;

        const aProfitH = showProfit ? 519 * 0.25 : 0;
        const bProfitH = showProfit ? 311 * 0.25 : 0;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two companies with identical revenue growth but diverging margins, ending with very different year-10 profit">
            <g style={{ transition: 'opacity 400ms ease-out', opacity: showA ? 1 : 0.4 }}>
              <text x={55} y={14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Company A
              </text>
              <path d="M 25 40 L 85 40" stroke="var(--color-up)" strokeWidth={3} />
              <text x={55} y={54} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-up)' }}>
                20% margin, flat
              </text>
            </g>

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showB ? 1 : 0.15 }}>
              <text x={145} y={14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Company B
              </text>
              <path d="M 115 38 L 175 52" stroke="var(--color-down)" strokeWidth={3} />
              <text x={145} y={64} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)' }}>
                20% → 12%, fading
              </text>
            </g>

            {showProfit && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={15} y1={BASE_Y} x2={190} y2={BASE_Y} stroke="var(--color-line)" strokeWidth={1} />
                <rect x={40} y={BASE_Y - aProfitH} width={40} height={aProfitH} rx={4} fill="var(--color-up)" style={{ transition: 'all 500ms ease-out' }} />
                <text x={60} y={BASE_Y - aProfitH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                  ₹519cr
                </text>
                <rect x={120} y={BASE_Y - bProfitH} width={40} height={bProfitH} rx={4} fill="var(--color-down)" style={{ transition: 'all 500ms ease-out' }} />
                <text x={140} y={BASE_Y - bProfitH - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                  ₹311cr
                </text>
              </g>
            )}

            {scene === 4 && (
              <text x={100} y={40} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-up)' }}>
                1.67×
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
