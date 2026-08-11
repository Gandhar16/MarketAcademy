import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — volume
 *
 * Volume is the second most looked-at number on a chart and the most casually
 * interpreted. "Volume confirms the move" is said constantly and almost never
 * defined, which makes it unfalsifiable — a rise on high volume confirms
 * strength, a rise on low volume shows there is no selling pressure, and both
 * sentences are available at all times.
 *
 * WHAT THIS LESSON ACTUALLY TEACHES
 *
 *   1. Volume counts TRADES, and every trade has a buyer and a seller. There is
 *      no such thing as more buyers than sellers, and the phrase should trigger
 *      an alarm whenever it is heard.
 *   2. Comparing raw volume across days is meaningless without a baseline.
 *   3. India publishes DELIVERY volume separately, which is genuinely more
 *      informative than total volume and is almost never taught.
 *   4. The one thing volume reliably tells you is how expensive it will be to
 *      get out — which is the least exciting and most useful use of it.
 */
export const lesson: Lesson = {
  id: 'in-t2-volume',
  tier: 'T2',
  market: 'IN',
  title: 'What volume adds, and what it does not',
  summary:
    'Every trade has a buyer and a seller, so "more buyers than sellers" is not a thing. What is left is a baseline comparison, a delivery figure, and a very good estimate of your exit cost.',
  plainSummary:
    'Charts show how many shares changed hands each day. This explains what that number can tell you and the popular things it cannot.',
  objectives: [
    'Explain why "more buyers than sellers" cannot describe any real trade',
    'Compare a day’s activity against a baseline rather than against another day',
    'Say what India’s delivery figure adds that the headline number does not',
    'Estimate whether a position can be exited without moving the price',
  ],
  prerequisites: ['in-t1-reading-candles'],
  estimatedMinutes: 15,
  introduces: ['volume', 'liquidity', 'market-impact', 'slippage', 'delivery', 'intraday', 'candle', 'base-rate', 'moving-average'],
  skills: ['volume', 'liquidity', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A commentator says the share rose because "there were more buyers than sellers". How many shares were bought that day, compared with the number sold?',
      options: ['More were bought', 'More were sold', 'Exactly the same number'],
      correct: 2,
      reveal:
        'Exactly the same number, always, on every day, in every market. A trade requires two sides, so bought and sold are the same quantity by construction. What changes is not the count but the URGENCY — whether buyers were willing to lift the asking price to get filled, or sellers were willing to hit the bid. That is a real and useful distinction. "More buyers than sellers" is not a simplification of that. It is a sentence that cannot be true, and hearing it says the speaker has not thought about the mechanism.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What the number is',
      md:
        'Volume is a count of shares that changed hands. Nothing else.\n\nIt has **no direction** in it. A day of heavy selling and a day of heavy buying look identical on the volume bar, because they are the same event described from two sides.\n\nWhat it does measure is **participation** — how many people cared enough to act. That is worth knowing, and it is a much smaller claim than the one usually made for it.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Walk a large order through the book. The volume you generate is the same whichever side you are on — what differs is how far you move the price to get filled.',
    },
    {
      kind: 'example',
      title: 'A big day, or an ordinary one?',
      setup:
        'A share trades 4,20,000 shares today. Is that a lot? The question is unanswerable without a baseline, so here is the arithmetic that makes it answerable. Its average over the last 20 sessions is 2,80,000 shares.',
      steps: [
        {
          label: "Today's activity",
          detail: 'The raw number, which on its own says nothing at all',
          value: '4,20,000',
        },
        {
          label: 'The 20-day baseline',
          detail: 'What an ordinary day looks like for this particular share',
          value: '2,80,000',
        },
        {
          label: 'Today as a multiple of ordinary',
          detail: '4,20,000 divided by 2,80,000. THIS is the number worth reading',
          compute: { fn: 'literal', value: 1.5 },
        },
        {
          label: 'What your 5,000 shares are, against today',
          detail: 'Your position as a share of the day’s activity',
          compute: { fn: 'literal', value: 1.19 },
        },
        {
          label: 'Cost of getting out at this size',
          detail: 'Charges alone, before any price impact from your own selling',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 1400, quantity: 5000 },
        },
      ],
      conclusion:
        'One and a half times normal is a real increase and not a dramatic one — and your 5,000 shares are about 1% of a day, which is exitable without a fuss.',
    },
    {
      kind: 'predict',
      prompt:
        'A different share averages 40,000 shares a day and you hold 20,000 of them. Work out the ratio before you look. What should you expect on the way out?',
      options: [
        'No problem — it trades every day',
        'You are half a day’s activity, so selling will move the price against you',
        'It depends entirely on the news that day',
      ],
      correct: 1,
      reveal:
        'You are half a normal day, and that is the single most useful thing volume tells you. Selling that position is not one decision — it is several days of selling, or one day of accepting materially worse prices as you work down the book. This is the calculation almost nobody does before buying a small company, and it is why a position that looked cheap becomes a position you cannot leave. The entry is always easy. Volume tells you about the exit, and the exit is where the trouble is.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The Indian figure worth knowing',
      md:
        'Indian exchanges publish **delivery volume** separately: the share of the day’s activity where shares actually moved into somebody’s account, rather than being bought and sold again the same day.\n\nA day that is 80% intraday churn and a day that is 60% delivery look identical on a standard volume bar and are not the same event at all.\n\nIt is not a prediction and nothing here says it is. It is simply a genuinely different piece of information, freely published, and almost never mentioned in courses that spend hours on volume.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'gap-up', symbol: 'RELIANCE.NS' },
      takeaway:
        'Gaps are the highest-participation events on any chart. Read what actually followed them here, then decide what "volume confirms the move" was worth.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: '"Volume confirms the move"',
      md:
        'Ask what would count as DISCONFIRMING it. Usually nothing does.\n\nA rise on heavy volume is called conviction. A rise on light volume is called an absence of sellers. Both readings are available at all times, so the rule cannot be wrong — which means it also cannot be evidence.\n\nIf you want to use volume in a rule, state the rule with a number in it and test it, exactly as you did with the named patterns.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A share averages 3,00,000 shares a day. Today it trades 7,50,000. How many times its ordinary activity is that?',
          type: 'compute',
          spec: { metric: 'literal', value: 2.5, tolerance: 0.05, unit: 'x' },
          explanation:
            '7,50,000 ÷ 3,00,000 = 2.5 times. The ratio is the only readable form of this number, because raw volume differs by a factor of thousands between a large company and a small one. Any statement about volume that does not carry a baseline is not a statement about anything.',
        },
        {
          prompt:
            'Sort each claim by whether the day’s volume figure can support it.',
          type: 'classify',
          spec: {
            categories: ['Volume can support this', 'Volume cannot support this'],
            items: [
              { label: 'More people than usual traded today', category: 'Volume can support this' },
              { label: 'This position will be costly to exit', category: 'Volume can support this' },
              { label: 'There was more buying than selling', category: 'Volume cannot support this' },
              { label: 'The move will continue tomorrow', category: 'Volume cannot support this' },
            ],
          },
          explanation:
            'The two it supports are both about participation and liquidity, and neither is a forecast. The third is arithmetically impossible — every share bought was sold by somebody. The fourth is the claim everybody actually wants, and the number simply does not contain it. Keeping those two columns apart removes most of what is said about volume on financial television.',
        },
        {
          prompt:
            'You want to buy 50,000 shares of a company that trades 60,000 shares on an average day. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Buy it in one order — the price is what it is',
              'Reduce the position to something the market can absorb',
              'Buy it over ten days using market orders at the close',
            ],
            correct: 'Reduce the position to something the market can absorb',
          },
          explanation:
            'Reduce it. A position approaching a full day of activity has an exit cost that can exceed anything the idea was likely to earn. That cost arrives precisely when you most want out. The third answer is better than the first and still leaves you holding an unexitable position for ten days. Position size is not only about how much you can lose on the price — it is also about whether the market can take it back from you.',
        },
      ],
    },
  ],
};

export default lesson;
