'use client';

/**
 * ConfluenceExplainer — "confluence draws attention, which is real — it is
 * not independent evidence, because both signals came from the same eye on
 * the same chart", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (hammer at ₹923, 38.2% level at
 * ₹923.60). See `scene-explainer.tsx` for the shared chrome and why this is
 * a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'hammer', caption: 'A hammer candle forms at ₹923.' },
  { id: 'fib', caption: 'The 38.2% retracement of the recent rally sits at ₹923.60 — almost the identical price.' },
  { id: 'together', caption: 'Traders call this confluence. It feels like double confirmation.' },
  { id: 'same-eye', caption: 'But both signals came from the same person, looking at the same chart.' },
  { id: 'counterfactual', caption: 'If the 38.2% level had instead sat at ₹880, nobody would have circled the hammer at ₹923 at all — the fib level is what makes the candle interesting, not the other way round.' },
  { id: 'lesson', caption: 'Confluence draws more attention — real. It is not independent evidence — the two signals could never have failed separately.' },
];

export function ConfluenceExplainer() {
  return (
    <SceneExplainer
      title="Two signals, one eye"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showFib = scene >= 1 && scene !== 4;
        const glow = scene === 2;
        const showEye = scene >= 3 && scene !== 4;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The same hammer candle, but with the fib level far away at 880 instead of near it — nobody circles the candle now">
              <line x1={20} y1={50} x2={180} y2={50} stroke="var(--color-ink-faint)" strokeWidth={1.5} strokeDasharray="3 3" />
              <text x={182} y={54} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                38.2% · ₹880
              </text>

              <line x1={95} y1={80} x2={95} y2={112} stroke="var(--color-ink-faint)" strokeWidth={1.5} />
              <rect x={90} y={92} width={10} height={20} rx={2} fill="var(--color-ink-faint)" />
              <text x={95} y={130} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                hammer · ₹923
              </text>

              <text x={100} y={168} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink-muted)' }}>
                not interesting anymore
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A hammer candle and a Fibonacci retracement line converging on nearly the same price, both chosen by the same observer">
            <line x1={20} y1={100} x2={180} y2={100} stroke={glow || showFib ? 'var(--color-accent)' : 'var(--color-line)'} strokeWidth={showFib ? 2 : 1} strokeDasharray={showFib ? 'none' : '3 3'} style={{ transition: 'all 400ms ease-out' }} />
            {showFib && (
              <text x={182} y={104} style={{ fontSize: 7, fill: 'var(--color-accent)' }}>
                38.2% · ₹923.60
              </text>
            )}

            <g style={{ filter: glow ? 'drop-shadow(0 0 6px var(--color-up))' : 'none', transition: 'filter 400ms ease-out' }}>
              <line x1={95} y1={80} x2={95} y2={112} stroke="var(--color-up)" strokeWidth={1.5} />
              <rect x={90} y={92} width={10} height={20} rx={2} fill="var(--color-up)" />
            </g>
            <text x={95} y={130} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              hammer · ₹923
            </text>

            {showEye && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <ellipse cx={100} cy={30} rx={14} ry={8} fill="none" stroke="var(--color-ink-faint)" strokeWidth={1.5} />
                <circle cx={100} cy={30} r={4} fill="var(--color-ink-faint)" />
                <line x1={92} y1={36} x2={95} y2={78} stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="2 2" />
                <line x1={108} y1={36} x2={98} y2={100} stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="2 2" />
                <text x={100} y={16} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  one observer, one chart
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
