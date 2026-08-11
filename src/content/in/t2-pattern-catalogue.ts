import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — the ten named patterns, tested
 *
 * "Does this pattern actually work?" taught the METHOD: take a named pattern,
 * detect every occurrence in real bars, and compare what happened next against
 * what happens on an ordinary day. This lesson applies that method to the whole
 * catalogue at once, which is a different experience entirely — one pattern
 * failing is a curiosity, ten failing together is an argument.
 *
 * WHY A CATALOGUE LESSON AND NOT TEN LESSONS
 *
 * Because the finding is about the SET. Every one of these has a confident
 * folklore attached, the folklores contradict each other in places, and when
 * you rank them by measured edge the ordering barely resembles the ordering by
 * how often they are taught. That is only visible with all ten on one screen.
 *
 * WHAT THIS LESSON IS NOT
 *
 * It is not "technical analysis does not work". Some of these do carry a small
 * measured edge on some symbols over some horizons, and the scanner will show
 * that honestly when it happens. The claim is narrower and more useful: the
 * NAME is not evidence, and the only thing that settles it is the count.
 *
 * Every number a learner sees here is computed from real bars at render time.
 * There is no table of results in this file, deliberately — a hardcoded figure
 * would be a claim about the world that quietly rots.
 */
export const lesson: Lesson = {
  id: 'in-t2-pattern-catalogue',
  tier: 'T2',
  market: 'IN',
  title: 'The ten named patterns, all tested at once',
  summary:
    'Engulfing, hammer, doji, gaps, inside bars, three up days. Every pattern with a name and a story — measured against real bars, ranked, and mostly disappointing.',
  plainSummary:
    'People give names to shapes on a price chart and say what each one predicts. This tests all ten of the common ones against real history so you can see for yourself.',
  objectives: [
    'Describe what each of the ten common patterns looks like on a chart',
    'Compare a pattern’s measured outcome against an ordinary day on the same symbol',
    'Explain why a pattern with 40 occurrences proves less than one with 400',
    'Decide whether a stated pattern claim is supported by the numbers in front of you',
  ],
  prerequisites: ['in-t2-does-this-pattern-work'],
  estimatedMinutes: 18,
  introduces: ['candle', 'ohlc', 'gap', 'base-rate', 'statistical-significance', 'volume', 'support', 'resistance'],
  skills: ['pattern-recognition', 'base-rates', 'evidence'],
  blocks: [
    {
      kind: 'widget',
      component: 'PatternScanner',
      props: { symbol: 'RELIANCE.NS' },
      takeaway:
        'Every named pattern on one screen, ranked by measured edge on real bars. Before you read anything below, find the best one and the worst one.',
    },
    {
      kind: 'predict',
      prompt:
        'Ten patterns, each with a confident story attached. Across a real symbol and a five-day hold, how many would you expect to show a large, obvious edge?',
      options: ['Most of them — that is why they are famous', 'About half', 'One or two at best, and small'],
      correct: 2,
      reveal:
        'One or two at best, and small. That is not a claim that charts are useless. It is a claim about how much a NAME is worth as evidence, which is almost nothing. These shapes are famous because they are easy to see and easy to describe, not because anybody counted. When you do count, most of them produce outcomes that look like an ordinary day on the same symbol. The handful that do not are worth attention — and the only way to tell which is which is the scanner above, not the story.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'CandleAnatomy',
      props: {},
      caption:
        'Every pattern below is a rule about these four numbers and their relationship to the bars beside them. Nothing more mysterious than that is going on.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The ten, and what each one claims',
      md:
        '**Reversal shapes.** *Bullish engulfing* — a big up bar swallowing the previous down bar, said to mark a turn upward. *Bearish engulfing* — the mirror. *Hammer* — a long lower wick, said to show buyers rejecting lower prices. *Shooting star* — a long upper wick, the mirror.\n\n**Indecision.** *Doji* — open and close almost equal, said to mean the market cannot decide, and that indecision precedes a turn.\n\n**Continuation.** *Gap up* and *gap down* — an open beyond yesterday’s range, said to keep running. *Inside bar* — a bar entirely within the previous one, said to be compression before a breakout. *Three up days* and *three down days* — momentum, or exhaustion, depending on who is talking.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Notice the contradictions',
      md:
        'Three down days is described as **capitulation, so a bounce is due**. Three up days is described as **momentum, so it continues**.\n\nThose are opposite rules applied to the same shape in opposite directions, and both are taught confidently by the same people.\n\nA framework that explains a rise by momentum and a fall by exhaustion explains nothing at all — it has an answer ready whatever happens. That is the property to watch for, and it is far more common than being wrong.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'bullish-engulfing', symbol: 'RELIANCE.NS' },
      takeaway:
        'One pattern in detail. Read three numbers: how often it fired, what happened next, and what happens on an ordinary day. The third one is the one people skip.',
    },
    {
      kind: 'example',
      title: 'Reading a result honestly',
      setup:
        'Suppose the scanner reports a pattern that fired 38 times on a symbol, and after those 38 occurrences the price was higher five days later 60% of the time. On the same symbol, an ordinary day is followed by a higher price 53% of the time. Here is what that is worth.',
      steps: [
        {
          label: 'The headline claim',
          detail: 'Right 60% of the time sounds like a real edge',
          value: '60%',
        },
        {
          label: 'What an ordinary day already does',
          detail: 'The number that has to be beaten, not zero',
          value: '53%',
        },
        {
          label: 'The actual edge',
          detail: '60 minus 53. This is the whole finding',
          compute: { fn: 'literal', value: 7 },
        },
        {
          label: 'How many extra wins that is, over 38 tries',
          detail: '7% of 38 — the entire evidence, in trades',
          compute: { fn: 'percentOf', value: 38, percent: 7 },
        },
        {
          label: 'Costs on a round trip, as a share of a 2% move',
          detail: 'And every one of those trades pays charges',
          compute: { fn: 'roundTripPercent', product: 'intraday', price: 1400, quantity: 71 },
        },
      ],
      conclusion:
        'The whole edge is under three trades out of 38, and it has to survive costs. That is not a strategy, it is a rounding error with a name.',
    },
    {
      kind: 'predict',
      prompt:
        'Same pattern, same 60% against a 53% ordinary day — but now it fired 900 times instead of 38. Work out what changed before you look.',
      options: [
        'Nothing — the edge is still 7%',
        'The edge is the same size, but now there is real evidence it is not noise',
        'The edge gets bigger with more occurrences',
      ],
      correct: 1,
      reveal:
        'Same size, far better evidence. The edge is a property of the pattern; the sample size tells you whether to believe the measurement. Seven percentage points across 38 tries could easily be luck — flip 38 coins and you will often get 60% heads. Across 900 tries the same gap is very unlikely to be chance. This is the single most useful habit on the scanner: read the occurrence count BEFORE the edge. A spectacular edge on 12 occurrences is a story about 12 days and nothing more.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'candle-sprint',
      config: {},
    },
    {
      kind: 'widget',
      component: 'PatternScanner',
      props: { symbol: 'TCS.NS' },
      takeaway:
        'The same ten on a different symbol. Compare the ranking against the first scanner — if a pattern were a real law of markets, the order would hold.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A pattern is followed by a rise 58% of the time. Ordinary days on the same symbol rise 54% of the time. What is the edge, in percentage points?',
          type: 'compute',
          spec: { metric: 'literal', value: 4, tolerance: 0.2, unit: 'points' },
          explanation:
            '58 − 54 = 4 points. The comparison against an ordinary day is the entire test, and it is the step almost every pattern tutorial skips. A market that rises on 54% of days makes any rule look like it works, because most rules will be right slightly more often than not simply by pointing upward.',
        },
        {
          prompt:
            'Sort each finding by whether it is strong enough to act on.',
          type: 'classify',
          spec: {
            categories: ['Worth acting on', 'Not yet evidence'],
            items: [
              { label: '5-point edge over 800 occurrences', category: 'Worth acting on' },
              { label: '22-point edge over 9 occurrences', category: 'Not yet evidence' },
              { label: '1-point edge over 2,000 occurrences, costs are 0.2%', category: 'Not yet evidence' },
              { label: '6-point edge holding on four different symbols', category: 'Worth acting on' },
            ],
          },
          explanation:
            'Two things have to be true at once: the edge has to be large enough to survive costs, and the sample has to be large enough to believe. The 22-point result is the seductive one — a huge number built on nine days, which is a coincidence with a name. The 1-point result is real and is smaller than what it costs to trade, which makes it a fact about the market and not an opportunity.',
        },
        {
          prompt:
            'The scanner shows a pattern with a strong edge on one symbol and nothing on three others. Decide what to conclude.',
          type: 'decision',
          spec: {
            options: [
              'The pattern works, and the other symbols are not suitable for it',
              'It is most likely a coincidence in one symbol’s history',
              'Trade it on that symbol only',
            ],
            correct: 'It is most likely a coincidence in one symbol’s history',
          },
          explanation:
            'Most likely a coincidence. Test any rule on enough symbols and one of them will look excellent by chance — that is what testing many things guarantees, not evidence that you found the right one. The first and third answers are the same mistake with different confidence: both invent a reason afterwards for a result that arrived before the reason did. A finding worth acting on shows up in several places, because a real mechanism does not care which company it is.',
        },
      ],
    },
  ],
};

export default lesson;
