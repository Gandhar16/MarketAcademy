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
 * As with diagrams.tsx, none of these depict real market data. They depict
 * MECHANISMS — how a tool is drawn, not a claim about what any real chart
 * did — which is why they can be authored from first principles.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ── TrendlineFigure ─────────────────────────────────────────────────────────

/**
 * How a trendline is actually drawn: two swing points first, a third touch
 * that confirms it, and a close beyond it that invalidates it. The point
 * being made in the lesson is that steps 1–2 are a HYPOTHESIS and step 3 is
 * the only thing that turns it into something worth paying attention to.
 */
export function TrendlineFigure() {
  const [play, setPlay] = useState(0);
  const W = 560;
  const H = 220;

  // A hand-authored illustrative uptrend with two higher lows and a touch.
  const series: [number, number][] = [
    [40, 170], [90, 140], [140, 158], [190, 108], [230, 128], [280, 90],
    [330, 112], [380, 68], [420, 86], [470, 46],
  ];
  const path = series.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  // The trendline passes through the two swing lows: index 2 and index 6.
  const p1 = series[2];
  const p2 = series[6];
  const slope = (p2[1] - p1[1]) / (p2[0] - p1[0]);
  const lineAt = (x: number) => p1[1] + slope * (x - p1[0]);
  const lineStart: [number, number] = [30, lineAt(30)];
  const lineEnd: [number, number] = [520, lineAt(520)];

  // Touch 3: the same swing-low rule, further along the same line.
  const touch3: [number, number] = [420, lineAt(420) - 4];

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">Drawing a trendline</span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="How a trendline is drawn">
        <AnimatePresence mode="wait">
          <g key={play}>
            <path d={path} stroke="var(--color-ink-faint)" strokeWidth={2} fill="none" />

            {[series[2], series[6]].map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={5}
                fill="var(--color-accent)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.5, duration: 0.3 }}
              />
            ))}
            <motion.text
              x={p1[0]} y={p1[1] + 20} fill="var(--color-accent)" fontSize={10} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            >
              swing low 1
            </motion.text>
            <motion.text
              x={p2[0]} y={p2[1] + 20} fill="var(--color-accent)" fontSize={10} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            >
              swing low 2 — now you can draw it
            </motion.text>

            <motion.line
              x1={lineStart[0]} y1={lineStart[1]} x2={lineEnd[0]} y2={lineEnd[1]}
              stroke="var(--color-up)" strokeWidth={2}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            />

            <motion.circle
              cx={touch3[0]} cy={touch3[1]} r={6} fill="none" stroke="var(--color-up)" strokeWidth={2}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.6, duration: 0.3 }}
            />
            <motion.text
              x={touch3[0]} y={touch3[1] - 14} fill="var(--color-up)" fontSize={10} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.9 }}
            >
              touch 3 — this is the confirmation
            </motion.text>
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        Two points make a line. A THIRD point that respects it is what makes that line worth anything — with only
        two, you have drawn a hypothesis, not a level. A close on the other side of it is the line failing, not the
        market being wrong.
      </p>
    </div>
  );
}

// ── FibonacciFigure ─────────────────────────────────────────────────────────

const FIB_RETRACEMENTS = [0, 23.6, 38.2, 50, 61.8, 78.6, 100];
const FIB_EXTENSIONS = [161.8, 261.8];

