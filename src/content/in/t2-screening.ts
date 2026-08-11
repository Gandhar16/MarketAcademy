import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — screening
 *
 * A screen is a filter over a database, and it is the fastest way to fool
 * yourself in this entire subject — because every screen you build will look
 * brilliant on history, for reasons that have nothing to do with the screen.
 *
 * Three mechanisms, and the learner should be able to name all three:
 *   - survivorship: the database usually contains today's companies
 *   - look-ahead: figures are stamped with the period, not the publication date
 *   - multiplicity: try enough filters and one looks excellent by chance
 *
 * These get their full treatment in stage 9's backtest lesson. Here they arrive
 * in the concrete place a learner will actually meet them first.
 */
export const lesson: Lesson = {
  id: 'in-t2-screening',
  tier: 'T2',
  market: 'IN',
  title: 'Screening without fooling yourself',
  summary:
    'Any filter you build will look excellent on history. Three specific mechanisms guarantee it, and none of them are about whether your idea was good.',
  plainSummary:
    'You can filter thousands of companies down to a handful with a few rules. This shows why the results almost always look better than they are.',
  objectives: [
    'Build a filter and say what each condition is actually selecting for',
    'Name the three reasons a backward-looking screen flatters itself',
    'Explain why the publication date matters more than the period end',
    'Decide whether a screen result is worth acting on',
  ],
  prerequisites: ['in-t2-valuation'],
  estimatedMinutes: 14,
  introduces: ['base-rate', 'statistical-significance', 'index', 'volume', 'backtest', 'survivorship-bias', 'lookahead-bias', 'overfitting'],
  skills: ['screening', 'evidence', 'fundamentals'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You screen today’s listed companies for a rule and test it on the last ten years. The result is excellent. What is the first thing wrong with that test?',
      options: [
        'Nothing — ten years is a good sample',
        'The list only contains companies that still exist today',
        'Ten years is too short',
      ],
      correct: 1,
      reveal:
        'Every company that failed in those ten years is missing from your list. You tested a rule on a group selected for having survived, which guarantees a flattering answer no matter what the rule was. This is the most common defect in every screen, every backtest and every "these stocks returned 400%" article, and it is invisible unless you go looking for it. The fix is a database that includes the companies that were delisted, and most freely available ones do not have it.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A screen is a filter, not an opinion',
      md:
        'You are asking a database for every company where some conditions are true. Nothing more.\n\nThat is genuinely useful — it turns four thousand companies into twenty you can actually read about. It is a way of **allocating your attention**.\n\nWhat it is not is a list of things to buy. Every company on it satisfies your conditions; whether the conditions matter is a separate question, and the screen cannot answer it.',
    },
    {
      kind: 'predict',
      prompt:
        'Your screen uses the March quarter results, dated 31 March. You test what happens if you buy on 1 April. What is wrong?',
      options: [
        'Nothing — the figures are for the period ending 31 March',
        'Those results were not published until late May, so you could not have known them',
        'You should use annual figures instead',
      ],
      correct: 1,
      reveal:
        'You could not have known them on 1 April. Company results are stamped with the period they cover, not the day they became public, and Indian companies typically publish six to eight weeks after the quarter ends. A test that buys on the period-end date is using information that did not exist yet, and it will produce beautiful results that nobody could ever have achieved. This is look-ahead bias, it is extremely easy to introduce without noticing, and it flatters a screen enormously.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'How a screen finds a brilliant rule that does not exist',
      setup:
        'You have a database and some patience. You try filters until one produces an excellent ten-year record. Here is what that process actually guarantees, before your idea has contributed anything at all.',
      steps: [
        {
          label: 'Filters you try',
          detail: 'Different combinations of ratio, size, sector and growth threshold',
          compute: { fn: 'literal', value: 40 },
        },
        {
          label: 'How often a useless filter looks excellent by chance',
          detail: 'Roughly one in twenty, at ordinary standards of evidence',
          compute: { fn: 'literal', value: 5 },
        },
        {
          label: 'Expected number of brilliant-looking failures',
          detail: '5% of 40 filters, all of them meaningless',
          compute: { fn: 'percentOf', value: 40, percent: 5 },
        },
        {
          label: 'And the cost of trading a 20-name portfolio, per rebalance',
          detail: 'Charged whether the rule works or not',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 500, quantity: 200 },
        },
        {
          label: 'Rebalancing four times a year',
          detail: 'The drag the rule has to overcome before it earns anything',
          compute: { fn: 'multiply', a: 578, b: 4, dp: 0 },
        },
      ],
      conclusion:
        'Two of your forty filters will look brilliant purely by chance. You will keep those two, and you will not remember the other thirty-eight.',
    },
    {
      kind: 'predict',
      prompt:
        'You try 100 filters and find one with an outstanding record. Work it out before you look — roughly how many would you expect to look outstanding even if none of them worked?',
      options: ['None', 'About 5', 'About 50'],
      correct: 1,
      reveal:
        'About five. At the usual standard of evidence, one test in twenty passes by chance, so a hundred tests produce about five spectacular results from nothing at all. The uncomfortable part is that looking harder at the same data cannot tell you which kind you found. Every test you run on it is contaminated by the search that produced it. The only honest check is data the filter has never seen. Keep the last three years aside before you start, and test the winner on them once.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PatternScanner',
      props: { symbol: 'RELIANCE.NS' },
      takeaway:
        'Ten rules tested at once on real bars. Watch what happens to the best one when you switch symbols — that is the multiplicity problem in miniature.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The three, in one place',
      md:
        '**Survivorship.** Your list contains today’s companies. The failures were removed, and they were exactly the cases your rule needed to be tested against.\n\n**Look-ahead.** Results are dated by period, not publication. Using them on the period-end date is using tomorrow’s newspaper.\n\n**Multiplicity.** Try enough rules and one will look excellent. Searching guarantees it; it is not a discovery.\n\nAll three make a screen look better. None of them make it look worse, which is why the errors compound in one direction.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You test 60 different filters. If none of them work, roughly how many would you expect to look outstanding by chance at a 1-in-20 standard?',
          type: 'compute',
          spec: { metric: 'literal', value: 3, tolerance: 0.5, unit: 'filters' },
          explanation:
            '5% of 60 is 3. Knowing this number before you start is the whole defence, because afterwards the three that passed will feel like discoveries rather than like arithmetic. It is also why serious testing counts how many things were tried and raises the bar accordingly — a result that would be impressive from one test is unremarkable from sixty.',
        },
        {
          prompt:
            'Sort each choice by whether it makes a screen test more honest.',
          type: 'classify',
          spec: {
            categories: ['More honest', 'Flatters the result'],
            items: [
              { label: 'Including companies that were delisted', category: 'More honest' },
              { label: 'Using the publication date rather than the period end', category: 'More honest' },
              { label: 'Adjusting the filter until the record improves', category: 'Flatters the result' },
              { label: 'Testing only on companies in today’s index', category: 'Flatters the result' },
            ],
          },
          explanation:
            'The two on the right are what almost every published screen does, usually without any intent to mislead — the data is easier to get and the adjustment feels like refinement. Both push results in the same direction, upward, which is why a screen that has not explicitly handled them should be assumed to be flattering itself.',
        },
        {
          prompt:
            'Your screen returns 15 companies with an excellent backtested record. Decide what to do next.',
          type: 'decision',
          spec: {
            options: [
              'Buy all 15 in equal amounts',
              'Read about each one — the screen allocated your attention, it did not make a decision',
              'Refine the filter until the record is even better',
            ],
            correct:
              'Read about each one — the screen allocated your attention, it did not make a decision',
          },
          explanation:
            'Read them. The screen did the job it can do, which is turning four thousand names into fifteen. It knows nothing about the court case, the customer concentration or the departing management team, and those are what actually decide the outcome. The third answer is the trap: refining until the record improves is the multiplicity problem, performed deliberately, and it feels like diligence.',
        },
      ],
    },
  ],
};

export default lesson;
