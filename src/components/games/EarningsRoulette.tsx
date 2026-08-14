'use client';

/**
 * Earnings Roulette — the IV crush lesson, delivered by losing money while
 * being right.
 *
 * You buy a straddle before results, pick a direction if you like, and the
 * result is announced. The stock moves the way you said. You lose anyway,
 * because implied volatility collapses the instant the uncertainty resolves.
 *
 * Priced with Black–Scholes throughout, so the loss is a consequence of the
 * model rather than a scripted punchline.
 */
import { useEffect, useMemo, useState } from 'react';
import { blackScholesPrice, daysToYears, type OptionInputs } from '@/lib/engine/options';
import { mulberry32 } from '@/lib/util/rng';
import type { TradeRecord } from '@/lib/progress/mastery';
import { useAccountStore } from '@/lib/account/store';
import { RunSubmit } from './RunSubmit';

const SPOT = 1400;
const STRIKE = 1400;
const RATE = 0.065;
const DAYS_BEFORE = 3;
const DAYS_AFTER = 2;
/** Implied volatility bid up ahead of the event. */
const IV_BEFORE = 0.52;
/** Where IV lands once the news is out — the crush. */
const IV_AFTER = 0.22;

type Outcome = { movePercent: number; label: string };

function drawOutcome(seed: number): Outcome {
  const r = mulberry32(seed);
  const roll = r();
  // A realistic distribution: most results move the stock less than the market
  // priced in, which is exactly why buying the straddle usually loses.
  if (roll < 0.35) return { movePercent: (r() - 0.5) * 2.5, label: 'In line with expectations' };
  if (roll < 0.7) return { movePercent: (r() < 0.5 ? -1 : 1) * (2.5 + r() * 3), label: 'A modest surprise' };
  if (roll < 0.92) return { movePercent: (r() < 0.5 ? -1 : 1) * (5.5 + r() * 4), label: 'A real surprise' };
  return { movePercent: (r() < 0.5 ? -1 : 1) * (10 + r() * 8), label: 'A shock' };
}

function priceStraddle(spot: number, days: number, iv: number): number {
  const base: Omit<OptionInputs, 'type'> = {
    spot,
    strike: STRIKE,
    timeToExpiry: daysToYears(days),
    volatility: iv,
    rate: RATE,
  };
  return blackScholesPrice({ ...base, type: 'call' }) + blackScholesPrice({ ...base, type: 'put' });
}

