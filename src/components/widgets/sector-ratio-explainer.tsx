'use client';

/**
 * SectorRatioExplainer — "the same ratio measures the industry, not the
 * quality, unless the businesses are the same shape", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (bank
 * ₹9,000cr, software ₹50cr, cement ₹2,200cr of debt, all earning ₹100cr).
 * See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Three companies, each earning ₹100cr: a bank, a software firm, a cement maker.' },
  { id: 'debt', caption: 'A low-debt screen checks what each one owes.' },
  { id: 'result', caption: 'Software passes easily. The bank and the cement maker both fail — by a lot.' },
  { id: 'reason', caption: "But debt is the bank's business — deposits it lends out, not a warning sign." },
  { id: 'fix', caption: 'The fix is simple: compare a bank only to other banks, software only to other software firms. A ratio only means something next to businesses shaped the same way.' },
  { id: 'lesson', caption: 'The screen never measured health. It measured which industry each company is in.' },
];

const COMPANIES = [
  { label: 'Bank', debt: 9000, colour: 'var(--color-down)' },
  { label: 'Software', debt: 50, colour: 'var(--color-up)' },
  { label: 'Cement', debt: 2200, colour: 'var(--color-down)' },
];

const BASE_Y = 178;
const MAX_H = 140;

export function SectorRatioExplainer() {
  return (
    <SceneExplainer
      title="What a debt ratio actually measures"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showDebt = scene >= 1;
        const showResult = scene >= 2;
        const showBankNote = scene === 3 || scene === 5;
        const showFix = scene === 4;

        if (showFix) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three separate compartments, one per industry, showing each company is only ever compared against peers in its own compartment">
              {COMPANIES.map((c, i) => {
                const x = 20 + i * 58;
                return (
                  <g key={c.label}>
                    <rect x={x} y={30} width={44} height={90} rx={8} fill="none" stroke={c.colour} strokeWidth={1.5} strokeDasharray="3 2" />
                    <circle cx={x + 22} cy={75} r={10} fill={c.colour} fillOpacity={0.7} />
                    <text x={x + 22} y={132} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                      {c.label} peers only
                    </text>
                  </g>
                );
              })}
              <text x={100} y={168} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                never compare across compartments
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three bars showing wildly different debt levels for a bank, a software firm, and a cement maker, all healthy businesses">
            <line x1={15} y1={BASE_Y} x2={190} y2={BASE_Y} stroke="var(--color-line)" strokeWidth={1} />

            {COMPANIES.map((c, i) => {
              const h = showDebt ? Math.max(4, (Math.log(c.debt + 1) / Math.log(9001)) * MAX_H) : 0;
              const x = 30 + i * 58;
              const failed = showResult && c.debt > 1000;
              return (
                <g key={c.label} style={{ transition: 'opacity 400ms ease-out' }} opacity={showBankNote && c.label !== 'Bank' ? 0.4 : 1}>
                  <rect
                    x={x}
                    y={BASE_Y - h}
                    width={34}
                    height={h}
                    rx={4}
                    fill={failed ? 'var(--color-down)' : 'var(--color-up)'}
                    fillOpacity={0.8}
                    style={{ transition: 'height 500ms ease-out, y 500ms ease-out' }}
                  />
                  <text x={x + 17} y={BASE_Y + 14} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                    {c.label}
                  </text>
                  {showDebt && (
                    <text x={x + 17} y={BASE_Y - h - 6} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)', fontWeight: 600 }}>
                      ₹{c.debt}cr
                    </text>
                  )}
                </g>
              );
            })}

            {showBankNote && (
              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink)', fontWeight: 600 }}>
                debt is the bank&rsquo;s raw material
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
