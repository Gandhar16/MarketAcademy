'use client';

/**
 * DivergenceExplainer — "price makes a lower low, RSI makes a higher low —
 * a real, computed disagreement, not an eyeballed one", as a short
 * animated walkthrough. Figures match the worked example in the same
 * lesson (RSI 16.7 at swing 1, 38.5 at swing 2). See `scene-explainer.tsx`
 * for the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'lowerlow', caption: 'Price makes a new, lower low than its previous swing.' },
  { id: 'compute', caption: 'RSI is computed at both swing points, not eyeballed.' },
  { id: 'rsi-values', caption: 'RSI at swing 1: 16.7. RSI at swing 2: 38.5 — a higher low, even though price fell further.' },
  { id: 'divergence', caption: 'That disagreement is bullish divergence: the second decline was measurably weaker.' },
  { id: 'no-guarantee', caption: 'Divergence flagged this spot as worth watching. It did not guarantee a reversal — plenty of divergences resolve with price simply continuing lower anyway.' },
  { id: 'lesson', caption: 'The arithmetic is real once the swing points are chosen — but choosing them is still a judgement call.' },
];

const rsiY = (v: number) => 190 - v * 1.1;

export function DivergenceExplainer() {
  return (
    <SceneExplainer
      title="A real disagreement between price and momentum"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showRsiPanel = scene >= 1;
        const showRsiValues = scene >= 2;
        const highlightDivergence = scene >= 3;
        const showContinuation = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A price path making a lower low, paired with an RSI panel where the second swing reads higher than the first">
            <path d="M 10 20 L 40 60 L 70 40 L 100 78 L 130 55 L 160 88" fill="none" stroke="var(--color-ink)" strokeWidth={2} />
            {showContinuation && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <path d="M 160 88 L 180 105" fill="none" stroke="var(--color-down)" strokeWidth={2} strokeDasharray="3 2" />
                <text x={196} y={108} textAnchor="end" style={{ fontSize: 6.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                  or lower still
                </text>
              </g>
            )}
            <circle cx={70} cy={40} r={3} fill="var(--color-ink-faint)" />
            <circle cx={160} cy={88} r={3.5} fill={highlightDivergence ? 'var(--color-up)' : 'var(--color-down)'} style={{ transition: 'fill 400ms ease-out' }} />
            <text x={160} y={100} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
              lower low
            </text>

            {showRsiPanel && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={5} y1={112} x2={195} y2={112} stroke="var(--color-line)" strokeWidth={1} />
                <text x={5} y={122} style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                  RSI
                </text>

                <rect x={65} y={rsiY(16.7)} width={10} height={190 - rsiY(16.7)} fill="var(--color-ink-faint)" />
                {showRsiValues && (
                  <text x={70} y={rsiY(16.7) - 4} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)', fontWeight: 600 }}>
                    16.7
                  </text>
                )}

                <rect x={155} y={rsiY(38.5)} width={10} height={190 - rsiY(38.5)} fill={highlightDivergence ? 'var(--color-up)' : 'var(--color-ink-faint)'} style={{ transition: 'fill 400ms ease-out' }} />
                {showRsiValues && (
                  <text x={160} y={rsiY(38.5) - 4} textAnchor="middle" style={{ fontSize: 7, fill: highlightDivergence ? 'var(--color-up)' : 'var(--color-ink)', fontWeight: 600 }}>
                    38.5
                  </text>
                )}
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
