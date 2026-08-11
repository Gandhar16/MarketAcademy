import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — order types
 *
 * The four orders, taught as ONE trade-off rather than four definitions.
 * Everything follows from a single question: do you need certainty of FILL or
 * certainty of PRICE? Learners who memorise four definitions cannot answer that
 * under pressure; learners who understand the trade-off never need the
 * definitions again.
 */
export const lesson: Lesson = {
  id: 'in-t1-order-types',
  tier: 'T1',
  market: 'IN',
  title: 'Four orders, one trade-off',
  summary:
    'Market, limit, SL and SL-M are not four separate things to memorise. They are two choices about certainty, and picking wrong costs real money on the day it matters.',
  plainSummary:
    'There are four ways to say "buy this" and they behave very differently when the market moves fast. This shows what each one does, using real numbers, so you pick the right one instead of the default one.',
  objectives: [
    'State the trade-off that separates a market order from a limit order',
    'Explain why SL and SL-M behave differently on a gap',
    'Place a stop on the correct side of the market',
    'Choose an order type from the liquidity and the urgency, not from habit',
  ],
  prerequisites: ['in-t0-order-book'],
  estimatedMinutes: 15,
  introduces: ['market-order', 'limit-order', 'stop-loss', 'trigger-price', 'gap', 'slippage'],
  skills: ['order-types', 'stops', 'execution'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You are long from ₹1,400 with a stop-loss LIMIT order: trigger ₹1,350, limit ₹1,345. Overnight, bad news. The stock opens at ₹1,200 and keeps falling. Where do you get out?',
      options: ['At ₹1,350', 'At ₹1,345', 'At ₹1,200', 'You do not get out'],
      correct: 3,
      reveal:
        'You do not get out. Your stop triggered — price went through ₹1,350 — and it placed a LIMIT order to sell at ₹1,345 or better. But the market is at ₹1,200 and nobody will pay ₹1,345. Your order sits there, unfilled, while you are still long a stock that is 14% below your entry and falling. This is the single most expensive misunderstanding in retail trading. A stop-loss is not a guarantee; it is an instruction, and the SL variant contains a second instruction that can silently prevent the first one from working. SL-M would have got you out at ₹1,200 — a terrible price, and an infinitely better outcome than no price at all.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'The same gap, two different stop orders',
      setup:
        'You are long 100 shares from 1,400 with a stop at 1,350. Overnight the stock gaps to 1,200. Here is what each of the two stop orders actually does, and what the difference costs.',
      steps: [
        {
          label: 'Position at risk',
          detail: '100 shares bought at 1,400',
          compute: { fn: 'multiply', a: 1400, b: 100, dp: 0 },
        },
        {
          label: 'The loss you planned for',
          detail: 'Stop at 1,350, so 50 rupees per share on 100 shares',
          compute: { fn: 'multiply', a: 50, b: 100, dp: 0 },
        },
        {
          label: 'SL-M: fills at the open',
          detail: 'Becomes a market order and sells at 1,200. Far worse than planned, but done',
          compute: { fn: 'multiply', a: 200, b: 100, dp: 0 },
        },
        {
          label: 'SL: does not fill at all',
          detail: 'Triggered, then placed a limit at 1,345 that nobody will pay. You are still long',
          value: 'still holding',
        },
        {
          label: 'If it falls another 10% before you act',
          detail: 'The loss the SL order left open, at 1,080',
          compute: { fn: 'multiply', a: 320, b: 100, dp: 0 },
        },
      ],
      conclusion:
        'Neither order gave you the loss you planned for. One gave you a bad exit; the other gave you no exit and an open-ended problem.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The whole thing, in one line',
      md:
        'A **MARKET** order is certain to fill and uncertain in price. A **LIMIT** order is certain in price and uncertain to fill.\n\n**SL** and **SL-M** are those same two orders with a trigger bolted on. SL-M triggers into a market order — certain exit. SL triggers into a limit order — certain price, and possibly no exit at all.\n\nThere is nothing else to remember.',
    },
    {
      kind: 'game',
      game: 'order-gauntlet',
      config: {},
    },
    {
      kind: 'predict',
      prompt:
        'You are long at ₹1,400 and want to protect yourself. You place a SELL stop with a trigger at ₹1,450. What happens?',
      options: [
        'It protects the position from a fall',
        'The exchange rejects it',
        'It sells immediately at the market price',
      ],
      correct: 1,
      reveal:
        'Rejected — and it is worth understanding why rather than just remembering it. A protective SELL stop must sit BELOW the current price, because its job is to fire when things go wrong, and for a long position wrong means down. A sell trigger above the market describes a condition that is already true, so it would fire instantly and sell you out at the current price for no reason. The exchange rejects it rather than executing something you obviously did not intend. If you actually wanted to sell higher, the order you wanted was a LIMIT. This app rejects it too, with the same explanation, which is why the simulator tells you the rule instead of just saying "order rejected".',
      askWhy: false,
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: { preset: 'illiquid', defaultQuantity: 200, allowPresetSwitch: true },
      takeaway:
        'One more consideration on top of the trade-off: in a book this thin, an SL-M triggers into almost nothing. That is the one case where SL is the better choice.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'News has just hit, you are long a large-cap with 4,000 shares at the touch, and you want out immediately at any reasonable price. Decide.',
          type: 'decision',
          spec: { options: ['MARKET', 'LIMIT', 'SL', 'SL-M'], correct: 'MARKET' },
          explanation:
            'MARKET. Deep book, urgent exit, and you have explicitly accepted whatever price that produces — this is precisely the situation market orders exist for. A limit here optimises a few paise while the price runs away from you. A stop is a delay you do not need, because you are not waiting for a condition. You already want out.',
        },
        {
          prompt:
            'Build a protective exit for a long RELIANCE position entered at ₹1,400, risking no more than ₹60 per share, using the order that guarantees you get out.',
          type: 'construct',
          spec: {
            instrument: { symbol: 'RELIANCE.NS', market: 'IN', tickSize: 0.05 },
            lastPrice: 1400,
            availableCash: 200_000,
            require: { side: 'sell', type: 'SL-M', triggerBetween: [1340, 1395], maxRiskPerUnit: 60 },
          },
          explanation:
            'A SELL SL-M with a trigger between ₹1,340 and ₹1,395. SL-M rather than SL, because you asked for a guaranteed exit. The trigger must also be a multiple of the ₹0.05 tick. Otherwise the exchange rejects it before it reaches the book. Note that the exchange checks the tick, the side and the funding — three separate ways an order can be refused before the market ever sees it.',
        },
        {
          prompt: 'Match each order to what it guarantees.',
          type: 'classify',
          spec: {
            categories: ['Guarantees a fill', 'Guarantees a price', 'Guarantees neither'],
            items: [
              { label: 'MARKET', category: 'Guarantees a fill' },
              { label: 'LIMIT', category: 'Guarantees a price' },
              { label: 'SL-M once triggered', category: 'Guarantees a fill' },
              { label: 'SL once triggered', category: 'Guarantees a price' },
              { label: 'An untriggered stop of either kind', category: 'Guarantees neither' },
            ],
          },
          explanation:
            'Nothing guarantees both, and no order type ever will — the two certainties are in direct conflict, because a counterparty has to agree to your price. The last row is the one people forget: a stop sitting untriggered guarantees nothing at all. It is a plan, not a protection, until the market comes to it.',
        },
      ],
    },
  ],
};

export default lesson;
