'use client';

/**
 * Candle Sprint — rapid pattern identification, then the honest statistics.
 *
 * Two halves, and the second is the point. First you identify patterns quickly
 * on real bars. Then the debrief tells you not only your accuracy but what each
 * pattern you spotted was ACTUALLY worth on that symbol's history — usually
 * nothing. Speed at recognising a shape is a real skill; it is just not the
 * same skill as making money, and this game is built to keep those separate.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PATTERNS, PATTERNS_BY_ID, type PatternId, type PatternStats, verdictFor } from '@/lib/analysis/patterns';
import type { Candle, Series } from '@/lib/market/types';

const SYMBOL = 'RELIANCE.NS';
const WINDOW = 6;
const ROUNDS = 10;
/** Patterns offered as answers. Kept small so the game is about seeing, not recall. */
const CHOICES: PatternId[] = ['bullish-engulfing', 'bearish-engulfing', 'doji', 'inside-bar', 'gap-up', 'gap-down'];

interface Round {
  bars: Candle[];
  answer: PatternId | 'none';
}

/** Find windows in real history that end on a recognisable pattern. */
function buildRounds(bars: Candle[], count: number): Round[] {
  const found: Round[] = [];
  const noneCandidates: Round[] = [];

  for (let i = WINDOW; i < bars.length && found.length < count * 3; i++) {
    const slice = bars.slice(i - WINDOW + 1, i + 1);
    const hit = CHOICES.find((id) => {
      const def = PATTERNS_BY_ID.get(id)!;
      return i >= def.lookback && def.detect(bars, i);
    });
    if (hit) found.push({ bars: slice, answer: hit });
    else if (noneCandidates.length < count) noneCandidates.push({ bars: slice, answer: 'none' });
  }

  // Mix in some windows with no pattern at all — otherwise the game teaches the
  // learner that there is always a pattern, which is the opposite of the point.
  const mixed = [...found.slice(0, count - 3), ...noneCandidates.slice(0, 3)];
  return mixed.slice(0, count).sort((a, b) => a.bars[0].time - b.bars[0].time);
}

