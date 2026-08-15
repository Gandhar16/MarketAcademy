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
 * Every scene is keyed on its index by the player, so remounting replays the
 * animation from the start. That is what makes scrubbing backwards work: the
 * scene does not have to know it has been seen before.
 */
import { motion, useReducedMotion } from 'framer-motion';
import type { BarsScene, ChainScene, LadderScene, Scene, Tone } from '@/content/explainers';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-ink-faint/50',
  cost: 'bg-accent/70',
  good: 'bg-up/70',
  bad: 'bg-down/70',
};

export function SceneView({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case 'chain':
      return <ChainView scene={scene} />;
    case 'bars':
      return <BarsView scene={scene} />;
    case 'ladder':
      return <LadderView scene={scene} />;
  }
}

// ── chain ───────────────────────────────────────────────────────────────────

function ChainView({ scene }: { scene: ChainScene }) {
  const reduced = useReducedMotion();

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
          return (
            <li key={step.label} className="flex flex-1 items-center gap-1 sm:flex-col sm:gap-2">
              <motion.div
                initial={reduced ? false : { opacity: 0.4, scale: 0.97 }}
                animate={{ opacity: reached ? 1 : 0.4, scale: current ? 1 : 0.97 }}
                transition={{ duration: 0.4, delay: reduced ? 0 : Math.min(i, scene.at) * 0.18 }}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-center sm:w-full ${
                  current ? 'border-accent bg-accent/10' : reached ? 'border-line-strong bg-surface-2' : 'border-line bg-surface'
                }`}
              >
                <span className={`block text-sm ${current ? 'text-accent' : 'text-ink'}`}>{step.label}</span>
                {step.sub && <span className="mt-0.5 block text-xs leading-snug text-ink-faint">{step.sub}</span>}
              </motion.div>

              {i < scene.steps.length - 1 && (
                <span aria-hidden className={`text-lg ${i < scene.at ? 'text-accent' : 'text-ink-faint/40'}`}>
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── bars ────────────────────────────────────────────────────────────────────

function BarsView({ scene }: { scene: BarsScene }) {
  const reduced = useReducedMotion();
  const scale = Math.max(scene.scaleTo, ...scene.bars.map((b) => b.value), 1);
  const dp = scene.precision ?? 2;

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {scene.bars.map((bar, i) => {
        const pct = Math.max(0, Math.min(100, (bar.value / scale) * 100));
        return (
          <div key={`${bar.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-sm text-ink">{bar.label}</span>
              <motion.span
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: reduced ? 0 : 0.15 + i * 0.12 }}
                className="num shrink-0 text-sm text-ink-muted"
              >
                {scene.unit ?? ''}
                {bar.value.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}
              </motion.span>
            </div>

            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={reduced ? { width: `${pct}%` } : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : i * 0.12, ease: 'easeOut' }}
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

function LadderView({ scene }: { scene: LadderScene }) {
  const reduced = useReducedMotion();
  const eaten = consumeLevels(scene.asks, scene.taking ?? 0);

  const maxQty = Math.max(...scene.bids.map((b) => b.qty), ...scene.asks.map((a) => a.qty));

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Side heading="Wanting to buy" levels={scene.bids} maxQty={maxQty} tone="up" align="right" reduced={reduced} />
        <Side
          heading="Wanting to sell"
          levels={scene.asks}
          maxQty={maxQty}
          tone="down"
          align="left"
          reduced={reduced}
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
  reduced,
  eaten,
}: {
  heading: string;
  levels: { price: number; qty: number }[];
  maxQty: number;
  tone: 'up' | 'down';
  align: 'left' | 'right';
  reduced: boolean | null;
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
          return (
            <div
              key={level.price}
              className={`relative overflow-hidden rounded px-2 py-1 ${align === 'right' ? 'text-right' : ''}`}
            >
              <motion.div
                aria-hidden
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${(level.qty / maxQty) * 100}%` }}
                transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : i * 0.08 }}
                className={`absolute inset-y-0 ${align === 'right' ? 'right-0' : 'left-0'} ${
                  tone === 'up' ? 'bg-up/15' : 'bg-down/15'
                }`}
              />
              {consumed > 0 && (
                <motion.div
                  aria-hidden
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${(consumed / maxQty) * 100}%` }}
                  transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.5 + i * 0.15 }}
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
