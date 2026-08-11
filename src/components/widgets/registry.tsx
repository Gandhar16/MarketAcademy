'use client';

/**
 * The widget registry.
 *
 * A lesson block names a component as a string; this maps that string to real
 * React. An unknown name renders a loud, visible error rather than an empty div
 * — a silently missing widget in a lesson is a hole in the teaching that nobody
 * notices until a learner hits it.
 */
import type { ComponentType } from 'react';
import { BreakevenSlider, BrokerComparator, CostBreakdownTable, CostComparator } from './cost';
import { ExpiryComparator } from './expiry';
import { MarginLadder, PhysicalSettlementCalculator } from './settlement';
import { OrderBookLadder } from './orderbook';
import { SettlementChain } from './settlement-chain';
import { PatternBaseRate, PatternScanner } from './patterns';
import { GreeksExplorer, PayoffChart } from './options';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- props are validated per-widget by the lesson author; the registry is intentionally untyped at this seam
type AnyWidget = ComponentType<any>;

export const WIDGETS: Record<string, AnyWidget> = {
  CostBreakdownTable,
  CostComparator,
  BreakevenSlider,
  BrokerComparator,
  ExpiryComparator,
  PhysicalSettlementCalculator,
  MarginLadder,
  OrderBookLadder,
  SettlementChain,
  PatternBaseRate,
  PatternScanner,
  GreeksExplorer,
  PayoffChart,
};

export function MissingWidget({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm">
      <div className="font-medium text-danger">Widget &ldquo;{name}&rdquo; is not registered.</div>
      <p className="mt-1 text-ink-muted">
        Add it to <code className="num">src/components/widgets/registry.tsx</code>. The lesson cannot teach what it
        cannot render.
      </p>
    </div>
  );
}

export function renderWidget(name: string, props: Record<string, unknown>) {
  const Component = WIDGETS[name];
  if (!Component) return <MissingWidget name={name} />;
  return <Component {...props} />;
}
