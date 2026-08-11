'use client';

/**
 * Animated technical-analysis figures.
 *
 * No lesson in this course ships a video or a GIF — every diagram is inline
 * SVG so it inherits the theme, stays sharp at any width, and costs nothing to
 * download (see diagrams.tsx). This file is the first to animate them, using
 * framer-motion, which has been a dependency since the project started and
 * unused until this stage. Each figure autoplays once on mount and offers a
 * Replay button, which is the closest a static page gets to "watch it again".
 *
 * TWO KINDS OF FIGURE LIVE HERE, and the split is deliberate:
 *
 *  - `TrendlineFigure`, `FibonacciFigure` and `CandlestickTrioFigure` draw on
 *    REAL bars, fetched live and searched algorithmically (`chart-drawing.ts`
 *    finds the swing, the pivots, the pattern occurrence — nothing is chosen
 *    by eye). A learner watching one of these is watching the tool actually
 *    get marked up on a real chart, which is the whole point of a "how do I
 *    mark this" figure.
 *  - `ChartPatternFigure`, `ElliottWaveFigure` and `VolumeProfileFigure`
 *    remain illustrative, same as diagrams.tsx — they depict MECHANISMS, not
 *    a specific real occurrence, because reliably finding a real
 *    head-and-shoulders or a real Elliott count in a small fetched window
 *    is a shape-detection problem this course does not attempt to solve.
 *    Each of those three is honest about this in its own lesson.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Candle } from '@/lib/market/types';
import { PATTERNS_BY_ID, type PatternId } from '@/lib/analysis/patterns';
import { INDIA_EQUITIES } from '@/lib/market/symbols';
import {
  findLargestSwing,
  findLineTouch,
  findPivotLows,
  findTrendlineAnchors,
  retracementLevel,
} from '@/lib/analysis/chart-drawing';

function ReplayButton({ onReplay }: { onReplay: () => void }) {
  return (
    <button
      onClick={onReplay}
      className="num rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[11px] uppercase tracking-wide text-ink-muted transition-colors hover:text-ink"
    >
      ↻ Replay
    </button>
  );
}

function LoadingFigure() {
  return <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />;
}

function ErrorFigure({ message }: { message: string }) {
  return <div className="rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">{message}</div>;
}

/**
 * Real daily bars for one symbol. The only path these figures reach real
 * data through. Loading is DERIVED — the held data's own key against the
 * current inputs — rather than a flag reset synchronously in the effect,
 * the same pattern `usePatternStats` already uses in widgets/patterns.tsx.
 */
function useRealBars(symbol: string, range: string) {
  const key = `${symbol}|${range}`;
  const [data, setData] = useState<{ key: string; bars: Candle[] } | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&interval=1d&range=${range}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.candles) {
          setErrorState({ key, message: json.message ?? 'Could not load history.' });
          return;
        }
        setData({ key, bars: json.candles });
      })
      .catch((e) => {
        if (!cancelled) setErrorState({ key, message: e instanceof Error ? e.message : 'Something went wrong.' });
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range, key]);

  const bars = data?.key === key ? data.bars : null;
  const error = errorState?.key === key ? errorState.message : null;

  return { bars, error };
}

/** Vertical price → pixel scale with padding, shared by every real-data figure. */
function makeYScale(minVal: number, maxVal: number, height: number, padFrac = 0.08) {
  const pad = (maxVal - minVal) * padFrac || 1;
  const lo = minVal - pad;
  const hi = maxVal + pad;
  return (v: number) => height - ((v - lo) / (hi - lo)) * height;
}

/** Plain (non-animated) real candles — callers wrap the whole group in one fade-in. */
function realCandleElements(bars: Candle[], width: number, y: (v: number) => number) {
  const slot = width / bars.length;
  const bodyW = Math.max(1.5, slot * 0.55);
  return bars.map((b, i) => {
    const cx = i * slot + slot / 2;
    const up = b.close >= b.open;
    const colour = up ? 'var(--color-up)' : 'var(--color-down)';
    const top = y(Math.max(b.open, b.close));
    const bottom = y(Math.min(b.open, b.close));
    return (
      <g key={i}>
        <line x1={cx} y1={y(b.high)} x2={cx} y2={y(b.low)} stroke={colour} strokeWidth={1.2} opacity={0.9} />
        <rect x={cx - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bottom - top)} fill={colour} opacity={0.9} />
      </g>
    );
  });
}

