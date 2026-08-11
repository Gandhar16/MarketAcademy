import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Reading a business like an analyst — promoter and governance signals
 *
 * India-specific, because "promoter" is a defined, disclosed category here
 * in a way most other markets do not have — founders and their families
 * typically hold a large, named stake, tracked quarter to quarter. That
 * disclosure gives two genuinely checkable signals this lesson teaches
 * carefully: promoter buying or selling, and promoter shares pledged
 * against a loan. Both are real, both are watched, and both are routinely
 * over-read as more conclusive than the disclosure alone supports.
 */
export const lesson: Lesson = {
  id: 'in-t2-promoter-signals',
  tier: 'T2',
  market: 'IN',
  title: 'Promoter and governance signals',
  summary:
    'Promoter shareholding, buying, selling and pledging are all disclosed, checkable facts in India. None of them is proof by itself — each is a real signal that needs a reason attached before it means anything.',
  plainSummary:
    'In India, founders and their families are tracked separately as "promoters", and their buying, selling and share pledging are all disclosed. This shows what those disclosures actually reveal, and the specific traps in over-reading them.',
  objectives: [
    'Explain what "promoter" means as a disclosed category in Indian markets',
    'Compute the pledged share percentage from a disclosed holding',
    'Explain why promoter selling and promoter pledging are read differently',
    'Decide what additional information a bare pledging disclosure actually requires',
  ],
  prerequisites: ['in-t2-reading-annual-report'],
  estimatedMinutes: 15,
  introduces: ['promoter-shareholding', 'pledged-shares'],
  skills: ['fundamentals', 'india-rules', 'governance'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A company discloses that promoters have pledged 40% of their total shareholding against a loan. What does that fact, alone, actually tell you?',
      options: [
        'Nothing meaningful without knowing why the loan exists and what it funds',
        'The company is in severe financial distress',
        'Promoters have lost confidence in the business and are preparing to exit',
      ],
      correct: 0,
      reveal:
        'Not much on its own. Pledging shares as loan collateral happens for many reasons — funding a personal purchase, backing an entirely separate business venture, financing a corporate acquisition. Some of those are unrelated to this company\'s health; some are a genuine warning sign. The bare percentage tells you exposure exists. It does not tell you the reason, and the reason is most of what actually matters.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A defined, disclosed category',
      md:
        '**Promoter shareholding** is a specific, regulated disclosure — founders, their families and entities they control, reported as a percentage of the company each quarter. Tracked separately from the public float because that stake is assumed to carry more information than an ordinary investor\'s.\n\n**Promoter buying** is generally read as a positive signal, though never a guaranteed one. **Promoter selling** is read more cautiously, since it can mean anything from a personal cash need to a genuine loss of confidence. **Pledged shares** are promoter shares posted as loan collateral — the SAME mechanism a trader uses to borrow against holdings, just at the founding-family level.',
    },
    {
      kind: 'example',
      title: 'Computing the pledged share',
      setup:
        'Promoters hold 5.2 crore shares out of a company with 8 crore shares outstanding. Of the promoters\' holding, 1.56 crore shares are pledged.',
      steps: [
        { label: 'Promoter shareholding, as a percentage of the company', detail: '5.2 ÷ 8', compute: { fn: 'literal', value: 65 } },
        { label: 'Pledged shares as a percentage of the promoters\' OWN holding', detail: '1.56 ÷ 5.2', compute: { fn: 'literal', value: 30 } },
        { label: 'Pledged shares as a percentage of the WHOLE company', detail: '1.56 ÷ 8 — a smaller, different number', compute: { fn: 'literal', value: 19.5 } },
        { label: 'Which of these three numbers gets quoted in headlines', detail: 'Usually the middle one — check which base a stated figure actually uses', value: '% of promoter holding' },
      ],
      conclusion:
        'Three different, correct percentages from the same two facts. A "30% pledged" headline and a "19.5% pledged" headline can describe the identical disclosure — always check which base the number is measured against before comparing two companies.',
    },
    {
      kind: 'predict',
      prompt:
        'Promoter pledging in a company rises from 10% to 45% of their holding over six months, with no public explanation given. What is the most defensible read?',
      options: [
        'Ignore it — pledging levels fluctuate for routine reasons all the time',
        'A real reason for caution — a large, unexplained, rapidly rising pledge is a genuine governance flag worth investigating further',
        'Sell immediately — this always precedes a collapse',
      ],
      correct: 1,
      reveal:
        'A real reason for caution, not an automatic sell signal and not something to wave away either. The RATE of change and the absence of an explanation are what make this worth investigating. A stable, small, explained pledge is very different from one that quadruples in six months with no disclosed reason. The honest response is to look for the reason, not to treat the bare percentage as a verdict in either direction.',
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
      title: 'Buying and selling are not mirror images',
      md:
        'Promoter buying has one dominant explanation: they believe the shares are worth more than the current price, since buying costs them real money with no offsetting benefit. That makes it a comparatively cleaner signal.\n\nPromoter SELLING has many explanations that have nothing to do with the business — funding a personal expense, estate planning, portfolio diversification, a regulatory requirement to reduce a stake. Reading a promoter sale exactly the same way as a promoter purchase, just flipped, ignores that the two are not actually symmetric. A large, unexplained, sudden sale is worth attention; a modest, disclosed, routine one is not automatically a red flag.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'Promoters hold 6 crore of a company\'s 10 crore total shares. Of that, 1.8 crore are pledged. What percentage of the WHOLE company is pledged?',
          type: 'compute',
          spec: { metric: 'literal', value: 18, tolerance: 1, unit: '%' },
          explanation:
            '1.8 ÷ 10 × 100 = 18%. Note this is a different, smaller number than "pledged as a share of the promoters\' own holding" (1.8 ÷ 6 = 30%) — the same trap the lesson\'s worked example named.',
        },
        {
          prompt: 'Classify each statement about promoter and governance signals.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'A bare pledging percentage, without a stated reason, is not enough information on its own', category: 'Supported by the mechanism' },
              { label: 'Any promoter selling is proof of a coming decline', category: 'Folklore' },
              { label: 'Promoter buying and promoter selling carry different amounts of information, since selling has many unrelated explanations', category: 'Supported by the mechanism' },
              { label: 'A rapidly rising, unexplained pledge over a short period is a legitimate reason for caution', category: 'Supported by the mechanism' },
            ],
          },
          explanation:
            'Only the "any selling is proof of decline" row treats a signal as more conclusive than the disclosure actually supports — the recurring trap across every governance signal this lesson covered.',
        },
        {
          prompt: 'Two companies both show "30% of promoter holding pledged". Company A\'s figure has been stable at that level for three years, disclosed as backing a separate group company\'s expansion. Company B\'s figure rose from 5% to 30% in the last quarter with no explanation. Same headline number — same level of concern?',
          type: 'decision',
          spec: {
            options: [
              'Yes — the percentage is identical, so the concern should be identical',
              'No — the rate of change and the presence or absence of an explanation matter more than the static percentage',
              'No — pledging should always be treated as disqualifying regardless of context',
            ],
            correct: 'No — the rate of change and the presence or absence of an explanation matter more than the static percentage',
          },
          explanation:
            'The identical headline number hides two very different underlying situations. A stable, explained pledge and a sudden, unexplained spike to the same level are not the same fact, even though the single quoted percentage makes them look that way.',
        },
      ],
    },
  ],
};

export default lesson;
