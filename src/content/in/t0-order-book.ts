import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — what the order book actually is
 *
 * The first lesson anyone should take, and the one that quietly answers a dozen
 * later questions. Once you have watched a market order eat three levels of
 * depth, slippage stops being jargon, "liquidity" stops being a vibe, and the
 * difference between a market and a limit order becomes obvious rather than
 * memorised.
 *
 * SOURCES — verified 2026-08-09:
 *   T+1 rolling settlement, universal for Indian equities since January 2023.
 *   NSE tick size ₹0.05 on the cash segment.
 */
export const lesson: Lesson = {
  id: 'in-t0-order-book',
  tier: 'T0',
  market: 'IN',
  title: 'Who is on the other side of your trade',
  summary:
    'There is no "the market". There is a queue of other people’s orders, and your trade eats it from the top down. Watch what that costs.',
  plainSummary:
    'Before you buy anything, it helps to know who sells it to you. This shows the actual queue of buyers and sellers behind every price, and why the price you see is not always the price you get.',
  objectives: [
    'Read a depth ladder and say what a market order of a given size will fill at',
    'Explain why a large order fills worse than the price on the screen',
    'Choose between a market and a limit order on liquidity grounds',
    'Trace what happens to a trade from order to demat credit',
  ],
  prerequisites: [],
  estimatedMinutes: 16,
  introduces: ['order-book', 'bid', 'ask', 'spread', 'liquidity', 'market-order', 'limit-order', 'slippage', 'tick-size'],
  skills: ['order-book', 'liquidity', 'settlement'],
  blocks: [
    {
      kind: 'widget',
      component: 'SlippageExplainer',
      props: {},
      takeaway:
        'Step through it once, then try the real, draggable order book below — same idea, your own numbers.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: { preset: 'liquid', defaultQuantity: 300, allowPresetSwitch: false },
      takeaway:
        'Send a small order first. It fills at one price, because there was enough resting there. Now drag the size up and send it again.',
    },
    {
      kind: 'predict',
      prompt:
        'The ask shows ₹1,400.05 with 450 shares available. You send a MARKET order to buy 3,000 shares. What price do you pay?',
      options: [
        '₹1,400.05 — that is the price on the screen',
        'Slightly more than ₹1,400.05',
        'Noticeably more than ₹1,400.05',
        'It depends on the broker',
      ],
      correct: 2,
      reveal:
        'Noticeably more. There are only 450 shares at ₹1,400.05. Your order takes all of them, then takes the next level, then the next, until 3,000 shares are filled — each level worse than the last. The number you end up with is the weighted average of every level you ate, and it is always worse than the price you clicked on. Nobody charges you for this. It is not a fee, it is not the broker skimming; it is simply what the queue cost. This is slippage, and it is the single biggest hidden cost in active trading.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: { preset: 'illiquid', defaultQuantity: 300, allowPresetSwitch: true },
      takeaway:
        'Switch between the liquid and illiquid books with the SAME order size. The order did not change. The market did.',
    },
    {
      // Every figure in the block that follows is engine-computed, so the
      // arithmetic in this example cannot drift away from the ladder above it.
      kind: 'example',
      title: 'What 3,000 shares actually costs you',
      setup:
        'The screen shows RELIANCE offered at ₹1,400.05 with 450 shares available. You send a market order to buy 3,000. Here is what happens, level by level.',
      steps: [
        {
          label: 'What you expected to pay',
          detail: '3,000 shares at the price on the screen, ₹1,400.05',
          compute: { fn: 'multiply', a: 1400.05, b: 3000, dp: 0 },
        },
        {
          label: 'How deep your order reaches',
          detail: 'It takes all 450 at the touch, then keeps going until it is filled',
          compute: { fn: 'bookWalkLevels', quantity: 3000, side: 'buy' },
        },
        {
          label: 'The average price you actually get',
          detail: 'Volume-weighted across every level the order consumed',
          compute: { fn: 'bookWalkAverage', quantity: 3000, side: 'buy' },
        },
        {
          label: 'Slippage per share',
          detail: 'The gap between the screen price and your fill',
          compute: { fn: 'bookWalkSlippage', quantity: 3000, side: 'buy' },
        },
        {
          label: 'What that gap cost in total',
          detail: 'Slippage multiplied by the shares you bought',
          compute: { fn: 'bookWalkCost', quantity: 3000, side: 'buy' },
        },
      ],
      conclusion:
        'Nobody charged you a fee for this. No broker line item will show it. It is simply what the queue cost — and it is invisible unless you go looking for it.',
    },
    {
      kind: 'figure',
      figure: 'SpreadDiagram',
      props: { bid: 1399.95, ask: 1400.05 },
      caption:
        'There is no such thing as "the price". There are two, and which applies to you depends on which way you are going. Drag the spread wider to see what an illiquid stock does to that.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What "liquidity" actually means',
      md:
        'Liquidity is not a property of a company. It is the answer to one question: **how much can I trade before I move the price?**\n\nThe number to look at is the quantity resting at the touch. Suppose you want 5,000 shares and there are 40 at the best offer. You are not a participant in that market. For the next few seconds you *are* the market, and the price will move to meet you.',
    },
    {
      kind: 'predict',
      prompt:
        'You want to buy a thinly traded stock and you are not in a hurry. Which order do you use?',
      options: [
        'Market — I want to be certain it fills',
        'Limit — I want to be certain of the price',
        'Whichever, it makes little difference',
      ],
      correct: 1,
      reveal:
        'Limit. The trade-off is always the same and never goes away. A MARKET order guarantees execution and surrenders control of the price. A LIMIT order guarantees the price and surrenders certainty of execution. In a liquid name the difference is a rounding error, so people form the habit of using market orders. Then they carry that habit into an illiquid stock, where the spread is eight ticks wide. There it costs them 1% on entry. The right question is not "which order type is better" but "how thin is this book, and how badly do I need to be filled right now?"',
      askWhy: false,
    },
    {
      kind: 'widget',
      component: 'SettlementChain',
      props: {},
      takeaway:
        'Click through all six stages. Note where each charge appears — and that your shares are held by the depository, not by your broker.',
    },
    {
      kind: 'figure',
      figure: 'SettlementTimeline',
      props: {},
      caption: 'The same chain as a timeline. One working day from your click to being on the shareholder register.',
    },
    {
      kind: 'prose',
      md:
        'Three parties, three different jobs, and beginners routinely confuse them.\n\nThe **broker** is your access to the exchange. The **exchange** matches orders and knows nothing about you. The **depository** — CDSL or NSDL — holds your shares in your name. If your broker goes under tomorrow, your shares are still yours, because they were never the broker’s to lose.',
    },
    {
      kind: 'example',
      title: 'The same 3,000-share order, two different books',
      setup:
        'Compare the identical market order — buy 3,000 shares — sent into two different stocks. One is heavily traded, the other thin. Nothing about your order changes; only the queue on the other side does.',
      steps: [
        { label: 'Liquid stock — resting at the touch', detail: 'A large, actively traded name, one-tick spread', value: '450 shares waiting at the best offer' },
        {
          label: 'Liquid stock — your fill',
          detail: 'Comfortably absorbed within a level or two',
          compute: { fn: 'bookWalkAverage', quantity: 3000, side: 'buy', mid: 1400, tickSize: 0.05, spreadTicks: 1, topQuantity: 450, depthGrowth: 1.35, levels: 10 },
        },
        { label: 'Illiquid stock — resting at the touch', detail: 'A thin, small-cap name, eight-tick spread', value: '25 shares waiting at the best offer' },
        {
          label: 'Illiquid stock — your fill',
          detail: 'The same 3,000 shares now has to walk through most of the book',
          compute: { fn: 'bookWalkAverage', quantity: 3000, side: 'buy', mid: 240, tickSize: 0.05, spreadTicks: 8, topQuantity: 25, depthGrowth: 1.1, levels: 10 },
        },
      ],
      conclusion:
        'You did not do anything differently in the two cases — you sent the same order both times. What changed the outcome entirely was how many shares somebody else was willing to sell you at that exact moment. That is the whole idea of liquidity in one comparison.',
    },
    {
      kind: 'predict',
      prompt:
        'You place a limit buy order for 100 shares at ₹1,350, when the market is trading around ₹1,400. Nobody is currently willing to sell at ₹1,350. What happens to your order?',
      options: [
        'It is rejected immediately, since it is far from the market price',
        'It rests in the order book at ₹1,350, waiting, and shows up as depth for anybody looking at that price level',
        'It automatically adjusts closer to the market price',
      ],
      correct: 1,
      reveal:
        'It rests in the book, exactly where you placed it, waiting for the price to come to you. It is not rejected — a limit order far from the market is still a completely valid instruction, it is just unlikely to fill soon. Anybody looking at the depth ladder at the ₹1,350 level would see your 100 shares sitting there, adding to whatever else is resting at that price. The order book holds everything anybody has placed, at any level, until it either fills or is cancelled — not only orders close to the current price.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You place a limit sell order for 50 shares at ₹1,500, well above the current price of ₹1,400. Decide what happens to it.',
          type: 'decision',
          spec: {
            options: [
              'Rejected outright, since it is too far from the market',
              'Rests in the book at ₹1,500 until the price reaches it or you cancel it',
              'Fills immediately at ₹1,400, the current market price',
            ],
            correct: 'Rests in the book at ₹1,500 until the price reaches it or you cancel it',
          },
          explanation:
            'It rests. A limit order sets a floor or ceiling on the price you will accept. It simply waits, however far from the current price, until somebody meets it or you cancel it.',
        },
        {
          prompt:
            'The best offer is 450 shares at ₹1,400.05, then 608 at ₹1,400.10, then 820 at ₹1,400.15. You market-buy 1,000 shares. Decide whether your average fill is above, at, or below ₹1,400.05.',
          type: 'decision',
          spec: { options: ['Above', 'At', 'Below'], correct: 'Above' },
          explanation:
            'Above. You take all 450 at ₹1,400.05, all 608 at ₹1,400.10 — that is already 1,058, so the order completes on the second level. The weighted average lands between the two prices, above the touch. Any market order larger than the size resting at the touch fills worse than the quote, every single time, with no exceptions.',
        },
        {
          prompt:
            'You need to buy 200 shares of an illiquid stock where only 25 rest at the offer, and you have all day. Build the order that protects your price.',
          type: 'construct',
          spec: {
            instrument: { symbol: 'SMALLCAP.NS', market: 'IN', tickSize: 0.05 },
            lastPrice: 240,
            availableCash: 100_000,
            require: { side: 'buy', type: 'LIMIT', minQuantity: 200 },
          },
          explanation:
            'A BUY LIMIT. With 25 shares at the offer, a market order for 200 would walk eight levels through a wide book and cost you a percent or more. A limit order rests and lets sellers come to you. You give up certainty of filling today and get certainty of price instead. That is exactly the right trade when you are not in a hurry. The limit price must also be a multiple of the ₹0.05 tick or the exchange rejects it outright.',
        },
        {
          prompt: 'Match each party to what they are actually responsible for.',
          type: 'classify',
          spec: {
            categories: ['Broker', 'Exchange', 'Depository', 'Clearing corporation'],
            items: [
              { label: 'Holds your shares in your name', category: 'Depository' },
              { label: 'Matches your order against someone else’s', category: 'Exchange' },
              { label: 'Gives you access to the exchange', category: 'Broker' },
              { label: 'Becomes counterparty to both sides so nobody has to trust anybody', category: 'Clearing corporation' },
            ],
          },
          explanation:
            'The separation is the whole design. The exchange matches without knowing who you are. The clearing corporation guarantees the trade, so a stranger’s default is not your problem. The depository holds the asset in your name, so a broker failure does not touch it. Understanding this is what makes the later rules about charges, settlement and failed trades feel like consequences rather than arbitrary impositions.',
        },
      ],
    },
  ],
};

export default lesson;
