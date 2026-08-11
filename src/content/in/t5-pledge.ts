import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — pledging and the haircut
 *
 * Turning holdings into collateral so they can back a derivatives position.
 * Sold as making idle shares productive; it is a second layer of leverage
 * stacked on the first, and the collateral falls at the same moment the
 * position it supports does.
 *
 * The mechanism worth landing: the haircut means the value of the collateral
 * moves with the market, so a fall reduces the collateral AND increases the
 * requirement in the same session. That is a shortfall arriving from two
 * directions at once.
 */
export const lesson: Lesson = {
  id: 'in-t5-pledge',
  tier: 'T5',
  market: 'IN',
  title: 'Pledging shares and the haircut',
  summary:
    'Your holdings can back a derivatives position, at a discount. The discount is the easy part — the danger is that the collateral falls at the same moment the position does.',
  plainSummary:
    'Shares you already own can be used as a deposit for other trades. This shows how much of their value counts and what happens if they fall.',
  objectives: [
    'Say what a haircut is and why lenders apply one',
    'Compute the usable collateral value of a given holding',
    'Explain why a cash component is still required',
    'Describe how a fall creates a shortfall from two directions at once',
  ],
  prerequisites: ['in-t5-mtf'],
  estimatedMinutes: 13,
  introduces: ['margin', 'leverage', 'depository', 'liquidity', 'volatility', 'drawdown', 'derivative'],
  skills: ['edge-cases', 'margin', 'india-rules'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You pledge ₹10,00,000 of shares as collateral for derivatives positions. How much margin do you get?',
      options: [
        '₹10,00,000',
        'Less — a percentage is deducted, and part of the remainder must still be cash',
        'More, because collateral is leveraged',
      ],
      correct: 1,
      reveal:
        'Less, and there is a second condition people miss. A haircut is deducted first — perhaps 20% on a liquid share, far more on a volatile one — so ₹10,00,000 of shares might give ₹8,00,000 of collateral value. Then the rules require a portion of your total margin to be actual cash rather than pledged shares. So pledging cannot fund a position entirely; it can only fund part of one, and the part it cannot fund has to come from money you have.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why a haircut exists',
      md:
        'The lender is holding your shares against an obligation. If they ever have to sell them, they will be selling during a fall — which is exactly when the price is worst and the book is thin.\n\nThe **haircut** is the discount that protects them from that. A stable large company gets a small one; a volatile small one gets a large one, or is not accepted at all.\n\nSo the number is a measure of how confident the lender is that they could sell your shares in a hurry.',
    },
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: {},
      takeaway:
        'Collateral funds the deposit and the deposit supports a much larger position. Pledging adds a layer of leverage underneath a layer of leverage.',
    },
    {
      kind: 'example',
      title: 'A fall arriving from two directions',
      setup:
        'You pledge ₹10,00,000 of shares at a 20% haircut, giving ₹8,00,000 of collateral, and use it to support derivatives positions requiring ₹7,50,000 of margin. Then the market falls 15%.',
      steps: [
        {
          label: 'Collateral value at the start',
          detail: '₹10,00,000 of shares, less a 20% haircut',
          compute: { fn: 'percentOf', value: 1000000, percent: 80 },
        },
        {
          label: 'The shares after a 15% fall',
          detail: 'Your pledged holdings are ordinary shares and they fell too',
          compute: { fn: 'percentOf', value: 1000000, percent: 85 },
        },
        {
          label: 'Collateral value now',
          detail: 'The same haircut, applied to a smaller number',
          compute: { fn: 'percentOf', value: 850000, percent: 80 },
        },
        {
          label: 'Collateral lost',
          detail: 'From ₹8,00,000 down to ₹6,80,000',
          compute: { fn: 'literal', value: -120000 },
        },
        {
          label: 'And the margin requirement typically rises',
          detail: 'Volatility went up, so the exchange asks for more',
          compute: { fn: 'literal', value: 850000 },
        },
      ],
      conclusion:
        'The collateral shrank by ₹1,20,000 and the requirement grew. The shortfall arrives from both ends on the same afternoon.',
    },
    {
      kind: 'predict',
      prompt:
        'Given that, what happens if you cannot fund the shortfall by the end of the day?',
      options: [
        'You get a few days to arrange it',
        'The pledged shares are sold — during the fall that caused the problem',
        'The position is frozen until you pay',
      ],
      correct: 1,
      reveal:
        'The pledged shares are sold, during the fall. That is what collateral means, and it is why the arrangement is dangerous in a way that pledging feels like it should not be. You have not merely leveraged a derivatives position; you have made your long-term holdings the thing that gets liquidated when that position goes wrong. Two separate decisions — what to own for years, and what to trade this month — become one exposure, and the second one can destroy the first.',
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
      title: 'Pledging is not free money',
      md:
        'It is often described as making idle shares productive, and the shares were not idle. They were a long-term holding.\n\nWhat pledging does is **link two positions that were previously independent**. Your investments now back your trades, so a bad month in the trading account can force the sale of holdings you intended to keep for a decade.\n\nIf you use it at all, use a small fraction of the holding — and know, before you pledge, what fall would trigger a sale.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You pledge ₹6,00,000 of shares at a 25% haircut. What collateral value do you receive, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 450000, tolerance: 2000, unit: '₹' },
          explanation:
            '₹6,00,000 × 75% = ₹4,50,000. And a portion of your total margin must still be cash, so this figure is a ceiling on what pledging contributes rather than a complete funding source. Both constraints are worth knowing before you plan a position around pledged collateral.',
        },
        {
          prompt:
            'Sort each factor by whether it makes the haircut on a share larger.',
          type: 'classify',
          spec: {
            categories: ['Larger haircut', 'Smaller haircut'],
            items: [
              { label: 'The share moves a great deal day to day', category: 'Larger haircut' },
              { label: 'It trades thinly', category: 'Larger haircut' },
              { label: 'It is a large index constituent', category: 'Smaller haircut' },
              { label: 'It has deep, liquid volume', category: 'Smaller haircut' },
            ],
          },
          explanation:
            'Every factor is about how easily the lender could sell it in a hurry. That is the entire logic of a haircut, and it is the same liquidity question this stage keeps returning to. A share the lender does not want to be stuck with gets a large discount, or is simply not on the accepted list.',
        },
        {
          prompt:
            'You want to pledge your entire long-term holding to fund a larger derivatives position. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Do it — the shares are sitting there anyway',
              'Do not: it makes your long-term holdings the collateral that gets sold when the trading goes wrong',
              'Do it, but only with a stop-loss on the derivatives',
            ],
            correct:
              'Do not: it makes your long-term holdings the collateral that gets sold when the trading goes wrong',
          },
          explanation:
            'Do not pledge the whole holding. The point of a long-term holding is that you can sit through the falls. Pledging removes exactly that option: the shares are sold by somebody else, during the fall, to protect a trade. The third answer does not help. The situations that cause a shortfall are the ones where stops do not work: gaps, locked circuits and thin books.',
        },
      ],
    },
  ],
};

export default lesson;
