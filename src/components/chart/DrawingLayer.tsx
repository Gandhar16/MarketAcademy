'use client';

/**
 * The drawing surface that sits over the price pane.
 *
 * SVG rather than canvas. There are rarely more than a few dozen drawings on a
 * chart, so the redraw cost is irrelevant, and in exchange every mark is a real
 * element that can carry a title, take focus and be inspected in devtools.
 *
 * The layer is always hit-testable, and still does not break panning: an SVG
 * paints no background, so a press on empty space falls through to the chart
 * underneath. Only drawn geometry is a target. See the note above the root
 * element for why the obvious alternative — `pointer-events: none` on the root
 * — makes every drawing permanently unselectable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChartCoords } from './CandleChart';
import {
  ANCHORS_NEEDED,
  FIB_EXTENSION_LEVELS,
  FIB_LEVELS,
  NOT_FIBONACCI,
  isWithinMove,
  distanceToRectEdge,
  distanceToSegment,
  extendAcross,
  magnetTo,
  measureBetween,
  positionMaths,
  rayTo,
  type Anchor,
  type Drawing,
  type DrawingKind,
  type Point,
} from '@/lib/chart/drawings';
import type { Candle } from '@/lib/market/types';
import { useTouchMetrics, type TouchMetrics } from './useCoarsePointer';

export interface DrawingLayerProps {
  coords: ChartCoords;
  candles: Candle[];
  drawings: Drawing[];
  onChange: (next: Drawing[]) => void;
  /** The armed tool, or null when the pointer is just a pointer. */
  tool: DrawingKind | null;
  onToolDone: () => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  magnet: boolean;
  colour: string;
}

