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
import { OwnershipToPriceMap } from './ownership';
import { OwnershipExplainer } from './ownership-explainer';
import { MoneySecuritiesFlow } from './money-flow';
import { MoneyFlowExplainer } from './money-flow-explainer';
import { MarketMapSequencer } from './market-map';
import { RolesExplainer } from './roles-explainer';
import { SlippageExplainer } from './slippage-explainer';
import { SettlementExplainer } from './settlement-explainer';
import { ExpectationGapExplainer } from './expectation-gap-explainer';
import { ProcessOutcomeExplainer } from './process-outcome-explainer';
import { IndexWeightExplainer } from './index-weight-explainer';
import { StopGapExplainer } from './stop-gap-explainer';
import { CostReceiptExplainer } from './cost-receipt-explainer';
import { ContractNoteExplainer } from './contract-note-explainer';
import { CandlePathExplainer } from './candle-path-explainer';
import { TradeSequenceExplainer } from './trade-sequence-explainer';
import { SizeFromStopExplainer } from './size-from-stop-explainer';
import { TriggerFillExplainer } from './trigger-fill-explainer';
import { ExpectancyExplainer } from './expectancy-explainer';
import { DecisionOutcomeGridExplainer } from './decision-outcome-grid-explainer';
import { TimeVsRateExplainer } from './time-vs-rate-explainer';
import { RupeeCostExplainer } from './rupee-cost-explainer';
import { TwoRisksExplainer } from './two-risks-explainer';
import { CorporateActionExplainer } from './corporate-action-explainer';
import { BarCompressionExplainer } from './bar-compression-explainer';
import { HindsightExplainer } from './hindsight-explainer';
import { SupportZoneExplainer } from './support-zone-explainer';
import { VolumeMythExplainer } from './volume-myth-explainer';
import { BaseRateExplainer } from './base-rate-explainer';
import { SampleSizeExplainer } from './sample-size-explainer';
import { IndicatorLagExplainer } from './indicator-lag-explainer';
import { TrendlineConfirmExplainer } from './trendline-confirm-explainer';
import { FibonacciSensitivityExplainer } from './fibonacci-sensitivity-explainer';
import { NecklineExplainer } from './neckline-explainer';
import { TriangleBreakoutExplainer } from './triangle-breakout-explainer';
import { WaveCountExplainer } from './wave-count-explainer';
import { PatternRarityExplainer } from './pattern-rarity-explainer';
import { ConfluenceExplainer } from './confluence-explainer';
import { VwapBenchmarkExplainer } from './vwap-benchmark-explainer';
import { PivotGridExplainer } from './pivot-grid-explainer';
import { BollingerSqueezeExplainer } from './bollinger-squeeze-explainer';
import { DivergenceExplainer } from './divergence-explainer';
import { AdxDirectionExplainer } from './adx-direction-explainer';
import { ConvergenceCapstoneExplainer } from './convergence-capstone-explainer';
import { ThreeStatementsExplainer } from './three-statements-explainer';
import { ReceivablesTrendExplainer } from './receivables-trend-explainer';
import { MultipleOverTimeExplainer } from './multiple-over-time-explainer';
import { SurvivorshipExplainer } from './survivorship-explainer';
import { SectorRatioExplainer } from './sector-ratio-explainer';
import { RoeRoceGapExplainer } from './roe-roce-gap-explainer';
import { InterestCoverageExplainer } from './interest-coverage-explainer';
import { QualityChecklistExplainer } from './quality-checklist-explainer';
import { MoatCompoundExplainer } from './moat-compound-explainer';
import { ReportSectionsExplainer } from './report-sections-explainer';
import { PledgeBaseExplainer } from './pledge-base-explainer';
import { DispositionEffectExplainer } from './disposition-effect-explainer';
import { AnchorShiftExplainer } from './anchor-shift-explainer';
import { FrequencyDragExplainer } from './frequency-drag-explainer';
import { MarginGapExplainer } from './margin-gap-explainer';
import { ObligationChoiceExplainer } from './obligation-choice-explainer';
import { MarkToMarketExplainer } from './mark-to-market-explainer';
import { AsymmetryExplainer } from './asymmetry-explainer';
import { IntrinsicVsHopeExplainer } from './intrinsic-vs-hope-explainer';
import { TimeDecayExplainer } from './time-decay-explainer';
import { FourCausesExplainer } from './four-causes-explainer';
import { VixScaleExplainer } from './vix-scale-explainer';
import { IvCrushExplainer } from './iv-crush-explainer';
import { CappedShapeExplainer } from './capped-shape-explainer';
import { SettlementAverageExplainer } from './settlement-average-explainer';
import { InsuranceCostExplainer } from './insurance-cost-explainer';
import { GeometricRuinExplainer } from './geometric-ruin-explainer';
import { KellyAsymmetryExplainer } from './kelly-asymmetry-explainer';
import { LookaheadBiasExplainer } from './lookahead-bias-explainer';
import { SpreadCostExplainer } from './spread-cost-explainer';
import { SameBetExplainer } from './same-bet-explainer';
import { CorrelationSpikeExplainer } from './correlation-spike-explainer';
import { SpecificationGapExplainer } from './specification-gap-explainer';
import { HoldingPeriodExplainer } from './holding-period-explainer';
import { LockedQueueExplainer } from './locked-queue-explainer';
import { PhysicalObligationExplainer } from './physical-obligation-explainer';
import { AuctionPenaltyExplainer } from './auction-penalty-explainer';
import { OrderSplitExplainer } from './order-split-explainer';
import { OvernightMarginExplainer } from './overnight-margin-explainer';
import { AdjustedOrphanExplainer } from './adjusted-orphan-explainer';
import { EmptyBookPrintExplainer } from './empty-book-print-explainer';
import { DailyInterestExplainer } from './daily-interest-explainer';
import { TwoDirectionShortfallExplainer } from './two-direction-shortfall-explainer';
import { RecallForcedBuyExplainer } from './recall-forced-buy-explainer';
import { GapJumpExplainer } from './gap-jump-explainer';
import { SpreadExplosionExplainer } from './spread-explosion-explainer';
import { ProcessNotOutcomeLab } from './process-lab';

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
  OwnershipToPriceMap,
  OwnershipExplainer,
  MoneySecuritiesFlow,
  MoneyFlowExplainer,
  MarketMapSequencer,
  RolesExplainer,
  SlippageExplainer,
  SettlementExplainer,
  ExpectationGapExplainer,
  ProcessOutcomeExplainer,
  IndexWeightExplainer,
  StopGapExplainer,
  CostReceiptExplainer,
  ContractNoteExplainer,
  CandlePathExplainer,
  TradeSequenceExplainer,
  SizeFromStopExplainer,
  TriggerFillExplainer,
  ExpectancyExplainer,
  DecisionOutcomeGridExplainer,
  TimeVsRateExplainer,
  RupeeCostExplainer,
  TwoRisksExplainer,
  CorporateActionExplainer,
  BarCompressionExplainer,
  HindsightExplainer,
  SupportZoneExplainer,
  VolumeMythExplainer,
  BaseRateExplainer,
  SampleSizeExplainer,
  IndicatorLagExplainer,
  TrendlineConfirmExplainer,
  FibonacciSensitivityExplainer,
  NecklineExplainer,
  TriangleBreakoutExplainer,
  WaveCountExplainer,
  PatternRarityExplainer,
  ConfluenceExplainer,
  VwapBenchmarkExplainer,
  PivotGridExplainer,
  BollingerSqueezeExplainer,
  DivergenceExplainer,
  AdxDirectionExplainer,
  ConvergenceCapstoneExplainer,
  ThreeStatementsExplainer,
  ReceivablesTrendExplainer,
  MultipleOverTimeExplainer,
  SurvivorshipExplainer,
  SectorRatioExplainer,
  RoeRoceGapExplainer,
  InterestCoverageExplainer,
  QualityChecklistExplainer,
  MoatCompoundExplainer,
  ReportSectionsExplainer,
  PledgeBaseExplainer,
  DispositionEffectExplainer,
  AnchorShiftExplainer,
  FrequencyDragExplainer,
  MarginGapExplainer,
  ObligationChoiceExplainer,
  MarkToMarketExplainer,
  AsymmetryExplainer,
  IntrinsicVsHopeExplainer,
  TimeDecayExplainer,
  FourCausesExplainer,
  VixScaleExplainer,
  IvCrushExplainer,
  CappedShapeExplainer,
  SettlementAverageExplainer,
  InsuranceCostExplainer,
  GeometricRuinExplainer,
  KellyAsymmetryExplainer,
  LookaheadBiasExplainer,
  SpreadCostExplainer,
  SameBetExplainer,
  CorrelationSpikeExplainer,
  SpecificationGapExplainer,
  HoldingPeriodExplainer,
  LockedQueueExplainer,
  PhysicalObligationExplainer,
  AuctionPenaltyExplainer,
  OrderSplitExplainer,
  OvernightMarginExplainer,
  AdjustedOrphanExplainer,
  EmptyBookPrintExplainer,
  DailyInterestExplainer,
  TwoDirectionShortfallExplainer,
  RecallForcedBuyExplainer,
  GapJumpExplainer,
  SpreadExplosionExplainer,
  ProcessNotOutcomeLab,
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
