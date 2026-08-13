import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — market microstructure
 *
 * The order book lesson at step 3 taught what a book is. This teaches what
 * happens inside it, and where the money you lose to "the market" actually
 * goes — which is mostly to people who were willing to wait when you were not.
 *
 * The frame that makes it stick: every trade has somebody impatient and
 * somebody patient. The impatient one pays the spread. That is not a fee and
 * nobody charges it; it is the price of demanding immediacy, and it is the
 * largest cost most active traders never see on a contract note.
 */
export const lesson: Lesson = {
  id: 'in-t4-microstructure',
  tier: 'T4',
  market: 'IN',
  title: 'What happens inside the millisecond',
  summary:
    'Every trade has an impatient side and a patient one, and the impatient side pays. That payment is invisible on your contract note and larger than everything on it.',
  plainSummary:
    'When you buy, somebody has to be willing to sell right then. This explains what that willingness costs you and where the money goes.',
  objectives: [
    'Say who pays the spread and why',
    'Compute what impatience costs on a given position size',
    'Explain why a large order gets a worse average price than the screen shows',
    'Decide between demanding a fill and waiting for one',
  ],
  prerequisites: ['in-t4-backtest-pitfalls'],
  estimatedMinutes: 14,
  introduces: ['spread', 'bid', 'ask', 'market-impact', 'slippage', 'resting-order', 'liquidity', 'order-book'],
  skills: ['microstructure', 'execution', 'costs'],
  blocks: [
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Every number here is somebody waiting. Push an order through and watch which of them get taken — you are paying each one to have been there first.',
    },
    {
      kind: 'predict',
      prompt:
        'The bid is ₹1,399.80 and the ask is ₹1,400.20. You buy at market and sell again instantly. What have you lost, per share, before any charges?',
      options: ['Nothing', '₹0.20', '₹0.40'],
      correct: 2,
      reveal:
        'Forty paise — the full spread, not half of it. You bought at the ask and sold at the bid, crossing the gap twice. This is the most reliably overlooked cost in trading because it never appears on a contract note; it is baked into the prices you got. On a ₹1,400 share it is about 0.03%, which sounds trivial and is not: a trader doing this twice a day for a year pays it five hundred times. The people on the other side collected all of it for doing nothing but waiting.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'SpreadCostExplainer',
      props: {},
      takeaway:
        'Step through it once. Buy at the ask, sell at the bid, and the full gap is gone — never on a contract note.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Impatience is the product being sold',
      md:
        'Somebody willing to wait posts an order and sits there. Somebody unwilling to wait takes it.\n\nThe **spread** is what the second person pays the first for the service of being available. It is not a fee, nobody charges it, and it is the largest cost most active traders never see.\n\nSo there are only two ways to trade: pay the spread and get certainty of fill, or post an order and get certainty of price with no guarantee of a fill. Everything else is a variation on that choice.',
    },
    {
      kind: 'example',
      title: 'What a large order actually pays',
      setup:
        'The screen says ₹1,400. You want 5,000 shares and you send a market order. The book only has a few hundred at each level, so your order walks up through them.',
      steps: [
        {
          label: 'The price on the screen',
          detail: 'This is the price of the NEXT small trade, not of yours',
          value: '₹1,400.20',
        },
        {
          label: 'What you actually average',
          detail: 'Your order consumed several levels going up',
          compute: { fn: 'bookWalkAverage', side: 'buy', quantity: 5000 },
        },
        {
          label: 'Levels you had to eat through',
          detail: 'Each one a different price, all of them worse than the first',
          compute: { fn: 'bookWalkLevels', side: 'buy', quantity: 5000 },
        },
        {
          label: 'The slippage, per share',
          detail: 'Average paid, less the price you saw',
          compute: { fn: 'bookWalkSlippage', side: 'buy', quantity: 5000 },
        },
        {
          label: 'And in rupees, across the order',
          detail: 'Invisible on the contract note, real in the account',
          compute: { fn: 'bookWalkCost', side: 'buy', quantity: 5000 },
        },
      ],
      conclusion:
        'The quoted price was never available to you at that size. It was the price of the smallest possible trade.',
    },
    {
      kind: 'predict',
      prompt:
        'Same book, but you want 500 shares instead of 5,000. Work out the direction before you look — what happens to your slippage per share?',
      options: [
        'Much smaller, because you stay near the top of the book',
        'The same, since the spread is the spread',
        'Larger, because small orders get worse treatment',
      ],
      correct: 0,
      reveal:
        'Much smaller. Slippage depends on how far down the book you have to eat, so a small order pays roughly the spread and a large one pays the spread plus everything beyond it. This is why the same strategy can work at ₹50,000 and fail at ₹50,00,000 — the edge stayed constant and the execution cost grew. It is also the honest answer to "why does my backtest beat my account": a backtest fills at one price and reality fills at several.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A large institutional buyer wants 50,000 shares but only shows 500 at a time in the order book, refreshing as each chunk fills. Why hide the true size?',
      options: [
        'It is not allowed — order size must always be fully visible',
        'Showing the full size would signal a large buyer, and others could adjust prices before the order finishes',
        'It has no effect — hiding size changes nothing about the price paid',
      ],
      correct: 1,
      reveal:
        'To avoid moving the price against themselves. If the book saw 50,000 shares of demand at once, others would raise their offers immediately, knowing a large buyer has to keep buying. Showing a small slice at a time is a real, common way large orders reduce how much they signal.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'order-gauntlet',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'cost',
      title: 'Where the queue position matters',
      md:
        'A posted order joins a queue at its price, ordered by time. Get there first and you trade before everybody else at that level.\n\nThis is most of what high-frequency firms are competing over, and you cannot win that race. What you can do is stop entering races you did not need to enter.\n\nIf your idea has a horizon of weeks, a few paise of entry price is irrelevant and a **limit order** costs you nothing. If it has a horizon of minutes, you are competing on execution, and that is a game with professionals in it.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A large order shows only 300 shares at a time, refreshing repeatedly, rather than the full quantity at once. Decide why.',
          type: 'decision',
          spec: {
            options: [
              'A technical limitation of the exchange',
              'To avoid signalling the full size, which could move prices against the order before it finishes',
              'It makes no difference to execution',
            ],
            correct:
              'To avoid signalling the full size, which could move prices against the order before it finishes',
          },
          explanation:
            'To avoid signalling size. A visible large order invites others to move their prices first, so hiding the true quantity is a real, common execution tactic.',
        },
        {
          prompt:
            'You buy 5,000 shares at market. What does the walk through the book cost you in total, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 1750, tolerance: 900, unit: '₹' },
          explanation:
            'The exact figure depends on the book, and the point is that it exists at all and appears nowhere in your charges. Estimate it before a large order by looking at how much is actually resting near the top. That is what separates an execution plan from a hope that the screen price is real.',
        },
        {
          prompt:
            'Sort each participant by whether they pay the spread or collect it.',
          type: 'classify',
          spec: {
            categories: ['Pays the spread', 'Collects it'],
            items: [
              { label: 'Somebody sending a market order', category: 'Pays the spread' },
              { label: 'Somebody chasing a fast-moving price', category: 'Pays the spread' },
              { label: 'Somebody with a resting limit order that gets hit', category: 'Collects it' },
              { label: 'A market maker quoting both sides', category: 'Collects it' },
            ],
          },
          explanation:
            'The dividing line is patience, not sophistication. The two on the right are being paid for waiting and for accepting the risk that the price moves against them while they wait. Every time you demand immediacy you move yourself into the left column, and over a year that choice costs more than any brokerage plan you could switch to.',
        },
        {
          prompt:
            'You hold an idea with a three-week horizon and the price is drifting away from you. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Send a market order — do not miss the move',
              'Post a limit order, because three paise is irrelevant over three weeks',
              'Wait for a pullback to your original price',
            ],
            correct: 'Post a limit order, because three paise is irrelevant over three weeks',
          },
          explanation:
            'Post the limit. Over a three-week horizon the entry price is noise, and paying the spread plus impact to save a few minutes is buying something you did not need. The third answer is the anchoring error from stage 7 — the original price is a number you saw, not a level the market owes you. Match the urgency of the execution to the horizon of the idea.',
        },
      ],
    },
  ],
};

export default lesson;
