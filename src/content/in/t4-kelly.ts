import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — Kelly
 *
 * The risk-of-ruin lesson showed that bet size decides survival. This gives the
 * formula that answers "how much", and then spends most of its length on why
 * nobody sane uses the answer it produces.
 *
 * The asymmetry is the whole lesson: betting HALF the Kelly fraction gives up
 * about a quarter of the growth, while betting TWICE it has negative expected
 * growth despite every individual bet having positive expectancy. Since your
 * edge is always estimated rather than known, and estimates are wrong in both
 * directions, the sensible response to that asymmetry is to sit well below the
 * optimum on purpose.
 */
export const lesson: Lesson = {
  id: 'in-t4-kelly',
  tier: 'T4',
  market: 'IN',
  title: 'Kelly, and why nobody sane uses all of it',
  summary:
    'There is a mathematically optimal bet size. Betting half of it costs you a quarter of the growth; betting twice it takes you to zero. That asymmetry decides everything.',
  plainSummary:
    'There is a formula for the best amount to bet. This shows what it says, and why experienced people deliberately bet much less than it.',
  objectives: [
    'Compute the growth-optimal fraction from a win rate and a payoff ratio',
    'Explain why over-betting is far worse than under-betting',
    'Say why an estimated edge changes the answer',
    'Decide a practical fraction for a given estimated edge',
  ],
  prerequisites: ['in-t4-risk-of-ruin'],
  estimatedMinutes: 15,
  introduces: ['risk-of-ruin', 'drawdown', 'expectancy', 'risk-per-trade', 'position-size'],
  skills: ['position-sizing', 'risk-of-ruin', 'expectancy'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You have a genuine edge: 55% win rate at 1:1. Kelly says bet 10% of the account each time. What happens if you bet 20% instead?',
      options: [
        'Roughly double the growth',
        'Somewhat slower growth than optimal',
        'Negative expected growth, despite every bet having positive expectancy',
      ],
      correct: 2,
      reveal:
        'Negative expected growth. This is the result that makes Kelly dangerous rather than useful in naive hands. Each individual bet still has a positive expected value — you are still favoured — and yet the compounded outcome trends to zero. The reason is that losses compound geometrically: at 20% per bet the drawdowns are deep enough that the recoveries cannot keep up. Twice the optimal fraction is exactly the point where growth crosses zero, and anything beyond it is worse.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The formula, and what it is optimising',
      md:
        'For a bet that pays `b` to 1, wins with probability `p` and loses with probability `q`:\n\n`f = (b·p − q) ÷ b`\n\nAt 55% and 1:1 that gives `(0.55 − 0.45) ÷ 1` = **10%**.\n\nWhat it maximises is the **long-run growth rate**, not your expected wealth after one bet. Those are different objectives, and the second one always tells you to bet everything.',
    },
    {
      kind: 'game',
      game: 'risk-roulette',
      config: {},
    },
    {
      kind: 'example',
      title: 'The asymmetry, in numbers',
      setup:
        'The same 55/45 edge at 1:1, where full Kelly is 10%. Compare what different fractions do to long-run growth, and to the depth of the holes you have to sit through.',
      steps: [
        {
          label: 'Full Kelly — the growth rate',
          detail: 'The maximum available. Nothing beats it on growth alone',
          compute: { fn: 'literal', value: 0.5 },
        },
        {
          label: 'Half Kelly — 5% a bet',
          detail: 'Three-quarters of the growth, from half the risk',
          compute: { fn: 'literal', value: 0.375 },
        },
        {
          label: 'Typical worst drawdown at full Kelly',
          detail: 'Deep enough that most people abandon the method',
          compute: { fn: 'literal', value: -50 },
        },
        {
          label: 'Typical worst drawdown at half Kelly',
          detail: 'Uncomfortable rather than unbearable',
          compute: { fn: 'literal', value: -25 },
        },
        {
          label: 'Double Kelly — 20% a bet',
          detail: 'Growth crosses zero here and turns negative beyond it',
          compute: { fn: 'literal', value: 0 },
        },
      ],
      conclusion:
        'Half Kelly gives up a quarter of the growth and halves the pain. Double Kelly gives up all of it.',
    },
    {
      kind: 'predict',
      prompt:
        'You believe your win rate is 60% at 1:1, so you size at 20%. Your true win rate is 55%. Work out where that puts you before you look.',
      options: [
        'Slightly over-sized, but fine',
        'At exactly double the correct Kelly fraction, where growth is zero',
        'Under-sized, since 60% would justify more',
      ],
      correct: 1,
      reveal:
        'At exactly double, where growth is zero. A five percentage point error in your estimate of your own win rate — well within the noise of a few hundred trades — took you from optimal to worthless. This is why Kelly is not a formula you apply, it is a ceiling you stay a long way below. Your edge is always estimated, the estimate always has a wide confidence interval, and the penalty for over-estimating is enormously worse than the penalty for under-estimating.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'RiskRewardDiagram',
      props: { entry: 1400 },
      caption:
        'The two distances that produce the payoff ratio in the formula. Both are estimates, and both are usually more optimistic on paper than in an account.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What practitioners actually do',
      md:
        'A **quarter to a half** of the Kelly fraction, and often less.\n\nYou give up some growth. You buy an enormous reduction in the chance of a drawdown deep enough that you stop following the method. That is the failure which ends careers, rather than the arithmetic one.\n\nAnd note where the 1% and 2% risk-per-trade rules from stage 3 sit on this scale: far below even a quarter Kelly for most realistic edges. They are not timid. They are honest about how uncertain the edge estimate is.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A strategy wins 60% of the time at 1:1. What does the Kelly formula give as the optimal fraction, in percent?',
          type: 'compute',
          spec: { metric: 'literal', value: 20, tolerance: 1, unit: '%' },
          explanation:
            '(1 × 0.60 − 0.40) ÷ 1 = 0.20, so 20%. Now notice what that number would do to a real account: a run of five losses, which happens regularly at a 60% win rate, takes you down by nearly two-thirds. The formula is correct and it assumes you know the 60% exactly, which you never do.',
        },
        {
          prompt:
            'Sort each consequence by whether it comes from betting under or over the optimal fraction.',
          type: 'classify',
          spec: {
            categories: ['Under-betting', 'Over-betting'],
            items: [
              { label: 'Slower growth than was available', category: 'Under-betting' },
              { label: 'Shallower drawdowns', category: 'Under-betting' },
              { label: 'Negative growth despite a positive edge', category: 'Over-betting' },
              { label: 'Drawdowns deep enough to abandon the method', category: 'Over-betting' },
            ],
          },
          explanation:
            'Under-betting costs you money you never had. Over-betting costs you money you did have, and eventually the account. The two columns are not symmetric in severity, and that is the practical content of this lesson. When uncertain about your edge — and you always are — err downward. The two errors have very different prices.',
        },
        {
          prompt:
            'You estimate a 3:1 payoff at a 35% win rate, from 80 trades. Decide how to size.',
          type: 'decision',
          spec: {
            options: [
              'Full Kelly, since the edge is clearly positive',
              'A quarter of Kelly or less, because 80 trades is a very wide confidence interval',
              'Do not trade it at all',
            ],
            correct: 'A quarter of Kelly or less, because 80 trades is a very wide confidence interval',
          },
          explanation:
            'A quarter or less. Eighty trades tells you almost nothing precise about a win rate — the true figure could plausibly be 28% or 42%, and Kelly is very sensitive to which. The third answer is too cautious given a genuinely positive expected value. Sizing small is how you keep the position while the sample grows, and the sample growing is the only thing that will ever narrow the estimate.',
        },
      ],
    },
  ],
};

export default lesson;
