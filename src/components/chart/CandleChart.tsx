'use client';

/**
 * Candle chart with technical indicators.
 *
 * The important property for this app: it renders exactly the candles it is
 * given and computes indicators from exactly those candles. During a replay it
 * receives only the bars revealed so far, so a moving average is drawn from the
 * same information the learner has — not from the full history. Zooming out
 * cannot reveal the future because the future is not in the chart, and an
 * indicator cannot leak it because `indicators.ts` is causal by construction
 * (see the no-lookahead tests there).
 *
 * Overlays draw on the price pane. RSI, MACD, ATR and volume each get their own
 * pane below, as they would in any charting package.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createChart,
  createSeriesMarkers,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type LineData,
  type Logical,
  type MouseEventParams,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '@/lib/market/types';
import { computeIndicators, type IndicatorId } from '@/lib/analysis/indicators';

export interface ChartMarker {
  time: number;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  text: string;
}

/** A horizontal line the learner has placed — an entry, a stop, a target. */
export interface PriceLine {
  price: number;
  label: string;
  colour: string;
  style?: 'solid' | 'dashed';
}

const COLOURS = {
  sma20: '#6ba9ff',
  sma50: '#a78bfa',
  ema9: '#f0b429',
  ema21: '#ff9f6b',
  bollinger: '#67718a',
  vwap: '#2dd4a7',
  rsi: '#f0b429',
  macd: '#6ba9ff',
  macdSignal: '#ff7a5c',
} as const;

/** Which extra pane each non-overlay indicator occupies, in display order. */
const PANE_ORDER: IndicatorId[] = ['volume', 'rsi', 'macd', 'atr'];

/**
 * The chart's current coordinate system, handed to whatever draws on top.
 *
 * Functions rather than a matrix, because lightweight-charts owns the mapping
 * and it changes on every pan, zoom and new bar. Anything that caches the
 * numbers instead of asking each paint will drift.
 *
 * The horizontal axis is the chart's LOGICAL coordinate — a continuous bar
 * position — not a timestamp. Timestamps can only name bars that exist, so
 * they cannot express "halfway between these two candles" or "just past the
 * last one", which is most of where people draw. Logical coordinates express
 * both, and stay put when new bars are appended.
 */
export interface ChartCoords {
  logicalToX: (logical: number) => number | null;
  xToLogical: (x: number) => number | null;
  priceToY: (price: number) => number | null;
  yToPrice: (y: number) => number | null;
  /**
   * Clicks on the price pane, reported by the chart itself.
   *
   * The overlay cannot listen for these on its own. It has to stay transparent
   * to the pointer so the chart keeps panning, and a transparent element never
   * receives a click — so selecting a drawing has to come from the one element
   * that IS receiving them. Returns its own unsubscribe.
   */
  subscribeClick: (handler: (point: { x: number; y: number }) => void) => () => void;
  width: number;
  height: number;
}

