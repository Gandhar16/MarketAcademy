'use client';

/**
 * Circuit Breaker — edge-case survival.
 *
 * A scripted crisis played bar by bar. The learner holds a position and the
 * market does something genuinely nasty: a gap through the stop, a lower
 * circuit that locks the exit, a market-wide halt. The lesson is that some
 * actions are simply NOT AVAILABLE, which no amount of chart study prepares you
 * for and which every real crash delivers.
 *
 * Uses the real halts and fill engines — the circuit lock that blocks the exit
 * is the same `canTradeAtBand` the simulator uses.
 */
import { useMemo, useState } from 'react';
import { canTradeAtBand, checkBand, indiaMarketWideBreaker, indiaPriceBand } from '@/lib/engine/halts';

interface Beat {
  /** Minutes since midnight IST. */
  time: number;
  price: number;
  /** Index-level move, for the market-wide breaker. */
  indexPercent: number;
  headline: string;
}

const PREV_CLOSE = 1000;
const BAND_PERCENT = 20 as const;

/**
 * A scripted crash, shaped after a real Indian limit-down session: gap down at
 * the open, a brief bounce that tempts you to hold, then a slide into a locked
 * lower circuit with a market-wide halt on top.
 */
const BEATS: Beat[] = [
  { time: 9 * 60 + 15, price: 985, indexPercent: -1.4, headline: 'Open. Weak, nothing alarming yet.' },
  { time: 9 * 60 + 45, price: 942, indexPercent: -3.1, headline: 'Selling accelerates across the sector.' },
  { time: 10 * 60 + 30, price: 905, indexPercent: -5.2, headline: 'No bid depth. The spread has widened to 12 ticks.' },
  { time: 11 * 60 + 15, price: 928, indexPercent: -4.4, headline: 'A bounce. This is the one that convinces people to hold.' },
  { time: 12 * 60 + 0, price: 871, indexPercent: -7.8, headline: 'The bounce fails. New lows.' },
  { time: 12 * 60 + 40, price: 824, indexPercent: -10.4, headline: 'Index down 10%. A market-wide halt is now in play.' },
  { time: 14 * 60 + 0, price: 806, indexPercent: -12.1, headline: 'Reopened after the halt. Sellers are still there.' },
  { time: 14 * 60 + 50, price: 800, indexPercent: -13.0, headline: 'LOWER CIRCUIT. Only sell orders in the book.' },
  { time: 15 * 60 + 25, price: 800, indexPercent: -13.2, headline: 'Locked at the circuit into the close.' },
];

