import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — the three-candle patterns
 *
 * Every other lesson in this stage had to explain why it does NOT report a
 * base rate — trendlines, Fibonacci grids and named chart shapes are drawn by
 * eye and cannot be scored the way a boolean rule can. This lesson is the
 * exception on purpose. Morning star, evening star, three white soldiers,
 * three black crows and both haramis are exactly the kind of few-bar rule the
 * ten-pattern catalogue already tested — so they get the same treatment:
 * real detectors in `patterns.ts`, scored against real bars, through the same
 * `PatternScanner` and `PatternBaseRate` widgets.
 */
export const lesson: Lesson = {
  id: 'in-t2-candlestick-patterns-2',
  tier: 'T2',
  market: 'IN',
  title: 'Evening star, morning star, and the three-candle patterns',
  summary:
    'Six more named patterns the ten-pattern catalogue left out, each needing three specific candles to line up in sequence. Tested the same honest way: real bars, a real base rate, and the occurrence count read first.',
  plainSummary:
    'Some price shapes need three trading periods in a row to match, not just one. This tests six of the best-known ones against real history, the same way an earlier lesson did for single-period shapes.',
  objectives: [
    'Describe the morning star, evening star, three white soldiers, three black crows and harami shapes',
    'Explain why a three-candle pattern occurs less often than a one-candle pattern by construction',
    'Read a pattern’s occurrence count before trusting its measured edge',
    'Decide whether a stated pattern claim survives its own sample size',
  ],
  prerequisites: ['in-t2-pattern-catalogue', 'in-t2-elliott-wave'],
  estimatedMinutes: 16,
  introduces: [],
  skills: ['pattern-recognition', 'base-rates', 'evidence'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A morning star needs three separate candles to all line up: a big down day, a small indecisive day, then a big up day. Compared to a single-candle pattern like the hammer, would you expect it to fire MORE or FEWER times over the same five years?',
      options: [
        'More often — three candles give it three chances to fire instead of one',
        'Fewer — every one of the three specific conditions has to be true at the same time',
        'About the same either way',
      ],
      correct: 1,
      reveal:
        'Fewer, and by a lot. Each extra condition a pattern requires shrinks the pool of bars that can possibly qualify, and it shrinks it multiplicatively, not by addition. A hammer needs one candle to look a certain way. A morning star needs three candles in a row to each look a certain way relative to the others. That makes it intrinsically rarer, which matters for the base-rate test this whole stage relies on. A rarer pattern needs the same 30-occurrence floor to say anything at all, and reaches it far less often.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Six more patterns, same method',
      md:
        '**Morning star** and **evening star** — a big candle, a small one, then a big candle back the other way, read as a reversal.\n\n**Three white soldiers** and **three black crows** — three solid same-direction candles, each opening inside the previous body and closing further along. Read as confirmation of a new trend rather than three ordinary up or down days.\n\n**Bullish harami** and **bearish harami** — a small candle tucked entirely inside the body of a large one before it, read as the opposite of engulfing: momentum stalling rather than reversing hard.',
    },
    {
      kind: 'figure',
      figure: 'CandlestickTrioFigure',
      props: { pattern: 'morning-star' },
      caption:
        'A big down day, a small indecisive day, then a big up day closing back above the midpoint of the first candle’s body.',
    },
    {
      kind: 'example',
      title: 'Reading a three-candle result honestly',
      setup:
        'Suppose the scanner reports bullish harami fired 54 times on a symbol, followed by a higher price five days later 57% of the time. On the same symbol, an ordinary day is followed by a higher price 55% of the time.',
      steps: [
        {
          label: 'The headline hit rate',
          detail: 'Right 57% of the time, after a bullish harami',
          value: '57%',
        },
        {
          label: 'What an ordinary day already does',
          detail: 'The number that has to be beaten, not zero',
          value: '55%',
        },
        {
          label: 'The actual edge',
          detail: '57 minus 55 — this is the entire finding',
          compute: { fn: 'literal', value: 2 },
        },
        {
          label: 'Is 54 occurrences enough to trust that gap',
          detail: 'Above the 30-occurrence floor, but the widget’s z-score is what actually settles it',
          value: 'check the widget',
        },
      ],
      conclusion:
        'Two points of edge on a middling sample is exactly the number that needs a z-score rather than an eyeball, which is what the widgets below compute from real bars.',
    },
    {
      kind: 'predict',
      prompt:
        'Three white soldiers requires each candle to open inside the previous candle’s body and close further along, not just three up days in a row. What does that extra condition mainly rule out?',
      options: [
        'Nothing — it is identical to three-up-days, already tested earlier',
        'Three up days built from a single large gap-up jump rather than steady buying',
        'Down days',
      ],
      correct: 1,
      reveal:
        'A large gap up. Three-up-days, tested earlier in this course, only checks that each close is higher than the open. A stock could gap up hugely on day one and barely move afterward and still qualify. Requiring each open to sit inside the previous candle’s body filters that out, keeping only sequences that actually climbed steadily rather than jumped once and drifted.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PatternScanner',
      props: { symbol: 'RELIANCE.NS' },
      takeaway:
        'All sixteen patterns now, old and new, ranked by measured edge. Find where morning star, evening star, three white soldiers, three black crows and both haramis land — and notice their occurrence counts next to the older ten.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'evening-star', symbol: 'TCS.NS' },
      takeaway:
        'One of the six new patterns, in detail. Check the occurrence count before the edge — three-candle patterns are rarer by construction, exactly as the first predict explained.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Rare does not mean special',
      md:
        'A pattern that needs three specific candles to align can easily produce fewer than 30 occurrences over five years on a single stock. The verdict logic labels that noise, regardless of how large the apparent edge looks.\n\nA huge edge on a handful of occurrences is not a stronger finding than a small edge on hundreds. It is a smaller sample dressed up as a bigger story, and the widget above will tell you which one you are looking at if you read the occurrence count first.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A pattern fires 40 times and is followed by a rise 62% of the time. Ordinary days on the same symbol rise 55% of the time. What is the edge, in percentage points?',
          type: 'compute',
          spec: { metric: 'literal', value: 7, tolerance: 0.3, unit: 'points' },
          explanation:
            '62 − 55 = 7 points. The same subtraction as every base-rate check in this course, whatever the pattern is built from.',
        },
        {
          prompt: 'Classify each statement about the three-candle patterns.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'A three-candle pattern needs more simultaneous conditions than a one-candle pattern', category: 'Supported by the mechanism' },
              { label: 'That makes it intrinsically rarer, all else equal', category: 'Supported by the mechanism' },
              { label: 'A rare pattern with a huge apparent edge is automatically meaningful', category: 'Folklore' },
              { label: 'The 30-occurrence floor applies no matter how many candles the pattern needs', category: 'Supported by the mechanism' },
            ],
          },
          explanation:
            'The sample-size floor does not care what the pattern is built from. A three-candle rule and a one-candle rule are judged by the exact same 30-occurrence threshold, which is precisely why rarer patterns fail that threshold far more often.',
        },
        {
          prompt: 'The scanner shows evening star with a 25-point edge but only 11 occurrences on one symbol. What should you conclude?',
          type: 'decision',
          spec: {
            options: [
              'A 25-point edge that large must be real',
              'Too few occurrences to conclude anything, regardless of the edge size',
              'Evening star is proven better than morning star',
            ],
            correct: 'Too few occurrences to conclude anything, regardless of the edge size',
          },
          explanation:
            'Eleven occurrences is well under the floor this course has used from the very first pattern lesson. A spectacular edge on eleven days is a story about eleven days, and the size of the edge does not make the sample any bigger.',
        },
      ],
    },
  ],
};

export default lesson;