export function DrawingLayer({
  coords,
  candles,
  drawings,
  onChange,
  tool,
  onToolDone,
  selectedId,
  onSelect,
  magnet,
  colour,
}: DrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  /** Grab radii and drag threshold, widened when the pointer is a fingertip. */
  const metrics = useTouchMetrics();
  /** Anchors committed so far for the drawing currently being placed. */
  const [pending, setPending] = useState<Anchor[]>([]);
  /** Where the pointer is, in data space — the not-yet-clicked next anchor. */
  const [hover, setHover] = useState<Anchor | null>(null);
  const [drag, setDrag] = useState<{ id: string; anchorIndex: number | null; from: Anchor } | null>(null);
  /** True between press and release while a drag-drawn tool is being placed. */
  const [drawingNow, setDrawingNow] = useState(false);

  /**
   * Half-placed anchors belong to the tool that was armed when they were made,
   * and must not survive a change of tool.
   *
   * Without this, arming Channel, placing its first anchor, then switching to
   * Trend line left that orphan anchor in `pending` — so the next press on the
   * chart completed a trend line from a point the person picked for something
   * else, somewhere they were no longer looking. The same stale state is what
   * an on-screen Cancel would otherwise leave behind, since Escape is the only
   * thing that used to clear it and a phone has no Escape key.
   *
   * Adjusted during render rather than in an effect — React's own pattern for
   * state that has to follow a prop, and the one already used in `useDrawings`.
   */
  const [armedTool, setArmedTool] = useState(tool);
  if (armedTool !== tool) {
    setArmedTool(tool);
    setPending([]);
    setDrawingNow(false);
    setHover(null);
  }

  const toScreen = useCallback(
    (a: Anchor): Point | null => {
      const x = coords.logicalToX(a.logical);
      const y = coords.priceToY(a.price);
      return x == null || y == null ? null : { x, y };
    },
    [coords],
  );

  /**
   * Pointer position → data space. Never rounds, never refuses.
   *
   * This is the whole fix for "I cannot draw where I want". The horizontal
   * axis is the chart's logical coordinate, which is continuous and defined
   * past both ends of the data, so any pixel on the pane maps to a real
   * anchor — between two candles, or in the empty space to the right of the
   * newest one.
   */
  const toData = useCallback(
    (evt: { clientX: number; clientY: number }): Anchor | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;

      const logical = coords.xToLogical(x);
      const price = coords.yToPrice(y);
      if (logical == null || price == null) return null;

      const anchor = { logical, price };
      if (!magnet) return anchor;

      // Price-per-pixel, so the magnet's tolerance is expressed in price terms.
      const p1 = coords.yToPrice(y);
      const p2 = coords.yToPrice(y + 1);
      const pricePerPixel = p1 == null || p2 == null ? 0 : p1 - p2;
      return magnetTo(candles, anchor, pricePerPixel);
    },
    [coords, candles, magnet],
  );

  // ── placing a new drawing ─────────────────────────────────────────────────
  //
  // Press, drag, release — the way every charting package does it, and the way
  // a hand expects to draw a line. Multi-anchor tools (channel, fib extension,
  // the position tools) take the remaining anchors as follow-up clicks, since
  // there is no way to express three points in one gesture.

  const commit = useCallback(
    (anchors: Anchor[], kind: DrawingKind) => {
      onChange([
        ...drawings,
        {
          id: `d${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
          kind,
          anchors,
          colour,
        },
      ]);
      setPending([]);
      onToolDone();
    },
    [drawings, onChange, colour, onToolDone],
  );

  const startDrawing = useCallback(
    (evt: React.PointerEvent) => {
      if (!tool) return;
      const at = toData(evt);
      if (!at) return;

      const needed = ANCHORS_NEEDED[tool];

      // One-anchor tools are done the moment they are placed.
      if (needed === 1) {
        commit([at], tool);
        return;
      }

      // Already mid-placement on a multi-anchor tool: this click is the next
      // anchor rather than the start of a fresh drag.
      if (pending.length > 0) {
        const next = [...pending, at];
        if (next.length >= needed) commit(next, tool);
        else setPending(next);
        return;
      }

      setPending([at]);
      setDrawingNow(true);
      svgRef.current?.setPointerCapture(evt.pointerId);
    },
    [tool, toData, pending, commit],
  );

  const finishDrawing = useCallback(
    (evt: React.PointerEvent) => {
      if (!tool || !drawingNow) return;
      setDrawingNow(false);
      const at = toData(evt);
      if (!at || pending.length === 0) return;

      const needed = ANCHORS_NEEDED[tool];
      const first = pending[0];
      const rect = svgRef.current?.getBoundingClientRect();
      const moved =
        rect != null &&
        Math.hypot(
          (coords.logicalToX(at.logical) ?? 0) - (coords.logicalToX(first.logical) ?? 0),
          (coords.priceToY(at.price) ?? 0) - (coords.priceToY(first.price) ?? 0),
        ) > metrics.slop;

      // A press that never moved is someone selecting the tool and tapping —
      // treat it as the first of two clicks rather than a zero-length line.
      // The threshold is wider on touch: a finger rolls several pixels on even
      // a deliberate tap, and at the mouse threshold every tap became a tiny
      // unwanted trendline.
      if (!moved) return;

      const next = [...pending, at];
      if (next.length >= needed) commit(next, tool);
      else setPending(next);
    },
    [tool, drawingNow, toData, pending, coords, commit, metrics.slop],
  );

  // ── selecting and dragging ────────────────────────────────────────────────

  /**
   * A press that landed on a drawing: select it, and start moving whichever
   * part was grabbed. Handles win over bodies so an endpoint reshapes rather
   * than dragging the whole thing.
   */
  const selectAndDrag = useCallback(
    (id: string, evt: React.PointerEvent) => {
      if (tool) return;
      evt.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const p = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };

      onSelect(id);
      const target = drawings.find((d) => d.id === id);
      if (!target || target.locked) return;

      let anchorIndex: number | null = null;
      for (let i = 0; i < target.anchors.length; i++) {
        const sp = toScreen(target.anchors[i]);
        if (sp && Math.hypot(sp.x - p.x, sp.y - p.y) <= metrics.hit) {
          anchorIndex = i;
          break;
        }
      }

      const at = toData(evt);
      if (!at) return;
      setDrag({ id, anchorIndex, from: at });
      svg.setPointerCapture(evt.pointerId);
    },
    [tool, drawings, toScreen, toData, onSelect, metrics.hit],
  );

  const handlePointerDown = useCallback(
    (evt: React.PointerEvent) => {
      if (tool) {
        startDrawing(evt);
        return;
      }
      onSelect(null);
    },
    [tool, startDrawing, onSelect],
  );

  const handlePointerMove = useCallback(
    (evt: React.PointerEvent) => {
      const at = toData(evt);
      if (tool) {
        setHover(at);
        return;
      }
      if (!drag || !at) return;

      onChange(
        drawings.map((d) => {
          if (d.id !== drag.id) return d;
          if (drag.anchorIndex != null) {
            const anchors = [...d.anchors];
            anchors[drag.anchorIndex] = at;
            return { ...d, anchors };
          }
          // Moving the whole drawing: shift every anchor by the same delta.
          const dl = at.logical - drag.from.logical;
          const dp = at.price - drag.from.price;
          return { ...d, anchors: d.anchors.map((a) => ({ logical: a.logical + dl, price: a.price + dp })) };
        }),
      );
      if (drag.anchorIndex == null) setDrag({ ...drag, from: at });
    },
    [toData, tool, drag, drawings, onChange],
  );

  const endDrag = useCallback(() => setDrag(null), []);

  /**
   * Selection comes from the chart's own click stream, not from this layer.
   *
   * The layer has to stay transparent so panning still works, and a
   * transparent element never receives a click — so the chart, which does
   * receive them, reports the point and the hit-testing happens here.
   */
  useEffect(() => {
    if (tool) return;
    return coords.subscribeClick((p) => {
      let found: string | null = null;
      // Handles first, so a click near an endpoint selects its drawing rather
      // than whatever else passes nearby.
      outer: for (const pass of ['handles', 'bodies'] as const) {
        for (const d of drawings) {
          if (pass === 'handles') {
            for (const a of d.anchors) {
              const sp = toScreen(a);
              if (sp && Math.hypot(sp.x - p.x, sp.y - p.y) <= metrics.hit) {
                found = d.id;
                break outer;
              }
            }
          } else if (distanceToDrawing(d, p, toScreen, coords) <= metrics.hit) {
            found = d.id;
            break outer;
          }
        }
      }
      onSelect(found);
    });
  }, [coords, drawings, tool, toScreen, onSelect, metrics.hit]);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPending([]);
        setDrawingNow(false);
        onToolDone();
        onSelect(null);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Not while typing a note somewhere else on the page.
        const el = document.activeElement;
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        onChange(drawings.filter((d) => d.id !== selectedId));
        onSelect(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, drawings, onChange, onSelect, onToolDone]);

  // The in-progress drawing, shown as it is being placed.
  const preview: Drawing | null =
    tool && pending.length > 0 && hover
      ? { id: '__preview', kind: tool, anchors: [...pending, hover], colour }
      : null;

  /**
   * When this layer takes the pointer instead of the chart.
   *
   * Two dead ends are worth recording, because both look obviously right.
   * Setting `pointer-events: none` on the root and letting each drawing opt
   * back in does not work: the browser skips hit-testing the entire subtree,
   * so no drawing is ever clickable. Leaving the root hit-testable at all
   * times does not work either: an `<svg>` in HTML has a real box and swallows
   * every press, so the chart stops panning.
   *
   * So the layer is transparent by default, selection arrives from the chart's
   * click stream (above), and the layer only takes over once there is
   * something to do — a tool armed, a drawing selected to grab, or a drag
   * already running.
   */
  const interactive = tool != null || drag != null || selectedId != null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      // Sized in the style rather than with `h-full`, which resolved to the
      // SVG's own 150px default height and left most of the price pane
      // undrawable.
      width="100%"
      height="100%"
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: interactive ? 'auto' : 'none',
        cursor: tool ? 'crosshair' : 'default',
        /**
         * Without this, drawing on a phone is impossible rather than merely
         * awkward. A touch that starts on an element the browser believes it
         * may scroll is claimed by the scroller as soon as it travels a few
         * pixels: the pointermove stream stops dead, the browser fires
         * pointercancel, and the page slides under the finger. Every attempt
         * at a trendline scrolled the page and left nothing behind.
         *
         * Only while this layer is interactive. When it is transparent the
         * chart underneath owns the gesture, and it wants ordinary touch
         * panning and pinch-zoom.
         */
        touchAction: interactive ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => {
        finishDrawing(e);
        endDrag();
      }}
      onPointerCancel={endDrag}
    >
      {/*
        A transparent catcher so clicks land anywhere on the pane while a tool
        is armed. Without it only the drawn strokes would be clickable, and the
        first click of a new line would fall through to the chart.
      */}
      {tool && <rect x={0} y={0} width="100%" height="100%" fill="transparent" style={{ pointerEvents: 'all' }} />}

      {drawings.map((d) => (
        <g
          key={d.id}
          // Armed with a tool, drawings must not intercept the click that is
          // meant to start a new one.
          style={{ pointerEvents: tool ? 'none' : 'auto', cursor: 'pointer' }}
          onPointerDown={(e) => selectAndDrag(d.id, e)}
        >
          {/* A fat, invisible copy of the same geometry, purely to be grabbed.
              A 1.5px line is nearly impossible to hit with a mouse, so every
              charting package widens the target this way. `pointerEvents:
              stroke` catches the outline regardless of paint, and leaves the
              interior of a box or an oval transparent to the chart. */}
          <g style={{ pointerEvents: 'stroke' }} aria-hidden>
            <DrawingShape drawing={d} selected={false} toScreen={toScreen} coords={coords} metrics={metrics} hitArea />
          </g>
          <DrawingShape
            drawing={d}
            selected={d.id === selectedId}
            toScreen={toScreen}
            coords={coords}
            metrics={metrics}
          />
        </g>
      ))}

      {preview && (
        <g opacity={0.7}>
          <DrawingShape drawing={preview} selected={false} toScreen={toScreen} coords={coords} metrics={metrics} />
        </g>
      )}
    </svg>
  );
}

function distanceToDrawing(d: Drawing, p: Point, toScreen: (a: Anchor) => Point | null, coords: ChartCoords): number {
  const pts = d.anchors.map(toScreen);
  if (pts.some((x) => x == null)) return Number.POSITIVE_INFINITY;
  const s = pts as Point[];

  switch (d.kind) {
    case 'horizontal':
    case 'horizontal-ray':
      return Math.abs(p.y - s[0].y);
    case 'vertical':
      return Math.abs(p.x - s[0].x);
    case 'text':
      return Math.hypot(p.x - s[0].x, p.y - s[0].y);
    case 'rectangle':
    case 'fib-retracement':
    case 'long-position':
    case 'short-position':
      return distanceToRectEdge(p, s[0], s[s.length - 1]);
    case 'ellipse': {
      const cx = (s[0].x + s[1].x) / 2;
      const cy = (s[0].y + s[1].y) / 2;
      const rx = Math.abs(s[1].x - s[0].x) / 2 || 1;
      const ry = Math.abs(s[1].y - s[0].y) / 2 || 1;
      return Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1) * Math.min(rx, ry);
    }
    case 'extended': {
      const [a, b] = extendAcross(s[0], s[1], coords.width, coords.height);
      return distanceToSegment(p, a, b);
    }
    case 'ray':
      return distanceToSegment(p, s[0], rayTo(s[0], s[1], coords.width, coords.height));
    case 'channel': {
      const offset = s[2] ? s[2].y - lineYAt(s[0], s[1], s[2].x) : 0;
      return Math.min(
        distanceToSegment(p, s[0], s[1]),
        distanceToSegment(p, { x: s[0].x, y: s[0].y + offset }, { x: s[1].x, y: s[1].y + offset }),
      );
    }
    default:
      return distanceToSegment(p, s[0], s[s.length - 1]);
  }
}

function lineYAt(a: Point, b: Point, x: number): number {
  if (Math.abs(b.x - a.x) < 1e-9) return a.y;
  return a.y + ((b.y - a.y) / (b.x - a.x)) * (x - a.x);
}

// ── rendering per kind ───────────────────────────────────────────────────────

function DrawingShape({
  drawing,
  selected,
  toScreen,
  coords,
  metrics,
  hitArea = false,
}: {
  drawing: Drawing;
  selected: boolean;
  toScreen: (a: Anchor) => Point | null;
  coords: ChartCoords;
  metrics: TouchMetrics;
  /** Render the same geometry wide and invisible, as a pointer target. */
  hitArea?: boolean;
}) {
  const pts = drawing.anchors.map(toScreen);
  if (pts.some((p) => p == null)) return null;
  const s = pts as Point[];
  const stroke = hitArea ? 'transparent' : drawing.colour;
  const width = hitArea ? metrics.stroke : selected ? 2.5 : 1.5;
  /**
   * A phone-width chart cannot carry the full Fibonacci captions. Spelling out
   * "· projected, not yet traded · not a Fibonacci number" on every level runs
   * the text off the right-hand edge and stacks the rows into an unreadable
   * smear. On a narrow chart the caveats become the dash pattern and opacity
   * they already have, plus a short marker, and the prose stays in the lesson
   * where there is room to make the argument properly.
   */
  const terse = coords.width < 560;

  // Labels and badges are decoration on the grab layer, and would double-paint.
  if (hitArea && (drawing.kind === 'text' || drawing.kind === 'fib-retracement' || drawing.kind === 'fib-extension')) {
    return null;
  }

  const handles = selected ? (
    <g>
      {s.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={metrics.handle}
          fill="var(--color-surface)"
          stroke={stroke}
          strokeWidth={1.5}
        />
      ))}
    </g>
  ) : null;

  const body = (() => {
    switch (drawing.kind) {
      case 'trendline':
        return <line x1={s[0].x} y1={s[0].y} x2={s[1].x} y2={s[1].y} stroke={stroke} strokeWidth={width} />;

      case 'arrow': {
        const angle = Math.atan2(s[1].y - s[0].y, s[1].x - s[0].x);
        const head = 9;
        return (
          <g>
            <line x1={s[0].x} y1={s[0].y} x2={s[1].x} y2={s[1].y} stroke={stroke} strokeWidth={width} />
            <polygon
              points={[
                `${s[1].x},${s[1].y}`,
                `${s[1].x - head * Math.cos(angle - 0.4)},${s[1].y - head * Math.sin(angle - 0.4)}`,
                `${s[1].x - head * Math.cos(angle + 0.4)},${s[1].y - head * Math.sin(angle + 0.4)}`,
              ].join(' ')}
              fill={stroke}
            />
          </g>
        );
      }

      case 'ray': {
        const end = rayTo(s[0], s[1], coords.width, coords.height);
        return <line x1={s[0].x} y1={s[0].y} x2={end.x} y2={end.y} stroke={stroke} strokeWidth={width} />;
      }

      case 'extended': {
        const [a, b] = extendAcross(s[0], s[1], coords.width, coords.height);
        return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={width} />;
      }

      case 'horizontal':
        return (
          <g>
            <line x1={0} y1={s[0].y} x2={coords.width} y2={s[0].y} stroke={stroke} strokeWidth={width} />
            {!hitArea && <PriceTag x={coords.width - 4} y={s[0].y} price={drawing.anchors[0].price} colour={stroke} />}
          </g>
        );

      case 'horizontal-ray':
        return (
          <g>
            <line x1={s[0].x} y1={s[0].y} x2={coords.width} y2={s[0].y} stroke={stroke} strokeWidth={width} />
            {!hitArea && <PriceTag x={coords.width - 4} y={s[0].y} price={drawing.anchors[0].price} colour={stroke} />}
          </g>
        );

      case 'vertical':
        return <line x1={s[0].x} y1={0} x2={s[0].x} y2={coords.height} stroke={stroke} strokeWidth={width} />;

      case 'rectangle': {
        const x = Math.min(s[0].x, s[1].x);
        const y = Math.min(s[0].y, s[1].y);
        return (
          <rect
            x={x}
            y={y}
            width={Math.abs(s[1].x - s[0].x)}
            height={Math.abs(s[1].y - s[0].y)}
            fill={stroke}
            fillOpacity={0.08}
            stroke={stroke}
            strokeWidth={width}
          />
        );
      }

      case 'ellipse':
        return (
          <ellipse
            cx={(s[0].x + s[1].x) / 2}
            cy={(s[0].y + s[1].y) / 2}
            rx={Math.abs(s[1].x - s[0].x) / 2}
            ry={Math.abs(s[1].y - s[0].y) / 2}
            fill={stroke}
            fillOpacity={0.06}
            stroke={stroke}
            strokeWidth={width}
          />
        );

      case 'channel': {
        const offset = s[2] ? s[2].y - lineYAt(s[0], s[1], s[2].x) : 0;
        return (
          <g>
            <polygon
              points={[
                `${s[0].x},${s[0].y}`,
                `${s[1].x},${s[1].y}`,
                `${s[1].x},${s[1].y + offset}`,
                `${s[0].x},${s[0].y + offset}`,
              ].join(' ')}
              fill={stroke}
              fillOpacity={0.07}
            />
            <line x1={s[0].x} y1={s[0].y} x2={s[1].x} y2={s[1].y} stroke={stroke} strokeWidth={width} />
            <line
              x1={s[0].x}
              y1={s[0].y + offset}
              x2={s[1].x}
              y2={s[1].y + offset}
              stroke={stroke}
              strokeWidth={width}
            />
          </g>
        );
      }

      case 'fib-retracement':
        return <FibLevels a={drawing.anchors[0]} b={drawing.anchors[1]} coords={coords} colour={stroke} terse={terse} />;

      case 'fib-extension':
        return (
          <FibLevels
            a={drawing.anchors[2] ?? drawing.anchors[0]}
            b={{
              logical: drawing.anchors[2]?.logical ?? drawing.anchors[1].logical,
              price:
                (drawing.anchors[2]?.price ?? drawing.anchors[0].price) +
                (drawing.anchors[1].price - drawing.anchors[0].price),
            }}
            coords={coords}
            colour={stroke}
            terse={terse}
            levels={FIB_EXTENSION_LEVELS}
          />
        );

      case 'measure': {
        const m = measureBetween(drawing.anchors[0], drawing.anchors[1]);
        const up = m.change >= 0;
        return (
          <g>
            <rect
              x={Math.min(s[0].x, s[1].x)}
              y={Math.min(s[0].y, s[1].y)}
              width={Math.abs(s[1].x - s[0].x)}
              height={Math.abs(s[1].y - s[0].y)}
              fill={up ? 'var(--color-up)' : 'var(--color-down)'}
              fillOpacity={0.12}
              stroke={up ? 'var(--color-up)' : 'var(--color-down)'}
              strokeWidth={1}
            />
            {!hitArea && (
              <Badge
                x={(s[0].x + s[1].x) / 2}
                y={Math.min(s[0].y, s[1].y) - 8}
                text={`${m.change >= 0 ? '+' : ''}${m.change.toFixed(2)}  ${m.percent >= 0 ? '+' : ''}${m.percent.toFixed(2)}%  ${m.bars} bars`}
              />
            )}
          </g>
        );
      }

      case 'long-position':
      case 'short-position': {
        const maths = positionMaths(drawing.anchors, drawing.kind === 'long-position' ? 'long' : 'short');
        if (!maths) return null;
        const left = Math.min(s[0].x, s[2].x);
        const right = Math.max(s[0].x, s[2].x);
        const entryY = s[0].y;
        const stopY = s[1].y;
        const targetY = s[2].y;
        return (
          <g>
            <rect
              x={left}
              y={Math.min(entryY, stopY)}
              width={Math.max(right - left, 1)}
              height={Math.abs(stopY - entryY)}
              fill="var(--color-down)"
              fillOpacity={0.14}
            />
            <rect
              x={left}
              y={Math.min(entryY, targetY)}
              width={Math.max(right - left, 1)}
              height={Math.abs(targetY - entryY)}
              fill="var(--color-up)"
              fillOpacity={0.14}
            />
            <line x1={left} y1={entryY} x2={right} y2={entryY} stroke={stroke} strokeWidth={1.5} />
            {!hitArea && (
              <Badge
                x={(left + right) / 2}
                y={Math.min(entryY, stopY, targetY) - 8}
                text={
                  maths.rr == null
                    ? 'stop is at the entry — no risk to divide by'
                    : `${maths.rr.toFixed(2)}R  ·  risk ${maths.riskPercent.toFixed(2)}%  ·  reward ${maths.rewardPercent.toFixed(2)}%`
                }
              />
            )}
          </g>
        );
      }

      case 'text':
        return (
          <text x={s[0].x} y={s[0].y} fill={stroke} fontSize={12} className="num">
            {drawing.label || 'note'}
          </text>
        );

      default:
        return null;
    }
  })();

  return (
    <g>
      {body}
      {handles}
    </g>
  );
}

function FibLevels({
  a,
  b,
  coords,
  colour,
  terse,
  levels = FIB_LEVELS,
}: {
  a: Anchor;
  b: Anchor;
  coords: ChartCoords;
  colour: string;
  /** Narrow chart: drop the explanatory tails from each level's caption. */
  terse: boolean;
  levels?: readonly number[];
}) {
  const span = b.price - a.price;
  return (
    <g>
      {levels.map((level) => {
        const price = a.price + span * level;
        const y = coords.priceToY(price);
        if (y == null) return null;
        const notFib = NOT_FIBONACCI.has(level);
        const projected = !isWithinMove(level);
        return (
          <g key={level}>
            <line
              x1={0}
              y1={y}
              x2={coords.width}
              y2={y}
              stroke={colour}
              strokeWidth={1}
              // Projections past either end of the move are drawn fainter and
              // dashed, because they mark somewhere price has not been rather
              // than a level it actually traded at.
              strokeDasharray={notFib ? '2 3' : projected ? '6 4' : undefined}
              opacity={notFib ? 0.5 : projected ? 0.45 : 0.85}
            />
            <text
              x={4}
              y={y - 3}
              fill={colour}
              fontSize={10}
              className="num"
              opacity={projected ? 0.65 : 0.9}
            >
              {(level * 100).toFixed(1)}% · {price.toFixed(2)}
              {projected ? (terse ? ' · projected' : ' · projected, not yet traded') : ''}
              {/* Named on the chart, not just in the lesson: the levels
                  everybody watches are not all Fibonacci numbers. Even the
                  short form keeps saying so — it is the point of the label,
                  not an aside, so it survives the narrow layout. */}
              {notFib ? (terse ? ' · not Fibonacci' : ' · not a Fibonacci number') : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function PriceTag({ x, y, price, colour }: { x: number; y: number; price: number; colour: string }) {
  return (
    <text x={x} y={y - 4} textAnchor="end" fill={colour} fontSize={10} className="num">
      {price.toFixed(2)}
    </text>
  );
}

function Badge({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x - text.length * 3.1} y={y - 12} width={text.length * 6.2} height={16} rx={3} fill="var(--color-surface)" opacity={0.92} />
      <text x={x} y={y} textAnchor="middle" fill="var(--color-ink)" fontSize={10} className="num">
        {text}
      </text>
    </g>
  );
}