// ── TrendlineFigure ─────────────────────────────────────────────────────────

const TRENDLINE_SYMBOL = 'HDFCBANK.NS';

/**
 * A trendline drawn on REAL daily bars. `findTrendlineAnchors` finds two
 * real swing lows algorithmically; `findLineTouch` checks whether the line
 * has genuinely been tested again since. Both outcomes are shown honestly —
 * a confirmed touch when one exists in the window, and the equally common
 * "still waiting" case when one does not, rather than only ever showing the
 * flattering version.
 */
export function TrendlineFigure() {
  const [play, setPlay] = useState(0);
  const { bars: allBars, error } = useRealBars(TRENDLINE_SYMBOL, '1y');

  if (error) return <ErrorFigure message={error} />;
  if (!allBars || allBars.length < 30) return <LoadingFigure />;

  const swing = findLargestSwing(allBars);
  const anchors = findTrendlineAnchors(allBars) ?? {
    p1: swing.lowIdx,
    p2: findPivotLows(allBars, 1).find((i) => i > swing.lowIdx) ?? Math.min(swing.lowIdx + 12, allBars.length - 1),
  };
  const { p1, p2 } = anchors;

  const startIdx = Math.max(0, p1 - 8);
  const endIdx = Math.min(allBars.length - 1, p2 + 22);
  const bars = allBars.slice(startIdx, endIdx + 1);
  const iP1 = p1 - startIdx;
  const iP2 = p2 - startIdx;
  const lineEndIdx = bars.length - 1;

  const slope = (bars[iP2].low - bars[iP1].low) / (iP2 - iP1);
  const lineAt = (i: number) => bars[iP1].low + slope * (i - iP1);
  const realTouch = findLineTouch(allBars, p1, p2, p2 + 1);
  const touchIdx = realTouch != null && realTouch <= endIdx ? realTouch - startIdx : null;

  const W = 560;
  const H = 240;
  const domainLo = Math.min(...bars.map((b) => b.low), lineAt(iP1), lineAt(lineEndIdx));
  const domainHi = Math.max(...bars.map((b) => b.high));
  const y = makeYScale(domainLo, domainHi, H - 24, 0.1);
  const slot = W / bars.length;
  const xAt = (i: number) => i * slot + slot / 2;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">
          Drawing a trendline on {TRENDLINE_SYMBOL.replace('.NS', '')}, real daily bars
        </span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="A trendline drawn on a real chart">
        <AnimatePresence mode="wait">
          <g key={play}>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {realCandleElements(bars, W, y)}
            </motion.g>

            {[iP1, iP2].map((idx, i) => (
              <motion.circle
                key={i} cx={xAt(idx)} cy={y(bars[idx].low)} r={4.5} fill="var(--color-accent)"
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.5, duration: 0.3 }}
              />
            ))}
            <motion.text x={xAt(iP1)} y={y(bars[iP1].low) + 18} fill="var(--color-accent)" fontSize={9.5} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
              swing low 1
            </motion.text>
            <motion.text x={xAt(iP2)} y={y(bars[iP2].low) + 18} fill="var(--color-accent)" fontSize={9.5} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
              swing low 2 — now draw it
            </motion.text>

            <motion.line
              x1={xAt(iP1)} y1={y(bars[iP1].low)} x2={xAt(lineEndIdx)} y2={y(lineAt(lineEndIdx))}
              stroke="var(--color-up)" strokeWidth={2}
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.8 }}
            />

            {touchIdx != null && (
              <>
                <motion.circle
                  cx={xAt(touchIdx)} cy={y(bars[touchIdx].low)} r={6} fill="none" stroke="var(--color-up)" strokeWidth={2}
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.3, duration: 0.3 }}
                />
                <motion.text x={xAt(touchIdx)} y={y(bars[touchIdx].low) - 12} fill="var(--color-up)" fontSize={9.5} textAnchor="middle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.6 }}>
                  a real third touch
                </motion.text>
              </>
            )}
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        {touchIdx != null
          ? 'Real daily bars, real swing lows, found by scanning rather than by eye. Price came back to this exact line and respected it — that real touch is what turns two points into something worth watching.'
          : 'Real daily bars, real swing lows, found by scanning rather than by eye. The line is drawn and projected forward — price has not tested it again in this window yet, which is the ordinary case: most trendlines are waiting, not confirmed.'}
      </p>
    </div>
  );
}

