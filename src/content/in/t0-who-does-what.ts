import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — who keeps the market working
 *
 * Nobody teaches this and everybody needs it. A beginner thinks "my broker"
 * is the market, so when something goes wrong they complain to the wrong
 * company — and, more importantly, they have no idea what happens to their
 * shares if that broker fails.
 *
 * This lesson is scoped to ROLES, not timing: it names every party that
 * touches an ordinary secondary-market trade, in order, and is explicit about
 * two roles a beginner has heard of that are NOT actually a step in a single
 * trade — the company itself (already established in the previous lesson)
 * and the regulator, which sets the rules everyone else follows without
 * being a party to any one trade. Detailed settlement-cycle timing (T+1, DP
 * charges) is deliberately left to `in-t0-settlement`, the next lesson —
 * this one's whole job is the cast of characters, not the clock.
 */
export const lesson: Lesson = {
  id: 'in-t0-who-does-what',
  tier: 'T0',
  market: 'IN',
  title: 'Who keeps the market working?',
  summary:
    'A single trade passes through several separate companies, each with one job. Knowing which is which is how you know what happens if one of them fails, and who to blame when something goes wrong.',
  plainSummary:
    'A single trade passes through several different companies, each with one job. This names them, in the order they act, and says which familiar names are not actually involved in a trade at all.',
  objectives: [
    'Name each role in an ordinary secondary-market trade — investor, broker, exchange, clearing corporation, depository',
    'Say why an exchange and a broker are not the same thing',
    'Explain what a clearing corporation and a depository each actually do',
    'Identify which familiar names — the company itself, the regulator — are not a step in a single trade',
  ],
  prerequisites: ['in-t0-what-is-a-share'],
  estimatedMinutes: 12,
  introduces: ['broker', 'exchange', 'depository', 'clearing-corporation', 'regulator'],
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
        'They are still yours, recorded at a completely separate company called a depository. This is the most important structural fact in Indian retail investing, and hardly anybody knows it. Your broker is a messenger who places orders for you. The shares themselves live at a depository — CDSL or NSDL, in India — in an account with your name on it. A failed broker cannot take them, because it was never holding them.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'RolesExplainer',
      props: {},
      takeaway:
        'Step through the chain once. Notice the depository is the last stop, not the broker — that ordering is exactly why a broker failure cannot touch your shares.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The roles, one at a time',
      md:
        'An **investor** places an order. A **broker** is the licensed member who forwards it — you cannot reach an exchange directly. A **stock exchange** matches your order against another investor\'s. A **clearing corporation** then guarantees the trade will actually go through. A **depository** updates the electronic record of who owns what.\n\nIn India, specifically: the exchange is NSE or BSE, the clearing corporation is the exchange\'s own clearing arm, and the depository is CDSL or NSDL. The **regulator** — SEBI — sets and enforces the rules all of them follow, but is not itself a step inside any single trade. Neither is the **company** whose shares are changing hands, in an ordinary secondary-market trade.',
    },
    {
      kind: 'widget',
      component: 'MarketMapSequencer',
      props: {},
      takeaway:
        'Build the sequence yourself before checking. Two of the seven cards are deliberate decoys — familiar names that are still not a step in an ordinary trade.',
    },
    {
      kind: 'example',
      title: 'One ordinary trade, five roles',
      setup:
        'You place an order to buy 50 shares of Mango Motors, a fictional company already listed and trading on an exchange, at ₹100 each.',
      steps: [
        {
          label: 'What you are buying',
          detail: '50 shares at ₹100 each — this is what the broker sends to the exchange',
          compute: { fn: 'multiply', a: 100, b: 50, dp: 0 },
        },
        { label: 'Who places the order', detail: 'The trade starts here', value: 'You, the investor' },
        { label: 'Who forwards it to the exchange', detail: 'You are not a member of the exchange yourself', value: 'Your broker' },
        { label: 'Who matches it against a seller', detail: 'By price, then by time', value: 'The exchange — NSE or BSE' },
        { label: 'Who guarantees the trade goes through', detail: 'Neither side has to trust the stranger on the other side', value: 'The clearing corporation' },
        { label: 'Who updates who owns the shares', detail: 'An electronic record, not a certificate', value: 'The depository — CDSL or NSDL' },
      ],
      conclusion:
        'Five roles, one ordinary trade — and Mango Motors itself never appears. In a secondary-market trade the company is not a party at all, exactly as the previous lesson showed.',
    },
    {
      kind: 'predict',
      prompt: 'Your order is rejected because the price you asked for was outside the day\'s allowed range. Which role rejected it?',
      options: ['The broker', 'The stock exchange', 'The depository'],
      correct: 1,
      reveal:
        'The exchange, because price limits are one of the rules it enforces. Getting this right saves you an hour arguing with the wrong company. Roughly: anything about whether a trade is ALLOWED is the exchange. Anything about the app, your money, or the charges is the broker. Anything about shares appearing or not appearing in your holdings is the depository. The depository is never involved in placing an order at all — it only hears about a trade after it has already happened.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The separation is the protection',
      md:
        'Your broker and your depository are separate **on purpose** — it is regulated that way, not a courtesy. A broker cannot quietly use your shares, and a failed broker does not take them down with it. You can check your holdings directly with the depository, without going through the broker at all.\n\nOne small logistics note: exchanges only operate during defined sessions, and those schedules change from time to time — always check the official exchange calendar rather than assuming a fixed timetable.',
    },
    {
      kind: 'example',
      title: 'Selling runs the same five roles, in reverse order of who acts first',
      setup:
        'You now decide to sell those 50 Mango Motors shares at ₹105 each. Watch how the same five roles from the buy side show up again, in the mirror-image job.',
      steps: [
        { label: 'What you are selling', detail: '50 shares at ₹105 each — this is what the broker sends to the exchange', compute: { fn: 'multiply', a: 105, b: 50, dp: 0 } },
        { label: 'Who places the sell order', detail: 'The trade starts here, same as before', value: 'You, the investor' },
        { label: 'Who forwards it to the exchange', detail: 'The identical broker relationship as when you bought', value: 'Your broker' },
        { label: 'Who matches it against a buyer', detail: 'Someone else’s buy order, waiting in the same book', value: 'The exchange — NSE or BSE' },
        { label: 'Who guarantees you actually get paid', detail: 'Even though you do not know who the buyer is', value: 'The clearing corporation' },
        { label: 'Who removes the shares from your account', detail: 'And credits the buyer’s, once settlement completes', value: 'The depository — CDSL or NSDL' },
      ],
      conclusion:
        'The exact same five roles, the exact same order of hand-offs — investor, broker, exchange, clearing corporation, depository — whichever side of the trade you are on. Nothing about the cast changes; only whether shares or money ends up moving toward you.',
    },
    {
      kind: 'predict',
      prompt:
        'Mango Motors is accused of publishing misleading numbers in its results. Which role investigates that?',
      options: [
        'The exchange, since it lists the company',
        'The depository, since it holds the shares',
        'Neither — this is the regulator\'s job, and it is not a step inside an ordinary trade either',
      ],
      correct: 2,
      reveal:
        'The regulator — SEBI. This is exactly why it does not appear in either trade sequence in this lesson: it does not touch individual trades. It does have real enforcement powers over things like misleading disclosures, insider trading and market manipulation, investigated separately from any single transaction. The exchange enforces price bands and trading rules; SEBI enforces the honesty of what a listed company tells the public.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'An investor suspects a company deliberately misstated its profit figures in a public announcement. Which role has the power to investigate and penalise that?',
          type: 'decision',
          spec: {
            options: ['The exchange', 'The depository', 'SEBI, the regulator'],
            correct: 'SEBI, the regulator',
          },
          explanation:
            'SEBI. This is a different kind of problem from a rejected order or a missing holding. It is about whether the company told the truth, and that sits with the regulator, not with any of the five roles inside an ordinary trade.',
        },
        {
          prompt:
            'Seven names get mentioned around a trade: company, investor, broker, exchange, clearing corporation, depository, regulator. How many of the seven are actually a step inside one ordinary secondary-market trade?',
          type: 'compute',
          spec: { metric: 'literal', value: 5, tolerance: 0 },
          explanation:
            'Five: investor, broker, exchange, clearing corporation, depository. The company receives nothing in a secondary-market trade, and the regulator sets the rules without being a party to any single one — the same two decoys the market map above used.',
        },
        {
          prompt: 'A friend says "the exchange and the broker are basically the same thing — they both handle my trade." What is wrong with that, specifically?',
          type: 'decision',
          spec: {
            options: [
              'Nothing — for a retail investor the distinction does not matter',
              'The broker is the licensed member you access directly; the exchange is the marketplace it forwards your order to, and you can never reach it yourself',
              'They are different only in India — elsewhere a broker and an exchange are the same company',
            ],
            correct:
              'The broker is the licensed member you access directly; the exchange is the marketplace it forwards your order to, and you can never reach it yourself',
          },
          explanation:
            'The first option is wrong because the distinction tells you who to blame. A price-band rejection is the exchange enforcing a rule, while an app outage is the broker\'s problem — treating them as one company means complaining to the wrong one. The third invents a jurisdictional difference that does not exist; the split is structural everywhere, not an India-specific quirk. A broker is a member of the exchange, acting on your behalf, and the exchange only ever deals with its members.',
        },
        {
          prompt: 'Sort each problem by which role you would raise it with.',
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
            'The pattern: the broker owns the app and your money, the exchange owns the rules of trading, and the depository owns the record of what you hold. Almost every support complaint that goes nowhere went to the wrong one of these three.',
        },
        {
          prompt:
            'A beginner lists "company, investor, broker, exchange, clearing corporation, depository, regulator" as "the seven parties in every trade". What is the specific error?',
          type: 'decision',
          spec: {
            options: [
              'No error — all seven genuinely take part in every trade',
              'Two of the seven — the company and the regulator — are not actually a step in an ordinary secondary-market trade at all',
              'The error is including the clearing corporation, which only matters for more advanced contracts',
            ],
            correct: 'Two of the seven — the company and the regulator — are not actually a step in an ordinary secondary-market trade at all',
          },
          explanation:
            'The company receives nothing and is not a party to a secondary-market trade — the previous lesson\'s whole point. The regulator sets and enforces the rules everyone else follows. It does not act inside any single trade either, the same way a referee is not one of the two teams playing. The clearing corporation, in the third option, is wrong to single out — it guarantees ordinary equity trades too, not only those other contracts.',
        },
      ],
    },
  ],
};

export default lesson;
