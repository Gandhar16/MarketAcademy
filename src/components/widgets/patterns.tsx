'use client';

/**
 * Pattern base-rate widgets.
 *
 * These run against REAL history through /api/patterns. The learner picks a
 * symbol and a holding horizon and gets the hit rate next to the base rate,
 * because the hit rate alone is meaningless: a signal followed by an up move
 * 54% of the time is worthless if the market was up 53% of the time anyway.
 *
 * This is the widget that makes T2 honest, and it will disappoint people. That
 * is the intended outcome.
 */
import { useCallback, useEffect, useState } from 'react';
import { INDIA_EQUITIES, INDIA_INDICES } from '@/lib/market/symbols';
import { PATTERNS, verdictFor, type PatternId, type PatternStats } from '@/lib/analysis/patterns';

const SYMBOLS = [...INDIA_INDICES.slice(0, 2), ...INDIA_EQUITIES.slice(0, 6)];
const HORIZONS = [1, 3, 5, 10, 20];

interface Payload {
  symbol: string;
  horizon: number;
  bars: number;
  stats: PatternStats[];
}

const keyFor = (symbol: string, horizon: number) => `${symbol}|${horizon}`;

function usePatternStats(symbol: string, horizon: number) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  const key = keyFor(symbol, horizon);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/patterns?symbol=${encodeURIComponent(symbol)}&horizon=${horizon}&years=5`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not score the patterns.');
      setData(json);
      setError(null);
    } catch (e) {
      setError({ key: keyFor(symbol, horizon), message: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  }, [symbol, horizon]);

  useEffect(() => {
    // Network fetch on mount and whenever the selection changes. The rule
    // guards against effects that mirror props into state; this one talks to
    // the server, which is what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Loading is DERIVED: we are loading whenever the data we hold is not for the
  // selection currently on screen. No effect has to set a flag.
  // Stale data stays on screen while the next selection loads — a flash of
  // empty panel on every dropdown change is worse than a moment of old numbers,
  // and the header always states which symbol the figures belong to.
  const fresh = data != null && keyFor(data.symbol, data.horizon) === key;
  return {
    data,
    fresh,
    error: error?.key === key ? error.message : null,
    loading: !fresh && error?.key !== key,
  };
}

const VERDICT_COLOUR: Record<string, string> = {
  noise: 'var(--color-ink-faint)',
  weak: 'var(--color-accent)',
  notable: 'var(--color-up)',
};

// ── PatternBaseRate — one pattern, examined properly ───────────────────────

export function PatternBaseRate({
  pattern = 'bullish-engulfing',
  symbol: symbol0 = 'RELIANCE.NS',
}: {
  pattern?: PatternId;
  symbol?: string;
}) {
  const [symbol, setSymbol] = useState(symbol0);
  const [horizon, setHorizon] = useState(5);
  const [patternId, setPatternId] = useState<PatternId>(pattern);
  const { data, error, loading } = usePatternStats(symbol, horizon);

  const stats = data?.stats.find((s) => s.patternId === patternId);
  const verdict = stats ? verdictFor(stats) : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap gap-2">
        <Select value={patternId} onChange={(v) => setPatternId(v as PatternId)}
          options={PATTERNS.map((p) => ({ value: p.id, label: p.label }))} />
        <Select value={symbol} onChange={setSymbol}
          options={SYMBOLS.map((s) => ({ value: s.symbol, label: s.name }))} />
        <Select value={String(horizon)} onChange={(v) => setHorizon(Number(v))}
          options={HORIZONS.map((h) => ({ value: String(h), label: `hold ${h} day${h === 1 ? '' : 's'}` }))} />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {loading && !data && <div className="mt-4 h-40 animate-pulse rounded-lg bg-surface-2" />}

      {stats && verdict && (
        <>
          <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-[13px] italic text-ink-faint">
            &ldquo;{stats.folklore}&rdquo;
          </p>

          <div className="mt-5">
            <RateBar label={`After a ${stats.label.toLowerCase()}`} value={stats.hitRate} colour="var(--color-accent)" />
            <RateBar label="After ANY bar (the base rate)" value={stats.baseRate} colour="var(--color-ink-faint)" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Cell label="Edge over base" value={`${stats.edge > 0 ? '+' : ''}${stats.edge.toFixed(1)} pts`}
              colour={VERDICT_COLOUR[verdict.verdict]} />
            <Cell label="Occurrences" value={stats.occurrences.toLocaleString('en-IN')} />
            <Cell label="Mean return" value={`${stats.meanReturn > 0 ? '+' : ''}${stats.meanReturn.toFixed(2)}%`} />
            <Cell label="Base mean" value={`${stats.baseMeanReturn > 0 ? '+' : ''}${stats.baseMeanReturn.toFixed(2)}%`} />
          </div>

          <div
            className="mt-4 rounded-lg px-4 py-3 text-[13px] leading-relaxed"
            style={{
              background: verdict.verdict === 'notable' ? 'rgba(45,212,167,0.08)' : 'var(--color-surface-2)',
              color: 'var(--color-ink-muted)',
            }}
          >
            <strong style={{ color: VERDICT_COLOUR[verdict.verdict] }}>
              {verdict.verdict === 'noise' ? 'Noise. ' : verdict.verdict === 'weak' ? 'Weak. ' : 'Notable. '}
            </strong>
            {verdict.text}
          </div>

          <p className="num mt-3 text-[11px] text-ink-faint">
            {data!.bars.toLocaleString('en-IN')} real daily bars · z = {stats.zScore.toFixed(2)} · 5 years to today
          </p>
        </>
      )}
    </div>
  );
}

// ── PatternScanner — every pattern at once, sorted by claimed edge ──────────

export function PatternScanner({ symbol: symbol0 = 'RELIANCE.NS' }: { symbol?: string }) {
  const [symbol, setSymbol] = useState(symbol0);
  const [horizon, setHorizon] = useState(5);
  const { data, error, loading } = usePatternStats(symbol, horizon);

  const rows = (data?.stats ?? []).slice().sort((a, b) => b.edge - a.edge);
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.edge)));

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap gap-2">
        <Select value={symbol} onChange={setSymbol}
          options={SYMBOLS.map((s) => ({ value: s.symbol, label: s.name }))} />
        <Select value={String(horizon)} onChange={(v) => setHorizon(Number(v))}
          options={HORIZONS.map((h) => ({ value: String(h), label: `hold ${h} day${h === 1 ? '' : 's'}` }))} />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {loading && !data && <div className="mt-4 h-64 animate-pulse rounded-lg bg-surface-2" />}

      {rows.length > 0 && (
        <>
          <div className="mt-5 space-y-2">
            {rows.map((s) => {
              const v = verdictFor(s);
              return (
                <div key={s.patternId} className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm">{s.label}</span>
                      <span className="num text-[11px]" style={{ color: VERDICT_COLOUR[v.verdict] }}>
                        {v.verdict}
                      </span>
                      <span className="num text-[11px] text-ink-faint">{s.occurrences} times</span>
                    </div>
                    <div className="relative mt-1 h-2 rounded-full bg-surface-2">
                      <div className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                      <div
                        className="absolute inset-y-0 rounded-full"
                        style={{
                          left: s.edge >= 0 ? '50%' : `${50 - (Math.abs(s.edge) / maxAbs) * 50}%`,
                          width: `${(Math.abs(s.edge) / maxAbs) * 50}%`,
                          background: VERDICT_COLOUR[v.verdict],
                        }}
                      />
                    </div>
                  </div>
                  <span className="num w-20 text-right text-[13px]" style={{ color: VERDICT_COLOUR[v.verdict] }}>
                    {s.edge > 0 ? '+' : ''}
                    {s.edge.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-[13px] leading-relaxed text-ink-muted">
            Bars point away from the centre line, which is the base rate. Notice how many sit close to it, and how many
            are labelled <span style={{ color: 'var(--color-ink-faint)' }}>noise</span>. Change the symbol and watch the
            ranking reshuffle — a pattern that looks best on one stock is rarely best on the next, which is what
            &ldquo;this worked on my backtest&rdquo; usually means.
          </p>
        </>
      )}
    </div>
  );
}

// ── shared bits ─────────────────────────────────────────────────────────────

function RateBar({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-ink-muted">{label}</span>
        <span className="num">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${value * 100}%`, background: colour }} />
      </div>
    </div>
  );
}

function Cell({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="num mt-0.5 text-base" style={colour ? { color: colour } : undefined}>
        {value}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink-muted outline-none focus:border-line-strong"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