// ── FibonacciFigure ─────────────────────────────────────────────────────────

const FIB_SYMBOL = 'RELIANCE.NS';
const FIB_RETRACEMENTS = [0, 23.6, 38.2, 50, 61.8, 78.6, 100];
const FIB_EXTENSIONS = [161.8, 261.8];

/**
 * Anchoring a Fibonacci grid on REAL bars. The swing is the single largest
 * real rally found in a year of daily history — `findLargestSwing`, not a
 * hand-picked pair of points — so the anchors are exactly where a learner
 * would find them by scanning the same real chart themselves.
 */
export function FibonacciFigure() {
  const [play, setPlay] = useState(0);
  const { bars: allBars, error } = useRealBars(FIB_SYMBOL, '1y');

  if (error) return <ErrorFigure message={error} />;
  if (!allBars || allBars.length < 30) return <LoadingFigure />;

  const swing = findLargestSwing(allBars);
  const startIdx = Math.max(0, swing.lowIdx - 6);
  const endIdx = Math.min(allBars.length - 1, swing.highIdx + 14);
  const bars = allBars.slice(startIdx, endIdx + 1);
  const iLow = swing.lowIdx - startIdx;
  const iHigh = swing.highIdx - startIdx;
  const loPrice = allBars[swing.lowIdx].low;
  const hiPrice = allBars[swing.highIdx].high;

  const W = 560;
  const H = 280;
  const topLevel = retracementLevel(hiPrice, loPrice, 261.8);
  const domainLo = Math.min(loPrice, ...bars.map((b) => b.low));
  const domainHi = Math.max(topLevel, ...bars.map((b) => b.high));
  const y = makeYScale(domainLo, domainHi, H - 24, 0.03);
  const slot = W / bars.length;
  const xAt = (i: number) => i * slot + slot / 2;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">
          Anchoring a grid on {FIB_SYMBOL.replace('.NS', '')}, real daily bars
        </span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Fibonacci retracement drawn on a real chart">
        <AnimatePresence mode="wait">
          <g key={play}>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {realCandleElements(bars, W, y)}
            </motion.g>

            <motion.circle cx={xAt(iLow)} cy={y(loPrice)} r={5} fill="var(--color-down)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} />
            <motion.circle cx={xAt(iHigh)} cy={y(hiPrice)} r={5} fill="var(--color-up)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} />
            <motion.text x={xAt(iLow)} y={y(loPrice) + 18} fill="var(--color-down)" fontSize={9.5} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
              anchor 1 — swing low
            </motion.text>
            <motion.text x={xAt(iHigh)} y={y(hiPrice) - 10} fill="var(--color-up)" fontSize={9.5} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}>
              anchor 2 — swing high
            </motion.text>

            {FIB_RETRACEMENTS.map((pct, i) => {
              const level = retracementLevel(hiPrice, loPrice, pct);
              return (
                <g key={pct}>
                  <motion.line
                    x1={0} y1={y(level)} x2={W} y2={y(level)}
                    stroke={pct === 50 ? 'var(--color-accent)' : 'var(--color-line-strong)'}
                    strokeDasharray={pct === 0 || pct === 100 ? undefined : '4 4'}
                    strokeWidth={pct === 50 ? 1.5 : 1} opacity={0.85}
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ delay: 1.6 + i * 0.22, duration: 0.4 }}
                  />
                  <motion.text x={W - 4} y={y(level) - 3} textAnchor="end" fill="var(--color-ink-faint)" fontSize={9}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 + i * 0.22 }}>
                    {pct}%
                  </motion.text>
                </g>
              );
            })}

            {FIB_EXTENSIONS.map((pct, i) => {
              const level = retracementLevel(hiPrice, loPrice, pct);
              return (
                <g key={pct}>
                  <motion.line
                    x1={0} y1={y(level)} x2={W} y2={y(level)}
                    stroke="var(--color-up)" strokeDasharray="2 5" strokeWidth={1} opacity={0.6}
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ delay: 3.4 + i * 0.3, duration: 0.4 }}
                  />
                  <motion.text x={W - 4} y={y(level) - 3} textAnchor="end" fill="var(--color-up)" fontSize={9}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 + i * 0.3 }}>
                    {pct}%
                  </motion.text>
                </g>
              );
            })}
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        The largest real rally in a year of {FIB_SYMBOL.replace('.NS', '')}, found by scanning for it rather than
        chosen by eye. Anchor at the low, anchor at the high, and the grid draws itself — move either anchor and
        every level moves with it.
      </p>
    </div>
  );
}

