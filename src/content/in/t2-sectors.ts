import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — sectors and why comparisons break
 *
 * The last lesson of the business-reading stage, and the one that stops
 * everything taught in it from being misapplied. A ratio is only meaningful
 * against a comparable, and most published comparisons are not.
 *
 * The clearest case is a bank. Debt is a bank's raw material, so a
 * debt-to-equity screen flags every bank in the country as dangerous and every
 * software firm as pristine, and the screen has told you nothing except which
 * industry each one is in.
 *
 * The lesson also handles cyclicality, where the multiple inverts: a cyclical
 * company looks cheapest at the top of its cycle, because earnings are peaking
 * and about to fall.
 */
export const lesson: Lesson = {
  id: 'in-t2-sectors',
  tier: 'T2',
  market: 'IN',
  title: 'Sectors, cycles and why comparisons break',
  summary:
    'A bank and a software firm cannot be compared on the same ratios, and a cyclical company looks cheapest exactly when it is most dangerous.',
  plainSummary:
    'Different kinds of business need to be judged in different ways. This shows why comparing them with the same numbers gives the wrong answer.',
  objectives: [
    'Say why debt levels mean different things in different industries',
    'Explain why a cyclical company looks cheap at the worst moment',
    'Compare two companies only against relevant peers',
    'Decide whether a given cross-industry comparison is meaningful',
  ],
  prerequisites: ['in-t2-screening'],
  estimatedMinutes: 13,
  introduces: ['index', 'base-rate', 'volatility'],
  skills: ['fundamentals', 'valuation', 'evidence'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You screen for companies with low debt. Every software firm passes and every bank fails. What have you actually measured?',
      options: [
        'That banks are riskier than software firms',
        'Which industry each company is in',
        'That banks are badly managed',
      ],
      correct: 1,
      reveal:
        'You have sorted by industry. A bank borrows money and lends it out — debt is its raw material, not a warning sign, and a bank with no borrowing would have no business. A software firm needs almost no capital, so it naturally has none. The screen was never measuring financial health; it was measuring what kind of company each one is. This is the single most common way a perfectly sensible ratio produces a completely meaningless list, and it happens quietly because the output still looks like a list of companies.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What differs between industries',
      md:
        '**How much capital it needs.** A steel plant costs thousands of crore before it sells anything. A consulting firm needs laptops.\n\n**How fast it collects.** A supermarket is paid in cash at the till. A construction firm waits months.\n\n**Whether it repeats.** A subscription arrives every month. A wedding-dress shop sells to each customer once.\n\nEvery ratio you have learnt is affected by all three, so the only fair comparison is against companies with the same shape.',
    },
    {
      kind: 'predict',
      prompt:
        'A steel company trades at 4 times earnings after three record years. Its long-run average is 14. What is the most likely reading?',
      options: [
        'It is unusually cheap',
        'Earnings are at a cyclical peak and expected to fall',
        'The market has stopped paying attention to it',
      ],
      correct: 1,
      reveal:
        'Earnings are peaking. Cyclical businesses — steel, cement, chemicals, shipping — earn a great deal at the top of their cycle and lose money at the bottom, so their multiple inverts. It looks cheapest exactly when earnings are highest and about to fall, and most expensive at the bottom when earnings are near zero. Applying the ordinary rule to a cyclical company gets you in at the top and out at the bottom, with perfect confidence, every cycle. For these businesses the multiple is read backwards.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'The same ratio, three industries',
      setup:
        'Three companies each earn ₹100 crore. A bank, a software firm and a cement maker. Look at what a single ratio says about each, and what it is really telling you.',
      steps: [
        {
          label: 'The bank — what it owes',
          detail: 'Deposits it lends out. This is the business, not a problem',
          compute: { fn: 'literal', value: 9000 },
        },
        {
          label: 'The software firm — what it owes',
          detail: 'Almost nothing, because it needs almost no capital',
          compute: { fn: 'literal', value: 50 },
        },
        {
          label: 'The cement maker — what it owes',
          detail: 'Plants are expensive and were built with borrowed money',
          compute: { fn: 'literal', value: 2200 },
        },
        {
          label: 'What a low-debt screen selects here',
          detail: 'One company, chosen for its industry rather than its quality',
          compute: { fn: 'literal', value: 1 },
        },
        {
          label: 'How many are actually in trouble',
          detail: 'Unknowable from this ratio. It answered a different question',
          compute: { fn: 'literal', value: 0 },
        },
      ],
      conclusion:
        'Three healthy companies, one screen, and the result is a sorted list of industries wearing the costume of a quality filter.',
    },
    {
      kind: 'predict',
      prompt:
        'The same cement company after two bad years: earnings collapse to ₹8 crore and the multiple rises to 40. Work out the reading before you look.',
      options: [
        'It has become expensive — avoid it',
        'Earnings are near a cyclical bottom, which is historically when these are worth looking at',
        'The company is failing',
      ],
      correct: 1,
      reveal:
        'Near the bottom, which is the moment a cyclical business is most interesting and looks worst. The multiple is 40 because the denominator collapsed, not because the price ran up. This is the exact inverse of the earlier question, and together they are the whole lesson about cyclicals: high multiple at the bottom, low multiple at the top. Anybody applying the ordinary rule buys them at 4 and sells them at 40, which is precisely backwards and feels completely rational at both moments.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: '^NSEI', interval: '1mo', range: '10y' },
      mode: 'view',
      takeaway:
        'Ten years of the whole market. Different sectors led at different points here, and each time the leadership looked permanent from inside it.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Two questions before any comparison',
      md:
        '**Are these the same shape of business?** Same capital needs, same collection cycle, same repeat pattern. If not, the ratio is measuring the shape.\n\n**Is this a cyclical business?** If so, compare the multiple against its own history rather than against other industries, and read it inverted.\n\nA comparison that fails either test is not evidence. It is a number that happens to be computable, which is a much lower standard than being meaningful.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A cyclical company earned ₹200 crore last year and ₹25 crore this year, at an unchanged price of ₹1,000 crore. What is its multiple now?',
          type: 'compute',
          spec: { metric: 'literal', value: 40, tolerance: 1, unit: 'x' },
          explanation:
            '₹1,000 ÷ ₹25 = 40, up from 5 last year, with the price unchanged. Every rupee of that change came from the denominator. For a cyclical business this is the normal pattern, and not a signal about the price at all. It is why these companies are compared against their own history rather than a market average.',
        },
        {
          prompt:
            'Sort each comparison by whether it is meaningful.',
          type: 'classify',
          spec: {
            categories: ['Meaningful', 'Measuring the industry instead'],
            items: [
              { label: 'Two banks on the same lending ratios', category: 'Meaningful' },
              { label: 'One cement maker against its own ten-year history', category: 'Meaningful' },
              { label: 'A bank against a software firm on debt', category: 'Measuring the industry instead' },
              { label: 'A supermarket against a builder on collection days', category: 'Measuring the industry instead' },
            ],
          },
          explanation:
            'The first two compare like with like. The last two produce numbers that differ enormously for reasons that have nothing to do with quality, and the output looks exactly as authoritative either way. Whenever a ratio shows a dramatic difference between two companies, the first question is whether it is measuring the businesses or the industries.',
        },
        {
          prompt:
            'A screen returns a list where 18 of 20 names are from the same sector. Decide what that most likely means.',
          type: 'decision',
          spec: {
            options: [
              'That sector is genuinely the best opportunity right now',
              'Your filter is selecting for something structural about that industry',
              'The screen is broken',
            ],
            correct: 'Your filter is selecting for something structural about that industry',
          },
          explanation:
            'It is selecting for the industry. A filter that concentrates in one sector has almost always caught a structural feature — high margins are normal there, or low debt is, or fast collection is. Occasionally the concentration is real and interesting. But the default reading is that you built an industry detector by accident, and the cheapest way to check is to run the same filter within each sector separately.',
        },
      ],
    },
  ],
};

export default lesson;
