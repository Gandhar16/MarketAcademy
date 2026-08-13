import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — one trade, end to end
 *
 * The lesson that assembles stage 2. Everything in it has been taught
 * separately: order types, costs, candles, contract notes, settlement. Nobody
 * has yet seen them happen in sequence on one trade, and a learner who can
 * recite each piece often still cannot say what order they occur in.
 *
 * The sequence itself is the content. In particular, the decisions that must
 * happen BEFORE the order is placed — size and exit — are placed before it here,
 * because in a real account they will happen after unless you have practised
 * them happening before.
 */
export const lesson: Lesson = {
  id: 'in-t1-first-trade',
  tier: 'T1',
  market: 'IN',
  title: 'One trade, end to end',
  summary:
    'Everything in this stage, in the order it actually happens: decide, size, place, fill, hold, exit, settle, check the note.',
  plainSummary:
    'You have learnt the pieces separately. This puts them together into one complete trade, in the order they really happen.',
  objectives: [
    'List the steps of a trade in the order they occur',
    'Say which decisions must be made before the order is placed',
    'Compute the full round-trip cost and the move needed to cover it',
    'Build a complete order with a protective exit attached',
  ],
  prerequisites: ['in-t1-contract-note'],
  estimatedMinutes: 14,
  introduces: ['round-trip', 'breakeven', 'position', 'market-order', 'limit-order', 'stop-loss', 'trigger-price', 'slippage', 'delivery', 'turnover'],
  skills: ['execution', 'costs', 'process'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You have decided to buy a share. Of these four decisions, which one should come LAST?',
      options: [
        'How many shares to buy',
        'Where you will get out if you are wrong',
        'Which order type to use',
        'Whether the idea is any good',
      ],
      correct: 2,
      reveal:
        'The order type. It is a question about execution, and it only makes sense once you know what you are executing. The order most people actually use is: pick a share, buy it, then think about size, and think about the exit only when it is already going wrong. Reversing that is most of what separates a process from a habit. Decide whether the idea is good, decide where it is disproved, let that decide the size, and only then ask how to get the order in.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'TradeSequenceExplainer',
      props: {},
      takeaway:
        'Step through it once. The habit runs one direction; the process runs the other — same eight steps, different order.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The eight steps, in order',
      md:
        '**Before the order.** 1. Is the idea any good? 2. Where does it stop being good — the exit level? 3. How many shares does that exit distance allow?\n\n**The order.** 4. Which type, given whether you need certainty of fill or of price? 5. Placed, and filled.\n\n**After.** 6. Hold, with the exit already sitting in the market. 7. Exit, for a reason that was in the plan. 8. Settlement, and then check the note.\n\nSteps 1 to 3 are the ones people skip. They are also the only ones that are free.',
    },
    {
      kind: 'widget',
      component: 'BreakevenSlider',
      props: { market: 'IN', product: 'delivery', price: 1400, minValue: 20_000, maxValue: 500_000 },
      takeaway:
        'Before any of this, the move you need just to get back to level. A trade smaller than this needs is a trade that starts behind.',
    },
    {
      kind: 'example',
      title: 'One complete trade, every number',
      setup:
        'You have ₹2,00,000. You want to buy RELIANCE at ₹1,400 and you have decided the idea is wrong below ₹1,352. You will risk 1% of the account. Here is the whole thing.',
      steps: [
        {
          label: 'Step 2 — the rupees you will risk',
          detail: '1% of the account, decided before you looked at the price',
          compute: { fn: 'riskAmount', equity: 200000, riskPercent: 1 },
        },
        {
          label: 'Step 3 — the size that allows',
          detail: 'Risk budget divided by ₹48 of distance to the exit',
          compute: { fn: 'sizeFromStop', equity: 200000, riskPercent: 1, entry: 1400, stop: 1352 },
        },
        {
          label: 'What that position is worth',
          detail: '41 shares at ₹1,400. Note it is under a quarter of the account',
          compute: { fn: 'multiply', a: 1400, b: 41, dp: 0 },
        },
        {
          label: 'Steps 4 to 7 — the full cost of getting in and out',
          detail: 'Both legs, every statutory charge',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 1400, quantity: 41 },
        },
        {
          label: 'The move that gets you to level',
          detail: 'Before a single rupee of profit exists',
          compute: { fn: 'breakevenPercent', product: 'delivery', price: 1400, quantity: 41 },
        },
      ],
      conclusion:
        'Forty-one shares, ₹2,000 at risk, and a small move needed just to break even. Every number decided before the order existed.',
    },
    {
      kind: 'predict',
      prompt:
        'Same account, same 1% risk, but you put the exit at ₹1,376 instead — half the distance. Work out the new size before you look.',
      options: ['About 41 shares', 'About 83 shares', 'About 21 shares', 'It does not change'],
      correct: 1,
      reveal:
        'About 83 shares — twice as many. Half the distance to the exit means half the risk per share, so the same ₹2,000 buys twice the position. This is worth pausing on, because it cuts both ways. A tighter exit lets you hold more, and it also gets hit far more often by ordinary noise. You have not reduced your risk by moving the exit closer; you have moved it from one place to another. The rupees at stake are identical by construction, which is the entire point of sizing this way.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'Following the process, you compute your size from a 1% risk budget of ₹1,000 and a stop distance of ₹1,200 per share. What size does the formula give you?',
      options: [
        '1 share, rounded up so you still have a position',
        'Less than 1 share — this trade does not fit your risk budget at all',
        'The formula does not work in this case',
      ],
      correct: 1,
      reveal:
        '₹1,000 ÷ ₹1,200 is a fraction, and a fraction of a share is not a real order. This is not a flaw in the method. It is correctly telling you the trade does not fit inside your risk budget as planned. Rounding up to force a whole share quietly breaks the very limit the sizing was meant to protect.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'order-gauntlet',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The exit goes in with the entry',
      md:
        'Not later. Not when it starts moving against you. **At the same time.**\n\nThe reason is not discipline in the abstract. The moment a position is losing money is the worst moment anybody has ever chosen an exit level, and you will not be an exception.\n\nA protective order resting in the market costs nothing while it sits there and removes one decision from the hardest moment you will have. Place it in the same minute you place the entry.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Your 1% risk budget is ₹1,500 and your planned stop distance is ₹1,800 per share. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Round up to 1 share anyway, since it is close enough',
              'Do not take the trade at this size, or use a tighter stop that fits the budget',
              'Double the risk budget to make the trade fit',
            ],
            correct: 'Do not take the trade at this size, or use a tighter stop that fits the budget',
          },
          explanation:
            'Do not force it. Rounding up to one share breaks the risk limit you set for a reason. Doubling the budget on the spot is the same mistake with extra steps — a limit decided after seeing it does not fit is not a limit.',
        },
        {
          prompt:
            'You buy 41 shares at ₹1,400 and sell later at the same price. What did the round trip cost you, in rupees?',
          type: 'compute',
          spec: {
            metric: 'roundTripCostAmount',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 1400,
            quantity: 41,
            tolerance: 1,
          },
          explanation:
            'A trade that went nowhere still cost you money, and this number is why the first question about any idea is whether the expected move is comfortably bigger than it. Doing this sum before entering, rather than reading it off a contract note afterwards, is the difference between a plan and a hope.',
        },
        {
          prompt:
            'Put the steps of a trade in the order they should happen.',
          type: 'classify',
          spec: {
            categories: ['Before the order', 'After the order'],
            items: [
              { label: 'Decide where the idea is disproved', category: 'Before the order' },
              { label: 'Work out the position size', category: 'Before the order' },
              { label: 'Watch the fill price', category: 'After the order' },
              { label: 'Check the contract note', category: 'After the order' },
            ],
          },
          explanation:
            'The two decisions in the first column are free, take a minute, and are the two people skip. Everything in the second column is observation — by then the choices are made. A process is not a personality trait; it is the habit of doing the first column before your hand reaches the button.',
        },
        {
          prompt:
            'Build the protective exit for 41 RELIANCE shares bought at ₹1,400, risking no more than ₹48 a share, with the order type that guarantees you get out.',
          type: 'construct',
          spec: {
            instrument: { symbol: 'RELIANCE.NS', market: 'IN', tickSize: 0.05 },
            lastPrice: 1400,
            availableCash: 200_000,
            require: { side: 'sell', type: 'SL-M', triggerBetween: [1352, 1396], maxRiskPerUnit: 48 },
          },
          explanation:
            'A SELL SL-M with the trigger inside the band and on a multiple of the ₹0.05 tick. SL-M rather than SL: a stop-limit can trigger and then fail to fill, in exactly the fast market you needed it in. An SL-M gets you out at a bad price, which beats not getting out at all. This is step 4 and step 6 of the sequence, done in one action.',
        },
      ],
    },
  ],
};

export default lesson;
