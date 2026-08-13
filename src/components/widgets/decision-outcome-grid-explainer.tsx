'use client';

/**
 * DecisionOutcomeGridExplainer — "four outcomes, not two", as a short
 * animated walkthrough. See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Every finished trade lands in one of four boxes — decision quality against result.' },
  { id: 'good-good', caption: 'Good decision, good result. Repeat it.' },
  { id: 'good-bad', caption: 'Good decision, bad result. The cost of doing business. Change nothing.' },
  { id: 'bad-bad', caption: 'Bad decision, bad result. The cheapest lesson available. Learn it.' },
  { id: 'bad-good', caption: 'Bad decision, good result. The dangerous one — it rewards the wrong behaviour and feels like skill.' },
  { id: 'journal', caption: 'In the moment, you cannot always tell which box you are in — a result feels the same whether it was earned or lucky. A written journal, checked afterward, is how you find out.' },
];

const QUADRANTS = [
  { id: 'good-good', x: 20, y: 30, label: 'Good decision\nGood result', sub: 'Repeat it', colour: 'var(--color-up)' },
  { id: 'good-bad', x: 104, y: 30, label: 'Good decision\nBad result', sub: 'Cost of business', colour: 'var(--color-accent)' },
  { id: 'bad-bad', x: 20, y: 114, label: 'Bad decision\nBad result', sub: 'Cheapest lesson', colour: 'var(--color-ink-faint)' },
  { id: 'bad-good', x: 104, y: 114, label: 'Bad decision\nGood result', sub: 'Dangerous', colour: 'var(--color-down)' },
];

export function DecisionOutcomeGridExplainer() {
  return (
    <SceneExplainer
      title="Four outcomes, not two"
      scenes={SCENES}
      renderVisual={(scene) => {
        const activeId = SCENES[scene].id === 'setup' ? null : SCENES[scene].id;
        const showJournal = SCENES[scene].id === 'journal';

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A two by two grid of decision quality against result, with the bad-decision-good-result box highlighted as dangerous">
            <text x={100} y={14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              Result: good →
            </text>

            {QUADRANTS.map((q) => {
              const isActive = q.id === activeId;
              return (
                <g key={q.id} style={{ transition: 'all 400ms ease-out' }}>
                  <rect
                    x={q.x}
                    y={q.y}
                    width={76}
                    height={70}
                    rx={8}
                    fill={q.colour}
                    fillOpacity={isActive ? 0.2 : 0.06}
                    stroke={q.colour}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  {q.label.split('\n').map((line, i) => (
                    <text
                      key={line}
                      x={q.x + 38}
                      y={q.y + 26 + i * 11}
                      textAnchor="middle"
                      style={{ fontSize: 7.5, fill: isActive ? 'var(--color-ink)' : 'var(--color-ink-faint)', fontWeight: isActive ? 600 : 400 }}
                    >
                      {line}
                    </text>
                  ))}
                  {isActive && (
                    <text x={q.x + 38} y={q.y + 54} textAnchor="middle" style={{ fontSize: 7, fill: q.colour, fontWeight: 700 }}>
                      {q.sub}
                    </text>
                  )}
                </g>
              );
            })}

            {showJournal && (
              <g>
                <rect x={50} y={92} width={100} height={20} rx={6} fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth={1.5} />
                <text x={100} y={106} textAnchor="middle" style={{ fontSize: 8.5, fontWeight: 700, fill: 'var(--color-accent)' }}>
                  ✎ write it down
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
