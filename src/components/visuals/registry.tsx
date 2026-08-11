'use client';

/**
 * Figure registry.
 *
 * Same contract as the widget and game registries: an unknown name renders a
 * loud, visible error rather than an empty gap.
 */
import type { ComponentType } from 'react';
import { CandleAnatomy } from './candle-anatomy';
import {
  CompoundingCurve,
  LongShortDiagram,
  RiskRewardDiagram,
  SettlementTimeline,
  SpreadDiagram,
} from './diagrams';
import {
  CandlestickTrioFigure,
  ChartPatternFigure,
  ChartTypeFigure,
  ElliottWaveFigure,
  FibonacciFigure,
  SwingPointFigure,
  TrendlineFigure,
  VolumeProfileFigure,
} from './ta-tools';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- per-figure props are the figure's own concern
type AnyFigure = ComponentType<any>;

export const FIGURES: Record<string, AnyFigure> = {
  CandleAnatomy,
  SpreadDiagram,
  SettlementTimeline,
  LongShortDiagram,
  CompoundingCurve,
  RiskRewardDiagram,
  SwingPointFigure,
  TrendlineFigure,
  FibonacciFigure,
  ChartPatternFigure,
  ElliottWaveFigure,
  CandlestickTrioFigure,
  VolumeProfileFigure,
  ChartTypeFigure,
};

export function renderFigure(name: string, props: Record<string, unknown>) {
  const Figure = FIGURES[name];
  if (!Figure) {
    return (
      <div className="rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm">
        <div className="font-medium text-danger">Figure &ldquo;{name}&rdquo; is not registered.</div>
        <p className="mt-1 text-ink-muted">
          Add it to <code className="num">src/components/visuals/registry.tsx</code>.
        </p>
      </div>
    );
  }
  return <Figure {...props} />;
}
