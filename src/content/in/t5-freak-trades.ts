import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — freak trades
 *
 * A market order into an empty book. The microstructure lesson taught that an
 * order walks the book; this is what happens when the book has almost nothing
 * in it and the walk goes several hundred percent.
 *
 * Two lessons in one: never use a market order on an illiquid contract, and
 * understand that a stop-loss BECOMES a market order — so a stop on an illiquid
 * option is a loaded gun pointed at your own account.
 */
export const lesson: Lesson = {
  id: 'in-t5-freak-trades',
  tier: 'T5',
  market: 'IN',
  title: 'Freak trades in illiquid options',
  summary:
    'A market order into an empty book prints a price nobody believes. And a stop-loss becomes a market order, which is how it happens to people who were being careful.',
  plainSummary:
    'When almost nobody is trading something, one order can fill at an absurd price. This shows how that happens and how to avoid it.',
  objectives: [
    'Explain why a market order in a thin book can fill far from any sensible price',
    'Say why a stop-loss carries the same danger',
    'Compute the damage from a walk through an almost empty book',
    'Decide which order type to use in an illiquid contract',
  ],
  prerequisites: ['in-t4-microstructure'],
  estimatedMinutes: 13,
  introduces: ['market-order', 'limit-order', 'stop-loss', 'liquidity', 'slippage', 'spread', 'order-book', 'trigger-price'],
  skills: ['edge-cases', 'execution', 'liquidity'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A far-out contract shows a bid of ₹2 and an ask of ₹4. You send a market order to buy 10 lots. What might you pay?',
      options: ['₹4', 'Somewhere between ₹4 and ₹6', 'Possibly ₹40 or more'],
      correct: 2,
      reveal:
        'Possibly ₹40 or more. The ask of ₹4 is the price of the smallest possible trade — perhaps one lot. Behind it the book may be almost empty, so your remaining nine lots eat whatever is there, and on an illiquid contract the next resting offers can be at absurd levels. These prints have a name: freak trades. They happen on Indian expiry days regularly, they are usually not cancelled, and the person who sent the market order pays for all of them.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Now imagine this book with two orders on each side instead of twenty. That is what a far-out contract looks like, and a market order eats through it in one instant.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The quoted price is a promise about one lot',
      md:
        'Every price you see is the price of the **next small trade**. On a liquid contract that is close enough to be useful.\n\nOn an illiquid one it is nearly meaningless. There may be one lot at ₹4, nothing until ₹12, and then somebody testing their luck at ₹80.\n\nA market order says "fill me at any price". In a thin book, the market takes that literally, because there is nobody there to argue.',
    },
    {
      kind: 'example',
      title: 'Ten lots into an almost empty book',
      setup:
        'You want 10 lots of a contract quoted at ₹4. The book holds one lot at ₹4, two at ₹9, one at ₹18 and the rest scattered far above. A market order takes them in order.',
      steps: [
        {
          label: 'What you expected to pay',
          detail: '10 lots at the quoted ask of ₹4',
          compute: { fn: 'multiply', a: 4, b: 10, dp: 0 },
        },
        {
          label: 'The first four lots',
          detail: 'One at ₹4, two at ₹9, one at ₹18',
          compute: { fn: 'literal', value: 40 },
        },
        {
          label: 'The remaining six, from far up the book',
          detail: 'Averaging ₹55, because that is what was resting there',
          compute: { fn: 'multiply', a: 55, b: 6, dp: 0 },
        },
        {
          label: 'What the order actually cost, per lot',
          detail: 'Total divided by ten lots',
          compute: { fn: 'literal', value: 37 },
        },
        {
          label: 'How many times the quoted price',
          detail: '₹37 against the ₹4 you saw on the screen',
          compute: { fn: 'literal', value: 9.25 },
        },
      ],
      conclusion:
        'Nine times the quoted price, filled in a fraction of a second, with no error by anybody and nothing to appeal against.',
    },
    {
      kind: 'predict',
      prompt:
        'You were careful and used a stop-loss on that illiquid contract instead. Work out what happens when it triggers.',
      options: [
        'You get out near your trigger price',
        'The same thing — a stop becomes a market order and eats the book',
        'The stop is rejected in illiquid contracts',
      ],
      correct: 1,
      reveal:
        'Exactly the same thing. A stop-loss is not a separate kind of order; it is an instruction that BECOMES an ordinary order when the trigger is reached. In an illiquid contract that ordinary order is a market order walking an empty book, and the fill can be a very long way from the trigger. So the protective tool becomes the mechanism of the damage. This is why the answer on illiquid instruments is not a better stop — it is a smaller position and a limit order.',
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
      title: 'Three rules for thin books',
      md:
        '**Never a market order.** Use a limit, always, even if it means not being filled. Not being filled is a recoverable outcome.\n\n**Use SL-limit rather than SL-market**, and accept that it may not fill. On an illiquid contract a bad fill can cost more than the position was worth.\n\n**Check the book before you check the price.** If there are three orders on each side, the quoted price is decoration. Open interest and volume tell you far more than the last traded price does.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A contract is quoted at ₹5 and your market order for 8 lots averages ₹30. How many times the quoted price did you pay?',
          type: 'compute',
          spec: { metric: 'literal', value: 6, tolerance: 0.3, unit: 'x' },
          explanation:
            '₹30 ÷ ₹5 = 6 times. Note that the multiple is unbounded — it depends entirely on what happened to be resting in the book, which is a fact about other people rather than about your order. That is why the defence is refusing to send a market order rather than estimating how bad it could be.',
        },
        {
          prompt:
            'Sort each order type by whether it is safe in an illiquid contract.',
          type: 'classify',
          spec: {
            categories: ['Safe', 'Dangerous'],
            items: [
              { label: 'Limit order', category: 'Safe' },
              { label: 'Stop-loss limit', category: 'Safe' },
              { label: 'Market order', category: 'Dangerous' },
              { label: 'Stop-loss market', category: 'Dangerous' },
            ],
          },
          explanation:
            'The two safe ones cap the price and may not fill. The two dangerous ones guarantee a fill and cap nothing. On a liquid instrument the second pair is usually the right choice, because certainty of exit matters more than a few paise. In a thin book the trade-off reverses completely, and the same order type that protects you in one place is the one that ruins you in the other.',
        },
        {
          prompt:
            'You hold an illiquid far-out contract that has gone against you and you want out. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Market order — just get out',
              'Limit order at a price you can accept, and be willing not to fill',
              'Stop-loss market order below the current price',
            ],
            correct: 'Limit order at a price you can accept, and be willing not to fill',
          },
          explanation:
            'A limit, and accept that it may not fill. On a contract worth a few rupees, the whole position is often smaller than one freak fill would cost. So the worst case of not exiting beats the worst case of exiting badly. The third answer is the trap — it feels like the disciplined choice and is a market order with a delay attached.',
        },
      ],
    },
  ],
};

export default lesson;
