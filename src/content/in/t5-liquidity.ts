import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — liquidity evaporating
 *
 * The final step of the course, and deliberately so. Every lesson before it has
 * assumed a market: a price, a counterparty, an exit. This is the one where all
 * three go away at once, and it is the assumption the other sixty-four steps
 * were quietly resting on.
 *
 * The three failures arrive together and each one worsens the others: the
 * spread widens, the book empties, and correlation goes to one so every holding
 * needs the same exit at the same moment. It ends by pointing back at position
 * sizing, which is the only thing that ever helped.
 */
export const lesson: Lesson = {
  id: 'in-t5-liquidity',
  tier: 'T5',
  market: 'IN',
  title: 'When the buyers simply leave',
  summary:
    'The last step, and the assumption every other one rests on. A market needs somebody on the other side, and occasionally there is nobody there at any price.',
  plainSummary:
    'Selling needs a buyer. This is about the rare days when the buyers step away, and what that means for everything you have learnt.',
  objectives: [
    'Describe the three failures that arrive together in a liquidity event',
    'Explain why an exit plan that assumes a normal spread is not a plan',
    'Compute the cost of exiting into a widened spread',
    'Decide what genuinely protects a portfolio against this',
  ],
  prerequisites: ['in-t4-correlation'],
  estimatedMinutes: 14,
  introduces: ['liquidity', 'spread', 'market-impact', 'slippage', 'order-book', 'circuit-limit', 'drawdown', 'volatility'],
  skills: ['edge-cases', 'liquidity', 'risk-management'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A serious market event arrives. Three things happen to your ability to sell. Which is the one people never anticipate?',
      options: [
        'Prices fall',
        'Everything falls together, so there is nothing to sell instead',
        'The gap between buying and selling widens enormously',
      ],
      correct: 2,
      reveal:
        'The spread. People expect prices to fall and are braced for it. What surprises them is that the cost of transacting multiplies at the same moment. Market makers widen their quotes or withdraw entirely, because nobody wants to be the person holding inventory in a falling market. So a share that normally costs a few paise to cross can cost several rupees, and a large position can be almost impossible to move at anything resembling the screen price. The fall is expected. The toll on the exit is not.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'SpreadExplosionExplainer',
      props: {},
      takeaway:
        'Step through it once. The exit that costs ₹1,750 on an ordinary Tuesday costs roughly ₹25,000 on the day you actually need it.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Now imagine two-thirds of these resting orders removed and the rest much further apart. Every exit strategy you have assumed a book like the one shown.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Three failures, arriving together',
      md:
        '**The spread widens.** Quoting becomes dangerous, so fewer people quote and the ones who do quote further apart.\n\n**The book thins.** Resting orders are pulled. A size that moved the price by paise now moves it by rupees.\n\n**Correlation goes to one.** Everything falls together, so you cannot sell one holding to protect another — they all need the same exit at the same moment.\n\nEach one makes the other two worse, which is why this is a different event rather than a bad day.',
    },
    {
      kind: 'example',
      title: 'The same exit, ordinary day and crisis day',
      setup:
        'You hold 5,000 shares of a mid-sized company at ₹1,400 and need to sell all of them. Compare an ordinary Tuesday with a day when the book has emptied.',
      steps: [
        {
          label: 'Ordinary day — average price you achieve',
          detail: 'Walking a normal book with a normal spread',
          compute: { fn: 'bookWalkAverage', side: 'sell', quantity: 5000 },
        },
        {
          label: 'Ordinary day — what the walk costs',
          detail: 'The slippage, in rupees, on the whole order',
          compute: { fn: 'bookWalkCost', side: 'sell', quantity: 5000 },
        },
        {
          label: 'Crisis day — the same order, three times the impact',
          detail: 'A thinner book means walking much further down it',
          compute: { fn: 'literal', value: -5250 },
        },
        {
          label: 'Plus a spread perhaps ten times normal',
          detail: 'Charged on top of the walk, across 5,000 shares',
          compute: { fn: 'multiply', a: -4, b: 5000, dp: 0 },
        },
        {
          label: 'And statutory charges, unchanged',
          detail: 'The one cost that does not get worse',
          compute: { fn: 'legCost', product: 'delivery', side: 'sell', price: 1400, quantity: 5000 },
        },
      ],
      conclusion:
        'The exit that cost about ₹1,750 on Tuesday costs roughly ₹25,000 on the day you actually need it.',
    },
    {
      kind: 'predict',
      prompt:
        'Given all of that, what is the only thing that reliably protects a portfolio here?',
      options: [
        'Better stops',
        'Holding a size you could exit slowly, and some cash',
        'Diversifying across more shares',
      ],
      correct: 1,
      reveal:
        'Size and cash. Stops do not work, because gaps and locked circuits jump over them and thin books fill them far away. Diversification does not work, because correlation goes to one exactly here. What survives is holding a position small enough that you are never forced to sell in a hurry, and holding some cash so that you are not selling to raise money. Both are dull, both cost you a little in the years when nothing happens, and they are the only two things on this list that function on the day.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'Does a liquidity event like this only threaten small, thinly traded shares, leaving large well-known index constituents unaffected?',
      options: [
        'Yes — large index shares always keep a normal spread and full depth',
        'No — spreads can widen and depth can thin even in large shares during a severe event, just by less than in small caps',
        'No, large shares are affected identically to small ones',
      ],
      correct: 1,
      reveal:
        "No. Large, liquid shares fare far better than small ones, and better is not the same as unaffected. In a genuine crisis even index constituents see wider spreads and thinner books than on an ordinary day, because market makers everywhere are pulling back at once. Liquidity is a matter of degree that gets worse for everyone in a crisis, not a switch that only turns off for small companies.",
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'circuit-breaker',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The assumption the whole course rests on',
      md:
        'Sixty-four steps taught you to read, size, plan and exit. Every one assumed a market on the other side.\n\nThat assumption holds almost always, and this is the lesson about the remainder. It is placed last because you can only see what it removes once you know what it removes.\n\nAnd the conclusion is the same one from step 12: **decide the loss you can accept before you enter, and let it set the size**. That rule is the only thing in this entire course that still works on the worst day.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A trader holds only large, well-known index shares and assumes they are fully immune to any liquidity event. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Correct — large shares never see the book thin out',
              'Incorrect — large shares are affected less severely, but not immune',
              'Correct, as long as the company is profitable',
            ],
            correct: 'Incorrect — large shares are affected less severely, but not immune',
          },
          explanation:
            'Incorrect. Large shares hold up better, but spreads still widen and books still thin for everyone in a genuine crisis.',
        },
        {
          prompt:
            'You must sell 5,000 shares at ₹1,400 into a crisis where the spread costs ₹4 a share. What does the spread alone cost, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 20000, tolerance: 200, unit: '₹' },
          explanation:
            '₹4 × 5,000 = ₹20,000, on a position worth ₹70,00,000 — before any price impact and before the fall itself. On an ordinary day that same spread would have been a few hundred rupees. This is the cost that appears in no plan, because everybody models the exit using the spread they see on a calm afternoon.',
        },
        {
          prompt:
            'Sort each protection by whether it works during a liquidity event.',
          type: 'classify',
          spec: {
            categories: ['Works', 'Does not work'],
            items: [
              { label: 'Having held a smaller position', category: 'Works' },
              { label: 'Holding some cash', category: 'Works' },
              { label: 'A stop-loss order', category: 'Does not work' },
              { label: 'Owning thirty different shares', category: 'Does not work' },
            ],
          },
          explanation:
            'The two that work were decided long before the event and cannot be arranged during it. The two that fail are the ones people rely on, and this stage has covered why. Stops need a market to execute in, and diversification needs the holdings to behave differently. Every protection worth having on the worst day is one you put in place on an ordinary one.',
        },
        {
          prompt:
            'You have finished the course. Decide the single habit most worth keeping.',
          type: 'decision',
          spec: {
            options: [
              'Reading charts carefully',
              'Deciding the loss you can accept before entering, and letting it set the size',
              'Finding better entry signals',
            ],
            correct: 'Deciding the loss you can accept before entering, and letting it set the size',
          },
          explanation:
            'Size, decided in advance. It is the only habit here that works when everything else has stopped working: the stop jumped, the circuit locked, the book empty, every holding falling at once. The other two are genuinely useful and they both assume a functioning market. This one does not, which is why it comes first in the course and last in it.',
        },
      ],
    },
  ],
};

export default lesson;
