/**
 * Which glossary term explains which line on a cost breakdown.
 *
 * This is the mapping the site was missing, and it is the exact complaint that
 * started this work: a learner finishes a trade, sees a row labelled "STT"
 * taking real money off their result, and has nowhere to go. The glossary had a
 * good entry for it the whole time. Nothing connected the two.
 *
 * Keyed on `CostLine.key`, which is a stable engine identifier rather than the
 * display label — so rewording a label cannot silently break the definition
 * behind it, and a test asserts every key the engine can emit is accounted for.
 *
 * A `null` means "deliberately no term". The regulator turnover fee and the two
 * halves of the depository charge are named plainly enough on the row itself,
 * and inventing a glossary entry per billing line would bury the eight terms
 * that actually matter.
 */
export const COST_LINE_TERMS: Record<string, string | null> = {
  brokerage: 'brokerage',
  stt: 'stt',
  stamp: 'stamp-duty',
  gst: 'gst',
  exchange_txn: 'exchange',
  sebi: 'regulator',
  dp_cdsl: 'dp-charges',
  dp_broker: 'dp-charges',
  // US
  commission: 'brokerage',
  sec31: 'regulator',
  taf: 'regulator',
};

/** The glossary term for a cost line, if it has one. */
export function termForCostLine(key: string): string | null {
  return COST_LINE_TERMS[key] ?? null;
}
