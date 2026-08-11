import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — reading a contract note
 *
 * The document every Indian broker emails after every trading day, which almost
 * nobody opens. It is the only independent record of what you were actually
 * charged, and it is the difference between believing your broker's summary
 * screen and checking it.
 *
 * The lesson comes straight after the cost lesson on purpose: that one taught
 * what the charges ARE, this one teaches where to find them written down and how
 * to tell whether the number is right.
 */
export const lesson: Lesson = {
  id: 'in-t1-contract-note',
  tier: 'T1',
  market: 'IN',
  title: 'Reading your contract note',
  summary:
    'The document your broker emails after every trading day, line by line. It is the only independent record of what you were charged, and it takes four minutes to check.',
  plainSummary:
    'Your broker sends a document after every day you trade. This shows you how to read it and check that the charges are right.',
  objectives: [
    'Identify the trade details, the charges and the net amount on a contract note',
    'Recompute a charge from the note and confirm it matches',
    'Say which line the broker sets and which are fixed by law',
    'Decide whether a given discrepancy is worth raising',
  ],
  prerequisites: ['in-t1-real-cost-of-a-trade'],
  estimatedMinutes: 13,
  introduces: ['brokerage', 'stt', 'gst', 'stamp-duty', 'dp-charges', 'turnover', 'delivery', 'intraday'],
  skills: ['costs', 'record-keeping'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Your broker’s app shows a tidy summary: bought 100 shares, total ₹1,40,236. Why bother opening the contract note as well?',
      options: [
        'No reason — the app is the same information',
        'It is the legal record, itemised, and the app is a summary the broker wrote',
        'Only for tax season',
      ],
      correct: 1,
      reveal:
        'It is the legal record. The app screen is a convenience your broker designed; the contract note is a document they are required to send, itemised, with every charge on a separate line. Those are different things. If a charge is wrong, the note is what proves it. It is also the only place showing the split between what the government took and what your broker took. Four minutes with it after your first few trades will teach you more about costs than any amount of reading.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Four sections, in this order',
      md:
        '**What you traded.** Company, quantity, price, and whether it was **intraday** or **delivery**. Check this first — everything below depends on it.\n\n**Turnover.** Quantity times price. The base that most charges are a percentage of.\n\n**The charge lines.** Brokerage, then the statutory ones, then GST on top of some of them.\n\n**Net amount.** What actually left or entered your bank account.',
    },
    {
      kind: 'widget',
      component: 'CostBreakdownTable',
      props: { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
      takeaway:
        'This is the same set of lines your note carries, computed by the same rules. Compare it against a real note side by side.',
    },
    {
      kind: 'example',
      title: 'Checking a note, line by line',
      setup:
        'A note arrives for a delivery buy: 100 shares at ₹1,400. Rather than trusting the total, recompute each line yourself. This is the whole skill, and it takes about four minutes.',
      steps: [
        {
          label: 'Turnover',
          detail: 'Quantity times price — the base for the percentage charges',
          compute: { fn: 'turnover', price: 1400, quantity: 100 },
        },
        {
          label: 'Brokerage',
          detail: 'The only line your broker chooses. Zero on delivery at a discount broker',
          compute: { fn: 'legCostLine', key: 'brokerage', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
        {
          label: 'Securities transaction tax',
          detail: 'A percentage of turnover, set by the government, identical everywhere',
          compute: { fn: 'legCostLine', key: 'stt', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
        {
          label: 'Stamp duty',
          detail: 'Charged on the buy side only',
          compute: { fn: 'legCostLine', key: 'stamp', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
        {
          label: 'Everything, added up',
          detail: 'If your note says something else, one of you has made a mistake',
          compute: { fn: 'legCost', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
      ],
      conclusion:
        'Every line is reproducible from two numbers you already know. A charge you cannot reproduce is a charge worth asking about.',
    },
    {
      kind: 'predict',
      prompt:
        'Your note shows a charge you did not expect, labelled DP charges, on a day you SOLD shares. Work out what it is before you look.',
      options: [
        'A mistake — you have never seen it before',
        'The depository fee for taking shares out of your account',
        'Brokerage under a different name',
      ],
      correct: 1,
      reveal:
        'The depository fee. It applies when shares LEAVE your account, so it appears on sells and never on buys — which is exactly why it surprises people the first time. It is also a flat amount per company per day rather than a percentage, so it is trivial on a large sale and painful on a small one. Selling ₹5,000 of one company and ₹5,000 of another on the same day costs twice as much here as selling ₹10,000 of one. That is a real, avoidable cost that nobody mentions.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'BrokerComparator',
      props: { market: 'IN', product: 'delivery', price: 1400, quantity: 100 },
      takeaway:
        'Change the broker and watch which lines move. Almost all of them do not — and that tells you how much shopping around can actually save.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Keep them',
      md:
        'Contract notes are how you compute your tax at the end of the year, and how you prove anything if a dispute ever arises.\n\nBrokers keep them available for a limited period and then stop. Downloading them once a month into a folder takes a minute and saves an afternoon later.\n\nThe same applies if you change broker. Your new one has no record of what you paid at the old one, and the tax office will still expect you to know.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A note shows a delivery buy of 100 shares at ₹1,400. What should the securities transaction tax line say?',
          type: 'compute',
          spec: {
            metric: 'legCostAmount',
            key: 'stt',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            side: 'buy',
            price: 1400,
            quantity: 100,
            tolerance: 1,
          },
          explanation:
            'It is a fixed percentage of turnover, so it is the same at every broker in the country and you can always check it in one multiplication. If a note ever disagrees with this, it is either a different product type than you thought — intraday and delivery are charged at different rates — or a genuine error worth raising.',
        },
        {
          prompt:
            'Sort each line on a contract note by whether your broker decides it.',
          type: 'classify',
          spec: {
            categories: ['The broker sets this', 'Fixed by law or the exchange'],
            items: [
              { label: 'Brokerage', category: 'The broker sets this' },
              { label: 'Securities transaction tax', category: 'Fixed by law or the exchange' },
              { label: 'Stamp duty', category: 'Fixed by law or the exchange' },
              { label: 'Exchange transaction charge', category: 'Fixed by law or the exchange' },
            ],
          },
          explanation:
            'One line out of four. That is the honest answer to "which broker is cheapest". On most trades the difference between brokers is a single line, and on a delivery trade that line is often zero. Choosing a broker on cost alone is a decision about a small part of a small number.',
        },
        {
          prompt:
            'Your note shows brokerage of ₹40 on a delivery trade where your broker advertises zero brokerage on delivery. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Ignore it — ₹40 is not worth the effort',
              'Raise it, because the note is the record and the discrepancy is checkable',
              'Assume the advertised rate has changed',
            ],
            correct: 'Raise it, because the note is the record and the discrepancy is checkable',
          },
          explanation:
            'Raise it. The amount is small and the point is not the amount. You now have a documented, reproducible discrepancy, which is a different conversation from "I think I was overcharged". It may well turn out the trade was booked as intraday rather than delivery, which is itself worth knowing. Either way, a person who checks their notes gets a different quality of answer than one who does not.',
        },
      ],
    },
  ],
};

export default lesson;
