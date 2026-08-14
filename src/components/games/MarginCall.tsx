'use client';

/**
 * Margin Call — leverage and forced liquidation.
 *
 * Real historical bars, streamed the same way Chart Replay streams them: one
 * at a time from the server, future hidden. What's new is what sits on top —
 * a leveraged position whose liquidation price is computed and drawn on the
 * chart the moment you enter, so the danger line is visible from the start,
 * not discovered after the fact. The lesson is not "leverage is risky" as a
 * sentence; it's watching a bar's low cross a line you could see the whole
 * time and getting closed out at a worse price than you would have chosen —
 * see lib/engine/margin.ts for why that price is worse.
 *
 * Trust note: unlike Chart Replay, positions here are NOT opened/closed
 * through the server session — margin/liquidation math is computed
 * client-side against the bars the server already revealed. That is the
 * same trust level six of the other nine games already run at (only Chart
 * Replay verifies trades server-side), and it costs nothing here because
 * this app never ranks on P&L in the first place (PLAN.md §7 rule 4).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CandleChart, type ChartMarker, type PriceLine } from '@/components/chart/CandleChart';
import { RemoteReplay } from '@/lib/replay/client';
import {
  LEVERAGE_OPTIONS,
  liquidationPriceFor,
  marginStateAt,
  sharesForMargin,
  type Leverage,
} from '@/lib/engine/margin';
import { MIN_PLANNED_RR, processScore, type TradeRecord } from '@/lib/progress/mastery';
import { BASE_STARTING_CASH } from '@/lib/account/balance';
import { useAccountStore } from '@/lib/account/store';
import { RunSubmit } from './RunSubmit';
import type { Candle } from '@/lib/market/types';

interface Entry {
  leverage: Leverage;
  marginPosted: number;
  shares: number;
  entryPrice: number;
  stop: number;
  target: number;
  plannedRR: number;
  thesis: string;
}

type CloseReason = 'liquidated' | 'stop' | 'target' | 'manual' | 'session-end';

interface ClosedTrade {
  entryPrice: number;
  exitPrice: number;
  marginPosted: number;
  leverage: Leverage;
  pnl: number;
  reason: CloseReason;
  plannedRR: number;
  thesis: string;
}

function toTradeRecord(t: ClosedTrade): TradeRecord {
  return {
    preCommitted: t.thesis.trim().length > 0,
    // How much of the account this one position put up as margin — not the
    // notional it controlled, which is the whole point being tested.
    riskFraction: 0, // filled in by the caller, which knows the balance this margin was posted against
    // Being forced out by the exchange is a different failure from honouring
    // your own stop — it means the position was sized past what your own
    // plan would have survived.
    honouredStop: t.reason !== 'liquidated',
    exitedPerPlan: t.reason !== 'manual',
    pnl: t.pnl,
    sizedFromStop: true,
    plannedRR: t.plannedRR,
    stoppedOut: t.reason === 'stop' || t.reason === 'liquidated',
  };
}

const SESSION_BARS_LABEL = 'bars left';

export function MarginCall() {
  const [replay, setReplay] = useState<RemoteReplay | null>(null);
  const [visible, setVisible] = useState<Candle[]>([]);
  const [startingCash, setStartingCash] = useState(BASE_STARTING_CASH);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [revealed, setRevealed] = useState<{ symbol: string; candles: Candle[] } | null>(null);

  const [entry, setEntry] = useState<Entry | null>(null);
  const [closed, setClosed] = useState<ClosedTrade[]>([]);
  const [markers, setMarkers] = useState<ChartMarker[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const [leverage, setLeverage] = useState<Leverage>(LEVERAGE_OPTIONS[0]);
  const [marginPercent, setMarginPercent] = useState(20);
  const [thesis, setThesis] = useState('');
  const [stopPercent, setStopPercent] = useState(8);
  const [targetPercent, setTargetPercent] = useState(16);
  const [theses, setTheses] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      // The one account every cash-based game shares — margin comes out of
      // this balance and nowhere else, and what this run wins or loses is
      // banked straight back into it on submit, same as every other game.
      await useAccountStore.getState().hydrate();
      const cash = useAccountStore.getState().startingCash;
      const r = await RemoteReplay.start();
      setReplay(r);
      setVisible(r.visible);
      setRemaining(r.remaining);
      setStartingCash(cash);
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
    setClosed([]);
    setTheses([]);
    setMarkers([]);
    setEntry(null);
    setLastEvent(null);
    void load();
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const price = visible.length > 0 ? visible[visible.length - 1].close : 0;

  const margin = useMemo(() => {
    if (!entry) return null;
    return marginStateAt({ entryPrice: entry.entryPrice, price, shares: entry.shares, marginPosted: entry.marginPosted });
  }, [entry, price]);

  const goLong = () => {
    if (!replay || price <= 0 || entry) return;
    const marginPosted = Math.round((startingCash * marginPercent) / 100);
    const shares = sharesForMargin(price, marginPosted, leverage);
    const stop = price * (1 - stopPercent / 100);
    const target = price * (1 + targetPercent / 100);
    setEntry({
      leverage,
      marginPosted,
      shares,
      entryPrice: price,
      stop,
      target,
      plannedRR: targetPercent / stopPercent,
      thesis,
    });
    setTheses((t) => [...t, `${leverage}x from ${price.toFixed(2)}: ${thesis.trim()}`]);
    setLastEvent(
      `Opened ${leverage}x long — ₹${marginPosted.toLocaleString('en-IN')} margin controls ${shares.toFixed(2)} shares.`,
    );
    setThesis('');
  };

  const addMargin = () => {
    if (!entry) return;
    const room = startingCash - entry.marginPosted;
    if (room <= 0) return;
    const top = Math.min(room, Math.round(startingCash * 0.1));
    setEntry({ ...entry, marginPosted: entry.marginPosted + top });
    setLastEvent(`Added ₹${top.toLocaleString('en-IN')} of margin — the liquidation line just moved down.`);
  };

  const closeManually = () => {
    if (!entry || price <= 0) return;
    finalizePosition(entry, price, 'manual');
  };

  const finalizePosition = (e: Entry, exitPrice: number, reason: CloseReason) => {
    const pnl = e.marginPosted + e.shares * (exitPrice - e.entryPrice) - e.marginPosted;
    const trade: ClosedTrade = {
      entryPrice: e.entryPrice,
      exitPrice,
      marginPosted: e.marginPosted,
      leverage: e.leverage,
      pnl,
      reason,
      plannedRR: e.plannedRR,
      thesis: e.thesis,
    };
    setClosed((c) => [...c, trade]);
    setEntry(null);
    // Banked the instant the position closes — not held back for the
    // debrief's "file this run" click, which is about XP and reasoning.
    useAccountStore.getState().bankFill('margin-call', pnl);

    const colour = reason === 'liquidated' ? '#ff7a5c' : pnl >= 0 ? '#2dd4a7' : '#ff7a5c';
    setMarkers((m) => [
      ...m,
      {
        time: Math.floor(Date.now() / 1000),
        position: 'aboveBar',
        color: colour,
        shape: 'arrowDown',
        text: `${reason === 'liquidated' ? 'MARGIN CALL' : reason === 'stop' ? 'Stop' : reason === 'target' ? 'Target' : 'Closed'} ${exitPrice.toFixed(2)}`,
      },
    ]);
    setLastEvent(
      reason === 'liquidated'
        ? `Forced out at ₹${exitPrice.toFixed(2)} — the exchange's price, not yours. Margin gone: ₹${Math.abs(pnl).toLocaleString('en-IN')}.`
        : reason === 'stop'
          ? `Your own stop hit first — closed at ₹${exitPrice.toFixed(2)}, before liquidation was ever in play.`
          : reason === 'target'
            ? `Target reached — closed at ₹${exitPrice.toFixed(2)}.`
            : `Closed manually at ₹${exitPrice.toFixed(2)}.`,
    );
  };

  const advance = useCallback(async () => {
    if (!replay || stepping || replay.finished) return;
    setStepping(true);
    try {
      const result = await replay.step();
      setVisible(replay.visible);
      setRemaining(replay.remaining);

      if (entry) {
        const bar = result.bar;
        const liq = liquidationPriceFor({ entryPrice: entry.entryPrice, shares: entry.shares, marginPosted: entry.marginPosted });
        const stopPrice = entry.stop;
        // Whichever downside line the bar's low reached, hit FIRST as price
        // fell through the bar — that is whichever is closer to entry, i.e.
        // the higher of the two prices.
        const downside = bar.low <= Math.max(liq, stopPrice) ? Math.max(liq, stopPrice) : null;
        const hitLiquidation = downside !== null && downside === liq;
        const hitStop = downside !== null && !hitLiquidation;
        const hitTarget = !downside && bar.high >= entry.target;

        if (hitLiquidation) {
          // Gapped through the line — filled at the worse price the bar
          // actually opened or traded at, not the line itself.
          const exitPrice = bar.open <= liq ? bar.open : liq;
          finalizePosition(entry, exitPrice, 'liquidated');
        } else if (hitStop) {
          const exitPrice = bar.open <= stopPrice ? bar.open : stopPrice;
          finalizePosition(entry, exitPrice, 'stop');
        } else if (hitTarget) {
          const exitPrice = bar.open >= entry.target ? bar.open : entry.target;
          finalizePosition(entry, exitPrice, 'target');
        } else if (result.finished) {
          finalizePosition(entry, bar.close, 'session-end');
        }
      }

      if (result.finished) {
        setFinished(true);
        setRevealed(await replay.reveal());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The replay could not continue.');
    } finally {
      setStepping(false);
    }
  }, [replay, stepping, entry]);

  const shown = revealed?.candles ?? visible;

  const priceLines: PriceLine[] = useMemo(() => {
    if (!entry) return [];
    const liq = liquidationPriceFor({ entryPrice: entry.entryPrice, shares: entry.shares, marginPosted: entry.marginPosted });
    return [
      { price: entry.entryPrice, label: 'entry', colour: '#f0b429' },
      { price: entry.stop, label: 'your stop', colour: '#ff9f6b', style: 'dashed' as const },
      { price: entry.target, label: 'target', colour: '#2dd4a7', style: 'dashed' as const },
      { price: liq, label: 'MARGIN CALL', colour: '#ff3b30' },
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

  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const unleveragedTotal = closed.reduce((s, t) => {
    const unleveragedShares = t.marginPosted / t.entryPrice;
    return s + unleveragedShares * (t.exitPrice - t.entryPrice);
  }, 0);
  const trades: TradeRecord[] = closed.map((t) => ({ ...toTradeRecord(t), riskFraction: t.marginPosted / startingCash }));
  const score = trades.length > 0 ? processScore(trades) : null;
  const plannedRR = targetPercent / stopPercent;
  const previewMargin = Math.round((startingCash * marginPercent) / 100);
  const previewShares = price > 0 ? sharesForMargin(price, previewMargin, leverage) : 0;
  const previewLiq =
    price > 0 ? liquidationPriceFor({ entryPrice: price, shares: previewShares, marginPosted: previewMargin }) : 0;
  const previewDrop = price > 0 ? ((price - previewLiq) / price) * 100 : 0;

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
              {margin && (
                <>
                  <span className="ml-4 text-ink-faint">Equity</span>{' '}
                  <span style={{ color: margin.equity >= entry!.marginPosted ? 'var(--color-up)' : 'var(--color-down)' }}>
                    ₹{Math.round(margin.equity).toLocaleString('en-IN')}
                  </span>
                  <span className="ml-4 text-ink-faint">To margin call</span>{' '}
                  <span style={{ color: margin.distanceToCallPercent < 3 ? 'var(--color-down)' : 'var(--color-ink)' }}>
                    {margin.distanceToCallPercent.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="ml-4 text-ink-faint">
                {remaining} {SESSION_BARS_LABEL}
              </span>
            </div>
            {!finished && (
              <button
                onClick={() => void advance()}
                disabled={stepping}
                className="num rounded-lg border border-line-strong px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                {stepping ? 'Revealing…' : 'Next bar →'}
              </button>
            )}
          </div>
        </div>

        <CandleChart candles={shown} markers={markers} priceLines={priceLines} />
      </div>

      {lastEvent && !finished && (
        <p className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-[13px] text-ink-muted">{lastEvent}</p>
      )}

      {!finished && (
        <div className="rounded-xl border border-line bg-surface p-5">
          {!entry ? (
            <>
              <div className="text-[11px] uppercase tracking-wider text-accent">Before you can enter</div>

              <label className="mt-3 block">
                <span className="text-sm text-ink-muted">Leverage</span>
                <div className="mt-1 flex gap-1">
                  {LEVERAGE_OPTIONS.map((lv) => (
                    <button
                      key={lv}
                      onClick={() => setLeverage(lv)}
                      aria-pressed={leverage === lv}
                      className="num flex-1 rounded-md px-2 py-1.5 text-[12px] transition-colors"
                      style={{
                        background: leverage === lv ? 'var(--color-accent)' : 'var(--color-surface-2)',
                        color: leverage === lv ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
                      }}
                    >
                      {lv}x
                    </button>
                  ))}
                </div>
              </label>

              <label className="mt-3 block">
                <span className="text-sm text-ink-muted">
                  Margin posted: <span className="num text-ink">{marginPercent}%</span> of balance (
                  <span className="num">₹{previewMargin.toLocaleString('en-IN')}</span>)
                </span>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--color-accent)]"
                />
              </label>

              <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[13px]">
                <span className="text-ink-muted">Controls</span> <span className="num text-ink">{previewShares.toFixed(2)} shares</span>{' '}
                <span className="text-ink-muted">— margin call at</span>{' '}
                <span className="num text-danger">₹{previewLiq.toFixed(2)}</span>{' '}
                <span className="text-ink-muted">({previewDrop.toFixed(1)}% away)</span>
              </div>

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
                  Your own stop: <span className="num text-ink">{stopPercent}%</span> (
                  <span className="num">{(price * (1 - stopPercent / 100)).toFixed(2)}</span>)
                </span>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={stopPercent}
                  onChange={(e) => setStopPercent(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--color-accent)]"
                />
              </label>
              {previewDrop < stopPercent && (
                <p className="mt-1.5 text-[13px] text-danger">
                  Your stop is further away than the margin call line — the exchange will close you out before your
                  own plan ever gets the chance to.
                </p>
              )}

              <label className="mt-3 block">
                <span className="text-sm text-ink-muted">
                  Target: <span className="num text-ink">{targetPercent}%</span> (
                  <span className="num">{(price * (1 + targetPercent / 100)).toFixed(2)}</span>)
                </span>
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--color-accent)]"
                />
              </label>

              <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2">
                <span className="text-[11px] uppercase tracking-wider text-ink-faint">Reward against risk</span>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
                  <span className="num text-lg" style={{ color: plannedRR >= MIN_PLANNED_RR ? 'var(--color-up)' : 'var(--color-down)' }}>
                    {plannedRR.toFixed(2)}:1
                  </span>
                </div>
              </div>

              <button
                disabled={thesis.trim().length === 0 || stepping || price <= 0}
                onClick={goLong}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
                style={{ background: 'var(--color-up)', color: 'var(--color-on-emphasis)' }}
              >
                Go long, {leverage}x
              </button>
              <button
                onClick={() => void advance()}
                disabled={stepping}
                className="ml-2 rounded-lg border border-line-strong px-4 py-2 text-sm text-ink-muted disabled:opacity-40"
              >
                {stepping ? 'Revealing…' : 'Stay flat, next bar →'}
              </button>
              {thesis.trim().length === 0 && (
                <p className="mt-2 text-[13px] text-ink-faint">
                  Write the thesis first. A leveraged position you cannot explain in one line is one you will not be
                  able to defend when the margin-call meter starts moving.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-4 text-sm">
                <span className="text-[11px] uppercase tracking-wider text-up">{entry.leverage}x long</span>
                <span className="num text-ink-muted">
                  from {entry.entryPrice.toFixed(2)} · margin ₹{entry.marginPosted.toLocaleString('en-IN')} · stop{' '}
                  {entry.stop.toFixed(2)} · target {entry.target.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink-faint">Your thesis: &ldquo;{entry.thesis}&rdquo;</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => void advance()}
                  disabled={stepping}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis disabled:opacity-40"
                >
                  {stepping ? 'Revealing…' : 'Hold, next bar →'}
                </button>
                <button
                  onClick={addMargin}
                  disabled={entry.marginPosted >= startingCash}
                  className="rounded-lg border border-line-strong px-4 py-2 text-sm text-ink-muted disabled:opacity-40"
                >
                  Add margin
                </button>
                <button
                  onClick={closeManually}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-ink-faint"
                >
                  Close now
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
                Leveraged result ₹{Math.round(totalPnl).toLocaleString('en-IN')} · the same margin at 1x would have made ₹
                {Math.round(unleveragedTotal).toLocaleString('en-IN')}
              </p>
              {closed.some((t) => t.reason === 'liquidated') && (
                <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[13px] text-ink-muted">
                  At least one position here was closed by a margin call, not by you. That is the entire lesson: the
                  exchange does not ask what your thesis was, and it does not wait for a better price.
                </p>
              )}
              <RunSubmit game="margin-call" trades={trades} pnl={totalPnl} defaultReason={theses.join('\n')} />
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              You stayed flat the whole way. No margin call to survive, and nothing learned about your own limit
              either.
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