// ── ChartPatternFigure ──────────────────────────────────────────────────────

type ChartPatternId = 'head-shoulders' | 'inverse-head-shoulders' | 'double-top' | 'double-bottom' | 'triangle';

const CHART_PATTERN_POINTS: Record<ChartPatternId, { points: [number, number][]; neckY: number; label: string }> = {
  'head-shoulders': {
    points: [[40, 150], [110, 90], [180, 140], [250, 40], [320, 140], [390, 95], [460, 150]],
    neckY: 142,
    label: 'neckline',
  },
  'inverse-head-shoulders': {
    points: [[40, 90], [110, 150], [180, 100], [250, 200], [320, 100], [390, 145], [460, 90]],
    neckY: 98,
    label: 'neckline',
  },
  'double-top': {
    points: [[60, 150], [160, 55], [260, 130], [360, 58], [460, 150]],
    neckY: 130,
    label: 'neckline',
  },
  'double-bottom': {
    points: [[60, 90], [160, 185], [260, 110], [360, 182], [460, 90]],
    neckY: 110,
    label: 'neckline',
  },
  triangle: {
    points: [[40, 170], [140, 70], [220, 140], [300, 90], [370, 122], [430, 100]],
    neckY: 0, // triangle has no single neckline; drawn separately below
    label: 'breakout',
  },
};

/**
 * One component, five shapes. `pattern` selects which reversal or
 * continuation pattern is traced, and the measured-move projection scales to
 * the shape's own height rather than a fixed pixel value.
 */
