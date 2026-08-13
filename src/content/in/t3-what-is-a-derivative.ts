import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — the A-B-C of derivatives
 *
 * WHY THIS LESSON EXISTS
 *
 * The curriculum used to go straight from position sizing to "an option is a
 * decaying bet on a distribution". That is a good lesson and it is the SECOND
 * one. It assumes a reader who already knows that you can hold a contract about
 * a share without holding the share — which is exactly the assumption a course
 * starting from zero is not allowed to make.
 *
 * So this is the step before. One idea, taught with a physical analogy, and one
 * question that separates the two families for the rest of the stage: are you
 * OBLIGED, or do you have a CHOICE? Everything later hangs off that answer.
 *
 * The lesson deliberately teaches no pricing at all. Introducing a formula here
 * would bury the only thing this step is for.
 */
export const lesson: Lesson = {
  id: 'in-t3-what-is-a-derivative',
  tier: 'T3',
  market: 'IN',
  title: 'A contract about a share is not a share',
  summary:
    'Before any pricing, one idea: you can trade an agreement about a thing without ever touching the thing. Then the single question that splits the whole subject in two.',
  plainSummary:
    'You can make a deal about something without ever owning it. This explains what those deals are, in plain words, before any of the maths arrives.',
  objectives: [
    'Explain in one sentence what a derivative is, without using the word contract twice',
    'Say who is obliged and who has a choice, for a future and for an option',
    'Identify what the underlying asset of a given contract is',
    'Work out the full value a single lot controls',
  ],
  prerequisites: ['in-t1-position-sizing'],
  estimatedMinutes: 12,
  introduces: ['derivative', 'underlying', 'future', 'option', 'lot-size', 'spot-price'],
  skills: ['derivatives-basics', 'contract-mechanics'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A farmer agrees in June to sell his rice in November, at ₹40 a kilo, to a shop. November comes and rice is selling for ₹55. What is the shop allowed to do?',
      options: [
        'Pay ₹40, as agreed',
        'Pay ₹55, because that is the real price now',
        'Walk away, since it was only an agreement',
      ],
      correct: 0,
      reveal:
        'Pay ₹40. That was the whole point of agreeing in June. The shop wins here and the farmer loses, and in the year rice falls to ₹30 it will be the other way round. Notice three things. Neither side owned any rice in June. The agreement itself became worth something the moment the price moved. And both sides are stuck with it — nobody gets to change their mind in November. You have just met a futures contract. Everything else in this stage is a variation on that June handshake.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'ObligationChoiceExplainer',
      props: {},
      takeaway:
        'Step through it once. One side is stuck at ₹40 either way. The other side paid ₹2 for the freedom not to be.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The whole idea, in one line',
      md:
        'A **derivative** is an agreement whose value comes from something else.\n\nThe something else is called the **underlying asset**. It might be a share, or an index like NIFTY. The agreement is a separate thing you can buy and sell on its own, and its price moves because the underlying moves.\n\nYou never have to own the rice.',
    },
    {
      kind: 'figure',
      figure: 'LongShortDiagram',
      props: {},
      caption:
        'The two sides of any agreement like this. One side gains when the price rises, the other gains when it falls, and the money moves between them.',
    },
    {
      kind: 'predict',
      prompt:
        'Same farmer, different deal. This time he pays the shop ₹2 a kilo in June for the RIGHT to sell at ₹40 in November — but he does not have to. November comes and rice is ₹55. What does he do?',
      options: [
        'Sell at ₹40, because that is what the paper says',
        'Sell at ₹55 in the open market and let the paper expire',
        'Demand his ₹2 back',
      ],
      correct: 1,
      reveal:
        'He sells at ₹55 and tears the paper up. He bought a right, not an obligation, so he simply does not use it when it is unhelpful. The ₹2 is gone either way — that was the cost of having the choice at all. This is an option, and the ₹2 is its premium. Now look at the shop. It took the ₹2 and in exchange gave up all control. If rice had fallen to ₹30 the shop would be forced to pay ₹40. The buyer of a right can lose only what they paid. The seller of one can lose a great deal more, and is paid up front for accepting that.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The question that splits the subject',
      md:
        'Every contract in this stage answers one question: **must you, or may you?**\n\nA **futures contract** obliges both sides. Nobody chooses later.\n\nAn **option** obliges only the seller. The buyer paid for the right to decide, and will decide in their own favour.\n\nIf you can answer that question about a position, you can reason about it. If you cannot, no strategy name will help you.',
    },
    {
      kind: 'example',
      title: 'What one lot actually controls',
      setup:
        'Indian derivatives are not sold one unit at a time. They come in fixed bundles called lots, and you cannot buy half of one. A NIFTY contract has a lot size of 75 units. NIFTY is at 24,000. Here is what a single lot is really worth.',
      steps: [
        {
          label: 'The quoted number',
          detail: 'This is the index level, not rupees you pay',
          value: '24,000',
        },
        {
          label: 'Units in one lot',
          detail: 'Fixed by the exchange. You cannot choose a smaller size',
          value: '75',
        },
        {
          label: 'Value one lot controls',
          detail: 'Index level times lot size. This is the exposure, not the cost',
          compute: { fn: 'multiply', a: 24000, b: 75, dp: 0 },
        },
        {
          label: 'A 1% move in NIFTY',
          detail: 'What one ordinary day does to that exposure',
          compute: { fn: 'percentOf', value: 1800000, percent: 1 },
        },
      ],
      conclusion:
        'One lot is an ₹18,00,000 position, and a single quiet day moves it by ₹18,000. The lot size is the first thing to check, not the last.',
    },
    {
      kind: 'predict',
      prompt:
        'A different contract has a lot size of 250 and its underlying trades at ₹1,200. Work it out before you look. What value does one lot control?',
      options: ['₹1,200', '₹3,00,000', '₹30,000', '₹12,00,000'],
      correct: 1,
      reveal:
        'Three lakh rupees. It is just 250 times ₹1,200. That is the only sum involved, and it is worth doing every single time. People routinely open a position because the premium looked small, without ever asking what the position was. The premium is what you pay. The lot value is what you are exposed to. Those are different numbers and they can differ by a factor of a hundred. If you chose ₹30,000 you dropped a zero, which is the exact mistake that turns a planned 2% risk into a 20% one.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "Exchange A lists NIFTY futures with a lot size of 75. A smaller 'mini' contract on the same NIFTY has a lot size of 25. Do both contracts track the same underlying?",
      options: [
        'No — different lot sizes mean different underlyings',
        'Yes — the underlying is identical; only how many units count as one lot has changed',
        'Yes, but the mini contract is a completely different kind of derivative',
      ],
      correct: 1,
      reveal:
        'Yes, identical underlying. The lot size is just the fixed bundle size the exchange chose for that contract. It changes how much one lot is worth, not what the contract is about. A mini contract simply lets someone take a smaller position in the same NIFTY.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: {},
      takeaway:
        'The deposit is a fraction of the value you control. Move the slider and watch how little cash sits behind a very large position.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'An exchange lists a full-size and a mini futures contract on the same stock, with different lot sizes. Decide what actually differs between them.',
          type: 'decision',
          spec: {
            options: [
              'The underlying asset itself',
              'Only the lot size, which changes the exposure one contract controls',
              'The direction each contract can be traded in',
            ],
            correct: 'Only the lot size, which changes the exposure one contract controls',
          },
          explanation:
            'Only the lot size. Both track the identical underlying. A smaller bundle simply lets someone take a smaller position in the same thing.',
        },
        {
          prompt:
            'You hold a Reliance futures contract. Reliance pays a dividend. Decide what you receive.',
          type: 'decision',
          spec: {
            options: ['The dividend, same as a shareholder', 'Nothing — you own no shares', 'Half of it'],
            correct: 'Nothing — you own no shares',
          },
          explanation:
            'Nothing. You hold an agreement about the share, not the share. Dividends go to people on the shareholder register, and a futures holder is not on it. This is the whole lesson in one consequence: a contract about a thing gives you the price movement and none of the ownership. No dividend, no vote, no entry in your demat account.',
        },
        {
          prompt:
            'A contract has a lot size of 50 and its underlying trades at ₹2,400. What value does one lot control?',
          type: 'compute',
          spec: { metric: 'literal', value: 120000, tolerance: 1, unit: '₹' },
          explanation:
            '50 × ₹2,400 = ₹1,20,000. Do this sum before every derivatives trade you ever take. The number you are about to risk is not the premium on the screen — it is a fraction of this. A learner who checks the lot value first has already avoided the most common way a small account is destroyed in a single afternoon.',
        },
        {
          prompt:
            'Sort each party by whether they can walk away from the deal.',
          type: 'classify',
          spec: {
            categories: ['Has a choice', 'Is obliged'],
            items: [
              { label: 'The buyer of an option', category: 'Has a choice' },
              { label: 'The seller of an option', category: 'Is obliged' },
              { label: 'The buyer of a futures contract', category: 'Is obliged' },
              { label: 'The seller of a futures contract', category: 'Is obliged' },
            ],
          },
          explanation:
            'Exactly one party in this whole table has a choice, and they paid for it. That payment is the premium. Everyone else is committed the moment the trade is done. Keep this table in your head for the rest of the stage. When a position starts behaving in a way that surprises you, the answer is almost always on the side you were not thinking about.',
        },
      ],
    },
  ],
};

export default lesson;
