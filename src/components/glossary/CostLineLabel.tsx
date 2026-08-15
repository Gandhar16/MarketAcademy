'use client';

/**
 * A cost breakdown row's label, with its definition attached.
 *
 * Three places render an itemised bill — the cost widget, the reality check
 * after a fill, and the simulator's per-fill charges — and all three showed the
 * same eight words with nothing behind them. This is the one component they now
 * share, so a term added to `cost-terms.ts` lights up in all three at once.
 *
 * Rows with no mapped term render as plain text rather than a dead button. A
 * dotted underline that leads nowhere is worse than no underline.
 */
import { termForCostLine } from '@/lib/glossary/cost-terms';
import { Term } from './TermDefinitions';

export function CostLineLabel({ lineKey, label }: { lineKey: string; label: string }) {
  const term = termForCostLine(lineKey);
  if (!term) return <>{label}</>;
  return <Term id={term}>{label}</Term>;
}
