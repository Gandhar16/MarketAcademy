/**
 * The replay engine.
 *
 * PLAN.md §7.2: "No lookahead. The replay engine physically cannot see future
 * bars." That is not a coding guideline here — it is the class invariant.
 *
 * The private `all` array is never exposed and never returned. `visible()`
 * slices only up to the cursor, and the returned array is a copy, so a caller
 * cannot mutate its way forward either. The only way to advance is `step()`,
 * which is one-directional. There is no `seek`, no `peek`, and no `rewind`.
 *
 * Why go this far: pain point P7. A learner builds a "winning" strategy, and we
 * reveal the lookahead bug in their own result. That reveal is only honest if
 * the engine they used could not possibly have cheated — including by accident,
 * including by a future contributor writing `series.candles[i + 1]` in a widget.
 *
 * SCOPE OF THE GUARANTEE, stated precisely so nobody overclaims it downstream:
 * no CODE in this application can read ahead. A human running the client-side
 * replay can still open their own network tab and read the fetched window. The
 * fix for that is server-side bar streaming, which is on the plan; until it
 * lands, the UI copy must not claim the future is absent from the page.
 */
import type { Candle, Series } from '../market/types';
import { fillAgainstBar, DEFAULT_FILL_CONFIG, type FillConfig, type FillResult, type LiquidityContext } from './fill';
import { applyFill, markToMarket, type Account } from './portfolio';
import type { OrderState } from './order';
import type { Product } from './costs/types';

export interface ReplayOptions {
  /**
   * How many bars are shown before the learner takes their first decision.
   * Too few and there is no context to judge from; too many and they scroll.
   */
  warmupBars: number;
  /** Trailing window for the average-volume figure the fill engine uses. */
  volumeWindow: number;
  fillConfig?: FillConfig;
}

export const DEFAULT_REPLAY_OPTIONS: ReplayOptions = {
  warmupBars: 60,
  volumeWindow: 20,
};

export interface ReplayStepResult {
  /** The bar that was just revealed. */
  bar: Candle;
  /** Fills that occurred against this bar, in order. */
  fills: { order: OrderState; result: FillResult }[];
  /** True once there are no more bars. */
  finished: boolean;
  index: number;
}

export class ReplaySession {
  /** PRIVATE. Never returned, never iterated past the cursor. */
  readonly #all: Candle[];
  #cursor: number;
  readonly #symbol: string;
  readonly #tickSize: number;
  readonly #options: ReplayOptions;
  #working: OrderState[] = [];

  constructor(series: Series, tickSize: number, options: Partial<ReplayOptions> = {}) {
    const opts = { ...DEFAULT_REPLAY_OPTIONS, ...options };
    if (series.candles.length <= opts.warmupBars + 1) {
      throw new Error(
        `Replay needs more than ${opts.warmupBars + 1} bars; got ${series.candles.length}. ` +
          `Fetch a longer range or reduce warmupBars.`,
      );
    }
    // Defensive copy: if the caller mutates the series afterwards, the replay
    // is unaffected.
    this.#all = series.candles.map((c) => ({ ...c }));
    this.#symbol = series.symbol;
    this.#tickSize = tickSize;
    this.#options = opts;
    this.#cursor = opts.warmupBars - 1;
  }

  /** Bars the learner is allowed to have seen. A copy, so it cannot be extended. */
  visible(): Candle[] {
    return this.#all.slice(0, this.#cursor + 1).map((c) => ({ ...c }));
  }