export function CandleSprint() {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [stats, setStats] = useState<PatternStats[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<PatternId | 'none' | null>(null);
  const [answers, setAnswers] = useState<{ answer: PatternId | 'none'; picked: PatternId | 'none'; ms: number }[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [hist, pat] = await Promise.all([
        fetch(`/api/history?symbol=${SYMBOL}&interval=1d&range=5y`).then((r) => r.json()),
        fetch(`/api/patterns?symbol=${SYMBOL}&horizon=5&years=5`).then((r) => r.json()),
      ]);
      if (!hist.candles) throw new Error(hist.message ?? 'Could not load history.');
      const series = hist as Series;
      setRounds(buildRounds(series.candles, ROUNDS));
      setStats(pat.stats ?? []);
      setStartedAt(performance.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const round = rounds?.[index];
  const finished = rounds != null && index >= rounds.length;

  const choose = (id: PatternId | 'none') => {
    if (picked !== null || !round) return;
    setPicked(id);
    setAnswers((a) => [...a, { answer: round.answer, picked: id, ms: performance.now() - startedAt }]);
  };

  const next = () => {
    setIndex((n) => n + 1);
    setPicked(null);
    setStartedAt(performance.now());
  };

  const correct = answers.filter((a) => a.answer === a.picked).length;
  const avgMs = answers.length ? answers.reduce((s, a) => s + a.ms, 0) / answers.length : 0;

  /** Patterns the learner correctly identified, with what they were actually worth. */
  const spotted = useMemo(() => {
    const ids = new Set(answers.filter((a) => a.answer === a.picked && a.answer !== 'none').map((a) => a.answer));
    return stats.filter((s) => ids.has(s.patternId));
  }, [answers, stats]);

  if (error) return <div className="rounded-xl border border-danger/50 bg-danger/10 p-5 text-sm text-danger">{error}</div>;
  if (!rounds) return <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />;

  if (finished) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-accent-dim/50 bg-accent-dim/10 p-6">
          <div className="text-[11px] uppercase tracking-wider text-accent">Sprint complete</div>
          <div className="num mt-2 text-3xl">
            {correct}
            <span className="text-lg text-ink-faint">/{answers.length}</span>
          </div>
          <p className="num mt-1 text-[13px] text-ink-faint">{(avgMs / 1000).toFixed(1)}s average per chart</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">
            Now the part nobody shows you
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            Here is what the patterns you correctly identified were actually worth on {SYMBOL} over the last five
            years — hit rate against the base rate, five-day horizon.
          </p>

          {spotted.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-faint">
              You did not correctly identify any patterns this run, so there is nothing to score. Run it again.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {spotted.map((s) => {
                const v = verdictFor(s);
                return (
                  <li key={s.patternId} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                    <span>{s.label}</span>
                    <span className="num text-ink-faint">
                      {(s.hitRate * 100).toFixed(1)}% vs base {(s.baseRate * 100).toFixed(1)}% ·{' '}
                      <span
                        style={{
                          color:
                            v.verdict === 'notable'
                              ? 'var(--color-up)'
                              : v.verdict === 'weak'
                                ? 'var(--color-accent)'
                                : 'var(--color-ink-faint)',
                        }}
                      >
                        {v.verdict}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
            Being fast at spotting a shape is a real skill and it is worth having — it is how you describe what a
            market is doing. It is <strong className="text-ink">not</strong> the same as having an edge. Most of what
            you just identified correctly is statistically indistinguishable from noise on this symbol, and being
            quicker at recognising it does not change that.
          </p>
        </div>

        <button
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setAnswers([]);
            setStartedAt(performance.now());
          }}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-on-emphasis"
        >
          Sprint again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="num text-[11px] text-ink-faint">
          {index + 1} of {rounds.length}
        </span>
        <div className="flex flex-1 gap-1">
          {rounds.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full"
              style={{ background: i < index ? 'var(--color-accent)' : 'var(--color-line)' }} />
          ))}
        </div>
        <span className="num text-[11px] text-ink-faint">{correct} right</span>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <MiniCandles bars={round!.bars} />

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[...CHOICES, 'none' as const].map((id) => {
            const label = id === 'none' ? 'No clear pattern' : PATTERNS.find((p) => p.id === id)!.label;
            const isAnswer = picked !== null && id === round!.answer;
            const isWrong = picked === id && id !== round!.answer;
            return (
              <button
                key={id}
                onClick={() => choose(id)}
                disabled={picked !== null}
                className="rounded-lg border px-3 py-2 text-left text-[13px] transition-colors disabled:cursor-default"
                style={{
                  borderColor: isAnswer ? 'var(--color-up)' : isWrong ? 'var(--color-down)' : 'var(--color-line)',
                  color: isAnswer ? 'var(--color-up)' : 'var(--color-ink-muted)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <button onClick={next} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-emphasis">
            {index === rounds.length - 1 ? 'See the statistics' : 'Next chart'}
          </button>
        )}
      </div>

      <p className="text-[11px] text-ink-faint">
        Real daily bars from {SYMBOL}. The dates are hidden so you are reading the shape, not recalling the outcome.
      </p>
    </div>
  );
}

/** A tiny inline candle chart — the full charting library is overkill for six bars. */
function MiniCandles({ bars }: { bars: Candle[] }) {
  const width = 420;
  const height = 180;
  const hi = Math.max(...bars.map((b) => b.high));
  const lo = Math.min(...bars.map((b) => b.low));
  const pad = (hi - lo) * 0.1 || 1;
  const y = (v: number) => height - ((v - (lo - pad)) / (hi + pad - (lo - pad))) * height;
  const slot = width / bars.length;
  const bodyW = slot * 0.55;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Six candles">
      {bars.map((b, i) => {
        const cx = i * slot + slot / 2;
        const up = b.close >= b.open;
        const colour = up ? 'var(--color-up)' : 'var(--color-down)';
        const top = y(Math.max(b.open, b.close));
        const bottom = y(Math.min(b.open, b.close));
        return (
          <g key={i}>
            <line x1={cx} y1={y(b.high)} x2={cx} y2={y(b.low)} stroke={colour} strokeWidth={1.5} />
            <rect x={cx - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bottom - top)} fill={colour} />
          </g>
        );
      })}
    </svg>
  );
}
