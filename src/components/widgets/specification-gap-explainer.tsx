'use client';

/**
 * SpecificationGapExplainer — "nine or more unanswered decisions hiding
 * inside one confident sentence — a discretionary trader makes them
 * silently and differently each time", as a short animated walkthrough.
 * Figures match the opening predict in the same lesson ("buy when it
 * breaks out of resistance on good volume"). See `scene-explainer.tsx` for
 * the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'sentence', caption: '"Buy when it breaks out of resistance on good volume." Sounds complete.' },
  { id: 'q1', caption: 'Which resistance? Measured over how many bars?' },
  { id: 'q2', caption: 'How far above counts as a break — one paisa, or half a percent?' },
  { id: 'q3', caption: '"Good volume" compared with what baseline? And what if it gaps past the level?' },
  { id: 'lesson', caption: 'Nine or more silent decisions — made differently by the same trader on different days.' },
  { id: 'forced', caption: 'Turning this into rules a computer can run forces every one of those nine questions to get an explicit, written answer. Nothing gets to stay a feeling — that discipline is worth having even if the rules never touch an algorithm.' },
];

export function SpecificationGapExplainer() {
  return (
    <SceneExplainer
      title="One confident sentence, nine hidden decisions"
      scenes={SCENES}
      renderVisual={(scene) => {
        const questions = [
          { x: 40, y: 50, show: scene >= 1 && scene !== 5 },
          { x: 150, y: 70, show: scene >= 2 && scene !== 5 },
          { x: 50, y: 120, show: scene >= 3 && scene !== 5 },
          { x: 140, y: 140, show: scene >= 3 && scene !== 5 },
        ];

        if (scene === 5) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The same rule with every hidden question replaced by an explicit, written checkmark answer">
              <rect x={30} y={84} width={140} height={32} rx={6} fill="var(--color-up)" fillOpacity={0.12} stroke="var(--color-up)" strokeWidth={1.5} />
              <text x={100} y={104} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)', fontWeight: 700 }}>
                &ldquo;buy the breakout&rdquo;
              </text>
              {[
                { x: 40, y: 50 },
                { x: 150, y: 70 },
                { x: 50, y: 130 },
                { x: 140, y: 150 },
              ].map((q, i) => (
                <text key={i} x={q.x} y={q.y} textAnchor="middle" style={{ fontSize: 14, fill: 'var(--color-up)', fontWeight: 700 }}>
                  ✓
                </text>
              ))}
              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-up)' }}>
                every question, answered explicitly
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A confident sentence about a trading rule surrounded by unanswered question marks representing hidden decisions">
            <rect x={30} y={84} width={140} height={32} rx={6} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
            <text x={100} y={104} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)', fontWeight: 700 }}>
              &ldquo;buy the breakout&rdquo;
            </text>

            {questions.map((q, i) => (
              <text
                key={i}
                x={q.x}
                y={q.y}
                textAnchor="middle"
                style={{
                  fontSize: 16,
                  fill: 'var(--color-down)',
                  fontWeight: 700,
                  opacity: q.show ? 1 : 0,
                  transition: 'opacity 400ms ease-out',
                }}
              >
                ?
              </text>
            ))}

            {scene >= 4 && (
              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                9+ unanswered questions
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
