import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — margin
 *
 * The first step of stage 8, and deliberately not about derivatives at all. It
 * is about the one mechanism that makes every later contract dangerous: holding
 * something worth far more than the cash you put down.
 *
 * THE FRAMING THIS LESSON REFUSES
 *
 * Every broker page introduces margin as "trade 5x with the same capital". That
 * sentence is true and it is an advertisement. The honest version is that
 * margin does not change your odds, does not improve any strategy, and moves
 * exactly one number: how much a given percentage move is worth in rupees.
 *
 * So the lesson makes the learner compute the loss before it mentions the gain,
 * and the checkpoint asks for the move that wipes the deposit — a number most
 * people have never worked out for a position they were about to take.
 */
export const lesson: Lesson = {
  id: 'in-t3-margin',
  tier: 'T3',
  market: 'IN',
  title: 'What margin actually lends you',
  summary:
    'A deposit, not a loan, and not a discount. Work out what a 3% move does to a position ten times your cash — then find the move that ends it.',
  plainSummary:
    'Your broker can let you hold something worth much more than the money you have. This shows exactly what that does to your gains and your losses.',
  objectives: [
    'Explain why a margin deposit is collateral rather than a loan',
    'Compute the gain or loss on a position larger than the cash behind it',
    'Work out the move that would wipe out a given deposit',
    'Say what happens when a deposit falls below the required level',
  ],
  prerequisites: ['in-t1-position-sizing'],
  estimatedMinutes: 14,
  introduces: ['margin', 'leverage', 'position', 'derivative'],
  skills: ['margin', 'position-sizing', 'risk-of-ruin'],
  blocks: [
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: {},
      takeaway:
        'Move the slider and watch two numbers: what the position is worth, and what you had to deposit. The gap between them is the whole subject.',
    },
    {
      kind: 'predict',
      prompt:
        'You have ₹1,00,000. Your broker will let you hold ₹5,00,000 of a share against it. The share falls 4% and you close. What is left of your ₹1,00,000?',
      options: ['₹96,000', '₹80,000', '₹20,000', 'Nothing'],
      correct: 1,
      reveal:
        'Eighty thousand. The 4% is charged on the POSITION, not on your cash, so it is ₹20,000 of loss against ₹1,00,000 of capital. That is 20% of everything you had, from a move most people would call a quiet day. This is the entire arithmetic of leverage and there is nothing else to it. It multiplies the result by the ratio between the position and your deposit — five times here — and it does that in both directions with perfect indifference. Nothing about it makes the share more likely to rise.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A deposit, not a loan',
      md:
        'The money you put down is **collateral**. It is not a fee and it is not borrowed — you get it back when you close.\n\nWhat it buys is permission to hold something that could lose more than it cost to open. The exchange wants a deposit precisely because that is possible.\n\nAnd it is **recalculated as prices move**. A shortfall must be topped up the same day, or the position is closed for you.',
    },
    {
      kind: 'example',
      title: 'One position, four days, one shortfall',
      setup:
        'You deposit ₹1,00,000 and hold ₹5,00,000 of a share at ₹500. That is 1,000 shares. The exchange requires your deposit to stay above ₹75,000. Follow it down.',
      steps: [
        {
          label: 'What you control',
          detail: '1,000 shares at ₹500 each',
          compute: { fn: 'multiply', a: 500, b: 1000, dp: 0 },
        },
        {
          label: 'Day one: it falls 2%',
          detail: '2% of ₹5,00,000, debited from the deposit',
          compute: { fn: 'percentOf', value: 500000, percent: -2 },
        },
        {
          label: 'Day two: another 2%',
          detail: 'Charged on the position, which is still about the same size',
          compute: { fn: 'percentOf', value: 490000, percent: -2 },
        },
        {
          label: 'What is left of the deposit',
          detail: '₹1,00,000 less two days of debits',
          compute: { fn: 'literal', value: 80200 },
        },
        {
          label: 'Day three: 1% more',
          detail: 'This is the one that breaks the ₹75,000 floor',
          compute: { fn: 'percentOf', value: 480200, percent: -1 },
        },
      ],
      conclusion:
        'Five percent of movement, spread over three ordinary days, and you are now being asked for money or closed out.',
    },
    {
      kind: 'predict',
      prompt:
        'Same ₹1,00,000 deposit, but this time you hold ₹10,00,000 of the share. Work it out before you look. What fall wipes out your entire deposit?',
      options: ['10%', '5%', '1%', '20%'],
      correct: 1,
      reveal:
        'Five percent. Your deposit is a tenth of the position, so a 10% fall would be twice your money and a 5% fall is all of it. The sum is one division: your cash divided by the position size. Do it before every leveraged trade you take, because it is the only number that tells you how much room you actually have. A 5% fall is not a crash. It is a bad Tuesday. If you answered 10% you divided the wrong way round, which is the error that makes people feel safe at exactly the wrong size.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'BreakevenSlider',
      props: { market: 'IN', product: 'intraday', price: 500, minValue: 50_000, maxValue: 2_000_000 },
      takeaway:
        'Costs sit underneath all of it. A larger position pays more in charges too, so the move you need just to break even moves against you as well.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What margin does not do',
      md:
        'It does not improve your win rate. It does not make a bad idea good. It does not give you more time.\n\nIt changes **one** number: what a given percentage move is worth in rupees. Every argument for using it has to survive that sentence, and most do not.\n\nThe position sizing rule from earlier still applies, unchanged. Decide the rupees you are willing to lose first, and let that decide the size.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You have ₹2,00,000 of cash and hold a position worth ₹8,00,000. What percentage fall would wipe out your cash entirely?',
          type: 'compute',
          spec: { metric: 'literal', value: 25, tolerance: 0.5, unit: '%' },
          explanation:
            '₹2,00,000 ÷ ₹8,00,000 = 25%. That is your whole cushion, and it is the single most useful number about a leveraged position. Work it out before you enter, not after the second bad day. Notice it says nothing about whether the trade is good — only how much room you have to be wrong before the decision is taken away from you.',
        },
        {
          prompt:
            'Your deposit has fallen below the required level and you have no more cash to add. Decide what happens.',
          type: 'decision',
          spec: {
            options: [
              'Nothing, as long as you close by expiry',
              'The broker closes the position, at whatever price is available',
              'The exchange reduces the requirement for you',
            ],
            correct: 'The broker closes the position, at whatever price is available',
          },
          explanation:
            'It is closed for you. And it happens at the worst possible moment by construction — the requirement was breached because the price moved against you, so the exit is taken at the bottom of that move. Being eventually right does not help. You have to still hold the position when the recovery arrives, and a shortfall you cannot fund removes that possibility.',
        },
        {
          prompt:
            'Two learners each have ₹1,00,000. Sort each statement by whether leverage changes it.',
          type: 'classify',
          spec: {
            categories: ['Leverage changes this', 'Leverage does not change this'],
            items: [
              { label: 'Rupees gained on a 3% rise', category: 'Leverage changes this' },
              { label: 'Rupees lost on a 3% fall', category: 'Leverage changes this' },
              { label: 'How likely the share is to rise', category: 'Leverage does not change this' },
              { label: 'Whether the trade idea was any good', category: 'Leverage does not change this' },
            ],
          },
          explanation:
            'Both of the things it changes are sizes. Neither of them makes you more likely to be right. That is the whole honest summary. A broker advertising leverage is advertising the first row and hoping you do not read the second. If a strategy is not worth taking at your own size, borrowing does not fix it. It only shortens the time it takes to find out.',
        },
      ],
    },
  ],
};

export default lesson;
