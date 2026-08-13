'use client';

/**
 * AsymmetryExplainer — "buying one of these has a floor, selling one does
 * not have a ceiling", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (Asha buys a RELIANCE 1400 call for
 * ₹30, Bharat sells it; a run to ₹2,000 costs Bharat ₹1,25,000 while Asha's
 * loss was always capped at ₹7,500). See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Asha buys a RELIANCE 1400 call for ₹30. Bharat sells it to her and receives ₹7,500 on the lot.' },
  { id: 'ashafloor', caption: 'Whatever happens, Asha can never lose more than the ₹7,500 she paid.' },
  { id: 'bharatceiling', caption: 'Bharat has no such floor under his loss — it grows with the price, without limit.' },
  { id: 'runup', caption: 'Reliance runs to ₹2,000. Asha is still capped at −₹7,500.' },
  { id: 'modest', caption: "This is not only a story about extreme moves. Even a modest run to ₹1,500 costs Bharat about ₹17,500 — well over twice Asha's entire capped loss — on a rise far smaller than the runaway case." },
  { id: 'lesson', caption: "Bharat's loss on the same move: about −₹1,25,000. A floor on one side, none on the other." },
];

export function AsymmetryExplainer() {
  return (
    <SceneExplainer
      title="A floor on one side, no ceiling on the other"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showFloor = scene >= 1;
        const showCeiling = scene >= 2;
        const showRunup = scene === 3 || scene === 5;
        const showModest = scene === 4;
        const baseY = 100;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Asha, a buyer, whose loss is capped at 7,500 rupees, next to Bharat, a seller, whose loss grows without limit as the price runs up">
            <text x={56} y={16} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>Asha</text>
            <text x={144} y={16} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>Bharat</text>

            <line x1={24} y1={baseY} x2={88} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />
            <line x1={112} y1={baseY} x2={176} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            {showFloor && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={40} y={baseY} width={30} height={showRunup || showModest ? 26 : 10} rx={3} fill="var(--color-down)" fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
                <line x1={30} y1={baseY + 26} x2={80} y2={baseY + 26} stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="2 2" />
                <text x={56} y={baseY + 40} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>floor: −₹7,500</text>
              </g>
            )}

            {showCeiling && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={128} y={baseY} width={30} height={showRunup ? 90 : showModest ? 42 : 10} rx={3} fill="var(--color-down)" fillOpacity={0.85} style={{ transition: 'all 500ms ease-out' }} />
                {showRunup && (
                  <text x={144} y={baseY + 104} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>no ceiling</text>
                )}
              </g>
            )}

            {showRunup && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={56} y={64} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>−₹7,500</text>
                <text x={144} y={64} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>−₹1,25,000</text>
              </g>
            )}

            {showModest && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={56} y={64} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>−₹7,500</text>
                <text x={144} y={baseY - 8} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>−₹17,500</text>
                <text x={100} y={16} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>a modest move to ₹1,500</text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
