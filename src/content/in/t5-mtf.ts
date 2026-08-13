import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — margin trading facility
 *
 * Borrowing from your broker to hold shares beyond the day. Marketed as a way
 * to hold more; it is a loan, it charges interest daily, and the lender can
 * liquidate the collateral without asking.
 *
 * The two facts that matter and are never on the marketing page: the interest
 * accrues every calendar day including weekends, and the broker's right to sell
 * you out is not a last resort — it is the mechanism, exercised routinely and
 * quickly.
 */
export const lesson: Lesson = {
  id: 'in-t5-mtf',
  tier: 'T5',
  market: 'IN',
  title: 'Margin trading facility, and what it can force',
  summary:
    'A loan from your broker to hold shares overnight. Interest accrues daily, and the shares are collateral your lender may sell without asking you.',
  plainSummary:
    'Your broker can lend you money to buy more shares and keep them. This explains what that loan costs and what the lender can do.',
  objectives: [
    'Say what distinguishes this from ordinary intraday leverage',
    'Compute the interest cost of holding a borrowed position',
    'Explain why a broker can sell your holdings without permission',
    'Decide whether a given holding period justifies the cost',
  ],
  prerequisites: ['in-t3-margin'],
  estimatedMinutes: 13,
  introduces: ['margin', 'leverage', 'delivery', 'intraday', 'position', 'drawdown', 'liquidity'],
  skills: ['edge-cases', 'margin', 'costs'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You buy ₹5,00,000 of shares using ₹1,00,000 of your own money and ₹4,00,000 borrowed from your broker at 18% a year. You hold for 40 days. What does the loan cost?',
      options: ['About ₹2,000', 'About ₹8,000', 'Nothing until you sell'],
      correct: 1,
      reveal:
        'About ₹8,000 — roughly 8% of your own capital, before the shares have done anything at all. Interest accrues every calendar day, including weekends and holidays, and it is charged whether the position is winning or losing. This number never appears in the advertisement, and it changes the arithmetic completely. The shares must now rise about 1.6% in 40 days just to cover the borrowing, before charges and the spread.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'DailyInterestExplainer',
      props: {},
      takeaway:
        'Step through it once. The same loan turns a 6% gain into ₹17,000 kept — and a 6% fall into a 45% hit on your own capital.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Not the same as intraday leverage',
      md:
        '**Intraday** leverage is free of interest because the position is closed the same day. It is squared off automatically before the close.\n\n**Margin trading facility** is a genuine loan that lets you carry the position overnight, for weeks or months.\n\nSo the two things that differ are the ones that matter: it costs interest every day, and the shares you bought are held as **collateral** against the loan.',
    },
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: {},
      takeaway:
        'The gap between what you control and what you funded. With borrowed money that gap is a debt, accruing interest, secured on the shares themselves.',
    },
    {
      kind: 'example',
      title: 'Sixty days of a borrowed position',
      setup:
        'You put in ₹1,00,000 and borrow ₹4,00,000 at 18% a year to hold ₹5,00,000 of shares. The shares rise 6% over sixty days, which is a good outcome. Here is what you keep.',
      steps: [
        {
          label: 'What the position gained',
          detail: '6% of ₹5,00,000',
          compute: { fn: 'percentOf', value: 500000, percent: 6 },
        },
        {
          label: 'Interest on the loan for 60 days',
          detail: '18% a year on ₹4,00,000, accrued daily',
          compute: { fn: 'literal', value: 11836 },
        },
        {
          label: 'Charges on getting in and out',
          detail: 'On the full ₹5,00,000, not on your ₹1,00,000',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 500, quantity: 1000 },
        },
        {
          label: 'What you actually keep',
          detail: 'Gain less interest less charges',
          compute: { fn: 'literal', value: 17000 },
        },
        {
          label: 'The same 6% without borrowing',
          detail: 'On ₹1,00,000 of your own money',
          compute: { fn: 'percentOf', value: 100000, percent: 6 },
        },
      ],
      conclusion:
        'Borrowing turned ₹6,000 into about ₹17,000 on a good outcome. The same machinery works identically in the other direction.',
    },
    {
      kind: 'predict',
      prompt:
        'Same borrowed position, but the shares fall 6% instead. Work out what happens to your ₹1,00,000 before you look.',
      options: [
        'It falls to about ₹94,000',
        'It falls to roughly ₹55,000, once interest and charges are counted',
        'The broker absorbs part of the loss',
      ],
      correct: 1,
      reveal:
        'About ₹55,000 — you lose roughly 45% of your capital on a 6% fall. The loss is ₹30,000 on the position, plus about ₹12,000 of interest and the charges, all of it charged against your ₹1,00,000 rather than against the ₹5,00,000. And this is where the second danger appears: at that point your collateral is thin, and the broker has the right to sell the shares to protect the loan. Not as a last resort after a conversation — routinely, and quickly.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "Your margin shortfall on a broker-funded position is smaller than the whole position's value. Does the broker sell your entire holding, or just enough to fix the shortfall?",
      options: [
        'Always the entire holding, regardless of the size of the shortfall',
        'Often just enough shares to restore the required margin, not necessarily the whole position',
        'The broker never sells partial holdings under any circumstance',
      ],
      correct: 1,
      reveal:
        'Often just enough to restore the requirement. Brokers typically sell the minimum needed to bring the account back within the rules. A fast-moving fall can still force a larger sale if the shortfall keeps growing while the sale is happening.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'risk-roulette',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The liquidation right is the product',
      md:
        'Your broker lent money against shares. If those shares fall enough that the loan looks unsafe, the broker **sells them**.\n\nNo permission is required and the timing is theirs. It happens during the fall, which is precisely when prices are worst and when you would most want to wait.\n\nSo the risk is not only that you lose more. It is that the decision to sell is taken away from you, at the moment you would least have chosen it. Anybody using this should know their liquidation level before they open the position.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A margin shortfall is relatively small compared to the total position value. Decide what a broker is most likely to do.',
          type: 'decision',
          spec: {
            options: [
              'Sell the entire position regardless of how small the shortfall is',
              'Sell only enough shares to restore the required margin, if the situation is stable',
              'Do nothing until the shortfall doubles',
            ],
            correct: 'Sell only enough shares to restore the required margin, if the situation is stable',
          },
          explanation:
            'Often just enough to restore the margin. A stable, moderate shortfall typically triggers a partial sale, though a fast-falling price can still force more.',
        },
        {
          prompt:
            'You borrow ₹6,00,000 at 18% a year and hold for 30 days. What is the interest, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 8877, tolerance: 200, unit: '₹' },
          explanation:
            '₹6,00,000 × 18% × 30/365 ≈ ₹8,877. Do this sum before opening the position and compare it against what you expect the shares to do in that time. A holding period of a few days is often fine; a few months usually is not, and the arithmetic says so long before the market does.',
        },
        {
          prompt:
            'Sort each statement about a broker-funded position.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'Interest accrues on weekends too', category: 'True' },
              { label: 'The broker may sell your shares without asking', category: 'True' },
              { label: 'It improves your odds on the trade', category: 'Not true' },
              { label: 'Losses are shared with the lender', category: 'Not true' },
            ],
          },
          explanation:
            'The two true rows are the cost and the control, and both are what you agreed to. The two false ones are what the framing implies without stating. A lender takes no part of the outcome — they take interest and they take security, which is a completely different arrangement from a partnership.',
        },
        {
          prompt:
            'You want to hold a position for six months and are considering funding it this way. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Use it — that is what the facility is for',
              'Compute six months of interest first; at 18% it is a very high hurdle',
              'Use it but with a tighter stop',
            ],
            correct: 'Compute six months of interest first; at 18% it is a very high hurdle',
          },
          explanation:
            'Compute it. Six months at 18% is roughly 9% of the borrowed amount, which the shares must earn before you make a rupee. Over that horizon the interest, not the market, becomes the main thing you are betting against. The third answer makes it worse: a tighter stop on a leveraged position gets hit more often, and each hit costs the accrued interest as well as the loss.',
        },
      ],
    },
  ],
};

export default lesson;