export function CircuitBreaker() {
  const [beat, setBeat] = useState(0);
  const [position, setPosition] = useState(100);
  const [exitPrice, setExitPrice] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const current = BEATS[Math.min(beat, BEATS.length - 1)];
  const band = useMemo(() => indiaPriceBand(PREV_CLOSE, BAND_PERCENT), []);
  const breach = checkBand(current.price, band);
  const sellGate = canTradeAtBand(breach, 'sell');
  const mwcb = indiaMarketWideBreaker(current.indexPercent, current.time);

  const entry = PREV_CLOSE;
  const markPrice = exitPrice ?? current.price;
  const pnl = (markPrice - entry) * (exitPrice ? 100 : position);

  const sell = () => {
    if (!sellGate.allowed) {
      setLog((l) => [`${fmtTime(current.time)} — SELL REJECTED. ${sellGate.reason}`, ...l]);
      return;
    }
    if (mwcb && mwcb.haltMinutes !== 0) {
      setLog((l) => [
        `${fmtTime(current.time)} — Market halted (${mwcb.level}, ${mwcb.description}). No orders accepted.`,
        ...l,
      ]);
      return;
    }
    setExitPrice(current.price);
    setPosition(0);
    setLog((l) => [`${fmtTime(current.time)} — Sold 100 at ₹${current.price}.`, ...l]);
    setFinished(true);
  };

  const advance = () => {
    if (beat >= BEATS.length - 1) {
      setFinished(true);
      return;
    }
    setBeat((b) => b + 1);
  };

  const reset = () => {
    setBeat(0);
    setPosition(100);
    setExitPrice(null);
    setLog([]);
    setFinished(false);
  };

  const survived = exitPrice !== null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="num text-sm text-ink-faint">{fmtTime(current.time)}</div>
          <div className="num text-sm">
            <span className="text-ink-faint">Price</span>{' '}
            <span style={{ color: current.price < PREV_CLOSE ? 'var(--color-down)' : 'var(--color-up)' }}>
              {current.price.toFixed(2)}
            </span>
            <span className="ml-4 text-ink-faint">Index</span>{' '}
            <span style={{ color: 'var(--color-down)' }}>{current.indexPercent.toFixed(1)}%</span>
          </div>
        </div>

        {/* price track against the circuit band */}
        <div className="relative mt-4 h-14 overflow-hidden rounded-lg bg-surface-2">
          <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'var(--color-down)' }} />
          <div className="absolute inset-y-0 flex items-end gap-1 px-2">
            {BEATS.slice(0, beat + 1).map((b, i) => {
              const pct = ((b.price - band.lower) / (band.upper - band.lower)) * 100;
              return (
                <div
                  key={i}
                  className="w-6 rounded-t transition-all"
                  style={{
                    height: `${Math.max(4, pct)}%`,
                    background: b.price <= band.lower ? 'var(--color-down)' : 'var(--color-accent)',
                    opacity: i === beat ? 1 : 0.45,
                  }}
                />
              );
            })}
          </div>
          <div className="num absolute right-2 top-1 text-[10px] text-ink-faint">
            lower circuit {band.lower.toFixed(2)}
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-muted">{current.headline}</p>

        {breach === 'lower_circuit' && (
          <p className="mt-3 rounded-lg border border-down/50 bg-down/10 px-3 py-2 text-[13px] text-ink-muted">
            <span className="text-down">Locked at the lower circuit. </span>
            {sellGate.reason}
          </p>
        )}

        {mwcb && mwcb.haltMinutes !== 0 && (
          <p className="mt-2 rounded-lg border border-accent-dim/50 bg-accent-dim/10 px-3 py-2 text-[13px] text-ink-muted">
            <span className="text-accent">Market-wide circuit breaker {mwcb.level}. </span>
            {mwcb.description}
            {typeof mwcb.haltMinutes === 'number' && mwcb.preOpenMinutes > 0 && (
              <> Trading resumes through a {mwcb.preOpenMinutes}-minute pre-open auction, not straight back into the book.</>
            )}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Position" value={position > 0 ? `${position} shares` : 'Flat'} />
        <Stat label="Entry" value={`₹${entry.toFixed(2)}`} />
        <Stat
          label={exitPrice ? 'Realised P&L' : 'Unrealised P&L'}
          value={`₹${pnl.toFixed(0)}`}
          tone={pnl >= 0 ? 'up' : 'down'}
        />
      </div>

      {!finished && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={sell}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--color-down)', color: 'var(--color-ground)' }}
          >
            Sell everything
          </button>
          <button onClick={advance} className="rounded-lg border border-line-strong px-4 py-2 text-sm text-ink-muted">
            Hold, next update →
          </button>
        </div>
      )}

      {log.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-line bg-surface p-4">
          {log.map((l, i) => (
            <li key={i} className="num text-[12px] text-ink-muted">
              {l}
            </li>
          ))}
        </ul>
      )}

      {finished && (
        <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
          <div className="text-[11px] uppercase tracking-wider text-accent">Debrief</div>
          {survived ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              You got out at <span className="num">₹{exitPrice!.toFixed(2)}</span> for a loss of{' '}
              <span className="num text-down">₹{Math.abs(pnl).toFixed(0)}</span>. That is a good outcome. The
              alternative was not a smaller loss — it was <strong className="text-ink">no exit at all</strong>. Once the
              stock locked at the lower circuit there were only sell orders in the book and nobody to sell to.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              You held into the close, locked at the circuit, down{' '}
              <span className="num text-down">₹{Math.abs(pnl).toFixed(0)}</span> with no way out. Tomorrow it may open
              lower again and lock again — that is what a limit-down sequence does, and it is why &ldquo;I will just sell
              if it drops further&rdquo; is a plan that assumes a counterparty who has stopped existing. A stop-loss is
              a request, not a guarantee.
            </p>
          )}
          <p className="mt-3 text-[13px] text-ink-faint">
            The bounce at 11:15 was the decision point. It felt like relief; it was the last liquid exit of the day.
          </p>
          <button onClick={reset} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ground">
            Play it again
          </button>
        </div>
      )}
    </div>
  );
}

function fmtTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className="num mt-1 text-lg"
        style={tone ? { color: tone === 'up' ? 'var(--color-up)' : 'var(--color-down)' } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
