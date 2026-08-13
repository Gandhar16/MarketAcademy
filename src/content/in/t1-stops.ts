import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — stops
 *
 * Position sizing taught that the exit distance decides the size. This teaches
 * where the exit belongs and what it can and cannot do for you.
 *
 * TWO THINGS THIS LESSON REFUSES TO SOFTEN
 *
 *   1. A stop is not a guaranteed price. It is a trigger that becomes an
 *      ordinary order, and it fills wherever the market is. On a gap that can
 *      be a very long way from where you put it.
 *   2. A stop placed at "the amount I am willing to lose" is placed at the
 *      wrong thing. The market has no idea what your loss tolerance is. It goes
 *      where the IDEA is disproved, and if that is too far away, the answer is
 *      a smaller position rather than a nearer stop.
 *
 * The second is the harder sell and it is the one that matters, because moving
 * a stop closer feels like risk management and is really just changing where you
 * will be taken out by noise.
 */
export const lesson: Lesson = {
  id: 'in-t1-stops',
  tier: 'T1',
  market: 'IN',
  title: 'Stops that survive contact with the market',
  summary:
    'A stop is a trigger, not a promise. Put it where the idea is disproved rather than where the loss becomes uncomfortable — and find out what a gap does to it.',
  plainSummary:
    'You can leave an instruction to sell if the price falls too far. This shows where to put it, and what it can and cannot protect you from.',
  objectives: [
    'Explain why a stop does not guarantee the price you set',
    'Place a stop by where an idea is disproved rather than by a rupee amount',
    'Work out what an overnight gap does to a stop',
    'Say why moving a stop closer does not reduce risk',
  ],
  prerequisites: ['in-t1-position-sizing'],
  estimatedMinutes: 14,
  introduces: ['stop-loss', 'trigger-price', 'gap', 'slippage', 'atr', 'risk-per-trade', 'market-order'],
  skills: ['stops', 'risk-management'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You hold a share at ₹1,400 with a stop at ₹1,350. Bad news lands overnight and it opens at ₹1,180. What price do you get?',
      options: ['₹1,350 — that is what a stop is for', 'About ₹1,180', 'You do not get filled at all'],
      correct: 1,
      reveal:
        'About ₹1,180. A stop is not a guaranteed price. It is an instruction that becomes an ordinary sell order the moment the trigger is reached, and an ordinary sell order fills wherever the market actually is. Overnight the market simply was not at ₹1,350 — it never traded there. Nobody did anything wrong and nothing failed. This is the most important thing to understand about stops. A person who believes their loss is capped at ₹50 a share will size the position as though it is.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'TriggerFillExplainer',
      props: {},
      takeaway:
        'Step through it once. Nothing failed here — the order did exactly what it was told; the market simply was not at ₹1,350 that morning.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two prices, not one',
      md:
        'Every stop has a **trigger** and a **fill**.\n\nThe trigger is the level you chose. When the market reaches it, your order wakes up.\n\nThe fill is wherever the order actually executes, which is the next available price. In a calm market those two are almost the same. In a fast one, or after a **gap**, they are not.\n\nSo a stop limits your loss *usually*, and it removes a decision *always*. The second is the more reliable benefit.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Push a sell through a thin book. This is exactly what a triggered stop does — and the emptier the book, the further from your trigger it lands.',
    },
    {
      kind: 'example',
      title: 'Where the stop belongs, and what that costs',
      setup:
        'You have ₹2,00,000 and you like a share at ₹1,400. Below ₹1,340 the reason you bought it is no longer true — that is where the idea is disproved, not where the loss gets uncomfortable. You will risk 1%.',
      steps: [
        {
          label: 'The rupees you are risking',
          detail: '1% of the account, chosen before you looked at the chart',
          compute: { fn: 'riskAmount', equity: 200000, riskPercent: 1 },
        },
        {
          label: 'Risk per share',
          detail: 'Entry ₹1,400 down to the level where the idea fails, ₹1,340',
          compute: { fn: 'literal', value: 60 },
        },
        {
          label: 'The size that allows',
          detail: 'Budget divided by risk per share. The stop decides the size',
          compute: { fn: 'sizeFromStop', equity: 200000, riskPercent: 1, entry: 1400, stop: 1340 },
        },
        {
          label: 'If it gaps to ₹1,260 instead',
          detail: '₹140 a share against 33 shares — more than double what you planned',
          compute: { fn: 'multiply', a: -140, b: 33, dp: 0 },
        },
        {
          label: 'And the costs on the way out',
          detail: 'Charged whether the exit was planned or forced',
          compute: { fn: 'legCost', product: 'delivery', side: 'sell', price: 1260, quantity: 33 },
        },
      ],
      conclusion:
        'The plan risked ₹2,000. The gap cost ₹4,620. A stop is a good tool that occasionally fails in one specific way, and you should size knowing that.',
    },
    {
      kind: 'predict',
      prompt:
        'You do not like risking ₹60 a share, so you move the stop to ₹1,380 — ₹20 away. Work out both consequences before you look.',
      options: [
        'Less risk per trade, and nothing else changes',
        'Same rupees at risk if you resize, and it gets hit far more often',
        'More risk, because the position is larger',
      ],
      correct: 1,
      reveal:
        'Same rupees at risk, and hit far more often. If you resize properly, ₹2,000 divided by ₹20 is 100 shares instead of 33 — the money at stake is identical by construction. What changed is the probability of being taken out by ordinary daily movement, which on most shares is comfortably more than ₹20. So you have not reduced risk. You converted a rare large loss into a frequent small one, and moved the stop away from the level that actually meant something. Both of those are worse.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'You place your stop at exactly ₹1,400 — a round number many other traders also use as a level. What is the practical risk of this, beyond the stop itself?',
      options: [
        'None — a stop at a round number works exactly the same as any other level',
        'Round numbers often have many other stops clustered at the same price, which can worsen the fill when they all trigger together',
        'Round numbers are always safer, since more people are watching them',
      ],
      correct: 1,
      reveal:
        'Round numbers attract clusters of stops from many different traders, not just yours. When the price reaches that level, a wave of sell orders can trigger at once, temporarily overwhelming the buyers resting there. It is the same mechanism as a thin book, produced by crowding rather than by low volume. A stop placed just beyond the round number, rather than exactly on it, avoids being caught in that particular crowd.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '1d', range: '6mo' },
      mode: 'view',
      takeaway:
        'Turn on ATR. That number is roughly how far this share moves in an ordinary day — a stop inside it is a stop that will be hit by nothing in particular.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The one rule that is not negotiable',
      md:
        'A stop may be moved in the direction of profit. It may never be moved away.\n\nEvery large loss in retail trading has the same shape: a stop was set, the price approached it, and a reason appeared for why this particular case was different.\n\nIf you find yourself constructing that reason, the position is already telling you the size was wrong. The honest move is to close it, not to widen the line.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You are choosing between a stop at exactly ₹1,000 and a stop at ₹995, both roughly equally valid for where your idea is disproved. Decide.',
          type: 'decision',
          spec: {
            options: [
              '₹1,000, since round numbers are easier to remember',
              '₹995, since a stop clustered at a round number risks a worse fill when many other stops trigger together',
              'It makes no difference either way',
            ],
            correct:
              '₹995, since a stop clustered at a round number risks a worse fill when many other stops trigger together',
          },
          explanation:
            '₹995. When the level itself is genuinely ambiguous, avoiding the exact round number sidesteps the crowding effect this lesson describes — a small, free choice once you know to make it.',
        },
        {
          prompt:
            'Account ₹3,00,000, risking 1%. Entry ₹800, the idea fails below ₹770. How many shares?',
          type: 'compute',
          spec: { metric: 'literal', value: 100, tolerance: 2, unit: 'shares' },
          explanation:
            '₹3,000 of risk divided by ₹30 a share is 100 shares. Notice the order the numbers arrived in: the account and the risk budget first, the level where the idea fails second, and the share count last as a consequence. Any other order lets the position size be decided by how confident you feel, which is the thing sizing rules exist to prevent.',
        },
        {
          prompt:
            'Sort each statement about a stop by whether it is true.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'It removes a decision from a bad moment', category: 'True' },
              { label: 'It usually limits the loss to about the planned amount', category: 'True' },
              { label: 'It guarantees the price you set', category: 'Not true' },
              { label: 'It protects you across an overnight gap', category: 'Not true' },
            ],
          },
          explanation:
            'The two true statements are the real benefits and they are worth a great deal. The two false ones are what people assume they are buying, and the gap between the two columns is where the surprises live. A stop is a good tool with one specific failure mode; knowing the failure mode is what lets you size for it instead of being astonished by it.',
        },
        {
          prompt:
            'Your share is ₹2 above your stop and you are convinced the fall is temporary. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Move the stop lower to give it room',
              'Leave it — the level was chosen when you could think clearly',
              'Cancel the stop and watch it manually',
            ],
            correct: 'Leave it — the level was chosen when you could think clearly',
          },
          explanation:
            'Leave it. The version of you that set the level had no money on the line and no urge to be right; the version considering the change has both. The third answer is the first one with extra steps. "Watching it manually" means deciding in the moment, which is precisely the decision the stop existed to remove. If the level was genuinely wrong, that is a lesson for the next trade, not a reason to change this one.',
        },
      ],
    },
  ],
};

export default lesson;
