'use client';

/**
 * ExpiryComparator — the widget the ITM-STT lesson turns on.
 *
 * Two exits from the same option position, side by side, both priced by the
 * real cost engine. Learners can move the premium and the intrinsic value and
 * watch the trap appear and disappear, which teaches the SHAPE of the danger
 * rather than one memorised anecdote.
 */
import { useMemo, useState } from 'react';
import { computeCost } from '@/lib/engine/costs';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function ExpiryComparator({
  premium: premium0 = 0.5,
  quantity: quantity0 = 375,
  intrinsic: intrinsic0 = 300,
}: {
  premium?: number;
  quantity?: number;
  intrinsic?: number;
}) {
  const [premium, setPremium] = useState(premium0);
  const [intrinsic, setIntrinsic] = useState(intrinsic0);
  const quantity = quantity0;

  const { exercised, traded, outlay, grossValue } = useMemo(() => {
    const base = {
      market: 'IN' as const,
      venue: 'NSE' as const,
      product: 'options' as const,
      quantity,
    };
    return {
      // Let it expire: STT on intrinsic value, no brokerage.
      exercised: computeCost({
        ...base,
        side: 'sell',
        price: premium,
        disposal: 'exercised',
        intrinsicPerUnit: intrinsic,
      }),
      // Square off: sell in the market at (roughly) intrinsic value.
      traded: computeCost({ ...base, side: 'sell', price: intrinsic }),
      outlay: premium * quantity,
      grossValue: intrinsic * quantity,
    };
  }, [premium, intrinsic, quantity]);

  const exerciseNet = grossValue - outlay - exercised.total;
  const tradeNet = grossValue - outlay - traded.total;
  const trapRatio = outlay > 0 ? exercised.total / outlay : 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            Premium paid: <span className="num text-ink">{inr(premium)}</span> per unit
          </span>
          <input
            type="range"
            min={0.25}
            max={200}
            step={0.25}
            value={premium}
            onChange={(e) => setPremium(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            Intrinsic value at expiry: <span className="num text-ink">{inr(intrinsic)}</span> per unit
          </span>
          <input
            type="range"
            min={0}
            max={600}
            step={5}
            value={intrinsic}
            onChange={(e) => setIntrinsic(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>
      </div>

      <p className="num mt-3 text-[13px] text-ink-faint">
        {quantity} units · paid {inr(outlay)} · worth {inr(grossValue)} at expiry
      </p>

      <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        <Column
          title="Let it expire"
          subtitle="Auto-exercised at intrinsic value"
          charge={exercised.total}
          chargeLabel="STT on intrinsic value"
          net={exerciseNet}
          bad={exercised.total > traded.total}
          lines={exercised.lines.map((l) => `${l.label}: ${inr(l.amount)}`)}
        />
        <Column
          title="Square off before 3:30"
          subtitle="Sold in the market at intrinsic"
          charge={traded.total}
          chargeLabel="STT on premium sold"
          net={tradeNet}
          bad={traded.total > exercised.total}
          lines={traded.lines.map((l) => `${l.label}: ${inr(l.amount)}`)}
        />
      </div>

      <div
        className="mt-4 rounded-lg px-4 py-3 text-[13px] leading-relaxed"
        style={{
          background: trapRatio > 0.5 ? 'rgba(255, 122, 92, 0.1)' : 'var(--color-surface-2)',
          color: 'var(--color-ink-muted)',
        }}
      >
        {trapRatio > 0.5 ? (
          <>
            <strong className="text-down">
              Exercise STT is {(trapRatio * 100).toFixed(0)}% of everything you put in.
            </strong>{' '}
            A cheap option that finishes deep in the money is the exact shape of this trap. The charge is indifferent to
            what you paid — it only looks at how far in the money you finished.
          </>
        ) : (
          <>
            At this premium the exercise charge is a manageable {(trapRatio * 100).toFixed(0)}% of your outlay. Drag the
            premium down and the intrinsic value up to see where it turns dangerous.
          </>
        )}
      </div>
    </div>
  );
}

function Column({
  title,
  subtitle,
  charge,
  chargeLabel,
  net,
  bad,
  lines,
}: {
  title: string;
  subtitle: string;
  charge: number;
  chargeLabel: string;
  net: number;
  bad: boolean;
  lines: string[];
}) {
  return (
    <div className="bg-surface p-4">
      <div className="font-medium">{title}</div>
      <div className="text-[11px] text-ink-faint">{subtitle}</div>
      <div className="mt-3 text-[11px] uppercase tracking-wider text-ink-faint">{chargeLabel}</div>
      <div className="num text-xl" style={{ color: bad ? 'var(--color-down)' : 'var(--color-ink)' }}>
        {inr(charge)}
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wider text-ink-faint">Net after costs</div>
      <div className="num text-lg" style={{ color: net >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
        {inr(net)}
      </div>
      <ul className="mt-3 space-y-0.5">
        {lines.map((l) => (
          <li key={l} className="num text-[11px] text-ink-faint">
            {l}
          </li>
        ))}
        {lines.length === 0 && <li className="text-[11px] text-ink-faint">No charges.</li>}
      </ul>
    </div>
  );
}
