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
import { useEffect, useMemo, useRef } from 'react';
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

export function CandleChart({
  candles,
  markers = [],
  priceLines = [],
  indicators = [],
  height = 380,
}: {
  candles: Candle[];
  markers?: ChartMarker[];
  priceLines?: PriceLine[];
  indicators?: IndicatorId[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
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

  return <div ref={containerRef} className="w-full" />;
}
