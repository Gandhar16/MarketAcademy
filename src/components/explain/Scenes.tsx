'use client';

/**
 * The three things an explainer scene is allowed to draw.
 *
 * Each one depicts a MECHANISM — a chain of intermediaries, a total split into
 * its parts, a queue of resting orders. None of them draws a price path, and
 * there is deliberately no scene kind that could: a drawn price line is
 * invented market data, which PLAN.md §7.1 forbids outright. See the header of
 * `src/content/explainers.ts` for the full argument.
 *
 * WHY THERE IS NO ANIMATION LIBRARY IN HERE ANY MORE
 *
 * Every scene is a pure function of `elapsed` — seconds since this scene came
 * on screen. Nothing in this file reads the wall clock, starts a transition, or
 * remembers that it has been mounted before.
 *
 * That is not tidiness for its own sake. It is the single requirement for
 * rendering these to a video file: a frame renderer asks for "the picture at
 * t = 3.7s" out of order, on a machine with no clock running, and must get the
 * same pixels every time. An animation library that tracks `performance.now()`
 * cannot answer that question — it can only answer "the picture 3.7 seconds
 * after you asked me to start", which is a different thing and is why
 * time-based animation renders as a still frame or a stutter.
 *
 * The site player and the video renderer are therefore two clocks driving one
 * set of components, rather than two sets of components that have to be kept
 * looking alike. See `remotion/Root.tsx`.
 *
 * It also fixed a real bug for free: scrubbing backwards used to need the scene
 * to remount so it would replay. Now scrubbing to t = 3.7s simply draws t=3.7s.
 */
import type { BarsScene, ChainScene, LadderScene, Scene, Tone } from '@/content/explainers';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-ink-faint/50',
  cost: 'bg-accent/70',
  good: 'bg-up/70',
  bad: 'bg-down/70',
};

/**
 * How far through one staggered element we are, 0→1.
 *
 * `elapsed`, `delay` and `duration` are all in seconds, which is why the
 * numbers at the call sites still read the way they did when a library owned
 * them. Clamped at both ends, so a scene held past its authored length simply
 * sits at its finished state rather than overshooting.
 */
function at(elapsed: number, delay: number, duration: number): number {
  if (duration <= 0) return elapsed >= delay ? 1 : 0;
  return Math.max(0, Math.min(1, (elapsed - delay) / duration));
}

/** Cubic ease-out. Fast start, settled end — how things stop in the physical world. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * A scene, drawn at one moment.
 *
 * `elapsed` is seconds since this scene appeared. `reduced` collapses every
 * stagger to its finished state in one place, which is both the accessibility
 * behaviour and, conveniently, the thumbnail.
 */
export interface SceneProps {
  scene: Scene;
  elapsed: number;
  reduced?: boolean;
}

export function SceneView({ scene, elapsed, reduced = false }: SceneProps) {
  // One place to honour the preference: pretend the whole scene has finished.
  const t = reduced ? Number.POSITIVE_INFINITY : elapsed;

  switch (scene.kind) {
    case 'chain':
      return <ChainView scene={scene} elapsed={t} />;
    case 'bars':
      return <BarsView scene={scene} elapsed={t} />;
    case 'ladder':
      return <LadderView scene={scene} elapsed={t} />;
  }
}

// ── chain ───────────────────────────────────────────────────────────────────