/** Anchoring a swing low and swing high, then drawing the grid level by level. */
export function FibonacciFigure() {
  const [play, setPlay] = useState(0);
  const W = 560;
  const H = 260;

  const loY = 220; // swing low, at the bottom
  const hiY = 60; // swing high, at the top
  const yFor = (pct: number) => loY - ((loY - hiY) * pct) / 100;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">Anchoring a Fibonacci grid</span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Fibonacci retracement and extension levels">
        <AnimatePresence mode="wait">
          <g key={play}>
            {/* the move itself: swing low to swing high */}
            <motion.line
              x1={100} y1={loY} x2={100} y2={hiY} stroke="var(--color-ink-faint)" strokeWidth={2}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }}
            />
            <motion.circle cx={100} cy={loY} r={5} fill="var(--color-down)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} />
            <motion.circle cx={100} cy={hiY} r={5} fill="var(--color-up)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
            <motion.text x={100} y={loY + 18} fill="var(--color-down)" fontSize={10} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              anchor 1 — swing low
            </motion.text>
            <motion.text x={100} y={hiY - 12} fill="var(--color-up)" fontSize={10} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              anchor 2 — swing high
            </motion.text>

            {FIB_RETRACEMENTS.map((pct, i) => (
              <g key={pct}>
                <motion.line
                  x1={100} y1={yFor(pct)} x2={W - 20} y2={yFor(pct)}
                  stroke={pct === 50 ? 'var(--color-accent)' : 'var(--color-line-strong)'}
                  strokeDasharray={pct === 0 || pct === 100 ? undefined : '4 4'}
                  strokeWidth={pct === 50 ? 1.5 : 1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 1 + i * 0.25, duration: 0.4 }}
                />
                <motion.text
                  x={W - 16} y={yFor(pct) + 3} fill="var(--color-ink-faint)" fontSize={9.5}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 + i * 0.25 }}
                >
                  {pct}%
                </motion.text>
              </g>
            ))}

            {FIB_EXTENSIONS.map((pct, i) => (
              <g key={pct}>
                <motion.line
                  x1={100} y1={yFor(pct)} x2={W - 20} y2={yFor(pct)}
                  stroke="var(--color-up)" strokeDasharray="2 5" strokeWidth={1} opacity={0.7}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ delay: 2.9 + i * 0.3, duration: 0.4 }}
                />
                <motion.text
                  x={W - 16} y={yFor(pct) + 3} fill="var(--color-up)" fontSize={9.5}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 + i * 0.3 }}
                >
                  {pct}%
                </motion.text>
              </g>
            ))}
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        The grid is anchored on exactly two points and nothing else — move either anchor a little and every line
        moves with it. 50% is on this chart because traders watch it, not because it belongs to the Fibonacci
        sequence at all. The dashed lines above 100% are extensions, read as possible targets if the move continues
        past the swing high rather than pausing there.
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

/** Three candles, appearing in sequence: the morning-star / evening-star family. */
export function CandlestickTrioFigure({ pattern }: { pattern: 'morning-star' | 'evening-star' }) {
  const [play, setPlay] = useState(0);
  const W = 380;
  const H = 200;
  const bullish = pattern === 'morning-star';

  // [openY, closeY, highY, lowY] per candle, in SVG y-coordinates (smaller = higher price).
  const candles = bullish
    ? [
        { x: 70, o: 60, c: 150, h: 55, l: 155 }, // big down day
        { x: 190, o: 158, c: 168, h: 150, l: 172 }, // small indecisive day, gapped down
        { x: 310, o: 165, c: 75, h: 70, l: 170 }, // big up day, closing back into candle 1
      ]
    : [
        { x: 70, o: 150, c: 60, h: 55, l: 155 }, // big up day
        { x: 190, o: 50, c: 40, h: 35, l: 55 }, // small indecisive day, gapped up
        { x: 310, o: 45, c: 140, h: 40, l: 145 }, // big down day, closing back into candle 1
      ];

  const midpoint = bullish ? (candles[0].o + candles[0].c) / 2 : (candles[0].c + candles[0].o) / 2;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">
          {bullish ? 'Morning star' : 'Evening star'}
        </span>
        <ReplayButton onReplay={() => setPlay((n) => n + 1)} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Anatomy of a ${pattern}`}>
        <AnimatePresence mode="wait">
          <g key={play}>
            <line x1={20} y1={midpoint} x2={W - 20} y2={midpoint} stroke="var(--color-line)" strokeDasharray="3 4" />
            <text x={W - 20} y={midpoint - 6} textAnchor="end" fill="var(--color-ink-faint)" fontSize={9.5}>
              midpoint of candle 1&apos;s body
            </text>

            {candles.map((c, i) => {
              const up = c.c < c.o; // smaller y = higher price = close above open
              const bodyTop = Math.min(c.o, c.c);
              const bodyBottom = Math.max(c.o, c.c);
              return (
                <motion.g
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.7, duration: 0.4 }}
                >
                  <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={up ? 'var(--color-up)' : 'var(--color-down)'} strokeWidth={1.5} />
                  <rect
                    x={c.x - 16} y={bodyTop} width={32} height={Math.max(2, bodyBottom - bodyTop)}
                    fill={up ? 'var(--color-up)' : 'var(--color-down)'} opacity={0.85} rx={2}
                  />
                  <text x={c.x} y={H - 14} textAnchor="middle" fill="var(--color-ink-faint)" fontSize={10}>
                    candle {i + 1}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </AnimatePresence>
      </svg>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        {bullish
          ? 'A large down day, a small day that barely moves, then a large up day closing back above the midpoint of the first candle’s body. Unlike the chart-shape patterns above, this one is a few-bar rule — testable on real bars, which the scanner below does.'
          : 'A large up day, a small day that barely moves, then a large down day closing back below the midpoint of the first candle’s body. Unlike the chart-shape patterns above, this one is a few-bar rule — testable on real bars, which the scanner below does.'}
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
