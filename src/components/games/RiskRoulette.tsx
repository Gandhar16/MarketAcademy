'use client';

/**
 * Risk Roulette — trains position sizing and risk of ruin.
 *
 * The mechanic: the edge is FIXED and positive. The only thing the learner
 * controls is bet size. They watch the same good strategy make money at 1% and
 * bankrupt itself at 20%, on draws they can reproduce.
 *
 * The equity curves are a model, not market data, and the UI says so.
 */
import { useMemo, useState } from 'react';
import { DEFAULT_RUIN_CONFIG, expectancy, kellyFraction, simulate, type RuinConfig } from '@/lib/games/ruin';

const RISK_STEPS = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.35];

export function RiskRoulette() {
  const [riskFraction, setRiskFraction] = useState(0.02);
  const [winRate, setWinRate] = useState(0.55);
  const [seed, setSeed] = useState(1);

  // Built inside the memo so the config object identity does not force a
  // re-simulation on every render.
  const { cfg, summary } = useMemo(() => {
    const c: RuinConfig = { ...DEFAULT_RUIN_CONFIG, riskFraction, winRate };
    return { cfg: c, summary: simulate(c, 400, seed) };
  }, [riskFraction, winRate, seed]);

  const kelly = kellyFraction(winRate, 1);
  const edge = expectancy(winRate, 1);
  const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">Your edge (fixed and real)</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={0.45}
                max={0.65}
                step={0.01}
                value={winRate}
                onChange={(e) => setWinRate(Number(e.target.value))}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span className="num w-16 text-right">{(winRate * 100).toFixed(0)}%</span>
            </div>
            <p className="mt-2 text-[13px] text-ink-faint">
              Win rate at 1:1 reward-to-risk. Expectancy{' '}
              <span className="num" style={{ color: edge > 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
                {edge >= 0 ? '+' : ''}
                {(edge * 100).toFixed(0)}%
              </span>{' '}
              of the amount risked, per trade.
            </p>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">Risk per trade</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RISK_STEPS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFraction(r)}
                  className="num rounded-md px-2.5 py-1 text-sm transition-colors"
                  style={{
                    background: riskFraction === r ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    color: riskFraction === r ? 'var(--color-ground)' : 'var(--color-ink-muted)',
                  }}
                >
                  {(r * 100).toFixed(r < 0.01 ? 1 : 0)}%
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink-faint">
              Full Kelly for this edge is <span className="num text-ink">{(kelly * 100).toFixed(1)}%</span>. Kelly
              assumes you know your edge exactly. You do not.
            </p>
          </div>
        </div>
      </div>

      <EquityPlot paths={summary.paths} startingEquity={cfg.startingEquity} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Chance of ruin"
          value={`${(summary.ruinProbability * 100).toFixed(1)}%`}
          tone={summary.ruinProbability > 0.2 ? 'bad' : summary.ruinProbability > 0.05 ? 'warn' : 'good'}
          note="Losing half the account over 200 trades."
        />
        <Metric label="Median outcome" value={inr(summary.medianFinal)} note="The middle result across 400 runs." />
        <Metric
          label="Bad-luck case (5th pct)"
          value={inr(summary.p5Final)}
          tone={summary.p5Final < cfg.startingEquity ? 'bad' : 'good'}
          note="One run in twenty is at least this bad."
        />
        <Metric
          label="Worst losing streak"
          value={`${summary.worstLosingStreak} in a row`}
          note="With a positive edge. Streaks are not evidence the system broke."
        />
      </div>

      <div className="rounded-xl border border-accent-dim/40 bg-accent-dim/10 p-5 text-sm leading-relaxed text-ink-muted">
        {summary.ruinProbability > 0.2 ? (
          <>
            <strong className="text-ink">You have a genuinely positive edge and you are still going broke.</strong> Not
            because the strategy is wrong — the win rate has not changed. Losses compound geometrically: after a 50%
            drawdown you need a 100% gain to get back, and betting {(riskFraction * 100).toFixed(0)}% of a shrinking
            account cannot deliver it. Sizing is not a detail on top of a strategy. It is most of the strategy.
          </>
        ) : (
          <>
            At {(riskFraction * 100).toFixed(1)}% risk the edge survives its own variance. Note the drawdowns anyway —
            the median run still spends time underwater, and that is what makes people abandon a system that was
            working.
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="rounded-lg border border-line-strong px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          Draw a different set of runs
        </button>
        <span className="text-[11px] text-ink-faint">
          Seed {seed}. These are modelled coin flips with your stated edge — not market data.
        </span>
      </div>
    </div>
  );
}

function EquityPlot({ paths, startingEquity }: { paths: { equity: number[]; ruined: boolean }[]; startingEquity: number }) {
  const width = 800;
  const height = 260;
  const maxLen = Math.max(...paths.map((p) => p.equity.length));
  const maxEq = Math.max(startingEquity * 1.2, ...paths.flatMap((p) => p.equity));

  const toPath = (equity: number[]) =>
    equity
      .map((e, i) => {
        const x = (i / (maxLen - 1)) * width;
        const y = height - (e / maxEq) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${Math.max(0, y).toFixed(1)}`;
      })
      .join(' ');

  const baselineY = height - (startingEquity / maxEq) * height;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Modelled equity curves">
        <line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke="#323a4b" strokeDasharray="4 4" />
        {paths.map((p, i) => (
          <path
            key={i}
            d={toPath(p.equity)}
            fill="none"
            stroke={p.ruined ? 'var(--color-down)' : 'var(--color-up)'}
            strokeWidth={1}
            opacity={p.ruined ? 0.5 : 0.28}
          />
        ))}
      </svg>
      <div className="mt-2 flex gap-4 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ background: 'var(--color-up)' }} /> survived
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ background: 'var(--color-down)' }} /> ruined
        </span>
        <span>40 of 400 modelled runs shown · dashed line is your starting equity</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const colour =
    tone === 'bad' ? 'var(--color-down)' : tone === 'warn' ? 'var(--color-accent)' : tone === 'good' ? 'var(--color-up)' : undefined;
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="num mt-1 text-xl" style={colour ? { color: colour } : undefined}>
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-ink-faint">{note}</div>
    </div>
  );
}
