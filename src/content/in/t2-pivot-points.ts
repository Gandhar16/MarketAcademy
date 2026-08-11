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
    'Compute R3 and S3, and read what the width of the whole grid implies about today',
    'Explain why S1 always sits at or below the pivot, algebraically',
    'Explain where this formula actually comes from, and why it resets every single day',
    'Decide what should determine whether a pivot level is worth trusting on a given day',
  ],
  prerequisites: ['in-t2-vwap-volume-profile'],
  estimatedMinutes: 16,
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
      kind: 'callout',
      tone: 'insight',
      title: 'Where this actually comes from, and how it is drawn',
      md:
        'This exact formula predates screens. Floor traders on open-outcry exchanges had no live charting software between trades. They needed a fixed set of reference numbers they could compute once, by hand, before the bell, and carry in their head all session. "Floor trader pivots" is still the name for this grid.\n\nThat history explains something about HOW it gets used today: a pivot grid is not dragged onto a chart the way a trendline or a Fibonacci grid is. It is computed once, before the session opens, and drawn as five flat horizontal rays across the intraday chart — valid for exactly one session. Tomorrow it is thrown away and recomputed from a new prior day, never carried forward or adjusted by eye.',
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
      kind: 'example',
      title: 'R3, S3, and what the width of the whole grid tells you',
      setup:
        'Two different stocks, both closing at ₹500. Stock A had a tight prior day: high ₹504, low ₹497. Stock B had a wide prior day: high ₹525, low ₹478.',
      steps: [
        { label: 'Stock A — R3 = high + 2(P − low)', detail: 'P = 500.33, so 504 + 2(3.33)', compute: { fn: 'literal', value: 510.67 } },
        { label: 'Stock A — S3 = low − 2(high − P)', detail: '497 − 2(3.67)', compute: { fn: 'literal', value: 489.67 } },
        { label: 'Stock B — R3 = high + 2(P − low)', detail: 'P = 501, so 525 + 2(23)', compute: { fn: 'literal', value: 571 } },
        { label: 'Stock B — S3 = low − 2(high − P)', detail: '478 − 2(24)', compute: { fn: 'literal', value: 430 } },
      ],
      conclusion:
        'Both stocks share nearly the same pivot, but Stock A\'s entire R3–S3 grid spans ₹21 and Stock B\'s spans ₹141. The width comes straight from yesterday\'s range, and it is read as a real signal. A tight prior day gives a compressed grid. A session breaking cleanly out of it can mean more than the same move would on Stock B\'s already-wide grid.',
    },
    {
      kind: 'predict',
      prompt: 'A stock gaps up at the open and prints its first trade of the day ABOVE R1. What does that most commonly signal to a desk watching the pivot grid?',
      options: [
        'A data error — price cannot open above a resistance level',
        'Strong opening demand, often read as a bullish session, with the pivot itself as possible support on a pullback',
        'Nothing — where a stock opens relative to the grid carries no information',
      ],
      correct: 1,
      reveal:
        'Strong opening demand. Floor-trader convention reads where the FIRST trade lands relative to the grid as information in itself, not just where price wanders later. Opening above R1 is a strong bullish tell, opening below S1 a strong bearish one, and opening between S1 and R1 an ordinary, unremarkable start. None of this is a rule the market obeys — it is a read on what today\'s order flow already showed before the first candle even finished forming.',
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
          prompt: 'Same day as above (high ₹340, low ₹320, close ₹332, P = 330.67). What is S3?',
          type: 'compute',
          spec: { metric: 'literal', value: 301.33, tolerance: 1, unit: '₹' },
          explanation:
            'S3 = low − 2(high − P) = 320 − 2(340 − 330.67) = 320 − 18.67 = 301.33. The formula is fixed arithmetic every time — the only real work is reading off the right three prior-day numbers.',
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
