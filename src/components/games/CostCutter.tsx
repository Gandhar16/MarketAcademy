'use client';

/**
 * Cost Cutter — trains cost-drag awareness.
 *
 * The mechanic: a fixed trade idea, and four levers (product, broker, size,
 * number of trips). The learner tries to hit a target cost. They discover that
 * the biggest lever is almost never the one they reach for first — it is the
 * number of round trips, then the product, then the broker, and size barely
 * matters at all in percentage terms once you are above the flat-fee floor.
 */
import { useMemo, useState } from 'react';
import { roundTripCost } from '@/lib/engine/costs';
import { BROKER_IN_DISCOUNT, BROKER_IN_FULL_SERVICE } from '@/lib/engine/costs/india';
import type { BrokeragePlan, Product } from '@/lib/engine/costs/types';
import type { TradeRecord } from '@/lib/progress/mastery';
import { RunSubmit } from './RunSubmit';

const PRODUCTS: { id: Product; label: string }[] = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'intraday', label: 'Intraday' },
];
const BROKERS: BrokeragePlan[] = [BROKER_IN_DISCOUNT, BROKER_IN_FULL_SERVICE];
const TRIPS = [1, 4, 20, 100];

/** The learner is trying to get total annual cost under this share of capital. */
const TARGET_PERCENT = 1.0;

export function CostCutter() {
  const [product, setProduct] = useState<Product>('delivery');
  const [brokerId, setBrokerId] = useState(BROKER_IN_DISCOUNT.id);
  const [capital, setCapital] = useState(200_000);
  const [trips, setTrips] = useState(20);

  const broker = BROKERS.find((b) => b.id === brokerId) ?? BROKER_IN_DISCOUNT;
  const price = 1400;
  const quantity = Math.max(1, Math.floor(capital / price));

  const perTrip = useMemo(
    () =>
      roundTripCost(
        { market: 'IN', venue: 'NSE', product, side: 'buy', price, quantity, brokerage: broker },
        price,
      ),
    [product, broker, quantity],
  );

  const annual = perTrip.total * trips;
  const annualPercent = (annual / capital) * 100;
  const passed = annualPercent <= TARGET_PERCENT;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="text-sm text-ink-muted">
          You have <span className="num text-ink">₹{capital.toLocaleString('en-IN')}</span> and an idea you believe in.
          Get your total annual cost under{' '}
          <span className="num text-accent">{TARGET_PERCENT}%</span> of capital — because anything above that is a
          headwind your edge has to overcome before it earns you a rupee.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Lever label="Product">
            <Chips
              options={PRODUCTS.map((p) => ({ id: p.id, label: p.label }))}
              value={product}
              onChange={(v) => setProduct(v as Product)}
            />
          </Lever>

          <Lever label="Broker">
            <Chips
              options={BROKERS.map((b) => ({ id: b.id, label: b.id === 'in-discount' ? 'Discount' : 'Full service' }))}
              value={brokerId}
              onChange={setBrokerId}
            />
          </Lever>

          <Lever label="Round trips per year">
            <Chips
              options={TRIPS.map((t) => ({ id: String(t), label: String(t) }))}
              value={String(trips)}
              onChange={(v) => setTrips(Number(v))}
            />
          </Lever>

          <Lever label="Capital">
            <input
              type="range"
              min={20_000}
              max={2_000_000}
              step={20_000}
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <span className="num mt-1 block text-sm">₹{capital.toLocaleString('en-IN')}</span>
          </Lever>
        </div>
      </div>

      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: passed ? 'var(--color-up)' : 'var(--color-down)',
          background: passed ? 'rgba(45, 212, 167, 0.06)' : 'rgba(255, 122, 92, 0.06)',
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">Annual cost</div>
            <div className="num mt-1 text-3xl" style={{ color: passed ? 'var(--color-up)' : 'var(--color-down)' }}>
              {annualPercent.toFixed(2)}%
            </div>
          </div>
          <div className="text-right text-sm text-ink-muted">
            <div className="num text-ink">₹{Math.round(annual).toLocaleString('en-IN')}</div>
            <div>
              {trips} round trips × ₹{perTrip.total.toFixed(2)}
            </div>
            <div className="num text-[11px] text-ink-faint">
              {perTrip.breakevenPercent.toFixed(3)}% breakeven per trip
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          {passed
            ? 'Under target. Notice which lever got you here — trip count almost always dominates, because costs are charged per trade and your capital is not.'
            : 'Over target. Before you reach for the broker toggle, try cutting the number of round trips: it is a linear multiplier on everything, and it is the only lever fully under your control.'}
        </p>
      </div>

      {/*
        No stop, no target, no reveal — this is an open-ended sandbox, so
        there is nothing to be "pre-committed" to and no money at stake.
        Filing records the configuration you landed on; `accuracy` is
        whether it actually cleared the target, which is this game's one
        real pass/fail signal.
      */}
      <RunSubmit
        game="cost-cutter"
        trades={[
          {
            preCommitted: false,
            riskFraction: 0,
            honouredStop: true,
            exitedPerPlan: true,
            pnl: 0,
            sizedFromStop: false,
            plannedRR: null,
            stoppedOut: false,
          },
        ]}
        pnl={0}
        accuracy={passed ? 1 : 0}
        defaultReason={`Landed on ${PRODUCTS.find((p) => p.id === product)?.label}, ${broker.id === 'in-discount' ? 'a discount broker' : 'a full-service broker'}, ${trips} round trips a year on ₹${capital.toLocaleString('en-IN')} — ${annualPercent.toFixed(2)}% annual cost, ${passed ? 'under' : 'over'} the ${TARGET_PERCENT}% target.`}
      />
    </div>
  );
}

function Lever({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className="rounded-md px-3 py-1.5 text-sm transition-colors"
          style={{
            background: value === o.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: value === o.id ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
