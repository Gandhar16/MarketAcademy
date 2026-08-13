'use client';

/**
 * SurvivorshipExplainer — "the database only contains companies that
 * survived, which guarantees a flattering answer whatever the rule was",
 * as a short animated walkthrough. See `scene-explainer.tsx` for the
 * shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'all', caption: 'You screen today\'s listed companies and test a rule against the last ten years.' },
  { id: 'delisted', caption: "But some of those companies did not survive the ten years — they failed, and were delisted." },
  { id: 'gone', caption: 'Today\'s database only contains the survivors.' },
  { id: 'brilliant', caption: 'The rule looks brilliant — because every failure that might have disproven it was already removed.' },
  { id: 'fraction', caption: 'In this stretch, roughly a third of companies did not survive — and not one of them shows up in a screen built from today\'s database.' },
  { id: 'lesson', caption: 'This is invisible unless you go looking for it — in nearly every free database, by default.' },
];

const DOTS = Array.from({ length: 24 }, (_, i) => ({
  x: 20 + (i % 6) * 30,
  y: 30 + Math.floor(i / 6) * 30,
  failed: i % 5 === 2 || i % 7 === 4,
}));

export function SurvivorshipExplainer() {
  return (
    <SceneExplainer
      title="Why a screen tested on today's survivors flatters itself"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showFailedMark = scene === 1;
        const hideFailed = scene >= 2;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A grid of companies, some marked as delisted and removed, leaving only survivors in the visible database">
            {DOTS.map((d, i) => {
              if (hideFailed && d.failed) return null;
              return (
                <g key={i} style={{ transition: 'opacity 400ms ease-out' }}>
                  <circle cx={d.x} cy={d.y} r={7} fill={d.failed && showFailedMark ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={d.failed && showFailedMark ? 0.3 : 0.85} />
                  {d.failed && showFailedMark && (
                    <text x={d.x} y={d.y + 3} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                      ✕
                    </text>
                  )}
                </g>
              );
            })}

            {scene >= 3 && scene !== 4 && (
              <text x={100} y={192} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                only the survivors remain visible
              </text>
            )}

            {scene === 4 && (
              <text x={100} y={192} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                8 of 24 gone — about a third
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
