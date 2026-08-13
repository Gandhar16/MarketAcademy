import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — one company or all of them
 *
 * The lesson that has to say the unpopular thing on a site about trading: for
 * most people, most of the time, owning the whole basket beats picking members
 * of it. A course that never says this is selling activity.
 *
 * THE MECHANISM, NOT THE SLOGAN
 *
 * Diversification does not reduce all risk. It removes the risk specific to one
 * company — a factory fire, a fraud, a bad chief executive — and leaves the risk
 * that the whole market falls, which cannot be diversified away at all. That
 * split is the entire subject and it is almost never taught, so people either
 * believe diversification is magic or that it is pointless.
 *
 * The uncomfortable number is that a single company can go to zero and the index
 * cannot, because the index replaces its failures. Stage 1 already taught that.
 */
export const lesson: Lesson = {
  id: 'in-t1-index-vs-stock',
  tier: 'T1',
  market: 'IN',
  title: 'One company or all of them',
  summary:
    'Diversification removes one specific kind of risk and leaves another entirely untouched. Knowing which is which decides whether picking companies is worth your time.',
  plainSummary:
    'You can buy one company or a basket of many. This explains what the basket protects you from, and what it does not.',
  objectives: [
    'Separate risk specific to one company from risk that affects everything',
    'Say which of the two diversification removes',
    'Compute what a single company failing does to a concentrated holding',
    'Decide when concentration is a reasonable choice',
  ],
  prerequisites: ['in-t1-sip'],
  estimatedMinutes: 13,
  introduces: ['index', 'drawdown', 'position-size', 'volatility'],
  skills: ['diversification', 'long-term', 'risk-management'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You hold 20 different companies instead of one. Which risk have you removed?',
      options: [
        'The risk that the market falls',
        'The risk that one particular company fails',
        'Both of them',
      ],
      correct: 1,
      reveal:
        'Only the second. This is the distinction that makes diversification make sense, and almost nobody is taught it. One company can be destroyed by a fire, a fraud, a lost contract or a bad decision. Owning twenty means any one of those costs a twentieth rather than everything. But if the whole market falls 30%, all twenty fall with it. Spreading across companies removes company risk entirely and market risk not at all. Anybody who tells you diversification protects against a crash has confused the two.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'TwoRisksExplainer',
      props: {},
      takeaway:
        'Step through it once. The grid survives the fraud almost unscathed — and falls exactly as hard as the single block once the whole market turns.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two risks, only one of which is free to remove',
      md:
        '**Company risk.** Specific to one business. A factory burns down, a regulator arrives, a rival wins. Owning more companies genuinely removes this, and it costs you nothing to do so.\n\n**Market risk.** Everything falls together. Interest rates, a recession, a war. No amount of spreading helps, because there is nowhere inside the market to hide.\n\nThe first is removable and unpaid — you are not compensated for carrying it. The second is what you are actually being paid to accept.',
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: '^NSEI', interval: '1d', range: '2y' },
      mode: 'view',
      takeaway:
        'Two years of the whole basket. Every large fall here happened to nearly every company at once — that is the risk diversification cannot touch.',
    },
    {
      kind: 'example',
      title: 'One company failing, at two levels of concentration',
      setup:
        'You have ₹10,00,000. In case A it is all in one company. In case B it is spread across twenty, ₹50,000 each. One of the companies is a fraud and goes to zero. Follow both.',
      steps: [
        {
          label: 'Case A — what you lose',
          detail: 'The single company was everything you had',
          compute: { fn: 'literal', value: 1000000 },
        },
        {
          label: 'Case A — what is left',
          detail: 'Nothing, and no recovery is possible from here',
          compute: { fn: 'literal', value: 0 },
        },
        {
          label: 'Case B — what you lose',
          detail: 'One holding of twenty',
          compute: { fn: 'literal', value: 50000 },
        },
        {
          label: 'Case B — what is left',
          detail: 'A 5% loss, recoverable in an ordinary year',
          compute: { fn: 'literal', value: 950000 },
        },
        {
          label: 'What case B costs you in a market fall of 30%',
          detail: 'Exactly the same as case A would. Spreading does not help here',
          compute: { fn: 'percentOf', value: 950000, percent: -30 },
        },
      ],
      conclusion:
        'Twenty companies turned a total loss into a bad month. It did nothing whatsoever about the 30% fall.',
    },
    {
      kind: 'predict',
      prompt:
        'Given that, when is holding one company anyway a defensible decision?',
      options: [
        'When you are confident in it',
        'When the amount is small enough that losing all of it changes nothing',
        'Never — always diversify',
      ],
      correct: 1,
      reveal:
        'When the loss would not matter. Confidence is not a reason, because everybody who has ever lost everything in one company was confident — that is what made them concentrate. The honest test is the size test: if this position went to zero tomorrow, would my plans change? If the answer is no, concentration is a reasonable choice you have made with your eyes open. If the answer is yes, no amount of research makes it reasonable, because the failures that destroy companies are usually the ones nobody outside could have seen.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'You hold 10 companies, but 7 of them are banks. Have you actually diversified against company-specific risk the way owning 10 unrelated companies would?',
      options: [
        'Yes — 10 companies is 10 companies, regardless of what they do',
        'Not really — the 7 banks tend to be hit by the same events, so they behave more like one large position than seven',
        'It depends only on how much each one costs',
      ],
      correct: 1,
      reveal:
        'Not really. Diversification works by spreading across risks that are genuinely independent of each other. Seven banks tend to be hit by the same interest-rate and credit conditions, so a problem for one often means a problem for all seven at once. Ten holdings that are really three or four independent bets diversify far less than the count alone suggests.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'the-long-game',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why the basket does not go to zero',
      md:
        'A single company can fail completely. An index cannot, and the reason is mechanical rather than optimistic.\n\nWhen a company shrinks or collapses it is **removed from the basket** and replaced by one that has grown. The rule does that automatically, with nobody making a judgement call.\n\nSo owning the index is not a bet that these fifty companies will do well. It is a bet that the largest fifty companies in the country, whoever they turn out to be, will be worth more later.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You hold 12 companies. 8 of them are software exporters, all sensitive to the same currency and global-demand conditions. Decide how well-diversified you actually are against company-specific risk.',
          type: 'decision',
          spec: {
            options: [
              'Well-diversified, since 12 is a healthy number of holdings',
              'Less diversified than the count suggests, since the 8 software exporters tend to move together',
              'Diversification does not depend on what the companies do',
            ],
            correct: 'Less diversified than the count suggests, since the 8 software exporters tend to move together',
          },
          explanation:
            'Less diversified. A count of holdings is not the same as a count of independent risks. Eight companies exposed to the same conditions behave more like one concentrated bet than eight separate ones, even though each is a different company on paper.',
        },
        {
          prompt:
            'You hold ₹8,00,000 spread equally across 16 companies. One goes to zero. What percentage of your money have you lost?',
          type: 'compute',
          spec: { metric: 'literal', value: 6.25, tolerance: 0.2, unit: '%' },
          explanation:
            'One holding of sixteen is 6.25%. That is a bad month and it is survivable, which is the entire point — the same event in a concentrated portfolio ends the account. Note that this protection costs nothing: you were never being paid extra for taking the risk of one company failing, so removing it gives up no expected return at all.',
        },
        {
          prompt:
            'Sort each risk by whether spreading across 30 companies removes it.',
          type: 'classify',
          spec: {
            categories: ['Diversification removes this', 'It does not'],
            items: [
              { label: 'A fraud at one company', category: 'Diversification removes this' },
              { label: 'One company losing its biggest customer', category: 'Diversification removes this' },
              { label: 'A recession', category: 'It does not' },
              { label: 'Interest rates rising sharply', category: 'It does not' },
            ],
          },
          explanation:
            'The first two are specific to a business and vanish when you own thirty. The last two arrive for everybody at once and are exactly what you are being paid to endure. Keeping this table straight prevents both of the common errors: believing a diversified portfolio cannot fall, and concluding that diversification is pointless because it fell anyway.',
        },
        {
          prompt:
            'A friend has their entire savings in the company they work for. Decide what the real problem is.',
          type: 'decision',
          spec: {
            options: [
              'Nothing, if it is a good company',
              'Their savings and their salary depend on the same single event',
              'They should diversify into two companies instead',
            ],
            correct: 'Their savings and their salary depend on the same single event',
          },
          explanation:
            'The two exposures are the same exposure. If the company fails they lose the job and the savings in the same week, which is the worst possible correlation and it is extremely common. The third answer barely helps — two companies is not diversification, it is concentration with an extra name. This is also the first appearance of an idea that gets its own lesson much later: risks that arrive together are far more dangerous than the same risks arriving separately.',
        },
      ],
    },
  ],
};

export default lesson;
