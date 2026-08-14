'use client';

/**
 * Chart Replay — the core engine game.
 *
 * Real historical bars, streamed from the server ONE AT A TIME, with the symbol
 * and the dates hidden. Hiding them matters: told it is Reliance in March 2020,
 * a learner stops making a decision and starts recalling an outcome. The point
 * is judgement under genuine uncertainty, which requires the uncertainty to be
 * genuine — so the future bars are not in this page, not in a fetch response,
 * and not obtainable by any request the client can make.
 *
 * Pre-commitment is enforced: you cannot take a position without first writing
 * a thesis and setting a stop. That is the P5 answer — we cannot manufacture
 * the fear of real money, but we can train the behaviour that survives it.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CandleChart, type ChartMarker, type PriceLine } from '@/components/chart/CandleChart';
import { ChartToolbar } from '@/components/chart/ChartToolbar';
import { computeIndicators, type IndicatorId } from '@/lib/analysis/indicators';
import { RemoteReplay, type VerifiedTrade } from '@/lib/replay/client';
import { newOrderState } from '@/lib/engine/order';
import { applyFill, equity, newAccount, type Account } from '@/lib/engine/portfolio';
import { MIN_PLANNED_RR, processScore, type TradeRecord } from '@/lib/progress/mastery';
import { BASE_STARTING_CASH } from '@/lib/account/balance';
import { RunSubmit } from './RunSubmit';
import type { Candle } from '@/lib/market/types';

/**
 * A 'stop'/'target'/'session-end' close was not a decision — the level was
 * reached and the server squared it off, full stop. Only a 'manual' close
 * (the learner clicked an exit button before either level was reached) still
 * carries the self-reported plan/impulse distinction, per the whichever
 * button was actually clicked.
 */
function toTradeRecord(v: VerifiedTrade, manualClickWasImpulse = false): TradeRecord {
  const mechanical = v.reason !== 'manual';
  return {
    preCommitted: v.preCommitted,
    riskFraction: v.riskFraction,
    honouredStop: mechanical || !manualClickWasImpulse,
    exitedPerPlan: mechanical || !manualClickWasImpulse,
    pnl: v.pnl,
    sizedFromStop: true,
    plannedRR: v.plannedRR,
    stoppedOut: v.stoppedOut,
  };
}

type Stance = 'flat' | 'long' | 'short';

interface Entry {
  stance: Exclude<Stance, 'flat'>;
  price: number;
  stop: number;
  target: number;
  /**
   * Reward against risk, fixed at entry. Recorded because the alternative —
   * judging the trade on what it made — cannot tell a good decision from a
   * lucky one, and this can. Client-side display only now — the number that
   * actually feeds the score is recomputed server-side in closePosition().
   */
  plannedRR: number;
  thesis: string;
  /**
   * The server's id for this open position (see server-session.ts). Every
   * scored field on the trade this position becomes — pnl, stoppedOut,
   * plannedRR, preCommitted, riskFraction — is derived server-side from what
   * was actually recorded at open, not from anything in this object.
   */
  positionId: string;
}

