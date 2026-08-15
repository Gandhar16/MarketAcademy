'use client';

import { useMemo, useState } from 'react';
import { computeCost, roundTripCost } from '@/lib/engine/costs';
import type { Product } from '@/lib/engine/costs/types';
import { CostLineLabel } from '@/components/glossary/CostLineLabel';

/**
 * The landing page's argument, made interactively rather than asserted.
 *
 * Every other platform tells you costs matter. This one lets you move a slider
 * and watch a ₹20 "zero brokerage" trade turn into a 0.4% headwind. The whole
 * calculation runs client-side against the same engine the simulator uses —
 * there is no separate marketing version of the maths.
 */
const PRODUCTS: { id: Product; label: string; note: string }[] = [
  { id: 'delivery', label: 'Delivery', note: 'Held overnight. STT on BOTH sides, plus DP charges on the sell.' },
  { id: 'intraday', label: 'Intraday', note: 'Squared off same day. STT on the sell side only.' },
  { id: 'options', label: 'Index options', note: '0.15% STT on premium — and far more if you let it expire ITM.' },
];

export function CostRealityCheck() {
  const [product, setProduct] = useState<Product>('intraday');
  const [value, setValue] = useState(100_000);
  const price = product === 'options' ? 120 : 1400;
  const quantity = Math.max(1, Math.floor(value / price));

  const rt = useMemo(
    () =>
      roundTripCost(
        { market: 'IN', venue: 'NSE', product, side: 'buy', price, quantity },
        price,
      ),
    [product, price, quantity],
  );

  const entry = useMemo(
    () => computeCost({ market: 'IN', venue: 'NSE', product, side: 'buy', price, quantity }),
    [product, price, quantity],
  );

  const inr = (n: number) =>
    n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-2">
        {PRODUCTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setProduct(p.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              product === p.id
                ? 'bg-accent text-on-emphasis font-medium'
                : 'border border-line-strong text-ink-muted hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink-muted">{PRODUCTS.find((p) => p.id === product)?.note}</p>

      <label className="mt-6 block">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">Position size</span>
        <input
          type="range"
          min={5_000}
          max={1_000_000}
          step={5_000}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-accent)]"
        />
        <span className="num mt-1 block text-lg">{inr(value)}</span>
      </label>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Round-trip cost" value={inr(rt.total)} />
        <Stat label="Breakeven move" value={`${rt.breakevenPercent.toFixed(3)}%`} emphasis />
        <Stat label="Per unit" value={inr(rt.breakevenMove)} />
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">Entry leg, itemised</div>
        <ul className="mt-2 space-y-1">
          {entry.lines.map((l) => (
            <li key={l.key} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-ink-muted">
                <CostLineLabel lineKey={l.key} label={l.label} />
                <span className="ml-2 text-[11px] text-ink-faint">{l.basis}</span>
              </span>
              <span className="num shrink-0">{inr(l.amount)}</span>
            </li>
          ))}
          {entry.lines.length === 0 && <li className="text-sm text-ink-faint">No charges on this leg.</li>}
        </ul>
      </div>

      {entry.notes.length > 0 && (
        <p className="mt-4 rounded-lg border border-accent-dim/40 bg-accent-dim/10 px-3 py-2 text-[13px] text-ink-muted">
          {entry.notes[0]}
        </p>
      )}

      <p className="mt-4 text-[11px] text-ink-faint">
        Statutory rates as of August 2026 — STT, exchange transaction charges, SEBI turnover fee, stamp duty, GST and
        DP charges, on a discount-broker plan. Same engine the simulator fills against.
      </p>
    </div>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-2 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className={`num mt-1 text-xl ${emphasis ? 'text-accent' : 'text-ink'}`}>{value}</div>
    </div>
  );
}
