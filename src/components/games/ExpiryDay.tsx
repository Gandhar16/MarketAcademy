'use client';

/**
 * Expiry Day — the trap that catches a position that WORKED.
 *
 * You buy one lot of an at-the-money call this morning. The clock below is
 * today, compressed. Close whenever you like for whatever the market will
 * pay — or don't, and find out what "expires in the money" actually means
 * for the settlement type you picked. A cash-settled (index-style) contract
 * just pays you the difference. A physically-settled (single-stock) contract
 * left open ITM does not pay you anything: it hands you a bill for the full
 * strike value of the shares, funded on the spot, plus a delivery charge —
 * on a position that may have cost a few thousand rupees to open. That is
 * "the modern account-killer" PLAN.md names it, and it only bites the
 * position that was RIGHT and then forgotten.
 *
 * Modelled, like Earnings Roulette: Black–Scholes pricing, a seeded random
 * walk for the underlying, a real countdown for the compressed session. Not
 * a real options chain.
 */
import { useEffect, useMemo, useState } from 'react';
import { blackScholesPrice, daysToYears, physicalSettlementFor } from '@/lib/engine/options';
import { mulberry32 } from '@/lib/util/rng';
import { MIN_REASON_CHARS, processScore, type TradeRecord } from '@/lib/progress/mastery';
import { fileTrade, type FiledTrade } from '@/lib/progress/fileTrade';
import { useAccountStore } from '@/lib/account/store';
import { FiledSummary } from './FiledSummary';

const SPOT0 = 1_400;
const STRIKE = 1_400;
const LOT_SIZE = 250;
const RATE = 0.065;
const IV = 0.28;
const TOTAL_SECONDS = 60;
const TICK_SECONDS = 5;
const TICKS = TOTAL_SECONDS / TICK_SECONDS;

type Settlement = 'cash' | 'physical';

function buildPath(seed: number): number[] {
  const r = mulberry32(seed);
  const path = [SPOT0];
  let s = SPOT0;
  for (let i = 0; i < TICKS; i++) {
    const move = (r() - 0.5) * 1.2; // up to ±0.6% a tick
    s = s * (1 + move / 100);
    path.push(s);
  }
  return path;
}

function premiumAt(spot: number, secondsLeft: number): number {
  const timeToExpiry = daysToYears(1) * (secondsLeft / TOTAL_SECONDS);
  return blackScholesPrice({ spot, strike: STRIKE, timeToExpiry, volatility: IV, rate: RATE, type: 'call' });
}

interface Round {
  seed: number;
  settlement: Settlement;
  reason: string;
  entryPremium: number;
  entryCost: number;
}

interface Outcome {
  reason: 'closed' | 'expired_otm' | 'expired_cash' | 'expired_physical';
  spot: number;
  pnl: number;
  obligation: number;
  deliveryCharge: number;
}

