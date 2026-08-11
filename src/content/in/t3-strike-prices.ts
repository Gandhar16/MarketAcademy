import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — which strikes exist, and why
 *
 * A learner who has met calls and puts now opens a broker screen and sees forty
 * rows of numbers. Nobody explains where those numbers came from, so they are
 * treated as a menu of opinions rather than as a mechanical grid the exchange
 * publishes.
 *
 * The lesson teaches three things and refuses a fourth:
 *
 *   - the strikes are LISTED, at fixed intervals, by the exchange
 *   - moneyness is a relationship, not a property, and it changes minute by
 *     minute
 *   - a cheap contract is cheap because it is currently worth nothing
 *
 * What it will not do is recommend a strike. "Buy slightly out of the money" is
 * the kind of advice that sounds like teaching and is a position instruction.
 */
export const lesson: Lesson = {
  id: 'in-t3-strike-prices',
  tier: 'T3',
  market: 'IN',
  title: 'Which strikes exist, and why',
  summary:
    'Forty rows on a screen, and none of them are opinions. Where the numbers come from, what in and out of the money really mean, and why the cheap ones are cheap.',
  plainSummary:
    'When you open one of these screens you see a long list of price levels. This explains where that list comes from and what each row is actually offering you.',
  objectives: [
    'Say where the list of available levels comes from and what sets the gaps',
    'Classify a contract as in, at or out of the money from a price and a level',
    'Split a quoted price into the part that is real today and the part that is hope',
    'Explain why a cheap contract is cheap',
  ],
  prerequisites: ['in-t3-call-and-put'],
  estimatedMinutes: 14,
  introduces: ['strike-price', 'moneyness', 'spot-price', 'premium', 'option', 'call-option', 'put-option', 'intrinsic-value', 'time-value', 'expiry', 'underlying'],
  skills: ['options-basics', 'moneyness'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'NIFTY is at 24,000. You open a broker screen and see levels at 23,800, 23,850, 23,900 and so on. Who decided those numbers?',
      options: [
        'Traders, by offering whatever levels they want',
        'The exchange publishes a fixed grid',
        'The broker picks them for each customer',
      ],
      correct: 1,
      reveal:
        'The exchange. It publishes a grid at fixed intervals — 50 points apart for NIFTY — and everybody trades the same rows. You cannot invent a level of 23,873 and you cannot ask for one. This matters more than it sounds. It means the entire market is concentrated on the same handful of numbers, so those levels attract real activity and become places where a lot of money changes hands at once. It also means your choice is never "what level do I want" but "which of these listed rows is closest to what I want".',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The grid, and how far it stretches',
      md:
        'Two rules set what you see on the screen.\n\n**The interval.** A fixed gap between rows, wider for higher-priced things. NIFTY runs in 50s; a ₹300 share might run in 5s.\n\n**The range.** The exchange lists enough rows either side of the current price to cover any plausible move, and adds more as the price travels. Rows far from the price exist, and almost nobody trades them.',
    },
    {
      kind: 'widget',
      component: 'GreeksExplorer',
      props: { strike: 24000, spot: 24000, days: 30, iv: 14, type: 'call' },
      takeaway:
        'Hold the level at 24,000 and drag the current price from 23,000 up to 25,000. Watch the price of the contract change character as it crosses the level.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'In, at, and out of the money',
      md:
        'These three words describe a **relationship** between the current price and the level, not a property of the contract. They change minute by minute.\n\n- **In the money** — using it right now would gain you something.\n- **At the money** — the current price and the level are level.\n- **Out of the money** — using it right now would gain you nothing.\n\nFor a call, higher price means further in. For a put it is the other way round. That is the only difference.',
    },
    {
      kind: 'example',
      title: 'Three rows on the same screen',
      setup:
        'NIFTY is at 24,000 with 30 days to go. You are looking at three call rows: 23,800, 24,000 and 24,200. Each has a price on the screen. Here is what you are actually being offered in each case.',
      steps: [
        {
          label: '23,800 call — what it is worth today',
          detail: 'The price is already 200 above this level, so that much is real right now',
          compute: { fn: 'optionIntrinsic', spot: 24000, strike: 23800, type: 'call' },
        },
        {
          label: '23,800 call — what it costs',
          detail: 'More than the 200, because there are still 30 days for it to improve',
          compute: { fn: 'optionPrice', spot: 24000, strike: 23800, days: 30, ivPercent: 14, type: 'call' },
        },
        {
          label: '24,000 call — what it is worth today',
          detail: 'The price is exactly at the level, so nothing is real yet',
          compute: { fn: 'optionIntrinsic', spot: 24000, strike: 24000, type: 'call' },
        },
        {
          label: '24,200 call — what it is worth today',
          detail: 'The price is below the level. Using it now would gain nothing at all',
          compute: { fn: 'optionIntrinsic', spot: 24000, strike: 24200, type: 'call' },
        },
        {
          label: '24,200 call — what it costs anyway',
          detail: 'Somebody will still sell you one. You are buying the 30 days, and only that',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24200, days: 30, ivPercent: 14, type: 'call' },
        },
      ],
      conclusion:
        'The cheapest row on the screen is cheap because it is currently worth nothing. That is not a bargain, it is a description.',
    },
    {
      kind: 'predict',
      prompt:
        'Same screen, same 30 days. Work it out first: which of these three calls has the MOST of its price made of hope rather than of value it already has?',
      options: ['The 23,800 call', 'The 24,000 call', 'The 24,200 call'],
      correct: 2,
      reveal:
        'The 24,200 call — every rupee of it. It is worth nothing today, so its entire price is the possibility of improvement. The 24,000 call is also all hope, but there is less of it in cash terms. The 23,800 call has 200 points of real value underneath. This is why far-out rows look tempting: they cost very little and can multiply spectacularly. It is also why most of them expire worthless. You are not buying a cheaper version of the same thing. You are buying a different thing, one that needs a bigger move to be worth anything at all.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'SpreadDiagram',
      props: {},
      caption:
        'Rows far from the current price attract little activity, so the gap between what buyers offer and sellers ask is wider there. A cheap row can be expensive to get out of.',
    },
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 24000,
        editable: true,
        legs: [{ type: 'call', quantity: 1, strike: 24200, premium: 60 }],
      },
      takeaway:
        'Drag the level up and down. The shape never changes — only where the bend sits, and how far the price has to travel to reach it.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'RELIANCE is at ₹1,450. You hold a ₹1,400 call. How much of its price is value it already has, per share?',
          type: 'compute',
          spec: { metric: 'literal', value: 50, tolerance: 1, unit: '₹' },
          explanation:
            '₹1,450 − ₹1,400 = ₹50. That part cannot be taken from you by time passing. Anything you paid above ₹50 can be, and will be, because it is entirely the possibility of further improvement and that possibility expires. Splitting a quoted price into these two parts is the single most useful habit on this screen.',
        },
        {
          prompt:
            'NIFTY is at 24,000. Classify each contract by whether using it right now would gain you anything.',
          type: 'classify',
          spec: {
            categories: ['In the money', 'Out of the money'],
            items: [
              { label: '23,500 call', category: 'In the money' },
              { label: '24,500 call', category: 'Out of the money' },
              { label: '23,500 put', category: 'Out of the money' },
              { label: '24,500 put', category: 'In the money' },
            ],
          },
          explanation:
            'The puts run the opposite way, and that is the only thing to remember. A call gains as the price rises above its level; a put gains as it falls below. Anybody who has ever bought the wrong one did so by not asking this question for four seconds. Note also that none of these labels is permanent — one ordinary day of movement reclassifies half the screen.',
        },
        {
          prompt:
            'You want the cheapest possible NIFTY call on the screen. Decide what you are actually choosing.',
          type: 'decision',
          spec: {
            options: [
              'A better-value version of the same bet',
              'A different bet that needs a much larger move to pay anything',
              'A safer position, since less money is at risk',
            ],
            correct: 'A different bet that needs a much larger move to pay anything',
          },
          explanation:
            'A different bet. Price and probability are not separate things here — the market prices a far row cheaply precisely because it rarely finishes worth anything. Less money at risk per contract is true and is not the same as safer, because people respond by buying more of them. The right question is never "what is cheap" but "what move am I actually betting on, and do I have a reason to expect it".',
        },
      ],
    },
  ],
};

export default lesson;
