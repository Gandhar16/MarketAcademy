import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — the three companies between you and a share
 *
 * Nobody teaches this and everybody needs it. A beginner thinks "my broker" is
 * the market, so when something goes wrong they complain to the wrong company,
 * and — far more importantly — they have no idea what happens to their shares if
 * that broker fails.
 *
 * The answer to that last question is the best structural news an Indian retail
 * investor gets, and almost none of them know it: the shares are recorded at the
 * depository, not at the broker. That single fact is worth the lesson on its own.
 */
export const lesson: Lesson = {
  id: 'in-t0-who-does-what',
  tier: 'T0',
  market: 'IN',
  title: 'Exchange, broker, depository — who does what',
  summary:
    'Three different companies stand between you and a share, and they do completely different jobs. Knowing which is which is how you know what happens if one of them fails.',
  plainSummary:
    'Three separate companies are involved every time you buy. This explains what each one does, and which one is actually holding what you bought.',
  objectives: [
    'Name the three parties and state what each one is responsible for',
    'Say where your shares are recorded once you own them',
    'Explain what happens to your holdings if your broker fails',
    'Identify which party to approach for a given kind of problem',
  ],
  prerequisites: ['in-t0-what-is-a-share'],
  estimatedMinutes: 11,
  introduces: ['broker', 'exchange', 'depository', 'order', 'share', 'brokerage', 'delivery'],
  skills: ['foundations', 'market-structure'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Your broker goes bankrupt overnight. You held 200 shares of a company through them. What happens to those 200 shares?',
      options: [
        'They are gone — the broker held them',
        'They are still recorded as yours somewhere else',
        'They become part of the bankruptcy and you queue with other creditors',
      ],
      correct: 1,
      reveal:
        'They are still yours, recorded at a completely separate company called a depository. This is the most important structural fact in Indian retail investing and hardly anybody knows it. Your broker is a messenger who places orders for you. The shares themselves live at CDSL or NSDL, in an account with your name on it, and a failed broker cannot take them because they were never holding them. Cash sitting in the broker account is a different and weaker story. The shares are safe by design, and that design was deliberate.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The three jobs',
      md:
        '**The exchange** (NSE, BSE) runs the marketplace. It matches your buy against somebody else’s sell, publishes prices, and sets the rules. It never buys or sells anything itself.\n\n**The broker** is the licensed company whose app you use. You cannot talk to an exchange directly, so the broker passes your **order** on. It also collects the statutory charges and adds its own.\n\n**The depository** (CDSL, NSDL) is where your shares actually live once you own them — an electronic register, like a bank holding money.',
    },
    {
      kind: 'figure',
      figure: 'SettlementTimeline',
      props: {},
      caption:
        'One purchase, moving through all three. The order goes broker to exchange; the shares come back depository to you, on a different day.',
    },
    {
      kind: 'example',
      title: 'One purchase, and who touched it',
      setup:
        'You buy 100 shares at ₹1,400 on a Monday morning. Follow the money and the shares through each of the three companies, and see who charges you for what.',
      steps: [
        {
          label: 'What you are buying',
          detail: '100 shares at ₹1,400 — the broker sends this to the exchange',
          compute: { fn: 'turnover', price: 1400, quantity: 100 },
        },
        {
          label: 'The exchange takes its cut',
          detail: 'A transaction charge for matching you with a seller',
          compute: { fn: 'legCostLine', key: 'exchange', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
        {
          label: 'The broker takes its cut',
          detail: 'Brokerage — the only line on this list the broker sets itself',
          compute: { fn: 'legCostLine', key: 'brokerage', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
        {
          label: 'Everything charged on the buy',
          detail: 'Exchange, broker and government together',
          compute: { fn: 'legCost', product: 'delivery', side: 'buy', price: 1400, quantity: 100 },
        },
        {
          label: 'Where the shares end up',
          detail: 'Recorded at the depository, in an account with your name on it',
          value: 'CDSL or NSDL',
        },
      ],
      conclusion:
        'Three companies, three different jobs, and only one of them ends up holding what you bought.',
    },
    {
      kind: 'predict',
      prompt:
        'Your order was rejected because the price you asked for was outside the day’s allowed range. Which company rejected it?',
      options: ['The broker', 'The exchange', 'The depository'],
      correct: 1,
      reveal:
        'The exchange, because price limits are one of the rules it enforces. Getting this right matters when something goes wrong, because you save an hour arguing with the wrong company. Roughly: anything about whether a trade is ALLOWED is the exchange. Anything about the app, the money in your account, or the charges is the broker. Anything about shares appearing or not appearing in your holdings is the depository. The depository is never involved in an order at all — it only hears about a trade after it has already happened.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'SettlementChain',
      props: {},
      takeaway:
        'Step through it. Notice that the depository only appears at the end — it learns about your trade after the exchange has already matched it.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The separation is the protection',
      md:
        'Your broker and your depository are separate **on purpose**, and it is regulated that way rather than being a courtesy.\n\nIt means a broker cannot quietly use your shares, and a failed broker does not take them down with it. You can even check your holdings directly with the depository, without going through the broker at all — CDSL and NSDL both send statements.\n\nCash is the weaker link. Money sitting idle in a broker account has less of this protection than the shares do.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You buy 100 shares at ₹1,400. How much of the total charge is brokerage — the only part your broker sets itself?',
          type: 'compute',
          spec: {
            metric: 'legCostAmount',
            key: 'brokerage',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            side: 'buy',
            price: 1400,
            quantity: 100,
            tolerance: 0.5,
          },
          explanation:
            'Zero on a delivery trade with a discount broker in India. That is worth knowing before you shop around on brokerage alone: on this trade every rupee you paid was statutory, and no broker can compete on those. The lines you can influence and the lines you cannot are a whole lesson later, and it starts here.',
        },
        {
          prompt:
            'Sort each problem by which company you would raise it with.',
          type: 'classify',
          spec: {
            categories: ['Broker', 'Exchange', 'Depository'],
            items: [
              { label: 'The app crashed while I was placing an order', category: 'Broker' },
              { label: 'My order was rejected for breaching a price band', category: 'Exchange' },
              { label: 'Shares I bought last week are not in my holdings', category: 'Depository' },
              { label: 'I was charged brokerage I did not expect', category: 'Broker' },
            ],
          },
          explanation:
            'The pattern: the broker owns the app and the money, the exchange owns the rules of trading, and the depository owns the record of what you hold. Almost every support complaint that goes nowhere went to the wrong one of these three. Knowing the split also tells you who is actually responsible when something is not your fault.',
        },
        {
          prompt:
            'A friend says shares are risky because "the broker could run away with them". Decide how to answer.',
          type: 'decision',
          spec: {
            options: [
              'They are right — that is a real risk',
              'The shares are recorded at the depository, so a failed broker does not take them',
              'It depends on which broker you use',
            ],
            correct: 'The shares are recorded at the depository, so a failed broker does not take them',
          },
          explanation:
            'The shares are held elsewhere by design. This is genuinely reassuring and it is also specific — it protects the SHARES, not idle cash in the trading account. There are plenty of real risks in this subject and the course will spend a great deal of time on them. This particular fear is one of the few that the structure has already answered.',
        },
      ],
    },
  ],
};

export default lesson;
