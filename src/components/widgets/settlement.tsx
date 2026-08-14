'use client';

/**
 * Physical-settlement widgets.
 *
 * SOURCES — verified 2026-08-09:
 *   Margin ladder and square-off policy:
 *     https://support.zerodha.com/category/trading-and-markets/trading-faqs/f-otrading/articles/policy-on-physical-settlement
 *   Physical delivery charge (0.25%, or 0.1% for netted positions):
 *     https://zerodha.com/charges/
 */
import { useMemo, useState } from 'react';
import { physicalSettlementFor, PHYSICAL_DELIVERY_NETTED_PERCENT, PHYSICAL_DELIVERY_PERCENT } from '@/lib/engine/options';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export { PHYSICAL_DELIVERY_PERCENT, PHYSICAL_DELIVERY_NETTED_PERCENT };

export function PhysicalSettlementCalculator({
  strike: strike0 = 1350,
  spot: spot0 = 1400,
  lotSize = 250,
  premium: premium0 = 8,
}: {
  strike?: number;
  spot?: number;
  lotSize?: number;
  premium?: number;
}) {
  const [premium, setPremium] = useState(premium0);
  const [spot, setSpot] = useState(spot0);
  const strike = strike0;

  const m = useMemo(() => {
    const outlay = premium * lotSize;
    const settlement = physicalSettlementFor({ spot, strike, type: 'call', lotSize, premiumPaid: outlay });
    return {
      outlay,
      ...settlement,
      ratio: settlement.obligationToPremiumRatio,
      chargeShareOfPremium: outlay > 0 ? settlement.deliveryCharge / outlay : 0,
    };
  }, [premium, spot, strike, lotSize]);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            Premium paid: <span className="num text-ink">{inr(premium)}</span> per share
          </span>
          <input
            type="range"
            min={0.5}
            max={80}
            step={0.5}
            value={premium}
            onChange={(e) => setPremium(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            Price at expiry: <span className="num text-ink">{inr(spot)}</span> (strike {inr(strike)})
          </span>
          <input
            type="range"
            min={strike - 100}
            max={strike + 150}
            step={5}
            value={spot}
            onChange={(e) => setSpot(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>
      </div>

      {!m.inTheMoney ? (
        <div className="mt-5 rounded-lg bg-surface-2 px-4 py-4 text-sm text-ink-muted">
          Out of the money at expiry. The option lapses, you lose the {inr(m.outlay)} premium, and there is{' '}
          <strong className="text-ink">no delivery obligation at all</strong>. Physical settlement only applies to
          in-the-money contracts — which is why the risk arrives exactly when the trade has gone your way.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Cell label="You risked" value={inr(m.outlay)} />
            <Cell label="Position is worth" value={`+${inr(m.grossGain)}`} tone="up" />
            <Cell label="You must fund" value={inr(m.obligation)} tone="down" />
            <Cell label="Delivery charge" value={inr(m.deliveryCharge)} tone="down" />
          </div>

          <div className="mt-4 rounded-lg border border-down/40 bg-down/10 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
            <strong className="text-down">
              The obligation is {m.ratio.toFixed(0)}× the premium you risked.
            </strong>{' '}
            The delivery charge alone is {(m.chargeShareOfPremium * 100).toFixed(0)}% of that premium. Selling the
            option in the market before expiry realises the same {inr(m.grossGain)} without any of it.
          </div>
        </>
      )}

      <p className="mt-4 text-[11px] text-ink-faint">
        Lot size {lotSize}. Physical delivery charged at {PHYSICAL_DELIVERY_PERCENT}% of settled value (
        {PHYSICAL_DELIVERY_NETTED_PERCENT}% where the position nets off), plus stamp duty and DP charges on the
        resulting delivery.
      </p>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className="num mt-0.5 text-base"
        style={tone ? { color: tone === 'up' ? 'var(--color-up)' : 'var(--color-down)' } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/** The four-session margin escalation before expiry. */
export const MARGIN_LADDER: { day: string; label: string; percentOfVarElm?: number; percentOfContract?: number }[] = [
  { day: 'E-4', label: 'Four sessions out', percentOfVarElm: 10 },
  { day: 'E-3', label: 'Three sessions out', percentOfVarElm: 25 },
  { day: 'E-2', label: 'Two sessions out', percentOfVarElm: 45 },
  { day: 'E-1', label: 'Day before expiry', percentOfContract: 25 },
  { day: 'E', label: 'Expiry day', percentOfContract: 50 },
];

export function MarginLadder({ contractValue = 337_500 }: { contractValue?: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">
        Margin required on a long ITM stock option · contract value {inr(contractValue)}
      </div>

      <div className="mt-4 space-y-2">
        {MARGIN_LADDER.map((step) => {
          const amount = step.percentOfContract != null ? (contractValue * step.percentOfContract) / 100 : null;
          const width =
            step.percentOfContract != null ? step.percentOfContract : (step.percentOfVarElm ?? 0) / 4;
          return (
            <div key={step.day}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span>
                  <span className="num mr-3 text-accent">{step.day}</span>
                  <span className="text-ink-muted">{step.label}</span>
                </span>
                <span className="num text-[13px] text-ink-muted">
                  {step.percentOfContract != null
                    ? `${step.percentOfContract}% of contract value = ${inr(amount as number)}`
                    : `${step.percentOfVarElm}% of VaR + ELM + adhoc`}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(3, width))}%`,
                    background: step.percentOfContract != null ? 'var(--color-down)' : 'var(--color-accent)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
        On expiry day the requirement is <strong className="text-ink">{inr(contractValue * 0.5)}</strong> — half the
        contract value — on a position that may have cost ₹2,000 to open. If the account cannot meet it, the broker
        squares the position off at a time and price you do not choose, and charges ₹50 plus GST for doing so.
      </p>
    </div>
  );
}
