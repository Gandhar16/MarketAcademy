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
import type {
  BandScene,
  BarsScene,
  ChainScene,
  CompareScene,
  Glyph,
  LadderScene,
  Scene,
  Tone,
} from '@/content/explainers';

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
    case 'compare':
      return <CompareView scene={scene} elapsed={t} />;
    case 'band':
      return <BandView scene={scene} elapsed={t} />;
  }
}

// ── band ────────────────────────────────────────────────────────────────────

function BandView({ scene, elapsed }: { scene: BandScene; elapsed: number }) {
  // Drawn a little wider than the band itself, so the edges are visibly edges
  // rather than the ends of the picture. A band that fills the frame reads as
  // "anything can happen"; the whole lesson is that it cannot.
  const pad = (scene.upper - scene.lower) * 0.18;
  const min = scene.lower - pad;
  const span = scene.upper + pad - min;
  const pos = (price: number) => ((price - min) / span) * 100;

  const open = easeOut(at(elapsed, 0.1, 0.7));
  const marker = easeOut(at(elapsed, 1.0, 0.5));
  const verdict = at(elapsed, 1.7, 0.5);

  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <div className="flex items-baseline justify-between text-xs text-ink-faint">
        <span>
          Allowed range today: <span className="num text-ink">±{scene.bandPercent}%</span> of yesterday&apos;s close
        </span>
        <span className="num">
          reference {scene.reference.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Three bands of vertical space that never overlap: the marker sits
          above the track, the edge labels below it. Stacking them by hand
          rather than by flow, because every element is positioned by price and
          only the container knows where that is. */}
      <div className="relative h-[7.5rem]">
        {/* Everything outside the band. Where trading simply cannot happen. */}
        <div className="absolute inset-x-0 top-11 h-6 rounded-full bg-surface-2" />

        {/* The band itself, opening outward from the reference — the shape of
            the arithmetic that produced it. */}
        <div
          className="absolute top-11 h-6 rounded-full bg-accent/25"
          style={{
            left: `${pos(scene.reference) - (pos(scene.reference) - pos(scene.lower)) * open}%`,
            right: `${100 - pos(scene.reference) - (pos(scene.upper) - pos(scene.reference)) * open}%`,
          }}
        />

        {/* The reference itself — the close everything today is measured from. */}
        <div
          className="absolute top-11 h-6 w-px bg-ink-faint/50"
          style={{ left: `${pos(scene.reference)}%`, opacity: open }}
        />

        {[
          { price: scene.lower, label: 'lower circuit' },
          { price: scene.upper, label: 'upper circuit' },
        ].map((edge) => (
          <div
            key={edge.label}
            className="absolute top-10 -translate-x-1/2"
            style={{ left: `${pos(edge.price)}%`, opacity: open }}
          >
            <div className="mx-auto h-8 w-0.5 bg-down" />
            <p className="mt-1.5 whitespace-nowrap text-center text-[10px] uppercase tracking-wider text-down">
              {edge.label}
            </p>
            <p className="num whitespace-nowrap text-center text-xs text-ink">
              {edge.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}

        {scene.at != null && (
          <div
            className="absolute top-0"
            style={{ left: `${pos(scene.at)}%`, opacity: marker, transform: `translateX(-50%) scale(${marker})` }}
          >
            <p className="num whitespace-nowrap text-center text-xs text-accent">
              where it is:{' '}
              {scene.at.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mx-auto mt-1 h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-accent" />
          </div>
        )}
      </div>

      {scene.verdict && (
        <p
          style={{ opacity: verdict }}
          className="rounded-xl border border-down/40 bg-down/5 px-4 py-2.5 text-center text-sm text-ink"
        >
          {scene.verdict}
        </p>
      )}
    </div>
  );
}

// ── compare ─────────────────────────────────────────────────────────────────

/**
 * Line drawings for the everyday half of a comparison.
 *
 * Drawn rather than photographed, and drawn in code rather than shipped as
 * files, for the reason every other picture on this site is: they inherit the
 * theme, they are sharp at any size, and they weigh nothing. They are also
 * deliberately crude. A photograph of a house would be somebody's actual house
 * and would invite the viewer to study it; a five-line sketch says "property"
 * and gets out of the way of the sentence next to it, which is the part doing
 * the teaching.
 *
 * `currentColor` throughout, so a glyph is whatever colour its panel is.
 */
const GLYPHS: Record<Glyph, React.ReactNode> = {
  house: (
    <>
      <path d="M4 13 L16 4 L28 13" />
      <path d="M7 13 V27 H25 V13" />
      <path d="M14 27 V19 H18 V27" />
    </>
  ),
  taxi: (
    <>
      <path d="M3 20 h26" />
      <path d="M5 20 v-4 l3-5 h16 l3 5 v4" />
      <path d="M12 11 v-3 h8 v3" />
      <circle cx="9.5" cy="23" r="2.5" />
      <circle cx="22.5" cy="23" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="16" cy="16" r="11" />
      <path d="M16 9 V16 L21 19" />
    </>
  ),
  receipt: (
    <>
      <path d="M8 4 h16 v24 l-3-2 -2.5 2 -2.5-2 -2.5 2 -2.5-2 -3 2 Z" />
      <path d="M12 11 h8 M12 16 h8 M12 21 h5" />
    </>
  ),
  exchange: (
    <>
      <path d="M5 11 h18 l-4-4 M5 11 l4 4" />
      <path d="M27 21 H9 l4 4 M27 21 l-4-4" />
    </>
  ),
  queue: (
    <>
      <circle cx="8" cy="9" r="3" />
      <path d="M3.5 20 v-3 a4.5 4.5 0 0 1 9 0 v3" />
      <circle cx="24" cy="9" r="3" />
      <path d="M19.5 20 v-3 a4.5 4.5 0 0 1 9 0 v3" />
      <path d="M13 26 h6" />
    </>
  ),
  vault: (
    <>
      <rect x="4" y="6" width="24" height="20" rx="2" />
      <circle cx="16" cy="16" r="5.5" />
      <path d="M16 10.5 V6.5 M16 25.5 V21.5 M10.5 16 H6.5 M25.5 16 H21.5" />
    </>
  ),
  token: (
    <>
      <circle cx="16" cy="16" r="10" />
      <circle cx="16" cy="16" r="6" />
      <path d="M16 6 V2 M16 30 V26" />
    </>
  ),
};

function CompareView({ scene, elapsed }: { scene: CompareScene; elapsed: number }) {
  // The everyday side lands first, alone, for most of a second. That ordering
  // is the entire teaching move: the viewer recognises something they already
  // understand before being shown the thing they do not.
  const left = easeOut(at(elapsed, 0, 0.5));
  const right = easeOut(at(elapsed, 0.8, 0.5));
  const caveat = at(elapsed, 1.9, 0.5);

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div
          style={{ opacity: left, transform: `translateY(${(1 - left) * 8}px)` }}
          className="rounded-xl border border-line bg-surface-2 px-4 py-3"
        >
          <div className="flex items-center gap-2 text-ink-faint">
            <svg
              viewBox="0 0 32 32"
              className="h-9 w-9 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {GLYPHS[scene.glyph]}
            </svg>
            <span className="text-[10px] uppercase tracking-[0.18em]">Something you already know</span>
          </div>
          <p className="mt-2 text-sm leading-snug text-ink">{scene.everyday}</p>
        </div>

        <div
          style={{ opacity: right, transform: `translateY(${(1 - right) * 8}px)` }}
          className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3"
        >
          <p className="text-[10px] uppercase tracking-[0.18em] text-accent">In the market</p>
          <p className="mt-2 text-sm leading-snug text-ink">{scene.market}</p>
        </div>
      </div>

      {/* Where it stops being true. Always shown, never optional — an analogy
          presented only working teaches the analogy instead of the thing. */}
      <div
        style={{ opacity: caveat }}
        className="rounded-xl border border-line/60 bg-surface px-4 py-2.5"
      >
        <span className="text-[10px] uppercase tracking-[0.18em] text-down">Where the comparison breaks</span>
        <p className="mt-1 text-xs leading-snug text-ink-muted">{scene.breaks}</p>
      </div>
    </div>
  );
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

  // A side can be empty, and that is not an edge case — it is the whole picture
  // of a locked circuit: orders stacked on one side and nobody at all on the
  // other. The `, 1` floor matters because `Math.max()` of nothing is -Infinity,
  // which would silently make every bar NaN wide.
  const maxQty = Math.max(...scene.bids.map((b) => b.qty), ...scene.asks.map((a) => a.qty), 1);

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
        {levels.length === 0 && (
          <p className="rounded border border-dashed border-line px-2 py-3 text-center text-xs text-ink-faint">
            nobody
          </p>
        )}
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
