import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — pivot points
 *
 * Pivot points are arithmetic on yesterday's OHLC, nothing more — and that is
 * precisely the point worth making explicit. The formula is fixed, and it
 * produces a five-level grid that is, in substance, the same idea as the
 * support/resistance lesson two lessons earlier in this stage: a band where
 * price might pause. The difference is only that it is computed rather than
 * drawn by eye, which means it can genuinely be checked with `compute`.
 */
export const lesson: Lesson = {
  id: 'in-t2-pivot-points',
  tier: 'T2',
  market: 'IN',
  title: 'Pivot points: the levels every intraday desk starts the day with',
  summary:
    'Five levels, computed from yesterday’s high, low and close before a single trade happens today. The formula is fixed. What it actually is, underneath, is support and resistance wearing arithmetic.',
  plainSummary:
    'Before the market opens, traders compute a set of price levels from yesterday’s trading. This shows the formula, what the levels actually mean, and why so many people watch the same ones.',
  objectives: [
    'Compute a pivot, R1, S1, R2 and S2 from a prior day’s OHLC',
    'Explain why S1 always sits at or below the pivot, algebraically',
    'Explain why the grid is really a formalised version of support and resistance',
    'Decide what should determine whether a pivot level is worth trusting on a given day',
  ],
  prerequisites: ['in-t2-vwap-volume-profile'],
  estimatedMinutes: 13,
  introduces: ['pivot-point'],
  skills: ['pivot-points', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Before the market opens, a trader computes today’s pivot point from just three numbers: yesterday’s high, low and close. What is that pivot point actually claiming to be?',
      options: [
        'A prediction of today’s average price',
        'A rough proxy for where support and resistance might sit, before a single trade has happened today',
        'The exact price the stock will open at',
      ],
      correct: 1,
      reveal:
        'A proxy, computed entirely from data that already happened. There is no new information in a pivot point — it is yesterday’s high, low and close, repackaged by a formula. That sounds like it should not matter. It matters anyway, for the same reason a Fibonacci grid can. Enough desks compute the identical five numbers off the identical prior day that the level becomes a place where orders genuinely cluster.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'One formula, five levels',
      md:
        '**Pivot (P)** = (high + low + close) ÷ 3.\n\n**R1** = 2P − low. **S1** = 2P − high.\n\n**R2** = P + (high − low). **S2** = P − (high − low).\n\nEvery level is built from the same three prior-day numbers. Nothing here comes from today at all — the grid exists before the opening bell rings.',
    },
    {
      kind: 'example',
      title: 'Computing the full grid',
      setup: 'Yesterday: high ₹512, low ₹498, close ₹505.',
      steps: [
        { label: 'Pivot (P)', detail: '(512 + 498 + 505) ÷ 3', compute: { fn: 'literal', value: 505 } },
        { label: 'Resistance 1 (R1)', detail: '2P − low', compute: { fn: 'literal', value: 512 } },
        { label: 'Support 1 (S1)', detail: '2P − high', compute: { fn: 'literal', value: 498 } },
        { label: 'Resistance 2 (R2)', detail: 'P + (high − low)', compute: { fn: 'literal', value: 519 } },
        { label: 'Support 2 (S2)', detail: 'P − (high − low)', compute: { fn: 'literal', value: 491 } },
      ],
      conclusion:
        'Every level came from three numbers already public before the session opened. That is exactly why it matters — many desks are computing the identical five numbers off the identical prior day.',
    },
    {
      kind: 'predict',
      prompt:
        'Today’s high is ₹520 and low is ₹500, closing at ₹515. Without recomputing from scratch, is S1 above or below today’s pivot?',
      options: [
        'Always at or below the pivot, because S1 = 2P − high and high is never less than P',
        'Always above the pivot',
        'It depends on whether the stock is trending up or down',
      ],
      correct: 0,
      reveal:
        'Always at or below it, and this is true by construction, not by observation. The pivot is the average of high, low and close, so the high can never be smaller than it. Twice the pivot minus the high can therefore never exceed the pivot itself. This is one of the few claims in this stage that is not a judgement call — it follows from the formula, every time.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'candle-sprint',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'The grid is support and resistance, formalised',
      md:
        'A pivot level is not a different idea from the zones two lessons ago — it is the same claim, computed instead of drawn.\n\nThe same caution applies. A level can be probed and consumed. Price closing straight through R1 is not a broken formula — it is the same thing that happens to any support or resistance zone once enough size behind it has traded.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'Yesterday: high ₹340, low ₹320, close ₹332. What is R1?',
          type: 'compute',
          spec: { metric: 'literal', value: 341.33, tolerance: 1, unit: '₹' },
          explanation:
            'P = (340 + 320 + 332) ÷ 3 = 330.67. R1 = (2 × 330.67) − 320 = 341.33. Two steps, both fixed arithmetic — the same two steps every single day, on every stock.',
        },
        {
          prompt: 'Classify each statement about pivot points.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'Pivot is the average of yesterday’s high, low and close', category: 'Supported by the mechanism' },
              { label: 'S1 always sits at or below the pivot', category: 'Supported by the mechanism' },
              { label: 'Price is guaranteed to reverse at R1', category: 'Folklore' },
              { label: 'Many desks compute the identical levels off the identical prior day', category: 'Supported by the mechanism' },
            ],
          },
          explanation:
            'The "guaranteed to reverse" claim is the one to watch for anywhere in this stage. A level being widely watched can make it more likely to matter a little. It never makes it certain, and a formula producing an exact-looking number does not change that.',
        },
        {
          prompt: 'Price approaches R1 for the first time today. What should determine whether you treat it seriously?',
          type: 'decision',
          spec: {
            options: [
              'The fact that it is labelled R1',
              'Whether price actually shows resistance there, the same as any other support or resistance zone',
              'Nothing — pivot levels are guaranteed to hold',
            ],
            correct: 'Whether price actually shows resistance there, the same as any other support or resistance zone',
          },
          explanation:
            'The live behaviour, not the label. R1 is a candidate level, produced by a formula rather than by eye. A candidate is all it is, and the same test from the support/resistance lesson applies: watch what actually happens when price gets there.',
        },
      ],
    },
  ],
};

export default lesson;