export function ExpiryDay() {
  const [seed, setSeed] = useState(1);
  const [settlement, setSettlement] = useState<Settlement>('cash');
  const [reason, setReason] = useState('');
  const [round, setRound] = useState<Round | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [history, setHistory] = useState<{ pnl: number; reason: TradeRecord }[]>([]);
  /** Every expiry filed so far, in the order it settled. */
  const [filed, setFiled] = useState<FiledTrade[]>([]);

  const startingCash = useAccountStore((s) => s.startingCash);
  const signedIn = useAccountStore((s) => s.signedIn);

  useEffect(() => {
    void useAccountStore.getState().hydrate();
  }, []);

  const path = useMemo(() => buildPath(round?.seed ?? seed), [round, seed]);
  const spot = path[Math.min(TICKS, Math.floor((TOTAL_SECONDS - secondsLeft) / TICK_SECONDS))];
  const premium = premiumAt(spot, secondsLeft);

  useEffect(() => {
    if (!round || outcome || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [round, outcome, secondsLeft]);

  // Feeds the shared balance live while the position is open — "if closed
  // now" is real, moving P&L on the account, not just a preview number.
  // Drops to 0 once it settles, since finish()'s bankFill takes over then.
  useEffect(() => {
    const liveIfClosedNow = round && !outcome ? premium * LOT_SIZE - round.entryCost : 0;
    useAccountStore.getState().setLiveUnrealized(liveIfClosedNow);
  }, [round, outcome, premium]);

  useEffect(() => {
    return () => {
      useAccountStore.getState().setLiveUnrealized(0);
    };
  }, []);

  const buy = () => {
    const entryPremium = premiumAt(SPOT0, TOTAL_SECONDS);
    const entryCost = entryPremium * LOT_SIZE;
    setRound({ seed, settlement, reason, entryPremium, entryCost });
    setSecondsLeft(TOTAL_SECONDS);
    setOutcome(null);
  };

  function settle(via: 'manual' | 'expiry') {
    if (!round) return;
    const closingSpot = spot;

    if (via === 'manual') {
      const value = premium * LOT_SIZE;
      const pnl = value - round.entryCost;
      finish({ reason: 'closed', spot: closingSpot, pnl, obligation: 0, deliveryCharge: 0 });
      return;
    }

    const intrinsic = Math.max(0, closingSpot - STRIKE);
    if (intrinsic <= 0) {
      finish({ reason: 'expired_otm', spot: closingSpot, pnl: -round.entryCost, obligation: 0, deliveryCharge: 0 });
      return;
    }

    if (round.settlement === 'cash') {
      const pnl = intrinsic * LOT_SIZE - round.entryCost;
      finish({ reason: 'expired_cash', spot: closingSpot, pnl, obligation: 0, deliveryCharge: 0 });
      return;
    }

    // Physical: the account is only ever debited the BOUNDED loss below —
    // grossGain net of the entry cost and the delivery charge — never the
    // full strike obligation itself. That obligation is shown alongside it
    // because in reality it is what you would have had to fund immediately,
    // or lean on other holdings / your broker's forced square-off to cover —
    // not something this account can actually go negative for.
    const s = physicalSettlementFor({ spot: closingSpot, strike: STRIKE, type: 'call', lotSize: LOT_SIZE, premiumPaid: round.entryCost });
    const pnl = s.grossGain - round.entryCost - s.deliveryCharge;
    finish({ reason: 'expired_physical', spot: closingSpot, pnl, obligation: s.obligation, deliveryCharge: s.deliveryCharge });
  }

  function finish(o: Outcome) {
    setOutcome(o);
    const record: TradeRecord = {
      preCommitted: round!.reason.trim().length > 0,
      riskFraction: round!.entryCost / startingCash,
      honouredStop: o.reason !== 'expired_physical',
      exitedPerPlan: o.reason === 'closed' || o.reason === 'expired_otm' || o.reason === 'expired_cash',
      pnl: o.pnl,
      sizedFromStop: true,
      plannedRR: null,
      stoppedOut: o.reason === 'expired_physical',
    };
    setHistory((h) => [...h, { pnl: o.pnl, reason: record }]);
    // Banked and filed the instant the position settles — not held back for
    // a "file this run" click. The reason is the one already written before
    // this expiry was bought.
    useAccountStore.getState().bankFill('expiry-day', o.pnl);
    void fileTrade('expiry-day', record, round!.reason).then((r) => {
      if (r) setFiled((f) => [...f, r]);
    });
  }

  useEffect(() => {
    if (round && !outcome && secondsLeft <= 0) settle('expiry');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, round, outcome]);

  const newRound = () => {
    setSeed((s) => s + 101);
    setRound(null);
    setOutcome(null);
    setReason('');
    useAccountStore.getState().setLiveUnrealized(0);
    // `filed`, like `history`, is NOT reset — both track every round played
    // this mount, not just the one that just settled.
  };

  const trades = history.map((h) => h.reason);
  const totalPnl = history.reduce((s, h) => s + h.pnl, 0);
  const score = trades.length > 0 ? processScore(trades) : null;

  if (!round) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-[11px] uppercase tracking-wider text-accent">Before you buy</div>
          <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-ink-muted">
            A {STRIKE}-strike call, at the money, expiring today. One lot of {LOT_SIZE}. What kind of contract is it?
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setSettlement('cash')}
              aria-pressed={settlement === 'cash'}
              className="flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              style={{
                background: settlement === 'cash' ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color: settlement === 'cash' ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
              }}
            >
              <div className="font-medium">Cash-settled</div>
              <div className="text-[11px] opacity-80">Index-style. ITM at expiry just pays the difference.</div>
            </button>
            <button
              onClick={() => setSettlement('physical')}
              aria-pressed={settlement === 'physical'}
              className="flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              style={{
                background: settlement === 'physical' ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color: settlement === 'physical' ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
              }}
            >
              <div className="font-medium">Physically settled</div>
              <div className="text-[11px] opacity-80">Single-stock-style. ITM at expiry means you fund delivery.</div>
            </button>
          </div>

          <label className="mt-4 block">
            <span className="text-sm text-ink-muted">
              Why this trade? Once it settles, this is your reason — there is no editing it afterwards.
            </span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. expecting a breakout above the morning range, closing before expiry either way"
              className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-line-strong"
            />
            <span className={`num mt-1 block text-[11px] ${reason.trim().length >= MIN_REASON_CHARS ? 'text-up' : 'text-ink-faint'}`}>
              {reason.trim().length}/{MIN_REASON_CHARS} characters — below this, the trade still settles and banks its
              P&L, but earns no XP.
            </span>
          </label>

          <p className="mt-3 num text-sm text-ink-muted">
            Premium <span className="text-ink">₹{premiumAt(SPOT0, TOTAL_SECONDS).toFixed(2)}</span> · cost{' '}
            <span className="text-ink">₹{(premiumAt(SPOT0, TOTAL_SECONDS) * LOT_SIZE).toLocaleString('en-IN')}</span>
          </p>

          <button
            disabled={reason.trim().length === 0}
            onClick={buy}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis disabled:opacity-30"
          >
            Buy the call
          </button>
        </div>

        {history.length > 0 && <HistoryPanel history={history} totalPnl={totalPnl} />}
      </div>
    );
  }

  if (outcome) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
          <div className="text-[11px] uppercase tracking-wider text-accent">
            {outcome.reason === 'closed'
              ? 'Closed before expiry'
              : outcome.reason === 'expired_otm'
                ? 'Expired worthless'
                : outcome.reason === 'expired_cash'
                  ? 'Expired in the money — cash settled'
                  : 'Expired in the money — physically settled'}
          </div>

          <div className="num mt-2 text-3xl" style={{ color: outcome.pnl >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
            {outcome.pnl >= 0 ? '+' : ''}₹{Math.round(outcome.pnl).toLocaleString('en-IN')}
          </div>

          {outcome.reason === 'expired_physical' && (
            <div className="mt-4 rounded-lg border border-down/50 bg-down/10 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
              <strong className="text-down">
                This is the trap. To take delivery you would have had to fund ₹
                {Math.round(outcome.obligation).toLocaleString('en-IN')} immediately — the full strike value, not the{' '}
                ₹{Math.round(round.entryCost).toLocaleString('en-IN')} you paid — plus a ₹
                {Math.round(outcome.deliveryCharge).toLocaleString('en-IN')} delivery charge.
              </strong>{' '}
              The account here only ever loses what it put up; in reality, not having that obligation funded is how a
              position that was profitable on paper turns into a forced, ugly liquidation of whatever else you hold.
              Closing before expiry realises the same gain with none of it.
            </div>
          )}

          {outcome.reason === 'closed' && (
            <p className="mt-3 text-[13px] text-ink-muted">
              Sold in the market for what it was worth. No settlement risk of any kind — because there was nothing left
              open when the clock hit zero.
            </p>
          )}

          {score && (
            <>
              <div className="num mt-4 text-lg">
                {score.score}
                <span className="text-sm text-ink-faint">/100 process</span>
              </div>
              <FiledSummary filed={filed} tradeCount={trades.length} signedIn={signedIn} noun="round" />
            </>
          )}

          <button onClick={newRound} className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis">
            Another expiry
          </button>
        </div>

        {history.length > 0 && <HistoryPanel history={history} totalPnl={totalPnl} />}
      </div>
    );
  }

  const intrinsicNow = Math.max(0, spot - STRIKE);
  const wouldBeObligation = round.settlement === 'physical' && intrinsicNow > 0 ? STRIKE * LOT_SIZE : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">
            {round.settlement === 'cash' ? 'Cash-settled' : 'Physically settled'} · {STRIKE} call
          </div>
          <div className="num text-2xl" style={{ color: secondsLeft <= 10 ? 'var(--color-down)' : 'var(--color-ink)' }}>
            {secondsLeft}s to close
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(secondsLeft / TOTAL_SECONDS) * 100}%`, background: 'var(--color-accent)' }}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Cell label="Spot" value={spot.toFixed(2)} />
          <Cell label="Premium now" value={`₹${premium.toFixed(2)}`} />
          <Cell label="If closed now" value={`${premium * LOT_SIZE - round.entryCost >= 0 ? '+' : ''}₹${(premium * LOT_SIZE - round.entryCost).toFixed(0)}`} tone={premium * LOT_SIZE - round.entryCost >= 0 ? 'up' : 'down'} />
          <Cell
            label="If it expires ITM now"
            value={wouldBeObligation > 0 ? `owe ₹${wouldBeObligation.toLocaleString('en-IN')}` : intrinsicNow > 0 ? `+₹${(intrinsicNow * LOT_SIZE).toFixed(0)}` : '—'}
            tone={wouldBeObligation > 0 ? 'down' : intrinsicNow > 0 ? 'up' : undefined}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => settle('manual')}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis"
          >
            Close now
          </button>
          <span className="self-center text-[13px] text-ink-faint">or do nothing — the clock decides.</span>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="num mt-0.5 text-base" style={tone ? { color: tone === 'up' ? 'var(--color-up)' : 'var(--color-down)' } : undefined}>
        {value}
      </div>
    </div>
  );
}

function HistoryPanel({ history, totalPnl }: { history: { pnl: number }[]; totalPnl: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">
        {history.length} expiry{history.length === 1 ? '' : ' days'} · total ₹{Math.round(totalPnl).toLocaleString('en-IN')}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {history.map((h, i) => (
          <div
            key={i}
            className="num rounded px-2 py-1 text-[11px]"
            style={{
              background: h.pnl >= 0 ? 'rgba(45,212,167,0.15)' : 'rgba(255,122,92,0.15)',
              color: h.pnl >= 0 ? 'var(--color-up)' : 'var(--color-down)',
            }}
          >
            {h.pnl >= 0 ? '+' : ''}₹{Math.round(h.pnl).toLocaleString('en-IN')}
          </div>
        ))}
      </div>
    </div>
  );
}
