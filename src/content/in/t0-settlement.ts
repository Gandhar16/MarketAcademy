import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — settlement
 *
 * The gap between trading and owning. Beginners see "T+1" on a broker screen,
 * assume it is jargon that does not concern them, and are then surprised by
 * three separate things: the money leaves immediately, the shares arrive later,
 * and selling something you have not received yet has consequences.
 *
 * The lesson keeps one fact at the centre: a trade is a PROMISE, and settlement
 * is when the promise is kept. Everything else — why you cannot spend the money
 * instantly, why short delivery exists, why the dividend record date matters —
 * follows from that.
 */
export const lesson: Lesson = {
  id: 'in-t0-settlement',
  tier: 'T0',
  market: 'IN',
  title: 'Where the shares go after you buy',
  summary:
    'A trade is a promise. Settlement is when it is kept — the next working day in India. Until then you have bought something you do not yet hold.',
  plainSummary:
    'Buying is not the same moment as receiving. This shows what happens between the two, and why the money leaves before the shares arrive.',
  objectives: [
    'Say what settlement means and when it happens in India',
    'Describe the state you are in between trading and settling',
    'Work out the day shares from a given trade will reach your account',
    'Explain why the seller not delivering is a real risk somebody has to cover',
  ],
  prerequisites: ['in-t0-who-does-what'],
  estimatedMinutes: 11,
  introduces: ['t-plus-one', 'depository', 'delivery', 'share', 'broker', 'exchange'],
  skills: ['foundations', 'settlement'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You buy shares at 10 a.m. on Monday. At 3 p.m. on Monday, do you own them?',
      options: [
        'Yes — the trade happened',
        'No — you have a promise, and it is kept on Tuesday',
        'Only if the price has gone up',
      ],
      correct: 1,
      reveal:
        'You have a promise. The trade is agreed and binding, and the actual exchange of shares for money happens the next working day. India settles on what is called T+1 — trade day plus one. In between, your money is already committed and the shares are not yet in your account. This is not a technicality. It is why selling shares you bought yesterday behaves differently from selling shares held for a year. It is also why somebody failing to deliver is a problem the whole system plans for.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Trade day, then settlement day',
      md:
        'A trade creates an **obligation**. You owe money; the seller owes shares.\n\n**Settlement** is the day those obligations are actually met — money moves to the seller, shares move into your account at the **depository**.\n\nIndia does this the next working day, written **T+1**. Trade on Monday, settle on Tuesday. Trade on Friday, settle on Monday, because weekends are not working days.\n\nUntil settlement, you hold a claim rather than a share.',
    },
    {
      kind: 'widget',
      component: 'SettlementChain',
      props: {},
      takeaway:
        'Walk the trade through each stage. Notice how many separate steps sit between the moment you tapped buy and the moment anything is yours.',
    },
    {
      kind: 'example',
      title: 'Monday to Tuesday, in detail',
      setup:
        'You buy 100 shares at ₹1,400 at 10 a.m. on a Monday. Here is what happens, when, and what you can and cannot do at each point.',
      steps: [
        {
          label: 'Monday 10:00 — the trade',
          detail: 'Matched at the exchange against somebody selling',
          compute: { fn: 'turnover', price: 1400, quantity: 100 },
        },
        {
          label: 'Monday — money blocked',
          detail: 'The full amount plus charges is committed straight away',
          compute: { fn: 'legCost', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
        {
          label: 'Monday evening — what you hold',
          detail: 'A claim on 100 shares. Nothing has arrived at the depository yet',
          value: '0 shares',
        },
        {
          label: 'Tuesday — settlement',
          detail: 'Shares are credited to your account and the money reaches the seller',
          value: '100 shares',
        },
        {
          label: 'And when you eventually sell them',
          detail: 'A depository charge applies on the way out, not on the way in',
          compute: { fn: 'legCostLine', key: 'dp', product: 'delivery', side: 'sell', price: 1400, quantity: 100 },
        },
      ],
      conclusion:
        'One day of gap, and in that day your money is gone and your shares have not arrived.',
    },
    {
      kind: 'predict',
      prompt:
        'You buy on a Friday morning. Work it out before you look — which day do the shares reach your account?',
      options: ['Saturday', 'Sunday', 'Monday', 'The following Friday'],
      correct: 2,
      reveal:
        'Monday. Settlement counts working days, and the market is shut at the weekend, so Friday plus one working day is Monday. Public holidays extend it the same way — a trade before a long weekend can take several calendar days to settle even though the rule has not changed. This matters more than it sounds for anything with a deadline attached, such as being on the register in time for a dividend. The rule is simple; the calendar is what catches people.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'SettlementTimeline',
      props: {},
      caption:
        'The same trade drawn against a calendar. The gap is small, it is always there, and every deadline in the market is measured against it.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What if the seller does not deliver?',
      md:
        'Somebody sold you shares. On settlement day they have to hand them over. Occasionally they cannot.\n\nThe exchange does not leave you holding nothing. It runs an **auction** to buy the shares from somewhere else and deliver them to you, and it charges the failing seller for the difference — usually a great deal.\n\nYou are protected here. But if you are ever the one who sold something you did not have, that penalty is yours, and it has its own lesson much later.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You sell 100 shares at ₹1,400 that have been in your account for a year. What is the depository charge on that sale?',
          type: 'compute',
          spec: {
            metric: 'legCostAmount',
            key: 'dp',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            side: 'sell',
            price: 1400,
            quantity: 100,
            tolerance: 0.5,
          },
          explanation:
            'It is a flat charge per company per day, not a percentage — so it is trivial on a large sale and painful on a small one. It applies when shares LEAVE your account, which is why buying costs less than selling here. This is the first of many charges that behave differently from what people assume, and the cost lesson in stage 2 takes them all apart.',
        },
        {
          prompt:
            'Sort each statement by whether it is true on the day of the trade, before settlement.',
          type: 'classify',
          spec: {
            categories: ['True on trade day', 'Only true after settlement'],
            items: [
              { label: 'Your money is committed', category: 'True on trade day' },
              { label: 'The trade is binding on both sides', category: 'True on trade day' },
              { label: 'The shares are recorded in your name', category: 'Only true after settlement' },
              { label: 'The seller has been paid', category: 'Only true after settlement' },
            ],
          },
          explanation:
            'The obligations are immediate; the transfers are not. Holding those two apart explains almost everything odd about the first few days of owning something. It is also why the whole system needs rules for the case where somebody cannot keep their side of a promise that was already binding.',
        },
        {
          prompt:
            'A dividend is paid to whoever is on the register on a Wednesday. You want it. Decide the latest day you can buy.',
          type: 'decision',
          spec: {
            options: [
              'Wednesday, before the market closes',
              'Tuesday, so it settles in time',
              'Monday, to be safe',
            ],
            correct: 'Tuesday, so it settles in time',
          },
          explanation:
            'Tuesday. Buying on Wednesday settles on Thursday, by which time the register has already been read. This is exactly the kind of deadline that settlement quietly governs, and it catches people every year. Note the useful habit rather than the specific answer: whenever a date matters, count in settled days rather than trading days.',
        },
      ],
    },
  ],
};

export default lesson;
