'use client';

/**
 * BarCompressionExplainer — "the same real trading, compressed into fewer
 * bars as the interval widens", as a short animated walkthrough. See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'session', caption: 'An NSE session runs 375 minutes — 9:15 to 15:30.' },
  { id: 'oneminute', caption: 'A 1-minute candle compresses exactly one of those minutes.' },
  { id: 'daily', caption: 'A daily candle compresses the entire session — all 375 minutes, into one shape.' },
  { id: 'weekly', caption: 'A weekly candle can compress up to five daily sessions — or fewer, around a holiday.' },
  { id: 'tradeoff', caption: 'A 1-minute chart shows every wobble inside the day — more noise, more decisions to make. A daily chart shows one clean shape — less noise, but slower to react to anything.' },
  { id: 'lesson', caption: 'The underlying trading never changes. Only how much of it fits inside one bar does.' },
];

function MiniCandle({ x, y, up, w = 8, h = 20 }: { x: number; y: number; up: boolean; w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={1.5} fill={up ? 'var(--color-up)' : 'var(--color-down)'} />;
}

export function BarCompressionExplainer() {
  return (
    <SceneExplainer
      title="What one bar compresses"
      scenes={SCENES}
      renderVisual={(scene) => {
        if (scene === 0) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A row of tick marks representing 375 minutes of trading in one session">
              {Array.from({ length: 25 }, (_, i) => (
                <rect key={i} x={12 + i * 7.2} y={90} width={4} height={24} rx={1} fill="var(--color-ink-faint)" />
              ))}
              <text x={100} y={140} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}>
                375 minutes of trading
              </text>
            </svg>
          );
        }
        if (scene === 1) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="One tick highlighted, representing a single one-minute candle">
              {Array.from({ length: 25 }, (_, i) => (
                <rect key={i} x={12 + i * 7.2} y={90} width={4} height={24} rx={1} fill={i === 12 ? 'var(--color-accent)' : 'var(--color-ink-faint)'} fillOpacity={i === 12 ? 1 : 0.35} />
              ))}
              <text x={100} y={140} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-accent)', fontWeight: 600 }}>
                1 candle = 1 minute
              </text>
            </svg>
          );
        }
        if (scene === 2) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="All 375 minute-ticks collapsing into a single daily candle">
              <MiniCandle x={92} y={70} up w={16} h={60} />
              <text x={100} y={148} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                1 candle = 375 minutes
              </text>
            </svg>
          );
        }
        if (scene === 4) {
          const noisy = 'M 16 130 L 30 100 L 44 140 L 58 90 L 72 120 L 86 70 L 100 110 L 114 60 L 128 95 L 142 50 L 156 80 L 170 40';
          const smooth = 'M 16 140 L 100 90 L 170 40';
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A jagged 1-minute price line next to the same move drawn as one smooth daily shape">
              <path d={noisy} fill="none" stroke="var(--color-down)" strokeWidth={1.5} />
              <text x={16} y={160} style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 600 }}>
                1-minute: noisy
              </text>
              <path d={smooth} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} transform="translate(0, 18)" />
              <text x={16} y={182} style={{ fontSize: 7, fill: 'var(--color-accent)', fontWeight: 600 }}>
                daily: one clean shape
              </text>
            </svg>
          );
        }
        // scene 3 & 5: five daily candles, one greyed for a holiday, collapsing to one weekly candle
        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Five daily candles, one greyed out for a holiday, next to the single weekly candle they compress into">
            {[0, 1, 2, 3, 4].map((i) => (
              <MiniCandle key={i} x={16 + i * 20} y={90} up={i % 2 === 0} w={14} h={i === 2 ? 12 : 40} />
            ))}
            <text x={56} y={148} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
              5 days (1 holiday)
            </text>
            <text x={140} y={110} style={{ fontSize: 16, fill: 'var(--color-ink-faint)' }}>
              →
            </text>
            <MiniCandle x={160} y={75} up w={18} h={55} />
            <text x={169} y={148} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)', fontWeight: 600 }}>
              1 weekly candle
            </text>
          </svg>
        );
      }}
    />
  );
}
