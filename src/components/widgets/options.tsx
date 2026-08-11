'use client';

/**
 * Options widgets: a greeks explorer you can drag, and a payoff chart you can
 * build leg by leg.
 *
 * Both price with Black–Scholes, which is a MODEL and is labelled as one. The
 * greeks it produces are the correct mental model for how an option behaves,
 * which is what T3 needs to teach — the formula itself is not the lesson.
 */
import { useMemo, useState } from 'react';
import {
  blackScholesPrice,
  daysToYears,
  greeks,
  intrinsicValue,
  payoffProfile,
  STRATEGY_TEMPLATES,
  type Leg,
  type OptionType,
} from '@/lib/engine/options';

const RATE = 0.065;

// ── GreeksExplorer ──────────────────────────────────────────────────────────

export function GreeksExplorer({
  strike = 24_000,
  spot: spot0 = 24_000,
  days: days0 = 30,
  iv: iv0 = 14,
  type: type0 = 'call',
}: {
  strike?: number;
  spot?: number;
  days?: number;
  iv?: number;
  type?: OptionType;
}) {
  const [spot, setSpot] = useState(spot0);
  const [days, setDays] = useState(days0);
  const [iv, setIv] = useState(iv0);
  const [type, setType] = useState<OptionType>(type0);

  const inputs = useMemo(
    () => ({ spot, strike, timeToExpiry: daysToYears(days), volatility: iv / 100, rate: RATE, type }),
    [spot, strike, days, iv, type],
  );

  const price = blackScholesPrice(inputs);
  const g = greeks(inputs);
  const intrinsic = intrinsicValue(spot, strike, type);
  const timeValue = Math.max(0, price - intrinsic);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        {(['call', 'put'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="num rounded-md px-3 py-1.5 text-[12px] uppercase transition-colors"
            style={{
              background: type === t ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: type === t ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
            }}
          >
            {t}
          </button>
        ))}
        <span className="num ml-2 text-[12px] text-ink-faint">strike {strike.toLocaleString('en-IN')}</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Slider label="Spot" value={spot} min={strike * 0.85} max={strike * 1.15} step={strike * 0.001}
          onChange={setSpot} format={(v) => v.toLocaleString('en-IN', { maximumFractionDigits: 0 })} />
        <Slider label="Days to expiry" value={days} min={0} max={90} step={1} onChange={setDays}
          format={(v) => String(v)} />
        <Slider label="Implied volatility" value={iv} min={5} max={60} step={0.5} onChange={setIv}
          format={(v) => `${v}%`} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Big label="Option price" value={price.toFixed(2)} />
        <Big label="Intrinsic" value={intrinsic.toFixed(2)} muted />
        <Big label="Time value" value={timeValue.toFixed(2)} muted />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        <Greek label="Delta" value={g.delta.toFixed(3)} note="per ₹1 of spot" />
        <Greek label="Gamma" value={g.gamma.toFixed(5)} note="delta change per ₹1" />
        <Greek label="Theta" value={g.theta.toFixed(2)} note="per day" tone={g.theta < 0 ? 'down' : undefined} />
        <Greek label="Vega" value={g.vega.toFixed(2)} note="per 1% of IV" />
        <Greek label="Rho" value={g.rho.toFixed(3)} note="per 1% of rate" />
      </div>

      <p className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
        {days <= 1
          ? 'At expiry the option is worth exactly its intrinsic value. All the time value is gone, gamma has collapsed to a step function, and delta is either 0 or 1. This is why expiry day behaves nothing like the rest of the option’s life.'
          : timeValue > intrinsic && intrinsic > 0
            ? 'Time value still exceeds intrinsic value — you are paying more for the possibility than for what the option is already worth.'
            : intrinsic === 0
              ? `Entirely time value. If the spot does not move past ${strike.toLocaleString('en-IN')}, every rupee of this premium decays to zero — currently at ${Math.abs(g.theta).toFixed(2)} per day, and accelerating.`
              : 'Mostly intrinsic value now. The option is behaving increasingly like the underlying itself — note how delta has climbed toward 1.'}
      </p>

      <p className="mt-3 text-[11px] text-ink-faint">
        Priced with Black–Scholes at a {(RATE * 100).toFixed(1)}% risk-free rate and no dividend. This is a{' '}
        <strong>model</strong> — real option prices differ, especially far from the money and close to expiry.
      </p>
    </div>
  );
}

// ── PayoffChart ─────────────────────────────────────────────────────────────

const DEFAULT_LEGS: Leg[] = [{ type: 'call', quantity: 1, strike: 24_000, premium: 180 }];

