import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — futures
 *
 * WHY FUTURES BEFORE OPTIONS PRICING
 *
 * A futures contract is the simpler object: no premium, no decay, no strike, a
 * straight line for a payoff. Every difficulty it has is a difficulty options
 * ALSO have — lot size, margin, expiry, a counterparty — and they are much
 * easier to see when nothing else is moving.
 *
 * THE ONE THING THIS LESSON REFUSES TO SOFTEN
 *
 * A future is symmetric. The screen shows a margin of a few percent, and the
 * loss is uncapped in both directions. Almost every retail explanation leads
 * with the leverage and mentions that second sentence in passing. This lesson
 * makes the learner compute the uncapped side before it says anything else
 * about opportunity.
 *
 * The basis is taught as arithmetic (carry) rather than as sentiment, because
 * the sentiment reading is where most people go wrong with it.
 */
export const lesson: Lesson = {
  id: 'in-t3-futures',
  tier: 'T3',
  market: 'IN',
  title: 'Futures: an agreement to trade later',
  summary:
    'One price, one date, both sides committed. The simplest derivative there is — and the one whose losses have no floor. Build it up from a deposit and a daily settlement.',
  plainSummary:
    'A deal to buy or sell something later at a price agreed today. This shows how those deals work, what deposit they need, and how the money moves every single day.',
  objectives: [
    'Explain why both parties to a futures contract are committed',
    'Compute the exposure and the deposit behind a single lot',
    'Say why the futures price differs from the current price, and what closes the gap',
    'Describe what happens to your account on a day the position moves against you',
  ],
  prerequisites: ['in-t3-what-is-a-derivative'],
  estimatedMinutes: 15,
  introduces: ['future', 'basis', 'lot-size', 'margin', 'spot-price', 'underlying', 'expiry', 'open-interest'],
  skills: ['futures-mechanics', 'margin', 'contract-mechanics'],
  blocks: [
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: {},
      takeaway:
        'Look at the gap between what a position is worth and what you must deposit to hold it. That gap is the entire appeal and the entire danger.',
    },
    {
      kind: 'predict',
      prompt:
        'You buy one NIFTY futures lot with NIFTY at 24,000. Lot size is 75, so you control ₹18,00,000. Your broker asks for about ₹1,80,000 as a deposit. NIFTY falls 3% and you close. What have you lost?',
      options: ['3% of my deposit, about ₹5,400', '3% of the position, ₹54,000', 'Nothing until expiry'],
      correct: 1,
      reveal:
        'Fifty-four thousand rupees, which is 30% of your deposit. The percentage that matters is the one on the position, not the one on the cash you put down. This is the whole arithmetic of leverage in one line: a 3% move became a 30% result because the position was ten times the deposit. It works identically upwards, which is what makes it attractive and what makes it dangerous. And the loss is real long before expiry — the money leaves your account the same evening. There is nothing to hold on for.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'MarkToMarketExplainer',
      props: {},
      takeaway:
        'Step through it once. Two down evenings are enough to force a top-up — being eventually right does not undo a shortfall you could not fund.',
    },
    {
      kind: 'figure',
      figure: 'LongShortDiagram',
      props: {},
      caption:
        'A future is a straight line in both directions. There is no floor under the loss on either side, which is the difference between this and a contract you bought a right in.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Marked to market, every evening',
      md:
        'A futures position does not wait for expiry to settle up. Each evening the exchange works out what the day did to your position and moves the money.\n\nA good day is credited. A bad day is **debited from your deposit**.\n\nIf the deposit falls below what the exchange requires, you must top it up the same day. If you do not, the position is closed for you — at whatever price is available, not the one you would have chosen.',
    },
    {
      kind: 'example',
      title: 'Four days on one lot',
      setup:
        'You are long one NIFTY futures lot at 24,000. Lot size 75, so every one-point move in the index is ₹75 of money. You put down ₹1,80,000. Here is what the evenings look like.',
      steps: [
        {
          label: 'Position value on day one',
          detail: 'Index level times lot size. This is what you are exposed to',
          compute: { fn: 'multiply', a: 24000, b: 75, dp: 0 },
        },
        {
          label: 'Day two: NIFTY falls 200 points',
          detail: '200 points times 75. Debited from your deposit that evening',
          compute: { fn: 'multiply', a: -200, b: 75, dp: 0 },
        },
        {
          label: 'Day three: it falls another 300',
          detail: 'Debited again. Your deposit is now well under what you started with',
          compute: { fn: 'multiply', a: -300, b: 75, dp: 0 },
        },
        {
          label: 'What is left of the deposit',
          detail: '₹1,80,000 less two evenings of debits',
          compute: { fn: 'literal', value: 142500 },
        },
        {
          label: 'Day four: NIFTY recovers 400',
          detail: 'Credited. The money genuinely comes back — but only if you were still in the position',
          compute: { fn: 'multiply', a: 400, b: 75, dp: 0 },
        },
      ],
      conclusion:
        'Nothing here needed expiry to happen. A futures position is settled every single evening, and a top-up you cannot fund closes it before any recovery arrives.',
    },
    {
      kind: 'predict',
      prompt:
        'Same lot, same 75 units. This time NIFTY moves 500 points in your favour over a week. Work it out first. What has that done to your account?',
      options: ['₹500 credited', '₹37,500 credited', '₹5,000 credited', 'Nothing until you close'],
      correct: 1,
      reveal:
        'Thirty-seven thousand five hundred, credited in instalments across the week as the index moved. It is 500 times 75, and it is the same sum as the loss two blocks ago with the sign flipped. That symmetry IS the instrument. A future does not care which way you lean, it does not decay, and it has no premium to overcome — but it also gives you nothing back for being wrong. If you answered ₹500 you were reading the index points as rupees, which is the error that makes people size these at ten times what they intended.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why the futures price is not the share price',
      md:
        'A futures contract usually trades a little above the current price. The gap is called the **futures basis**, and it is mostly arithmetic rather than opinion.\n\nHolding a share for two months ties up money that could have earned interest. A futures contract does not. So the future is priced higher by roughly that interest, less any dividend the share pays in between.\n\nThe gap shrinks as expiry approaches and is **zero on expiry day** — both contracts are then claims on the same thing at the same moment.',
    },
    {
      kind: 'predict',
      prompt:
        'It is expiry day. Reliance is at ₹1,400 and the expiring Reliance future trades at ₹1,412. What should you conclude?',
      options: [
        'The market expects Reliance to rise to ₹1,412',
        'Something is wrong — that gap cannot survive to the close',
        'The future is a better buy than the share',
      ],
      correct: 1,
      reveal:
        'Something is wrong, and it will not last. On expiry day the two settle against the same price. So a ₹12 gap is ₹12 of free money to anyone who can trade both: buy the share, sell the future, wait a few hours. Desks exist to do exactly that, which is why the gap closes long before you see it. The first answer is the tempting one and it is the classic misreading: the futures price is not a forecast. It is today\'s price plus the cost of waiting. Reading it as a prediction will have you buying things because a number was slightly higher.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'Normally a futures contract trades a little above the current price. Occasionally it trades BELOW it instead. Is that impossible?',
      options: [
        'Yes — the futures price can never sit below the spot price',
        'No — it happens when a large dividend is expected before expiry, worth more than the usual cost of waiting',
        'No, but it means the exchange has made a pricing error',
      ],
      correct: 1,
      reveal:
        'No, it happens. A future holder is not on the shareholder register, so a large expected dividend is missed entirely. When that missed dividend outweighs the usual cost of waiting, the future can trade below the spot price. Rare, and still just arithmetic, not a signal about direction.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'One lot is 250 units and the contract moves ₹18 in your favour. Compute the money.',
          type: 'compute',
          spec: { metric: 'literal', value: 4500, tolerance: 1, unit: '₹' },
          explanation:
            '250 × ₹18 = ₹4,500. The habit worth building is doing this multiplication before the trade rather than after it. A move that sounds trivial in points is rarely trivial in rupees, and the lot size is what decides which. Every sizing decision in derivatives starts here.',
        },
        {
          prompt:
            'A futures contract is trading slightly below the current share price, ahead of a large expected dividend. Decide what this most likely reflects.',
          type: 'decision',
          spec: {
            options: [
              'A pricing error the exchange will correct',
              'The dividend a future holder will miss, outweighing the usual cost of waiting',
              'A signal that the market expects the price to fall',
            ],
            correct: 'The dividend a future holder will miss, outweighing the usual cost of waiting',
          },
          explanation:
            'The missed dividend. A future never carries the right to a dividend, so a large enough one can pull the futures price below the spot price — arithmetic, not a forecast.',
        },
        {
          prompt:
            'Your futures position has gone against you and your deposit is now below the required level. Decide what happens if you do nothing.',
          type: 'decision',
          spec: {
            options: [
              'Nothing until expiry',
              'The broker closes the position, at whatever price is available',
              'The exchange lends you the difference',
            ],
            correct: 'The broker closes the position, at whatever price is available',
          },
          explanation:
            'It gets closed for you. This is the mechanism that turns a bad week into a permanent loss: the position is shut at the worst moment, which is precisely the moment the requirement was breached. Notice that being eventually right is no defence. You have to still be in the position when the recovery arrives, and a shortfall you cannot fund removes that choice from you.',
        },
        {
          prompt:
            'Sort each statement by whether it is true of a futures contract or of buying an option.',
          type: 'classify',
          spec: {
            categories: ['True of a future', 'True of buying an option'],
            items: [
              { label: 'The most I can lose is what I paid', category: 'True of buying an option' },
              { label: 'Both sides are committed', category: 'True of a future' },
              { label: 'Time passing costs me nothing by itself', category: 'True of a future' },
              { label: 'I pay money up front for the position', category: 'True of buying an option' },
            ],
          },
          explanation:
            'The table is not a list of pros and cons. A future costs nothing to hold and can take more than you have. A bought option has a floor under it and bleeds a little every day for the privilege. Neither is safer in general — they are exposed to different things, and the useful question before any position is which of those two exposures you can actually survive.',
        },
      ],
    },
  ],
};

export default lesson;
