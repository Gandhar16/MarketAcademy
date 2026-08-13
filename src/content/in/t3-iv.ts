import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — implied volatility and the crush
 *
 * The VIX lesson taught the index. This teaches the same quantity per contract:
 * what a single price implies about expected movement, and what happens to it
 * when the uncertainty it was pricing resolves.
 *
 * THE ONE IDEA THAT HAS TO LAND
 *
 * Implied volatility is not a measurement of the world. It is a restatement of
 * a price. "IV is 45%" and "this contract is expensive" are the same sentence
 * in different units, and a learner who holds that firmly cannot be sold the
 * idea that high IV is a signal to buy.
 *
 * The embedded game does the work the prose cannot: the learner buys the
 * straddle before results, gets the direction right, and loses. Being told that
 * happens produces a nod. Watching it happen to your own position produces a
 * memory.
 */
export const lesson: Lesson = {
  id: 'in-t3-iv',
  tier: 'T3',
  market: 'IN',
  title: 'Implied volatility and the crush',
  summary:
    'A price, restated as an expectation. Watch what a known event does to it before and after — and why being right on direction is not enough to survive that.',
  plainSummary:
    'The price of these contracts already contains a guess about how much things will move. This shows what happens to that guess when the news finally arrives.',
  objectives: [
    'Explain what a quoted volatility figure actually restates',
    'Say why contracts get expensive before a known event',
    'Describe what happens to a bought position the moment uncertainty resolves',
    'Compute the move needed to break even on a two-sided position',
  ],
  prerequisites: ['in-t3-greeks'],
  estimatedMinutes: 16,
  introduces: ['volatility', 'option', 'premium', 'expiry', 'strike-price', 'spot-price', 'time-value', 'india-vix', 'moneyness', 'underlying'],
  skills: ['volatility', 'options-pricing', 'event-risk'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A contract is quoted at ₹180. Somebody says "its implied volatility is 22%". What have they told you that the ₹180 did not?',
      options: [
        'How much the underlying will actually move',
        'Nothing new — it is the same fact in different units',
        'Whether the contract is a good buy',
      ],
      correct: 1,
      reveal:
        'Nothing new. Implied volatility is the price, restated. You take the ₹180, run it backwards through the pricing model, and ask what expected movement would produce exactly that number. So "IV is 22%" and "this costs ₹180" are one sentence in two units. That matters because it kills a very common mistake. High implied volatility is not a signal about the world; it is a report that contracts are expensive. Buying because volatility is high is buying because things are dear.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'IvCrushExplainer',
      props: {},
      takeaway:
        'Step through it once. The share moved 3%. The price of uncertainty fell further — that is what decided the outcome.',
    },
    {
      kind: 'widget',
      component: 'GreeksExplorer',
      props: { strike: 24000, spot: 24000, days: 21, iv: 14, type: 'call' },
      takeaway:
        'Hold the price and the days completely still. Drag volatility from 14 to 40 and back. Nothing about the market moved — only what people would pay.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why a known date makes things expensive',
      md:
        'Everybody can see the calendar. A results announcement, a policy decision, an election count — the date is public, and so is the fact that the price could jump on it.\n\nSo demand for contracts rises into the event, and the quoted volatility rises with it. You are not being cheated. You are being charged for a genuinely larger range of outcomes.\n\nThe moment the news is public, that range collapses to whatever actually happened. And the price of every contract collapses with it.',
    },
    {
      kind: 'example',
      title: 'The same position, the evening before and the morning after',
      setup:
        'A share is at ₹1,400 with results due tomorrow and 10 days left on the contracts. You buy both a 1,400 call and a 1,400 put — a bet on movement in either direction. Volatility is at 55 the evening before and settles to 22 the morning after. The share opens 3% higher.',
      steps: [
        {
          label: 'The call, the evening before',
          detail: 'Priced for a large move, because everybody knows one is possible',
          compute: { fn: 'optionPrice', spot: 1400, strike: 1400, days: 10, ivPercent: 55, type: 'call' },
        },
        {
          label: 'The put, the evening before',
          detail: 'The same story on the other side',
          compute: { fn: 'optionPrice', spot: 1400, strike: 1400, days: 10, ivPercent: 55, type: 'put' },
        },
        {
          label: 'The call, the morning after',
          detail: 'Share at ₹1,442, one day fewer, and expectations down to 22',
          compute: { fn: 'optionPrice', spot: 1442, strike: 1400, days: 9, ivPercent: 22, type: 'call' },
        },
        {
          label: 'The put, the morning after',
          detail: 'It moved the wrong way for this leg, and got cheaper on top',
          compute: { fn: 'optionPrice', spot: 1442, strike: 1400, days: 9, ivPercent: 22, type: 'put' },
        },
        {
          label: 'What the pair cost you',
          detail: 'Both legs together, before against after',
          compute: { fn: 'literal', value: -49.5 },
        },
      ],
      conclusion:
        'The share moved 3% and the position lost money, because you paid for a move much larger than the one you got.',
    },
    {
      kind: 'predict',
      prompt:
        'Same setup, same two legs costing about ₹114 together. Work it out before you look. Roughly how far does the share have to move, either way, just to break even at expiry?',
      options: ['About 1%', 'About 3%', 'About 8%', 'Any move at all makes money'],
      correct: 2,
      reveal:
        'About 8%. The two legs cost ₹114 between them, and at expiry only one of them is worth anything, so that one has to be worth the whole ₹114. On a ₹1,400 share that is a move of roughly 8% in one direction. This is the number nobody computes before buying a position like this. It feels like a bet that something will happen. It is really a bet that something LARGE will happen — larger than the market already priced in, which is the hard part.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'On the same expiry, a NIFTY put struck well below the current price shows a HIGHER implied volatility than an at-the-money put. Does that mean the market expects bigger moves specifically on the downside?',
      options: [
        'No — implied volatility must be identical across every strike on the same expiry',
        'It often does reflect that — more demand for downside protection can push far-out put prices, and their IV, higher',
        'Yes, but only because of a pricing error',
      ],
      correct: 1,
      reveal:
        'It often does. Demand for protection against a crash is usually stronger than demand for an equivalent upside bet, so far out-of-the-money puts can trade at a higher implied volatility than at-the-money contracts. This pattern has a name, volatility skew, and it is a real, persistent feature of pricing.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'earnings-roulette',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: '"Buy before earnings, it always moves"',
      md:
        'It usually does move. That is not the question.\n\nThe question is whether it moves **more than the price already assumed**, and the historical record says that on average it does not. The people setting these prices know the date too.\n\nSelling into that expensive volatility is the mirror trade, and it is not free money either — it is a small, reliable income with an occasional very large loss attached. Both sides are real positions. Neither is a trick.',
    },
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 1400,
        editable: true,
        legs: [
          { type: 'call', quantity: 1, strike: 1400, premium: 57 },
          { type: 'put', quantity: 1, strike: 1400, premium: 57 },
        ],
      },
      takeaway:
        'The two-legged position drawn out. Find the two points where the line crosses zero — everything between them is a loss, and that gap is what you paid.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Two NIFTY puts share the same expiry. The far out-of-the-money put has a noticeably higher implied volatility than the at-the-money put. Decide what this most likely reflects.',
          type: 'decision',
          spec: {
            options: [
              'A pricing error somewhere in the chain',
              'Stronger demand for downside protection at that strike, a real and common pattern',
              'Nothing — implied volatility is always identical across strikes',
            ],
            correct: 'Stronger demand for downside protection at that strike, a real and common pattern',
          },
          explanation:
            'Stronger demand for protection. This is volatility skew — implied volatility genuinely varies by strike, and downside puts often carry more of it.',
        },
        {
          prompt:
            'You pay ₹120 in total for a call and a put, both at a level of ₹2,000. At expiry, what is the lowest price at which you break even?',
          type: 'compute',
          spec: { metric: 'literal', value: 1880, tolerance: 5, unit: '₹' },
          explanation:
            '₹2,000 − ₹120 = ₹1,880. At expiry only one leg has any value, so it must cover the cost of both. There is a matching level above at ₹2,120, and everything between the two is a loss. Working out that band before you enter turns a vague feeling that "something will happen" into a testable claim about how much.',
        },
        {
          prompt:
            'Results are announced. The share jumps 4% in the direction you predicted, and your bought call has lost money. Decide the most likely cause.',
          type: 'decision',
          spec: {
            options: [
              'The broker mispriced it',
              'Implied volatility collapsed once the uncertainty was resolved',
              'You must have bought the wrong side',
            ],
            correct: 'Implied volatility collapsed once the uncertainty was resolved',
          },
          explanation:
            'The volatility collapse. Before the announcement you were paying for a wide range of outcomes; afterwards there is no uncertainty left to pay for, and every contract reprices downward at once. A 4% move is often not enough to cover that. Nothing was mispriced and nothing went wrong with your reasoning about direction — you simply had a second exposure, to the price of uncertainty itself, and it went against you.',
        },
        {
          prompt:
            'Sort each statement by whether a high volatility reading tells you it.',
          type: 'classify',
          spec: {
            categories: ['It tells you this', 'It does not tell you this'],
            items: [
              { label: 'Contracts are expensive right now', category: 'It tells you this' },
              { label: 'A wide range of outcomes is being priced', category: 'It tells you this' },
              { label: 'The price is about to fall', category: 'It does not tell you this' },
              { label: 'The move being priced will actually happen', category: 'It does not tell you this' },
            ],
          },
          explanation:
            'The first two are restatements of the price. The last two are predictions, and the number contains no direction and no promise. Every expensive mistake associated with this quantity comes from sliding across that line without noticing — reading a cost as a forecast, and buying because the forecast sounded exciting.',
        },
      ],
    },
  ],
};

export default lesson;
