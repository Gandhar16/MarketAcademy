import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Reading a business like an analyst — quality of earnings
 *
 * `t2-profit-vs-cash` taught the mechanism: profit is an opinion, cash is a
 * fact, and a profitable company can still run out of money. This lesson
 * turns that into a checklist — the handful of concrete things worth looking
 * at before trusting a rising profit number, and the honest caution that one
 * red flag is a question, not a verdict.
 */
export const lesson: Lesson = {
  id: 'in-t2-quality-of-earnings',
  tier: 'T2',
  market: 'IN',
  title: 'When profit is not what it looks like',
  summary:
    'Rising profit with flat cash flow, rising receivable days, frequent related-party transactions — none of these prove anything by themselves. Together, over several years, they are worth checking before anything else.',
  plainSummary:
    'Sometimes a company’s reported profit does not match the cash actually coming in. This shows the specific things worth checking before trusting a profit number at face value.',
  objectives: [
    'Explain why rising profit alongside flat operating cash flow is worth investigating',
    'Compute receivable days and interpret a rising or falling trend',
    'List the handful of concrete red flags analysts check first',
    'Decide how much weight a single red flag deserves against otherwise clean financials',
  ],
  prerequisites: ['in-t2-debt-and-solvency'],
  estimatedMinutes: 15,
  introduces: ['quality-of-earnings'],
  skills: ['fundamentals', 'quality-of-earnings'],
  blocks: [
    {
      kind: 'predict',
      prompt: 'A company reports rising profit for three straight years. Operating cash flow has stayed flat the whole time. What should that gap make you check first?',
      options: [
        'Nothing — rising profit is rising profit',
        'Whether that profit is genuinely turning into cash, or is built partly from accounting choices',
        'The stock’s recent chart pattern',
      ],
      correct: 1,
      reveal:
        'Whether the profit is backed by cash. A single quarter of divergence between profit and operating cash flow happens for ordinary reasons and is not alarming on its own. Three straight years of it is a different fact. Accounting profit and the actual cash the business generated have been drifting apart for long enough that it is not a timing accident.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The checklist',
      md:
        '**Profit rising while operating cash flow stays flat**, for more than a year or two.\n\n**Receivable days rising** — customers taking longer to pay, or revenue booked before cash arrives.\n\n**Related-party transactions** — money moving to entities connected to promoters, worth checking even when disclosed and legal.\n\n**Frequent auditor changes**, especially unexplained ones.\n\nNone of these proves anything alone. Together, and sustained over time, they are the actual checklist behind "quality of earnings".',
    },
    {
      kind: 'example',
      title: 'Computing receivable days',
      setup: 'A company’s revenue is ₹800 crore. Trade receivables — money owed by customers, not yet collected — stand at ₹220 crore at year end. Two years ago, receivable days were 55.',
      steps: [
        { label: 'Receivable days this year', detail: '(Receivables ÷ Revenue) × 365', compute: { fn: 'literal', value: 100 } },
        { label: 'Receivable days two years ago', detail: 'Given, for comparison', value: '55 days' },
        { label: 'The change', detail: 'Customers now taking roughly twice as long to pay', compute: { fn: 'literal', value: 45 } },
      ],
      conclusion: 'Receivable days nearly doubling is a genuine warning sign, worth investigating before trusting the revenue growth headline on its own.',
    },
    {
      kind: 'predict',
      prompt: 'A different company’s receivable days FALL from 70 to 40 over two years, while revenue keeps growing. What is the honest read?',
      options: [
        'A red flag — something is wrong',
        'Actually reassuring — revenue growth is being collected in cash faster, not just booked on paper',
        'No information either way',
      ],
      correct: 1,
      reveal:
        'Reassuring. Falling receivable days alongside growing revenue means the company is collecting cash from customers faster even as it sells more — the opposite of the warning sign in the earlier example. The same metric, moving the other direction, is genuinely good news rather than neutral.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'earnings-roulette',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'One red flag is a question, not a verdict',
      md:
        'A single related-party transaction, disclosed and explained, is common and often entirely ordinary. A single quarter of cash-flow softness from one large one-off payment is not automatically alarming either.\n\nWhat is worth real concern is several of these signals appearing together, sustained over more than one reporting period. The discipline is checking the whole list before deciding anything, not reacting to one line in one filing.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'Revenue is ₹600 crore. Trade receivables are ₹150 crore. What are receivable days, using a 365-day year?',
          type: 'compute',
          spec: { metric: 'literal', value: 91.25, tolerance: 2, unit: 'days' },
          explanation: '(₹150 crore ÷ ₹600 crore) × 365 = 91.25 days. Roughly three months between a sale and the cash actually arriving.',
        },
        {
          prompt: 'Classify each situation.',
          type: 'classify',
          spec: {
            categories: ['Worth investigating', 'Not automatically alarming'],
            items: [
              { label: 'Profit rising while operating cash flow stays flat, for several years', category: 'Worth investigating' },
              { label: 'Receivable days falling while revenue grows', category: 'Not automatically alarming' },
              { label: 'Frequent, unexplained auditor changes', category: 'Worth investigating' },
              { label: 'One quarter of weaker cash flow from a single disclosed one-off payment', category: 'Not automatically alarming' },
            ],
          },
          explanation:
            'Duration and pattern are what separate a real signal from noise. A single quarter, explained, is ordinary business. The same thing repeating for years, unexplained, is the checklist this lesson taught.',
        },
        {
          prompt: 'A company shows one disclosed related-party transaction this year. Everything else — cash flow, receivable days, auditor — looks clean. What is the sensible response?',
          type: 'decision',
          spec: {
            options: [
              'Assume the worst and avoid the stock entirely',
              'Note it, check whether it is properly disclosed and explained, and weigh it alongside everything else',
              'Ignore it since the rest looks fine',
            ],
            correct: 'Note it, check whether it is properly disclosed and explained, and weigh it alongside everything else',
          },
          explanation:
            'Weighed, not ignored and not treated as disqualifying on its own. One disclosed item against an otherwise clean checklist is exactly the case this lesson’s closing warning was written for — a question, not a verdict.',
        },
      ],
    },
  ],
};

export default lesson;
