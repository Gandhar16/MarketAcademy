'use client';

/**
 * Inline SVG diagrams.
 *
 * Every illustration in this app is drawn in code rather than shipped as an
 * image file. That is a deliberate choice with four concrete payoffs: they
 * inherit the theme, they stay sharp at any size, they cost nothing to
 * download, and several of them can respond to input — which no PNG can.
 *
 * None of these depict market data. They depict MECHANISMS, which is why they
 * can be drawn from first principles without violating PLAN.md §7.1.
 */
import { useState } from 'react';

// ── SpreadDiagram ───────────────────────────────────────────────────────────

/**
 * The bid, the ask, the spread, and the fact that there is no such thing as
 * "the price" — there are two, and which one applies to you depends on which
 * way you are going.
 */
export function SpreadDiagram({
  bid = 1399.95,
  ask = 1400.05,
  interactive = true,
}: {
  bid?: number;
  ask?: number;
  interactive?: boolean;
}) {
  const [spreadTicks, setSpreadTicks] = useState(Math.max(1, Math.round((ask - bid) / 0.05)));
  const tick = 0.05;
  const mid = (bid + ask) / 2;
  const b = mid - (spreadTicks * tick) / 2;
  const a = mid + (spreadTicks * tick) / 2;

  const W = 520;
  const H = 150;
  const scale = 40 / Math.max(1, spreadTicks); // px per tick, shrinks as spread widens
  const cxMid = W / 2;
  const bx = cxMid - (spreadTicks * scale) / 2;
  const ax = cxMid + (spreadTicks * scale) / 2;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bid, ask and the spread">
        {/* the axis */}
        <line x1={30} y1={80} x2={W - 30} y2={80} stroke="var(--color-line)" strokeWidth={2} />

        {/* buyers side */}
        <rect x={30} y={62} width={bx - 30} height={36} fill="var(--color-up)" opacity={0.12} rx={4} />
        <text x={40} y={54} fill="var(--color-up)" fontSize={11}>
          BUYERS wait here
        </text>

        {/* sellers side */}
        <rect x={ax} y={62} width={W - 30 - ax} height={36} fill="var(--color-down)" opacity={0.12} rx={4} />
        <text x={W - 40} y={54} textAnchor="end" fill="var(--color-down)" fontSize={11}>
          SELLERS wait here
        </text>

        {/* the gap */}
        <rect x={bx} y={62} width={ax - bx} height={36} fill="var(--color-accent)" opacity={0.18} rx={2} />
        <line x1={bx} y1={56} x2={ax} y2={56} stroke="var(--color-accent)" strokeWidth={1.5} />
        <text x={cxMid} y={48} textAnchor="middle" fill="var(--color-accent)" fontSize={11}>
          the spread — nobody trades in here
        </text>

        {/* markers */}
        <line x1={bx} y1={62} x2={bx} y2={98} stroke="var(--color-up)" strokeWidth={3} />
        <line x1={ax} y1={62} x2={ax} y2={98} stroke="var(--color-down)" strokeWidth={3} />

        <text x={bx} y={116} textAnchor="middle" fill="var(--color-up)" fontSize={13} className="num">
          {b.toFixed(2)}
        </text>
        <text x={bx} y={131} textAnchor="middle" fill="var(--color-ink-faint)" fontSize={10}>
          best bid
        </text>
        <text x={ax} y={116} textAnchor="middle" fill="var(--color-down)" fontSize={13} className="num">
          {a.toFixed(2)}
        </text>
        <text x={ax} y={131} textAnchor="middle" fill="var(--color-ink-faint)" fontSize={10}>
          best ask
        </text>

        {/* direction arrows */}
        <g opacity={0.9}>
          <text x={40} y={22} fill="var(--color-ink-muted)" fontSize={11}>
            You SELL here ↓
          </text>
          <text x={W - 40} y={22} textAnchor="end" fill="var(--color-ink-muted)" fontSize={11}>
            ↓ You BUY here
          </text>
          <line x1={62} y1={26} x2={bx - 4} y2={58} stroke="var(--color-up)" strokeDasharray="3 3" />
          <line x1={W - 62} y1={26} x2={ax + 4} y2={58} stroke="var(--color-down)" strokeDasharray="3 3" />
        </g>
      </svg>

      {interactive && (
        <label className="mt-3 block">
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Spread: <span className="num text-ink">{spreadTicks} tick{spreadTicks === 1 ? '' : 's'}</span> (
            <span className="num">{(spreadTicks * tick).toFixed(2)}</span>)
          </span>
          <input
            type="range"
            min={1}
            max={20}
            value={spreadTicks}
            onChange={(e) => setSpreadTicks(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--color-accent)]"
          />
        </label>
      )}

      <p className="mt-3 rounded-lg bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
        Buy and sell immediately and you lose{' '}
        <span className="num text-ink">{(spreadTicks * tick).toFixed(2)}</span> per share —{' '}
        <span className="num">{(((spreadTicks * tick) / mid) * 100).toFixed(3)}%</span> — before a single charge is
        applied and before the price has moved at all. Widen the spread above and watch that number grow: it is the
        first cost of trading and the one nobody itemises for you.
      </p>
    </div>
  );
}

