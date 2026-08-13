import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — step 1 of the whole course
 *
 * This is the first thing anybody reads. It has to assume nothing at all, and
 * it has to be interesting to somebody who is not yet sure they care.
 *
 * THE FRAMING
 *
 * The single most common beginner confusion is not "what is a share" in the
 * abstract — it is treating a share like a fixed deposit with extra steps: put
 * money in, expect it back with something on top. A share promises neither. It
 * is ownership, full stop, and everything else — a possible dividend, a price
 * that can go either way — follows from that one fact rather than from a
 * schedule anybody agreed to.
 *
 * The three things this lesson must land, because everything downstream
 * depends on them: a share is ownership, not a loan; ownership percentage,
 * company performance and price are three separate numbers that do not move
 * together; and "price" means the last thing a willing buyer and a willing
 * seller actually agreed to, never a headcount of buyers versus sellers.
 */
export const lesson: Lesson = {
  id: 'in-t0-what-is-a-share',
  tier: 'T0',
  market: 'IN',
  title: 'What did you actually buy?',
  summary:
    'A share is a slice of ownership in a company, not a loan to it. This works out what that slice is worth, and the two separate ways it can make or lose you money.',
  plainSummary:
    'Buying a share makes you a part owner of a company, not someone who lent it money. This shows what that ownership is worth, and what can make it go up or down.',
  objectives: [
    'Explain that a share is a slice of ownership in a company, not a loan to it',
    'Work out what percentage of a company a given number of shares represents',
    'Say why owning a share carries no promise of being paid back, unlike a deposit or a loan',
    'Name the two ways a shareholder can gain or lose money, and say why neither is guaranteed',
  ],
  prerequisites: [],
  estimatedMinutes: 12,
  introduces: ['share', 'shareholder', 'price', 'investment-return', 'investment-loss', 'dividend'],
  skills: ['foundations', 'ownership'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You buy 10 shares of Mango Motors, a fictional company, for ₹1,000. A friend says: "So Mango Motors now owes you ₹1,000, plus interest." Are they right?',
      options: [
        'Yes — buying shares is the same as lending the company money',
        'No — you now own a small slice of the company, with no promise you get anything back',
        'No — the ₹1,000 sits with a bank, which holds it for you until you sell',
      ],
      correct: 1,
      reveal:
        'No — a share is not a loan. Lend money through a fixed deposit or a bond and the borrower promises a fixed date and a fixed extra amount, whatever happens to them. A share makes no such promise. You now own a slice of Mango Motors itself. What that slice is worth later depends on how the company does, and on what someone else is willing to pay for it. There is no date and no guaranteed amount.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'OwnershipExplainer',
      props: {},
      takeaway:
        'Step through it once. Each tile in the grid is 1% of Mango Motors — watch which one lights up when you buy, and stays lit while everything else about the company keeps moving.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What owning a share actually means',
      md:
        'A company can sell small pieces of itself to raise money instead of borrowing. Each piece is a **share**. Buy one and you become a **shareholder** — a part owner, however small.\n\nOwnership gets you a claim on any **dividend** the company chooses to pay, and usually a vote. It does not get you a promise of anything back. If the company struggles, shareholders are paid last, after lenders and employees.\n\nAnd "price": not "more buyers than sellers" — that phrase means nothing. The **price** is simply what the most recent willing buyer and willing seller agreed to trade at. What shifts that agreed price is its own lesson, later on.',
    },
    {
      kind: 'example',
      title: 'What your 10 shares of Mango Motors are worth',
      setup:
        'Mango Motors is a fictional company, invented for this example — none of these numbers are real market data. It is divided into 1,000 shares. You buy 10 of them at ₹100 each.',
      steps: [
        {
          label: 'What you paid',
          detail: '10 shares at ₹100 each',
          compute: { fn: 'multiply', a: 100, b: 10, dp: 0 },
        },
        {
          label: 'Your ownership of Mango Motors',
          detail: '10 shares ÷ 1,000 shares outstanding',
          compute: { fn: 'ownershipPercent', sharesOwned: 10, sharesOutstanding: 1000, dp: 0 },
        },
        {
          label: 'Your holding if the price rises to ₹120',
          detail: '10 shares at the new price',
          compute: { fn: 'multiply', a: 120, b: 10, dp: 0 },
        },
        {
          label: 'Your holding if the price falls to ₹80',
          detail: '10 shares at the new price',
          compute: { fn: 'multiply', a: 80, b: 10, dp: 0 },
        },
        {
          label: 'Where a dividend would fit in',
          detail: 'A ₹5-per-share dividend, on your 10 shares',
          compute: { fn: 'multiply', a: 5, b: 10, dp: 0 },
        },
      ],
      conclusion:
        'Your ownership stayed fixed at 1% throughout. What changed was the price, which changed what that fixed 1% was worth — ₹1,200 one way, ₹800 the other. A dividend, if paid, is a separate, second way to gain from the same 1%. Neither the price move nor the dividend was guaranteed.',
    },
    {
      kind: 'predict',
      prompt:
        'Mango Motors issues 1,000 new shares to raise money. You still hold your original 10 — you did not buy or sell anything. What happens to your ownership percentage?',
      options: [
        'It stays at 1%, since you did not sell any shares',
        'It falls, because your 10 shares are now a smaller slice of a bigger total',
        'It rises, because the company now has more money to work with',
      ],
      correct: 1,
      reveal:
        'It falls, to about 0.5%. Mango Motors now has 2,000 shares outstanding, and you still hold 10 — 10 ÷ 2,000 = 0.5%, half what you owned before. Nothing was taken from you; the company simply cut itself into more, smaller slices. This is exactly why ownership percentage, company performance and price are three separate things — one just moved here while the other two did not.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'OwnershipToPriceMap',
      props: {},
      takeaway:
        'Try each scenario. Ownership percentage, the business itself, and the quoted price move independently — sometimes only one of the three changes at all.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'A good company can still be a bad buy',
      md:
        'A company can be well-run, growing, profitable — and still be a poor investment if you paid too much for your slice of it. Owning 1% of an excellent company only pays off if 1% was worth roughly what you paid.\n\nA rising price is not proof the company is doing well either. Prices move on what people expect and are willing to pay right now, which can run well ahead of, or behind, the business itself. The quality of the company and the quality of the price you paid are two separate questions.',
    },
    {
      kind: 'example',
      title: 'The two channels, kept separate',
      setup:
        'Two friends each hold 10 Mango Motors shares, bought at ₹100. Over one year, Mango Motors pays a ₹5-per-share dividend, and the price rises to ₹110. Trace each channel on its own before adding them together.',
      steps: [
        { label: 'What each friend paid, a year ago', detail: '10 shares at ₹100', compute: { fn: 'multiply', a: 100, b: 10, dp: 0 } },
        { label: 'Dividend received this year', detail: 'A ₹5-per-share payout, on 10 shares — channel one', compute: { fn: 'multiply', a: 5, b: 10, dp: 0 } },
        { label: 'Holding value today, at ₹110', detail: '10 shares at the new price', compute: { fn: 'multiply', a: 110, b: 10, dp: 0 } },
        { label: 'Price gain alone', detail: '₹1,100 today minus the ₹1,000 paid — channel two', compute: { fn: 'literal', value: 100 } },
        { label: 'Total gain, both channels added', detail: 'Dividend plus price gain', compute: { fn: 'literal', value: 150 } },
      ],
      conclusion:
        'Two separate channels, ₹50 and ₹100, neither dependent on the other. A company can pay a dividend in a year its price falls, or let the price do all the work and pay nothing at all. Either is normal — there is no rule requiring both to move together, or even to move in the same direction.',
    },
    {
      kind: 'predict',
      prompt:
        'Mango Motors buys back 200 of its own shares from the market and cancels them. Shares outstanding fall from 1,000 to 800. You still hold your original 10 shares, untouched. What happens to your ownership percentage?',
      options: [
        'It stays at 1%, since you did not buy or sell anything',
        'It rises, because your 10 shares are now a bigger slice of a smaller total',
        'It falls, because the company has less capital now',
      ],
      correct: 1,
      reveal:
        'It rises, to 1.25%. 10 ÷ 800 = 1.25%, up from 10 ÷ 1,000 = 1% before the buyback. This is dilution\'s mirror image: a buyback shrinks the total number of shares outstanding, so an unchanged holding becomes a larger slice of a smaller pie. Nothing about the company\'s cash flow or profit had to change for your ownership percentage to move. Only the share count did, exactly as with dilution earlier, just running in the opposite direction.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Mango Motors buys back 500 of its 2,500 shares outstanding and cancels them. You hold 25 shares, unchanged. What is your ownership percentage after the buyback?',
          type: 'compute',
          spec: { metric: 'literal', value: 1.25, tolerance: 0.05, unit: '%' },
          explanation:
            '25 ÷ 2,000 = 1.25%, up from 25 ÷ 2,500 = 1% before the buyback. Same mechanism as the dilution question earlier in this lesson, running in reverse — the share count shrank, so an unchanged holding became a larger slice.',
        },
        {
          prompt: 'You own 15 shares out of 3,000 shares outstanding. What percentage of the company do you own?',
          type: 'compute',
          spec: { metric: 'literal', value: 0.5, tolerance: 0.05, unit: '%' },
          explanation:
            '15 ÷ 3,000 × 100 = 0.5% — the same division worked through in the lesson\'s example: shares owned, divided by total shares, as a percentage.',
        },
        {
          prompt: 'Sort each statement about Mango Motors shareholders.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'A dividend, if paid, is one possible source of return', category: 'True' },
              { label: 'A rising price is proof the company is performing well', category: 'Not true' },
              { label: 'Owning shares guarantees you get your money back eventually', category: 'Not true' },
              { label: 'A price change and a dividend are two separate ways to gain or lose', category: 'True' },
            ],
          },
          explanation:
            'Both "Not true" rows make the same mistake — treating something that CAN happen as something the mechanism promises. A share promises neither a rising price nor your money back; a dividend and a price change are the two real channels a return or a loss actually runs through.',
        },
        {
          prompt:
            'You own 20 shares out of 2,000 shares outstanding. The price then drops 15%. What changed, and what did not?',
          type: 'decision',
          spec: {
            options: [
              'Your ownership percentage dropped by 15%, along with the price',
              'The value of your holding dropped, but your ownership percentage — still 1% — did not change',
              'Nothing really changed, since you did not sell anything',
              "The company's underlying business must have gotten 15% worse",
            ],
            correct: 'The value of your holding dropped, but your ownership percentage — still 1% — did not change',
          },
          explanation:
            'Your ownership is 20 ÷ 2,000 = 1%, fixed by share counts — a price move never touches that number, so the first option conflates two separate things. The third option is wrong because the value of what you hold did change, even with no action taken. The fourth assumes the price move must mirror a matching change in the business, which this lesson\'s price definition and the dilution example both showed is not guaranteed. What actually happened: your 1% stayed exactly 1%, and what that 1% is worth fell with the price.',
        },
      ],
    },
  ],
};

export default lesson;