function ChainView({ scene, elapsed }: { scene: ChainScene; elapsed: number }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {scene.token && (
        <p className="text-center text-xs uppercase tracking-[0.2em] text-ink-faint">
          following: <span className="num text-accent">{scene.token}</span>
        </p>
      )}

      <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-1">
        {scene.steps.map((step, i) => {
          const reached = i <= scene.at;
          const current = i === scene.at;

          // Steps light up in order, so the eye follows the token along the
          // chain rather than being handed the finished picture at once.
          const p = easeOut(at(elapsed, Math.min(i, scene.at) * 0.18, 0.4));
          const opacity = reached ? 0.4 + 0.6 * p : 0.4;
          const scale = current ? 0.97 + 0.03 * p : 0.97;

          return (
            <li key={step.label} className="flex flex-1 items-center gap-1 sm:flex-col sm:gap-2">
              <div
                style={{ opacity, transform: `scale(${scale})` }}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-center sm:w-full ${
                  current
                    ? 'border-accent bg-accent/10'
                    : reached
                      ? 'border-line-strong bg-surface-2'
                      : 'border-line bg-surface'
                }`}
              >
                <span className={`block text-sm ${current ? 'text-accent' : 'text-ink'}`}>{step.label}</span>
                {step.sub && <span className="mt-0.5 block text-xs leading-snug text-ink-faint">{step.sub}</span>}
              </div>

              {/* The last step keeps the arrow's space rather than dropping it.
                  Without this the final box stretches to fill the row on its
                  own and ends up visibly taller than its neighbours — barely
                  noticeable in a card, obvious in a 1080p frame. */}
              <span
                aria-hidden
                className={`text-lg ${
                  i === scene.steps.length - 1 ? 'invisible' : i < scene.at ? 'text-accent' : 'text-ink-faint/40'
                }`}
              >
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── bars ────────────────────────────────────────────────────────────────────

function BarsView({ scene, elapsed }: { scene: BarsScene; elapsed: number }) {
  const scale = Math.max(scene.scaleTo, ...scene.bars.map((b) => b.value), 1);
  const dp = scene.precision ?? 2;

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {scene.bars.map((bar, i) => {
        const pct = Math.max(0, Math.min(100, (bar.value / scale) * 100));
        const grow = easeOut(at(elapsed, i * 0.12, 0.7));
        const label = at(elapsed, 0.15 + i * 0.12, 0.3);

        return (
          <div key={`${bar.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-sm text-ink">{bar.label}</span>
              <span style={{ opacity: label }} className="num shrink-0 text-sm text-ink-muted">
                {scene.unit ?? ''}
                {bar.value.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}
              </span>
            </div>

            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div
                style={{ width: `${pct * grow}%` }}
                className={`h-full rounded-full ${TONE_CLASS[bar.tone ?? 'neutral']}`}
              />
            </div>

            {bar.note && <p className="mt-1 text-xs text-ink-faint">{bar.note}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── ladder ──────────────────────────────────────────────────────────────────

/**
 * How much of each ask level a market buy of `taking` units eats, cheapest
 * first. Worked out rather than authored, so the arithmetic a caption claims
 * and the shading on screen cannot drift apart.
 *
 * Module-level and pure: running this inside the component meant carrying a
 * running total in a `let` across a `.map` callback, which is a mutation during
 * render and is exactly what `react-hooks/immutability` exists to catch.
 */
function consumeLevels(levels: { qty: number }[], taking: number): number[] {
  return levels.reduce<{ taken: number[]; left: number }>(
    (acc, level) => {
      const take = Math.min(acc.left, level.qty);
      return { taken: [...acc.taken, take], left: acc.left - take };
    },
    { taken: [], left: taking },
  ).taken;
}

function LadderView({ scene, elapsed }: { scene: LadderScene; elapsed: number }) {
  const eaten = consumeLevels(scene.asks, scene.taking ?? 0);
  const maxQty = Math.max(...scene.bids.map((b) => b.qty), ...scene.asks.map((a) => a.qty));

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Side heading="Wanting to buy" levels={scene.bids} maxQty={maxQty} tone="up" align="right" elapsed={elapsed} />
        <Side
          heading="Wanting to sell"
          levels={scene.asks}
          maxQty={maxQty}
          tone="down"
          align="left"
          elapsed={elapsed}
          eaten={eaten}
        />
      </div>

      {scene.taking != null && (
        <p className="text-center text-xs text-ink-faint">
          Shaded: the {scene.taking.toLocaleString('en-IN')} units a market buy takes, working up from the cheapest
          seller.
        </p>
      )}
    </div>
  );
}

function Side({
  heading,
  levels,
  maxQty,
  tone,
  align,
  elapsed,
  eaten,
}: {
  heading: string;
  levels: { price: number; qty: number }[];
  maxQty: number;
  tone: 'up' | 'down';
  align: 'left' | 'right';
  elapsed: number;
  eaten?: number[];
}) {
  return (
    <div>
      <p className={`text-[10px] uppercase tracking-wider text-ink-faint ${align === 'right' ? 'text-right' : ''}`}>
        {heading}
      </p>
      <div className="mt-1.5 space-y-1">
        {levels.map((level, i) => {
          const consumed = eaten?.[i] ?? 0;

          // The resting depth draws first; only once it is there does the order
          // visibly eat into it. Reversing that reads as the book appearing
          // already half-consumed, which is the wrong story.
          const depth = easeOut(at(elapsed, i * 0.08, 0.5));
          const bite = easeOut(at(elapsed, 0.5 + i * 0.15, 0.5));

          return (
            <div
              key={level.price}
              className={`relative overflow-hidden rounded px-2 py-1 ${align === 'right' ? 'text-right' : ''}`}
            >
              <div
                aria-hidden
                style={{ width: `${(level.qty / maxQty) * 100 * depth}%` }}
                className={`absolute inset-y-0 ${align === 'right' ? 'right-0' : 'left-0'} ${
                  tone === 'up' ? 'bg-up/15' : 'bg-down/15'
                }`}
              />
              {consumed > 0 && (
                <div
                  aria-hidden
                  style={{ width: `${(consumed / maxQty) * 100 * bite}%` }}
                  className={`absolute inset-y-0 ${align === 'right' ? 'right-0' : 'left-0'} bg-accent/35`}
                />
              )}
              <span className="num relative text-xs text-ink">{level.price.toFixed(2)}</span>
              <span className="num relative ml-2 text-xs text-ink-faint">{level.qty.toLocaleString('en-IN')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
