import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — reading candles honestly
 *
 * Every course teaches candle shapes. Almost none of them mention that a candle
 * is a SUMMARY, that the summary discards the path the price took, and that two
 * completely different sessions can produce an identical candle.
 *
 * That omission is what makes people believe a shape predicts something. This
 * lesson teaches the vocabulary properly and then immediately draws the line
 * between description and prediction — which the T2 lesson then tests with real
 * base rates.
 */
export const lesson: Lesson = {
  id: 'in-t1-reading-candles',
  tier: 'T1',
  market: 'IN',
  title: 'What a candle does and does not tell you',
  summary:
    'Four numbers, one shape, and a lot of information thrown away. Learn to read candles precisely — and to notice what the summary hides.',
  plainSummary:
    'Those coloured bars on a stock chart are simpler than they look — and they hide more than most people realise. This shows what one actually records, and what it quietly throws away.',
  objectives: [
    'Name the four prices a candle encodes and locate them on the shape',
    'Explain what information the summary discards',
    'Say why two very different sessions can draw an identical candle',
    'Separate what a candle describes from what people claim it predicts',
  ],
  prerequisites: ['in-t0-order-book'],
  estimatedMinutes: 13,
  introduces: ['candle', 'ohlc', 'volume'],
  skills: ['candles', 'chart-reading'],
  blocks: [
    {
      kind: 'figure',
      figure: 'CandleAnatomy',
      props: { interactive: true },
      caption:
        'Drag the four handles. Every candle you will ever see is these four numbers and nothing else — try dragging the close below the open and watch it flip colour.',
    },
    {
      kind: 'predict',
      prompt:
        'A daily candle opens at ₹100, closes at ₹104, with a high of ₹105 and a low of ₹99. During that day, how many times did the price touch ₹102?',
      options: ['Once', 'At least twice', 'Impossible to tell from the candle'],
      correct: 2,
      reveal:
        'Impossible to tell. The candle records four moments — first trade, highest, lowest, last trade — and throws away everything in between. The price might have gone straight up. It might have spiked to ₹105, collapsed to ₹99, and ground back to ₹104. It might have crossed ₹102 forty times. All three sessions draw the IDENTICAL candle, and they are completely different days for anyone who held a position through them. This is the most important thing to understand about candles, and it is almost never said. A candle is a summary. A summary is a set of things deliberately thrown away.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'CandlePathExplainer',
      props: {},
      takeaway:
        'Step through it once. Two completely different paths, one identical candle — the candle genuinely cannot tell them apart.',
    },
    {
      kind: 'example',
      title: 'Two very different days, one identical candle',
      setup:
        'Both of these sessions produce a candle that opens at 100, closes at 104, highs at 105 and lows at 99. On a chart they are indistinguishable. For someone holding a position with a stop at 99.50, they are not remotely the same day.',
      steps: [
        {
          label: 'Session A: a calm grind upward',
          detail: 'Opens at 100, drifts to 99 in the first hour, then climbs steadily and closes near the high',
          value: 'stop survives',
        },
        {
          label: 'Session B: a violent whipsaw',
          detail: 'Opens at 100, spikes to 105 in ten minutes, crashes to 99 by lunch, recovers all afternoon',
          value: 'stop is hit',
        },
        {
          label: 'The candle both of them draw',
          detail: 'Open 100, high 105, low 99, close 104 — identical in every respect',
          value: 'the same',
        },
        {
          label: 'Range as a share of the close',
          detail: 'The candle does tell you the day was volatile: (105 − 99) ÷ 104',
          compute: { fn: 'spanPercent', high: 105, low: 99, reference: 104, dp: 1 },
        },
        {
          label: 'What it cannot tell you',
          detail: 'The ORDER those prices arrived in, which is the only thing that decided whether you were stopped out',
          value: 'unknowable',
        },
      ],
      conclusion:
        'A candle tells you the range and the direction. It cannot tell you the path — and the path is what actually happens to a position.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Read the wick, not the folklore',
      md:
        'A long lower wick is a real, factual statement: **price traded down there and did not stay**. Someone was willing to sell at that level and buyers absorbed it.\n\nThat is a description worth having. It becomes folklore the moment somebody tells you it *predicts* a bounce — which is a claim about the future, and one you can test rather than believe.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'hammer', symbol: 'RELIANCE.NS' },
      takeaway:
        'The hammer is the most-taught reversal shape there is. Here is what it was actually worth on real Indian bars — check a few different symbols before you decide what you think.',
    },
    {
      kind: 'predict',
      prompt:
        'You switch a chart from daily candles to weekly. The candles change shape completely. What happened to the underlying market?',
      options: ['It became less volatile', 'Nothing — only the summary changed', 'The patterns became more reliable'],
      correct: 1,
      reveal:
        'Nothing happened to the market. You changed the window over which the four numbers are collected, and a different summary of identical data produces a different picture. This is worth sitting with, because it exposes something uncomfortable: a "bullish engulfing on the daily" may be nothing at all on the weekly and something else again on the hourly. If a pattern were a real property of the market, it would not appear and disappear depending on which timeframe you happened to open. Timeframe is a choice you make, not a fact about the world.',
      askWhy: false,
    },
    {
      kind: 'predict',
      prompt:
        'A candle opens at ₹200 and closes at ₹201 — almost unchanged — but its high is ₹215 and its low is ₹190, a huge range. What can you honestly say happened?',
      options: [
        'Nothing happened that day — it was a quiet session',
        'The session opened and closed near the same level, but traded through a very wide range in between',
        'Buyers and sellers agreed on ₹200 all day',
      ],
      correct: 1,
      reveal:
        'The second. Open and close sitting close together tells you almost nothing about how calm the session actually was. The ₹25 range shows large moves happened and simply cancelled out by the close. A small body on top of a huge range is one of the most misleading shapes to read casually.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'candle-sprint',
      config: {},
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A candle opens at ₹500, closes at ₹502, highs at ₹540 and lows at ₹470. Compute the range as a percentage of the close.',
          type: 'compute',
          spec: { metric: 'literal', value: 13.94, tolerance: 0.3, unit: '%' },
          explanation:
            '(540 − 470) ÷ 502 ≈ 13.9%. A tiny body — open and close only ₹2 apart — sitting on top of a range this wide is exactly the shape this lesson warns about. A small body does not mean a quiet session.',
        },
        {
          prompt:
            'A candle has a tiny body and a very long lower wick, appearing after a three-day decline. Decide what you can honestly state about it.',
          type: 'decision',
          spec: {
            options: [
              'Price fell during the session and closed near where it opened',
              'Buyers have taken control and a reversal is likely',
              'It is a hammer, so the downtrend is over',
            ],
            correct: 'Price fell during the session and closed near where it opened',
          },
          explanation:
            'Only the first is a statement about what happened; the other two are predictions dressed as observations. You can say sellers pushed price down and did not hold it — that is in the data. You cannot say what happens next, and the base-rate widget above shows how weak the hammer’s record actually is on real Indian bars. Describing precisely and predicting cautiously is the whole discipline.',
        },
        {
          prompt:
            'Classify each statement by whether the candle actually supports it.',
          type: 'classify',
          spec: {
            categories: ['The candle shows this', 'The candle cannot show this'],
            items: [
              { label: 'The highest price traded during the period', category: 'The candle shows this' },
              { label: 'Whether the high came before or after the low', category: 'The candle cannot show this' },
              { label: 'Whether buyers or sellers finished ahead', category: 'The candle shows this' },
              { label: 'How many shares changed hands', category: 'The candle cannot show this' },
              { label: 'Whether your stop at the midpoint would have been hit', category: 'The candle cannot show this' },
            ],
          },
          explanation:
            'A candle carries four prices and a direction. It carries no path, no volume, and no timing within the period. That is why volume is plotted separately. It is also why backtests that assume "the high came first" are quietly wrong about half the time. That last item is the one that costs money: whether a stop inside the range was hit is genuinely unknowable from daily bars alone.',
        },
        {
          prompt:
            'A daily candle opens at ₹250, highs at ₹262, lows at ₹247 and closes at ₹259. Compute the range as a percentage of the close.',
          type: 'compute',
          spec: {
            metric: 'literal',
            value: 5.79,
            tolerance: 0.15,
            unit: '%',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 250,
            quantity: 1,
          },
          explanation:
            '(262 − 247) ÷ 259 = 5.79%. Range relative to price is the most useful single number a candle gives you, and almost nobody computes it. It tells you how far a position could have swung against you inside one session. That is exactly what you need before choosing a stop distance. A 0.5% stop on a stock that routinely ranges 6% a day is not a risk control, it is a coin flip with extra steps.',
        },
      ],
    },
  ],
};

export default lesson;
