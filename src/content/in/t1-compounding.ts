import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — compounding
 *
 * The first lesson of the stage that says, plainly, that most people should not
 * trade. It opens the argument by showing what the alternative actually does.
 *
 * TWO FINDINGS, IN THIS ORDER
 *
 *   1. Time dominates rate. Ten years at 12% beats twenty years at 6% by less
 *      than people expect; but starting ten years earlier at the SAME rate is
 *      transformative. The lever nobody can buy is the one that matters most.
 *   2. A 1% annual fee is not 1%. Over thirty years it takes roughly a quarter
 *      of the final amount, because it compounds against you exactly as the
 *      returns compound for you.
 *
 * The second is the one that changes behaviour, and it is why the cost engine
 * appears in a lesson about long-term investing.
 */
export const lesson: Lesson = {
  id: 'in-t1-compounding',
  tier: 'T1',
  market: 'IN',
  title: 'What compounding really does',
  summary:
    'Time, rate and contribution pulled apart, with the fee drag shown against them. One of the three is far more powerful than people expect, and one is far more expensive.',
  plainSummary:
    'Money left alone grows on its own growth. This shows how much that is worth, and how much a small yearly fee takes away from it.',
  objectives: [
    'Separate the effects of time, rate and contribution on a final amount',
    'Explain why starting earlier beats a higher return',
    'Compute what a 1% annual fee costs over thirty years',
    'Decide which lever is worth pulling for a given situation',
  ],
  prerequisites: ['in-t1-real-cost-of-a-trade'],
  estimatedMinutes: 13,
  introduces: ['breakeven', 'index', 'dividend'],
  skills: ['compounding', 'long-term', 'costs'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Asha invests ₹1,00,000 at 10% and leaves it for 30 years. Bharat invests the same at 10% but starts 10 years later, so he gets 20 years. How much more does Asha end with?',
      options: ['About 50% more', 'About twice as much', 'About two and a half times as much'],
      correct: 2,
      reveal:
        'About two and a half times as much. Asha ends near ₹17.4 lakh and Bharat near ₹6.7 lakh, from the same money at the same rate. The ten extra years were not ten years of ordinary growth — they were the ten years when the amount was largest, so they did the most work. This is why every honest piece of advice about long-term investing starts with "begin now" rather than with which fund to choose. Starting date is the one lever nobody can sell you and the one that matters most.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'CompoundingCurve',
      props: {},
      caption:
        'The curve is flat for years and then steepens sharply. Most people give up during the flat part, which is where all the later steepness is built.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Three levers, very different sizes',
      md:
        '**Time.** The most powerful and the only one that cannot be bought. It works on the whole amount, every year, and the last years do the most.\n\n**Rate.** Real, and much more limited than advertised. A rate high enough to change the picture usually comes with a risk of losing the lot.\n\n**Contribution.** Reliable and boring. Adding a fixed amount every month for years beats almost any clever decision.\n\nAlmost everybody spends their attention on the middle one.',
    },
    {
      kind: 'example',
      title: 'The same plan, with and without a 1% fee',
      setup:
        'You invest ₹1,00,000 and add ₹1,00,000 a year for 30 years, at 10% a year. Then run it again with a 1% annual fee — the sort of number nobody argues about because it sounds tiny.',
      steps: [
        {
          label: 'What 30 years at 10% produces',
          detail: 'Initial amount plus a lakh a year, compounding',
          compute: { fn: 'compoundFinal', initial: 100000, contribution: 100000, years: 30, ratePercent: 10 },
        },
        {
          label: 'The same, with a 1% annual fee',
          detail: 'Nothing else changed. The fee is charged on the whole balance each year',
          compute: { fn: 'compoundFinal', initial: 100000, contribution: 100000, years: 30, ratePercent: 10, feePercent: 1 },
        },
        {
          label: 'What the fee took',
          detail: 'One percent a year, for thirty years',
          compute: { fn: 'literal', value: 3376000 },
        },
        {
          label: 'The same 30 years at 12% instead of 10%',
          detail: 'Two extra points of return, no fee',
          compute: { fn: 'compoundFinal', initial: 100000, contribution: 100000, years: 30, ratePercent: 12 },
        },
        {
          label: 'And what 20 years at 10% produces',
          detail: 'Ten years less, same rate. Compare this against the rate change above',
          compute: { fn: 'compoundFinal', initial: 100000, contribution: 100000, years: 20, ratePercent: 10 },
        },
      ],
      conclusion:
        'The 1% fee cost more than most people will ever gain from choosing a better fund. Ten years of time cost more than either.',
    },
    {
      kind: 'predict',
      prompt:
        'Given those numbers, which single change would improve a 30-year outcome the most?',
      options: [
        'Finding an extra 2% of annual return',
        'Removing a 1% annual fee',
        'Starting five years earlier',
      ],
      correct: 2,
      reveal:
        'Starting earlier, and it is not close. Five years is five years of compounding on the largest balance you will ever have, and no fee saving or return improvement matches it. The uncomfortable part is that this lever expires. Every year you spend deciding which fund to pick, or waiting for a better entry, is a year subtracted from the one input that cannot be recovered. The second answer is the best of the ones you can still act on today, which is why fees deserve far more attention than they get.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'the-long-game',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'cost',
      title: 'Why a fee is worse than it looks',
      md:
        'A 1% fee does not cost you 1%. It costs you 1% **and everything that 1% would have earned**, every year, for as long as you hold.\n\nSo it compounds against you at exactly the rate your money compounds for you. That is how a number sounding trivial takes a quarter of the outcome over thirty years.\n\nThe same arithmetic applies to trading costs. A strategy that trades often is paying a fee too, and it is usually larger than 1%.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You invest ₹5,00,000 at 10% a year and add nothing. What is it worth after 20 years, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 3363750, tolerance: 60000, unit: '₹' },
          explanation:
            'About ₹33.6 lakh — roughly six and a half times the money, with no skill and no decisions after the first one. Keep this number in mind whenever a strategy promises to beat leaving it alone. That is the bar, and it is higher than most active plans clear after costs.',
        },
        {
          prompt:
            'Sort each lever by how much it typically changes a 30-year outcome.',
          type: 'classify',
          spec: {
            categories: ['Large effect', 'Smaller than people think'],
            items: [
              { label: 'Starting ten years earlier', category: 'Large effect' },
              { label: 'Removing a 1% annual fee', category: 'Large effect' },
              { label: 'Picking a slightly better fund', category: 'Smaller than people think' },
              { label: 'Timing the entry well', category: 'Smaller than people think' },
            ],
          },
          explanation:
            'The two large ones are boring and available to everybody. The two small ones absorb almost all the attention, because they feel like skill and there is an industry selling them. Timing sits in the second column even though beginners worry about it most. Over thirty years, entering at a bad moment is a rounding error next to not entering for three years.',
        },
        {
          prompt:
            'You have ₹2,00,000 and cannot decide between two funds. You have been deciding for eight months. Decide what to do.',
          type: 'decision',
          spec: {
            options: [
              'Keep researching until you are confident',
              'Invest now in either one — the delay is costing more than the difference',
              'Wait for a market fall to enter',
            ],
            correct: 'Invest now in either one — the delay is costing more than the difference',
          },
          explanation:
            'Invest now. Eight months of indecision has already cost more than the likely gap between two reasonable funds, and the cost compounds. The third answer is the same delay with a better story attached. Waiting for a fall means being out for an unknown period, and the market rises more often than it falls. This is the single most expensive habit in long-term investing and it disguises itself as prudence.',
        },
      ],
    },
  ],
};

export default lesson;
