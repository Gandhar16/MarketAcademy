import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — India VIX
 *
 * WHY THIS LESSON IS MOSTLY ABOUT WHAT VIX IS NOT
 *
 * VIX is the single most misread number on an Indian trading screen. It is
 * routinely called the "fear index" and read as a forecast — high VIX means a
 * crash is coming, low VIX means it is safe. Both readings are wrong in the
 * same way: VIX has no direction in it at all. It is a size, not a sign.
 *
 * The other universal error is the units. VIX is quoted annualised, so a
 * learner reads 14 and pictures a 14% move soon. The actual implication for the
 * next month is closer to 4%. That single conversion — divide by the square
 * root of 12 — is the most useful thing in this lesson and it is arithmetic a
 * beginner can do.
 *
 * The lesson therefore teaches: what it is computed from, how to convert it,
 * what it genuinely tells you, and the two things people believe it says.
 */
export const lesson: Lesson = {
  id: 'in-t3-vix',
  tier: 'T3',
  market: 'IN',
  title: 'India VIX: what the market expects',
  summary:
    'One number that says how much movement is being priced in — and says nothing at all about which way. Learn to convert it into a range you can actually use.',
  plainSummary:
    'There is a number that tells you how much the market expects prices to move soon. This explains what it means, how to read it, and the two things people wrongly think it says.',
  objectives: [
    'State what India VIX is computed from, and over what period',
    'Convert an annual figure into an expected move for the coming month',
    'Explain why a high reading is not a forecast of a fall',
    'Say what happens to a bought contract when the reading collapses',
  ],
  prerequisites: ['in-t3-call-and-put'],
  estimatedMinutes: 14,
  introduces: ['india-vix', 'volatility', 'option', 'premium', 'expiry', 'underlying', 'index'],
  skills: ['volatility', 'options-basics'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'India VIX is at 14. Somebody tells you this means the market expects NIFTY to move about 14%. Over what period would that be true?',
      options: ['The next month', 'The next year', 'The next week', 'It is not a percentage move at all'],
      correct: 1,
      reveal:
        'A year. This is the most common misreading of the number on the screen. For the period most people care about, it is off by a factor of about three and a half. VIX is quoted annualised, like an interest rate. To get the coming month you divide by the square root of 12, which is roughly 3.46. So 14 becomes about 4% for a month. Someone who reads 14 as a monthly figure will think the market is pricing chaos when it is pricing an ordinary quarter, and will buy contracts accordingly.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Where the number comes from',
      md:
        'The NSE does not survey anybody. **India VIX** is computed from the prices people are actually paying for near-term NIFTY contracts.\n\nIf buyers bid those prices up, the number rises. If they let them fall, it falls. That is the whole mechanism.\n\nSo it measures an **expectation**, not an event. It is a reading of what the market is currently willing to pay for protection and for opportunity, expressed as a percentage per year.',
    },
    {
      kind: 'example',
      title: 'Turning a reading into a range you can use',
      setup:
        'NIFTY is at 24,000 and India VIX is at 14. You want to know what the market is actually pricing for the coming month, in index points. That tells you whether a target you have in mind is ambitious or ordinary.',
      steps: [
        {
          label: 'The reading, as published',
          detail: 'A percentage per year, not per month',
          value: '14.0%',
        },
        {
          label: 'Scale it to one month',
          detail: 'Divide by the square root of 12, which is about 3.46',
          compute: { fn: 'literal', value: 4.04 },
        },
        {
          label: 'That percentage of NIFTY',
          detail: 'About 4% of 24,000',
          compute: { fn: 'percentOf', value: 24000, percent: 4.04 },
        },
        {
          label: 'The range being priced',
          detail: 'Roughly 970 points either side of 24,000',
          value: '23,030 to 24,970',
        },
      ],
      conclusion:
        'A 700-point target inside that band is not a bold call — it is less than the market already expects as ordinary movement.',
    },
    {
      kind: 'predict',
      prompt:
        'India VIX doubles to 28 and NIFTY is still at 24,000. Work the same sum before you look. What monthly range is now being priced?',
      options: [
        'About 970 points either side',
        'About 1,940 points either side',
        'About 6,720 points either side',
      ],
      correct: 1,
      reveal:
        'About 1,940 points either side, so roughly 22,060 to 25,940. The relationship is simply proportional: double the reading, double the expected range. The third answer treats 28 as a monthly figure and gets a band nobody has ever seen in a normal month. Here is the part that matters for a position. The number doubling means every contract just got dramatically more expensive, because you are paying for that wider range. Nothing has happened to NIFTY. The price of contracts on it has changed anyway.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'RiskRewardDiagram',
      props: { entry: 24000 },
      caption:
        'A target and a stop, drawn against the range the market is pricing. A target well inside the band is ordinary; one far outside it needs a reason.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'The two things it does not say',
      md:
        '**It is not a direction.** A high reading means a big move is expected, not a fall. The number rises before an election result, and the result can go either way. Calling it a fear index has taught a generation to read a size as a sign.\n\n**It is not a forecast that comes true.** It is what the market is charging today. On average, realised movement comes in a little under what was priced — which is why buying protection is, on average, a cost rather than a bargain.',
    },
    {
      kind: 'widget',
      component: 'GreeksExplorer',
      props: { strike: 24000, spot: 24000, days: 30, iv: 28, type: 'call' },
      takeaway:
        'Hold everything still and drag volatility from 28 down to 12. Nothing about the market moved. Watch what happens to the price of a contract you would be holding.',
    },
    {
      kind: 'predict',
      prompt:
        'You buy a NIFTY contract the day before a big scheduled announcement, when the reading is high. The news lands, NIFTY moves 1.5% in your favour, and your position is DOWN. What happened?',
      options: [
        'The move was too small to cover what you paid',
        'The reading collapsed once the uncertainty was resolved',
        'Both, and the second usually does more damage',
      ],
      correct: 2,
      reveal:
        'Both, and the collapse usually dominates. Before a known event, everybody wants protection and opportunity, so the reading climbs and contracts get expensive. You paid that price. The moment the news is public the uncertainty is gone, and the reading falls off a cliff — often from the high twenties to the low teens overnight. Every contract reprices downward at once. Your direction call was correct and irrelevant. This is why buying before a scheduled event is a trade that feels obvious and loses with impressive consistency.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'India VIX is at 21 and NIFTY is at 20,000. Compute the approximate move, in index points, that the market is pricing for the coming month.',
          type: 'compute',
          spec: { metric: 'literal', value: 1213, tolerance: 60, unit: 'points' },
          explanation:
            '21 ÷ 3.46 ≈ 6.07% for the month, and 6.07% of 20,000 is about 1,213 points. Do this conversion every time you look at the number. It turns an abstract reading into a band you can hold a target against. It also stops the two errors that matter: reading an annual figure as a monthly one, and reading a size as a direction.',
        },
        {
          prompt:
            'India VIX jumps from 12 to 26 in two days. Decide what you can conclude about where NIFTY is heading.',
          type: 'decision',
          spec: {
            options: [
              'A fall is likely',
              'A rise is likely',
              'Nothing about direction — only that a larger move is expected',
            ],
            correct: 'Nothing about direction — only that a larger move is expected',
          },
          explanation:
            'Nothing about direction. The reading is built from the prices of contracts that pay out in both directions, so there is no way for a sign to get into it. It does tend to rise while markets fall, because people buy protection then — but that is a correlation with the past, not a statement about the future. Reading it as a bearish signal is the most expensive habit associated with this number.',
        },
        {
          prompt:
            'Sort each statement by whether the reading is telling you it, or you are adding it yourself.',
          type: 'classify',
          spec: {
            categories: ['The number says this', 'You are adding this'],
            items: [
              { label: 'A larger move is being priced for the next 30 days', category: 'The number says this' },
              { label: 'Contracts are more expensive than they were', category: 'The number says this' },
              { label: 'The market is about to fall', category: 'You are adding this' },
              { label: 'The move being priced will actually happen', category: 'You are adding this' },
            ],
          },
          explanation:
            'The first two are what the arithmetic gives you. The last two are interpretation, and both are common enough to have cost a great deal of money. The number is a price, and a price is a statement about what people will pay today. It is never a promise about tomorrow, however confidently it is quoted on television.',
        },
      ],
    },
  ],
};

export default lesson;
