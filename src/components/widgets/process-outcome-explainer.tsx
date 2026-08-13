'use client';

/**
 * ProcessOutcomeExplainer — "grade the decision, not the result", as a
 * short animated walkthrough, complementing the full `ProcessNotOutcomeLab`
 * widget in the same lesson. See `scene-explainer.tsx` for the shared
 * chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Two investors each make a decision today.' },
  { id: 'a', caption: 'Investor A researches, sets a limit, and commits a sensible size — a sound process.' },
  { id: 'b', caption: 'Investor B sees a tip, feels good about it, and bets big with no plan — a reckless process.' },
  { id: 'outcome', caption: "A year later, purely by chance, A's holding is down and B's happens to be up." },
  { id: 'grade', caption: "Grading by outcome says B won. Grading by process says A made the better decision — the coin just landed the other way." },
  { id: 'repeat', caption: "Replay this same year with new luck each time. A's mark never changes — it was fixed the moment the decision was made, before either coin landed." },
];

export function ProcessOutcomeExplainer() {
  return (
    <SceneExplainer
      title="Grade the decision, not the result"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showA = scene >= 1;
        const showB = scene >= 2;
        const showOutcome = scene >= 3;
        const showGrade = scene >= 4;
        const showReplay = scene === 5;

        const Column = ({ x, label, processGood, processLabel }: { x: number; label: string; processGood: boolean; processLabel: string }) => (
          <g>
            <text x={x} y={20} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--color-ink)', fontWeight: 600 }}>
              {label}
            </text>

            <g style={{ transition: 'opacity 400ms ease-out', opacity: (label === 'Investor A' ? showA : showB) ? 1 : 0 }}>
              <rect
                x={x - 44}
                y={34}
                width={88}
                height={40}
                rx={8}
                fill={processGood ? 'var(--color-up)' : 'var(--color-down)'}
                fillOpacity={0.15}
                stroke={processGood ? 'var(--color-up)' : 'var(--color-down)'}
                strokeWidth={1.5}
              />
              <text x={x} y={50} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                {processGood ? 'Sound process' : 'Reckless process'}
              </text>
              <text x={x} y={64} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                {processLabel}
              </text>
            </g>

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showOutcome ? 1 : 0 }}>
              <line x1={x} y1={78} x2={x} y2={104} stroke="var(--color-line-strong)" strokeWidth={1.5} />
              <rect x={x - 36} y={106} width={72} height={30} rx={6} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              <text x={x} y={125} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                {processGood ? 'Loss' : 'Gain'}
              </text>
            </g>

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showGrade ? 1 : 0 }}>
              <text x={x} y={158} textAnchor="middle" style={{ fontSize: 18 }}>
                {processGood ? '✓' : '✕'}
              </text>
              <text x={x} y={172} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                still graded on process
              </text>
            </g>
          </g>
        );

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two investors, one disciplined and one reckless, graded on their process rather than their outcome">
            <Column x={54} label="Investor A" processGood processLabel="researched, limit set" />
            <Column x={146} label="Investor B" processGood={false} processLabel="tip, no limit" />

            {showReplay && (
              <g>
                <rect x={50} y={182} width={100} height={16} rx={5} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1} />
                <text x={100} y={193} textAnchor="middle" style={{ fontSize: 8, fontWeight: 600, fill: 'var(--color-ink-muted)' }}>
                  ↻ replay with new luck
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
