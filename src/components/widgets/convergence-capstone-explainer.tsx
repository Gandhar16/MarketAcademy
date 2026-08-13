'use client';

/**
 * ConvergenceCapstoneExplainer — "several tools agreeing means more
 * attention, not more certainty — sizing is what still protects you", as a
 * short animated walkthrough closing out the technician's toolkit stage.
 * See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'three', caption: 'A support zone, a Fibonacci level, and a pivot S1 — three different methods — all land within a few rupees of ₹640.' },
  { id: 'attention', caption: 'That convergence draws real attention.' },
  { id: 'question', caption: 'But not one of these tools knows which way price breaks from here.' },
  { id: 'size', caption: "What actually protects you is not a better tool — it is the size of the position." },
  { id: 'callback', caption: 'The same fixed-risk-budget idea from earlier in this course still applies here: decide how much you would lose if ₹640 fails, before you know which way it breaks.' },
  { id: 'lesson', caption: 'Decide the loss you can accept before you enter. That rule worked before any of these nine tools existed.' },
];

export function ConvergenceCapstoneExplainer() {
  return (
    <SceneExplainer
      title="Convergence is attention, not certainty"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showQuestion = scene === 2;
        const showSize = scene >= 3;
        const dimCluster = scene >= 3;
        const showCallback = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three different methods converging near one price, then a question mark for direction, resolved by position sizing instead">
            <g style={{ transition: 'opacity 400ms ease-out', opacity: dimCluster ? 0.25 : 1 }}>
              <line x1={20} y1={100} x2={180} y2={100} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="2 2" />
              {[{ x: 70, label: 'zone' }, { x: 100, label: 'fib' }, { x: 130, label: 'S1' }].map((t) => (
                <g key={t.label}>
                  <circle cx={t.x} cy={100} r={5} fill="var(--color-accent)" fillOpacity={scene >= 1 ? 0.9 : 0.5} />
                  <text x={t.x} y={116} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                    {t.label}
                  </text>
                </g>
              ))}
              <text x={100} y={80} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                ₹640
              </text>
            </g>

            {showQuestion && (
              <text x={100} y={45} textAnchor="middle" style={{ fontSize: 22, fill: 'var(--color-ink-faint)', fontWeight: 700 }}>
                ?
              </text>
            )}

            {showSize && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={55} y={135} width={90} height={40} rx={8} fill="var(--color-up)" fillOpacity={0.15} stroke="var(--color-up)" strokeWidth={1.5} />
                <text x={100} y={152} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)', fontWeight: 700 }}>
                  position size
                </text>
                <text x={100} y={166} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  set by acceptable loss
                </text>
              </g>
            )}

            {showCallback && (
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 700, fill: 'var(--color-up)' }}>
                same idea, back from stage 3
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