export function ChartPatternFigure({ pattern }: { pattern: ChartPatternId }) {
  const [play, setPlay] = useState(0);
  const W = 500;
  const H = 240;
  const isBearish = pattern === 'head-shoulders' || pattern === 'double-top';
  const isTriangle = pattern === 'triangle';
  const def = CHART_PATTERN_POINTS[pattern];
  const path = def.points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  // Measured move: the shape's tallest excursion from the neckline, projected
  // the same distance beyond the breakout point (the last plotted point).
  const peakY = isBearish
    ? Math.min(...def.points.map(([, y]) => y))
    : Math.max(...def.points.map(([, y]) => y));
  const height = Math.abs(def.neckY - peakY);
  const [lastX, lastY] = def.points[def.points.length - 1];
  const targetY = isBearish ? lastY + height : lastY - height;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">
          {pattern.replace(/-/g, ' ')}
        </span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Anatomy of a ${pattern.replace(/-/g, ' ')}`}>
        <AnimatePresence mode="wait">
          <g key={play}>
            <motion.path
              d={path} stroke="var(--color-ink)" strokeWidth={2.5} fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4 }}
            />

            {!isTriangle && (
              <>
                <motion.line
                  x1={20} y1={def.neckY} x2={W - 20} y2={def.neckY}
                  stroke="var(--color-accent)" strokeDasharray="5 4" strokeWidth={1.5}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                />
                <motion.text
                  x={26} y={def.neckY - 6} fill="var(--color-accent)" fontSize={10}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}
                >
                  {def.label}
                </motion.text>
              </>
            )}

            {isTriangle ? (
              <motion.text
                x={W / 2} y={H - 16} textAnchor="middle" fill="var(--color-ink-muted)" fontSize={11}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
              >
                two converging trendlines, narrowing toward a breakout in either direction
              </motion.text>
            ) : (
              <>
                <motion.line
                  x1={lastX} y1={lastY} x2={lastX} y2={targetY}
                  stroke={isBearish ? 'var(--color-down)' : 'var(--color-up)'} strokeWidth={2}
                  markerEnd="url(#ta-arrow)"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 2.2, duration: 0.6 }}
                />
                <motion.text
                  x={lastX + 8} y={(lastY + targetY) / 2}
                  fill={isBearish ? 'var(--color-down)' : 'var(--color-up)'} fontSize={10}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }}
                >
                  measured move
                </motion.text>
                <defs>
                  <marker id="ta-arrow" markerWidth={8} markerHeight={8} refX={4} refY={4} orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={isBearish ? 'var(--color-down)' : 'var(--color-up)'} />
                  </marker>
                </defs>
              </>
            )}
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        {isTriangle
          ? 'A triangle is drawn from two trendlines converging toward each other. There is no single neckline — the pattern is read as a pause, and the eventual breakout direction is the only part that actually tells you anything.'
          : 'The measured move is arithmetic, not a forecast: the height from the neckline to the furthest point of the shape, projected the same distance beyond the point the neckline breaks. Two chartists drawing the same shape a few pixels apart will get two different targets.'}
      </p>
    </div>
  );
}

// ── ElliottWaveFigure ────────────────────────────────────────────────────────

/**
 * The same eight-point zigzag, labelled two different ways. Toggling between
 * them is the entire lesson: both labellings are internally consistent with
 * the rules, and nothing about the price path itself picks one over the
 * other.
 */
export function ElliottWaveFigure() {
  const [altCount, setAltCount] = useState(false);
  const [play, setPlay] = useState(0);
  const W = 560;
  const H = 220;

  const points: [number, number][] = [
    [30, 170], [100, 120], [140, 145], [220, 70], [260, 100],
    [340, 40], [400, 90], [460, 60], [520, 130],
  ];
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  const primaryLabels = ['', '1', '2', '3', '4', '5', 'A', 'B', 'C'];
  // The alternative count treats the same points as a smaller wave 1–2–3
  // still in progress, with what the primary count called wave 5 relabelled
  // as an ongoing wave 3 of one larger degree.
  const altLabels = ['', '(1)', '(2)', '(3) of 3', '(4) of 3', '(5) of 3', '', '', 'still unfolding'];
  const labels = altCount ? altLabels : primaryLabels;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">
          {altCount ? 'An equally defensible alternative count' : 'One reading of the same chart'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setAltCount((v) => !v)}
            className="num rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[11px] uppercase tracking-wide text-ink-muted transition-colors hover:text-ink"
          >
            {altCount ? '← Original count' : 'Show alternative count →'}
          </button>
          <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="An Elliott wave count, and an equally valid alternative">
        <AnimatePresence mode="wait">
          <g key={`${play}-${altCount}`}>
            <motion.path
              d={path} stroke="var(--color-ink-faint)" strokeWidth={2} fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }}
            />
            {points.slice(1).map(([x, y], i) => (
              <g key={i}>
                <motion.circle
                  cx={x} cy={y} r={4} fill="var(--color-accent)"
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.18, duration: 0.25 }}
                />
                {labels[i + 1] && (
                  <motion.text
                    x={x} y={y - 12} textAnchor="middle" fill="var(--color-accent)" fontSize={11}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.18 }}
                  >
                    {labels[i + 1]}
                  </motion.text>
                )}
              </g>
            ))}
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        Nothing about the price path changed between the two buttons above — only the count did. Both labellings
        follow the same rules (a five-wave move with the trend, a three-wave move against it), and both survive
        contact with this chart. That is not a mistake either counter is making. It is why professional Elliott
        wave counts disagree with each other in real time, on the same chart, at the same moment.
      </p>
    </div>
  );
}

// ── CandlestickTrioFigure ────────────────────────────────────────────────────

/** A handful of liquid symbols to search — a real occurrence in one of these is common. */
const TRIO_SYMBOL_POOL = INDIA_EQUITIES.slice(0, 10).map((s) => s.symbol);

type TrioResult =
  | { status: 'none' }
  | { status: 'error'; message: string }
  | { status: 'found'; bars: Candle[]; index: number; symbol: string };
type TrioSearch = TrioResult | { status: 'searching' };

/**
 * Scans real history, symbol by symbol, for a genuine occurrence of
 * `patternId`. As with `useRealBars`, "searching" is DERIVED from whether
 * the held result matches the current key, rather than reset synchronously.
 */
function useRealPatternExample(patternId: PatternId, symbols: string[], range: string): TrioSearch {
  const key = `${patternId}|${symbols.join(',')}|${range}`;
  const [result, setResult] = useState<{ key: string; value: TrioResult } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const def = PATTERNS_BY_ID.get(patternId);
      if (!def) {
        setResult({ key, value: { status: 'none' } });
        return;
      }
      for (const symbol of symbols) {
        try {
          const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&interval=1d&range=${range}`);
          const json = await res.json();
          if (cancelled) return;
          const bars: Candle[] | undefined = json.candles;
          if (!bars) continue;
          for (let i = bars.length - 1; i >= def.lookback; i--) {
            if (def.detect(bars, i)) {
              setResult({ key, value: { status: 'found', bars, index: i, symbol } });
              return;
            }
          }
        } catch {
          // Try the next symbol rather than failing the whole search.
        }
      }
      if (!cancelled) setResult({ key, value: { status: 'none' } });
    })();

    return () => {
      cancelled = true;
    };
  }, [patternId, symbols, range, key]);

  if (result?.key !== key) return { status: 'searching' };
  return result.value;
}