// ── SettlementTimeline ──────────────────────────────────────────────────────

/** T+1 as a timeline. Concrete, with clock times, rather than an abstraction. */
export function SettlementTimeline() {
  const stages = [
    { day: 'T', time: '09:20', label: 'You buy', detail: 'Order matched on the exchange' },
    { day: 'T', time: '15:30', label: 'Market closes', detail: 'Obligations netted by the clearing corporation' },
    { day: 'T+1', time: '08:30', label: 'Pay-in', detail: 'Your money out, seller’s shares in' },
    { day: 'T+1', time: '13:30', label: 'Pay-out', detail: 'Shares credited to your demat' },
    { day: 'T+1', time: '—', label: 'You own them', detail: 'On the register: dividends, votes, bonuses' },
  ];

  const W = 720;
  const H = 150;
  const step = (W - 80) / (stages.length - 1);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="T+1 settlement timeline">
        <line x1={40} y1={62} x2={W - 40} y2={62} stroke="var(--color-line-strong)" strokeWidth={2} />

        {/* the day boundary */}
        <line x1={40 + step * 1.5} y1={20} x2={40 + step * 1.5} y2={130} stroke="var(--color-line)" strokeDasharray="4 4" />
        <text x={40 + step * 1.5 + 6} y={30} fill="var(--color-ink-faint)" fontSize={10}>
          overnight
        </text>

        {stages.map((s, i) => {
          const x = 40 + i * step;
          const isLast = i === stages.length - 1;
          return (
            <g key={i}>
              <circle cx={x} cy={62} r={7} fill={isLast ? 'var(--color-up)' : 'var(--color-accent)'} />
              <text x={x} y={44} textAnchor="middle" fill="var(--color-ink-faint)" fontSize={10} className="num">
                {s.day} · {s.time}
              </text>
              <text x={x} y={88} textAnchor="middle" fill="var(--color-ink)" fontSize={12}>
                {s.label}
              </text>
              <text x={x} y={104} textAnchor="middle" fill="var(--color-ink-faint)" fontSize={9.5}>
                {s.detail.length > 34 ? `${s.detail.slice(0, 32)}…` : s.detail}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        One working day from trade to ownership. India moved to T+1 in 2023 and is among the fastest in the world —
        most major markets still take two days.
      </p>
    </div>
  );
}

// ── LongShortDiagram ────────────────────────────────────────────────────────

/** Long versus short, drawn as what you own and what you owe. */
export function LongShortDiagram() {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const long = side === 'long';
  const W = 560;
  const H = 190;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex gap-1">
        {(['long', 'short'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className="num rounded-md px-3 py-1.5 text-[12px] uppercase transition-colors"
            style={{
              background: side === s ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: side === s ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Long versus short position">
        {/* axis */}
        <line x1={40} y1={H - 40} x2={W - 40} y2={H - 40} stroke="var(--color-line)" />
        <line x1={40} y1={20} x2={40} y2={H - 40} stroke="var(--color-line)" />
        <text x={W - 40} y={H - 22} textAnchor="end" fill="var(--color-ink-faint)" fontSize={10}>
          price of the share →
        </text>
        <text x={30} y={28} textAnchor="end" fill="var(--color-ink-faint)" fontSize={10}>
          P&amp;L
        </text>

        {/* zero line */}
        <line x1={40} y1={95} x2={W - 40} y2={95} stroke="var(--color-line-strong)" strokeDasharray="4 4" />

        {/* payoff */}
        <path
          d={long ? `M60,${H - 55} L${W - 60},35` : `M60,35 L${W - 60},${H - 55}`}
          stroke={long ? 'var(--color-up)' : 'var(--color-down)'}
          strokeWidth={2.5}
          fill="none"
        />
        <circle cx={(W) / 2} cy={95} r={5} fill="var(--color-accent)" />
        <text x={W / 2} y={112} textAnchor="middle" fill="var(--color-accent)" fontSize={10}>
          your entry
        </text>

        {/* zone labels */}
        <text x={80} y={long ? H - 62 : 30} fill={long ? 'var(--color-down)' : 'var(--color-up)'} fontSize={11}>
          {long ? 'price falls → you lose' : 'price falls → you gain'}
        </text>
        <text x={W - 80} y={long ? 30 : H - 62} textAnchor="end" fill={long ? 'var(--color-up)' : 'var(--color-down)'} fontSize={11}>
          {long ? 'price rises → you gain' : 'price rises → you lose'}
        </text>
      </svg>

      <p className="mt-2 rounded-lg bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
        {long ? (
          <>
            <strong className="text-ink">Long: you own the share.</strong> The most you can lose is everything you paid
            — a share cannot go below zero — and the most you can gain has no ceiling.
          </>
        ) : (
          <>
            <strong className="text-ink">Short: you owe the share.</strong> You sold something you borrowed and must
            buy it back. The most you can gain is capped, because the price can only fall to zero. The most you can
            lose has <strong className="text-down">no limit</strong>, because there is no ceiling on how far a price can
            rise. The asymmetry is the entire risk of shorting, and it is invisible until you draw it.
          </>
        )}
      </p>
    </div>
  );
}

// ── CompoundingCurve ────────────────────────────────────────────────────────

/** Why compounding looks like nothing and then looks like everything. */
export function CompoundingCurve() {
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(30);

  const W = 660;
  const H = 210;
  const series = Array.from({ length: years + 1 }, (_, y) => 100000 * Math.pow(1 + rate / 100, y));
  const linear = Array.from({ length: years + 1 }, (_, y) => 100000 * (1 + (rate / 100) * y));
  const max = Math.max(...series, ...linear);

  const x = (i: number) => 40 + (i / years) * (W - 60);
  const y = (v: number) => H - 30 - (v / max) * (H - 55);
  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const inr = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} cr` : `₹${(n / 1e5).toFixed(1)} L`);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Compound versus simple growth">
        <line x1={40} y1={H - 30} x2={W - 20} y2={H - 30} stroke="var(--color-line)" />
        <path d={`${path(series)} L${x(years)},${H - 30} L${x(0)},${H - 30} Z`} fill="var(--color-accent)" opacity={0.12} />
        <path d={path(linear)} stroke="var(--color-ink-faint)" strokeWidth={1.5} strokeDasharray="5 4" fill="none" />
        <path d={path(series)} stroke="var(--color-accent)" strokeWidth={2.5} fill="none" />

        {[10, 20, 30].filter((m) => m <= years).map((m) => (
          <g key={m}>
            <line x1={x(m)} y1={y(series[m])} x2={x(m)} y2={H - 30} stroke="var(--color-line)" strokeDasharray="2 3" />
            <text x={x(m)} y={y(series[m]) - 8} textAnchor="middle" fill="var(--color-accent)" fontSize={10} className="num">
              {inr(series[m])}
            </text>
            <text x={x(m)} y={H - 16} textAnchor="middle" fill="var(--color-ink-faint)" fontSize={10}>
              {m}y
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Return: <span className="num text-ink">{rate}%</span>
          </span>
          <input type="range" min={4} max={20} value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--color-accent)]" />
        </label>
        <label>
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Years: <span className="num text-ink">{years}</span>
          </span>
          <input type="range" min={5} max={40} value={years} onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--color-accent)]" />
        </label>
      </div>

      <p className="mt-3 rounded-lg bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
        Solid line is compounding, dashed is the same return taken as simple interest. For the first decade they are
        almost indistinguishable — which is precisely why people give up. The gap at {years} years is{' '}
        <span className="num text-accent">{inr(series[years] - linear[years])}</span>, and all of it was created by the
        boring middle years where nothing appeared to be happening.
      </p>
    </div>
  );
}

// ── RiskRewardDiagram ───────────────────────────────────────────────────────

/** Entry, stop, target — drawn to scale, with the R-multiple made obvious. */
export function RiskRewardDiagram({ entry = 1400 }: { entry?: number }) {
  const [stopPct, setStopPct] = useState(2);
  const [targetPct, setTargetPct] = useState(4);

  const stop = entry * (1 - stopPct / 100);
  const target = entry * (1 + targetPct / 100);
  const rMultiple = targetPct / stopPct;

  const W = 520;
  const H = 210;
  const lo = entry * 0.94;
  const hi = entry * 1.08;
  const y = (v: number) => H - 25 - ((v - lo) / (hi - lo)) * (H - 50);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Risk and reward to scale">
        {/* reward zone */}
        <rect x={140} y={y(target)} width={220} height={y(entry) - y(target)} fill="var(--color-up)" opacity={0.14} rx={3} />
        {/* risk zone */}
        <rect x={140} y={y(entry)} width={220} height={y(stop) - y(entry)} fill="var(--color-down)" opacity={0.14} rx={3} />

        {[
          { v: target, label: 'Target', colour: 'var(--color-up)' },
          { v: entry, label: 'Entry', colour: 'var(--color-accent)' },
          { v: stop, label: 'Stop', colour: 'var(--color-down)' },
        ].map((l) => (
          <g key={l.label}>
            <line x1={120} y1={y(l.v)} x2={380} y2={y(l.v)} stroke={l.colour} strokeWidth={2} />
            <text x={112} y={y(l.v) + 4} textAnchor="end" fill={l.colour} fontSize={12}>
              {l.label}
            </text>
            <text x={388} y={y(l.v) + 4} fill="var(--color-ink-muted)" fontSize={12} className="num">
              {l.v.toFixed(2)}
            </text>
          </g>
        ))}

        <text x={250} y={(y(target) + y(entry)) / 2 + 4} textAnchor="middle" fill="var(--color-up)" fontSize={11}>
          reward · {targetPct.toFixed(1)}%
        </text>
        <text x={250} y={(y(entry) + y(stop)) / 2 + 4} textAnchor="middle" fill="var(--color-down)" fontSize={11}>
          risk · {stopPct.toFixed(1)}%
        </text>
      </svg>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Stop distance: <span className="num text-ink">{stopPct.toFixed(1)}%</span>
          </span>
          <input type="range" min={0.5} max={6} step={0.5} value={stopPct}
            onChange={(e) => setStopPct(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-accent)]" />
        </label>
        <label>
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Target distance: <span className="num text-ink">{targetPct.toFixed(1)}%</span>
          </span>
          <input type="range" min={0.5} max={12} step={0.5} value={targetPct}
            onChange={(e) => setTargetPct(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-accent)]" />
        </label>
      </div>

      <p className="mt-3 rounded-lg bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
        This is a <span className="num text-accent">{rMultiple.toFixed(2)}R</span> trade — you are risking one unit to
        make {rMultiple.toFixed(2)}. At this ratio you need to be right{' '}
        <span className="num text-ink">{((1 / (1 + rMultiple)) * 100).toFixed(0)}%</span> of the time merely to break
        even, before costs. Drag the two sliders and watch that required win rate move: it is the honest way to judge
        whether a setup is worth taking.
      </p>
    </div>
  );
}
