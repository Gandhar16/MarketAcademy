import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — anchoring and framing
 *
 * The previous lesson dealt with your own purchase price. This one deals with
 * every OTHER number that gets stuck in your head: the 52-week high, the price
 * a friend mentioned, the target on a television screen.
 *
 * The framing half is the more useful and the less known. The same fact stated
 * two ways produces different decisions from the same person, reliably, and
 * financial products are described in whichever framing sells. "90% of months
 * are positive" and "one month in ten loses money" are the same sentence.
 */
export const lesson: Lesson = {
  id: 'in-t2-anchoring',
  tier: 'T2',
  market: 'IN',
  title: 'The price you paid is not information',
  summary:
    'Every number you have seen recently is stuck to your judgement, including irrelevant ones. And the same fact, stated two ways, will get two different decisions out of you.',
  plainSummary:
    'Numbers you have seen recently quietly change what you think is a good price. This shows how, and how to check yourself.',
  objectives: [
    'Explain why a recent high changes your judgement without adding information',
    'Restate a claim in the opposite framing and check whether your view holds',
    'Identify which anchors in a decision are actually informative',
    'Decide what a 52-week high tells you about the future',
  ],
  prerequisites: ['in-t2-loss-aversion'],
  estimatedMinutes: 13,
  introduces: ['base-rate', 'resistance', 'position'],
  skills: ['behaviour', 'evaluation'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A share is ₹800 today. Its 52-week high was ₹1,200. What does that high tell you about where it goes next?',
      options: [
        'It is cheap — there is 50% of recovery available',
        'Nothing about the future, but it will strongly affect how cheap it feels',
        'It is falling and will keep falling',
      ],
      correct: 1,
      reveal:
        'Nothing about the future, and a great deal about your judgement. The ₹1,200 is a fact about the past — it says somebody once paid that, and nothing about whether anybody will again. Yet it makes ₹800 feel like a discount, and the same ₹800 would feel expensive if the year’s high had been ₹850. Identical company, identical price, opposite feeling, produced entirely by a number you happened to see. This is anchoring, and being told about it does not switch it off.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The anchor does not have to be relevant',
      md:
        'Anchoring works even when the number is obviously meaningless. In the classic experiments a random figure — a spun wheel, a page number — shifts people’s estimates of completely unrelated quantities.\n\nIn a market you are surrounded by numbers with no predictive content: last year’s high, a round figure like ₹1,000, a broker’s target, the price a friend mentioned.\n\nNone of them constrain the future. All of them will move your sense of what is expensive.',
    },
    {
      kind: 'game',
      game: 'bias-buster',
      config: {},
    },
    {
      kind: 'example',
      title: 'The same fund, described twice',
      setup:
        'Two advertisements for the identical fund, with the identical record. Both are true, and neither is misleading in any way a regulator would object to.',
      steps: [
        {
          label: 'Version A — months that made money',
          detail: 'Out of the last 120 months',
          compute: { fn: 'literal', value: 78 },
        },
        {
          label: 'Version A, as a headline',
          detail: '"Positive in 65% of months since launch"',
          value: '65%',
        },
        {
          label: 'Version B — the same record',
          detail: '"Loses money in more than one month in three"',
          compute: { fn: 'literal', value: 42 },
        },
        {
          label: 'Worst single year, which neither mentions',
          detail: 'The number that actually decides whether you stay invested',
          compute: { fn: 'literal', value: -34 },
        },
        {
          label: 'What a ₹5,00,000 holding did in that year',
          detail: 'Also true, also absent from both advertisements',
          compute: { fn: 'percentOf', value: 500000, percent: -34 },
        },
      ],
      conclusion:
        'Same fund, same record, and the version you read decides how you feel about it.',
    },
    {
      kind: 'predict',
      prompt:
        'A share has just hit a 52-week high. What does the base rate say about what happens next?',
      options: [
        'It is due a fall — nothing goes up forever',
        'It will keep rising, since strength continues',
        'Roughly what happens after any other day, once you measure it',
      ],
      correct: 2,
      reveal:
        'Roughly what happens after an ordinary day. Both of the other answers are confident folklore, and they contradict each other. One says highs mean exhaustion, the other says highs mean momentum. Both are available on demand. This is the pattern-testing habit applied to a psychological anchor. A new high feels enormously significant. The only way to find out whether it is: count what followed the last two hundred.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'three-up-days', symbol: 'RELIANCE.NS' },
      takeaway:
        'Strength continuing, measured rather than assumed. Whatever the number is, it is smaller than the feeling that a rising chart produces.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The check that takes ten seconds',
      md:
        '**Restate it the other way round.** "This fund is positive in 65% of months" becomes "it loses money in 35% of them". If your view changes, the framing was doing the work rather than the facts.\n\n**Ask what you would think with no history.** If you had never seen this chart and somebody offered you this company at this price today, what would you say?\n\nNeither removes the bias. Both make it visible, which is the most that is available.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A fund was positive in 78 of the last 120 months. In how many months did it lose money?',
          type: 'compute',
          spec: { metric: 'literal', value: 42, tolerance: 1, unit: 'months' },
          explanation:
            '120 − 78 = 42, which is more than one month in three. Both framings are true and the second is never the one in the advertisement. Doing this subtraction whenever you meet a percentage is a cheap habit that makes the other half of the sentence visible.',
        },
        {
          prompt:
            'Sort each number by whether it tells you anything about the future.',
          type: 'classify',
          spec: {
            categories: ['Informative', 'An anchor only'],
            items: [
              { label: 'The company’s earnings over five years', category: 'Informative' },
              { label: 'How much its debts have grown', category: 'Informative' },
              { label: 'Its 52-week high', category: 'An anchor only' },
              { label: 'The price you paid', category: 'An anchor only' },
            ],
          },
          explanation:
            'The first two are facts about the business and its future obligations. The last two are facts about price history and about your own records, and neither constrains anything. The difficulty is that the anchors are far more visible — they are on every screen, in large type, and the informative numbers are in a document nobody opens.',
        },
        {
          prompt:
            'A share is 45% below its high and you are tempted. Decide the most useful question to ask.',
          type: 'decision',
          spec: {
            options: [
              'How much of the fall could it recover?',
              'Would I buy this today at this price, knowing nothing about the high?',
              'What was the high, exactly?',
            ],
            correct: 'Would I buy this today at this price, knowing nothing about the high?',
          },
          explanation:
            'The second question, and it is the same test as the previous lesson because it is the same error wearing different clothes. The first question is anchoring with arithmetic attached — it treats the old price as a destination the share is somehow owed. The third makes it worse by staring harder at the anchor. Prices fall 45% for reasons, and the reasons are what the decision should be about.',
        },
      ],
    },
  ],
};

export default lesson;