/**
 * Three REAL candles: a genuine occurrence of morning-star or evening-star,
 * found by running the exact same detector from `patterns.ts` against real
 * history — the same rule the scanner widget below tests at scale, applied
 * once here to one real, specific example instead of a hand-drawn shape.
 */
export function CandlestickTrioFigure({ pattern }: { pattern: 'morning-star' | 'evening-star' }) {
  const [play, setPlay] = useState(0);
  const result = useRealPatternExample(pattern, TRIO_SYMBOL_POOL, '2y');
  const bullish = pattern === 'morning-star';

  if (result.status === 'searching') return <LoadingFigure />;
  if (result.status === 'error') return <ErrorFigure message={result.message} />;
  if (result.status === 'none') {
    return (
      <ErrorFigure message={`No real ${pattern.replace('-', ' ')} turned up across the symbols checked just now. Reload the lesson to search again.`} />
    );
  }

  const { bars: allBars, index, symbol } = result;
  const startIdx = Math.max(0, index - 9);
  const endIdx = Math.min(allBars.length - 1, index + 2);
  const bars = allBars.slice(startIdx, endIdx + 1);
  const iC1 = index - 2 - startIdx;
  const iC2 = index - 1 - startIdx;
  const iC3 = index - startIdx;

  const c1 = allBars[index - 2];
  const midpoint = (c1.open + c1.close) / 2;

  const W = 560;
  const H = 220;
  const y = makeYScale(Math.min(...bars.map((b) => b.low)), Math.max(...bars.map((b) => b.high)), H - 30, 0.15);
  const slot = W / bars.length;
  const bodyW = Math.max(2, slot * 0.55);
  const xAt = (i: number) => i * slot + slot / 2;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">
          A real {bullish ? 'morning star' : 'evening star'} on {symbol.replace('.NS', '')}
        </span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`A real ${pattern} found on ${symbol}`}>
        <AnimatePresence mode="wait">
          <g key={play}>
            <line x1={0} y1={y(midpoint)} x2={W} y2={y(midpoint)} stroke="var(--color-line)" strokeDasharray="3 4" />
            <text x={W - 4} y={y(midpoint) - 6} textAnchor="end" fill="var(--color-ink-faint)" fontSize={9}>
              midpoint of candle 1&apos;s body
            </text>

            {bars.map((b, i) => {
              const up = b.close >= b.open;
              const colour = up ? 'var(--color-up)' : 'var(--color-down)';
              const top = y(Math.max(b.open, b.close));
              const bottom = y(Math.min(b.open, b.close));
              const isPattern = i === iC1 || i === iC2 || i === iC3;
              const cx = xAt(i);
              return (
                <motion.g
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isPattern ? 1 : 0.3 }}
                  transition={{ delay: isPattern ? 0.3 + (i - iC1) * 0.7 : 0, duration: 0.4 }}
                >
                  <line x1={cx} y1={y(b.high)} x2={cx} y2={y(b.low)} stroke={colour} strokeWidth={1.2} />
                  <rect x={cx - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bottom - top)} fill={colour} />
                </motion.g>
              );
            })}
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        A real occurrence on {symbol.replace('.NS', '')}, found by scanning its actual history for the same rule the
        scanner below tests at scale. The three highlighted candles are the pattern; the dimmed ones are context.
      </p>
    </div>
  );
}

