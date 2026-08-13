'use client';

/**
 * MoneySecuritiesFlow.
 *
 * A beginner hears "buy a share" as one action, but the destination of the
 * money is entirely different depending on WHO is on the other side. This
 * lets a learner toggle between the two cases and see, explicitly, who sends
 * money to whom and who sends shares to whom — rather than reading a
 * paragraph and having to hold both cases in their head at once.
 *
 * Figures are an illustrative, fictional company ("Mango Motors") — never
 * live market data, per PLAN.md §7.1.
 */
import { useState } from 'react';
import { ScenarioPicker } from './scenario-picker';

type ScenarioId = 'primary' | 'secondary';

interface FlowScenario {
  id: ScenarioId;
  label: string;
  moneyFrom: string;
  moneyTo: string;
  moneyAmount: string;
  securityFrom: string;
  securityTo: string;
  securityLabel: string;
  outstandingChange: string;
  companyReceives: string;
}

const SCENARIOS: FlowScenario[] = [
  {
    id: 'primary',
    label: 'A. Mango Motors issues 100 new shares at ₹100',
    moneyFrom: 'You',
    moneyTo: 'Mango Motors',
    moneyAmount: '₹10,000',
    securityFrom: 'Mango Motors',
    securityTo: 'You',
    securityLabel: '100 newly created shares',
    outstandingChange: 'Rises by 100 — these shares did not exist before today.',
    companyReceives: '₹10,000, in full. This is the primary market.',
  },
  {
    id: 'secondary',
    label: 'B. Maya sells her existing share to Arjun at ₹100',
    moneyFrom: 'Arjun',
    moneyTo: 'Maya',
    moneyAmount: '₹100',
    securityFrom: 'Maya',
    securityTo: 'Arjun',
    securityLabel: '1 existing share, already in circulation',
    outstandingChange: 'Unchanged — the same share simply changed hands.',
    companyReceives: 'Nothing. Mango Motors is not a party to this trade. This is the secondary market.',
  },
];

export function MoneySecuritiesFlow() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('primary');
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  const chooseScenario = (id: string) => setScenarioId(id as ScenarioId);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">Money and shares, traced</div>

      <ScenarioPicker
        options={SCENARIOS.map((s) => ({ id: s.id, label: s.label }))}
        selectedId={scenarioId}
        onSelect={chooseScenario}
        ariaLabel="Choose a scenario"
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        optionClassName="flex-1 rounded-lg border px-3.5 py-2.5 text-left text-[13px] transition-colors"
      />

      <div className="mt-5 space-y-3" aria-live="polite">
        <FlowRow label="Money" from={scenario.moneyFrom} to={scenario.moneyTo} amount={scenario.moneyAmount} colour="var(--color-down)" />
        <FlowRow
          label="Shares"
          from={scenario.securityFrom}
          to={scenario.securityTo}
          amount={scenario.securityLabel}
          colour="var(--color-up)"
        />

        <div className="grid gap-3 rounded-lg bg-surface-2 p-4 sm:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-faint">Shares outstanding</div>
            <div className="mt-0.5 text-[13px] text-ink">{scenario.outstandingChange}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-faint">What Mango Motors receives</div>
            <div className="mt-0.5 text-[13px] text-ink">{scenario.companyReceives}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowRow({
  label,
  from,
  to,
  amount,
  colour,
}: {
  label: string;
  from: string;
  to: string;
  amount: string;
  colour: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[14px]">
      <span className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>
      <span className="rounded-md border border-line px-2.5 py-1 text-ink">{from}</span>
      <span aria-hidden style={{ color: colour }}>
        →
      </span>
      <span className="rounded-md border border-line px-2.5 py-1 text-ink">{to}</span>
      <span className="sr-only">
        {label} moves from {from} to {to}:
      </span>
      <span className="num ml-1 text-ink-muted">{amount}</span>
    </div>
  );
}
