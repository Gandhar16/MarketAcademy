import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — calls and puts, from scratch
 *
 * WHY THIS SITS BETWEEN THE A-B-C LESSON AND THE PRICING ONE
 *
 * "An option is a bet with a clock on it" teaches what you are PAYING for.
 * This teaches what you are HOLDING. They are different lessons and the second
 * one cannot land first: a learner who is still unsure which way a put points
 * cannot follow an argument about time value.
 *
 * The order here is deliberate and unusual. Most courses teach the four
 * positions as a 2x2 grid — buy call, sell call, buy put, sell put — which is
 * tidy and teaches nothing, because a grid does not tell you who is exposed to
 * what. This teaches ONE position properly, then derives the others from it by
 * asking what the person on the other side must be feeling.
 *
 * Strike price is introduced here rather than in its own lesson because a
 * strike with no contract around it is a number with no meaning.
 */
export const lesson: Lesson = {
  id: 'in-t3-call-and-put',
  tier: 'T3',
  market: 'IN',
  title: 'Calls and puts, from scratch',
  summary:
    'Two contracts, four positions, and one question that tells you which is which. Build each one from a situation rather than memorising a grid.',
  plainSummary:
    'There are only two kinds of these contracts: one for betting a price goes up, one for betting it goes down. This shows you both from the beginning, with real numbers.',
  objectives: [
    'State which contract profits from a rise and which from a fall',
    'Read a contract name and say what right it carries and at what level',
    'Work out the profit or loss of a holding at any price on expiry day',
    'Explain why the seller of a contract is exposed to far more than the buyer',
  ],
  prerequisites: ['in-t3-what-is-a-derivative'],
  estimatedMinutes: 15,
  introduces: ['call-option', 'put-option', 'strike-price', 'premium', 'option', 'expiry', 'spot-price', 'underlying'],
  skills: ['options-basics', 'payoffs', 'contract-mechanics'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You think Reliance, now at ₹1,400, is going up. Someone offers you a piece of paper for ₹30. It says: any time in the next month, you may buy one Reliance share from me at ₹1,400. Reliance ends the month at ₹1,500. What did you make?',
      options: ['₹100', '₹70', '₹30', 'Nothing — you never owned the share'],
      correct: 1,
      reveal:
        'Seventy rupees. You use the paper to buy at ₹1,400, sell immediately at ₹1,500, and pocket ₹100. But the paper cost you ₹30, so you are ₹70 ahead. That ₹30 is the premium and it is spent the moment you hand it over. The ₹1,400 written on the paper is the strike price. Now the important half: if Reliance had ended at ₹1,300 you would simply not use the paper, and you would be down ₹30. Not ₹100. Thirty. Your loss was capped at what you paid, and that cap is the whole reason people buy these.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'You have just bought a call',
      md:
        'A **call option** is the right to BUY at a fixed level. That level is the **strike price**. What you pay for the right is the **premium**.\n\nThree numbers describe any of these completely:\n\n- the **underlying asset** — what it is about\n- the **strike price** — the level written on it\n- the **expiry** — the date it stops existing\n\n"RELIANCE 1400 CE 25 Sep" is all four of those, written the way a broker writes them. CE means call.',
    },
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 1400,
        editable: true,
        legs: [{ type: 'call', quantity: 1, strike: 1400, premium: 30 }],
      },
      takeaway:
        'This is the paper you just bought. Find the price where the line crosses zero — that is your break-even, and it is ₹30 above the strike, not at it.',
    },
    {
      kind: 'predict',
      prompt:
        'Now you think Reliance is going DOWN from ₹1,400. What right would you want to buy?',
      options: [
        'The right to buy at ₹1,400',
        'The right to sell at ₹1,400',
        'The obligation to sell at ₹1,400',
      ],
      correct: 1,
      reveal:
        'The right to SELL at ₹1,400. If Reliance falls to ₹1,250, you buy a share in the market for ₹1,250 and use your paper to sell it for ₹1,400. That is ₹150, less whatever the paper cost. This is a put option, and it is the mirror of a call in every way. A call gains as the price rises above the strike. A put gains as the price falls below it. The third answer is a different thing entirely: an obligation is what the SELLER of the contract has, and nobody pays money to take one on. They get paid.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'SpreadDiagram',
      props: {},
      caption:
        'Both contracts are bought and sold in a market like any other, with a gap between what buyers offer and what sellers ask. That gap is a cost you pay on entry and again on exit.',
    },
    {
      kind: 'example',
      title: 'The same month, from both sides of the desk',
      setup:
        'Asha buys one RELIANCE 1400 call for ₹30. Bharat is the person who sold it to her. One lot of Reliance is 250 shares, so every rupee of price movement is 250 rupees of money. Reliance ends the month at ₹1,500. Follow both of them.',
      steps: [
        {
          label: 'What Asha paid',
          detail: 'Premium of ₹30 across one lot of 250 shares',
          compute: { fn: 'multiply', a: 30, b: 250, dp: 0 },
        },
        {
          label: 'What Bharat received',
          detail: 'The same money, on day one, whatever happens afterwards',
          compute: { fn: 'multiply', a: 30, b: 250, dp: 0 },
        },
        {
          label: 'The contract at expiry',
          detail: 'Spot ₹1,500 against a strike of ₹1,400 — worth ₹100 a share',
          compute: { fn: 'optionIntrinsic', spot: 1500, strike: 1400, type: 'call' },
        },
        {
          label: "Asha's profit",
          detail: '₹100 a share of value, less the ₹30 she paid, across 250 shares',
          compute: { fn: 'multiply', a: 70, b: 250, dp: 0 },
        },
        {
          label: "Bharat's loss",
          detail: 'Exactly the mirror. This is a transfer, not a creation',
          compute: { fn: 'multiply', a: -70, b: 250, dp: 0 },
        },
      ],
      conclusion:
        'Every rupee Asha made came out of Bharat. That is true of all of these contracts, and it is why the person on the other side is never a detail.',
    },
    {
      kind: 'predict',
      prompt:
        'Same contract, same ₹30 premium, but Reliance ends the month at ₹1,410 instead. Work out Asha and Bharat before you look. Who is ahead?',
      options: [
        'Asha — the price rose above her strike',
        'Bharat — the rise was not enough to cover the premium',
        'Neither — they break even',
      ],
      correct: 1,
      reveal:
        'Bharat is ahead, by ₹20 a share. Asha was right about direction and still lost. The contract is worth ₹10 at expiry, she paid ₹30 for it, so she is down ₹20 a share — ₹5,000 on the lot. Her break-even was never ₹1,400. It was ₹1,430: the strike plus what she paid. This is the single most common surprise for anyone new to these contracts. Being right is not the bar. Being right by more than the premium is the bar, and the premium is set by people who know that.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The asymmetry nobody mentions until it matters',
      md:
        'Asha risked ₹7,500 and could not lose a rupee more, however badly it went.\n\nBharat received ₹7,500 and that is the most he can ever make. If Reliance had gone to ₹2,000, he would have lost ₹1,25,000.\n\nBuying one of these has a floor. Selling one does not have a ceiling. Both are legitimate positions and they are not the same kind of risk.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You hold a NIFTY 24000 put. NIFTY finishes at 23,600. Decide what the contract is worth per unit at expiry.',
          type: 'compute',
          spec: { metric: 'literal', value: 400, tolerance: 1, unit: '₹' },
          explanation:
            'Four hundred. A put is the right to sell at the strike, so it is worth strike minus spot: 24,000 − 23,600 = 400. Note what the sum does NOT include: what you paid for it. That decides whether you made money, and it never changes what the contract is worth. Keeping those two questions apart is most of what it takes to read a position correctly.',
        },
        {
          prompt:
            'Reliance is at ₹1,400 and you expect a fall. Classify each position by whether it profits from that fall.',
          type: 'classify',
          spec: {
            categories: ['Profits from a fall', 'Profits from a rise'],
            items: [
              { label: 'Buying a 1400 put', category: 'Profits from a fall' },
              { label: 'Buying a 1400 call', category: 'Profits from a rise' },
              { label: 'Selling a 1400 call', category: 'Profits from a fall' },
              { label: 'Selling a 1400 put', category: 'Profits from a rise' },
            ],
          },
          explanation:
            'Two ways to lean each direction, and they are not equivalent. Buying a put costs money up front and cannot lose more than that. Selling a call brings money in and has no ceiling on the loss. Both profit from a fall; only one of them survives being badly wrong. When someone says "I am bearish", the useful question is which of these two they mean.',
        },
        {
          prompt:
            'You also hold 250 Reliance shares bought at ₹1,400. Build the protective stop that caps the loss at ₹70 a share, using the order type that guarantees an exit.',
          type: 'construct',
          spec: {
            instrument: { symbol: 'RELIANCE.NS', market: 'IN', tickSize: 0.05 },
            lastPrice: 1400,
            availableCash: 200_000,
            require: { side: 'sell', type: 'SL-M', triggerBetween: [1330, 1395], maxRiskPerUnit: 70 },
          },
          explanation:
            'A protective SL-M below the entry. The point of putting this here, in an options lesson, is that the discipline does not change when the instrument does. A contract with a floor on its loss is not a reason to skip the stop — the floor is your entire premium, and losing all of it is not a plan. The trigger must also sit on a multiple of the ₹0.05 tick or the exchange rejects it.',
        },
      ],
    },
  ],
};

export default lesson;
