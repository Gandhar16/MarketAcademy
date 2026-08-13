'use client';

/**
 * Cost widgets.
 *
 * All three run the real engine in the browser. There is deliberately no
 * "example numbers" path — if a Budget changes STT tomorrow, these widgets and
 * the simulator change together, because they are the same code.
 */
import { useMemo, useState } from 'react';
import { computeCost, roundTripCost } from '@/lib/engine/costs';
import { BROKER_IN_DISCOUNT, BROKER_IN_FULL_SERVICE } from '@/lib/engine/costs/india';
import type { CostBreakdown, Market, Product, Venue } from '@/lib/engine/costs/types';

const money = (n: number, currency: 'INR' | 'USD') =>
  n.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });

const PAYEE_LABEL: Record<string, string> = {
  broker: 'Your broker',
  exchange: 'The exchange',
  regulator: 'The regulator',
  government: 'The government',
  depository: 'The depository',
};

const PAYEE_COLOUR: Record<string, string> = {
  broker: 'var(--color-accent)',
  exchange: 'var(--color-info)',
  regulator: '#a78bfa',
  government: 'var(--color-down)',
  depository: 'var(--color-up)',
};

// ── CostBreakdownTable ──────────────────────────────────────────────────────

export interface CostBreakdownTableProps {
  market: Market;
  venue: Venue;
  product: Product;
  price: number;
  quantity: number;
  /** Show entry and exit side by side, which is where delivery STT doubles up. */
  showBothLegs?: boolean;
}

