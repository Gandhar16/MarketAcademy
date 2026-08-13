import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — indicators
 *
 * The last lesson of the chart stage, and the one that has to defuse the
 * largest industry. Indicators are sold as instruments — as if RSI measures
 * something about a company the way a thermometer measures temperature.
 *
 * THE ONE SENTENCE THIS LESSON EXISTS FOR
 *
 * Every indicator on every platform is arithmetic on prices you already have.
 * It adds no information. It is a re-presentation, and its entire value is that
 * a human eye reads a smoothed line more reliably than a jagged one.
 *
 * That framing makes the rest obvious rather than surprising: an average of the
 * last 20 bars must lag, because it is made of the last 20 bars. A momentum
 * measure cannot know about tomorrow, because tomorrow is not among its inputs.
 * Learners who hold this cannot be sold a setting.
 *
 * The lesson deliberately quotes the standard folklore thresholds (70/30) and
 * then sends the learner to measure them, rather than asserting they are wrong.
 */
export const lesson: Lesson = {
  id: 'in-t2-indicators',
  tier: 'T2',
  market: 'IN',
  title: 'Indicators and the lag you are paying for',
  summary:
    'Every one of them is arithmetic on prices you can already see. No new information enters. What you get is a smoother line — and a delay you should be able to state in bars.',
  plainSummary:
    'Charting apps show dozens of extra lines and numbers on top of the price. This explains what they are made of, which is nothing you did not already have.',
  objectives: [
    'State what inputs any given indicator actually uses',
    'Say how many bars of delay a given average carries',
    'Compute RSI from a small set of gains and losses',
    'Explain why divergence compares two swings instead of reading one static level',
    'Test a folklore threshold against what really followed it',
  ],
  prerequisites: ['in-t2-trend'],
  estimatedMinutes: 19,
  introduces: ['moving-average', 'rsi', 'atr', 'vwap', 'candle', 'ohlc', 'volume', 'base-rate', 'support', 'resistance', 'statistical-significance'],
  skills: ['indicators', 'chart-reading', 'evidence'],
  blocks: [
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'Turn each indicator on and off. Every line you add is computed from the bars already on this screen — nothing new arrives with it.',
    },
    {
      kind: 'predict',
      prompt:
        'You add a 20-day moving average to a chart. What information does the chart now contain that it did not before?',
      options: ['A measure of momentum', 'The average price, which was not visible', 'None at all — it is arithmetic on bars already there'],
      correct: 2,
      reveal:
        'None at all. Every indicator ever built takes the prices you can already see and rearranges them. No outside data enters, no company information, nothing about tomorrow. That is not a criticism — a smoothed line genuinely is easier for a human eye to read than a jagged one, and that is a real benefit. But it sets a hard ceiling on what any of them can do. If an indicator appears to predict something, the prediction was already present in the prices, and the arithmetic only made it visible.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'IndicatorLagExplainer',
      props: {},
      takeaway:
        'Step through it once. The 50-day line is smoother and further behind — that trade-off has no setting that avoids it.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What each one is, in one line',
      md:
        '**Moving average** — the mean of the last N closes. **EMA** — the same, weighted toward recent bars.\n\n**Bollinger bands** — a 20-bar average with a band two standard deviations either side, so it widens when bars have been moving further.\n\n**RSI** — the size of recent up moves against recent down moves, scaled to 0–100. **MACD** — the gap between a fast and a slow average, plus an average of that gap.\n\n**ATR** — the average size of a bar. **VWAP** — the average price weighted by how much traded at each one.',
    },
    {
      kind: 'example',
      title: 'How far behind an average actually is',
      setup:
        'A share sits at ₹1,000 for a long time and then rises ₹10 a day, every day, without a single down day. A 20-day average follows it. Here is exactly how far behind it stays.',
      steps: [
        {
          label: 'Price after 20 days of rising',
          detail: '₹1,000 plus 20 days at ₹10',
          compute: { fn: 'literal', value: 1200 },
        },
        {
          label: 'What the average is showing',
          detail: 'The mean of those same 20 days, which includes all the low ones',
          compute: { fn: 'literal', value: 1105 },
        },
        {
          label: 'How far behind it is, in rupees',
          detail: 'And it stays exactly this far behind for as long as the rise continues',
          compute: { fn: 'literal', value: 95 },
        },
        {
          label: 'As a share of the move so far',
          detail: '₹95 behind on a ₹200 move',
          compute: { fn: 'literal', value: 47.5 },
        },
        {
          label: 'The lag in days',
          detail: 'Roughly half the window, which is a property of averaging and not a flaw',
          compute: { fn: 'literal', value: 9.5 },
        },
      ],
      conclusion:
        'A 20-day average is about ten days behind, always. Not because it is badly built — because it is an average of twenty days.',
    },
    {
      kind: 'predict',
      prompt:
        'You switch to a 50-day average to get a smoother line. Work out the consequence before you look. How far behind is it now?',
      options: ['About 10 days, same as before', 'About 25 days', 'It depends on how fast the price moves'],
      correct: 1,
      reveal:
        'About 25 days — roughly half the window, exactly as before. This is the trade-off in its purest form, and it has no solution. A longer window is smoother and later; a shorter one is earlier and noisier. Every "optimal setting" ever sold is somebody picking a point on this line and then testing it on the same data they picked it from. The honest way to choose is to decide how much noise you can tolerate before you look at any results, and then live with the lag that comes with it.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'three-down-days', symbol: 'RELIANCE.NS' },
      takeaway:
        'Three down days is the crudest possible oversold signal. Test what actually followed it, then ask what an RSI threshold would have to beat.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Where RSI, ATR and MACD actually come from',
      md:
        'RSI and ATR share an inventor: J. Welles Wilder Jr., a mechanical engineer turned trader. He published both in his 1978 book *New Concepts in Technical Trading Systems* — the same book that introduced ADX and Parabolic SAR. MACD came a year later, from Gerald Appel.\n\nBoth are decades-old, hand-computable formulas, designed before anyone had a computer at their desk — which is exactly why they are simple arithmetic on prices rather than anything more elaborate. Their age makes them neither more nor less trustworthy today; it only explains why the arithmetic stayed this plain.',
    },
    {
      kind: 'example',
      title: 'Computing RSI from a short run of days',
      setup:
        'Over the last 5 days, a stock moved: +₹4, +₹6, −₹3, +₹2, −₹1. RSI compares the average size of the up days to the average size of the down days.',
      steps: [
        { label: 'Average gain', detail: '(4 + 6 + 2) ÷ 5 — down days count as zero here', compute: { fn: 'literal', value: 2.4 } },
        { label: 'Average loss', detail: '(3 + 1) ÷ 5 — up days count as zero here', compute: { fn: 'literal', value: 0.8 } },
        { label: 'Relative strength (RS)', detail: 'Average gain ÷ average loss', compute: { fn: 'literal', value: 3 } },
        { label: 'RSI', detail: '100 − [100 ÷ (1 + RS)]', compute: { fn: 'literal', value: 75 } },
      ],
      conclusion:
        'RSI of 75 means up moves have been roughly three times the size of down moves over this stretch, scaled onto a fixed 0–100 line. It is arithmetic on the same five numbers you started with, nothing else.',
    },
    {
      kind: 'predict',
      prompt:
        'Price prints a lower low than its previous swing low, but RSI prints a HIGHER low at the same time — the two disagree. What is this called, and why do some traders treat it more seriously than a plain "RSI below 30"?',
      options: [
        'A false reading — the indicator is broken and should be ignored',
        'Divergence — it compares two swings against each other rather than reading one static level in isolation',
        'Nothing unusual — RSI and price always move together',
      ],
      correct: 1,
      reveal:
        'Divergence. Price making a lower low means sellers pushed further; RSI making a higher low means the down move that got them there was, by this measure, weaker than the previous one. That is a real, structural disagreement between two pieces of arithmetic, not folklore about a fixed number like 30 or 70. It is still built entirely from past prices, carrying the same hard ceiling as every other indicator in this lesson — no future information, no guarantee. What makes it more defensible than a static threshold is that it compares the market against ITSELF at two points, not against an arbitrary line drawn once and never adjusted.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A trader uses RSI, MACD and a 20-day moving average together, all pointing the same direction, and calls this "three confirming signals". Since all three are built from the same recent closing prices, how much genuinely independent information do they add up to?',
      options: [
        'Three independent confirmations, since they are three different calculations',
        'Far less than three — they are different arithmetic on largely the same recent prices, so agreement is expected',
        'Zero — using more than one indicator is always a mistake',
      ],
      correct: 1,
      reveal:
        'Far less than three. RSI, MACD and a moving average are all functions of the same recent closing prices, just combined differently. When the market has clearly been rising, it is unsurprising that several different calculations on that same rise all point up together. That is not three separate pieces of evidence agreeing — it is one underlying fact viewed through three lenses. None of them can see anything the others could not, because none of them has access to any input the others lack.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Overbought and oversold',
      md:
        'The folklore says RSI above 70 is overbought and below 30 is oversold, and that both are followed by a reversal.\n\nHere is the difficulty. In a strong rise, RSI goes above 70 and **stays there for weeks**, because that is what the arithmetic does when up days outnumber down days. Selling every time it crossed 70 would have had you short of every large rally in history.\n\nThe threshold is not wrong so much as unstated. Overbought compared with what, and followed by a reversal within how many days? Fill those in and it becomes testable — and then you can find out.',
    },
    {
      kind: 'game',
      game: 'chart-replay',
      config: {},
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A trader counts RSI, MACD and a moving-average crossover all pointing upward as "three independent bullish signals". Decide what is wrong with that count.',
          type: 'decision',
          spec: {
            options: [
              'Nothing — three agreeing indicators genuinely means three times the evidence',
              'All three are computed from the same recent prices, so their agreement is expected rather than three separate discoveries',
              'Indicators can never be used together under any circumstances',
            ],
            correct:
              'All three are computed from the same recent prices, so their agreement is expected rather than three separate discoveries',
          },
          explanation:
            'They share the same inputs. Counting agreeing indicators as independent confirmations overstates the evidence, because none of them had access to information the others lacked. They are re-presentations of the same recent prices, not separate observations.',
        },
        {
          prompt:
            'You are using a 30-bar moving average. Roughly how many bars behind the price does it sit during a steady move?',
          type: 'compute',
          spec: { metric: 'literal', value: 15, tolerance: 2, unit: 'bars' },
          explanation:
            'About half the window, so roughly 15 bars. Knowing this number for whatever setting you use is the difference between using an average and being surprised by it. It also tells you what the tool is for. A 200-day average is 100 days behind, so it is useless for timing an entry and perfectly good for asking whether something is broadly rising.',
        },
        {
          prompt: 'Over 5 days a stock moves +₹5, +₹3, −₹4, −₹2, +₹6. What is the RSI?',
          type: 'compute',
          spec: { metric: 'literal', value: 70, tolerance: 2, unit: '' },
          explanation:
            'Average gain = (5+3+6)÷5 = 2.8. Average loss = (4+2)÷5 = 1.2. RS = 2.8÷1.2 = 2.33. RSI = 100 − [100 ÷ (1+2.33)] ≈ 70. The same two-average, one-ratio formula every time.',
        },
        {
          prompt:
            'Sort each statement by whether an indicator can possibly contain that information.',
          type: 'classify',
          spec: {
            categories: ['Can contain this', 'Cannot contain this'],
            items: [
              { label: 'How much the price has moved recently', category: 'Can contain this' },
              { label: 'How large a typical bar has been', category: 'Can contain this' },
              { label: 'What the company will announce next week', category: 'Cannot contain this' },
              { label: 'Whether other traders are about to sell', category: 'Cannot contain this' },
            ],
          },
          explanation:
            'The dividing line is simply the input list. An indicator is a function of past prices and volumes, so anything that is not derivable from past prices and volumes is not in there — however sophisticated the formula looks. This one test settles most claims made about these tools without needing to know how any of them are calculated.',
        },
        {
          prompt:
            'A course sells a strategy whose settings were chosen because they performed best on the last five years of data. Decide what you have learnt from that performance.',
          type: 'decision',
          spec: {
            options: [
              'That the settings are good',
              'Very little — the settings were selected using the same data they are being judged on',
              'That the strategy works on this market',
            ],
            correct: 'Very little — the settings were selected using the same data they are being judged on',
          },
          explanation:
            'Very little. Given enough settings to try, one will look excellent on any five years of history whether or not it has merit. That is guaranteed by searching, and it is not a discovery. The only meaningful test is on data that was not available when the settings were chosen. This has a name and a whole lesson later in the course. It is the most common way a strategy that cannot work is sold as one that does.',
        },
      ],
    },
  ],
};

export default lesson;
