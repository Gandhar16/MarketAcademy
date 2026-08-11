'use client';

/**
 * OrderBookLadder — the most tactile widget in the app.
 *
 * The learner sets a size and side, and watches their order EAT the book level
 * by level, in sequence, with the consumed quantity highlighted and the average
 * fill drawn against the touch price. Nothing else in a beginner course makes
 * "market orders have a price" this physical.
 *
 * The book is a MODEL — free data sources do not publish depth — and the widget
 * says so in the footer rather than implying it is a live feed.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ILLIQUID_SMALL_CAP,
  LIQUID_LARGE_CAP,
  bookDepth,
  buildBook,
  sizeAtTouch,
  spread,
  walkBook,
  type BookShape,
} from '@/lib/analysis/orderbook';

const PRESETS: { id: string; label: string; shape: BookShape; note: string }[] = [
  {
    id: 'liquid',
    label: 'Liquid large-cap',
    shape: LIQUID_LARGE_CAP,
    note: 'One-tick spread, hundreds of shares at the touch. You can be careless here and mostly get away with it.',
  },
  {
    id: 'illiquid',
    label: 'Illiquid small-cap',
    shape: ILLIQUID_SMALL_CAP,
    note: 'Eight-tick spread, a couple of dozen shares at the touch. The same order does something very different.',
  },
];

export function OrderBookLadder({
  preset = 'liquid',
  defaultQuantity = 300,
  allowPresetSwitch = true,
}: {
  preset?: string;
  defaultQuantity?: number;
  allowPresetSwitch?: boolean;
}) {
  const [presetId, setPresetId] = useState(preset);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [sent, setSent] = useState(false);
  /** How many levels of the walk have been animated in. */
  const [revealed, setRevealed] = useState(0);

  const shape = PRESETS.find((p) => p.id === presetId)?.shape ?? LIQUID_LARGE_CAP;
  const book = useMemo(() => buildBook(shape), [shape]);
  const walk = useMemo(() => walkBook(book, side, quantity), [book, side, quantity]);
  const depth = useMemo(() => bookDepth(book), [book]);
  const touchSize = sizeAtTouch(book, side);

  /**
   * Changing any input invalidates the previous walk, so the reset happens in
   * the handlers rather than in an effect watching them — the effect version is
   * derived state, and React rightly complains about it.
   */
  const reset = () => {
    setSent(false);
    setRevealed(0);
  };

  // Walk the levels one at a time so the learner SEES it consume depth.
  useEffect(() => {
    if (!sent || revealed >= walk.steps.length) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), 260);
    return () => clearTimeout(t);
  }, [sent, revealed, walk.steps.length]);

  const consumedAt = (price: number) => {
    if (!sent) return 0;
    const idx = walk.steps.findIndex((s) => s.price === price);
    if (idx === -1 || idx >= revealed) return 0;
    return walk.steps[idx].quantity;
  };

  const maxQty = Math.max(...book.bids.map((l) => l.quantity), ...book.asks.map((l) => l.quantity));
  const done = sent && revealed >= walk.steps.length;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      {allowPresetSwitch && (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPresetId(p.id); reset(); }}
              className="rounded-full px-3 py-1.5 text-sm transition-colors"
              style={{
                background: presetId === p.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color: presetId === p.id ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-[13px] text-ink-muted">{PRESETS.find((p) => p.id === presetId)?.note}</p>

      {/* ── the ladder ─────────────────────────────────────────────────── */}
      <div className="mt-5 overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-[1fr_auto_1fr] bg-surface-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-ink-faint">
          <span>Bid qty</span>
          <span className="px-4">Price</span>
          <span className="text-right">Ask qty</span>
        </div>

        {Array.from({ length: shape.levels }, (_, n) => {
          const bid = book.bids[n];
          const ask = book.asks[n];
          const bidEaten = consumedAt(bid.price);
          const askEaten = consumedAt(ask.price);
          return (
            <div key={n} className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-line text-[13px]">
              <Side
                quantity={bid.quantity}
                eaten={side === 'sell' ? bidEaten : 0}
                orders={bid.orders}
                max={maxQty}
                align="right"
                colour="var(--color-up)"
              />
              <div className="num flex w-[132px] items-center justify-between gap-2 px-3 py-1.5">
                <span style={{ color: 'var(--color-up)' }}>{bid.price.toFixed(2)}</span>
                <span style={{ color: 'var(--color-down)' }}>{ask.price.toFixed(2)}</span>
              </div>
              <Side
                quantity={ask.quantity}
                eaten={side === 'buy' ? askEaten : 0}
                orders={ask.orders}
                max={maxQty}
                align="left"
                colour="var(--color-down)"
              />
            </div>
          );
        })}
      </div>

      <div className="num mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-faint">
        <span>Spread {spread(book)?.toFixed(2)}</span>
        <span>At the touch {touchSize.toLocaleString('en-IN')}</span>
        <span>
          Depth {depth.bidQuantity.toLocaleString('en-IN')} bid / {depth.askQuantity.toLocaleString('en-IN')} ask
        </span>
      </div>

      {/* ── the order ──────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="flex gap-1">
          {(['buy', 'sell'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSide(s); reset(); }}
              className="num rounded-md px-3 py-1.5 text-[12px] uppercase transition-colors"
              style={{
                background: side === s ? (s === 'buy' ? 'var(--color-up)' : 'var(--color-down)') : 'var(--color-surface-2)',
                color: side === s ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="flex-1">
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Market order size: <span className="num text-ink">{quantity.toLocaleString('en-IN')}</span>
          </span>
          <input
            type="range"
            min={10}
            max={Math.round(depth.askQuantity * 1.15)}
            step={10}
            value={Math.min(quantity, Math.round(depth.askQuantity * 1.15))}
            onChange={(e) => { setQuantity(Number(e.target.value)); reset(); }}
            className="mt-1 w-full accent-[var(--color-accent)]"
          />
        </label>

        <button
          onClick={() => {
            setSent(true);
            setRevealed(0);
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis"
        >
          {sent ? 'Send again' : 'Send market order'}
        </button>
      </div>

      {/* ── the result ─────────────────────────────────────────────────── */}
      {sent && (
        <div className="mt-5 rounded-lg bg-surface-2 p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Cell label="Price you saw" value={walk.touchPrice.toFixed(2)} />
            <Cell
              label="Price you got"
              value={walk.averagePrice.toFixed(3)}
              tone={walk.slippage > 0 ? 'down' : undefined}
            />
            <Cell
              label="Slippage"
              value={`${walk.slippage.toFixed(3)} (${walk.slippagePercent.toFixed(3)}%)`}
              tone={walk.slippage > 0 ? 'down' : 'up'}
            />
            <Cell label="Levels eaten" value={String(walk.levelsConsumed)} />
          </div>

          {done && (
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              {walk.unfilledQuantity > 0 ? (
                <>
                  <strong className="text-down">
                    {walk.unfilledQuantity.toLocaleString('en-IN')} shares did not fill at all.
                  </strong>{' '}
                  You ate the entire visible book and there was nobody left. In a real market the rest of your order
                  would sit exposed, or fill much worse as new sellers arrived at prices your own order created.
                </>
              ) : walk.levelsConsumed === 1 ? (
                <>
                  The whole order filled at the touch. There were {touchSize.toLocaleString('en-IN')} shares resting
                  there, and you asked for less — so the price you saw is the price you got. This is what &ldquo;liquid&rdquo;
                  actually means.
                </>
              ) : (
                <>
                  Your order ate {walk.levelsConsumed} levels. You paid{' '}
                  <span className="num">{walk.slippage.toFixed(3)}</span> per share more than the price on the screen —{' '}
                  <span className="num">
                    {(walk.slippage * walk.filledQuantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>{' '}
                  in total, paid for the privilege of not waiting. That is slippage, and it is not a fee anyone charges
                  you: it is just what the book cost.
                </>
              )}
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] text-ink-faint">
        The depth ladder is a <strong>model</strong>, not a live feed — free data sources do not publish depth. The
        shape (thin at the touch, thicker behind) matches real books, and the walk mechanic is exactly how a real
        market order executes.
      </p>
    </div>
  );
}

function Side({
  quantity,
  eaten,
  orders,
  max,
  align,
  colour,
}: {
  quantity: number;
  eaten: number;
  orders: number;
  max: number;
  align: 'left' | 'right';
  colour: string;
}) {
  const pct = (quantity / max) * 100;
  const eatenPct = quantity > 0 ? (eaten / quantity) * 100 : 0;
  return (
    <div className={`relative px-3 py-1.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div
        className="absolute inset-y-0 opacity-15 transition-all"
        style={{ [align]: 0, width: `${pct}%`, background: colour }}
      />
      {eaten > 0 && (
        <div
          className="absolute inset-y-0 opacity-60 transition-all duration-300"
          style={{ [align]: 0, width: `${(pct * eatenPct) / 100}%`, background: colour }}
        />
      )}
      <span className="num relative">{quantity.toLocaleString('en-IN')}</span>
      <span className="num relative ml-2 text-[10px] text-ink-faint">{orders}</span>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div>
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
