import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — Indian capital-gains tax
 *
 * The last cost, and the largest one for anybody who trades actively. It is
 * also the one nobody teaches, because rates change and content rots.
 *
 * The lesson is therefore built on STRUCTURE rather than on rates. The three
 * things that never change:
 *
 *   1. Holding period decides which regime applies, and the boundary is sharp.
 *   2. Losses can be set off against gains, and carried forward — which makes
 *      booking a loss deliberately a real decision rather than an admission.
 *   3. Trading income and investment income are treated differently, and the
 *      distinction is about frequency and intent rather than about instrument.
 *
 * Every rate is stated with the caveat that rates change and the reader must
 * check. That is honest and it is also what keeps the lesson from rotting.
 */
export const lesson: Lesson = {
  id: 'in-t4-tax',
  tier: 'T4',
  market: 'IN',
  title: 'Indian capital-gains tax, honestly',
  summary:
    'The largest cost an active trader pays, and the one nobody teaches. Structure over rates: holding periods, set-off, and why booking a loss is a decision rather than a defeat.',
  plainSummary:
    'Tax takes a share of what you make, and how much depends on how long you held. This explains the structure so you can plan around it.',
  objectives: [
    'Say what decides which tax treatment a gain receives',
    'Compute the after-tax result of a gain under each treatment',
    'Explain how losses offset gains and why that makes booking them useful',
    'Decide the tax consequence of a holding-period boundary',
  ],
  prerequisites: ['in-t4-correlation'],
  estimatedMinutes: 14,
  introduces: ['stt', 'delivery', 'intraday', 'turnover', 'round-trip', 'breakeven'],
  skills: ['tax', 'costs', 'portfolio'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You buy shares and sell at a ₹2,00,000 profit. What decides how much tax you pay on it?',
      options: [
        'The size of the gain',
        'How long you held them',
        'Which broker you used',
      ],
      correct: 1,
      reveal:
        'How long you held. India splits share gains by holding period, and the boundary is sharp rather than gradual — one day either side of it changes the rate that applies to the entire gain. That makes the holding period a decision with a price attached, and it is a decision most people make without ever noticing it exists. The size matters too, through exemptions and slabs, but the first question about any gain is always the calendar.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Rates change. Check them.',
      md:
        'This lesson teaches the **structure**, because that is stable. The rates are set in each Budget and have changed several times.\n\nBefore acting on anything here, confirm the current figures with the Income Tax Department or a qualified adviser. Nothing on this site is tax advice.\n\nWhat does not change: the holding-period boundary exists, losses can be set off against gains, and trading income is treated differently from investment income.',
    },
    {
      kind: 'widget',
      component: 'CostBreakdownTable',
      props: { market: 'IN', venue: 'NSE', product: 'delivery', side: 'sell', price: 1400, quantity: 200 },
      takeaway:
        'The securities transaction tax here is charged on the trade regardless of profit. Capital-gains tax is separate, comes later, and applies only to gains.',
    },
    {
      kind: 'example',
      title: 'The same gain, two holding periods',
      setup:
        'You buy 200 shares at ₹1,400 and sell at ₹2,400, a gain of ₹2,00,000. Compare selling at eleven months against selling at thirteen. Rates below are illustrative — check the current ones.',
      steps: [
        {
          label: 'The gain, before anything',
          detail: '200 shares, ₹1,000 of gain each',
          compute: { fn: 'multiply', a: 1000, b: 200, dp: 0 },
        },
        {
          label: 'Trading charges on the round trip',
          detail: 'Paid whichever month you sell in',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 1400, quantity: 200 },
        },
        {
          label: 'Sold at 11 months — short-term treatment, at 20%',
          detail: 'Illustrative rate. The whole gain is taxed at the short-term rate',
          compute: { fn: 'percentOf', value: 200000, percent: 20 },
        },
        {
          label: 'Sold at 13 months — long-term treatment, at 12.5%',
          detail: 'Illustrative rate, and a separate annual exemption applies first',
          compute: { fn: 'percentOf', value: 200000, percent: 12.5 },
        },
        {
          label: 'What two extra months were worth',
          detail: 'The same trade, the same gain, a different calendar',
          compute: { fn: 'literal', value: 15000 },
        },
      ],
      conclusion:
        'Two months of patience was worth ₹15,000 on this trade, and it required no skill whatsoever.',
    },
    {
      kind: 'predict',
      prompt:
        'You have ₹3,00,000 of realised gains this year and hold a position sitting at a ₹1,00,000 unrealised loss you no longer believe in. What does selling it do?',
      options: [
        'Nothing useful — it just books a loss',
        'It reduces the gains you are taxed on, so the loss is partly refunded',
        'It creates a separate loss you cannot use',
      ],
      correct: 1,
      reveal:
        'It reduces the taxable gains. Losses can be set off against gains of the same kind. Booking a ₹1,00,000 loss against ₹3,00,000 of gains means you are taxed on ₹2,00,000, and at 20% that loss just returned ₹20,000. This turns the disposition effect from stage 7 on its head: the position you were holding purely to avoid admitting a loss is worth more sold. Unused losses can also be carried forward, subject to conditions, provided the return is filed on time.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'cost-cutter',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Trading income is a different animal',
      md:
        'Frequent trading — and intraday in particular — is generally treated as **business income** rather than as capital gains.\n\nThat changes almost everything: it is taxed at your slab rate, expenses become deductible, and above certain turnover thresholds an audit requirement can appear.\n\nThe line is drawn on frequency, volume and intent rather than on the instrument. Anybody planning to trade actively should establish which side of it they are on **before** the year ends, not while filing.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You realise ₹4,00,000 of gains and book ₹1,50,000 of losses in the same year. At a 20% rate, what tax is due on the net, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 50000, tolerance: 500, unit: '₹' },
          explanation:
            '₹4,00,000 − ₹1,50,000 = ₹2,50,000 net, and 20% of that is ₹50,000. Compare it with ₹80,000 on the gross gains: booking the losses was worth ₹30,000. That is the whole argument for reviewing losing positions before the year end — not to manufacture losses, but to stop postponing decisions you had already made.',
        },
        {
          prompt:
            'Sort each item by whether it changes what you keep from a trade.',
          type: 'classify',
          spec: {
            categories: ['Changes what you keep', 'Does not'],
            items: [
              { label: 'How long you held before selling', category: 'Changes what you keep' },
              { label: 'Realised losses elsewhere in the same year', category: 'Changes what you keep' },
              { label: 'Which broker you used', category: 'Does not' },
              { label: 'The price you originally hoped for', category: 'Does not' },
            ],
          },
          explanation:
            'The first two are the levers, and both are calendar decisions rather than market ones — which makes them the rare part of this subject you fully control. The broker affects the charges, which are real and small next to tax. The last row is the anchoring error again, appearing one final time in a completely different context.',
        },
        {
          prompt:
            'A position is at a large gain and eleven months old. You want to sell. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Sell now — never let tax drive an investment decision',
              'Work out what waiting a month is worth, then decide with both numbers in front of you',
              'Always hold past the boundary',
            ],
            correct: 'Work out what waiting a month is worth, then decide with both numbers in front of you',
          },
          explanation:
            'Compute it, then decide. The first answer is a slogan that throws away a real, quantified saving. The third is the same slogan inverted, letting tax override a view that the position should be closed. The honest procedure puts both numbers on the table: what a month of holding is worth in tax, and what you think the position does in that month. Then choose knowingly.',
        },
      ],
    },
  ],
};

export default lesson;
