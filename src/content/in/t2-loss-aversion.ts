import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — the disposition effect
 *
 * The behaviour stage is placed after the first real decisions on purpose: a
 * bias you have already fallen for teaches more than one described in advance.
 *
 * This lesson covers the single best-documented error in retail investing —
 * selling winners early and holding losers — and it does the one thing that
 * actually helps, which is not "be disciplined" but a mechanical test: would I
 * buy this today at this price? If no, the only reason to hold it is the price
 * you paid, and that is not a reason.
 */
export const lesson: Lesson = {
  id: 'in-t2-loss-aversion',
  tier: 'T2',
  market: 'IN',
  title: 'Why you sell the winners and keep the losers',
  summary:
    'The best-documented error in retail investing, and the two-second test that defuses it. You will fall for it before it is named.',
  plainSummary:
    'Most people sell the things going up and hold the things going down. This shows why that happens and what to do instead.',
  objectives: [
    'Describe the disposition effect and why it feels rational at the time',
    'Explain why the price you paid is not information about the future',
    'Apply the would-I-buy-this-today test to an existing holding',
    'Decide between two holdings on the basis of prospects rather than history',
  ],
  prerequisites: ['in-t1-journal'],
  estimatedMinutes: 13,
  introduces: ['position', 'drawdown', 'stop-loss', 'base-rate'],
  skills: ['behaviour', 'evaluation'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You need ₹50,000 and must sell one holding. A is up 30%. B is down 30%. The prospects of both are identical. Which do most people sell?',
      options: ['A, the winner', 'B, the loser', 'It varies randomly'],
      correct: 0,
      reveal:
        'The winner, overwhelmingly, and it has been measured across millions of real accounts. Selling A means booking a gain, which feels like success. Selling B means admitting a loss, which feels like failure — so people keep B and tell themselves they are waiting for it to recover. Notice what has happened: the decision was made by which one is more comfortable to sell rather than by which is the better thing to own. The prospects were stated as identical, and the choice was still not close.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'DispositionEffectExplainer',
      props: {},
      takeaway:
        'Step through it once. Same 60% win rate — the habit turns it into −₹60,000, the plan turns it into +₹50,000.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A loss hurts about twice as much as the same gain pleases',
      md:
        'That ratio has been measured repeatedly, and it explains most of what people do with their holdings.\n\nBooking a gain converts an uncertain feeling into a certain good one. Booking a loss converts it into a certain bad one, and the mind will accept a great deal of risk to avoid that.\n\nSo the loser is kept, not because of anything about the company, but because **selling it is the moment the loss becomes real**. Holding it postpones a feeling.',
    },
    {
      kind: 'game',
      game: 'bias-buster',
      config: {},
    },
    {
      kind: 'example',
      title: 'What the pattern costs over a year',
      setup:
        'You take 20 trades, risking ₹5,000 each. Your entries are fine. But you take profits at ₹3,000 because a gain feels good, and you let losers run to ₹12,000 because closing them feels bad.',
      steps: [
        {
          label: 'Twelve winners, cut early',
          detail: 'At ₹3,000 each rather than letting them work',
          compute: { fn: 'multiply', a: 3000, b: 12, dp: 0 },
        },
        {
          label: 'Eight losers, held past the plan',
          detail: '₹12,000 each instead of the ₹5,000 you decided on',
          compute: { fn: 'multiply', a: -12000, b: 8, dp: 0 },
        },
        {
          label: 'Where that leaves you',
          detail: 'A 60% win rate, and a loss',
          compute: { fn: 'literal', value: -60000 },
        },
        {
          label: 'The same 20 trades, plan honoured',
          detail: '12 wins at ₹7,500, 8 losses at the planned ₹5,000',
          compute: { fn: 'literal', value: 50000 },
        },
        {
          label: 'What the two habits cost',
          detail: 'Same entries, same win rate, opposite result',
          compute: { fn: 'literal', value: 110000 },
        },
      ],
      conclusion:
        'The entries were never the problem. Two exit habits turned a working method into a losing year.',
    },
    {
      kind: 'predict',
      prompt:
        'You hold a share down 40%. You would not buy it today at this price. What does the ₹1,00,000 you originally paid tell you about what to do?',
      options: [
        'You should wait until it recovers to what you paid',
        'Nothing — the price you paid is not a fact about the company',
        'You should buy more to reduce your average',
      ],
      correct: 1,
      reveal:
        'Nothing at all. Your purchase price exists in your records and nowhere else — the company does not know it, the market does not know it, and no future price is influenced by it. "Waiting to get back to what I paid" is treating your own accounting as though it were a feature of the world. The test that cuts through this in two seconds is: knowing what I know now, would I buy this today at this price? If the answer is no, you are holding it for a reason that only exists inside your own head.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'You bought a stock expecting it to double in two years. It is up 20% after two months, right on plan. You feel a strong urge to sell now and lock in the gain. Is that urge a good reason to sell?',
      options: [
        'Yes — a bird in hand is worth more than one in the bush',
        'No — if the original reason for holding is still true, this urge is the same bias, just aimed the other way',
        'Yes, because 20% in two months is unusually fast',
      ],
      correct: 1,
      reveal:
        'No. If the plan is still true, the urge to sell early is not really about the stock. It is loss aversion again, just protecting a small gain instead of avoiding a loss. The test is the same one already given: would you buy it today, at this price, knowing what you know now?',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'three-down-days', symbol: 'RELIANCE.NS' },
      takeaway:
        'The folklore says a fall is due a bounce. Read what actually followed one — "it has to come back" is a feeling, and this is the measurement.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Averaging down is the same error with arithmetic attached',
      md:
        'Buying more of a falling holding lowers your average price, which feels like progress and is a re-labelling.\n\nWhat actually happened is that you increased the size of a position whose thesis is failing, using the fact that it is failing as the reason.\n\nThere is a legitimate version — you planned to build the position in stages, before you entered, and wrote it down. If the decision arrived after the fall, it is not that.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A stock is up 15% after one month, exactly matching the plan you wrote down before buying it. You feel an urge to sell now and bank the gain. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Sell — a gain in hand beats waiting for more',
              'Check whether your original reason for holding is still true before deciding anything',
              'Sell half to feel safe either way',
            ],
            correct: 'Check whether your original reason for holding is still true before deciding anything',
          },
          explanation:
            'Check the reason first. An urge to lock in a gain early is not itself a reason — it is the same comfort-seeking bias this lesson names, just running the other way.',
        },
        {
          prompt:
            'Twelve winners at ₹3,000 and eight losers at ₹12,000. What is the net result, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: -60000, tolerance: 500, unit: '₹' },
          explanation:
            '₹36,000 of gains against ₹96,000 of losses is minus ₹60,000, on a 60% win rate. This is exactly the arithmetic from the expectancy lesson, arriving through a different door: the sizes matter more than the frequency, and the disposition effect attacks precisely the sizes.',
        },
        {
          prompt:
            'Sort each reason for holding a losing position.',
          type: 'classify',
          spec: {
            categories: ['A real reason', 'Not a reason'],
            items: [
              { label: 'The original thesis is still intact', category: 'A real reason' },
              { label: 'I would buy it today at this price', category: 'A real reason' },
              { label: 'I want to get back to what I paid', category: 'Not a reason' },
              { label: 'It has fallen so much it must bounce', category: 'Not a reason' },
            ],
          },
          explanation:
            'The two real reasons are about the company and the future. The two false ones are about your own purchase price and a feeling that a fall creates an obligation to recover. Neither is known to anybody except you. That is a good test in general: if the reason would mean nothing to a stranger looking at the same holding, it is not a reason.',
        },
        {
          prompt:
            'You must sell one of two holdings. A is up 40%, B is down 40%, and you rate B’s prospects lower. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Sell A — take the profit while it is there',
              'Sell B — prospects decide, and the purchase prices are irrelevant',
              'Sell half of each',
            ],
            correct: 'Sell B — prospects decide, and the purchase prices are irrelevant',
          },
          explanation:
            'Sell B. You have already judged it the worse thing to own, and the only argument for keeping it is that selling makes a paper loss real. In India there is even a tax argument for booking the loss, since it can offset gains. The third answer is what people actually do — it splits the difference so that neither decision has to be faced, and it leaves you holding the one you like least.',
        },
      ],
    },
  ],
};

export default lesson;