export function CandleChart({
  candles,
  markers = [],
  priceLines = [],
  indicators = [],
  height = 380,
  overlay,
}: {
  candles: Candle[];
  markers?: ChartMarker[];
  priceLines?: PriceLine[];
  indicators?: IndicatorId[];
  height?: number;
  /**
   * Rendered above the price pane, given a live view of the coordinate system.
   * Re-invoked on every pan, zoom and data change.
   */
  overlay?: (coords: ChartCoords) => React.ReactNode;
}) {
  /**
   * Whether an overlay exists, as a boolean rather than the function itself.
   *
   * Callers pass an inline arrow, so `overlay` is a different value on every
   * render. Depending on it directly made the effect below re-run each render,
   * set fresh coords, and trigger the next render — an infinite loop that
   * pegged the CPU and left the drawing layer unusable.
   */
  const hasOverlay = overlay != null;
  /** A stable identity for the active indicators, safe to use as a dependency. */
  const indicatorKey = indicators.join(',');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  /** Rebuilt whenever the chart's own scales move, to repaint the overlay. */
  const [coords, setCoords] = useState<ChartCoords | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  /** Every indicator series currently attached, keyed so we can tear them down. */
  const overlayRef = useRef<Map<string, ISeriesApi<'Line'> | ISeriesApi<'Histogram'>>>(new Map());

  const computed = useMemo(() => computeIndicators(candles), [candles]);

  /** Which extra panes are active, and therefore what index each one gets. */
  const activePanes = useMemo(
    () => PANE_ORDER.filter((id) => indicators.includes(id)),
    [indicators],
  );

  // Total height grows with the number of panes so a four-indicator layout does
  // not squeeze the price chart into a sliver.
  const totalHeight = height + activePanes.length * 90;

  // ── chart lifecycle ───────────────────────────────────────────────────────
  //
  // Created ONCE, not on every `totalHeight` change. Toggling a pane
  // indicator (Volume/RSI/MACD/ATR) changes `activePanes.length`, and this
  // effect used to depend on `totalHeight` — so ticking a checkbox tore the
  // whole chart down and rebuilt it. The candle-data effect below only
  // depends on `[candles]`, so it never re-ran for the brand-new series, and
  // the new chart came up with no data at all: the price chart itself
  // "vanished" the moment a lower pane was toggled on. The fix is to build
  // the chart once and resize the EXISTING one when the pane count changes
  // — see the effect right after this one.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      height: totalHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9aa5b8',
        fontFamily: 'var(--font-jetbrains), monospace',
        panes: { separatorColor: '#232a37', separatorHoverColor: '#323a4b', enableResize: true },
      },
      grid: {
        vertLines: { color: 'rgba(35, 42, 55, 0.6)' },
        horzLines: { color: 'rgba(35, 42, 55, 0.6)' },
      },
      rightPriceScale: { borderColor: '#232a37' },
      timeScale: { borderColor: '#232a37', timeVisible: false },
      crosshair: { mode: 1 },
      // Scrolling and scaling stay on — a learner should be able to inspect the
      // past. They cannot scroll into the future because it was never loaded.
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      // Teal/amber rather than green/red — the same colour-blind-safe pairing
      // used everywhere else in the app.
      upColor: '#2dd4a7',
      downColor: '#ff7a5c',
      borderUpColor: '#2dd4a7',
      borderDownColor: '#ff7a5c',
      wickUpColor: '#2dd4a7',
      wickDownColor: '#ff7a5c',
    });

    chartRef.current = chart;
    priceSeriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);
    // Captured for the cleanup below: reading overlayRef.current there would
    // see whatever the map had become by teardown, not this chart's series.
    const overlays = overlayRef.current;

    const observer = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    observer.observe(el);
    chart.applyOptions({ width: el.clientWidth });

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      markersRef.current = null;
      overlays.clear();
    };
    // Deliberately mount-only. `totalHeight` seeds the FIRST render only —
    // see the resize effect directly below, which keeps it in sync
    // afterward without tearing the chart down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize the EXISTING chart when the active pane count changes, instead of
  // recreating it. This is the actual fix: no series gets torn down, so
  // there is no window where the price series exists but has no data.
  useEffect(() => {
    chartRef.current?.applyOptions({ height: totalHeight });
  }, [totalHeight]);

  // ── candles ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const series = priceSeriesRef.current;
    if (!series) return;
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(data);
  }, [candles]);

  // ── indicators ────────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Rebuild from scratch on any change. The series count is small and this
    // avoids a whole class of stale-series bugs that diffing would invite.
    for (const s of overlayRef.current.values()) {
      try {
        chart.removeSeries(s);
      } catch {
        // Series already gone with its pane; nothing to do.
      }
    }
    overlayRef.current.clear();

    // Nulls are dropped rather than back-filled: an indicator that does not yet
    // exist must not be drawn as though it does.
    const points = (values: (number | null)[]): LineData<Time>[] => {
      const out: LineData<Time>[] = [];
      for (let i = 0; i < candles.length; i++) {
        const v = values[i];
        if (v == null) continue;
        out.push({ time: candles[i].time as UTCTimestamp, value: v });
      }
      return out;
    };

    const addLine = (key: string, values: (number | null)[], colour: string, paneIndex = 0, width: 1 | 2 = 2) => {
      const data = points(values);
      if (data.length === 0) return;
      const s = chart.addSeries(
        LineSeries,
        {
          color: colour,
          lineWidth: width,
          priceLineVisible: false,
          lastValueVisible: paneIndex === 0,
          crosshairMarkerVisible: false,
        },
        paneIndex,
      );
      s.setData(data);
      overlayRef.current.set(key, s);
    };

    // Overlays on the price pane.
    if (indicators.includes('sma20')) addLine('sma20', computed.sma20, COLOURS.sma20);
    if (indicators.includes('sma50')) addLine('sma50', computed.sma50, COLOURS.sma50);
    if (indicators.includes('ema9')) addLine('ema9', computed.ema9, COLOURS.ema9);
    if (indicators.includes('ema21')) addLine('ema21', computed.ema21, COLOURS.ema21);
    if (indicators.includes('vwap')) addLine('vwap', computed.vwap, COLOURS.vwap);
    if (indicators.includes('bollinger')) {
      addLine('bbUpper', computed.bollinger.upper, COLOURS.bollinger, 0, 1);
      addLine('bbMiddle', computed.bollinger.middle, COLOURS.bollinger, 0, 1);
      addLine('bbLower', computed.bollinger.lower, COLOURS.bollinger, 0, 1);
    }

    // Extra panes, numbered by their position in the active list.
    activePanes.forEach((id, n) => {
      const pane = n + 1;

      if (id === 'volume') {
        const data = candles
          .map((c) => ({
            time: c.time as UTCTimestamp,
            value: c.volume ?? 0,
            color: c.close >= c.open ? 'rgba(45,212,167,0.5)' : 'rgba(255,122,92,0.5)',
          }))
          .filter((d) => d.value > 0);
        if (data.length === 0) return;
        const s = chart.addSeries(HistogramSeries, { priceLineVisible: false, priceFormat: { type: 'volume' } }, pane);
        s.setData(data);
        overlayRef.current.set('volume', s);
        return;
      }

      if (id === 'rsi') {
        addLine('rsi', computed.rsi, COLOURS.rsi, pane);
        // The 30/70 reference lines the folklore hangs on. Drawn flat so the
        // learner can see how often price sits outside them — which the T2
        // base-rate machinery then lets them actually test.
        addLine('rsi70', candles.map(() => 70), 'rgba(255,122,92,0.35)', pane, 1);
        addLine('rsi30', candles.map(() => 30), 'rgba(45,212,167,0.35)', pane, 1);
        return;
      }

      if (id === 'macd') {
        const hist = candles
          .map((c, i) => ({
            time: c.time as UTCTimestamp,
            value: computed.macd.histogram[i],
            color: (computed.macd.histogram[i] ?? 0) >= 0 ? 'rgba(45,212,167,0.5)' : 'rgba(255,122,92,0.5)',
          }))
          .filter((d): d is { time: UTCTimestamp; value: number; color: string } => d.value != null);
        if (hist.length > 0) {
          const s = chart.addSeries(HistogramSeries, { priceLineVisible: false }, pane);
          s.setData(hist);
          overlayRef.current.set('macdHist', s);
        }
        addLine('macdLine', computed.macd.macd, COLOURS.macd, pane);
        addLine('macdSignal', computed.macd.signal, COLOURS.macdSignal, pane, 1);
        return;
      }

      if (id === 'atr') addLine('atr', computed.atr, COLOURS.sma50, pane);
    });
  }, [candles, indicators, computed, activePanes]);

  // ── keep the overlay in step with the chart ───────────────────────────────
  //
  // The chart mutates its own scales imperatively, so React has no idea a pan
  // or a zoom happened. Subscribing to the time scale and rebuilding the
  // coordinate snapshot is what turns "the user dragged the chart" into
  // "repaint the drawings on top of it".
  //
  // The snapshot is built HERE rather than during render because reading the
  // chart refs is only legal outside render. The functions it hands out still
  // query the live scales when called, so they stay correct within a frame.
  //
  // Only mounted when something is actually drawing on top, so a chart with no
  // overlay pays nothing for any of this.
  useEffect(() => {
    const chart = chartRef.current;
    const series = priceSeriesRef.current;
    const el = containerRef.current;
    if (!hasOverlay || !chart || !series || !el) return;

    const timeScale = chart.timeScale();
    const rebuild = () =>
      setCoords({
        /**
         * Interpolated between whole bars, because the library's
         * `logicalToCoordinate` only honours integers — hand it 411.27 and it
         * returns 0 rather than a point a quarter of the way along the bar.
         * That silently pinned every fractional anchor to the left edge of the
         * chart, so drawings rendered as a vertical line at x=0 and could
         * never be clicked.
         *
         * Bars are evenly spaced, so interpolating between a bar and its
         * neighbour is exact rather than an approximation. Integers outside
         * the loaded range still resolve, which is what lets a drawing extend
         * into the empty space to the right of the newest bar.
         */
        logicalToX: (l) => {
          const base = Math.floor(l);
          const at = timeScale.logicalToCoordinate(base as Logical);
          if (at == null) return null;
          if (l === base) return at;
          const next = timeScale.logicalToCoordinate((base + 1) as Logical);
          return next == null ? at : at + (l - base) * (next - at);
        },
        /**
         * A FRACTIONAL bar position, which the library's own
         * `coordinateToLogical` will not give: it rounds to the nearest bar,
         * so every drawing snapped to a candle column no matter what the
         * magnet was set to.
         *
         * Recovering the fraction is straightforward — take the rounded bar,
         * ask where it and its neighbour sit in pixels, and interpolate the
         * leftover. The result is continuous and defined past the last bar,
         * which is what drawing in the empty space to the right requires.
         */
        xToLogical: (x) => {
          const nearest = timeScale.coordinateToLogical(x);
          if (nearest == null) return null;
          const at = timeScale.logicalToCoordinate(nearest);
          const next = timeScale.logicalToCoordinate((nearest + 1) as Logical);
          if (at == null || next == null || next === at) return nearest;
          return nearest + (x - at) / (next - at);
        },
        priceToY: (p) => series.priceToCoordinate(p),
        yToPrice: (y) => {
          const p = series.coordinateToPrice(y);
          return typeof p === 'number' ? p : null;
        },
        subscribeClick: (handler) => {
          const wrapped = (param: MouseEventParams<Time>) => {
            if (param.point) handler({ x: param.point.x, y: param.point.y });
          };
          chart.subscribeClick(wrapped);
          return () => chart.unsubscribeClick(wrapped);
        },
        width: el.clientWidth,
        height,
      });

    /**
     * A cheap per-frame check that the mapping has not moved under us.
     *
     * Subscribing to the time scale alone is not enough, and the gap is
     * visible: dragging the PRICE axis rescales the chart vertically and fires
     * no time-scale event at all, so every drawing would hang at its old
     * height while the candles moved beneath it. The same is true of the
     * automatic rescale that happens when a newly revealed bar sets a new high.
     *
     * So instead of trying to enumerate every event the library might emit,
     * this samples the mapping itself — where two reference prices and the
     * visible bar range currently land — and rebuilds only when one of them
     * actually changes. The comparison is four numbers per frame; a rebuild
     * only happens on a real change, so a still chart re-renders nothing.
     */
    const signature = () => {
      const range = timeScale.getVisibleLogicalRange();
      const top = series.coordinateToPrice(0);
      const bottom = series.coordinateToPrice(height);
      return `${range?.from ?? ''}|${range?.to ?? ''}|${top ?? ''}|${bottom ?? ''}|${el.clientWidth}`;
    };

    let last = '';
    let frame = 0;
    const watch = () => {
      const now = signature();
      if (now !== last) {
        last = now;
        rebuild();
      }
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);

    const observer = new ResizeObserver(rebuild);
    observer.observe(el);
    rebuild();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // `indicatorKey`, not `indicators`. A caller that omits the prop gets the
    // default `[]` — a NEW array on every render — so depending on the array
    // itself re-ran this effect each render, set fresh coords, and triggered
    // the next render. `MarginCall` omits it, and died with "Maximum update
    // depth exceeded" the moment the drawing layer was added.
  }, [hasOverlay, candles, indicatorKey, height]);

  // ── markers ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const plugin = markersRef.current;
    if (!plugin) return;
    const m: SeriesMarker<Time>[] = markers.map((k) => ({
      time: k.time as UTCTimestamp,
      position: k.position,
      color: k.color,
      shape: k.shape,
      text: k.text,
    }));
    plugin.setMarkers(m);
  }, [markers]);

  // ── horizontal price lines (entry, stop, target) ──────────────────────────
  useEffect(() => {
    const series = priceSeriesRef.current;
    if (!series) return;
    const created = priceLines.map((l) =>
      series.createPriceLine({
        price: l.price,
        color: l.colour,
        lineWidth: 1,
        lineStyle: l.style === 'dashed' ? 2 : 0,
        axisLabelVisible: true,
        title: l.label,
      }),
    );
    return () => {
      for (const line of created) {
        try {
          series.removePriceLine(line);
        } catch {
          // Series torn down first; nothing to remove.
        }
      }
    };
  }, [priceLines]);

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="w-full" />
      {overlay && coords && (
        // Pinned to the price pane only. The lower panes belong to the
        // indicators, and a trendline drawn across an RSI panel would be
        // measuring nothing.
        //
        // `z-10` is load-bearing, not cosmetic. lightweight-charts stacks its
        // own canvases inside the chart container, and without an explicit
        // z-index here they paint ABOVE this layer — `elementFromPoint` at the
        // middle of the chart returned the canvas, so every press meant to
        // start a drawing was swallowed by the chart and nothing could be
        // drawn at all.
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ height }}>
          {overlay(coords)}
        </div>
      )}
    </div>
  );
}
