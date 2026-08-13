'use client';

/**
 * CandlePathExplainer — "a candle is a summary, and two very different
 * sessions can draw an identical one", as a short animated walkthrough.
 * Figures match the worked example in the same lesson (open 100, high 105,
 * low 99, close 104). See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'candle', caption: 'A daily candle: opens ₹100, closes ₹104, high ₹105, low ₹99.' },
  { id: 'a', caption: 'Session A: a calm grind upward. Opens at 100, drifts to 99 in the first hour, then climbs steadily and closes near the high.' },
  { id: 'b', caption: 'Session B: a violent whipsaw. Opens at 100, spikes to 105 in ten minutes, crashes to 99 by lunch, recovers all afternoon.' },
  { id: 'both', caption: 'Both sessions draw the exact same candle — open, high, low and close are all identical.' },
  { id: 'stop', caption: 'Now add a stop-loss at ₹99.50. In Session A it is never threatened. In Session B, price dips to ₹99 mid-session and the stop fires — that trader is out, in cash, well before the close back at ₹104 the candle shows.' },
  { id: 'lesson', caption: 'The candle cannot tell you which one happened. For a position with a stop inside that range, they are not remotely the same day.' },
];

// price 99..105 mapped to y 178..30
const priceY = (p: number) => 178 - ((p - 99) / (105 - 99)) * 148;
const X_START = 26;
const X_END = 150;

const SESSION_A = [100, 99.6, 99, 99.4, 100.5, 101.5, 102.5, 103.5, 104.5, 105, 104];
const SESSION_B = [100, 102, 104, 105, 103, 101, 99, 99.5, 101, 103, 104];

function pathFor(prices: number[]) {
  return prices
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${X_START + (i / (prices.length - 1)) * (X_END - X_START)} ${priceY(p)}`)
    .join(' ');
}

function Candle({ x }: { x: number }) {
  return (
    <g>
      <line x1={x} y1={priceY(105)} x2={x} y2={priceY(99)} stroke="var(--color-ink-faint)" strokeWidth={1.5} />
      <rect x={x - 7} y={priceY(104)} width={14} height={Math.max(2, priceY(100) - priceY(104))} fill="var(--color-up)" />
    </g>
  );
}

export function CandlePathExplainer() {
  return (
    <SceneExplainer
      title="One candle, more than one possible day"
      scenes={SCENES}
      renderVisual={(scene) => (
        <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A line showing an intraday price path, and a candle summarising it, showing how two different paths can produce the same candle">
          {[105, 104, 100, 99].map((p) => (
            <line key={p} x1={X_START} y1={priceY(p)} x2={X_END} y2={priceY(p)} stroke="var(--color-line)" strokeWidth={0.5} strokeDasharray="2 2" />
          ))}

          {(scene === 1 || scene >= 3) && (
            <path d={pathFor(SESSION_A)} fill="none" stroke="var(--color-accent)" strokeWidth={1.75} style={{ transition: 'opacity 400ms ease-out' }} />
          )}
          {(scene === 2 || scene >= 3) && (
            <path d={pathFor(SESSION_B)} fill="none" stroke="var(--color-down)" strokeWidth={1.75} strokeDasharray={scene >= 3 ? '3 2' : 'none'} style={{ transition: 'opacity 400ms ease-out' }} />
          )}

          {scene >= 4 && (
            <g style={{ transition: 'opacity 400ms ease-out' }}>
              <line
                x1={X_START}
                y1={priceY(99.5)}
                x2={X_END}
                y2={priceY(99.5)}
                stroke="var(--color-ink-faint)"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <text x={X_START} y={priceY(99.5) - 3} style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
                stop 99.50
              </text>
              {/* the point where Session B's path crosses below the stop, roughly index 6 of 10 */}
              <circle cx={X_START + 0.6 * (X_END - X_START)} cy={priceY(99)} r={3} fill="var(--color-down)" />
              <text
                x={X_START + 0.6 * (X_END - X_START)}
                y={priceY(99) + 14}
                textAnchor="middle"
                style={{ fontSize: 6.5, fontWeight: 700, fill: 'var(--color-down)' }}
              >
                stopped out
              </text>
            </g>
          )}

          <Candle x={172} />
          <text x={172} y={192} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
            the candle
          </text>
        </svg>
      )}
    />
  );
}
