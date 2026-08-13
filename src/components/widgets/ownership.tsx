'use client';

/**
 * OwnershipToPriceMap.
 *
 * The one thing a beginner needs to see with their own eyes, not just read:
 * ownership percentage, the company's own performance, and the quoted price
 * are three separate numbers that do not move together. A learner can pick a
 * scenario, predict what happens BEFORE seeing the answer (same commit-then-
 * reveal contract as a `predict` block), and then see, dimension by
 * dimension, what definitely changed, what only might have, and what could
 * not have moved at all.
 *
 * All figures are an illustrative, fictional company ("Mango Motors") — never
 * live market data, per PLAN.md §7.1.
 */
import { useState } from 'react';
import { ownershipPercent } from '@/lib/engine/portfolio';
import { ScenarioPicker } from './scenario-picker';
import { StatusDot } from './status-dot';

const SHARES_OUTSTANDING = 1000;
const SHARES_OWNED = 10;
const START_PRICE = 100;

type ScenarioId = 'profit' | 'dilution' | 'sentiment';
type Status = 'changes' | 'may-change' | 'unchanged';

interface Dimension {
  label: string;
  status: Status;
  note: string;
}

interface Scenario {
  id: ScenarioId;
  label: string;
  predictPrompt: string;
  options: string[];
  correct: number;
  reveal: string;
  dimensions: Dimension[];
}

const STATUS_META: Record<Status, { text: string; colour: string }> = {
  changes: { text: 'Changes', colour: 'var(--color-down)' },
  'may-change': { text: 'May change', colour: 'var(--color-accent)' },
  unchanged: { text: 'Does not change', colour: 'var(--color-up)' },
};

const SCENARIOS: Scenario[] = [
  {
    id: 'profit',
    label: 'The company earns more profit',
    predictPrompt: "Mango Motors' profit rises sharply this quarter. What happens to its quoted price today?",
    options: [
      'It rises immediately and automatically',
      'It might rise, if a buyer becomes willing to pay more for it — but that is not automatic',
      'Nothing changes until a dividend is paid',
    ],
    correct: 1,
    reveal:
      'Better profit does not move the price by itself. The price only moves when the next willing buyer and willing seller agree on a new number — better profit can make a buyer willing to pay more, but it is not a guarantee, and it is not immediate.',
    dimensions: [
      { label: 'Shares you own', status: 'unchanged', note: 'You did not buy or sell anything.' },
      { label: 'Your ownership percentage', status: 'unchanged', note: 'No share counts moved, so your slice is exactly the same size.' },
      { label: "The company's business performance", status: 'changes', note: 'This is the scenario itself — profit genuinely rose.' },
      { label: 'Quoted market price', status: 'may-change', note: 'Only if a buyer and seller actually agree on a different number because of it.' },
      { label: 'Your portfolio value', status: 'may-change', note: 'Only moves if the price does.' },
    ],
  },
  {
    id: 'dilution',
    label: 'The company issues 1,000 new shares, you still hold your 10',
    predictPrompt:
      'Mango Motors issues 1,000 new shares. You still hold your original 10 — you did not buy or sell. What happens to your ownership percentage?',
    options: [
      'Stays at 1%, since you did not sell any shares',
      'Falls to about 0.5%, since your 10 shares are now a smaller slice of a bigger total',
      'Rises, because the company now has more money to work with',
    ],
    correct: 1,
    reveal:
      'It falls to 0.5%. Mango Motors now has 2,000 shares outstanding and you still hold 10 — 10 ÷ 2,000 = 0.5%, half of what you owned before. Nothing was taken from you; the company simply cut itself into more, smaller slices.',
    dimensions: [
      { label: 'Shares you own', status: 'unchanged', note: 'Still exactly 10.' },
      { label: 'Your ownership percentage', status: 'changes', note: 'Falls from 1% to 0.5% — more shares exist, yours did not grow.' },
      { label: "The company's business performance", status: 'unchanged', note: 'Issuing shares, by itself, changes nothing about what the business does.' },
      { label: 'Quoted market price', status: 'may-change', note: 'The market may reprice given more shares and more cash — not a fixed rule either way.' },
      { label: 'Your portfolio value', status: 'may-change', note: 'Depends entirely on how the price reacts, if at all.' },
    ],
  },
  {
    id: 'sentiment',
    label: 'Investors become less willing to pay for each share',
    predictPrompt:
      "Nothing about Mango Motors' business changes, but investors become less willing to pay for each share. What does that do to the price?",
    options: [
      'Nothing — price only moves when the business changes',
      'It falls — the price is only ever the next trade a willing buyer and a willing seller actually agree to, whatever their reason',
      'It falls only if the company also starts losing money',
    ],
    correct: 1,
    reveal:
      'It falls. The price is simply the amount the next willing buyer and willing seller agree to trade at — it does not need a reason tied to the business at all, just two people settling on a number.',
    dimensions: [
      { label: 'Shares you own', status: 'unchanged', note: 'Still exactly 10.' },
      { label: 'Your ownership percentage', status: 'unchanged', note: 'No share counts moved.' },
      { label: "The company's business performance", status: 'unchanged', note: 'The scenario is explicit: nothing about the business changed.' },
      { label: 'Quoted market price', status: 'changes', note: 'Falls, because that is what the next agreed trade settled on.' },
      { label: 'Your portfolio value', status: 'changes', note: 'Falls with the price, on the same fixed 1% you always held.' },
    ],
  },
];

