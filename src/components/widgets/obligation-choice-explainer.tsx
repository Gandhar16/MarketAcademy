'use client';

/**
 * ObligationChoiceExplainer — "the question that splits the whole subject:
 * must you, or may you", as a short animated walkthrough. Figures match the
 * farmer/shop example in the same lesson (₹40 futures deal, obligatory both
 * ways) against the ₹2-premium option (a right, used only when helpful).
 * See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'future-setup', caption: 'A futures-style deal: sell rice at ₹40 in November. Both sides are committed today.' },
  { id: 'future-result', caption: 'Rice hits ₹55. The buyer still pays only ₹40 — the deal cannot be walked away from.' },
  { id: 'option-setup', caption: 'An option-style deal instead: pay ₹2 now for the RIGHT to sell at ₹40. No obligation to use it.' },
  { id: 'option-result', caption: 'Rice hits ₹55. The right is simply not used — sell at ₹55 in the open market instead.' },
  { id: 'mirror', caption: 'Now picture rice falling to ₹25 instead. The futures seller still gets exactly ₹40 either way — nothing changes for them. But the option holder is delighted: sell at ₹40 against a ₹25 market, a ₹15 gain against the ₹2 already paid.' },
  { id: 'lesson', caption: 'One side is stuck either way. The other side chose, and paid ₹2 for that choice.' },
];

export function ObligationChoiceExplainer() {
  return (
    <SceneExplainer
      title="Must you, or may you?"
      scenes={SCENES}
      renderVisual={(scene) => {
        const isFuture = scene < 2;
        const isOption = scene >= 2 && scene !== 4;
        const showResult = scene === 1 || scene === 3;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Rice falling to 25 rupees instead: the futures seller unaffected, still receiving 40, while the option holder gains 15 rupees by exercising the right to sell at 40">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Now rice falls to ₹25
              </text>
              <rect x={20} y={30} width={75} height={60} rx={6} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <text x={57} y={54} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                Futures seller
              </text>
              <text x={57} y={72} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-ink-faint)' }}>
                still ₹40 — unchanged
              </text>

              <rect x={105} y={30} width={75} height={60} rx={6} fill="var(--color-up)" fillOpacity={0.15} stroke="var(--color-up)" strokeWidth={1.5} />
              <text x={142} y={54} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
                Option holder
              </text>
              <text x={142} y={72} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                +₹15 by exercising
              </text>

              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                the right works both ways round
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A futures-style obligation that must be honoured at 40 rupees, next to an option-style right that is used only when it helps">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {isFuture ? 'A futures-style deal' : 'An option-style deal'}
            </text>

            <rect x={30} y={40} width={140} height={40} rx={6} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
            <text x={100} y={64} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              Agreed: sell at ₹40
            </text>

            <line x1={100} y1={80} x2={100} y2={110} stroke="var(--color-line-strong)" strokeWidth={1.5} strokeDasharray="3 2" />

            <rect x={30} y={112} width={140} height={40} rx={6} fill="var(--color-surface-2)" stroke={isFuture ? 'var(--color-down)' : 'var(--color-line)'} strokeWidth={1.5} />
            <text x={100} y={136} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              Rice now ₹55
            </text>

            {showResult && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                {isFuture ? (
                  <text x={100} y={176} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-down)', fontWeight: 700 }}>
                    Still pays ₹40 — obliged
                  </text>
                ) : (
                  <text x={100} y={176} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-up)', fontWeight: 700 }}>
                    Right unused — sells at ₹55
                  </text>
                )}
              </g>
            )}

            {isOption && !showResult && (
              <text x={100} y={176} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                cost of the right: ₹2
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
