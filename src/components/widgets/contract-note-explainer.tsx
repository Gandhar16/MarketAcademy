'use client';

/**
 * ContractNoteExplainer — "the app is a summary your broker designed, the
 * contract note is the itemised legal record", as a short animated
 * walkthrough. See `scene-explainer.tsx` for the shared chrome and why this
 * is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'app', caption: "Your broker's app shows a tidy summary: bought 100 shares, total ₹1,40,236." },
  { id: 'note', caption: 'The contract note is a different document — the itemised legal record, in four sections.' },
  { id: 'traded', caption: 'Section 1: what you traded — company, quantity, price, and delivery or intraday.' },
  { id: 'turnover', caption: 'Section 2: turnover — quantity times price, the base most charges are a percentage of.' },
  { id: 'charges', caption: 'Section 3: the charge lines — brokerage, then the statutory ones, then GST on some of them.' },
  { id: 'net', caption: 'Section 4: net amount — what actually left or entered your bank account.' },
  { id: 'check', caption: "The one-line habit worth keeping: if Section 4's net amount doesn't match what actually hit your bank account, that mismatch is your first sign something needs a closer look." },
];

const SECTIONS = [
  { id: 'traded', label: 'What you traded' },
  { id: 'turnover', label: 'Turnover' },
  { id: 'charges', label: 'The charge lines' },
  { id: 'net', label: 'Net amount' },
];

const SEC_Y_START = 20;
const SEC_H = 40;

export function ContractNoteExplainer() {
  return (
    <SceneExplainer
      title="What the app shows vs. what the note proves"
      scenes={SCENES}
      renderVisual={(scene) => {
        if (scene === 0) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A phone app showing a one-line trade summary">
              <rect x={30} y={20} width={140} height={160} rx={14} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <rect x={44} y={40} width={112} height={44} rx={8} fill="var(--color-accent)" fillOpacity={0.12} stroke="var(--color-accent)" strokeWidth={1.5} />
              <text x={100} y={58} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)' }}>
                Bought 100 shares
              </text>
              <text x={100} y={72} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
                ₹1,40,236
              </text>
              <text x={100} y={112} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                a summary the app designed
              </text>
            </svg>
          );
        }

        const activeSectionIndex = Math.min(scene - 2, 3); // scene 2 -> section 0, ... scene 5 and 6 -> section 3 (net amount)
        const showCheck = scene === 6;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A document with four sections: what you traded, turnover, the charge lines, and net amount">
            <rect x={24} y={8} width={152} height={184} rx={8} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
            {SECTIONS.map((sec, i) => {
              const y = SEC_Y_START + i * SEC_H;
              const isActive = i === activeSectionIndex;
              return (
                <g key={sec.id} style={{ transition: 'opacity 400ms ease-out' }}>
                  <rect
                    x={32}
                    y={y}
                    width={136}
                    height={SEC_H - 6}
                    rx={5}
                    fill={isActive ? 'var(--color-accent)' : 'transparent'}
                    fillOpacity={isActive ? 0.15 : 0}
                    stroke={isActive ? 'var(--color-accent)' : 'var(--color-line)'}
                    strokeWidth={isActive ? 1.5 : 1}
                  />
                  <text
                    x={40}
                    y={y + (SEC_H - 6) / 2 + 4}
                    style={{ fontSize: 8, fill: isActive ? 'var(--color-ink)' : 'var(--color-ink-faint)', fontWeight: isActive ? 600 : 400 }}
                  >
                    {i + 1}. {sec.label}
                  </text>
                </g>
              );
            })}

            {showCheck && (
              <g>
                <circle cx={176} cy={140} r={12} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1.5} />
                <text x={176} y={145} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--color-accent)' }}>
                  ?
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
