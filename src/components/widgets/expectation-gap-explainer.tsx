'use client';

/**
 * ExpectationGapExplainer — "a price moves on the gap between reality and
 * expectation, not on the news itself", as a short animated walkthrough.
 * See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'expect15', caption: "Before the results: the crowd already expects Mango Motors' profit to grow by 15%." },
  { id: 'actual20', caption: 'The actual result comes in at 20% — genuinely excellent.' },
  { id: 'up', caption: '20% beats the 15% that was expected. The price rises.' },
  { id: 'reset', caption: 'Now imagine the crowd had expected 25% instead — a higher bar to clear.' },
  { id: 'actual20b', caption: 'The same 20% result — still a genuinely good year — comes in below that 25% expectation.' },
  { id: 'down', caption: 'The price falls this time, even though the company did just as well. It was never the number itself — it is the number minus what was already priced in.' },
  { id: 'compare', caption: 'Same 20% result, both times. Different expectation, different reaction. The gap to what was expected was the only thing that changed.' },
];

interface SceneState {
  expectation: number;
  actual: number | null;
  reaction: 'up' | 'down' | null;
}

const STATES: SceneState[] = [
  { expectation: 15, actual: null, reaction: null },
  { expectation: 15, actual: 20, reaction: null },
  { expectation: 15, actual: 20, reaction: 'up' },
  { expectation: 25, actual: null, reaction: null },
  { expectation: 25, actual: 20, reaction: null },
  { expectation: 25, actual: 20, reaction: 'down' },
];

/** Both scenarios' expectation, actual (always 20%) and reaction — for the final side-by-side synthesis scene. */
const COMPARISON = [
  { expectation: 15, reaction: 'up' as const },
  { expectation: 25, reaction: 'down' as const },
];

const BASE_Y = 176;
const SCALE = 4.4; // pixels per percentage point

function Bar({ x, percent, label, colour }: { x: number; percent: number; label: string; colour: string }) {
  const h = percent * SCALE;
  const y = BASE_Y - h;
  return (
    <g style={{ transition: 'all 500ms ease-out' }}>
      <rect x={x} y={y} width={36} height={h} rx={4} fill={colour} style={{ transition: 'y 500ms ease-out, height 500ms ease-out' }} />
      <text x={x + 18} y={y - 6} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-ink)', fontWeight: 600 }}>
        {percent}%
      </text>
      <text x={x + 18} y={BASE_Y + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
        {label}
      </text>
    </g>
  );
}

export function ExpectationGapExplainer() {
  return (
    <SceneExplainer
      title="What actually moves the price"
      scenes={SCENES}
      renderVisual={(scene) => {
        if (scene === 6) {
          // Two small mini-charts side by side, each a miniature of the
          // single-pair Bar diagram used above — the synthesis only lands if
          // both scenarios are visible at once, which the earlier one-pair-
          // at-a-time view deliberately never showed.
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two small side-by-side scenarios, both a 20% result, one beating a 15% expectation and rising, the other missing a 25% expectation and falling">
              {COMPARISON.map((c, i) => {
                const cx = i === 0 ? 50 : 150;
                const expH = c.expectation * 3.2;
                const actH = 20 * 3.2;
                const base = 150;
                const up = c.reaction === 'up';
                return (
                  <g key={c.expectation}>
                    <rect x={cx - 26} y={base - expH} width={18} height={expH} rx={3} fill="var(--color-ink-faint)" />
                    <rect x={cx + 8} y={base - actH} width={18} height={actH} rx={3} fill="var(--color-accent)" />
                    <text x={cx} y={base + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                      expected {c.expectation}%
                    </text>
                    <text
                      x={cx}
                      y={base - Math.max(expH, actH) - 8}
                      textAnchor="middle"
                      style={{ fontSize: 12, fontWeight: 700, fill: up ? 'var(--color-up)' : 'var(--color-down)' }}
                    >
                      {up ? '↑' : '↓'}
                    </text>
                  </g>
                );
              })}
              <line x1={100} y1={20} x2={100} y2={168} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="3 3" />
              <text x={100} y={188} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-ink)' }}>
                Both are the same 20% result
              </text>
            </svg>
          );
        }

        const state = STATES[scene];
        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two bars, expected profit growth and actual profit growth, with the gap between them driving the price">
            <line x1={10} y1={BASE_Y} x2={190} y2={BASE_Y} stroke="var(--color-line)" strokeWidth={1} />

            <Bar x={44} percent={state.expectation} label="Expected" colour="var(--color-ink-faint)" />
            {state.actual != null && <Bar x={112} percent={state.actual} label="Actual" colour="var(--color-accent)" />}

            {state.reaction && (
              <text
                x={100}
                y={24}
                textAnchor="middle"
                style={{ fontSize: 13, fontWeight: 700, fill: state.reaction === 'up' ? 'var(--color-up)' : 'var(--color-down)' }}
              >
                Price {state.reaction === 'up' ? '↑ rises' : '↓ falls'}
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
