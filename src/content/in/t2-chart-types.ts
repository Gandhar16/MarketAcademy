import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Reading a chart honestly — chart types and what one bar contains
 *
 * Every lesson after this one assumes the reader already knows what they are
 * looking at on screen. This is the lesson that makes that assumption safe:
 * candlestick vs OHLC bar vs Heikin-Ashi vs hollow candles vs a line chart
 * are five different ENCODINGS of the same underlying prices, and each one
 * hides or reveals something the others do not. It also makes explicit what
 * `in-t1-reading-candles` only implied — that the interval you pick decides
 * how much real trading gets compressed into the shape you are looking at.
 */
export const lesson: Lesson = {
  id: 'in-t2-chart-types',
  tier: 'T2',
  market: 'IN',
  title: 'Chart types, and what one bar actually contains',
  summary:
    'Candlestick, OHLC bar, Heikin-Ashi, hollow candle, line — five ways of drawing the same real prices, each hiding or revealing something different. And what a single bar compresses changes completely with the interval you pick.',
  plainSummary:
    'The same price history can be drawn on screen in several different ways, and one shape on the screen can cover a minute or a month depending on a setting. This shows what each drawing style actually shows you, and how a setting like that changes what you are looking at.',
  objectives: [
    'Compare candlestick, OHLC bar, Heikin-Ashi, hollow candle and line charts on the same real data',
    'Explain why Heikin-Ashi prices are not real prices you could have traded at',
    'State how much real trading a bar represents at a given interval',
    'Choose a sensible interval for a given holding horizon',
  ],
  prerequisites: ['in-t1-reading-candles'],
  estimatedMinutes: 15,
  introduces: ['ohlc-bar-chart', 'heikin-ashi', 'hollow-candle'],
  skills: ['chart-reading', 'chart-types'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A daily candle summarises one NSE session — 9:15 to 15:30, roughly six and a quarter hours of trading. Switch that same chart to weekly candles instead. How much trading does one bar now represent?',
      options: [
        'The same six hours, just relabelled',
        'Up to five trading days, compressed into one bar',
        'Exactly seven calendar days, since a week has seven days',
      ],
      correct: 1,
      reveal:
        'Up to five trading days — Monday through Friday, whichever of those NSE was actually open. Not seven calendar days: the weekend does not trade, so it contributes nothing to the bar. A single weekly candle can quietly compress five ordinary sessions, or three if two were holidays, and the candle itself gives you no way to tell which.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What one bar contains, by interval',
      md:
        '**1 minute** — one minute of trades. **5 or 15 minutes** — that many minutes.\n\n**1 day** — one full NSE session, 9:15 to 15:30.\n\n**1 week** — up to five sessions. **1 month** — roughly 21 sessions.\n\nThe drawing STYLE is a separate choice from this. OHLC bars predate colour screens; candlesticks are centuries older, from Japanese rice trading; Heikin-Ashi and hollow candles are newer, each built to pack in one more fact.',
    },
    {
      kind: 'figure',
      figure: 'ChartTypeFigure',
      props: {},
      caption:
        'The same real 40 days of Tata Consultancy Services, drawn five ways. Switch between them — the underlying trading never changes, only how it is encoded on screen.',
    },
    {
      kind: 'example',
      title: 'How much one candle compresses',
      setup: 'An NSE session runs 9:15 to 15:30 — 375 minutes of trading. Compare what different candle intervals compress that session down to.',
      steps: [
        { label: '1-minute candle', detail: 'Compresses this many minutes of trading', value: '1 minute' },
        { label: '15-minute candle', detail: 'Compresses this many minutes', value: '15 minutes' },
        { label: 'Daily candle', detail: 'Compresses the entire session', compute: { fn: 'literal', value: 375 } },
        { label: 'How many 1-minute candles fit inside one daily candle', detail: '375 minutes ÷ 1 minute each', compute: { fn: 'literal', value: 375 } },
      ],
      conclusion: 'The daily candle you glance at for two seconds is 375 one-minute candles worth of decisions, compressed into four numbers.',
    },
    {
      kind: 'predict',
      prompt: 'A weekly candle is built from up to five daily sessions. In a week with two public holidays, how many real sessions does that single bar actually compress?',
      options: ['Still five — holidays do not count', 'Three — only the days the market actually traded', 'Zero — weeks with a holiday are skipped entirely'],
      correct: 1,
      reveal:
        'Three. The bar only ever contains sessions that genuinely traded, and the candle carries no label telling you which week this was or how many of those five weekdays were holidays. The same lesson from reading candles applies again here: a summary discards exactly the details that would let you tell one week from another.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'TCS.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway: 'Switch the interval on a real chart and watch the same year of trading stretch or compress. Nothing about the company changes — only how much of its history fits into one bar.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'More detail is not automatically better',
      md:
        'Zooming to 1-minute bars does not reveal a truer picture of a stock. It reveals a noisier one — the same information the daily candle already compressed, spread across far more shapes.\n\nThe right interval depends on how long you actually intend to hold. A trade planned for months has little use for the noise inside a single session, and a trade planned for minutes cannot afford to wait for a weekly candle to close.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'An NSE session runs 375 minutes. How many 5-minute candles make up one full session?',
          type: 'compute',
          spec: { metric: 'literal', value: 75, tolerance: 0, unit: 'candles' },
          explanation: '375 ÷ 5 = 75. The same division works for any interval — total session minutes divided by the interval length.',
        },
        {
          prompt: 'Classify each statement about chart types.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'Heikin-Ashi prices are real prices you could have traded at', category: 'Folklore' },
              { label: 'A weekly candle can compress fewer than five sessions around a holiday', category: 'Supported by the mechanism' },
              { label: 'Hollow candles encode two separate facts instead of one', category: 'Supported by the mechanism' },
              { label: 'A 1-minute chart shows the single truest picture of a stock', category: 'Folklore' },
            ],
          },
          explanation:
            'The Heikin-Ashi claim is the one worth remembering longest. Its open is built from the previous Heikin-Ashi value, not this period’s real open. A stop or target set directly off a Heikin-Ashi price is set off a number nobody could actually have transacted at.',
        },
        {
          prompt: 'You plan to hold a position for several months. Which interval makes the most sense to start from?',
          type: 'decision',
          spec: {
            options: [
              '1-minute, for maximum detail',
              'Daily or weekly, matching how long you actually intend to hold',
              'It does not matter which interval you use',
            ],
            correct: 'Daily or weekly, matching how long you actually intend to hold',
          },
          explanation: 'Match the interval to the horizon. A months-long plan gains nothing from the noise inside a single session, and loses the wider view a daily or weekly candle actually shows.',
        },
      ],
    },
  ],
};

export default lesson;
