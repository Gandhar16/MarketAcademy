'use client';

/**
 * PatternRarityExplainer — "each extra condition shrinks the pool
 * multiplicatively, so a three-candle pattern is intrinsically rarer than a
 * one-candle pattern", as a short animated walkthrough. See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'hammer', caption: 'A hammer needs just ONE candle to look a certain way.' },
  { id: 'hammer-fires', caption: 'Plenty of bars qualify — it fires often.' },
  { id: 'star', caption: 'A morning star needs THREE specific candles to all line up, in sequence.' },
  { id: 'star-fires', caption: 'Each extra condition shrinks the pool — multiplicatively, not by addition.' },
  { id: 'ratio', caption: 'On this same stretch of history, the hammer fired 7 times and the morning star fired 2 — the single-candle pattern reached a usable sample about 3.5 times faster.' },
  { id: 'lesson', caption: 'Both need the same 30-occurrence floor to mean anything — the three-candle pattern reaches it far less often.' },
];

const BARS = Array.from({ length: 20 }, (_, i) => i);
// which bar-indices qualify as a "hammer" (one-candle) vs a "morning star" start (three-candle, needs i,i+1,i+2)
const HAMMER_HITS = new Set([1, 3, 6, 9, 11, 14, 17]);
const STAR_STARTS = new Set([5, 13]);

export function PatternRarityExplainer() {
  return (
    <SceneExplainer
      title="Why a three-candle pattern is rarer by construction"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showHammerHits = scene === 1;
        const showStar = scene >= 2 && scene !== 4;
        const showStarHits = scene >= 3 && scene !== 4;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two bars, 7 hammer matches and 2 morning star matches, showing the hammer reaches a usable sample about 3.5 times faster">
              <rect x={40} y={150 - 7 * 12} width={36} height={7 * 12} rx={4} fill="var(--color-up)" />
              <text x={58} y={166} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                hammer: 7
              </text>
              <rect x={124} y={150 - 2 * 12} width={36} height={2 * 12} rx={4} fill="var(--color-accent)" />
              <text x={142} y={166} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                star: 2
              </text>
              <text x={100} y={40} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-up)' }}>
                3.5×
              </text>
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                faster to a usable sample
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A row of twenty candles, with many qualifying as a single-candle hammer and only two three-candle groups qualifying as a morning star">
            {BARS.map((i) => {
              const x = 8 + i * 9.5;
              const isHammerHit = showHammerHits && HAMMER_HITS.has(i);
              const isStarHit = showStarHits && Array.from(STAR_STARTS).some((s) => i >= s && i <= s + 2);
              const highlighted = isHammerHit || isStarHit;
              return (
                <rect
                  key={i}
                  x={x}
                  y={70}
                  width={7}
                  height={40}
                  rx={1.5}
                  fill={highlighted ? (showStar ? 'var(--color-accent)' : 'var(--color-up)') : 'var(--color-surface-2)'}
                  stroke="var(--color-line)"
                  strokeWidth={0.5}
                  style={{ transition: 'fill 400ms ease-out' }}
                />
              );
            })}

            <text x={100} y={140} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {showStar ? '2 morning-star matches (6 candles)' : showHammerHits ? '7 hammer matches' : '20 candles of history'}
            </text>

            {scene === 5 && (
              <text x={100} y={160} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                7 vs. 2 — same 30-occurrence floor
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
