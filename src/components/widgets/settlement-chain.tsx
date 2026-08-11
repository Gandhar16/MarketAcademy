'use client';

/**
 * SettlementChain — click through what actually happens after you press buy.
 *
 * Beginners believe a trade is one event between them and "the market". It is
 * six parties over two days, and knowing the chain is what makes DP charges,
 * T+1, short delivery and auction settlement comprehensible instead of
 * arbitrary. Each stage is clickable and reveals who is involved, what they
 * charge, and what goes wrong at that step.
 *
 * SOURCES — verified 2026-08-09: SEBI T+1 rolling settlement (universal for
 * Indian equities since January 2023); CDSL/NSDL depository structure.
 */
import { useState } from 'react';

interface Stage {
  id: string;
  when: string;
  title: string;
  who: string;
  what: string;
  charge?: string;
  failure: string;
}

const STAGES: Stage[] = [
  {
    id: 'order',
    when: 'T, 09:20',
    title: 'You place the order',
    who: 'You → your broker',
    what: 'Your broker checks you have the funds or the shares, then forwards the order to the exchange under their membership. You are not a member of the exchange; they are. Everything you do reaches the market through them.',
    charge: 'Brokerage, if the plan has any',
    failure: 'Insufficient funds, a price outside the circuit band, or a quantity above the freeze limit — rejected before it ever reaches the exchange.',
  },
  {
    id: 'match',
    when: 'T, 09:20:01',
    title: 'The exchange matches it',
    who: 'NSE or BSE',
    what: 'Your order enters the order book and matches against someone else’s resting order by price, then by time. The exchange does not care who you are — only your price and when you arrived.',
    charge: 'Exchange transaction charges, SEBI turnover fee, STT, stamp duty',
    failure: 'No counterparty at your price. A limit order simply rests; a market order eats deeper into the book and fills worse.',
  },
  {
    id: 'clear',
    when: 'T, evening',
    title: 'Clearing works out who owes what',
    who: 'NSE Clearing / Indian Clearing Corporation',
    what: 'The clearing corporation becomes the counterparty to BOTH sides — this is why you never have to trust the stranger who sold to you. It nets everyone’s obligations down to a single figure per member.',
    failure: 'A member defaults. The clearing corporation’s settlement guarantee fund absorbs it, which is the entire reason exchange-traded markets are safer than private deals.',
  },
  {
    id: 'pay-in',
    when: 'T+1, morning',
    title: 'Pay-in: money and shares are collected',
    who: 'Your broker → clearing corporation',
    what: 'Buyers’ money and sellers’ shares are taken in. This is the step that makes settlement real rather than a promise.',
    failure: 'The seller does not deliver — SHORT DELIVERY. The exchange buys the shares in an auction and bills the defaulting seller for the difference, which can be brutal.',
  },
  {
    id: 'pay-out',
    when: 'T+1, afternoon',
    title: 'Pay-out: shares reach your demat account',
    who: 'Clearing corporation → depository (CDSL/NSDL) → you',
    what: 'The shares are credited to your demat account, held electronically by the depository. Your broker is not holding them — the depository is, in your name. That separation is deliberate and it protects you if the broker fails.',
    charge: 'DP charges apply when you SELL from demat — ₹15.34 per scrip, flat',
    failure: 'Nothing much. This is the boring step, and boring is the point of a settlement system.',
  },
  {
    id: 'own',
    when: 'T+1, done',
    title: 'You are on the shareholder register',
    who: 'The depository, on the company’s behalf',
    what: 'You now receive dividends, can vote, and are eligible for bonuses and splits. Ownership is recorded electronically; there is no certificate to lose.',
    failure: 'Buying on or after the ex-date means you are not on the register in time for that dividend — the price adjusts down and you get nothing.',
  },
];

export function SettlementChain() {
  const [open, setOpen] = useState<string | null>('order');

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">
        What happens after you press buy · T+1 rolling settlement
      </div>

      <ol className="mt-4 space-y-px overflow-hidden rounded-lg border border-line bg-line">
        {STAGES.map((stage, i) => {
          const active = open === stage.id;
          return (
            <li key={stage.id} className="bg-surface">
              <button
                onClick={() => setOpen(active ? null : stage.id)}
                aria-expanded={active}
                className="flex w-full items-baseline gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]"
                  style={{
                    background: active ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    color: active ? 'var(--color-ground)' : 'var(--color-ink-faint)',
                  }}
                >
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="text-sm">{stage.title}</span>
                  <span className="num ml-3 text-[11px] text-ink-faint">{stage.when}</span>
                </span>
                <span className="text-ink-faint">{active ? '−' : '+'}</span>
              </button>

              {active && (
                <div className="border-t border-line px-4 py-3 pl-13">
                  <div className="text-[11px] uppercase tracking-wider text-accent">{stage.who}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{stage.what}</p>
                  {stage.charge && (
                    <p className="num mt-2 text-[12px] text-ink-faint">Charged here: {stage.charge}</p>
                  )}
                  <p className="mt-2 rounded-lg border-l-2 border-down bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-ink-muted">
                    <span className="text-down">What goes wrong: </span>
                    {stage.failure}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[11px] text-ink-faint">
        India settles equities on <strong>T+1</strong> — one working day after the trade. It is among the fastest cycles
        in the world; most major markets still run T+2.
      </p>
    </div>
  );
}
