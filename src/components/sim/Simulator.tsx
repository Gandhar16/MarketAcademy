'use client';

/**
 * The live simulator — a thin renderer over `src/lib/sim/reducer.ts`.
 *
 * All trading logic (validation, matching, fills, charges, drawdown) lives in
 * the reducer, which is pure and unit-tested. This file fetches quotes and
 * draws things.
 *
 * What separates it from a free paper-trading account:
 *  • the account is ₹1,00,000 — what a first real account looks like, and small
 *    enough that a ₹15 DP charge is visible in the numbers
 *  • every fill is itemised and the charges leave your cash immediately
 *  • orders are validated the way an exchange would validate them
 *  • market orders cross a modelled spread, so a round trip at an unchanged
 *    price loses money, because in reality it does
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { computeCost } from '@/lib/engine/costs';
import { sizeFromStop, equity, unrealisedPnl } from '@/lib/engine/portfolio';
import type { OrderType } from '@/lib/engine/order';
import type { Product } from '@/lib/engine/costs/types';
import { INDIA_EQUITIES } from '@/lib/market/symbols';
import type { Quote } from '@/lib/market/types';
import { initialSimState, simReducer, type BlotterEntry, type PersistedFill } from '@/lib/sim/reducer';
import { displayBalance, useAccountStore } from '@/lib/account/store';

const SYMBOLS = INDIA_EQUITIES.slice(0, 6);
const POLL_MS = 15_000;

export function Simulator() {
  const [state, dispatch] = useReducer(simReducer, undefined, initialSimState);
  const [symbol, setSymbol] = useState(SYMBOLS[0].symbol);
  const startingCash = useAccountStore((s) => s.startingCash);
  const balance = useAccountStore(displayBalance);

  // How much of `state.blotter` is already on the server — everything beyond
  // this many entries (blotter is newest-first) just executed locally and
  // needs filing. Set past the true length until hydration resolves, so nothing
  // fires before there is anything to compare against.
  const persistedCount = useRef(Number.POSITIVE_INFINITY);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await useAccountStore.getState().hydrate();
      const cash = useAccountStore.getState().startingCash;

      const fills: PersistedFill[] = await fetch('/api/sim/fills')
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { fills: PersistedFill[] } | null) => data?.fills ?? [])
        .catch(() => []);

      if (cancelled) return;
      dispatch({ type: 'hydrate', startingCash: cash, fills });
      persistedCount.current = fills.length;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Whatever is beyond `persistedCount` just executed live and has not been
  // filed yet. Blotter is newest-first, so those are the leading entries.
  useEffect(() => {
    const freshCount = state.blotter.length - persistedCount.current;
    if (!(freshCount > 0)) return;
    const fresh = state.blotter.slice(0, freshCount);
    persistedCount.current = state.blotter.length;

    // Oldest of the new batch first, so a reload's replay order matches the
    // order these actually executed in.
    [...fresh].reverse().forEach((entry) => {
      void fetch('/api/sim/fills', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          at: entry.at,
          symbol: entry.symbol,
          product: entry.product,
          side: entry.side,
          quantity: entry.quantity,
          price: entry.price,
          realised: entry.realised,
        }),
      }).catch(() => {
        // A dropped fill-log write does not undo the trade the learner just
        // made; it only means this one fill will be missing after a reload.
        // Nothing here can retry safely without risking a double-file.
      });
      if (entry.realised !== 0) useAccountStore.getState().applyDelta(entry.realised);
    });
  }, [state.blotter]);

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<OrderType>('MARKET');
  const [product, setProduct] = useState<Product>('intraday');
  const [quantity, setQuantity] = useState('10');
  const [limitPrice, setLimitPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/quote?symbols=${SYMBOLS.map((s) => s.symbol).join(',')}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      dispatch({ type: 'quotes', quotes: json.quotes as Quote[], at: Date.now() });
    } catch (e) {
      dispatch({ type: 'quotes_failed', message: e instanceof Error ? e.message : 'Market data unavailable.' });
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const quote = state.quotes[symbol];
  const price = quote?.price ?? 0;

  const marks = useMemo(
    () => Object.fromEntries(Object.entries(state.quotes).map(([s, q]) => [s, q.price])),
    [state.quotes],
  );
  const eq = equity(state.account, marks);
  const unrealised = unrealisedPnl(state.account, marks);
  const positions = Object.values(state.account.positions);

  // Feeds the shared balance live, the same as every other cash-based game —
  // an open position's mark-to-market gain is real money on the account the
  // instant a quote moves, not only once the position is actually closed.
  useEffect(() => {
    useAccountStore.getState().setLiveUnrealized(unrealised);
  }, [unrealised]);

  useEffect(() => {
    return () => {
      useAccountStore.getState().setLiveUnrealized(0);
    };
  }, []);

  const preview = useMemo(() => {
    const qty = Number(quantity);
    if (!price || !Number.isFinite(qty) || qty <= 0) return null;
    try {
      return computeCost({ market: 'IN', venue: 'NSE', product, side, price, quantity: qty });
    } catch {
      return null;
    }
  }, [price, quantity, product, side]);

  const place = () => {
    dispatch({
      type: 'place',
      order: {
        // The blotter entry a fill produces re-uses this id verbatim as the
        // primary key it is persisted under (see the effect above), so it
        // has to survive two orders placed in the same millisecond.
        id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        symbol,
        side,
        quantity: Number(quantity),
        type,
        product,
        limitPrice: limitPrice === '' ? undefined : Number(limitPrice),
        triggerPrice: triggerPrice === '' ? undefined : Number(triggerPrice),
        validity: 'DAY',
        placedAt: Date.now(),
      },
    });
  };

  const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Equity" value={inr(Math.round(balance))} tone={balance >= startingCash ? 'up' : 'down'} />
        <Stat label="Cash" value={inr(Math.round(state.account.cash))} />
        <Stat label="Unrealised" value={inr(Math.round(unrealised))} tone={unrealised >= 0 ? 'up' : 'down'} />
        <Stat
          label="Charges paid"
          value={inr(Math.round(state.account.totalCharges))}
          note={`Max drawdown ${(state.account.maxDrawdown * 100).toFixed(1)}%`}
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-down/50 bg-down/10 px-4 py-2 text-[13px] text-ink-muted">
          {state.error} Your positions are unaffected; prices will resume when the feed recovers.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">Watchlist</div>
            <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              {SYMBOLS.map((s) => {
                const q = state.quotes[s.symbol];
                const active = s.symbol === symbol;
                return (
                  <button
                    key={s.symbol}
                    onClick={() => setSymbol(s.symbol)}
                    aria-pressed={active}
                    className="px-3 py-2 text-left transition-colors hover:bg-surface-2"
                    style={{ background: active ? 'var(--color-surface-2)' : 'var(--color-surface)' }}
                  >
                    <div className="truncate text-[11px] uppercase tracking-wider text-ink-faint">{s.name}</div>
                    <div className="num text-sm">{q ? q.price.toFixed(2) : '—'}</div>
                    {q && (
                      <div
                        className="num text-[11px]"
                        style={{ color: q.change >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}
                      >
                        {q.change >= 0 ? '+' : ''}
                        {q.changePercent.toFixed(2)}%
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {quote && quote.marketState !== 'REGULAR' && (
              <p className="mt-3 text-[13px] text-ink-faint">
                The market is currently {quote.marketState.toLowerCase()}. These are last traded prices, so orders fill
                against a static quote — which is itself worth understanding before you trade a real open.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">Positions</div>
            {positions.length === 0 ? (
              <p className="mt-2 text-sm text-ink-faint">Flat.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {positions.map((p) => {
                  const mark = marks[p.symbol] ?? p.averagePrice;
                  const pnl = (mark - p.averagePrice) * p.quantity;
                  return (
                    <li key={`${p.symbol}-${p.product}`} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="num text-ink-muted">
                        {p.quantity > 0 ? 'LONG' : 'SHORT'} {Math.abs(p.quantity)} {p.symbol}
                        <span className="ml-2 text-ink-faint">avg {p.averagePrice.toFixed(2)}</span>
                      </span>
                      <span
                        className="num shrink-0"
                        style={{ color: pnl >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}
                      >
                        {pnl >= 0 ? '+' : ''}
                        {pnl.toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {positions.length > 0 && (
              <p className="mt-3 text-[11px] text-ink-faint">
                This P&amp;L is gross of the exit charges you have not paid yet. Realised P&amp;L in the blotter is net
                of everything.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Resting orders</div>
              <span className="num text-[11px] text-ink-faint">{state.resting.length}</span>
            </div>
            {state.resting.length === 0 ? (
              <p className="mt-2 text-sm text-ink-faint">
                None. Limit and stop orders wait here and are checked against every new quote.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {state.resting.map((o) => (
                  <li key={o.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="num text-ink-muted">
                      {o.side.toUpperCase()} {o.quantity} {o.symbol} {o.type}
                      {o.limitPrice ? ` @${o.limitPrice}` : ''}
                      {o.triggerPrice ? ` trig ${o.triggerPrice}` : ''}
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'cancel', orderId: o.id })}
                      className="text-[13px] text-ink-faint underline underline-offset-2 hover:text-down"
                    >
                      cancel
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Blotter entries={state.blotter} />
        </div>

        <aside className="space-y-3 self-start rounded-xl border border-line bg-surface p-4 lg:sticky lg:top-20">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">Order ticket · {symbol}</div>

          <Segmented
            options={[
              { id: 'buy', label: 'Buy' },
              { id: 'sell', label: 'Sell' },
            ]}
            value={side}
            onChange={(v) => setSide(v as 'buy' | 'sell')}
          />
          <Segmented
            options={[
              { id: 'intraday', label: 'Intraday' },
              { id: 'delivery', label: 'Delivery' },
            ]}
            value={product}
            onChange={(v) => setProduct(v as Product)}
          />
          <Segmented
            options={(['MARKET', 'LIMIT', 'SL', 'SL-M'] as OrderType[]).map((t) => ({ id: t, label: t }))}
            value={type}
            onChange={(v) => setType(v as OrderType)}
          />

          <Input label="Quantity" value={quantity} onChange={setQuantity} />
          {(type === 'LIMIT' || type === 'SL') && (
            <Input label="Limit price" value={limitPrice} onChange={setLimitPrice} />
          )}
          {(type === 'SL' || type === 'SL-M') && (
            <Input label="Trigger price" value={triggerPrice} onChange={setTriggerPrice} />
          )}

          {preview && (
            <div className="rounded-lg bg-surface-2 p-3">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-ink-muted">Charges on this leg</span>
                <span className="num">{inr(preview.total)}</span>
              </div>
              <div className="num mt-0.5 text-[11px] text-ink-faint">
                {preview.costPercent.toFixed(3)}% of turnover
              </div>
            </div>
          )}

          <button
            onClick={place}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-on-emphasis transition-opacity hover:opacity-90"
          >
            Place order
          </button>

          {state.rejection && (
            <div className="rounded-lg border border-down/50 bg-down/10 px-3 py-2 text-[13px]">
              <div className="text-down">{state.rejection.reason}</div>
              {state.rejection.hint && <div className="mt-1 text-ink-muted">{state.rejection.hint}</div>}
            </div>
          )}

          <SizingHelper equity={eq} price={price} />

          <button
            onClick={() => {
              if (!confirm('Reset the simulator account? This clears every fill on file, and its P&L is reversed off your account balance.')) return;
              void (async () => {
                await fetch('/api/sim/fills', { method: 'DELETE' }).catch(() => {});
                await useAccountStore.getState().hydrate();
                persistedCount.current = 0;
                dispatch({ type: 'reset', startingCash: useAccountStore.getState().startingCash });
              })();
            }}
            className="w-full text-[12px] text-ink-faint underline underline-offset-4 hover:text-down"
          >
            Reset account
          </button>

          <p className="text-[11px] leading-snug text-ink-faint">
            Fills cross a half-spread modelled from the day&rsquo;s range and volume. We have a quote, not a depth book,
            so this is a model — a deliberately conservative one.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Blotter({ entries }: { entries: BlotterEntry[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">Trade blotter</div>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-ink-faint">No fills yet. Every one will be itemised here, charge by charge.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => setOpen(open === e.id ? null : e.id)}
                aria-expanded={open === e.id}
                className="w-full text-left text-[13px] text-ink-muted transition-colors hover:text-ink"
              >
                <span className="num">
                  {e.side.toUpperCase()} {e.quantity} {e.symbol} @ {e.price.toFixed(2)}
                </span>
                <span className="ml-2">{e.note}</span>
                <span className="num ml-2 text-ink-faint">charges ₹{e.chargeTotal.toFixed(2)}</span>
              </button>
              {open === e.id && (
                <ul className="mt-1.5 space-y-1 rounded-lg bg-surface-2 p-3">
                  {e.charges.map((c) => (
                    <li key={c.key} className="flex items-baseline justify-between gap-3 text-[12px]">
                      <span className="text-ink-muted">
                        {c.label} <span className="text-ink-faint">{c.basis}</span>
                      </span>
                      <span className="num shrink-0">₹{c.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SizingHelper({ equity: eq, price }: { equity: number; price: number }) {
  const [stopPercent, setStopPercent] = useState(2);
  const [riskPercent, setRiskPercent] = useState(1);
  if (!price) return null;

  const stop = price * (1 - stopPercent / 100);
  const sized = sizeFromStop({ equity: eq, riskFraction: riskPercent / 100, entry: price, stop });

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">Size from your stop</div>
      <label className="mt-2 block text-[12px] text-ink-muted">
        Risk {riskPercent}% of equity
        <input
          type="range"
          min={0.25}
          max={5}
          step={0.25}
          value={riskPercent}
          onChange={(e) => setRiskPercent(Number(e.target.value))}
          className="mt-1 w-full accent-[var(--color-accent)]"
        />
      </label>
      <label className="mt-1 block text-[12px] text-ink-muted">
        Stop {stopPercent}% away (₹{stop.toFixed(2)})
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
      <div className="num mt-2 text-sm text-accent">{sized.quantity} units</div>
      <p className="mt-1 text-[11px] leading-snug text-ink-faint">{sized.note}</p>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className="num flex-1 rounded-md px-2 py-1.5 text-[12px] uppercase transition-colors"
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

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="num mt-0.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-line-strong"
      />
    </label>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className="num mt-1 text-xl"
        style={tone ? { color: tone === 'up' ? 'var(--color-up)' : 'var(--color-down)' } : undefined}
      >
        {value}
      </div>
      {note && <div className="mt-0.5 text-[11px] text-ink-faint">{note}</div>}
    </div>
  );
}
