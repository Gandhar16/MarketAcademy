'use client';

/**
 * Client half of the streamed replay.
 *
 * Mirrors the shape of the in-process ReplaySession, but the bars come from the
 * server one at a time and the future is genuinely not present in the browser.
 * Fill matching still happens here — it needs no future information, only the
 * bar just revealed plus the liquidity context the server sends with it.
 */
import { fillAgainstBar, DEFAULT_FILL_CONFIG, type FillResult, type LiquidityContext } from '../engine/fill';
import type { OrderState } from '../engine/order';
import type { Candle } from '../market/types';

export interface RemoteStepResult {
  bar: Candle;
  fills: { order: OrderState; result: FillResult }[];
  finished: boolean;
  index: number;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Replay request failed.');
  return json as T;
}

export class RemoteReplay {
  #sessionId: string;
  #visible: Candle[];
  #working: OrderState[] = [];
  #remaining: number;
  #tickSize: number;
  #index: number;

  private constructor(init: {
    sessionId: string;
    warmup: Candle[];
    remaining: number;
    tickSize: number;
  }) {
    this.#sessionId = init.sessionId;
    this.#visible = init.warmup;
    this.#remaining = init.remaining;
    this.#tickSize = init.tickSize;
    this.#index = init.warmup.length - 1;
  }

  static async start(opts: { symbol?: string; seed?: number } = {}): Promise<RemoteReplay> {
    const started = await post<{
      sessionId: string;
      warmup: Candle[];
      remaining: number;
      tickSize: number;
    }>('/api/replay', opts);
    return new RemoteReplay(started);
  }

  get visible(): Candle[] {
    return this.#visible;
  }
  get remaining(): number {
    return this.#remaining;
  }
  get finished(): boolean {
    return this.#remaining <= 0;
  }
  get index(): number {
    return this.#index;
  }
  get lastPrice(): number {
    return this.#visible.length > 0 ? this.#visible[this.#visible.length - 1].close : 0;
  }
  get sessionId(): string {
    return this.#sessionId;
  }

  workingOrders(): OrderState[] {
    return this.#working.map((o) => ({ ...o }));
  }

  submit(order: OrderState): void {
    this.#working.push({ ...order });
  }

  cancel(id: string): void {
    this.#working = this.#working.filter((o) => o.id !== id);
  }

  /** Ask the server for the next bar, then match resting orders against it. */
  async step(): Promise<RemoteStepResult> {
    if (this.finished) {
      return { bar: this.#visible[this.#visible.length - 1], fills: [], finished: true, index: this.#index };
    }

    const stepped = await post<{
      bar: Candle;
      index: number;
      remaining: number;
      finished: boolean;
      averageVolume: number | null;
      previousClose: number;
    }>('/api/replay?step', { sessionId: this.#sessionId });

    const ctx: LiquidityContext = {
      averageVolume: stepped.averageVolume,
      tickSize: this.#tickSize,
      previousClose: stepped.previousClose,
    };

    const fills: { order: OrderState; result: FillResult }[] = [];
    const stillWorking: OrderState[] = [];

    for (const order of this.#working) {
      const result = fillAgainstBar(order, stepped.bar, ctx, DEFAULT_FILL_CONFIG);
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
        if (updated.status === 'partial' && order.validity === 'DAY') stillWorking.push(updated);
      } else if (order.validity === 'DAY') {
        stillWorking.push({ ...order, status: result.triggered ? 'triggered' : order.status });
      }
    }

    this.#working = stillWorking;
    this.#visible = [...this.#visible, stepped.bar];
    this.#remaining = stepped.remaining;
    this.#index = stepped.index;

    return { bar: stepped.bar, fills, finished: stepped.finished, index: stepped.index };
  }

  /** Only succeeds once the replay is over — the server enforces it. */
  async reveal(): Promise<{ symbol: string; candles: Candle[] }> {
    return post('/api/replay?reveal', { sessionId: this.#sessionId });
  }

  /**
   * Records the entry with the server, at the price the server itself just
   * dealt — see `openPosition` in server-session.ts for why this is the
   * source of truth for scoring rather than anything computed here.
   */
  async openPosition(opts: {
    side: 'buy' | 'sell';
    stopPct: number;
    targetPct: number | null;
    hasThesis: boolean;
  }): Promise<{ id: string; entryPrice: number }> {
    return post('/api/replay?open-position', { sessionId: this.#sessionId, ...opts });
  }

  async closePosition(positionId: string): Promise<{
    pnl: number;
    stoppedOut: boolean;
    plannedRR: number | null;
    preCommitted: boolean;
    riskFraction: number;
  }> {
    return post('/api/replay?close-position', { sessionId: this.#sessionId, positionId });
  }
}
