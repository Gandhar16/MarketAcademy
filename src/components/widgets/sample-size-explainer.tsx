'use client';

/**
 * SampleSizeExplainer — "the same edge means nothing on a small sample and
 * real evidence on a large one", as a short animated walkthrough. Figures
 * match the worked example in the same lesson (a 7-point edge at 38
 * occurrences vs. 900). See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'both', caption: 'Two patterns. Both show a 60% hit rate against a 53% baseline — the same 7-point edge, both times.' },
  { id: 'small', caption: 'Pattern A fired only 38 times.' },
  { id: 'small-spread', caption: 'Thirty-eight tries is a small, noisy sample — this "edge" could easily just be luck.' },
  { id: 'large', caption: 'Pattern B fired 900 times — the identical 7-point edge, on a far bigger sample.' },
  { id: 'ratio', caption: '900 ÷ 38 is about 24 times more evidence behind the exact same number. One of these edges deserves your trust far more than the other.' },
  { id: 'lesson', caption: 'Read the occurrence count before the edge. A spectacular number on a dozen tries is a story about a dozen days.' },
];

function Dots({ count, spreadY, colour, cx }: { count: number; spreadY: number; colour: string; cx: number }) {
  const pts = Array.from({ length: count }, (_, i) => {
    // deterministic pseudo-scatter, not random (Math.random unavailable), using a simple hash-like spread
    const seed = (i * 37) % 100;
    const dx = ((seed % 10) - 4.5) * 3.2;
    const dy = (((seed * 7) % 100) / 100 - 0.5) * spreadY;
    return { x: cx + dx, y: 100 + dy };
  });
  return (
    <>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={colour} fillOpacity={0.75} />
      ))}
    </>
  );
}

export function SampleSizeExplainer() {
  return (
    <SceneExplainer
      title="The same edge, two very different samples"
      scenes={SCENES}
      renderVisual={(scene) => {
        if (scene === 0) {
          const y = 178;
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two bars, both showing a 60 percent hit rate against a 53 percent baseline">
              <rect x={40} y={y - 84} width={40} height={84} rx={4} fill="var(--color-accent)" />
              <text x={60} y={y + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Pattern A
              </text>
              <rect x={120} y={y - 84} width={40} height={84} rx={4} fill="var(--color-accent)" />
              <text x={140} y={y + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Pattern B
              </text>
              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                both: 60% vs. 53% baseline
              </text>
            </svg>
          );
        }
        if (scene === 1 || scene === 2) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="38 scattered dots, widely spread, representing an unreliable small sample">
              <Dots count={38} spreadY={130} colour="var(--color-accent)" cx={100} />
              {scene === 2 && (
                <rect x={30} y={35} width={140} height={130} rx={40} fill="none" stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 3" />
              )}
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
                n = 38 — wide spread
              </text>
            </svg>
          );
        }
        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two bars, 38 occurrences and 900 occurrences, showing 900 is about 24 times as much evidence for the same edge">
              <rect x={40} y={150} width={30} height={6} rx={2} fill="var(--color-accent)" />
              <text x={55} y={170} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                n = 38
              </text>
              <rect x={110} y={40} width={30} height={116} rx={2} fill="var(--color-up)" />
              <text x={125} y={170} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                n = 900
              </text>
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-up)' }}>
                × 24
              </text>
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                same 7-point edge, very different trust
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="900 densely packed dots, tightly clustered, representing a reliable large sample">
            <Dots count={140} spreadY={50} colour="var(--color-up)" cx={100} />
            <rect x={55} y={62} width={90} height={76} rx={30} fill="none" stroke="var(--color-up)" strokeWidth={1.5} strokeDasharray={scene >= 4 ? '0' : '3 3'} />
            <text x={100} y={188} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
              n = 900 — tight, believable
            </text>
          </svg>
        );
      }}
    />
  );
}
