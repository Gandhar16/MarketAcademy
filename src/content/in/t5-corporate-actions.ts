import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — corporate actions on derivatives
 *
 * Stage 4 taught what a split and a bonus do to shares: nothing, in value
 * terms. This teaches what they do to CONTRACTS, where the exchange has to
 * rewrite the strike and the lot size to keep the position whole.
 *
 * The adjustment is arithmetically correct and it produces contracts with
 * strange strikes and non-standard lot sizes, which are then much harder to
 * trade out of. That illiquidity is the real hazard, not the arithmetic.
 */
export const lesson: Lesson = {
  id: 'in-t5-corporate-actions',
  tier: 'T5',
  market: 'IN',
  title: 'When a corporate action rewrites your contract',
  summary:
    'A split does nothing to the value of a contract and everything to its terms. The strike and the lot size are rewritten, and the result is much harder to trade.',
  plainSummary:
    'When a company splits its shares, the contracts written on them have to be rewritten too. This shows what changes and what it costs you.',
  objectives: [
    'Explain why an exchange adjusts contract terms after a corporate action',
    'Compute the new strike and lot size after a split or bonus',
    'Say why the adjusted contract is harder to trade than the original',
    'Decide what to do when holding a contract facing an adjustment',
  ],
  prerequisites: ['in-t3-expiry'],
  estimatedMinutes: 13,
  introduces: ['corporate-action', 'strike-price', 'lot-size', 'liquidity', 'expiry', 'derivative', 'spread'],
  skills: ['edge-cases', 'derivatives', 'india-rules'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You hold a call on a share at a strike of ₹2,400, lot size 250. The company announces a 2-for-1 split. What happens to your contract?',
      options: [
        'Nothing — it was written before the split',
        'The strike halves and the lot size doubles, so the value is unchanged',
        'It is cancelled and settled in cash',
      ],
      correct: 1,
      reveal:
        'The exchange rewrites it. The strike becomes ₹1,200 and the lot becomes 500, so your position controls the same underlying value as before. This has to happen. The share price halved for reasons unrelated to the business, and leaving a ₹2,400 strike in place would destroy a contract that was in the money. The adjustment is fair and it is arithmetic. What it is not is harmless, because the contract that comes out of it is not one anybody else is trading.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The principle: keep the value whole',
      md:
        'The exchange applies an **adjustment factor** so that the total value your position controls is the same immediately before and immediately after.\n\nFor a 2-for-1 split the factor is 2: strike ÷ 2, lot × 2.\n\nA bonus works the same way. A dividend usually does not trigger an adjustment at all unless it is unusually large, because ordinary dividends are already expected and priced in.\n\nNothing is created and nothing is destroyed. Only the labels change.',
    },
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 2400,
        editable: true,
        legs: [{ type: 'call', quantity: 1, strike: 2400, premium: 120 }],
      },
      takeaway:
        'The shape before adjustment. Halve the strike and double the quantity in your head — the same shape, drawn at half the scale.',
    },
    {
      kind: 'example',
      title: 'The adjustment, and the part nobody mentions',
      setup:
        'You hold one lot of a ₹2,400 call, lot size 250, on a share trading at ₹2,500. A 2-for-1 split is announced. Follow the arithmetic, then look at the last two rows.',
      steps: [
        {
          label: 'Value controlled before',
          detail: 'Share at ₹2,500, lot of 250',
          compute: { fn: 'multiply', a: 2500, b: 250, dp: 0 },
        },
        {
          label: 'The share after the split',
          detail: 'Twice as many shares, half the price. No value moved',
          compute: { fn: 'literal', value: 1250 },
        },
        {
          label: 'New strike and lot',
          detail: 'Strike ₹1,200, lot 500 — the same value controlled',
          compute: { fn: 'multiply', a: 1250, b: 500, dp: 0 },
        },
        {
          label: 'What it was worth if used, before',
          detail: 'Spot ₹2,500 against a ₹2,400 strike',
          compute: { fn: 'optionIntrinsic', spot: 2500, strike: 2400, type: 'call' },
        },
        {
          label: 'What it is worth if used, after',
          detail: '₹50 a share across twice as many shares. Identical',
          compute: { fn: 'optionIntrinsic', spot: 1250, strike: 1200, type: 'call' },
        },
      ],
      conclusion:
        'Perfectly preserved. And you now hold a ₹1,200 strike with a 500 lot, while everybody else is trading the standard ₹1,250 strikes with standard lots.',
    },
    {
      kind: 'predict',
      prompt:
        'Given that, what is the real problem with the adjusted contract?',
      options: [
        'It is worth less than before',
        'Almost nobody trades it, so the gap between buying and selling is wide',
        'It expires earlier',
      ],
      correct: 1,
      reveal:
        'Nobody trades it. The exchange lists standard strikes at standard intervals, and your adjusted contract sits on none of them. You hold a ₹1,200 strike in a market where everything else is at the new standard levels. Volume moves to the standard series and your contract becomes an orphan. The value is intact and the exit is not. That is the pattern of this entire stage: the arithmetic is fair and the liquidity is what hurts you.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'SpreadDiagram',
      props: {},
      caption:
        'The gap between what buyers offer and sellers ask, on a contract nobody else wants. That gap is what an adjustment quietly costs you.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What to do about it',
      md:
        '**Corporate actions are announced in advance.** The record date is public well before it arrives, and so is the exchange circular describing the adjustment.\n\n**Close before the adjustment if you can.** Trading out of a standard contract is easy; trading out of an adjusted one is not.\n\n**If you must hold through it, expect a poor exit.** Widen your assumptions about the spread, and do not plan to leave in a hurry.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You hold a ₹1,800 call with a lot size of 300. The company announces a 3-for-1 split. What is the new strike, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 600, tolerance: 5, unit: '₹' },
          explanation:
            '₹1,800 ÷ 3 = ₹600, and the lot goes from 300 to 900. Multiply the two and you control the same value as before. The arithmetic is easy; remembering to check whether an adjustment is coming before you take a position is the part that requires a habit.',
        },
        {
          prompt:
            'Sort each consequence of an adjustment.',
          type: 'classify',
          spec: {
            categories: ['Genuinely happens', 'Does not happen'],
            items: [
              { label: 'The strike is rewritten', category: 'Genuinely happens' },
              { label: 'The contract becomes hard to trade out of', category: 'Genuinely happens' },
              { label: 'You lose value in the adjustment', category: 'Does not happen' },
              { label: 'The contract expires early', category: 'Does not happen' },
            ],
          },
          explanation:
            'The two real consequences are one mechanical and one practical, and only the second costs you anything. The anxiety usually attaches to the wrong one. People worry about being cheated by the arithmetic, which is precise, and ignore the illiquidity, which is where the money goes.',
        },
        {
          prompt:
            'You hold a contract in a company that has announced a bonus issue next month. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Hold — the adjustment protects your value',
              'Close it before the adjustment, or accept a much worse exit later',
              'Buy more, since the contract will be adjusted favourably',
            ],
            correct: 'Close it before the adjustment, or accept a much worse exit later',
          },
          explanation:
            'Close it, or accept the consequence knowingly. The adjustment does protect the value — that part of the first answer is true — and it hands you a contract that nobody wants to trade. The third answer misreads the adjustment as a benefit; it is exactly value-neutral by construction, and there is no free gain hiding in it.',
        },
      ],
    },
  ],
};

export default lesson;