  /** The most recently revealed bar. */
  current(): Candle {
    return { ...this.#all[this.#cursor] };
  }

  get index(): number {
    return this.#cursor;
  }

  /**
   * How many bars remain. This is the ONE piece of future information exposed,
   * because a progress bar is a UI necessity and a count carries no price
   * information whatsoever.
   */
  get remaining(): number {
    return this.#all.length - 1 - this.#cursor;
  }

  get finished(): boolean {
    return this.remaining <= 0;
  }

  get symbol(): string {
    return this.#symbol;
  }

  /** Orders currently resting. Returned as copies. */
  workingOrders(): OrderState[] {
    return this.#working.map((o) => ({ ...o }));
  }

  /**
   * Submit an order. It does NOT fill now — it fills against the NEXT bar.
   *
   * This one-bar delay is the mechanism that makes the whole thing honest. A
   * decision made while looking at a bar cannot be executed inside that same
   * bar, because in reality you did not know its high, low or close when you
   * decided.
   */
  submit(order: OrderState): void {
    this.#working.push({ ...order });
  }

  cancel(orderId: string): boolean {
    const before = this.#working.length;
    this.#working = this.#working.filter((o) => o.id !== orderId);
    return this.#working.length < before;
  }

  /** Trailing average volume over the configured window, up to the cursor. */
  #averageVolume(): number | null {
    const start = Math.max(0, this.#cursor - this.#options.volumeWindow + 1);
    const window = this.#all.slice(start, this.#cursor + 1);
    const vols = window.map((c) => c.volume).filter((v): v is number => v != null);
    if (vols.length === 0) return null;
    return vols.reduce((a, b) => a + b, 0) / vols.length;
  }

  /**
   * Advance one bar: reveal it, then match every working order against it.
   *
   * Order matters. The bar is revealed and matched in the same operation so
   * that no caller can inspect the new bar and then decide what to submit.
   */
  step(account?: Account): { result: ReplayStepResult; account?: Account } {
    if (this.finished) {
      return {
        result: { bar: this.current(), fills: [], finished: true, index: this.#cursor },
        account,
      };
    }

    const averageVolume = this.#averageVolume();
    const previousClose = this.#all[this.#cursor].close;

    this.#cursor += 1;
    const bar = this.#all[this.#cursor];

    const ctx: LiquidityContext = {
      averageVolume,
      tickSize: this.#tickSize,
      previousClose,
    };

    const fills: { order: OrderState; result: FillResult }[] = [];
    let acct = account;
    const stillWorking: OrderState[] = [];

    for (const order of this.#working) {
      const result = fillAgainstBar(order, bar, ctx, this.#options.fillConfig ?? DEFAULT_FILL_CONFIG);

      if (result.quantity > 0) {
        const filledQuantity = order.filledQuantity + result.quantity;
        const averageFillPrice =
          (order.averageFillPrice * order.filledQuantity + result.price * result.quantity) / filledQuantity;
        const updated: OrderState = {
          ...order,
          filledQuantity,
          averageFillPrice,
          status: filledQuantity >= order.quantity ? 'filled' : 'partial',
        };
        fills.push({ order: updated, result });

        if (acct) {
          acct = applyFill(acct, {
            symbol: this.#symbol,
            product: order.product as Product,
            side: order.side,
            quantity: result.quantity,
            price: result.price,
            at: bar.time * 1000,
          }).account;
        }

        if (updated.status === 'partial') {
          // IOC cancels the unfilled remainder; DAY keeps working it.
          if (order.validity === 'IOC') {
            fills.push({ order: { ...updated, status: 'cancelled' }, result });
          } else {
            stillWorking.push(updated);
          }
        }
      } else {
        const updated: OrderState = { ...order, status: result.triggered ? 'triggered' : order.status };
        if (order.validity === 'IOC') {
          fills.push({ order: { ...updated, status: 'cancelled' }, result });
        } else {
          stillWorking.push(updated);
        }
      }
    }

    this.#working = stillWorking;

    if (acct) acct = markToMarket(acct, { [this.#symbol]: bar.close });

    return {
      result: { bar: { ...bar }, fills, finished: this.finished, index: this.#cursor },
      account: acct,
    };
  }

  /**
   * Reveal everything, for the post-mortem AFTER a session is over.
   *
   * Guarded: it throws unless the replay has actually finished. A debrief that
   * shows the full chart is good teaching; a widget that calls this mid-session
   * is a lookahead bug, and this makes that bug impossible to write by accident.
   */
  revealAll(): Candle[] {
    if (!this.finished) {
      throw new Error(
        'revealAll() may only be called after the replay is finished. ' +
          'If you need this mid-session, you are about to introduce lookahead.',
      );
    }
    return this.#all.map((c) => ({ ...c }));
  }
}
