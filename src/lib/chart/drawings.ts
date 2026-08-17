/**
 * Chart drawings — the data model and the geometry, with no React and no DOM.
 *
 * WHY THE ANCHORS ARE DATA-SPACE AND NEVER PIXELS
 *
 * A drawing stored in pixels is a drawing that lies the moment anything moves.
 * Pan the chart, zoom it, toggle an indicator pane, reveal the next bar in a
 * replay — every one of those changes the pixel a price sits at, and a
 * trendline pinned to pixels would slide off the highs it was drawn through.
 * So every anchor here is a point in DATA space: a bar position and a price.
 * Converting to screen coordinates is the renderer's job, done fresh on every
 * paint.
 *
 * That choice also makes drawings survivable. A line drawn on bar 40 of a
 * replay still passes through the same two highs at bar 90, which is the whole
 * point of asking a learner to commit to a level before the future arrives.
 *
 * WHAT COUNTS AS A DRAWING HERE
 *
 * Only marks the learner made. Indicators are computed from the bars and live
 * in `analysis/indicators.ts`; these are opinions a person put on the chart.
 * Keeping them apart matters for the thing this site keeps insisting on: an
 * indicator cannot see the future because it is arithmetic on past bars, and a
 * trendline cannot see the future because the learner drew it before the bars
 * arrived. Different guarantees, different modules.
 */

/**
 * A point in data space.
 *
 * `logical` is the chart's own continuous bar coordinate: 0 is the first bar,
 * 1 the second, and 12.4 is four-tenths of the way between bar 12 and bar 13.
 * It is deliberately NOT a timestamp.
 *
 * A timestamp can only name a bar that exists. Ask the chart where 10:47 on a
 * daily series is and it correctly answers "nowhere", so every click between
 * two candles — or past the newest one, which is exactly where people draw —
 * had to be rounded onto a bar. That made every tool snap to candles whether
 * you wanted it to or not.
 *
 * Logical coordinates are continuous and extend past both ends of the data, so
 * a line can start halfway between two bars and end in empty space to the
 * right of the last one, which is what drawing on a chart means. Appending new
 * bars during a replay does not shift the ones already there, so a drawing
 * stays exactly where it was put.
 */
export interface Anchor {
  logical: number;
  price: number;
}

export type DrawingKind =
  // ── lines ────────────────────────────────────────────────────────────────
  | 'trendline'
  | 'ray'
  | 'extended'
  | 'horizontal'
  | 'horizontal-ray'
  | 'vertical'
  | 'arrow'
  // ── channels ─────────────────────────────────────────────────────────────
  | 'channel'
  // ── shapes ───────────────────────────────────────────────────────────────
  | 'rectangle'
  | 'ellipse'
  // ── measured tools ───────────────────────────────────────────────────────
  | 'fib-retracement'
  | 'fib-extension'
  | 'measure'
  | 'long-position'
  | 'short-position'
  // ── annotation ───────────────────────────────────────────────────────────
  | 'text';

export interface Drawing {
  id: string;
  kind: DrawingKind;
  /**
   * Two anchors for most tools; three for a channel and a fib extension, where
   * the third sets the width or the projection base. Stored as a list rather
   * than named fields so the hit-testing and dragging code can treat every
   * tool the same way.
   */
  anchors: Anchor[];
  colour: string;
  /** Free text, used by the `text` tool and as an optional label elsewhere. */
  label?: string;
  locked?: boolean;
}

/** How many anchors a tool needs before it is a finished drawing. */
export const ANCHORS_NEEDED: Record<DrawingKind, number> = {
  trendline: 2,
  ray: 2,
  extended: 2,
  horizontal: 1,
  'horizontal-ray': 1,
  vertical: 1,
  arrow: 2,
  channel: 3,
  rectangle: 2,
  ellipse: 2,
  'fib-retracement': 2,
  'fib-extension': 3,
  measure: 2,
  'long-position': 3,
  'short-position': 3,
  text: 1,
};

export interface ToolSpec {
  kind: DrawingKind;
  label: string;
  group: 'Lines' | 'Channels' | 'Shapes' | 'Measure' | 'Notes';
  /** One line of plain English, shown on hover. No jargon, same rule as the glossary. */
  hint: string;
}

