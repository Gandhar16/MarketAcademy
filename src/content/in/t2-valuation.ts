import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — valuation multiples
 *
 * A multiple is a SENTENCE about expectations, not a score out of ten. "P/E is
 * 40" does not mean expensive; it means the market expects growth, and the
 * useful question is whether that expectation is reasonable.
 *
 * The lesson has to kill two opposite errors at once:
 *   - low multiple means cheap (usually it means the market expects trouble)
 *   - high multiple means overvalued (frequently the best businesses)
 *
 * Both come from treating the number as a verdict rather than as a claim you
 * can agree or disagree with.
 */
export const lesson: Lesson = {
  id: 'in-t2-valuation',
  tier: 'T2',
  market: 'IN',
  title: 'What a multiple is really saying',
  summary:
    'P/E is not a score. It is a sentence about what the market expects, and the only useful response is to decide whether you agree with it.',
  plainSummary:
    'People compare companies using a number called the P/E. This explains what that number is actually telling you, and what it is not.',
  objectives: [
    'Compute a price-to-earnings ratio and say what it means in years',
    'Explain why a low multiple is usually not a bargain',
    'Say why two companies in different industries cannot be compared this way',
    'Decide what question a given multiple should prompt',
  ],
  prerequisites: ['in-t2-profit-vs-cash'],
  estimatedMinutes: 13,
  introduces: ['share', 'index', 'dividend'],
  skills: ['valuation', 'fundamentals'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Company A trades at 12 times its earnings. Company B trades at 45 times. Which is the better buy?',
      options: ['A — it is cheaper', 'B — the market clearly likes it', 'Neither number answers that'],
      correct: 2,
      reveal:
        'Neither number answers it. A multiple is a sentence about expectations, not a verdict. Twelve times says the market expects little growth and possibly trouble; forty-five times says it expects a great deal of growth. Both can be right and both can be wrong. The useful move is to translate the number into a claim — "the market thinks this will grow quickly for years" — and then ask whether you agree. A multiple you cannot turn into a sentence is a number you are not using.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What the number literally is',
      md:
        'Price divided by earnings per share. If a company earns ₹50 a share and trades at ₹600, that is 12.\n\nThe most useful reading is in **years**: at today’s earnings, twelve years of them would add up to what you paid.\n\nSo a high multiple is a statement that earnings are expected to grow — nobody pays forty-five years of today’s earnings unless they expect tomorrow’s to be larger. That is the sentence. Everything else is whether you believe it.',
    },
    {
      kind: 'predict',
      prompt:
        'A company’s multiple has fallen from 25 to 8 over two years while its earnings kept rising. What is the most likely reason?',
      options: [
        'It has become a bargain',
        'The market expects those earnings to fall or stop growing',
        'The market has made an error',
      ],
      correct: 1,
      reveal:
        'The market expects the earnings to stop. A multiple collapsing while earnings rise is a reliable signal that somebody knows something about the future of those earnings. A contract ending, a regulation arriving, a competitor winning. It is occasionally an over-reaction and that is where money is made. But the default reading of a very low multiple is not "cheap". It is "the market is pricing a decline", and your job is to work out whether that decline is real.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'The same multiple, two very different sentences',
      setup:
        'Two companies both trade at 30 times earnings. One earns ₹20 a share and grows 25% a year. The other earns ₹20 a share and has not grown in five years. Same multiple, same earnings.',
      steps: [
        {
          label: 'What both cost',
          detail: '30 times ₹20 of earnings per share',
          compute: { fn: 'multiply', a: 30, b: 20, dp: 0 },
        },
        {
          label: 'The grower, in three years',
          detail: '₹20 growing 25% a year becomes about ₹39',
          compute: { fn: 'compoundFinal', initial: 20, contribution: 0, years: 3, ratePercent: 25 },
        },
        {
          label: 'Its multiple in three years, at the same price',
          detail: '₹600 divided by the larger earnings. It got cheaper by standing still',
          compute: { fn: 'literal', value: 15.4 },
        },
        {
          label: 'The other one, in three years',
          detail: 'No growth means the same ₹20',
          compute: { fn: 'literal', value: 20 },
        },
        {
          label: 'Its multiple in three years',
          detail: 'Unchanged at 30, and now visibly expensive',
          compute: { fn: 'literal', value: 30 },
        },
      ],
      conclusion:
        'Identical numbers today, and in three years one of them is at 15 and the other still at 30. The multiple was never the point — the growth behind it was.',
    },
    {
      kind: 'predict',
      prompt:
        'Same grower. Work it out before you look — if it keeps growing 25% a year, what is its multiple after five years at an unchanged price?',
      options: ['About 20', 'About 10', 'About 6', 'Still 30'],
      correct: 1,
      reveal:
        'About 10. Earnings of ₹20 growing 25% for five years reach roughly ₹61, and ₹600 divided by ₹61 is just under 10. This is why an apparently expensive company can be a good purchase and an apparently cheap one can be a poor one. Time and growth do the work, and the multiple you paid becomes less relevant every year the growth continues. The whole risk in that sentence is the word "if" — you are paying today for growth that has not happened yet, and if it stops, you own something at 30 times.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: '^NSEI', interval: '1mo', range: '10y' },
      mode: 'view',
      takeaway:
        'Ten years of the index. Multiples across the whole market expanded and contracted several times here, and none of those turns was obvious in advance.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'When the comparison is meaningless',
      md:
        'Multiples only compare like with like, and most published comparisons do not.\n\n**Different industries.** A bank, a software firm and a cement company have completely different capital needs and growth patterns. Their multiples are not on the same scale.\n\n**A loss-making year.** Divide by a negative and the number is meaningless, so it is usually just omitted — which quietly removes the worst companies from any screen.\n\n**One-off items.** A single asset sale can halve the multiple for a year without anything changing.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A share trades at ₹840 and the company earns ₹42 a share. What is its price-to-earnings ratio?',
          type: 'compute',
          spec: { metric: 'literal', value: 20, tolerance: 0.5, unit: 'x' },
          explanation:
            '₹840 ÷ ₹42 = 20. Read it as twenty years of today’s earnings. That framing is more useful than the bare number. It raises the right question at once: is there reason to think earnings twenty years from now will be larger, and how confident am I?',
        },
        {
          prompt:
            'Sort each statement about a company trading at 8 times earnings.',
          type: 'classify',
          spec: {
            categories: ['The number tells you this', 'You are assuming this'],
            items: [
              { label: 'Its price is 8 times its recent earnings', category: 'The number tells you this' },
              { label: 'The market expects little or no growth', category: 'The number tells you this' },
              { label: 'It is a bargain', category: 'You are assuming this' },
              { label: 'The market is wrong about it', category: 'You are assuming this' },
            ],
          },
          explanation:
            'The first two are readings of the number. The last two are your own judgement, and they may well be right — that is what investing in an unloved company is. The error is not holding those views. It is failing to notice that they are views, and treating a low multiple as though it had already established them.',
        },
        {
          prompt:
            'A screen shows a company at 4 times earnings, far below every competitor. Decide what to do first.',
          type: 'decision',
          spec: {
            options: [
              'Buy it — that is obviously cheap',
              'Find out what the market is worried about, because at 4 times it is worried about something',
              'Ignore it as an error',
            ],
            correct: 'Find out what the market is worried about, because at 4 times it is worried about something',
          },
          explanation:
            'Find the worry. A multiple that far below its peers loudly states that somebody expects those earnings to fall. There is usually a specific reason: a court case, one dominant customer, an accounting question. Occasionally the market is wrong and that is exactly where good returns come from. But you cannot decide the market is wrong until you know what it thinks, and a screen will never tell you that.',
        },
      ],
    },
  ],
};

export default lesson;