export function ChartReplay() {
  const [replay, setReplay] = useState<RemoteReplay | null>(null);
  const [visible, setVisible] = useState<Candle[]>([]);
  /**
   * The real, persistent balance — fetched fresh each time a session starts
   * (see `load()`), so it always reflects the running total every other
   * recorded run has already fed into `user_stats.net_pnl`. Defaults to the
   * shared base until that fetch resolves.
   */
  const [startingCash, setStartingCash] = useState(BASE_STARTING_CASH);
  const [account, setAccount] = useState<Account>(() =>
    newAccount({ market: 'IN', venue: 'NSE', startingCash: BASE_STARTING_CASH }),
  );
  const [stance, setStance] = useState<Stance>('flat');
  const [entry, setEntry] = useState<Entry | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [markers, setMarkers] = useState<ChartMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [revealed, setRevealed] = useState<{ symbol: string; candles: Candle[] } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [lastFill, setLastFill] = useState<string | null>(null);
  /** True while an open/close-position round trip to the server is in flight. */
  const [committing, setCommitting] = useState(false);

  const [thesis, setThesis] = useState('');
  const [stopPercent, setStopPercent] = useState(3);
  /**
   * Where you are getting out on the GOOD side. Asked for at the same moment as
   * the stop, and for the same reason: a decision made before the position
   * exists is the only one not contaminated by watching it move.
   */
  const [targetPercent, setTargetPercent] = useState(6);
  /** Every thesis written this run, so the debrief can pre-fill the reason. */
  const [theses, setTheses] = useState<string[]>([]);
  /** Indicator choices persist across replays — a trader keeps their layout. */
  const [indicators, setIndicators] = useState<IndicatorId[]>(['sma20', 'volume']);

  const toggleIndicator = (id: IndicatorId) =>
    setIndicators((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  const load = useCallback(async () => {
    try {
      // Fetched fresh every time — the one account this game shares with
      // every other cash-based one, not a number invented for this session.
      const cash = await fetch('/api/account/balance')
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { startingCash: number } | null) => data?.startingCash ?? BASE_STARTING_CASH)
        .catch(() => BASE_STARTING_CASH);

      const r = await RemoteReplay.start();
      setReplay(r);
      setVisible(r.visible);
      setRemaining(r.remaining);
      setStartingCash(cash);
      setAccount(newAccount({ market: 'IN', venue: 'NSE', startingCash: cash }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start a replay.');
    } finally {
      setLoading(false);
    }
  }, []);

  const restart = useCallback(() => {
    setLoading(true);
    setError(null);
    setFinished(false);
    setRevealed(null);
    setTrades([]);
    setTheses([]);
    setMarkers([]);
    setEntry(null);
    setStance('flat');
    setLastFill(null);
    setCommitting(false);
    void load();
  }, [load]);

  useEffect(() => {
    // Mount-time network fetch. Every state write happens after an await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const price = visible.length > 0 ? visible[visible.length - 1].close : 0;

  const advance = useCallback(async () => {
    if (!replay || stepping || committing || replay.finished) return;
    setStepping(true);
    try {
      const result = await replay.step();
      setVisible(replay.visible);
      setRemaining(replay.remaining);

      let acct = account;
      for (const f of result.fills) {
        if (f.result.quantity <= 0) continue;
        acct = applyFill(acct, {
          symbol: 'REPLAY',
          product: 'intraday',
          side: f.order.side,
          quantity: f.result.quantity,
          price: f.result.price,
          at: result.bar.time * 1000,
        }).account;

        setMarkers((m) => [
          ...m,
          {
            time: result.bar.time,
            position: f.order.side === 'buy' ? 'belowBar' : 'aboveBar',
            color: f.order.side === 'buy' ? '#2dd4a7' : '#ff7a5c',
            shape: f.order.side === 'buy' ? 'arrowUp' : 'arrowDown',
            text: `${f.order.side === 'buy' ? 'B' : 'S'} ${f.result.price.toFixed(2)}`,
          },
        ]);
        setLastFill(f.result.explanation);
      }

      // The bar just revealed reached the stop or the target — or the
      // replay ran out of bars with a position still open. Either way the
      // server already closed it; this is telling the UI, not asking it.
      if (result.autoClosed && entry && result.autoClosed.positionId === entry.positionId) {
        const { exitPrice, trade } = result.autoClosed;
        const pos = Object.values(acct.positions)[0];
        if (pos) {
          acct = applyFill(acct, {
            symbol: 'REPLAY',
            product: 'intraday',
            side: pos.quantity > 0 ? 'sell' : 'buy',
            quantity: Math.abs(pos.quantity),
            price: exitPrice,
            at: result.bar.time * 1000,
          }).account;

          setMarkers((m) => [
            ...m,
            {
              time: result.bar.time,
              position: pos.quantity > 0 ? 'aboveBar' : 'belowBar',
              color: trade.reason === 'target' ? '#2dd4a7' : '#ff7a5c',
              shape: pos.quantity > 0 ? 'arrowDown' : 'arrowUp',
              text: `${trade.reason === 'target' ? 'Target' : trade.reason === 'stop' ? 'Stop' : 'Closed'} ${exitPrice.toFixed(2)}`,
            },
          ]);
        }

        setLastFill(
          trade.reason === 'target'
            ? `Target reached — squared off at ₹${exitPrice.toFixed(2)}. The plan paid, and it closed on its own.`
            : trade.reason === 'stop'
              ? `Stop hit — squared off at ₹${exitPrice.toFixed(2)}. The plan closed itself; there was nothing left to decide.`
              : `The replay ended with the position still open — squared off at ₹${exitPrice.toFixed(2)}, the last price dealt.`,
        );

        setTrades((t) => [...t, toTradeRecord(trade)]);
        setEntry(null);
        setStance('flat');
      }

      setAccount(acct);

      if (result.finished) {
        setFinished(true);
        setRevealed(await replay.reveal());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The replay could not continue.');
    } finally {
      setStepping(false);
    }
  }, [replay, stepping, committing, account, entry]);

  const takePosition = async (next: Exclude<Stance, 'flat'>) => {
    if (!replay || committing) return;
    setCommitting(true);
    try {
      const side = next === 'long' ? 'buy' : 'sell';
      // Recorded with the server FIRST, at the price it just dealt — this is
      // what makes pnl/stoppedOut/plannedRR/preCommitted/riskFraction on the
      // eventual trade record real rather than a client-side assertion.
      const opened = await replay.openPosition({
        side,
        stopPct: stopPercent,
        targetPct: targetPercent,
        hasThesis: thesis.trim().length > 0,
      });

      const stop = next === 'long' ? price * (1 - stopPercent / 100) : price * (1 + stopPercent / 100);
      const quantity = Math.max(1, Math.floor((account.cash * 0.5) / price));

      replay.submit(
        newOrderState({
          id: `entry-${replay.index}`,
          symbol: 'REPLAY',
          side,
          quantity,
          type: 'MARKET',
          product: 'intraday',
          validity: 'DAY',
          placedAt: Date.now(),
        }),
      );

      const target = next === 'long' ? price * (1 + targetPercent / 100) : price * (1 - targetPercent / 100);

      setEntry({
        stance: next,
        price: opened.entryPrice,
        stop,
        target,
        plannedRR: targetPercent / stopPercent,
        thesis,
        positionId: opened.id,
      });
      setTheses((t) => [...t, `${next} from ${opened.entryPrice.toFixed(2)}: ${thesis.trim()}`]);
      setStance(next);
      setThesis('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the position.');
    } finally {
      setCommitting(false);
    }
  };

  const closePosition = async (reason: 'plan' | 'impulse') => {
    if (!replay || !entry || committing) return;
    setCommitting(true);
    try {
      const pos = Object.values(account.positions)[0];
      if (pos) {
        replay.submit(
          newOrderState({
            id: `exit-${replay.index}`,
            symbol: 'REPLAY',
            side: pos.quantity > 0 ? 'sell' : 'buy',
            quantity: Math.abs(pos.quantity),
            type: 'MARKET',
            product: 'intraday',
            validity: 'DAY',
            placedAt: Date.now(),
          }),
        );
      }

      // The server closes at the price it just dealt and derives every
      // mechanically-checkable field from its own record of the position —
      // see closePosition() in server-session.ts. `honouredStop` and
      // `exitedPerPlan` are the one part of this game that is genuinely
      // self-reported: they ask whether the exit was calm or a panic, which
      // is a fact about the trader, not the market, and has no server-side
      // test.
      const verified = await replay.closePosition(entry.positionId);
      setTrades((t) => [...t, toTradeRecord(verified, reason === 'impulse')]);
      setEntry(null);
      setStance('flat');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not close the position.');
    } finally {
      setCommitting(false);
    }
  };

  /**
   * Indicators are computed from the bars ON SCREEN, never from the full
   * series — which the server has not sent anyway. See the no-lookahead tests
   * in src/lib/analysis/indicators.test.ts.
   */
  const shown = revealed?.candles ?? visible;
  const computed = useMemo(() => computeIndicators(shown), [shown]);

  /** Entry and stop drawn on the chart, so the plan is visible while you hold. */
  const priceLines: PriceLine[] = useMemo(() => {
    if (!entry) return [];
    return [
      { price: entry.price, label: 'entry', colour: '#f0b429' },
      { price: entry.stop, label: 'stop', colour: '#ff7a5c', style: 'dashed' as const },
      { price: entry.target, label: 'target', colour: '#2dd4a7', style: 'dashed' as const },
    ];
  }, [entry]);

  if (loading) {
    return <div className="rounded-xl border border-line bg-surface p-8 text-ink-muted">Loading real market history…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/50 bg-danger/10 p-5 text-sm">
        <div className="text-danger">{error}</div>
        <button onClick={restart} className="mt-3 rounded-lg border border-line-strong px-3 py-1.5 text-ink-muted">
          Try again
        </button>
      </div>
    );
  }

  const eq = equity(account, { REPLAY: price });
  const score = trades.length > 0 ? processScore(trades) : null;
  const plannedRR = targetPercent / stopPercent;
  /** The hit rate this ratio demands: 1/(1+RR), as a percentage. */
  const breakEvenRate = (100 / (1 + plannedRR));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">
            {revealed ? `Revealed: ${revealed.symbol}` : 'Symbol and dates hidden · future bars are on the server'}
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="num text-sm">
              <span className="text-ink-faint">Last</span> {price.toFixed(2)}
              <span className="ml-4 text-ink-faint">Equity</span>{' '}
              <span style={{ color: eq >= startingCash ? 'var(--color-up)' : 'var(--color-down)' }}>
                ₹{Math.round(eq).toLocaleString('en-IN')}
              </span>
              <span className="ml-4 text-ink-faint">{remaining} bars left</span>
            </div>
            {!finished && (
              <button
                onClick={() => void advance()}
                disabled={stepping || committing}
                className="num rounded-lg border border-line-strong px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                {stepping ? 'Revealing…' : 'Next bar →'}
              </button>
            )}
          </div>
        </div>

        <CandleChart candles={shown} markers={markers} priceLines={priceLines} indicators={indicators} />

        <div className="mt-3">
          <ChartToolbar
            active={indicators}
            onToggle={toggleIndicator}
            computed={computed}
            barCount={shown.length}
          />
        </div>
      </div>

      {lastFill && !finished && (
        <p className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-[13px] text-ink-muted">{lastFill}</p>
      )}

      {!finished && (
        <div className="rounded-xl border border-line bg-surface p-5">
          {stance === 'flat' ? (
            <>
              <div className="text-[11px] uppercase tracking-wider text-accent">Before you can enter</div>
              <label className="mt-3 block">
                <span className="text-sm text-ink-muted">Why? One line. This is your thesis.</span>
                <input
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="e.g. holding above the prior swing low on rising volume"
                  className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-line-strong"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-sm text-ink-muted">
                  Stop distance: <span className="num text-ink">{stopPercent}%</span> (
                  <span className="num">{(price * (1 - stopPercent / 100)).toFixed(2)}</span> if long)
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={stopPercent}
                  onChange={(e) => setStopPercent(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--color-accent)]"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-sm text-ink-muted">
                  Target: <span className="num text-ink">{targetPercent}%</span> (
                  <span className="num">{(price * (1 + targetPercent / 100)).toFixed(2)}</span> if long)
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--color-accent)]"
                />
              </label>

              {/* The number that decides whether this is worth taking at all,
                  shown before entry rather than explained after it. */}
              <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2">
                <span className="text-[11px] uppercase tracking-wider text-ink-faint">Reward against risk</span>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
                  <span
                    className="num text-lg"
                    style={{ color: plannedRR >= MIN_PLANNED_RR ? 'var(--color-up)' : 'var(--color-down)' }}
                  >
                    {plannedRR.toFixed(2)}:1
                  </span>
                  <span className="text-[13px] text-ink-muted">
                    You need to be right {breakEvenRate.toFixed(0)}% of the time just to break even, before costs.
                  </span>
                </div>
                {plannedRR < MIN_PLANNED_RR && (
                  <p className="mt-1.5 text-[13px] text-ink-faint">
                    You can still take it. It will not earn XP, because a run has to plan for at least{' '}
                    {MIN_PLANNED_RR}:1 — below that the hit rate you need is one almost nobody sustains.
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  disabled={thesis.trim().length === 0 || stepping || committing}
                  onClick={() => void takePosition('long')}
                  className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
                  style={{ background: 'var(--color-up)', color: 'var(--color-on-emphasis)' }}
                >
                  Go long
                </button>
                <button
                  disabled={thesis.trim().length === 0 || stepping || committing}
                  onClick={() => void takePosition('short')}
                  className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
                  style={{ background: 'var(--color-down)', color: 'var(--color-on-emphasis)' }}
                >
                  Go short
                </button>
                <button
                  onClick={() => void advance()}
                  disabled={stepping || committing}
                  className="rounded-lg border border-line-strong px-4 py-2 text-sm text-ink-muted disabled:opacity-40"
                >
                  {stepping ? 'Revealing…' : 'Stay flat, next bar →'}
                </button>
              </div>
              {thesis.trim().length === 0 && (
                <p className="mt-2 text-[13px] text-ink-faint">
                  Write the thesis first. A position you cannot explain in one line is a position you cannot evaluate
                  afterwards.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-4 text-sm">
                <span
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: stance === 'long' ? 'var(--color-up)' : 'var(--color-down)' }}
                >
                  {stance}
                </span>
                <span className="num text-ink-muted">
                  from {entry?.price.toFixed(2)} · stop {entry?.stop.toFixed(2)} · target {entry?.target.toFixed(2)} ·{' '}
                  {entry?.plannedRR.toFixed(2)}:1
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink-faint">Your thesis: &ldquo;{entry?.thesis}&rdquo;</p>
              <p className="mt-2 text-[13px] text-ink-faint">
                This closes on its own the moment price reaches your stop or your target — whichever comes first.
                There is nothing to watch for; the buttons below are only for leaving early.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => void advance()}
                  disabled={stepping || committing}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis disabled:opacity-40"
                >
                  {stepping ? 'Revealing…' : 'Hold, next bar →'}
                </button>
                <button
                  onClick={() => void closePosition('plan')}
                  disabled={committing}
                  className="rounded-lg border border-line-strong px-4 py-2 text-sm text-ink-muted disabled:opacity-40"
                >
                  Exit — thesis played out
                </button>
                <button
                  onClick={() => void closePosition('impulse')}
                  disabled={committing}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-ink-faint disabled:opacity-40"
                >
                  Exit — I just want out
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {finished && (
        <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
          <div className="text-[11px] uppercase tracking-wider text-accent">Debrief</div>
          {score ? (
            <>
              <div className="num mt-2 text-3xl">
                {score.score}
                <span className="text-lg text-ink-faint">/100 process</span>
              </div>
              <p className="num mt-1 text-sm text-ink-faint">
                Equity ₹{Math.round(eq).toLocaleString('en-IN')} from a balance of ₹
                {Math.round(startingCash).toLocaleString('en-IN')} · charges paid ₹
                {account.totalCharges.toFixed(2)} · max drawdown {(account.maxDrawdown * 100).toFixed(1)}%
              </p>
              <ul className="mt-4 space-y-1.5">
                {Object.entries(score.components).map(([k, c]) => (
                  <li key={k} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-ink-muted">{c.note}</span>
                    <span className="num shrink-0">
                      {c.earned.toFixed(0)}/{c.possible}
                    </span>
                  </li>
                ))}
              </ul>
              {score.warnings.map((w) => (
                <p key={w} className="mt-3 rounded-lg bg-surface px-3 py-2 text-[13px] text-ink-muted">
                  {w}
                </p>
              ))}
              <RunSubmit
                game="chart-replay"
                sessionId={replay?.sessionId}
                trades={trades}
                pnl={eq - startingCash}
                defaultReason={theses.join('\n')}
              />
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              You stayed flat the whole way. That is a legitimate decision and it costs nothing — which is more than can
              be said for most of the alternatives.
            </p>
          )}
          <button onClick={restart} className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis">
            New replay
          </button>
        </div>
      )}
    </div>
  );
}