export const TOOLS: ToolSpec[] = [
  { kind: 'trendline', label: 'Trend line', group: 'Lines', hint: 'A straight line between two points you pick.' },
  { kind: 'ray', label: 'Ray', group: 'Lines', hint: 'A line that keeps going forward past the second point.' },
  { kind: 'extended', label: 'Extended', group: 'Lines', hint: 'A line that runs off both edges of the chart.' },
  { kind: 'horizontal', label: 'Horizontal', group: 'Lines', hint: 'A flat line at one price, all the way across.' },
  {
    kind: 'horizontal-ray',
    label: 'H-ray',
    group: 'Lines',
    hint: 'A flat line at one price, forward from where you clicked.',
  },
  { kind: 'vertical', label: 'Vertical', group: 'Lines', hint: 'A line marking one date.' },
  { kind: 'arrow', label: 'Arrow', group: 'Lines', hint: 'A line with a head, for pointing at something.' },
  {
    kind: 'channel',
    label: 'Channel',
    group: 'Channels',
    hint: 'Two parallel lines. Draw the first, then set how wide.',
  },
  { kind: 'rectangle', label: 'Rectangle', group: 'Shapes', hint: 'A box, for marking a zone of prices and dates.' },
  { kind: 'ellipse', label: 'Ellipse', group: 'Shapes', hint: 'An oval, for circling an area loosely.' },
  {
    kind: 'fib-retracement',
    label: 'Fib retracement',
    group: 'Measure',
    hint: 'Splits a move into the usual fractions. Drag from the start of the move to the end.',
  },
  {
    kind: 'fib-extension',
    label: 'Fib extension',
    group: 'Measure',
    hint: 'Projects a move forward from a pullback. Three clicks: start, end, pullback.',
  },
  {
    kind: 'measure',
    label: 'Measure',
    group: 'Measure',
    hint: 'How far, in rupees, in percent, and in bars.',
  },
  {
    kind: 'long-position',
    label: 'Long position',
    group: 'Measure',
    hint: 'Entry, stop and target as one picture, with the reward-to-risk worked out.',
  },
  {
    kind: 'short-position',
    label: 'Short position',
    group: 'Measure',
    hint: 'The same picture for a trade that profits when the price falls.',
  },
  { kind: 'text', label: 'Text', group: 'Notes', hint: 'A note on the chart, in your own words.' },
];

/**
 * The retracement fractions everybody draws.
 *
 * 0.5 is in this list and is NOT a Fibonacci number — it is the halfway point,
 * included because every charting package includes it and a learner who does
 * not see it here will assume ours is broken. `t2-fibonacci.ts` makes exactly
 * this point in words; the renderer marks it so the chart says the same thing
 * the lesson does.
 */
export const FIB_LEVELS = [
  // Beyond the end of the move — where price would go if it carried on rather
  // than turning back. Drawn on a low-to-high swing these sit ABOVE the high.
  -0.618, -0.272,
  // The move itself.
  0, 0.236, 0.382, 0.5, 0.618, 0.786, 1,
  // Beyond the start of the move — a deeper retracement than a full one, which
  // is to say the move being given back and then some. BELOW the low.
  1.272, 1.618, 2.618,
] as const;

export const FIB_EXTENSION_LEVELS = [0, 0.382, 0.618, 1, 1.272, 1.618, 2.618] as const;

/**
 * Levels inside the drawn move, as opposed to projected past either end.
 *
 * The renderer draws the two groups differently, because they are answering
 * different questions: one is "how much of this move has been given back",
 * the other is "where might it go if it does not stop here". Showing them
 * identically is how people end up treating a projection as a level that
 * already exists.
 */
export const isWithinMove = (level: number) => level >= 0 && level <= 1;

/**
 * Levels that are not actually from the Fibonacci sequence, flagged in the UI.
 *
 * 0.5 is the halfway point. 0.272 and 1.272 are square roots of 0.618 and
 * 1.618 respectively — related to the sequence by arithmetic somebody did
 * later, not members of it. Every charting package draws all three without
 * comment; `t2-fibonacci.ts` makes the point in words, so the chart says the
 * same thing rather than quietly contradicting the lesson.
 */
export const NOT_FIBONACCI = new Set<number>([0.5, -0.272, 1.272]);

// ── geometry, in screen space ────────────────────────────────────────────────
//
// Everything below takes points already converted to pixels. The conversion
// itself belongs to whoever owns the chart, because only it knows the current
// zoom.

export interface Point {
  x: number;
  y: number;
}

/** Perpendicular distance from `p` to the segment `a`–`b`, in pixels. */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Distance from `p` to the outline of the rectangle spanned by `a` and `b`. */
export function distanceToRectEdge(p: Point, a: Point, b: Point): number {
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);
  const corners: Point[] = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
  return Math.min(
    distanceToSegment(p, corners[0], corners[1]),
    distanceToSegment(p, corners[1], corners[2]),
    distanceToSegment(p, corners[2], corners[3]),
    distanceToSegment(p, corners[3], corners[0]),
  );
}

/**
 * Where the infinite line through `a` and `b` crosses the viewport, as the two
 * points to draw between. Used for extended lines and for the far end of a ray.
 *
 * A vertical line has no gradient, so it is handled separately rather than
 * dividing by zero and drawing nothing.
 */
export function extendAcross(a: Point, b: Point, width: number, height: number): [Point, Point] {
  if (Math.abs(b.x - a.x) < 1e-9) {
    return [
      { x: a.x, y: 0 },
      { x: a.x, y: height },
    ];
  }
  const slope = (b.y - a.y) / (b.x - a.x);
  const at = (x: number) => ({ x, y: a.y + slope * (x - a.x) });
  void height;
  return [at(0), at(width)];
}

