import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — stock lending and borrowing
 *
 * How a share is borrowed in order to be sold short, and what a recall does to
 * that position. The mechanism explains something that otherwise looks like
 * magic: how anybody can sell something they do not own.
 *
 * The hazard is the recall. A borrowed share can be called back by its lender,
 * and the borrower must return it — which means buying it back, at whatever
 * price, on a day they did not choose. In a rising market that is a forced
 * buyer arriving in a market that is already going up.
 */
export const lesson: Lesson = {
  id: 'in-t5-slb',
  tier: 'T5',
  market: 'IN',
  title: 'Lending and borrowing stock',
  summary:
    'Selling something you do not own requires borrowing it first. The lender can ask for it back, and then you are a forced buyer on somebody else’s schedule.',
  plainSummary:
    'People can sell shares they do not own by borrowing them. This explains how that works and what happens when the owner wants them back.',
  objectives: [
    'Explain how a short sale is funded by borrowing shares',
    'Say what the lender receives and why they participate',
    'Describe what a recall forces the borrower to do',
    'Decide the risk of shorting a share that is hard to borrow',
  ],
  prerequisites: ['in-t5-pledge'],
  estimatedMinutes: 13,
  introduces: ['short-selling', 'delivery', 'depository', 'liquidity', 'dividend', 'corporate-action', 't-plus-one'],
  skills: ['edge-cases', 'short-selling', 'india-rules'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Somebody sells 500 shares they do not own, intending to buy them back cheaper. On settlement day, what do they deliver?',
      options: [
        'Nothing — the trade is settled in cash',
        'Shares they borrowed from somebody who owns them',
        'They pay a penalty instead',
      ],
      correct: 1,
      reveal:
        'Borrowed shares. This is what makes a short sale possible at all. Somebody who owns the shares and intends to keep them lends them out, and the short seller delivers those to the buyer. The buyer receives real shares and has no idea any of this happened. The short seller now owes shares to the lender rather than to the market, and that debt is what has to be closed later. Without a borrowing mechanism, selling something you do not own would simply be short delivery and a penalty.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'RecallForcedBuyExplainer',
      props: {},
      takeaway:
        'Step through it once. A ₹40,000 loss, forced — the recall chose the moment, not you.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why anybody lends',
      md:
        'A long-term holder has shares sitting in an account doing nothing. Lending them earns a **fee** for the period they are out.\n\nThey keep the economic ownership: if the share rises, that gain is still theirs, and dividends are compensated.\n\nWhat they give up is availability. The shares are out on loan, so they are not freely sellable while the loan is open — which is the same constraint pledging creates, arriving through a different door.',
    },
    {
      kind: 'widget',
      component: 'SettlementChain',
      props: {},
      takeaway:
        'Follow a delivery through settlement. A borrowed share travels this same path — the buyer cannot tell the difference, and that is the point.',
    },
    {
      kind: 'example',
      title: 'A short sale, and the day it is recalled',
      setup:
        'You borrow 500 shares at ₹800 and sell them, expecting a fall. The borrowing fee is 8% a year. Three weeks later the lender recalls the shares and the price is ₹880.',
      steps: [
        {
          label: 'What the sale raised',
          detail: '500 shares at ₹800, which is not yours to keep',
          compute: { fn: 'multiply', a: 800, b: 500, dp: 0 },
        },
        {
          label: 'Borrowing fee for 21 days',
          detail: '8% a year on ₹4,00,000, accrued daily',
          compute: { fn: 'literal', value: 1841 },
        },
        {
          label: 'Cost of buying the shares back at ₹880',
          detail: 'You must return shares, not money',
          compute: { fn: 'multiply', a: 880, b: 500, dp: 0 },
        },
        {
          label: 'The loss on the position',
          detail: 'Bought back higher than you sold',
          compute: { fn: 'multiply', a: -80, b: 500, dp: 0 },
        },
        {
          label: 'And the charges on both legs',
          detail: 'Paid regardless of the outcome',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 840, quantity: 500 },
        },
      ],
      conclusion:
        'The loss was forced. You did not decide to close at ₹880 — the recall decided it for you.',
    },
    {
      kind: 'predict',
      prompt:
        'Many people are short the same share and it starts rising sharply. Work out what a wave of recalls does.',
      options: [
        'Nothing much — they buy back gradually',
        'Forced buying pushes the price higher, which forces more buying',
        'The exchange suspends the shorts',
      ],
      correct: 1,
      reveal:
        'Forced buying feeds on itself. Every short seller who is recalled must buy, and their buying pushes the price up, which triggers more recalls and more stops. This has a name and it produces some of the most violent upward moves in any market. Notice the asymmetry that makes it dangerous. A long position can fall to zero and no further. A short position has no ceiling on the loss, and somebody else can close it at the worst moment.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'You are short a stock via a borrowed position when it goes ex-dividend. Does the dividend simply pass you by since you do not own the shares?',
      options: [
        'Yes — a dividend has nothing to do with a short seller',
        'No — the short seller must compensate the lender for the dividend the lender would have received',
        'No — the exchange pays the dividend to the lender directly, at no cost to the short seller',
      ],
      correct: 1,
      reveal:
        'No. The short seller pays the lender a substitute payment equal to the dividend. The lender gave up their shares expecting to be made whole on any dividend that would have been theirs. This compensation is part of the cost of the loan, not optional, and one more running cost that a short position accumulates while it is open.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'circuit-breaker',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Hard to borrow means hard to hold',
      md:
        'The borrowing fee is a price, and it moves. A share that everybody wants to short becomes expensive to borrow, sometimes extremely so.\n\nSo the cost of the position rises exactly when the crowd agrees with you, and the recall risk rises with it — because there are fewer lenders and more borrowers.\n\nBefore any short position, ask two questions the long side never has to. **What does it cost to borrow, and how likely is a recall?** Both are checkable, and both are routinely ignored.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A short seller assumes an ex-dividend date costs them nothing since they do not own the shares. Decide whether that is correct.',
          type: 'decision',
          spec: {
            options: [
              'Correct — dividends do not apply to borrowed short positions',
              'Incorrect — the short seller must compensate the lender for the dividend',
              'Correct, but only for index constituents',
            ],
            correct: 'Incorrect — the short seller must compensate the lender for the dividend',
          },
          explanation:
            'Incorrect. The lender is made whole for any dividend missed while the shares are on loan, and that cost falls on the short seller.',
        },
        {
          prompt:
            'You short 400 shares at ₹600 and are recalled when the price is ₹690. What is the loss on the position, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 36000, tolerance: 500, unit: '₹' },
          explanation:
            '₹90 of adverse move on 400 shares is ₹36,000, plus the borrowing fee and the charges. The number itself is ordinary; what makes it different from a long position is that you did not choose the moment. A recall converts an open position into a completed loss on a schedule somebody else set.',
        },
        {
          prompt:
            'Sort each statement about borrowing shares to sell short.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'The lender can ask for them back', category: 'True' },
              { label: 'The borrower pays a fee for the period', category: 'True' },
              { label: 'The buyer knows the shares were borrowed', category: 'Not true' },
              { label: 'The loss is capped at the amount sold', category: 'Not true' },
            ],
          },
          explanation:
            'The last row is the one that matters most. A long position cannot lose more than it cost, because a price cannot go below zero. A short position loses as the price rises, and there is no level at which a price must stop. That uncapped loss, combined with the recall, is why shorting is sized far more carefully than an equivalent long.',
        },
        {
          prompt:
            'You want to short a small company that is expensive to borrow and has few lenders. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Go ahead — the borrow cost is a small percentage',
              'Do not: expensive to borrow means recall risk is high and the crowd is already there',
              'Short it larger, to cover the borrowing cost',
            ],
            correct: 'Do not: expensive to borrow means recall risk is high and the crowd is already there',
          },
          explanation:
            'Do not. An expensive borrow tells you that many people already want this position, which means the easy part of the move may be gone and the recall risk is elevated. The third answer is the worst possible response — increasing size in the position most likely to be closed for you, in a thin share, where the loss has no ceiling.',
        },
      ],
    },
  ],
};

export default lesson;