export function PayoffChart({
  legs: legs0 = DEFAULT_LEGS,
  centre = 24_000,
  editable = true,
  template,
}: {
  legs?: Leg[];
  centre?: number;
  editable?: boolean;
  template?: string;
}) {
  const [legs, setLegs] = useState<Leg[]>(legs0);

  const { range, profile } = useMemo(() => {
    const r = { from: centre * 0.88, to: centre * 1.12, steps: 240 };
    return { range: r, profile: payoffProfile(legs, r) };
  }, [legs, centre]);

  const width = 720;
  const height = 240;
  const payoffs = profile.points.map((p) => p.payoff);
  const lo = Math.min(...payoffs, 0);
  const hi = Math.max(...payoffs, 0);
  const pad = (hi - lo) * 0.1 || 1;

  const x = (spot: number) => ((spot - range.from) / (range.to - range.from)) * width;
  const y = (p: number) => height - ((p - (lo - pad)) / (hi + pad - (lo - pad))) * height;

  const path = profile.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.spot).toFixed(1)},${y(p.payoff).toFixed(1)}`).join(' ');
  const zeroY = y(0);

  const update = (i: number, patch: Partial<Leg>) =>
    setLegs((ls) => ls.map((l, n) => (n === i ? { ...l, ...patch } : l)));

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      {template && STRATEGY_TEMPLATES[template] && (
        <p className="mb-3 text-[13px] text-ink-muted">{STRATEGY_TEMPLATES[template].describe}</p>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Payoff at expiry">
        {/* profit above the line, loss below — shaded so the shape reads instantly */}
        <defs>
          <clipPath id="above">
            <rect x={0} y={0} width={width} height={Math.max(0, zeroY)} />
          </clipPath>
          <clipPath id="below">
            <rect x={0} y={Math.max(0, zeroY)} width={width} height={Math.max(0, height - zeroY)} />
          </clipPath>
        </defs>
        <path d={`${path} L${width},${zeroY} L0,${zeroY} Z`} fill="var(--color-up)" opacity={0.16} clipPath="url(#above)" />
        <path d={`${path} L${width},${zeroY} L0,${zeroY} Z`} fill="var(--color-down)" opacity={0.16} clipPath="url(#below)" />

        <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="var(--color-line-strong)" strokeDasharray="4 4" />
        {legs.filter((l) => l.strike).map((l, i) => (
          <line key={i} x1={x(l.strike as number)} y1={0} x2={x(l.strike as number)} y2={height}
            stroke="var(--color-line)" />
        ))}
        {profile.breakevens.map((b) => (
          <g key={b}>
            <line x1={x(b)} y1={0} x2={x(b)} y2={height} stroke="var(--color-accent)" strokeDasharray="2 3" />
            <text x={x(b) + 4} y={14} fill="var(--color-accent)" fontSize={11} className="num">
              {b.toFixed(0)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2} />
      </svg>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Big
          label="Max profit"
          value={profile.maxProfit == null ? 'Unlimited' : profile.maxProfit.toFixed(0)}
          tone="up"
        />
        <Big
          label="Max loss"
          value={profile.maxLoss == null ? 'Unlimited' : profile.maxLoss.toFixed(0)}
          tone="down"
        />
        <Big
          label="Breakeven"
          value={profile.breakevens.length ? profile.breakevens.map((b) => b.toFixed(0)).join(' / ') : '—'}
        />
      </div>

      {profile.unlimitedLoss && (
        <p className="mt-3 rounded-lg border border-down/50 bg-down/10 px-3 py-2 text-[13px] text-ink-muted">
          This structure loses without limit as the underlying rises. Whatever premium you collected is the most you can
          ever make; the most you can lose has no number.
        </p>
      )}

      {editable && (
        <div className="mt-4 space-y-2">
          {legs.map((leg, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg bg-surface-2 p-2">
              <MiniSelect value={leg.type} onChange={(v) => update(i, { type: v as Leg['type'] })}
                options={['call', 'put', 'stock']} />
              <MiniSelect value={leg.quantity > 0 ? 'buy' : 'sell'}
                onChange={(v) => update(i, { quantity: v === 'buy' ? Math.abs(leg.quantity) : -Math.abs(leg.quantity) })}
                options={['buy', 'sell']} />
              {leg.type !== 'stock' && (
                <MiniNumber label="strike" value={leg.strike ?? centre} onChange={(v) => update(i, { strike: v })} />
              )}
              <MiniNumber label={leg.type === 'stock' ? 'price' : 'premium'} value={leg.premium}
                onChange={(v) => update(i, { premium: v })} />
              <MiniNumber label="qty" value={Math.abs(leg.quantity)}
                onChange={(v) => update(i, { quantity: leg.quantity < 0 ? -Math.abs(v) : Math.abs(v) })} />
              <button
                onClick={() => setLegs((ls) => ls.filter((_, n) => n !== i))}
                className="ml-auto text-[12px] text-ink-faint underline underline-offset-2 hover:text-down"
              >
                remove
              </button>
            </div>
          ))}

          <button
            onClick={() => setLegs((ls) => [...ls, { type: 'call', quantity: -1, strike: centre * 1.03, premium: 90 }])}
            className="rounded-lg border border-line-strong px-3 py-1.5 text-[13px] text-ink-muted hover:text-ink"
          >
            + add a leg
          </button>
        </div>
      )}

      <p className="mt-3 text-[11px] text-ink-faint">
        Payoff at expiry, per unit of the underlying. Bounds are derived from the legs, not read off the edge of the
        chart — so &ldquo;unlimited&rdquo; here genuinely means unlimited.
      </p>
    </div>
  );
}

// ── shared ──────────────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-ink-faint">
        {label}: <span className="num text-ink">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--color-accent)]" />
    </label>
  );
}

function Big({ label, value, tone, muted }: { label: string; value: string; tone?: 'up' | 'down'; muted?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className="num mt-0.5 text-lg"
        style={{
          color: tone === 'up' ? 'var(--color-up)' : tone === 'down' ? 'var(--color-down)' : muted ? 'var(--color-ink-muted)' : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Greek({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'down' }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="num mt-0.5 text-sm" style={tone === 'down' ? { color: 'var(--color-down)' } : undefined}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-ink-faint">{note}</div>
    </div>
  );
}

function MiniSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="num rounded-md border border-line bg-surface px-2 py-1 text-[12px] uppercase text-ink-muted outline-none">
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function MiniNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase tracking-wider text-ink-faint">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="num mt-0.5 block w-24 rounded-md border border-line bg-surface px-2 py-1 text-[12px] outline-none"
      />
    </label>
  );
}
