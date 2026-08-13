import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — profit is an opinion, cash is a fact
 *
 * The lesson the previous one set up. Companies do not fail because they are
 * unprofitable; they fail because on a particular day they cannot pay somebody.
 *
 * The mechanism is receivables and inventory. A fast-growing company books
 * profit on sales it has not been paid for and buys stock it has not sold, and
 * both consume cash. That is ordinary and survivable. The warning sign is when
 * receivables grow much faster than sales for several years running, because
 * that is what both aggressive accounting and genuine collection trouble look
 * like from outside.
 */
export const lesson: Lesson = {
  id: 'in-t2-profit-vs-cash',
  tier: 'T2',
  market: 'IN',
  title: 'Profit is an opinion, cash is a fact',
  summary:
    'A profitable company can run out of money, and the accounts say so a year before anybody notices. Here is where that shows up first.',
  plainSummary:
    'A company can be making money on paper and still run out of cash. This shows how that happens and where to look for it.',
  objectives: [
    'Explain why a sale becomes profit before it becomes cash',
    'Compute the gap between reported profit and cash collected',
    'Say what it means when money owed by customers grows faster than sales',
    'Decide whether a given profit-and-cash pattern is worth worrying about',
  ],
  prerequisites: ['in-t2-financials'],
  estimatedMinutes: 13,
  introduces: ['dividend', 'share'],
  skills: ['fundamentals', 'accounting-basics', 'evidence'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A company doubles its sales every year and reports growing profits throughout. Its cash falls every year. Which is the most likely explanation?',
      options: [
        'The accounts are fraudulent',
        'Growth itself consumes cash — you pay for stock and staff before customers pay you',
        'It is paying too much in dividends',
      ],
      correct: 1,
      reveal:
        'Growth consumes cash, and this is the ordinary case rather than the sinister one. To double your sales you buy twice the stock, hire ahead of the revenue, and extend credit to more customers. All of that money goes out before any of it comes back. Fast-growing companies are frequently cash-hungry and perfectly healthy. What separates the healthy case from the dangerous one is not the direction of cash. It is whether the money owed to them grows in proportion to sales, or much faster.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'ReceivablesTrendExplainer',
      props: {},
      takeaway:
        'Step through it once. No single bar is alarming on its own — it is the climb across all three that is the finding.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Where the gap comes from',
      md:
        'Three places, and all three are legitimate.\n\n**Money customers owe you.** A sale counts as profit the day it is made. The cash may arrive in ninety days, or never.\n\n**Stock on the shelf.** You paid for it. It is not profit until somebody buys it.\n\n**Things that wear out.** A machine bought once is charged against profit over many years, so profit falls in years no money left.\n\nEach one moves profit and cash apart, in one direction or the other.',
    },
    {
      kind: 'predict',
      prompt:
        'Sales grow 20% this year. Money owed by customers grows 70%. What does that most likely mean?',
      options: [
        'Business is booming',
        'Customers are paying much more slowly, or some sales are not being collected',
        'Nothing — the two are unrelated',
      ],
      correct: 1,
      reveal:
        'Collection is deteriorating. If sales grow 20%, the money owed to you should grow roughly 20% too — that is what it means for the same business to be bigger. Growing at 70% means each rupee of sales takes much longer to become money. That happens when customers are struggling, when the company loosened its terms to win business, or when some sales were never going to be collected. All three are worth knowing about, and none of them appear anywhere on the profit line.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'Two years of a company that looks fine',
      setup:
        'A company reports rising profits for two years. Follow the money owed to it alongside its sales, which is the comparison nobody makes.',
      steps: [
        {
          label: 'Year 1 — sales',
          detail: 'The headline number, in crore rupees',
          compute: { fn: 'literal', value: 500 },
        },
        {
          label: 'Year 1 — owed by customers',
          detail: 'About 73 days of sales. Ordinary for most industries',
          compute: { fn: 'literal', value: 100 },
        },
        {
          label: 'Year 2 — sales, up 20%',
          detail: 'Genuine growth. The profit line looks excellent',
          compute: { fn: 'literal', value: 600 },
        },
        {
          label: 'Year 2 — owed by customers, up 70%',
          detail: 'Now about 103 days of sales, from 73',
          compute: { fn: 'literal', value: 170 },
        },
        {
          label: 'The extra cash this consumed',
          detail: 'Profit that was reported and never collected',
          compute: { fn: 'literal', value: 70 },
        },
      ],
      conclusion:
        'Sales up 20%, profits up, and ₹70 crore more of the money is sitting with customers rather than in the bank.',
    },
    {
      kind: 'predict',
      prompt:
        'Same company. Sales grow another 20% to ₹720 crore and money owed grows another 70%, to ₹289 crore. Work out the days before you look.',
      options: ['About 100 days', 'About 146 days', 'About 73 days, back to normal'],
      correct: 1,
      reveal:
        'About 146 days — customers now take five months to pay, against two and a half at the start. The pattern is what matters, not any single year: 73, then 103, then 146. One year of deterioration is a bad year, and three in a row is a trend that ends somewhere. This is the single most useful ratio in reading company accounts, it takes one division, and it appears in no headline. When a company that had been growing suddenly writes off a large amount, this number usually saw it coming.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt: 'Sales grow 15% this year. Unsold stock on the shelf grows 60%. What does that most likely suggest?',
      options: [
        'The company is preparing for even faster growth ahead',
        'Products may not be selling as expected, and cash is tied up in unsold stock',
        'Nothing — stock and sales are unrelated',
      ],
      correct: 1,
      reveal:
        'A warning sign, not preparation. Unsold stock growing far faster than sales usually means what was made is not selling as planned, or the company is over-ordering. Either way it consumes cash the same way slow-paying customers do.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'TCS.NS', interval: '1mo', range: '5y' },
      mode: 'view',
      takeaway:
        'The price reacts to the profit line within minutes. The cash statement moves nobody on the day, and is where the trouble is visible first.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What to actually check, in two minutes',
      md:
        'Every year, for any company you hold:\n\n**Cash from operations against reported profit.** Over several years these should be roughly similar. If profit is consistently far larger, ask why.\n\n**Money owed by customers against sales.** They should grow together. If one runs away from the other for more than a year, ask why.\n\nNeither is proof of anything. Both are questions, and a company with a good answer will have one ready.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            "A company's unsold stock grows 55% while sales grow only 12%. Decide what this deserves.",
          type: 'decision',
          spec: {
            options: [
              'Nothing — inventory growth is always healthy',
              'A question — stock rising much faster than sales often means slower-than-expected demand',
              'Immediate concern that the company is committing fraud',
            ],
            correct: 'A question — stock rising much faster than sales often means slower-than-expected demand',
          },
          explanation:
            'A question, not an accusation. This is the inventory version of the receivables check — a mismatch worth asking about, not proof of anything by itself.',
        },
        {
          prompt:
            'Sales are ₹900 crore and customers owe ₹180 crore. How many days of sales is that? Use 365 days.',
          type: 'compute',
          spec: { metric: 'literal', value: 73, tolerance: 2, unit: 'days' },
          explanation:
            '₹180 ÷ ₹900 × 365 = 73 days. On its own the number means little, because it varies enormously by industry — a supermarket collects in hours and a construction firm in months. What means something is the same company’s number, tracked across four or five years. That comparison is free and almost nobody makes it.',
        },
        {
          prompt:
            'Sort each pattern by whether it deserves investigation.',
          type: 'classify',
          spec: {
            categories: ['Worth a question', 'Ordinary'],
            items: [
              { label: 'Profit rises for 4 years, cash from operations falls each year', category: 'Worth a question' },
              { label: 'Money owed grows three times as fast as sales', category: 'Worth a question' },
              { label: 'A fast-growing company consumes cash', category: 'Ordinary' },
              { label: 'Profit falls in a year a large machine was written down', category: 'Ordinary' },
            ],
          },
          explanation:
            'The two on the right have obvious mechanical explanations. The two on the left might too — but they are the patterns that precede most accounting problems, and the point is to ask rather than to accuse. A company with a good explanation loses nothing by giving it; one that cannot has told you something.',
        },
        {
          prompt:
            'A company you hold reports its fourth consecutive year of profits with negative cash from operations. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Ignore it — four years of profit is a good record',
              'Treat it as a serious question about whether the profits are real',
              'Sell immediately',
            ],
            correct: 'Treat it as a serious question about whether the profits are real',
          },
          explanation:
            'Take it seriously. One or two years is explainable by growth. Four is a business that has never converted its reported profits into money, and profit that never becomes cash is an opinion that has not yet been tested. Selling immediately is not the lesson — investigating is. But a company that cannot explain this pattern is one where the headline number and the reality have been diverging for years.',
        },
      ],
    },
  ],
};

export default lesson;
