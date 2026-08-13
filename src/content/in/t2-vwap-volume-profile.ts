import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — VWAP and volume profile
 *
 * VWAP is already computed and already toggleable on every live chart in
 * this app (`in-t2-indicators` introduces it in passing). What was missing
 * was the lesson that explains what it is actually FOR — an execution
 * benchmark institutions are graded against, not a directional signal — and
 * its cousin, volume profile, which answers a genuinely different question:
 * not when the day was busy, but at what price.
 */
export const lesson: Lesson = {
  id: 'in-t2-vwap-volume-profile',
  tier: 'T2',
  market: 'IN',
  title: 'VWAP and volume profile: where the day’s business actually happened',
  summary:
    'VWAP is the single most-used intraday reference on a trading desk — not because it predicts anything, but because it is the number an execution is graded against. Volume profile asks the same question about price instead of time.',
  plainSummary:
    'One tool tracks the average price weighted by how many shares traded. Another shows which prices saw the most trading. Neither predicts what happens next — this shows what they are actually used for.',
  objectives: [
    'Explain why VWAP is used as an execution benchmark rather than a forecast',
    'Compute VWAP from a sequence of trades',
    'Read a volume profile and identify the point of control and value area',
    'Tell apart a high-volume node from a low-volume one, and what each implies about how price moves through it',
    'Explain what depends on the period a volume profile is built from',
  ],
  prerequisites: ['in-t2-candlestick-patterns-2'],
  estimatedMinutes: 18,
  introduces: ['volume-profile'],
  skills: ['vwap', 'volume-profile', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A large institutional order is filled slowly across an entire session. What does comparing that fill to VWAP actually let the desk check?',
      options: [
        'Whether the stock is about to go up',
        'Whether their own average price beat the volume-weighted average everyone else got that session',
        'The exact time the price will reverse',
      ],
      correct: 1,
      reveal:
        'Execution quality, not direction. A buyer who fills below VWAP did better than the session on average; a seller who fills above it did too. Funds are routinely graded against this number, which is precisely why it is the most-watched intraday reference on a trading desk. It says nothing at all about where price goes next — that confusion is exactly the folklore this lesson is here to correct.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'VwapBenchmarkExplainer',
      props: {},
      takeaway:
        'Step through it once. The line barely moves for four ordinary trades, then jumps hard the moment size shows up.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A benchmark, not a signal',
      md:
        'VWAP is the total rupee value traded so far, divided by the total shares traded so far. It resets fresh at the start of every session rather than smoothing across days like a moving average does.\n\nThat reset is the whole point. It answers "what has the average participant paid today", which is only meaningful within a single session — carrying it over from yesterday would answer a different, less useful question.',
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '15m', range: '5d' },
      mode: 'view',
      takeaway:
        'Toggle VWAP on and step through the days. Watch it reset at the open of each session rather than carrying over — that is what separates it from every moving average on this same chart.',
    },
    {
      kind: 'example',
      title: 'Computing VWAP from real trades',
      setup: 'Four trades print in the first ten minutes: 1,000 shares at ₹500, 500 shares at ₹502, 800 shares at ₹498, 700 shares at ₹501.',
      steps: [
        { label: 'Value of trade 1', detail: '1,000 shares × ₹500', compute: { fn: 'multiply', a: 1000, b: 500, dp: 0 } },
        { label: 'Value of trade 2', detail: '500 shares × ₹502', compute: { fn: 'multiply', a: 500, b: 502, dp: 0 } },
        { label: 'Value of trade 3', detail: '800 shares × ₹498', compute: { fn: 'multiply', a: 800, b: 498, dp: 0 } },
        { label: 'Value of trade 4', detail: '700 shares × ₹501', compute: { fn: 'multiply', a: 700, b: 501, dp: 0 } },
        { label: 'VWAP so far', detail: 'Total value ÷ total shares — ₹1,500,100 ÷ 3,000', compute: { fn: 'literal', value: 500.03 } },
      ],
      conclusion:
        'VWAP moves less than the raw price, because every new trade is diluted by all the volume that already happened in the session.',
    },
    {
      kind: 'predict',
      prompt:
        'A fifth trade prints: 5,000 shares at ₹510 — far more volume than all four earlier trades combined. What happens to VWAP?',
      options: [
        'Barely moves — VWAP resists any single trade',
        'Moves substantially toward ₹510, because this one trade outweighs everything before it',
        'Nothing — VWAP only updates at the end of the day',
      ],
      correct: 1,
      reveal:
        'Substantially. New total value: ₹1,500,100 + (5,000 × ₹510) = ₹40,50,100. New total shares: 8,000. VWAP jumps from ₹500.03 to ₹506.26. This is exactly what "volume-weighted" means in practice — a single large trade genuinely moves it, unlike a simple average of prices where every trade counts equally regardless of size.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'VolumeProfileFigure',
      props: {},
      caption:
        'The same session’s volume, sorted by price instead of by time. The point of control is the single busiest price; the value area is the band around it holding most of the volume.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Where both tools actually come from',
      md:
        'Volume profile descends from **Market Profile**, developed by J. Peter Steidlmayer at the Chicago Board of Trade in the 1980s. It was a floor trader\'s attempt to see WHERE, not just when, the day\'s business concentrated. The point of control and value area are his terms, still used exactly as he defined them.\n\nVWAP itself has grown one further variant worth knowing: **anchored VWAP**, popularised by trader Brian Shannon. Instead of resetting every session, it starts from one specific real event — an earnings date, a gap, a swing high or low — and runs forward from there. It is read the same way as ordinary VWAP, an average cost basis for everyone who has traded since that anchor, just anchored to a meaningful moment instead of the clock.',
    },
    {
      kind: 'predict',
      prompt:
        'On a volume profile, one price shows heavy, sustained volume (a high-volume node). A nearby price shows almost none (a low-volume node) — the histogram bar is nearly empty. How does price typically behave passing through each?',
      options: [
        'The same at both — volume profile says nothing about speed',
        'It tends to slow down and consolidate at the high-volume node, and move quickly through the low-volume one',
        'It moves fastest through the high-volume node, since that is where the action is',
      ],
      correct: 1,
      reveal:
        'Slow at the high-volume node, fast through the low-volume one — and there is a real mechanism behind it. A high-volume node has many participants with a stake at that price, giving price plenty of resting orders to fight through. That is the same reason any well-traded level can act as support or resistance. A low-volume node has almost nobody positioned there, so there is little to slow price down. Traders use exactly this to project targets: price often moves quickly across the gaps between nodes and pauses again at the next high-volume shelf.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "A trader keeps yesterday's VWAP line on today's chart and treats today's price crossing it as meaningful. What is wrong with that?",
      options: [
        'Nothing — VWAP is a moving average and carries over naturally',
        "VWAP is built to reset each session; yesterday's line describes trades that happened yesterday, not today",
        'VWAP cannot be drawn on a daily chart at all',
      ],
      correct: 1,
      reveal:
        "It answers the wrong question. VWAP resets because it measures what today's participants have paid so far. Carrying yesterday's line forward compares today's price to a completely different day's average trade, which was never what the benchmark was built to do.",
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Price above VWAP is not a buy signal',
      md:
        'Retail folklore treats a cross above VWAP as bullish and below it as bearish. That is not what the number was built to measure. This course does not report a base rate for it as a signal, because a benchmark built for execution quality was never designed to predict anything.\n\nVolume profile is real, computed arithmetic — unlike a hand-drawn trendline, nobody is eyeballing it. What is still a judgement call is which PERIOD to build it from. A profile over one day, one week and one month of the same stock can each show a different point of control.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            "A trader compares today's opening price against yesterday's closing VWAP value, treating it as a meaningful support level. Decide.",
          type: 'decision',
          spec: {
            options: [
              'Reasonable — VWAP behaves like any other level and can be tracked across days',
              "Not reasonable — VWAP resets each session, so yesterday's value describes yesterday's trading, not today's",
              'Reasonable, but only for large-cap stocks',
            ],
            correct: "Not reasonable — VWAP resets each session, so yesterday's value describes yesterday's trading, not today's",
          },
          explanation:
            "Not reasonable. VWAP is deliberately session-specific. Yesterday's figure reports on yesterday's participants, and treating it as a live level today mixes two separate measurements.",
        },
        {
          prompt: '300 shares trade at ₹200, then 700 shares trade at ₹204. What is the VWAP after both trades?',
          type: 'compute',
          spec: { metric: 'literal', value: 202.8, tolerance: 0.5, unit: '₹' },
          explanation: '(300 × 200 + 700 × 204) ÷ 1,000 = 202,800 ÷ 1,000 = ₹202.80. The larger trade pulls the average further toward its own price, exactly as volume-weighting is meant to.',
        },
        {
          prompt: 'Price is falling and crosses a stretch of the volume profile with almost no bars — a clear low-volume node. What should you honestly expect?',
          type: 'decision',
          spec: {
            options: [
              'Price to pause and consolidate there, the way it does at a high-volume node',
              'Price to move through quickly, since few participants are positioned at those prices to slow it down',
              'The move to reverse immediately',
            ],
            correct: 'Price to move through quickly, since few participants are positioned at those prices to slow it down',
          },
          explanation:
            'A low-volume node has little resting size to fight through, so price tends to cross it fast — the mirror of a high-volume node acting like support or resistance. Traders use exactly this gap to project how far a fast move might run before hitting the next well-traded shelf.',
        },
        {
          prompt: 'Classify each statement about VWAP and volume profile.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'VWAP resets at the start of every session', category: 'Supported by the mechanism' },
              { label: 'Price above VWAP means the stock will keep rising', category: 'Folklore' },
              { label: 'A larger trade moves VWAP more than a smaller one', category: 'Supported by the mechanism' },
              { label: 'A volume profile’s point of control is the same regardless of the period chosen', category: 'Folklore' },
            ],
          },
          explanation:
            'The point of control is a property of the DATA WINDOW, not of the stock. Change the window and it can move, sometimes by a lot — which is worth remembering before treating it as some fixed, permanent level.',
        },
        {
          prompt: 'An institutional desk sells a large block at a price below the session’s VWAP. What does that most honestly indicate?',
          type: 'decision',
          spec: {
            options: [
              'The stock is about to fall further',
              'Their execution underperformed the session’s volume-weighted average — nothing about future price',
              'The trade was executed improperly',
            ],
            correct: 'Their execution underperformed the session’s volume-weighted average — nothing about future price',
          },
          explanation:
            'A benchmark miss, nothing more. VWAP measures how this session’s participants did on average. A desk’s fill relative to it is a report card on that one trade, not a forecast of where the stock goes from here.',
        },
      ],
    },
  ],
};

export default lesson;
