'use client';

/**
 * Payoff Builder — construct a named structure from legs and be graded on the
 * SHAPE, not on whether you memorised the recipe.
 *
 * Grading compares your payoff curve against the target's at sampled prices,
 * so any economically equivalent construction passes. That matters: a bull call
 * spread and a bull put spread have the same shape, and a learner who builds
 * the other one has understood more, not less.
 */
import { useMemo, useState } from 'react';
import { payoffProfile, strategyPayoff, STRATEGY_TEMPLATES, type Leg } from '@/lib/engine/options';

const CENTRE = 24_000;
const STEP = CENTRE * 0.01;

interface Challenge {
  id: string;
  target: Leg[];
  brief: string;
}

/** The target structures, in ascending order of how much thought they need. */
const CHALLENGES: Challenge[] = [
  {
    id: 'long-call',
    brief: 'Unlimited profit if it rises. Loss capped at what you paid. The simplest bullish bet there is.',
    target: [{ type: 'call', quantity: 1, strike: CENTRE, premium: 180 }],
  },
  {
    id: 'bull-call-spread',
    brief: 'Bullish, but cheaper than a long call — and you give up everything above the higher strike.',
    target: [
      { type: 'call', quantity: 1, strike: CENTRE, premium: 180 },
      { type: 'call', quantity: -1, strike: CENTRE + 2 * STEP, premium: 70 },
    ],
  },
  {
    id: 'straddle',
    brief: 'You expect a big move and have no idea which way. Profit either side, loss if nothing happens.',
    target: [
      { type: 'call', quantity: 1, strike: CENTRE, premium: 180 },
      { type: 'put', quantity: 1, strike: CENTRE, premium: 160 },
    ],
  },
  {
    id: 'iron-condor',
    brief: 'You expect nothing to happen. Profit is capped and small; loss is capped and larger. Four legs.',
    target: [
      { type: 'put', quantity: 1, strike: CENTRE - 3 * STEP, premium: 40 },
      { type: 'put', quantity: -1, strike: CENTRE - 1.5 * STEP, premium: 95 },
      { type: 'call', quantity: -1, strike: CENTRE + 1.5 * STEP, premium: 95 },
      { type: 'call', quantity: 1, strike: CENTRE + 3 * STEP, premium: 40 },
    ],
  },
];

/** Sample both curves and compare. Equivalent constructions score equally. */
function shapeMatch(built: Leg[], target: Leg[]): number {
  if (built.length === 0) return 0;
  const samples = 60;
  const from = CENTRE * 0.85;
  const to = CENTRE * 1.15;

  let worst = 0;
  let scale = 1;
  for (let i = 0; i <= samples; i++) {
    const spot = from + ((to - from) * i) / samples;
    const a = strategyPayoff(built, spot);
    const b = strategyPayoff(target, spot);
    worst = Math.max(worst, Math.abs(a - b));
    scale = Math.max(scale, Math.abs(b));
  }
  // Within 12% of the target's own scale at every sampled price counts as a match.
  return Math.max(0, 1 - worst / (scale * 1.2));
}

