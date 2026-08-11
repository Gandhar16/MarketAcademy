import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — correlation in a drawdown
 *
 * The companion to the portfolio lesson, and the one that explains why the
 * sector caps have to be conservative: the diversification you measured in calm
 * conditions is not the diversification you get in a crash.
 *
 * The mechanism is not mysterious. In ordinary times, prices move on
 * company-specific news, which differs by company. In a panic everybody sells
 * everything to raise cash, so every price moves on the same thing at once —
 * and correlations that averaged 0.3 for years arrive at 0.9 in a fortnight.
 *
 * The practical consequence: diversification is measured in the calm and
 * delivered in the storm, and it delivers least exactly when you need it most.
 */
export const lesson: Lesson = {
  id: 'in-t4-correlation',
  tier: 'T4',
  market: 'IN',
  title: 'Correlation goes to one exactly when it matters',
  summary:
    'Your holdings are diversified on a quiet Tuesday and are one position in a crash. That is not a failure of the idea — it is what a crash is.',
  plainSummary:
    'Different investments usually move apart, but in a panic they all fall together. This explains why, and what to do about it.',
  objectives: [
    'Explain why prices that usually move apart move together in a panic',
    'Say why diversification measured in calm conditions overstates protection',
    'Compute the loss when assumed diversification does not arrive',
    'Decide what actually diversifies a portfolio of shares',
  ],
  prerequisites: ['in-t4-portfolio'],
  estimatedMinutes: 14,
  introduces: ['drawdown', 'volatility', 'index', 'liquidity', 'position-size'],
  skills: ['portfolio', 'risk-management', 'drawdown'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You hold shares in ten unrelated industries. A serious market panic arrives. Roughly how much of your diversification survives?',
      options: [
        'Most of it — that is what diversification is for',
        'Very little, because in a panic everything is sold at once',
        'It depends on which industries you chose',
      ],
      correct: 1,
      reveal:
        'Very little. In ordinary weeks a share price moves on news about that company, so ten companies produce ten different stories. In a panic nobody is trading on company news at all — they are selling whatever they hold to raise cash, and what they hold is everything. So every price moves on the same thing at once. Correlations that averaged 0.3 for three years arrive at 0.9 inside a fortnight, and the portfolio you built for exactly this moment turns into one position on the way into it.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why the number moves',
      md:
        'Correlation is not a property of two companies. It is a property of **what is currently driving prices**.\n\nIn calm conditions that is company news, which differs by company, so prices move apart.\n\nIn a panic it is a single factor — everyone needs cash — which applies to every holding at once, so prices move together.\n\nSo the correlation you measured over three quiet years is a measurement of the calm regime. It was never a promise about the other one.',
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: '^NSEI', interval: '1d', range: '5y' },
      mode: 'view',
      takeaway:
        'Find the sharpest falls in these five years. On each of those days almost every Indian share fell, whatever business it was in.',
    },
    {
      kind: 'example',
      title: 'The same portfolio, two regimes',
      setup:
        'A ₹20,00,000 account, ten positions of ₹2,00,000 each in unrelated industries. Compare an ordinary bad week against a genuine panic week.',
      steps: [
        {
          label: 'Ordinary bad week — three positions fall 8%',
          detail: 'The others are flat or up, because their news differs',
          compute: { fn: 'percentOf', value: 600000, percent: -8 },
        },
        {
          label: 'What that is, as a share of the account',
          detail: 'Unpleasant, and exactly what diversification is meant to deliver',
          compute: { fn: 'literal', value: -2.4 },
        },
        {
          label: 'Panic week — all ten fall 18%',
          detail: 'Nobody is looking at company news any more',
          compute: { fn: 'percentOf', value: 2000000, percent: -18 },
        },
        {
          label: 'What that is, as a share of the account',
          detail: 'The whole portfolio behaved as one position',
          compute: { fn: 'literal', value: -18 },
        },
        {
          label: 'The rise needed to recover from it',
          detail: 'Losses compound harder than gains, as ever',
          compute: { fn: 'literal', value: 22 },
        },
      ],
      conclusion:
        'Ten positions delivered ten stories in the calm week and one story in the bad one.',
    },
    {
      kind: 'predict',
      prompt:
        'Given that, what actually reduces the damage in a panic?',
      options: [
        'Holding more different shares',
        'Holding less in shares overall, and holding some cash',
        'Choosing shares with lower correlations historically',
      ],
      correct: 1,
      reveal:
        'Holding less, and holding cash. The first and third answers both try to diversify WITHIN shares. The point is that a crisis has no inside-shares hiding place. What is falling is exposure to shares, and every share has it. Cash is dull, earns nothing, and is the only holding that reliably does not fall on the worst day. That is what you are paying for when you hold it: not a return, but a position that is uncorrelated when correlation is the problem.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'the-long-game',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'And liquidity vanishes at the same moment',
      md:
        'The two failures arrive together, which is what makes a crash different from a bad week.\n\nEverything falls at once **and** the buyers who were quoting prices step back, so the spreads widen and a large position cannot be sold near the screen price.\n\nSo the moment your diversification stops working is the same moment your exit gets expensive. Any plan that assumes you can reduce a position quickly in a crisis is assuming the one condition that will not hold.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A ₹15,00,000 portfolio falls 18% in a panic week. What rise is needed to get back to where it started, in percent?',
          type: 'compute',
          spec: { metric: 'literal', value: 22, tolerance: 0.7, unit: '%' },
          explanation:
            '1 ÷ 0.82 − 1 ≈ 22%. The asymmetry between a fall and the recovery it requires is the same arithmetic as risk of ruin, arriving at portfolio scale. It is also why the size of the worst plausible week matters far more than the average week, and why the limits in the previous lesson are set against that case.',
        },
        {
          prompt:
            'Sort each holding by whether it reliably helps in a share-market panic.',
          type: 'classify',
          spec: {
            categories: ['Reliably helps', 'Usually does not'],
            items: [
              { label: 'Cash', category: 'Reliably helps' },
              { label: 'A smaller total position in shares', category: 'Reliably helps' },
              { label: 'Shares in a different sector', category: 'Usually does not' },
              { label: 'More shares, in more industries', category: 'Usually does not' },
            ],
          },
          explanation:
            'The two that help both reduce exposure to the thing that is falling. The two that do not are attempts to diversify inside it, and in a panic there is nothing inside it to diversify into. This is an uncomfortable conclusion because the second column is what most portfolio advice consists of, and it is genuinely useful for ordinary weeks.',
        },
        {
          prompt:
            'Your risk model says a 20% portfolio fall is a once-in-thirty-years event. Decide how to treat that.',
          type: 'decision',
          spec: {
            options: [
              'Size for it — the model has done the work',
              'Assume it happens far more often, because the model measured calm periods',
              'Ignore models entirely',
            ],
            correct: 'Assume it happens far more often, because the model measured calm periods',
          },
          explanation:
            'Assume it is much more frequent. Models built on historical correlations inherit the regime those correlations came from. Calm periods are most of history, so the model has mostly learnt about the state that is not the problem. Every generation of risk management has rediscovered this in a crisis. The practical response is not to abandon models but to treat their tail estimates as optimistic by a wide margin.',
        },
      ],
    },
  ],
};

export default lesson;
