import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — freeze quantity
 *
 * A small, sharp rule that surprises people the first time an account gets big
 * enough to meet it: a single order above a published size is rejected, or sent
 * for manual approval, rather than executed.
 *
 * The interesting part is not the rule. It is what it forces you to do —
 * split the order — and what splitting does to your price, which is the market
 * impact lesson from stage 9 arriving with a regulation attached.
 */
export const lesson: Lesson = {
  id: 'in-t5-freeze-quantity',
  tier: 'T5',
  market: 'IN',
  title: 'Order too big to place',
  summary:
    'Above a published size a single order is not accepted. Splitting it is the only route, and splitting has a price the rule does not mention.',
  plainSummary:
    'There is a limit on how large a single instruction to buy or sell can be. This shows what happens when you reach it, and what the way around it costs.',
  objectives: [
    'Say what a freeze quantity is and why exchanges publish one',
    'Explain what happens to an order that exceeds it',
    'Compute the extra cost of splitting a large order',
    'Decide how to work a position larger than the limit',
  ],
  prerequisites: ['in-t4-microstructure'],
  estimatedMinutes: 12,
  introduces: ['lot-size', 'market-impact', 'slippage', 'liquidity', 'order-book', 'derivative'],
  skills: ['edge-cases', 'execution', 'microstructure'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You send one order for 40 lots of a contract whose freeze quantity is 25 lots. What happens?',
      options: [
        'It fills — the limit is a guideline',
        'It is rejected or held for manual approval, and does not simply execute',
        'It fills 25 lots and cancels the rest',
      ],
      correct: 1,
      reveal:
        'It does not simply execute. The exchange publishes a maximum single-order size for each contract, and an order above it is rejected or routed for approval depending on the segment and the broker. It is not a slow fill; it is a refusal. The reason is that one enormous order can move a price a long way in an instant. The limit stops a single mistake — a fat finger, a runaway program — from doing that.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A cap on one order, not on your position',
      md:
        'The freeze quantity limits how much can be in a **single order**. It does not limit how much you may hold.\n\nSo the workaround is simply to send several orders. That is legal, expected, and what everybody does.\n\nWhat the rule does not mention is that several orders arriving in sequence get several different prices — and the later ones are worse, because the earlier ones moved the book.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Send one large order and watch it walk the book. Now imagine sending it as four, a few seconds apart, with other people watching.',
    },
    {
      kind: 'example',
      title: 'What splitting actually costs',
      setup:
        'You want 5,000 shares. The freeze rules force you into four separate orders. Each one takes liquidity, so each subsequent order starts from a worse book.',
      steps: [
        {
          label: 'Price on the screen when you start',
          detail: 'The price of the next small trade',
          value: '₹1,400.20',
        },
        {
          label: 'Average price for the whole 5,000 at once',
          detail: 'If a single order were permitted',
          compute: { fn: 'bookWalkAverage', side: 'buy', quantity: 5000 },
        },
        {
          label: 'Slippage on that hypothetical single order',
          detail: 'Purely the walk up the book',
          compute: { fn: 'bookWalkSlippage', side: 'buy', quantity: 5000 },
        },
        {
          label: 'Cost of the walk, in rupees',
          detail: 'Invisible on any contract note',
          compute: { fn: 'bookWalkCost', side: 'buy', quantity: 5000 },
        },
        {
          label: 'And the statutory charges on top',
          detail: 'Paid on the full quantity regardless of how it was split',
          compute: { fn: 'legCost', product: 'delivery', side: 'buy', price: 1400, quantity: 5000 },
        },
      ],
      conclusion:
        'The rule made you split the order. The book made you pay for it, and the second cost is the larger one.',
    },
    {
      kind: 'predict',
      prompt:
        'You split the order into four and send them a few seconds apart during a quiet session. Work out the likely outcome.',
      options: [
        'Four identical prices',
        'Progressively worse prices, because each order removes liquidity the next one needed',
        'Better prices, since smaller orders are cheaper',
      ],
      correct: 1,
      reveal:
        'Progressively worse. Each order eats the offers near the top, and the book takes time to refill. In a thin market other participants also notice a steady stream of buying and adjust their quotes upward, which makes the later orders worse still. The practical answer is patience: spread the orders over a longer period and use limit orders where the horizon allows it. If the position cannot be built without moving the price, the position is too large for that instrument.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'order-gauntlet',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The limit matters most on the way out',
      md:
        'Building a position slowly is a choice. Exiting one is often not.\n\nIf you hold more than one order allows and need to leave quickly, you must sell in pieces. That happens during exactly the session where everybody else wants out too.\n\nSo the number to check is not whether you can build the position. It is whether you could **exit** it in one bad morning, and the freeze quantity is one of the constraints on that answer.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A contract has a lot size of 75 and a freeze quantity of 25 lots. How many units is that in one order?',
          type: 'compute',
          spec: { metric: 'literal', value: 1875, tolerance: 5, unit: 'units' },
          explanation:
            '25 × 75 = 1,875 units in a single order. Both numbers are published by the exchange and both change from time to time, which is why they are worth checking rather than remembering. A position larger than this is not forbidden — it just cannot arrive or leave in one instruction.',
        },
        {
          prompt:
            'Sort each statement about the freeze quantity.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'It caps the size of one order', category: 'True' },
              { label: 'You may still hold more than it, in pieces', category: 'True' },
              { label: 'It caps how much you can own', category: 'Not true' },
              { label: 'Splitting an order costs nothing', category: 'Not true' },
            ],
          },
          explanation:
            'The rule is about orders, and the cost is about the book. Those two facts together are the whole lesson: the regulation is easy to work around, and working around it is where the money goes. Anybody who treats the split as a formality has not looked at what the second and third orders filled at.',
        },
        {
          prompt:
            'You need a position 3 times the freeze quantity and the instrument is thinly traded. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Send three orders quickly and accept the prices',
              'Reduce the position to something you could exit in one bad session',
              'Use market orders so at least they fill',
            ],
            correct: 'Reduce the position to something you could exit in one bad session',
          },
          explanation:
            'Reduce it. A position you can only build in pieces is one you can only exit in pieces, and the exit happens on the day you least want to wait. The third answer guarantees the worst possible prices on both directions. This is the same conclusion as the volume lesson in stage 5, reached from a completely different rule — position size has to respect the market, not only the account.',
        },
      ],
    },
  ],
};

export default lesson;
