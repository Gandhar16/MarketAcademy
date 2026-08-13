'use client';

/**
 * LockedQueueExplainer — "a locked circuit means no exit, not a bad price
 * — your stop triggered and became a sell order that simply sits there",
 * as a short animated walkthrough. Figures match the worked example in the
 * same lesson (500 shares at ₹400, three consecutive 20%-down locked
 * days, planned ₹16,000 loss versus an actual loss near ₹98,000). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: '500 shares at ₹400 — ₹2,00,000. Your stop is set at 8% down, as planned.' },
  { id: 'day1', caption: 'Day 1: locked at 20% down. Your sell order joins the queue. No fill.' },
  { id: 'day2', caption: 'Day 2: still locked. Still queued. The stop has not protected you at all.' },
  { id: 'day3', caption: 'Day 3: the first session where a sale becomes possible again.' },
  { id: 'size', caption: 'The only real defence is decided before entry: size small enough in an illiquid or volatile name that even a locked-circuit scenario is survivable, because the stop cannot be relied on to work.' },
  { id: 'lesson', caption: 'Planned loss: ₹16,000. Actual loss: about ₹98,000 — and no rule was broken.' },
];

export function LockedQueueExplainer() {
  return (
    <SceneExplainer
      title="A stop that triggers and simply waits"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const values = [200000, 160000, 128000, 102500, 102500];
        const idx = Math.min(scene, 4);
        const v = values[idx];
        const h = (v / 200000) * 130;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Sizing a position small enough that even a locked-circuit scenario stays survivable, decided before entry">
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Decided before entry
              </text>
              <rect x={30} y={50} width={140} height={40} rx={8} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1.5} />
              <text x={100} y={74} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-accent)' }}>
                size for the locked scenario
              </text>
              <text x={100} y={140} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                not the calm one
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A 200,000 rupee holding shrinking through three consecutive locked-circuit days while a stop order sits queued and unfilled">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {scene === 0 ? 'Holding value' : `After day ${Math.min(scene, 3)}`}
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={80} y={baseY - h} width={44} height={h} rx={4} fill={idx >= 1 ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
            <text x={102} y={baseY - h - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              ₹{v.toLocaleString('en-IN')}
            </text>

            {idx >= 1 && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={40} x2={190} y2={40} stroke="var(--color-ink-faint)" strokeWidth={1} strokeDasharray="3 2" />
                <text x={100} y={34} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  order queued, no buyer
                </text>
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={186} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                planned −₹16,000 · actual ≈ −₹98,000
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
