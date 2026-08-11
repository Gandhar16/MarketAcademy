import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — what moves a price
 *
 * The lesson that has to defuse the single most expensive beginner belief: that
 * good news makes a price rise. It does not. Good news that is BETTER THAN
 * EXPECTED makes a price rise, and by the time a beginner reads the news the
 * expectation has already moved.
 *
 * That distinction is the whole lesson, and it is best taught by a case where
 * everything went right and the price fell — because the explanation "the market
 * is irrational" is available and wrong, and a learner who reaches for it will
 * reach for it for years.
 *
 * The lesson deliberately does not claim markets are efficient. It makes the
 * much weaker and completely defensible claim that news you have already read
 * is not private information.
 */
export const lesson: Lesson = {
  id: 'in-t0-what-moves-price',
  tier: 'T0',
  market: 'IN',
  title: 'What actually moves a price',
  summary:
    'Not good news — news better than expected. Everything you have already read is in the price, which is why a great result can be followed by a fall.',
  plainSummary:
    'Prices move when reality differs from what people were expecting. This explains why good news does not always push a price up.',
  objectives: [
    'Explain why a price moves on the difference from expectation, not on the news itself',
    'Say what it means for information to be already in the price',
    'Describe why an ordinary buyer is rarely first to any public information',
    'Decide whether a given piece of information could still be an advantage',
  ],
  prerequisites: ['in-t0-what-is-a-share'],
  estimatedMinutes: 11,
  introduces: ['price', 'liquidity', 'order-book', 'bid', 'ask', 'volume'],
  skills: ['foundations', 'price-formation'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A company announces profits are up 20% on last year — a genuinely excellent result. The share falls 6% that morning. What is the most likely explanation?',
      options: [
        'The market is irrational',
        'People were expecting more than 20%',
        'Somebody large sold for unrelated reasons',
      ],
      correct: 1,
      reveal:
        'People expected more. This is the mechanism behind almost every "but the news was good" moment, and understanding it early saves years of confusion. The price before the announcement already contained everybody’s guess about the result. If the crowd was expecting 25% and got 20%, then relative to what was already priced in, this is bad news. The number that moves a price is never the result. It is the result minus what was already assumed, and that second quantity is invisible on any chart.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A price is a meeting point, not a fact',
      md:
        'A **price** is simply the level at which somebody willing to buy met somebody willing to sell, most recently.\n\nIt is not a measurement of what a company is worth. Nobody computed it. It is the outcome of the last argument between two people, and it changes when the balance of willingness changes.\n\nSo "why did it move" is always one question: **what changed about what people are willing to do**. The usual answer is that they learnt something they were not expecting.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Every price is made of resting offers from real people. Push a large order through and watch the price move — that is all a price move ever is.',
    },
    {
      kind: 'example',
      title: 'Why you are never first',
      setup:
        'A results announcement lands at 9:00 a.m., before the market opens. You read it at 9:20 and place a buy order the moment trading starts. Here is the queue you are in.',
      steps: [
        {
          label: 'Automated systems reading the filing',
          detail: 'Parsing the numbers directly, in milliseconds, before any human',
          value: '~0.001 seconds',
        },
        {
          label: 'Professional desks with analysts on it',
          detail: 'Paid to have a view ready before the announcement, not after',
          value: '~10 seconds',
        },
        {
          label: 'News wires and financial television',
          detail: 'Where most people first hear anything at all',
          value: '~2 minutes',
        },
        {
          label: 'You, having read it and decided',
          detail: 'By now the price already reflects the first three rows',
          value: '~20 minutes',
        },
        {
          label: 'What your trade costs, whatever it achieves',
          detail: 'Charges on a buy and a sell at this size, paid regardless',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 1400, quantity: 100 },
        },
      ],
      conclusion:
        'You are not competing to react to the news. You are competing against people who already reacted.',
    },
    {
      kind: 'predict',
      prompt:
        'Given that queue, which of these could still genuinely be an advantage for an ordinary person?',
      options: [
        'Reading the news faster',
        'Being willing to hold for five years when most people cannot',
        'Watching the chart more closely during the day',
      ],
      correct: 1,
      reveal:
        'The five years. You will never win the speed race and there is no version of the effort where you do. What you have that a professional fund often does not is the freedom to be wrong for a long time without anybody withdrawing their money. A fund that underperforms for two years loses its clients; you can simply wait. That is a real, structural advantage and it is almost the only one on offer. Every strategy that requires you to be faster or better informed is a strategy competing where you are weakest.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '1d', range: '6mo' },
      mode: 'view',
      takeaway:
        'Six real months. Every large single-day move here is a day when reality differed from expectation — and none of them were predictable the morning before.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: '"Buy on good news"',
      md:
        'By the time news is news, it is public. Public information is in the price, because thousands of people with faster access already acted on it.\n\nThis is not a claim that the price is always right. It is the much smaller claim that **you are not going to be first**, and a strategy whose only edge is reacting to headlines is one where being late is fatal.\n\nWhat is genuinely useful is having a view BEFORE the announcement, and being prepared to be wrong about it.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You buy 100 shares at ₹1,400 on a headline and sell three days later at the same price. What have those charges cost you, in rupees?',
          type: 'compute',
          spec: {
            metric: 'roundTripCostAmount',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 1400,
            quantity: 100,
            tolerance: 1,
          },
          explanation:
            'The price did nothing and the trade still cost you money. Every reaction to a headline carries this, whether or not the reaction was right. It is charged twice: once going in and once coming out. A strategy of trading the news has to beat that cost every single time before it earns anything at all.',
        },
        {
          prompt:
            'Sort each piece of information by whether it is likely to already be in the price.',
          type: 'classify',
          spec: {
            categories: ['Already in the price', 'Might not be'],
            items: [
              { label: 'A results announcement from this morning', category: 'Already in the price' },
              { label: 'A newspaper article about the industry', category: 'Already in the price' },
              { label: 'Your own view that a trend will last a decade', category: 'Might not be' },
              { label: 'A television analyst’s recommendation', category: 'Already in the price' },
            ],
          },
          explanation:
            'Anything published is in the price, including the recommendation — especially the recommendation, since everybody watching heard it at once. The only row that might not be is a genuine difference of OPINION about the future, held over a horizon most participants do not care about. Notice that it is not information at all. It is a judgement, and it may well be wrong.',
        },
        {
          prompt:
            'A share falls 8% and you can find no news at all explaining it. Decide what to conclude.',
          type: 'decision',
          spec: {
            options: [
              'Something is being hidden',
              'Prices move for reasons that are often not public and sometimes not interesting',
              'It is a buying opportunity, since nothing has changed',
            ],
            correct: 'Prices move for reasons that are often not public and sometimes not interesting',
          },
          explanation:
            'Often there is no story. A large holder needed cash, a fund rebalanced, somebody’s stop was triggered and set off others. Not every move has a narrative, and the human urge to supply one is where a great deal of bad reasoning starts. The third answer is the dangerous one: "nothing has changed" is an assumption about information you do not have, dressed up as analysis.',
        },
      ],
    },
  ],
};

export default lesson;
