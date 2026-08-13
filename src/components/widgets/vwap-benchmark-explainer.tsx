'use client';

/**
 * VwapBenchmarkExplainer — "volume-weighted means size moves it, and it is
 * an execution benchmark, never a directional signal", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (four
 * small trades, then a 5,000-share trade at ₹510). See `scene-explainer.tsx`
 * for the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'trades', caption: 'Four trades print: 1,000 shares at ₹500, 500 at ₹502, 800 at ₹498, 700 at ₹501.' },
  { id: 'vwap1', caption: 'VWAP so far: ₹500.03 — barely moved, diluted by all the volume already in it.' },
  { id: 'big', caption: 'A fifth trade prints: 5,000 shares at ₹510 — more volume than all four earlier trades combined.' },
  { id: 'vwap2', caption: 'VWAP jumps substantially, to ₹506.26.' },
  { id: 'use', caption: 'This is the actual use case: a fund filling a large order compares its own average fill price to VWAP. Below VWAP on a buy is judged a good execution — above it, a worse one.' },
  { id: 'lesson', caption: 'That is what "volume-weighted" means: size moves it. It is an execution benchmark, never a forecast.' },
];

const TRADES = [
  { qty: 1000, price: 500 },
  { qty: 500, price: 502 },
  { qty: 800, price: 498 },
  { qty: 700, price: 501 },
];

const priceY = (p: number) => 178 - ((p - 495) / (515 - 495)) * 150;

export function VwapBenchmarkExplainer() {
  return (
    <SceneExplainer
      title="Why a big trade moves VWAP more than a small one"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showTrades = scene >= 0;
        const showVwap1 = scene >= 1 && scene < 2;
        const showBig = scene >= 2 && scene !== 4;
        const showVwap2 = scene >= 3 && scene !== 4;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A VWAP benchmark line with a good fill below it and a worse fill above it, showing how a fund grades its own execution against VWAP">
              <line x1={10} y1={100} x2={190} y2={100} stroke="var(--color-accent)" strokeWidth={2} />
              <text x={190} y={94} textAnchor="end" style={{ fontSize: 7.5, fill: 'var(--color-accent)', fontWeight: 700 }}>
                VWAP
              </text>

              <circle cx={70} cy={130} r={6} fill="var(--color-up)" />
              <text x={70} y={150} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-up)', fontWeight: 700 }}>
                good fill
              </text>

              <circle cx={140} cy={65} r={6} fill="var(--color-down)" />
              <text x={140} y={54} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                worse fill
              </text>

              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                grading your own execution
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Four small trades near ₹500, a VWAP line, then a large trade at ₹510 pulling the VWAP line substantially higher">
            {showTrades &&
              TRADES.map((t, i) => (
                <circle key={i} cx={20 + i * 25} cy={priceY(t.price)} r={2 + t.qty / 400} fill="var(--color-ink-faint)" />
              ))}

            {showVwap1 && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={10} y1={priceY(500.03)} x2={130} y2={priceY(500.03)} stroke="var(--color-accent)" strokeWidth={2} />
                <text x={135} y={priceY(500.03) + 3} style={{ fontSize: 7.5, fill: 'var(--color-accent)', fontWeight: 700 }}>
                  VWAP ₹500.03
                </text>
              </g>
            )}

            {showBig && (
              <circle cx={155} cy={priceY(510)} r={10} fill="var(--color-down)" fillOpacity={0.75} style={{ transition: 'opacity 400ms ease-out' }} />
            )}
            {showBig && (
              <text x={155} y={priceY(510) - 16} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)' }}>
                5,000 @ ₹510
              </text>
            )}

            {showVwap2 && (
              <g style={{ transition: 'all 500ms ease-out' }}>
                <line x1={10} y1={priceY(506.26)} x2={185} y2={priceY(506.26)} stroke="var(--color-accent)" strokeWidth={2} />
                <text x={188} y={priceY(506.26) + 3} textAnchor="end" style={{ fontSize: 7.5, fill: 'var(--color-accent)', fontWeight: 700 }}>
                  ₹506.26
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
