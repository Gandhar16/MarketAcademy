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
  title: 'Why does the price move?',
  summary:
    'Not good news — news better than expected. Everything you have already read is in the price, which is why a great result can be followed by a fall.',
  plainSummary:
    'Prices move when reality differs from what people were expecting. This explains why good news does not always push a price up, and why a price move is not proof a company is good or bad.',
  objectives: [
    'Explain why a price moves on the difference from expectation, not on the news itself',
    'Say what it means for information to be already in the price',
    'Explain how genuinely good news can still come with a falling price',
    'Say why a price move is not proof of a company\'s quality',
  ],
  prerequisites: ['in-t0-what-is-a-share'],
  estimatedMinutes: 11,
  introduces: [],
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
      kind: 'widget',
      component: 'ExpectationGapExplainer',
      props: {},
      takeaway:
        'Step through it once. The exact same 20% result drives the price in opposite directions — watch what actually changes between the two runs.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A price is a meeting point, not a fact',
      md:
        'The quoted **price** is the price at which the NEXT willing buyer and willing seller agree to trade. Every completed trade has exactly one buyer and one seller — never a headcount of one side against the other, and never "more buyers than sellers".\n\nA price is not a measurement of what a company is worth. Nobody computed it. It is the outcome of the last agreement between two people, and it changes only when what somebody is willing to pay or accept changes.\n\nSo "why did it move" is always one question: **what changed about what people are willing to do**. The usual answer is that they learnt something they were not expecting.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'A rising price is not a verdict on the company',
      md:
        'It is tempting to read a rising price as proof a company is good, and a falling one as proof it is bad. Neither follows. A price moves on the gap between REALITY and EXPECTATION. Expectation can be wrong in either direction for reasons that have nothing to do with quality — a rumour, a fund needing cash, a sector-wide mood.\n\nA genuinely excellent company can see its price fall on a merely-good result, and a mediocre one can rally on a result that was merely less bad than feared. The price tells you what people currently expect. It does not tell you who is right.',
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
      kind: 'example',
      title: 'Same result, two different reactions — because the starting expectation differed',
      setup:
        'Two fictional companies, Mango Motors and Papaya Textiles, both report profit up 10% on the same morning. Their prices react in opposite directions, because the crowd was expecting something different from each of them.',
      steps: [
        { label: 'Mango Motors — result vs expectation, in points', detail: 'Reported +10%, crowd expected +4%', compute: { fn: 'literal', value: '+6 points ahead of expectation' } },
        { label: 'Mango Motors — price reaction', detail: 'A genuine beat, better than the crowd priced in', value: 'Price rises' },
        { label: 'Papaya Textiles — result vs expectation, in points', detail: 'Reported +10%, crowd expected +18%', compute: { fn: 'literal', value: '−8 points behind expectation' } },
        { label: 'Papaya Textiles — price reaction', detail: 'A genuine miss against expectation, despite the same 10% headline', value: 'Price falls' },
      ],
      conclusion:
        'The identical headline number produced opposite price moves, because "10% profit growth" was not what either price was actually reacting to. Each price was reacting to how that 10% compared with what had already been priced in — and that comparison is different for every company, every time.',
    },
    {
      kind: 'predict',
      prompt:
        'A well-run company\'s share falls 5% on a day with no company-specific news at all — but every other company in its sector also fell 4–6% that day. What is the most likely explanation?',
      options: [
        'The company must be hiding bad news',
        'Something sector-wide changed what people expect from the whole group, and this company moved with it',
        'The fall is definitely a pricing error that will correct itself',
      ],
      correct: 1,
      reveal:
        'Something changed for the whole sector — a regulatory signal, a change in input costs, a shift in how investors are pricing risk for the group generally. When a company moves in step with its peers on a day with no company-specific news, the explanation usually is not about that one company at all. It is the same mechanism as always. What changed is what people are willing to pay, and here that change applied to a whole group at once, not to one name.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A share falls 6% on a day every company in its industry falls between 4% and 7%, with no news specific to any one of them. Decide the most defensible read.',
          type: 'decision',
          spec: {
            options: [
              'The company did something wrong that has not been disclosed yet',
              'Something changed sector-wide in what investors expect, and this company moved with the group',
              'The move is meaningless and can be ignored entirely',
            ],
            correct: 'Something changed sector-wide in what investors expect, and this company moved with the group',
          },
          explanation:
            'A group-wide move on a day with no company-specific news points to a sector-wide cause, not a company-specific one. That does not mean the move should be ignored. It means the explanation to look for is one level up, in whatever changed for the whole group, not in this one company\'s disclosures.',
        },
        {
          prompt:
            'Mango Motors, a fictional company, reports profit up 15% — genuinely good news. Its price falls 4% that morning. Explain how both of those can be true at once.',
          type: 'decision',
          spec: {
            options: [
              'They cannot both be true — one of the two numbers must be wrong',
              'The 15% was below what people were already expecting, so relative to that expectation it was disappointing',
              'The price fall proves the 15% figure was misleading or false',
            ],
            correct: 'The 15% was below what people were already expecting, so relative to that expectation it was disappointing',
          },
          explanation:
            'The first option assumes a contradiction that is not there. A real 15% gain and a falling price are simply two different measurements — one against last year, one against what buyers and sellers had already priced in. The third treats the price move as evidence about the company\'s honesty, which is the exact "price movement proves something about quality" error this lesson exists to correct. What actually happened: the price already contained a guess higher than 15%. A genuinely good result still came in below that guess, so the next willing buyer and seller agreed to trade at a lower number.',
        },
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