export function PayoffBuilder() {
  const [level, setLevel] = useState(0);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState<string[]>([]);

  const challenge = CHALLENGES[level];
  const template = STRATEGY_TEMPLATES[challenge.id];

  const match = useMemo(() => shapeMatch(legs, challenge.target), [legs, challenge]);
  const passed = match >= 0.88;

  const built = useMemo(
    () => payoffProfile(legs.length ? legs : [{ type: 'call', quantity: 0, strike: CENTRE, premium: 0 }], {
      from: CENTRE * 0.85,
      to: CENTRE * 1.15,
      steps: 200,
    }),
    [legs],
  );
  const target = useMemo(
    () => payoffProfile(challenge.target, { from: CENTRE * 0.85, to: CENTRE * 1.15, steps: 200 }),
    [challenge],
  );

  const addLeg = (type: 'call' | 'put', direction: 1 | -1) =>
    setLegs((ls) => [
      ...ls,
      { type, quantity: direction, strike: CENTRE, premium: type === 'call' ? 180 : 160 },
    ]);

  const update = (i: number, patch: Partial<Leg>) =>
    setLegs((ls) => ls.map((l, n) => (n === i ? { ...l, ...patch } : l)));

  const nextLevel = () => {
    setSolved((s) => (s.includes(challenge.id) ? s : [...s, challenge.id]));
    setLevel((l) => l + 1);
    setLegs([]);
    setChecked(false);
  };

  if (level >= CHALLENGES.length) {
    return (
      <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
        <div className="text-[11px] uppercase tracking-wider text-accent">All structures built</div>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          You built {solved.length} of {CHALLENGES.length} shapes from legs rather than from memory. That distinction
          matters: the names are arbitrary and there are dozens of them, but there are only two building blocks and two
          directions. Anyone who can read a payoff diagram can derive every named strategy on demand — and, more
          usefully, can tell at a glance which ones have an unbounded loss hiding in them.
        </p>
        <button
          onClick={() => {
            setLevel(0);
            setLegs([]);
            setChecked(false);
            setSolved([]);
          }}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis"
        >
          Start again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {CHALLENGES.map((c, i) => (
          <div
            key={c.id}
            className="h-1 flex-1 rounded-full"
            style={{ background: i < level ? 'var(--color-up)' : i === level ? 'var(--color-accent)' : 'var(--color-line)' }}
          />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-[11px] uppercase tracking-wider text-accent">
          Build: {template?.label ?? challenge.id}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">{challenge.brief}</p>

        <Chart built={built} target={target} showTarget />

        <div className="mt-4 flex flex-wrap gap-2">
          <Add label="+ buy call" onClick={() => addLeg('call', 1)} />
          <Add label="+ sell call" onClick={() => addLeg('call', -1)} />
          <Add label="+ buy put" onClick={() => addLeg('put', 1)} />
          <Add label="+ sell put" onClick={() => addLeg('put', -1)} />
          {legs.length > 0 && (
            <button
              onClick={() => {
                setLegs([]);
                setChecked(false);
              }}
              className="ml-auto text-[13px] text-ink-faint underline underline-offset-2 hover:text-down"
            >
              clear
            </button>
          )}
        </div>

        {legs.length > 0 && (
          <div className="mt-3 space-y-2">
            {legs.map((leg, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-2 p-2 text-[13px]">
                <span
                  className="num w-20 uppercase"
                  style={{ color: leg.quantity > 0 ? 'var(--color-up)' : 'var(--color-down)' }}
                >
                  {leg.quantity > 0 ? 'buy' : 'sell'} {leg.type}
                </span>
                <label className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-ink-faint">strike</span>
                  <input
                    type="range"
                    min={CENTRE - 4 * STEP}
                    max={CENTRE + 4 * STEP}
                    step={STEP / 2}
                    value={leg.strike}
                    onChange={(e) => {
                      update(i, { strike: Number(e.target.value) });
                      setChecked(false);
                    }}
                    className="w-40 accent-[var(--color-accent)]"
                  />
                  <span className="num w-16">{leg.strike?.toFixed(0)}</span>
                </label>
                <button
                  onClick={() => {
                    setLegs((ls) => ls.filter((_, n) => n !== i));
                    setChecked(false);
                  }}
                  className="ml-auto text-[12px] text-ink-faint hover:text-down"
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setChecked(true)}
            disabled={legs.length === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis disabled:opacity-30"
          >
            Check my shape
          </button>
          {checked && (
            <span className="num text-sm" style={{ color: passed ? 'var(--color-up)' : 'var(--color-down)' }}>
              {(match * 100).toFixed(0)}% match
            </span>
          )}
        </div>

        {checked && (
          <div className="mt-4 border-t border-line pt-4">
            {passed ? (
              <>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  <span className="text-up">That is the shape. </span>
                  {template?.describe} Max profit{' '}
                  <span className="num">{built.maxProfit == null ? 'unlimited' : built.maxProfit.toFixed(0)}</span>, max
                  loss <span className="num">{built.maxLoss == null ? 'unlimited' : built.maxLoss.toFixed(0)}</span>.
                </p>
                <button onClick={nextLevel} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis">
                  {level === CHALLENGES.length - 1 ? 'Finish' : 'Next structure'}
                </button>
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Not there yet. Compare your solid line against the dashed target: where they diverge tells you what is
                missing. If your line keeps rising where the target flattens, you need a SHORT leg above to cap it. If
                it falls away where the target flattens, you need a LONG leg to stop the bleeding.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chart({
  built,
  target,
  showTarget,
}: {
  built: ReturnType<typeof payoffProfile>;
  target: ReturnType<typeof payoffProfile>;
  showTarget?: boolean;
}) {
  const width = 720;
  const height = 220;
  const all = [...built.points.map((p) => p.payoff), ...target.points.map((p) => p.payoff), 0];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo) * 0.12 || 1;

  const from = target.points[0].spot;
  const to = target.points[target.points.length - 1].spot;
  const x = (s: number) => ((s - from) / (to - from)) * width;
  const y = (p: number) => height - ((p - (lo - pad)) / (hi + pad - (lo - pad))) * height;
  const line = (pts: { spot: number; payoff: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.spot).toFixed(1)},${y(p.payoff).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label="Payoff shape versus target">
      <line x1={0} y1={y(0)} x2={width} y2={y(0)} stroke="var(--color-line-strong)" strokeDasharray="4 4" />
      {showTarget && (
        <path d={line(target.points)} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="6 4" opacity={0.75} />
      )}
      <path d={line(built.points)} fill="none" stroke="var(--color-ink)" strokeWidth={2} />
    </svg>
  );
}

function Add({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-line-strong px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
    >
      {label}
    </button>
  );
}
