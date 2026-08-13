import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — overtrading
 *
 * The last lesson of the behaviour stage, and the one where the cost engine
 * does the arguing. Every other lesson about frequency is an opinion; this one
 * is a multiplication.
 *
 * The finding worth landing: activity feels like work, and in this particular
 * field the relationship between effort and result is often negative. A person
 * who trades once a month with a genuine small edge beats the same person
 * trading daily with the same edge, because the edge is per-trade and the cost
 * is per-trade too — and the cost is the more reliable of the two.
 */
export const lesson: Lesson = {
  id: 'in-t2-overtrading',
  tier: 'T2',
  market: 'IN',
  title: 'The cost of needing to be in a trade',
  summary:
    'Activity feels like work, and here it is often negative work. The same edge, traded ten times as often, is a worse strategy — and the arithmetic is not close.',
  plainSummary:
    'Trading more often feels productive. This shows what it actually costs, using real charges rather than opinions.',
  objectives: [
    'Compute the annual cost drag of a given trading frequency',
    'Explain why an edge is per-trade but costs are per-trade too',
    'Say why doing nothing is a position rather than an absence of one',
    'Decide whether a marginal trade is worth taking',
  ],
  prerequisites: ['in-t2-anchoring'],
  estimatedMinutes: 13,
  introduces: ['round-trip', 'breakeven', 'turnover', 'expectancy', 'slippage'],
  skills: ['behaviour', 'costs', 'expectancy'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Two traders have the identical edge — each trade is worth 0.4% on average before costs. Asha takes 20 trades a year, Bharat takes 200. Who does better?',
      options: ['Bharat — ten times the opportunities', 'Asha', 'The same, since the edge per trade is identical'],
      correct: 1,
      reveal:
        'Asha, comfortably. Bharat has ten times the gross edge and also ten times the costs, and on a typical Indian delivery round trip the cost is a meaningful fraction of 0.4%. Multiply both sides by ten and the gap widens rather than staying proportional, because the cost is certain and the edge is only an average. Bharat also has ten times as many opportunities to make a behavioural error. Frequency multiplies everything, and only one of the things being multiplied is reliable.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'FrequencyDragExplainer',
      props: {},
      takeaway:
        'Step through it once. The same multiplication that turns ₹288 into ₹57,600 turns −₹12 into a −₹2,400 bill.',
    },
    {
      kind: 'widget',
      component: 'BreakevenSlider',
      props: { market: 'IN', product: 'intraday', price: 1400, minValue: 20_000, maxValue: 1_000_000 },
      takeaway:
        'The move needed just to break even on one round trip. Now imagine paying it two hundred times in a year rather than twenty.',
    },
    {
      kind: 'callout',
      tone: 'cost',
      title: 'The edge is an average. The cost is a certainty.',
      md:
        'Your edge shows up over many trades and may not appear at all in any particular one.\n\nThe charges appear in **every single trade**, in full, on both legs, whether it won or lost.\n\nSo increasing frequency scales an uncertain benefit and a certain cost by the same factor. Over a year the cost line is smooth and predictable and the edge line is not, which is why the drag is felt long before the edge is.',
    },
    {
      kind: 'example',
      title: 'The same edge at two frequencies',
      setup:
        'A ₹5,00,000 account. Each trade is a ₹1,00,000 position with a genuine 0.4% average gross edge. Compare 20 trades a year against 200, using real Indian intraday charges.',
      steps: [
        {
          label: 'Gross edge per trade',
          detail: '0.4% of a ₹1,00,000 position',
          compute: { fn: 'percentOf', value: 100000, percent: 0.4 },
        },
        {
          label: 'Round-trip cost per trade',
          detail: 'Every statutory charge, both legs',
          compute: { fn: 'roundTripTotal', product: 'intraday', price: 1400, quantity: 71 },
        },
        {
          label: 'Net per trade',
          detail: '₹400 of edge less the charges',
          compute: { fn: 'literal', value: 288 },
        },
        {
          label: '20 trades a year',
          detail: 'Net, on a ₹5,00,000 account',
          compute: { fn: 'multiply', a: 288, b: 20, dp: 0 },
        },
        {
          label: '200 trades a year',
          detail: 'Ten times the activity — and ten times the costs',
          compute: { fn: 'multiply', a: 288, b: 200, dp: 0 },
        },
      ],
      conclusion:
        'With a real edge, frequency does pay. The whole question is whether the edge is real, because the costs are certain either way.',
    },
    {
      kind: 'predict',
      prompt:
        'Same numbers, but the edge is actually 0.1% rather than 0.4% — a perfectly ordinary amount of self-deception. Work out the 200-trade result before you look.',
      options: ['A large profit', 'About break-even', 'A substantial loss'],
      correct: 2,
      reveal:
        'A substantial loss. At 0.1% the gross edge is ₹100 a trade against roughly ₹112 of charges. So every trade loses about ₹12, and 200 of them lose about ₹2,400 before a single mistake. This is the honest reason frequency is dangerous. It is not that trading often is wrong. It amplifies whatever is really there, and most people are far less certain about the size of their edge than they feel. At low frequency an overestimated edge is a slow disappointment. At high frequency it is a bill.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "After a losing trade, a trader takes three more trades that same afternoon to 'make it back', none from their usual watchlist. On the cost arithmetic alone, what is the extra, guaranteed cost of that choice?",
      options: [
        'Nothing extra — the same costs apply whether trades are planned or not',
        'Three more round trips of certain charges, on top of whatever edge those hurried trades may or may not have',
        'It depends only on whether those three trades win or lose',
      ],
      correct: 1,
      reveal:
        'Three more round trips of certain charges, guaranteed, whatever happens next. Trades taken to chase a loss get no discount on costs. They simply add more certain charges on top of an edge nobody actually measured for this situation.',
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
      title: 'Doing nothing is a position',
      md:
        'Sitting out is a decision, and it costs nothing. That is the only decision in this entire subject with that property.\n\nThe difficulty is that it does not feel like anything. Nobody watching you do nothing is impressed, including you.\n\nSo the useful question before a marginal trade is not "is this a reasonable setup" — plenty of things are reasonable. It is: **is this better than the best thing I saw last week?** If not, you are trading because you are bored, and boredom is expensive here.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            "After a loss, a trader takes two extra, unplanned trades the same day 'to make it back'. Decide what the cost arithmetic here says about that choice, whether or not the two trades win.",
          type: 'decision',
          spec: {
            options: [
              'No extra cost, since the trades might win',
              'Two more certain round-trip charges, added on top of an edge nobody actually measured for this situation',
              'The costs are waived for trades taken to recover a loss',
            ],
            correct: 'Two more certain round-trip charges, added on top of an edge nobody actually measured for this situation',
          },
          explanation:
            'Two more certain charges, guaranteed. Costs do not care why a trade was taken. Chasing a loss adds frequency, and frequency multiplies cost with total reliability.',
        },
        {
          prompt:
            'You buy 71 shares at ₹1,400 intraday and close the same day. What is the round-trip cost as a percentage of turnover?',
          type: 'compute',
          spec: {
            metric: 'roundTripCostPercent',
            market: 'IN',
            venue: 'NSE',
            product: 'intraday',
            price: 1400,
            quantity: 71,
            tolerance: 0.02,
          },
          explanation:
            'This is the number every trade has to beat before it earns anything, and it does not care whether you were right. Multiply it by your intended number of trades a year to get the annual drag. That figure is the bar any strategy must clear. Writing it down first is what stops frequency from becoming a habit rather than a choice.',
        },
        {
          prompt:
            'Sort each consequence of trading ten times more often.',
          type: 'classify',
          spec: {
            categories: ['Scales up reliably', 'Only scales if the edge is real'],
            items: [
              { label: 'Statutory charges paid', category: 'Scales up reliably' },
              { label: 'Chances to make a behavioural error', category: 'Scales up reliably' },
              { label: 'Expected profit', category: 'Only scales if the edge is real' },
              { label: 'Confidence that the method works', category: 'Only scales if the edge is real' },
            ],
          },
          explanation:
            'Two certainties on the left and two hopes on the right. That asymmetry is the entire argument, and it is why the burden of proof for increasing frequency is much higher than it feels. Anybody proposing to trade more should be able to state their edge as a number and say how they measured it.',
        },
        {
          prompt:
            'It is Thursday, you have taken no trades this week, and you find a setup you would call mediocre. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Take it — a mediocre trade beats no trade',
              'Skip it, because "I have not traded this week" is not a reason to trade',
              'Take it at half size as a compromise',
            ],
            correct: 'Skip it, because "I have not traded this week" is not a reason to trade',
          },
          explanation:
            'Skip it. The setup was mediocre before you noticed the empty week, and noticing the empty week did not improve it. The third answer is the honest-looking trap — halving the size acknowledges the trade is poor and takes it anyway, which is the worst of both. The urge to act is the thing being tested here, and it is a much more expensive habit than any individual bad trade.',
        },
      ],
    },
  ],
};

export default lesson;
