'use client';

/**
 * BaseRateExplainer — "a hit rate means nothing without the base rate beside
 * it", as a short animated walkthrough. Figures match the opening predict
 * in the same lesson (54% hit rate vs. a 53% base rate). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'hitrate', caption: 'A pattern shows a 54% hit rate — the stock closes higher over the next five days more often than not.' },
  { id: 'sounds-good', caption: 'That sounds like an edge — better than a coin flip.' },
  { id: 'baserate', caption: 'But the Indian market closes higher over ANY random five-day window about 53% of the time — it has drifted upward for decades.' },
  { id: 'gap', caption: 'The real edge is the gap between them: 54 − 53 = just 1 point.' },
  { id: 'many', caption: 'Test a hundred random patterns against the same 53% baseline, and pure chance alone will hand a few of them a similar 1-point "edge" — with nothing real behind it.' },
  { id: 'lesson', caption: 'Almost nobody who sells you a pattern shows you the second bar.' },
];

export function BaseRateExplainer() {
  return (
    <SceneExplainer
      title="Hit rate minus base rate is the whole finding"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showBase = scene >= 2;
        const showGap = scene >= 3;

        if (scene === 4) {
          const bars = [53, 54, 52, 55, 53, 51, 54, 53, 56, 52];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A row of ten small bars, most hovering near the 53 percent baseline, showing that a few will drift a point or two above it by chance alone">
              <line x1={10} y1={130} x2={190} y2={130} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="2 2" />
              <text x={190} y={126} textAnchor="end" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                53% baseline
              </text>
              {bars.map((v, i) => {
                const h = (v - 48) * 12;
                const isNoise = v >= 55;
                return (
                  <rect
                    key={i}
                    x={12 + i * 18}
                    y={150 - h}
                    width={13}
                    height={h}
                    rx={2}
                    fill={isNoise ? 'var(--color-down)' : 'var(--color-ink-faint)'}
                    fillOpacity={isNoise ? 0.85 : 0.45}
                  />
                );
              })}
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                a few &quot;edges&quot; are just noise
              </text>
            </svg>
          );
        }

        const hitH = 54 * 1.4;
        const baseH = 53 * 1.4;
        const baseY = 178;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A hit-rate bar at 54 percent next to a base-rate bar at 53 percent, with the one-point gap between them highlighted">
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={40} y={baseY - hitH} width={44} height={hitH} rx={4} fill="var(--color-accent)" style={{ transition: 'all 500ms ease-out' }} />
            <text x={62} y={baseY - hitH - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              54%
            </text>
            <text x={62} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              hit rate
            </text>

            {showBase && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={116} y={baseY - baseH} width={44} height={baseH} rx={4} fill="var(--color-ink-faint)" style={{ transition: 'all 500ms ease-out' }} />
                <text x={138} y={baseY - baseH - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
                  53%
                </text>
                <text x={138} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  base rate
                </text>
              </g>
            )}

            {showGap && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={100} y1={baseY - hitH} x2={100} y2={baseY - baseH} stroke="var(--color-up)" strokeWidth={3} />
                <text x={100} y={baseY - hitH - 18} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-up)', fontWeight: 700 }}>
                  +1 point
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
