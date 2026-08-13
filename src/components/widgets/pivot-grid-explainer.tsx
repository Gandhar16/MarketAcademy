'use client';

/**
 * PivotGridExplainer — "five levels, computed from yesterday before a
 * single trade happens today", as a short animated walkthrough. Figures
 * match the worked example in the same lesson (high ₹512, low ₹498, close
 * ₹505). See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'yesterday', caption: "Yesterday: high ₹512, low ₹498, close ₹505." },
  { id: 'formula', caption: "Before today's market even opens, a fixed formula turns those three numbers into five levels." },
  { id: 'grid', caption: 'Pivot ₹505, R1 ₹512, S1 ₹498, R2 ₹519, S2 ₹491.' },
  { id: 'nothing-new', caption: 'Not one number here came from today — it is yesterday\'s data, repackaged.' },
  { id: 'reaction', caption: 'Once trading starts, price often pauses or reverses right at R1 or S1 — not magic, just thousands of desks watching the exact same five numbers and reacting near them.' },
  { id: 'lesson', caption: 'It matters anyway, because thousands of desks compute the exact same five numbers off the exact same prior day.' },
];

const priceY = (p: number) => 178 - ((p - 486) / (524 - 486)) * 158;

export function PivotGridExplainer() {
  return (
    <SceneExplainer
      title="Five levels, computed before the bell"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showYesterday = scene >= 0;
        const showArrow = scene === 1;
        const showGrid = scene >= 2 && scene !== 4;
        const dimYesterday = scene >= 2;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Today's price approaching the R1 level and reacting there, because many desks are watching the same computed level">
              <line x1={20} y1={priceY(512)} x2={180} y2={priceY(512)} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="3 2" />
              <text x={182} y={priceY(512) + 3} style={{ fontSize: 7, fill: 'var(--color-accent)', fontWeight: 700 }}>
                R1 · 512
              </text>
              <path
                d={`M 20 ${priceY(500)} L 70 ${priceY(505)} L 120 ${priceY(511)} L 150 ${priceY(510)} L 180 ${priceY(506)}`}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={2}
              />
              <circle cx={120} cy={priceY(511)} r={3.5} fill="var(--color-down)" />
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                stalls right at R1
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Yesterday's high, low and close feeding a formula that produces five levels for today, before the market opens">
            {showYesterday && (
              <g style={{ transition: 'opacity 400ms ease-out', opacity: dimYesterday ? 0.35 : 1 }}>
                <text x={40} y={12} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  yesterday
                </text>
                <circle cx={40} cy={priceY(512)} r={3} fill="var(--color-ink)" />
                <text x={48} y={priceY(512) + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  high 512
                </text>
                <circle cx={40} cy={priceY(505)} r={3} fill="var(--color-ink)" />
                <text x={48} y={priceY(505) + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  close 505
                </text>
                <circle cx={40} cy={priceY(498)} r={3} fill="var(--color-ink)" />
                <text x={48} y={priceY(498) + 3} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  low 498
                </text>
              </g>
            )}

            {showArrow && (
              <text x={100} y={102} textAnchor="middle" style={{ fontSize: 16, fill: 'var(--color-accent)' }}>
                →
              </text>
            )}

            {showGrid && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                {[
                  { label: 'R2', price: 519 },
                  { label: 'R1', price: 512 },
                  { label: 'P', price: 505 },
                  { label: 'S1', price: 498 },
                  { label: 'S2', price: 491 },
                ].map((l) => (
                  <g key={l.label}>
                    <line x1={110} y1={priceY(l.price)} x2={185} y2={priceY(l.price)} stroke={l.label === 'P' ? 'var(--color-accent)' : 'var(--color-line-strong)'} strokeWidth={1.5} />
                    <text x={106} y={priceY(l.price) + 3} textAnchor="end" style={{ fontSize: 7.5, fill: 'var(--color-ink)', fontWeight: 600 }}>
                      {l.label}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
