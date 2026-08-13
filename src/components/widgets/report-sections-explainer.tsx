'use client';

/**
 * ReportSectionsExplainer — "length has nothing to do with how much real
 * information a section carries", as a short animated walkthrough. See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: "A 300-page annual report: a glossy 4-page chairman's letter, and a 2-line auditor's note buried on page 210." },
  { id: 'question', caption: 'Which one carries more real information about risk?' },
  { id: 'letter-dims', caption: "The chairman's letter is marketing copy, written by the people it is describing." },
  { id: 'note-glows', caption: 'The 2-line auditor note is independently reviewed and professionally signed.' },
  { id: 'order', caption: 'In practice: read the auditor\'s report, the related-party note, and the cash flow statement first — in that order. The chairman\'s letter can wait until last, if you read it at all.' },
  { id: 'lesson', caption: 'Length has nothing to do with how much real information a section carries.' },
];

export function ReportSectionsExplainer() {
  return (
    <SceneExplainer
      title="Length is not information"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showQuestion = scene === 1;
        const dimLetter = scene >= 2;
        const glowNote = scene >= 3 && scene !== 4;

        if (scene === 4) {
          const ORDER = ["Auditor's report", 'Related-party note', 'Cash flow statement', "Chairman's letter — last"];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A reading order: auditor's report, related-party note, and cash flow statement first, the chairman's letter last">
              {ORDER.map((item, i) => (
                <g key={item}>
                  <circle cx={26} cy={30 + i * 38} r={11} fill={i < 3 ? 'var(--color-accent)' : 'var(--color-surface-2)'} fillOpacity={i < 3 ? 0.2 : 1} stroke={i < 3 ? 'var(--color-accent)' : 'var(--color-line)'} strokeWidth={1.5} />
                  <text x={26} y={34 + i * 38} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: i < 3 ? 'var(--color-accent)' : 'var(--color-ink-faint)' }}>
                    {i + 1}
                  </text>
                  <text x={44} y={34 + i * 38} style={{ fontSize: 8, fill: i < 3 ? 'var(--color-ink)' : 'var(--color-ink-faint)', fontWeight: i < 3 ? 600 : 400 }}>
                    {item}
                  </text>
                </g>
              ))}
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A large, glossy chairman's letter block next to a tiny two-line auditor's note, with the small note ultimately carrying more weight">
            <g style={{ transition: 'opacity 400ms ease-out', opacity: dimLetter ? 0.3 : 1 }}>
              <rect x={20} y={20} width={90} height={130} rx={6} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line key={i} x1={30} y1={38 + i * 18} x2={100} y2={38 + i * 18} stroke="var(--color-ink-faint)" strokeWidth={2} />
              ))}
              <text x={65} y={162} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                chairman&rsquo;s letter
              </text>
            </g>

            <g style={{ transition: 'all 400ms ease-out', filter: glowNote ? 'drop-shadow(0 0 6px var(--color-accent))' : 'none' }}>
              <rect x={125} y={70} width={65} height={26} rx={4} fill="var(--color-surface-2)" stroke={glowNote ? 'var(--color-accent)' : 'var(--color-line)'} strokeWidth={glowNote ? 2 : 1} />
              <line x1={132} y1={80} x2={183} y2={80} stroke="var(--color-ink)" strokeWidth={1.5} />
              <line x1={132} y1={88} x2={170} y2={88} stroke="var(--color-ink)" strokeWidth={1.5} />
              <text x={157} y={107} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                auditor&rsquo;s note
              </text>
            </g>

            {showQuestion && (
              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 14, fill: 'var(--color-ink-faint)', fontWeight: 700 }}>
                ?
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
