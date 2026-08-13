'use client';

/**
 * MarketMapSequencer — "who touches an ordinary secondary-market trade, and
 * in what order".
 *
 * A beginner who can recite "exchange, broker, depository" as a list still
 * cannot say what ORDER they act in, or which of the roles they have heard
 * of (the company itself, the regulator) are not actually a step in a single
 * trade at all. This makes the learner build the sequence themselves, out of
 * a pool that includes two deliberate decoys, before revealing the answer —
 * the same commit-then-reveal contract as a `predict` block, just for an
 * ordering task instead of a multiple-choice one.
 *
 * No drag-and-drop library: click-to-place, click-to-remove. Keeps this
 * dependency-free and fully keyboard-operable for free, since every control
 * is a plain button.
 */
import { useState } from 'react';
import { StatusDot } from './status-dot';

interface Role {
  id: string;
  label: string;
  /** Shown only after the learner submits — what this role actually does here. */
  note: string;
  /** Is this role actually a step in an ORDINARY secondary-market trade? */
  belongs: boolean;
}

const ROLES: Role[] = [
  {
    id: 'investor',
    label: 'Investor (you)',
    note: 'Places the order — the trade starts with you.',
    belongs: true,
  },
  {
    id: 'broker',
    label: 'Broker',
    note: 'The licensed member who forwards your order to the exchange — you cannot reach the exchange directly.',
    belongs: true,
  },
  {
    id: 'exchange',
    label: 'Stock exchange',
    note: 'Matches your order against another investor\'s, by price and then by time.',
    belongs: true,
  },
  {
    id: 'clearing',
    label: 'Clearing corporation',
    note: 'Steps in as the counterparty to both sides once a trade is matched, and guarantees it — so neither side has to trust a stranger.',
    belongs: true,
  },
  {
    id: 'depository',
    label: 'Depository',
    note: 'Updates the electronic record of who holds what, once the trade is guaranteed.',
    belongs: true,
  },
  {
    id: 'company',
    label: 'The company itself',
    note: 'Not a party to this trade at all — an ordinary secondary-market trade is between two investors, and the company receives nothing.',
    belongs: false,
  },
  {
    id: 'regulator',
    label: 'Regulator',
    note: 'Sets and enforces the rules every other role follows, but is not itself a step inside any single trade.',
    belongs: false,
  },
];

const CORRECT_ORDER = ROLES.filter((r) => r.belongs).map((r) => r.id);

function shuffledOnce(): Role[] {
  // Fixed, deliberately non-alphabetical pool order rather than a random
  // shuffle — Date.now()/Math.random() are unavailable in this environment
  // and a fixed order is just as effective at forcing the learner to think,
  // since the pool is not already in trade order.
  const order = ['exchange', 'depository', 'investor', 'clearing', 'regulator', 'broker', 'company'];
  return order.map((id) => ROLES.find((r) => r.id === id)!);
}

export function MarketMapSequencer() {
  const [pool] = useState<Role[]>(shuffledOnce);
  const [placed, setPlaced] = useState<Role[]>([]);
  const [checked, setChecked] = useState(false);

  const remaining = pool.filter((r) => !placed.some((p) => p.id === r.id));

  const place = (role: Role) => {
    if (checked) return;
    setPlaced((p) => [...p, role]);
  };
  const remove = (role: Role) => {
    if (checked) return;
    setPlaced((p) => p.filter((r) => r.id !== role.id));
  };
  const reset = () => {
    setPlaced([]);
    setChecked(false);
  };

  const placedIds = placed.map((r) => r.id);
  const orderCorrect = placedIds.join(',') === CORRECT_ORDER.join(',');

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">Market map</div>
      <p className="mt-1 text-[13px] text-ink-muted">
        Click roles, in order, to build the sequence for an ordinary secondary-market trade — you buying a share from
        another investor. Not every card belongs.
      </p>

      {/* ── the sequence being built ───────────────────────────────────── */}
      <ol className="mt-4 flex min-h-[3rem] flex-wrap items-center gap-2 rounded-lg border border-dashed border-line bg-surface-2 p-3">
        {placed.length === 0 && <li className="text-[13px] text-ink-faint">Your sequence appears here.</li>}
        {placed.map((role, i) => (
          <li key={role.id}>
            <button
              type="button"
              onClick={() => remove(role)}
              disabled={checked}
              aria-label={`Remove ${role.label} from position ${i + 1}`}
              className="num flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors disabled:cursor-default"
              style={{
                borderColor: checked ? (role.belongs ? 'var(--color-up)' : 'var(--color-down)') : 'var(--color-accent)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
              }}
            >
              <span className="text-ink-faint">{i + 1}</span>
              {role.label}
              {!checked && <span aria-hidden className="text-ink-faint">×</span>}
            </button>
          </li>
        ))}
      </ol>

      {/* ── the pool ───────────────────────────────────────────────────── */}
      {!checked && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Available roles">
          {remaining.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => place(role)}
              className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {role.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!checked ? (
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={placed.length === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis disabled:opacity-40"
          >
            Check my sequence
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Try again
          </button>
        )}
      </div>

      {/* ── reveal ──────────────────────────────────────────────────────── */}
      {checked && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <p
            className="rounded-lg border-l-2 px-3 py-2 text-[13px] leading-relaxed"
            style={{
              borderColor: orderCorrect ? 'var(--color-up)' : 'var(--color-accent)',
              color: 'var(--color-ink-muted)',
            }}
          >
            {orderCorrect
              ? 'That is the sequence — investor, broker, exchange, clearing corporation, then depository.'
              : 'Not quite that order (or not quite that set of roles) — compare your sequence against the explanation below for each card.'}
          </p>

          <ul className="space-y-2">
            {ROLES.map((role) => {
              const wasPlaced = placedIds.includes(role.id);
              const rightCall = wasPlaced === role.belongs;
              return (
                <li key={role.id} className="rounded-lg bg-surface-2 p-3 text-[13px]">
                  <div className="flex items-center gap-2">
                    <StatusDot colour={rightCall ? 'var(--color-up)' : 'var(--color-down)'} />
                    <span className="font-medium text-ink">{role.label}</span>
                    <span className="text-[11px] text-ink-faint">
                      {role.belongs ? 'part of an ordinary trade' : 'not a step in an ordinary trade'}
                    </span>
                  </div>
                  <p className="mt-1 text-ink-muted">{role.note}</p>
                </li>
              );
            })}
          </ul>

          <p className="text-[12px] text-ink-faint">
            Clearing and the depository, in plain terms: clearing is the guarantee that both sides of the trade will
            actually happen, even though you and the other investor are strangers. The depository is the electronic
            record of who owns what afterwards — nobody is holding paper certificates.
          </p>
        </div>
      )}
    </div>
  );
}
