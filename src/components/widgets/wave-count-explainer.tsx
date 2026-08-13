'use client';

/**
 * WaveCountExplainer — "the rules are real, and they still leave more than
 * one legal way to label the same chart", as a short animated walkthrough.
 * See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'path', caption: 'A price path: five legs up, three legs down.' },
  { id: 'readingA', caption: 'Reading A labels it a complete cycle — 1, 2, 3, 4, 5, then A, B, C.' },
  { id: 'readingB', caption: 'Reading B labels the exact same path differently — this "wave 5" is read as wave 3 of a bigger move still forming.' },
  { id: 'both-legal', caption: 'Both are legal under the rules. The chart alone does not decide between them.' },
  { id: 'third', caption: 'A third reading is legal too — starting the count one leg earlier, so what looked like wave 1 here is actually wave 3 of something that began before this chart even starts.' },
  { id: 'lesson', caption: 'A count passing the rules only means it has not been ruled out — not that it is the right read.' },
];

const PTS = [
  [20, 170], [50, 130], [65, 145], [90, 90], [105, 110], [130, 55], [150, 75], [180, 30],
];

function pathD() {
  return PTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
}

export function WaveCountExplainer() {
  return (
    <SceneExplainer
      title="One chart, more than one legal count"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showA = scene === 1;
        const showB = scene === 2;
        const showBoth = scene === 3 || scene === 5;
        const showThird = scene === 4;

        const labelsA = ['1', '2', '3', '4', '5', 'A', 'B', 'C'];
        const labelsB = ['1', '2', '3', null, null, null, null, null];

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A zigzagging price path labelled two different, both legal, ways">
            <path d={pathD()} fill="none" stroke="var(--color-ink)" strokeWidth={2} />

            {(showA || showBoth) &&
              PTS.map((p, i) => (
                <text key={`a${i}`} x={p[0]} y={p[1] - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-accent)', fontWeight: 700 }}>
                  {labelsA[i]}
                </text>
              ))}

            {showB &&
              PTS.map((p, i) => {
                const label = labelsB[i];
                if (!label) return null;
                return (
                  <text key={`b${i}`} x={p[0]} y={p[1] - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-down)', fontWeight: 700 }}>
                    {label}
                  </text>
                );
              })}
            {showB && (
              <text x={165} y={38} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-down)', fontWeight: 700 }}>
                …?
              </text>
            )}

            {showBoth && (
              <text x={100} y={195} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                same path, both readings legal
              </text>
            )}

            {showThird && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <path d="M 5 185 L 20 170" stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="2 2" fill="none" />
                <text x={8} y={198} style={{ fontSize: 6.5, fill: 'var(--color-down)' }}>
                  began earlier
                </text>
                <text x={50} y={40} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-down)', fontWeight: 700 }}>
                  really wave 3
                </text>
                <text x={100} y={195} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                  a third legal reading
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