// ── VolumeProfileFigure ──────────────────────────────────────────────────────

/**
 * A histogram of volume BY PRICE rather than by time — the point of control
 * (the price with the most volume) and the value area (the contiguous band
 * holding most of it) highlighted. Illustrative bars, not real data — the
 * shape of a volume profile depends entirely on the period chosen, which is
 * itself a judgement call the figure's caption is explicit about.
 */
export function VolumeProfileFigure() {
  const [play, setPlay] = useState(0);
  const W = 520;
  const H = 260;

  // Twelve price levels, bottom (lowest price) to top (highest), with an
  // illustrative bell-shaped volume distribution peaking in the middle.
  const levels = [2, 5, 9, 17, 29, 41, 47, 43, 27, 15, 7, 3];
  const maxVol = Math.max(...levels);
  const pocIndex = levels.indexOf(maxVol);
  const valueAreaRange = [pocIndex - 2, pocIndex + 2]; // illustrative ~70% band

  const rowH = (H - 40) / levels.length;
  const yFor = (i: number) => H - 20 - (i + 0.5) * rowH;
  const axisX = 60;
  const maxBarW = W - axisX - 30;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">Volume by price, not by time</span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="A volume profile: volume traded at each price level">
        <AnimatePresence mode="wait">
          <g key={play}>
            <line x1={axisX} y1={10} x2={axisX} y2={H - 20} stroke="var(--color-line-strong)" strokeWidth={1.5} />

            {valueAreaRange[0] >= 0 && (
              <rect
                x={axisX} y={yFor(valueAreaRange[1]) - rowH / 2} width={maxBarW + 10}
                height={yFor(valueAreaRange[0]) - yFor(valueAreaRange[1]) + rowH}
                fill="var(--color-accent)" opacity={0.06}
              />
            )}

            {levels.map((v, i) => {
              const w = (v / maxVol) * maxBarW;
              const isPoc = i === pocIndex;
              const inValueArea = i >= valueAreaRange[0] && i <= valueAreaRange[1];
              return (
                <motion.rect
                  key={i}
                  x={axisX} y={yFor(i) - rowH * 0.35} height={rowH * 0.7}
                  fill={isPoc ? 'var(--color-accent)' : inValueArea ? 'var(--color-up)' : 'var(--color-ink-faint)'}
                  opacity={isPoc ? 1 : inValueArea ? 0.75 : 0.45}
                  rx={2}
                  initial={{ width: 0 }}
                  animate={{ width: w }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                />
              );
            })}

            <motion.text
              x={axisX + (levels[pocIndex] / maxVol) * maxBarW + 8} y={yFor(pocIndex) + 3}
              fill="var(--color-accent)" fontSize={10}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            >
              point of control — the single busiest price
            </motion.text>
            <motion.text
              x={axisX + 4} y={yFor(valueAreaRange[0]) + rowH}
              fill="var(--color-up)" fontSize={9.5}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
            >
              value area — most of the session&apos;s volume happened in this band
            </motion.text>
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        A normal volume chart answers &ldquo;when was it busy&rdquo;. This answers &ldquo;at what PRICE was it busy&rdquo; — genuinely
        different information. Where the bars land depends entirely on which period you build the profile from, which
        is a choice you make, not a fact handed to you.
      </p>
    </div>
  );
}