/** The forward half of an extended line — from `a`, through `b`, to the edge. */
export function rayTo(a: Point, b: Point, width: number, height: number): Point {
  if (Math.abs(b.x - a.x) < 1e-9) return { x: a.x, y: b.y >= a.y ? height : 0 };
  const slope = (b.y - a.y) / (b.x - a.x);
  const edgeX = b.x >= a.x ? width : 0;
  return { x: edgeX, y: a.y + slope * (edgeX - a.x) };
}

// ── the risk picture ─────────────────────────────────────────────────────────

export interface PositionMaths {
  entry: number;
  stop: number;
  target: number;
  riskPerUnit: number;
  rewardPerUnit: number;
  /** Reward divided by risk. `null` when the stop sits at the entry. */
  rr: number | null;
  riskPercent: number;
  rewardPercent: number;
}

/**
 * The numbers behind a long/short position tool.
 *
 * Deliberately per-unit and unsized. Sizing needs an account balance and a risk
 * budget, which the position-sizing engine already owns and does properly — a
 * drawing tool inventing its own quantity would be a second, worse answer to a
 * question the site has already answered carefully.
 */
export function positionMaths(anchors: Anchor[], direction: 'long' | 'short'): PositionMaths | null {
  const [entryAnchor, stopAnchor, targetAnchor] = anchors;
  if (!entryAnchor || !stopAnchor || !targetAnchor) return null;

  const entry = entryAnchor.price;
  const stop = stopAnchor.price;
  const target = targetAnchor.price;

  const riskPerUnit = direction === 'long' ? entry - stop : stop - entry;
  const rewardPerUnit = direction === 'long' ? target - entry : entry - target;

  return {
    entry,
    stop,
    target,
    riskPerUnit,
    rewardPerUnit,
    rr: Math.abs(riskPerUnit) < 1e-9 ? null : rewardPerUnit / riskPerUnit,
    riskPercent: entry === 0 ? 0 : (riskPerUnit / entry) * 100,
    rewardPercent: entry === 0 ? 0 : (rewardPerUnit / entry) * 100,
  };
}

/** What the measure tool reports between two anchors. */
export function measureBetween(a: Anchor, b: Anchor) {
  const change = b.price - a.price;
  return {
    change,
    percent: a.price === 0 ? 0 : (change / a.price) * 100,
    // Bars are now just the distance along the chart's own axis, which is what
    // the reader is counting on screen anyway.
    bars: Math.round(Math.abs(b.logical - a.logical)),
    forward: b.logical >= a.logical,
  };
}

/**
 * Snap a loose price to the nearest OHLC value on the nearest bar — the
 * "magnet" every charting package has.
 *
 * It exists because a trendline that misses the high by two pixels is a
 * trendline about nothing, and because arguing with your own mouse is not the
 * skill this site is trying to teach.
 */
export function magnetTo(
  candles: readonly { open: number; high: number; low: number; close: number }[],
  anchor: Anchor,
  pricePerPixel: number,
  thresholdPixels = 12,
): Anchor {
  const index = Math.round(anchor.logical);
  const bar = candles[index];
  if (!bar) return anchor;

  const tolerance = Math.abs(pricePerPixel) * thresholdPixels;
  let best: number | null = null;
  for (const candidate of [bar.high, bar.low, bar.open, bar.close]) {
    const gap = Math.abs(candidate - anchor.price);
    if (gap <= tolerance && (best == null || gap < Math.abs(best - anchor.price))) best = candidate;
  }

  // Only the PRICE is pulled, and only when the pointer was already close.
  // The horizontal position is left exactly where it was put — snapping that
  // too is what made the tools feel like they were fighting the mouse.
  return best == null ? anchor : { logical: anchor.logical, price: best };
}

// ── persistence ──────────────────────────────────────────────────────────────

/**
 * Drawings are per chart-session, not per user account.
 *
 * A replay is a fresh stretch of anonymous history every time, so carrying
 * yesterday's trendlines onto today's unrelated chart would be worse than
 * useless. Keyed storage means a page refresh mid-session keeps your work and
 * a new session starts clean.
 */
export function storageKey(scope: string): string {
  return `ma:drawings:${scope}`;
}

export function serialise(drawings: Drawing[]): string {
  return JSON.stringify(drawings);
}

/** Tolerant by design: bad or stale stored data loses drawings, never the chart. */
export function deserialise(raw: string | null): Drawing[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((d): d is Drawing => {
      if (typeof d !== 'object' || d == null) return false;
      const c = d as Partial<Drawing>;
      return (
        typeof c.id === 'string' &&
        typeof c.kind === 'string' &&
        c.kind in ANCHORS_NEEDED &&
        Array.isArray(c.anchors) &&
        c.anchors.every((a) => typeof a?.logical === 'number' && typeof a?.price === 'number')
      );
    });
  } catch {
    return [];
  }
}
