'use client';

/**
 * RupeeCostExplainer — "a fixed rupee amount buys more units when they're
 * cheap", as a short animated walkthrough. Figures match the opening
 * predict in the same lesson (₹10,000/month at ₹100, ₹50, ₹100). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'You invest ₹10,000 a month, for three months.' },
  { id: 'm1', caption: 'Month 1: price ₹100. ₹10,000 buys 100 units.' },
  { id: 'm2', caption: 'Month 2: price drops to ₹50. The same ₹10,000 now buys 200 units.' },
  { id: 'm3', caption: 'Month 3: price ₹100 again. Another 100 units.' },
  { id: 'total', caption: '400 units for ₹30,000 — an average cost of ₹75, not the ₹83.33 simple average of the three prices.' },
  { id: 'why', caption: 'Simple average of ₹100, ₹50, ₹100 is ₹83.33. Your actual cost was lower, ₹75, because more money automatically bought units in the cheap month.' },
];

const MONTHS = [
  { price: 100, units: 100 },
  { price: 50, units: 200 },
  { price: 100, units: 100 },
];

const COL_X = [30, 100, 170];
const BASE_Y = 150;
const UNIT_SCALE = 0.55;

export function RupeeCostExplainer() {
  return (
    <SceneExplainer
      title="Why a fixed rupee amount buys more when it's cheap"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showMonth = scene; // scene 1 shows month 1, scene 2 shows months 1-2, etc.
        const showTotal = scene >= 4;

        if (scene === 5) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A comparison showing the simple average price of ₹83.33 against your actual, lower, weighted average cost of ₹75">
              <rect x={40} y={40} width={44} height={110} rx={4} fill="var(--color-ink-faint)" fillOpacity={0.5} />
              <text x={62} y={34} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-ink-muted)' }}>
                ₹83.33
              </text>
              <text x={62} y={166} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                simple average
              </text>

              <rect x={116} y={62} width={44} height={88} rx={4} fill="var(--color-up)" />
              <text x={138} y={56} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                ₹75
              </text>
              <text x={138} y={166} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                your actual cost
              </text>

              <line x1={20} y1={150} x2={180} y2={150} stroke="var(--color-line)" strokeWidth={1} />
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-up)' }}>
                Buying more when cheap pulled it down
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three months of a fixed ₹10,000 investment, buying more units when the price is lower">
            {MONTHS.map((m, i) => {
              const visible = showMonth >= i + 1;
              const h = m.units * UNIT_SCALE;
              return (
                <g key={i} style={{ transition: 'opacity 400ms ease-out' }} opacity={visible ? 1 : 0.15}>
                  <rect
                    x={COL_X[i] - 20}
                    y={BASE_Y - (visible ? h : 0)}
                    width={40}
                    height={visible ? h : 0}
                    rx={4}
                    fill="var(--color-accent)"
                    style={{ transition: 'height 500ms ease-out, y 500ms ease-out' }}
                  />
                  <text x={COL_X[i]} y={BASE_Y + 16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                    ₹{m.price}/unit
                  </text>
                  {visible && (
                    <text x={COL_X[i]} y={BASE_Y - h - 6} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                      {m.units} units
                    </text>
                  )}
                </g>
              );
            })}

            {showTotal && (
              <text x={100} y={190} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-up)' }}>
                400 units · avg ₹75
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
