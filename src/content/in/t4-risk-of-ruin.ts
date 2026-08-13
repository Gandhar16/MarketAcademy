import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — risk of ruin (universal, taught India-first)
 *
 * The lesson that decides whether anything else in the curriculum matters. A
 * learner with a real edge and bad sizing goes broke; a learner with a mediocre
 * edge and good sizing survives long enough to improve. Everybody nods at this
 * and almost nobody has actually watched it happen, which is what the embedded
 * Risk Roulette game is for.
 */
export const lesson: Lesson = {
  id: 'in-t4-risk-of-ruin',
  tier: 'T4',
  market: 'BOTH',
  title: 'Why a good strategy still goes broke',
  summary:
    'A real, positive edge is not enough. Watch the same winning system bankrupt itself on bet size alone, then work out the size that survives.',
  plainSummary:
    'A strategy that makes money on average can still leave you with nothing. This shows why that happens, and why the size of each bet matters more than whether you were right.',
  objectives: [
    'Explain why losses compound harder than gains',
    'Estimate the risk per trade at which a given edge survives its own variance',
    'State why full Kelly is dangerous when the edge is estimated rather than known',
    'Size a position from a stop distance and a risk budget',
  ],
  prerequisites: ['in-t1-real-cost-of-a-trade'],
  estimatedMinutes: 19,
  introduces: ['risk-of-ruin', 'drawdown', 'expectancy'],
  skills: ['position-sizing', 'risk-of-ruin', 'expectancy'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A system wins 55% of the time at 1:1 — a genuinely good, genuinely positive edge. You risk 20% of your account on each trade. Over 200 trades, how often does this end with you having lost half your money or more?',
      options: ['Almost never — the edge is positive', 'About 1 time in 10', 'About 1 time in 3', 'More than half the time'],
      correct: 3,
      reveal:
        'More than half the time. This is the single most counter-intuitive result in trading and the reason experienced people talk about sizing more than they talk about entries. The edge is real, and it does not save you. Losses compound geometrically: a 50% fall needs a 100% gain to recover. Bet a fifth of a shrinking account each time and the arithmetic runs out before the edge can assert itself. The game below runs it on draws you can reproduce — set the risk to 20% and watch.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'GeometricRuinExplainer',
      props: {},
      takeaway:
        'Step through it once. Six ordinary losses at 20% a bet leaves about a quarter of the account — needing a 280% gain just to get back.',
    },
    {
      kind: 'game',
      game: 'risk-roulette',
      config: {},
    },
    {
      kind: 'prose',
      md:
        'Two things to notice while you play.\n\nFirst, the **losing streaks**. At a 55% win rate, six or seven losses in a row across 200 trades is completely ordinary. It is not evidence that your system stopped working, and treating it as evidence is how people abandon an edge at the worst possible moment.\n\nSecond, the **fifth percentile**. One run in twenty is at least that bad. Most people plan for the median outcome and are genuinely surprised by the tail, which arrives on schedule.',
    },
    {
      kind: 'predict',
      prompt:
        'Kelly says the growth-optimal bet for a 55/45 edge at 1:1 is 10% of your account. You believe your win rate is 60% and size at 20% accordingly. Your true win rate is actually 55%. What happens?',
      options: [
        'Slightly slower growth than optimal',
        'Roughly the same outcome — 5 percentage points is within noise',
        'Ruin becomes a common outcome rather than a tail risk',
      ],
      correct: 2,
      reveal:
        'Ruin becomes common. Kelly is optimal only if you know your edge exactly, and you never do. An edge measured on a few hundred trades has a wide confidence interval. Kelly is brutally asymmetric about overestimation. Betting twice the correct Kelly fraction has NEGATIVE expected growth even though each individual bet still has positive expectancy. This is why practitioners who use Kelly at all use a half or a quarter of it. You give up some growth. You buy a large reduction in the chance of not being around to compound at all.',
      askWhy: false,
    },
    {
      kind: 'predict',
      prompt:
        'A system with a genuinely larger edge — 65% win rate at 1:1 — is sized at 20% per trade, the same aggressive size as before. Does the larger edge meaningfully protect it from the same ruin risk?',
      options: [
        'Yes — a bigger edge makes 20% sizing safe',
        'It helps, but a big enough losing streak still does severe damage at that size',
        'No difference at all — edge size never matters',
      ],
      correct: 1,
      reveal:
        'It helps, but does not neutralise the risk. A stronger edge makes long losing streaks rarer. It does not change what a 20% bet size does once a streak happens. Six losses in a row at 20% each still cuts the account to roughly a quarter, whatever the win rate was going in.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'Sizing one real trade, properly',
      setup:
        'Your account is 2,00,000 rupees. You want to buy RELIANCE at 1,400 with a stop at 1,372. How many shares? Note what this calculation does NOT ask about: your conviction, your margin limit, or how much cash happens to be spare.',
      steps: [
        {
          label: 'Decide the rupee risk first',
          detail: 'One percent of equity, chosen before you looked at the chart rather than after',
          compute: { fn: 'riskAmount', equity: 200000, riskPercent: 1 },
        },
        { label: 'Risk per share', detail: 'Entry 1,400 minus stop 1,372', value: '28.00' },
        {
          label: 'Position size falls out of it',
          detail: 'Risk budget divided by risk per share. The stop determines the size, not the other way round',
          compute: { fn: 'sizeFromStop', equity: 200000, riskPercent: 1, entry: 1400, stop: 1372 },
        },
        {
          label: 'What that position is worth',
          detail: 'Note it is half the account. Size and risk are not the same thing',
          compute: { fn: 'multiply', a: 1400, b: 71, dp: 0 },
        },
        {
          label: 'And the costs on top',
          detail: 'A round trip at this size, which your 2,000 rupees of risk has to absorb as well',
          compute: { fn: 'roundTripTotal', product: 'intraday', price: 1400, quantity: 71 },
        },
      ],
      conclusion:
        'If that share count looks disappointingly small, the correct response is a smaller trade, never a wider stop.',
    },
    {
      // The example above is worked for you. This one changes a single number
      // and hands it back — the only way to find out whether the method
      // transferred, or whether the walkthrough merely felt clear (R16).
      kind: 'predict',
      prompt:
        'Same account of ₹2,00,000 and the same 1% risk budget. This time your stop is wider: entry ₹1,400, stop ₹1,344. Work it out before you look. How many shares?',
      options: ['About 36 shares', 'About 71 shares', 'About 142 shares', 'It does not change — the account did not change'],
      correct: 0,
      reveal:
        'About 36 shares. The risk budget is unchanged at ₹2,000. What changed is the risk per share: ₹56 instead of ₹28. Double the stop distance, half the position. That is the whole method in one line. Notice the direction it moves. A wider stop feels safer, and it buys that feeling by making every share cost you more when you are wrong. So the position has to shrink to pay for it. If you picked 142, you inverted the division — a common slip, and an expensive one, because it doubles your risk at exactly the moment you thought you were being careful.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'RiskRewardDiagram',
      props: { entry: 1400 },
      caption:
        'The same trade drawn to scale. Drag the two distances and watch the win rate you need just to break even, which is the honest test of whether a setup is worth taking.',
    },
    {
      kind: 'widget',
      component: 'BreakevenSlider',
      props: { market: 'IN', product: 'intraday', price: 1400, minValue: 10_000, maxValue: 1_000_000 },
      takeaway:
        'And costs sit underneath all of it. A sizing plan that ignores the breakeven move is optimising a number that was never yours to begin with.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The practical rule',
      md:
        'Decide the **rupee amount** you are willing to lose on a trade before you decide the quantity. Then let the stop distance determine the size: `quantity = risk budget ÷ (entry − stop)`.\n\nIf that formula returns a quantity you find disappointingly small, the correct response is a smaller trade, **not** a wider stop.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A trader with a strong 65% win rate sizes at 20% per trade, reasoning the edge is large enough to make aggressive sizing safe. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Reasonable — a strong enough edge makes any bet size safe',
              'Not fully reasonable — a losing streak is rarer but still just as damaging in size when it happens',
              'Unreasonable — win rate has no bearing on ruin risk at all',
            ],
            correct:
              'Not fully reasonable — a losing streak is rarer but still just as damaging in size when it happens',
          },
          explanation:
            'Not fully reasonable. A stronger edge lowers the chance of a bad streak but does not change what a 20% bet size does to the account once one occurs.',
        },
        {
          prompt:
            'Your account is ₹2,00,000 and you will risk 1% on a trade. Entry is ₹1,400 and your stop is ₹1,380. How many shares?',
          type: 'compute',
          spec: { metric: 'literal', tolerance: 2, unit: 'shares', value: 100 },
          explanation:
            '₹2,00,000 × 1% = ₹2,000 of risk, divided by ₹20 of stop distance, is 100 shares. Note what this does NOT depend on: how confident you feel, how much margin the broker will extend you, or how much capital you happen to have spare. The stop sets the size.',
        },
        {
          prompt:
            'Same account, same 1% risk, but you want to trade a NIFTY future where one lot risks ₹6,500 at your stop. Decide what to do.',
          type: 'decision',
          spec: {
            options: ['Take one lot anyway', 'Widen the stop until one lot fits the budget', 'Do not take the trade'],
            correct: 'Do not take the trade',
          },
          explanation:
            'Do not take it. One lot risks 3.25% of the account, over three times your stated budget. Widening the stop does not reduce that risk. It only moves the point at which you admit it. The honest conclusion is that this instrument is too large for this account today. That is not a failure; it is the sizing rule doing its job.',
        },
        {
          prompt:
            'Build the protective stop for a long position in RELIANCE entered at ₹1,400, risking no more than ₹70 per share, using the order type that guarantees an exit.',
          type: 'construct',
          spec: {
            instrument: { symbol: 'RELIANCE.NS', market: 'IN', tickSize: 0.05 },
            lastPrice: 1400,
            availableCash: 200_000,
            require: { side: 'sell', type: 'SL-M', triggerBetween: [1330, 1395], maxRiskPerUnit: 70 },
          },
          explanation:
            'A SELL SL-M with a trigger between ₹1,330 and ₹1,395. SL-M rather than SL. A stop-limit can trigger and then fail to fill, in exactly the fast market you needed it in. An SL-M gets you out at a bad price, which beats not getting out. The trigger must also be a multiple of the ₹0.05 tick, or the exchange rejects it outright.',
        },
      ],
    },
  ],
};

export default lesson;