export function OwnershipToPriceMap() {
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  const ownership = ownershipPercent(SHARES_OWNED, SHARES_OUTSTANDING);
  const portfolioValue = SHARES_OWNED * START_PRICE;
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? null;

  const chooseScenario = (id: string) => {
    setScenarioId(id as ScenarioId);
    setPicked(null);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">Ownership-to-price map</div>

      {/* ── starting facts ─────────────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Shares outstanding" value={SHARES_OUTSTANDING.toLocaleString('en-IN')} />
        <Fact label="You own" value={`${SHARES_OWNED} shares`} />
        <Fact label="Your ownership" value={`${ownership.toFixed(0)}%`} />
        <Fact label="Portfolio value" value={`₹${portfolioValue.toLocaleString('en-IN')}`} />
      </div>
      <p className="mt-2 text-[12px] text-ink-faint">
        Mango Motors is a fictional company invented for this illustration — none of these are real market figures.
      </p>

      {/* ── scenario picker ────────────────────────────────────────────── */}
      <ScenarioPicker
        options={SCENARIOS.map((s) => ({ id: s.id, label: s.label }))}
        selectedId={scenarioId}
        onSelect={chooseScenario}
        ariaLabel="Choose a scenario"
        className="mt-5 flex flex-col gap-2"
        optionClassName="rounded-lg border px-4 py-2.5 text-left text-sm transition-colors"
      />

      {/* ── predict, then reveal ───────────────────────────────────────── */}
      {scenario && (
        <div className="mt-5 rounded-lg bg-surface-2 p-4">
          <p className="text-[15px]">{scenario.predictPrompt}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {scenario.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                disabled={picked != null}
                onClick={() => setPicked(i)}
                aria-pressed={picked === i}
                className="rounded-lg border px-3.5 py-2 text-left text-[13px] transition-colors disabled:cursor-default"
                style={{
                  borderColor: picked === i ? 'var(--color-accent)' : 'var(--color-line)',
                  background: picked === i ? 'var(--color-surface)' : 'transparent',
                  color: picked === i ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {picked != null && (
            <div className="mt-4 space-y-4" aria-live="polite">
              <p
                className="rounded-lg border-l-2 px-3 py-2 text-[13px] leading-relaxed"
                style={{
                  borderColor: picked === scenario.correct ? 'var(--color-up)' : 'var(--color-down)',
                  color: 'var(--color-ink-muted)',
                }}
              >
                {scenario.reveal}
              </p>

              <table className="w-full border-collapse text-[13px]">
                <caption className="sr-only">
                  What changes, may change, or does not change under: {scenario.label}
                </caption>
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint">
                    <th scope="col" className="pb-1.5 pr-3 font-normal">
                      Dimension
                    </th>
                    <th scope="col" className="pb-1.5 pr-3 font-normal">
                      Status
                    </th>
                    <th scope="col" className="pb-1.5 font-normal">
                      Why
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.dimensions.map((d) => (
                    <tr key={d.label} className="border-t border-line align-top">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-ink">
                        {d.label}
                      </th>
                      <td className="py-1.5 pr-3">
                        <span className="inline-flex items-center gap-1.5">
                          <StatusDot colour={STATUS_META[d.status].colour} />
                          <span style={{ color: STATUS_META[d.status].colour }}>{STATUS_META[d.status].text}</span>
                        </span>
                      </td>
                      <td className="py-1.5 text-ink-muted">{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="num mt-0.5 text-base text-ink">{value}</div>
    </div>
  );
}
