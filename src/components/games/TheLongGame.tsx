'use client';

/**
 * The Long Game — compounding, inflation, fees, and sequence risk.
 *
 * Four things almost nobody has actually seen a chart of:
 *  1. what inflation does to a nominally impressive number
 *  2. what a 1% fee costs over thirty years
 *  3. that the arithmetic mean return is not the return you get
 *  4. that the ORDER of returns matters enormously once you contribute
 *
 * Uses real NIFTY calendar-year returns rather than a smooth 12% assumption,
 * because the smooth assumption is precisely what hides points 3 and 4.
 */
import { useMemo, useState } from 'react';
import {
  DEFAULT_INFLATION,
  NIFTY_ANNUAL_RETURNS,
  NIFTY_RETURN_SERIES,
  project,
  sequenceRiskComparison,
} from '@/lib/games/compounding';
import { RunSubmit } from './RunSubmit';

const inr = (n: number) =>
  n >= 1e7
    ? `₹${(n / 1e7).toFixed(2)} cr`
    : n >= 1e5
      ? `₹${(n / 1e5).toFixed(2)} L`
      : `₹${Math.round(n).toLocaleString('en-IN')}`;

export function TheLongGame() {
  const [initial, setInitial] = useState(200_000);
  const [contribution, setContribution] = useState(120_000);
  const [fee, setFee] = useState(1);
  const [inflation, setInflation] = useState(DEFAULT_INFLATION * 100);
  const [reversed, setReversed] = useState(false);

  const returns = useMemo(
    () => (reversed ? [...NIFTY_RETURN_SERIES].reverse() : NIFTY_RETURN_SERIES),
    [reversed],
  );

  const result = useMemo(
    () =>
      project({
        initial,
        annualContribution: contribution,
        returns,
        inflation: inflation / 100,
        feeDrag: fee / 100,
      }),
    [initial, contribution, returns, inflation, fee],
  );

  const noFee = useMemo(
    () => project({ initial, annualContribution: contribution, returns, inflation: inflation / 100 }),
    [initial, contribution, returns, inflation],
  );

  const sequence = useMemo(
    () =>
      sequenceRiskComparison({
        initial,
        annualContribution: contribution,
        returns: NIFTY_RETURN_SERIES,
        inflation: inflation / 100,
        feeDrag: fee / 100,
      }),
    [initial, contribution, inflation, fee],
  );

  const feeCost = noFee.finalNominal - result.finalNominal;
  const years = NIFTY_ANNUAL_RETURNS.length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Starting amount" value={initial} min={0} max={2_000_000} step={50_000}
            onChange={setInitial} format={inr} />
          <Slider label="Added each year" value={contribution} min={0} max={600_000} step={20_000}
            onChange={setContribution} format={inr} />
          <Slider label="Annual fee / expense ratio" value={fee} min={0} max={2.5} step={0.05}
            onChange={setFee} format={(v) => `${v.toFixed(2)}%`} />
          <Slider label="Inflation" value={inflation} min={0} max={10} step={0.25}
            onChange={setInflation} format={(v) => `${v.toFixed(2)}%`} />
        </div>
      </div>

      <Chart nominal={result.nominal} real={result.real} startYear={NIFTY_ANNUAL_RETURNS[0].year} />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label={`Nominal after ${years}y`} value={inr(result.finalNominal)} />
        <Stat label="In today's money" value={inr(result.finalReal)} tone="down" />
        <Stat label="You put in" value={inr(result.totalContributed)} />
        <Stat label="Cost of the fee" value={inr(feeCost)} tone="down" />
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">The two averages</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Arithmetic mean" value={`${(result.arithmeticMean * 100).toFixed(2)}%`} />
          <Stat label="What you actually compounded at" value={`${(result.geometricMean * 100).toFixed(2)}%`} tone="down" />
          <Stat label="Gap" value={`${((result.arithmeticMean - result.geometricMean) * 100).toFixed(2)} pts`} />
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          The average annual return over these {years} years was{' '}
          <span className="num">{(result.arithmeticMean * 100).toFixed(1)}%</span>, and a lump sum actually grew at{' '}
          <span className="num">{(result.geometricMean * 100).toFixed(1)}%</span>. Volatility eats the difference —
          +50% then −50% averages zero and leaves you down 25%. Every headline &ldquo;average return&rdquo; you have
          ever read is the larger, flattering number.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">Sequence-of-returns risk</div>
          <button
            onClick={() => setReversed((r) => !r)}
            className="rounded-lg border border-line-strong px-3 py-1.5 text-[13px] text-ink-muted hover:text-ink"
          >
            {reversed ? 'Play the years forwards' : 'Play the same years in reverse'}
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat label="Forwards (2005 → 2024)" value={inr(sequence.original.finalReal)} />
          <Stat label="Reversed (2024 → 2005)" value={inr(sequence.reversed.finalReal)} />
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          {contribution === 0 ? (
            <>
              With no contributions the order makes <strong className="text-ink">no difference at all</strong> —
              multiplication commutes, and the two figures above are identical. Now drag &ldquo;added each year&rdquo;
              above zero and watch them separate.
            </>
          ) : (
            <>
              Same twenty years, same returns, same average — and a gap of{' '}
              <span className="num text-accent">{inr(Math.abs(sequence.gap))}</span> purely from the ORDER they arrived
              in. Once you are adding money each year, a crash early (when the balance is small) is survivable and a
              crash late (when it is large) is not. Nobody plans for this, and it is largely outside your control —
              which is exactly why it deserves to be known about rather than discovered.
            </>
          )}
        </p>
      </div>

      <p className="text-[11px] text-ink-faint">
        Real NIFTY 50 calendar-year returns, {NIFTY_ANNUAL_RETURNS[0].year}–{NIFTY_ANNUAL_RETURNS[years - 1].year},
        including the {NIFTY_ANNUAL_RETURNS.find((r) => r.year === 2008)!.ret.toFixed(0)}% of 2008. Past returns are
        history, not a forecast — this is a model of what those specific years would have done to a specific plan.
      </p>

      {/*
        A projection sandbox — nothing to pre-commit to, no stop, and no
        money actually at stake over the twenty simulated years, so `pnl`
        stays honestly zero. There is no natural pass/fail here, so
        `accuracy` is left unset rather than forced.
      */}
      <RunSubmit
        game="the-long-game"
        trades={[
          {
            preCommitted: false,
            riskFraction: 0,
            honouredStop: true,
            exitedPerPlan: true,
            pnl: 0,
            sizedFromStop: false,
            plannedRR: null,
            stoppedOut: false,
          },
        ]}
        pnl={0}
        defaultReason={`Modelled ₹${initial.toLocaleString('en-IN')} starting, ₹${contribution.toLocaleString('en-IN')}/year, ${fee.toFixed(2)}% fee, ${inflation.toFixed(1)}% inflation over ${years} real NIFTY years${reversed ? ' (reversed order)' : ''}: ₹${Math.round(result.finalReal).toLocaleString('en-IN')} in today's money.`}
      />
    </div>
  );
}

function Chart({ nominal, real, startYear }: { nominal: number[]; real: number[]; startYear: number }) {
  const width = 720;
  const height = 220;
  const max = Math.max(...nominal, 1);
  const x = (i: number) => (i / (nominal.length - 1)) * width;
  const y = (v: number) => height - (v / max) * height;
  const line = (series: number[]) =>
    series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Portfolio value over time">
        <path d={`${line(nominal)} L${width},${height} L0,${height} Z`} fill="var(--color-accent)" opacity={0.12} />
        <path d={line(nominal)} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
        <path d={line(real)} fill="none" stroke="var(--color-ink-faint)" strokeWidth={2} strokeDasharray="5 4" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ background: 'var(--color-accent)' }} /> nominal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t border-dashed" style={{ borderColor: 'var(--color-ink-faint)' }} /> in
          today&rsquo;s money
        </span>
        <span className="num">{startYear} onward</span>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-ink-faint">
        {label}: <span className="num text-ink">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--color-accent)]" />
    </label>
  );
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