export function EarningsRoulette() {
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(1);
  const [call, setCall] = useState<'up' | 'down' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState<{ move: number; pnl: number; rightDirection: boolean }[]>([]);

  const startingCash = useAccountStore((s) => s.startingCash);
  useEffect(() => {
    void useAccountStore.getState().hydrate();
  }, []);

  const entryCost = useMemo(() => priceStraddle(SPOT, DAYS_BEFORE, IV_BEFORE), []);
  const outcome = useMemo(() => drawOutcome(seed + round * 7919), [seed, round]);

  const after = useMemo(() => {
    const newSpot = SPOT * (1 + outcome.movePercent / 100);
    return { spot: newSpot, value: priceStraddle(newSpot, DAYS_AFTER, IV_AFTER) };
  }, [outcome]);

  const pnl = after.value - entryCost;
  const rightDirection = call === null ? false : (outcome.movePercent > 0) === (call === 'up');

  /** What the position would be worth if IV had NOT collapsed. */
  const withoutCrush = useMemo(
    () => priceStraddle(after.spot, DAYS_AFTER, IV_BEFORE) - entryCost,
    [after.spot, entryCost],
  );

  const reveal = () => {
    setRevealed(true);
    setHistory((h) => [...h, { move: outcome.movePercent, pnl, rightDirection }]);
    // Banked the instant the results are announced — not held back for a
    // "file this run" click at the end of a whole earnings season.
    useAccountStore.getState().bankFill('earnings-roulette', pnl);
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setCall(null);
    setRevealed(false);
  };

  const wins = history.filter((h) => h.pnl > 0).length;
  const rightButLost = history.filter((h) => h.rightDirection && h.pnl < 0).length;

  const breakevenMove = useMemo(() => {
    // How far the stock must move for the post-crush straddle to be worth the
    // premium paid. Solved by scanning, because there is no closed form.
    for (let m = 0; m <= 40; m += 0.1) {
      if (priceStraddle(SPOT * (1 + m / 100), DAYS_AFTER, IV_AFTER) >= entryCost) return m;
    }
    return Infinity;
  }, [entryCost]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Cell label="Spot" value={SPOT.toFixed(0)} />
          <Cell label="Straddle costs" value={`₹${entryCost.toFixed(2)}`} />
          <Cell label="IV before" value={`${(IV_BEFORE * 100).toFixed(0)}%`} tone="down" />
          <Cell label="Days to expiry" value={String(DAYS_BEFORE)} />
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
          Results are out tomorrow. You buy the {STRIKE} straddle — a call and a put at the same strike — for{' '}
          <span className="num text-ink">₹{entryCost.toFixed(2)}</span>. Implied volatility is{' '}
          <span className="num">{(IV_BEFORE * 100).toFixed(0)}%</span>, well above normal, because the market knows
          something is coming.
        </p>

        <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-muted">
          For this to pay off after the announcement, the stock needs to move at least{' '}
          <span className="num text-accent">{breakevenMove.toFixed(1)}%</span>. Note that number before you guess.
        </p>

        {!revealed && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCall('up')}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: call === 'up' ? 'var(--color-up)' : 'var(--color-surface-2)',
                  color: call === 'up' ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
                }}
              >
                I think it goes up
              </button>
              <button
                onClick={() => setCall('down')}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: call === 'down' ? 'var(--color-down)' : 'var(--color-surface-2)',
                  color: call === 'down' ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
                }}
              >
                I think it goes down
              </button>
              <button
                onClick={reveal}
                disabled={call === null}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis disabled:opacity-30"
              >
                Announce the results
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">
              A straddle does not need you to be right about direction — but call it anyway, so you can see what
              happens when you are.
            </p>
          </>
        )}
      </div>

      {revealed && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-[11px] uppercase tracking-wider text-accent">{outcome.label}</div>
          <div className="num mt-2 text-2xl" style={{ color: outcome.movePercent >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
            {outcome.movePercent >= 0 ? '+' : ''}
            {outcome.movePercent.toFixed(2)}%
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Cell label="Spot now" value={after.spot.toFixed(2)} />
            <Cell label="IV after" value={`${(IV_AFTER * 100).toFixed(0)}%`} tone="up" />
            <Cell label="Straddle worth" value={`₹${after.value.toFixed(2)}`} />
            <Cell label="P&L" value={`₹${pnl.toFixed(2)}`} tone={pnl >= 0 ? 'up' : 'down'} />
          </div>

          <div className="mt-4 space-y-3">
            {rightDirection && pnl < 0 && (
              <p className="rounded-lg border border-down/50 bg-down/10 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
                <strong className="text-down">You called the direction correctly and lost money.</strong> The stock did
                what you said. Implied volatility fell from {(IV_BEFORE * 100).toFixed(0)}% to{' '}
                {(IV_AFTER * 100).toFixed(0)}% the moment the uncertainty resolved, and that repricing took more out of
                the position than the move put in. This is IV crush, and it is the reason buying options into a known
                event is such a reliable way to be right and poor.
              </p>
            )}

            <p className="text-[13px] leading-relaxed text-ink-muted">
              Had volatility stayed at {(IV_BEFORE * 100).toFixed(0)}%, this same move would have been worth{' '}
              <span className="num" style={{ color: withoutCrush >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
                ₹{withoutCrush.toFixed(2)}
              </span>
              . The difference between that and{' '}
              <span className="num">₹{pnl.toFixed(2)}</span> is the crush alone — nothing to do with direction, and
              nothing you could have avoided by being cleverer about the result.
            </p>
          </div>

          <button onClick={nextRound} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis">
            Another earnings season
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">
            {history.length} announcement{history.length === 1 ? '' : 's'}
          </div>
          <p className="mt-2 text-[13px] text-ink-muted">
            Profitable <span className="num">{wins}</span> of <span className="num">{history.length}</span>.
            {rightButLost > 0 && (
              <>
                {' '}
                Right about direction and still down on{' '}
                <span className="num text-down">{rightButLost}</span> of them.
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {history.map((h, i) => (
              <div
                key={i}
                title={`${h.move.toFixed(1)}% → ₹${h.pnl.toFixed(0)}`}
                className="num rounded px-2 py-1 text-[11px]"
                style={{
                  background: h.pnl >= 0 ? 'rgba(45,212,167,0.15)' : 'rgba(255,122,92,0.15)',
                  color: h.pnl >= 0 ? 'var(--color-up)' : 'var(--color-down)',
                }}
              >
                {h.move >= 0 ? '+' : ''}
                {h.move.toFixed(1)}%
              </div>
            ))}
          </div>

          <RunSubmit
            game="earnings-roulette"
            trades={history.map(
              (h): TradeRecord => ({
                // Committing to a direction before the reveal IS this game's
                // pre-commitment — the one dimension it genuinely shares with
                // the trade-discipline games. There is no stop to abandon and
                // no early exit to take, so those two report true rather than
                // being scored on something this game never offered.
                preCommitted: true,
                riskFraction: startingCash > 0 ? entryCost / startingCash : 0,
                honouredStop: true,
                exitedPerPlan: true,
                pnl: h.pnl,
                sizedFromStop: false,
                plannedRR: null,
                stoppedOut: false,
              }),
            )}
            pnl={history.reduce((s, h) => s + h.pnl, 0)}
            defaultReason={`Bought the straddle before ${history.length} earnings announcement${history.length === 1 ? '' : 's'}, calling direction each time before the reveal.`}
          />
        </div>
      )}

      <button
        onClick={() => {
          setSeed((s) => s + 101);
          setRound(0);
          setHistory([]);
          setCall(null);
          setRevealed(false);
        }}
        className="text-[13px] text-ink-faint underline underline-offset-4 hover:text-ink"
      >
        Reset with a different set of draws
      </button>

      <p className="text-[11px] text-ink-faint">
        Priced with Black–Scholes. Outcomes are drawn from a seeded distribution shaped so most results move the stock
        less than the market priced in — which is what the historical record shows and why the trade loses on average.
        This is a <strong>model</strong>, not a real earnings event.
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