export function CostBreakdownTable(props: CostBreakdownTableProps) {
  const { market, venue, product, price, quantity, showBothLegs = false } = props;

  const entry = useMemo(
    () => computeCost({ market, venue, product, side: 'buy', price, quantity }),
    [market, venue, product, price, quantity],
  );
  const exit = useMemo(
    () => computeCost({ market, venue, product, side: 'sell', price, quantity }),
    [market, venue, product, price, quantity],
  );

  const legs = showBothLegs
    ? [
        { label: 'Buy leg', b: entry },
        { label: 'Sell leg', b: exit },
      ]
    : [{ label: 'This order', b: entry }];

  const total = legs.reduce((s, l) => s + l.b.total, 0);
  const currency = entry.currency;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm text-ink-muted">
          {quantity.toLocaleString('en-IN')} units at {money(price, currency)} ={' '}
          <span className="num text-ink">{money(price * quantity, currency)}</span>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">{venue} · {product}</div>
      </div>

      <div className={`mt-4 grid gap-6 ${showBothLegs ? 'md:grid-cols-2' : ''}`}>
        {legs.map(({ label, b }) => (
          <div key={label}>
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
            <ul className="mt-2 space-y-1.5">
              {b.lines.map((l) => (
                <li key={l.key} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 text-sm">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: PAYEE_COLOUR[l.payee] }}
                    title={PAYEE_LABEL[l.payee]}
                  />
                  <span className="text-ink-muted">
                    {l.label}
                    <span className="ml-1.5 text-[11px] text-ink-faint">{l.basis}</span>
                  </span>
                  <span className="num shrink-0">{money(l.amount, b.currency)}</span>
                </li>
              ))}
              {b.lines.length === 0 && <li className="text-sm text-ink-faint">No charges on this leg.</li>}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-2 text-sm">
              <span className="text-ink-muted">Leg total</span>
              <span className="num">{money(b.total, b.currency)}</span>
            </div>
          </div>
        ))}
      </div>

      {showBothLegs && (
        <div className="mt-5 flex items-baseline justify-between rounded-lg bg-surface-2 px-4 py-3">
          <span className="text-sm text-ink-muted">Round trip, price unchanged</span>
          <span className="num text-lg text-down">−{money(total, currency)}</span>
        </div>
      )}

      <Legend />
      <Notes breakdown={entry} extra={showBothLegs ? exit : undefined} />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
      {Object.entries(PAYEE_LABEL).map(([k, label]) => (
        <span key={k} className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span className="h-2 w-2 rounded-full" style={{ background: PAYEE_COLOUR[k] }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function Notes({ breakdown, extra }: { breakdown: CostBreakdown; extra?: CostBreakdown }) {
  const notes = [...breakdown.notes, ...(extra?.notes ?? [])];
  if (notes.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {notes.map((n) => (
        <li key={n} className="rounded-lg border border-accent-dim/40 bg-accent-dim/10 px-3 py-2 text-[13px] text-ink-muted">
          {n}
        </li>
      ))}
    </ul>
  );
}

// ── CostComparator ──────────────────────────────────────────────────────────

export interface CostComparatorProps {
  market: Market;
  scenarios: { label: string; product: Product }[];
  price: number;
  turnover: number;
}

export function CostComparator({ market, scenarios, price, turnover }: CostComparatorProps) {
  const quantity = Math.max(1, Math.floor(turnover / price));

  const rows = scenarios.map((s) => {
    const rt = roundTripCost(
      { market, venue: market === 'IN' ? 'NSE' : 'US', product: s.product, side: 'buy', price, quantity },
      price,
    );
    return { ...s, rt };
  });

  const worst = Math.max(...rows.map((r) => r.rt.total));

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-sm text-ink-muted">
        Same idea, same {money(price * quantity, rows[0].rt.currency)} position. Only the product differs.
      </div>
      <div className="mt-4 space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between text-sm">
              <span>{r.label}</span>
              <span className="num">
                {money(r.rt.total, r.rt.currency)}
                <span className="ml-2 text-ink-faint">{r.rt.breakevenPercent.toFixed(3)}% to break even</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(r.rt.total / worst) * 100}%`,
                  background: r.rt.total === worst ? 'var(--color-down)' : 'var(--color-accent)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-ink-faint">
        Round trip at an unchanged price, discount-broker plan, statutory rates as of August 2026.
      </p>
    </div>
  );
}

// ── BreakevenSlider ─────────────────────────────────────────────────────────

export interface BreakevenSliderProps {
  market: Market;
  product: Product;
  price: number;
  minValue: number;
  maxValue: number;
}

export function BreakevenSlider({ market, product, price, minValue, maxValue }: BreakevenSliderProps) {
  const [value, setValue] = useState(Math.round((minValue + maxValue) / 4));
  const quantity = Math.max(1, Math.floor(value / price));
  const venue: Venue = market === 'IN' ? 'NSE' : 'US';

  const rt = useMemo(
    () => roundTripCost({ market, venue, product, side: 'buy', price, quantity }, price),
    [market, venue, product, price, quantity],
  );

  const severity =
    rt.breakevenPercent > 0.5 ? 'var(--color-down)' : rt.breakevenPercent > 0.15 ? 'var(--color-accent)' : 'var(--color-up)';

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">Position size</span>
        <input
          type="range"
          min={minValue}
          max={maxValue}
          step={Math.max(1000, Math.round((maxValue - minValue) / 200))}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-accent)]"
        />
      </label>

      {/* Three currency figures side by side overflow a 360px phone. One column
          below sm, three above; the numbers stay tabular either way. */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Cell label="Position" value={money(quantity * price, rt.currency)} />
        <Cell label="Round-trip cost" value={money(rt.total, rt.currency)} />
        <Cell label="Breakeven move" value={`${rt.breakevenPercent.toFixed(3)}%`} colour={severity} />
      </div>

      <p className="mt-4 text-[13px] text-ink-muted">
        {rt.breakevenPercent > 0.5
          ? 'At this size the costs are a serious headwind — most realistic intraday targets are smaller than this.'
          : rt.breakevenPercent > 0.15
            ? 'Costs are noticeable here. Worth checking against your expected move before entering.'
            : 'Costs are small relative to a normal move at this size.'}
      </p>
    </div>
  );
}

function Cell({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="num mt-0.5 text-base" style={colour ? { color: colour } : undefined}>
        {value}
      </div>
    </div>
  );
}

// ── BrokerComparator (used by the Cost Cutter game and T1 checkpoint) ────────

export function BrokerComparator({ price, quantity }: { price: number; quantity: number }) {
  const plans = [BROKER_IN_DISCOUNT, BROKER_IN_FULL_SERVICE];
  const rows = plans.map((p) => ({
    plan: p,
    rt: roundTripCost(
      { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price, quantity, brokerage: p },
      price,
    ),
  }));
  const cheapest = Math.min(...rows.map((r) => r.rt.total));

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="space-y-3">
        {rows.map(({ plan, rt }) => (
          <div key={plan.id} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-ink-muted">{plan.label}</span>
            <span className="num" style={{ color: rt.total === cheapest ? 'var(--color-up)' : 'var(--color-down)' }}>
              {money(rt.total, rt.currency)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] text-ink-muted">
        Difference on this one round trip:{' '}
        <span className="num text-ink">{money(Math.max(...rows.map((r) => r.rt.total)) - cheapest, 'INR')}</span>. The
        statutory charges are identical at both — brokers pass those through unchanged.
      </p>
    </div>
  );
}
