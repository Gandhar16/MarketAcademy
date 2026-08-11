import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — Bollinger Bands
 *
 * Already computed and already toggleable on every live chart in this app,
 * same as VWAP — the gap was the lesson explaining what a squeeze actually
 * is: volatility compressing, not a countdown to a specific direction. That
 * distinction is the same one the continuation-patterns lesson made about
 * breakout direction, aimed at a different tool.
 */
export const lesson: Lesson = {
  id: 'in-t2-bollinger-bands',
  tier: 'T2',
  market: 'IN',
  title: 'Bollinger Bands and the volatility squeeze',
  summary:
    'A moving average with statistical rails above and below it, widening when price is volatile and narrowing when it is calm. A squeeze says something is coming. It never says which way.',
  plainSummary:
    'These are two lines drawn a fixed distance from a smoothed price line, forming a channel that widens and narrows. This shows what actually drives that, and what a narrow channel does and does not predict.',
  objectives: [
    'State the Bollinger Bands formula and what drives its width',
    'Compute band width from a moving average and a standard deviation',
    'Explain what a squeeze indicates and what it does not',
    'Tell apart a band touch that means "reversal" from one that means "trend continuing"',
    'Decide what a tight squeeze honestly tells you about what happens next',
  ],
  prerequisites: ['in-t2-pivot-points'],
  estimatedMinutes: 17,
  introduces: ['bollinger-bands', 'volatility'],
  skills: ['bollinger-bands', 'volatility', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Bollinger Bands are a moving average with two lines drawn a fixed statistical distance above and below it. When the bands squeeze close together, what does that actually tell you?',
      options: [
        'The price is about to crash',
        'Volatility has dropped — nothing about direction',
        'The stock is a buy',
      ],
      correct: 1,
      reveal:
        'Only that volatility has dropped. The bands are built from the standard deviation of recent closes, and a small standard deviation is what a squeeze IS by definition. Volatility does tend to cluster and eventually expand again, which is why a squeeze often precedes a bigger move — but the calculation contains nothing about which direction that move goes. That direction is exactly as unknowable from the bands as a triangle’s breakout direction was from its shape.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'One moving average, two rails',
      md:
        '**Middle band** — a 20-period moving average, nothing new.\n\n**Upper band** = middle band + (2 × standard deviation of the last 20 closes). **Lower band** = middle band − (2 × standard deviation).\n\nThis is already computed and already toggleable on every live chart in this app, the same as VWAP. The width between the two rails is the entire story — wide when price has been jumping around, narrow when it has been calm.',
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'HDFCBANK.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway: 'Toggle Bollinger on. Find a stretch where the bands pinch close together, and look at what happened to price afterward.',
    },
    {
      kind: 'example',
      title: 'Computing the band width',
      setup: 'A 20-day moving average sits at ₹850, with a standard deviation of ₹12 across those 20 closes.',
      steps: [
        { label: 'Upper band', detail: 'Average + (2 × ₹12)', compute: { fn: 'literal', value: 874 } },
        { label: 'Lower band', detail: 'Average − (2 × ₹12)', compute: { fn: 'literal', value: 826 } },
        { label: 'Band width', detail: 'Upper minus lower', compute: { fn: 'literal', value: 48 } },
        { label: 'Band width as a share of price', detail: 'How a "squeeze" is actually measured', compute: { fn: 'spanPercent', high: 874, low: 826, reference: 850, dp: 1 } },
      ],
      conclusion: 'A squeeze and an expansion are just this width shrinking and growing. Nothing about direction is encoded in the calculation.',
    },
    {
      kind: 'predict',
      prompt:
        'A week later, the same stock’s standard deviation has fallen to ₹2 while the average is still ₹850. Compute the new band width as a percentage of price.',
      options: ['Roughly 0.9% — the bands have squeezed hard', 'Roughly 5.6% — unchanged from before', 'Roughly 11% — the bands have widened'],
      correct: 0,
      reveal:
        'Roughly 0.9%. Upper: 850 + 4 = 854. Lower: 850 − 4 = 846. Width: 8, which is 0.94% of 850 — down sharply from the 5.6% width in the earlier example. That contraction is exactly what a squeeze looks like in the numbers, and it says nothing yet about which way price eventually breaks out of it.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Where this comes from, and the rule its own inventor gave',
      md:
        'John Bollinger developed this indicator in the early 1980s. He adapted an older idea — fixed-percentage trading bands around a moving average — into rails that widen and narrow with actual measured volatility instead of a constant percentage.\n\nBollinger also defined **%B**, a single number for where price sits inside the channel right now: %B = (price − lower band) ÷ (upper band − lower band). 0 means price is on the lower band, 1 means it is on the upper band, above 1 means price has pushed outside the bands entirely.\n\nHis own stated rule, worth taking seriously precisely because he built the tool: never trade off the bands alone. Pair them with a second, unrelated indicator — he favoured volume and momentum tools — because the bands describe volatility, not trend direction or strength.',
    },
    {
      kind: 'predict',
      prompt:
        'A stock in a strong uptrend rides right along the upper band for six straight sessions without pulling back. Going purely by "touching the upper band," a new trader sells, expecting a reversal. What actually happened?',
      options: [
        'The trader was right — six touches guarantees an imminent drop',
        'A "band walk" — a strong trend can hug a band for a long stretch, and treating every touch as overbought fights the trend',
        'The bands are broken and need to be recalculated',
      ],
      correct: 1,
      reveal:
        'A band walk. The upper band is two standard deviations above a moving average, not a hard ceiling. A genuinely strong trend can print closes riding along it for many sessions in a row. Reading every touch as "overbought, must reverse" is a common mistake — it means selling into the strongest part of a real trend. That is exactly why Bollinger\'s own rule was to check a second indicator before acting on any single touch.',
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
      title: 'A squeeze is not a countdown timer',
      md:
        'Volatility genuinely tends to expand again after contracting, which is a real, well-documented statistical pattern. It says nothing about when.\n\nA squeeze can persist for weeks before anything happens, and the eventual move can go either direction — the same honest limit this stage keeps finding on tool after tool. A narrow channel is a reason to pay attention, not a signal to act.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'A 20-day average is ₹1,200 with a standard deviation of ₹18. What is the upper band?',
          type: 'compute',
          spec: { metric: 'literal', value: 1236, tolerance: 2, unit: '₹' },
          explanation: '₹1,200 + (2 × ₹18) = ₹1,236. The same two-step formula every time: the average, plus twice the standard deviation.',
        },
        {
          prompt: 'Upper band ₹1,236, lower band ₹1,164, price ₹1,215. What is %B?',
          type: 'compute',
          spec: { metric: 'literal', value: 0.71, tolerance: 0.03, unit: '' },
          explanation:
            '%B = (1,215 − 1,164) ÷ (1,236 − 1,164) = 51 ÷ 72 = 0.71. Price sits 71% of the way up the channel — closer to the upper band than the middle, but not outside it.',
        },
        {
          prompt: 'Classify each statement about Bollinger Bands.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'The middle band is a 20-period moving average', category: 'Supported by the mechanism' },
              { label: 'A squeeze guarantees a large move within days', category: 'Folklore' },
              { label: 'Band width is driven by the standard deviation of recent closes', category: 'Supported by the mechanism' },
              { label: 'The bands indicate which direction the next move will be', category: 'Folklore' },
            ],
          },
          explanation:
            'Direction is the recurring gap in this stage’s tools, and Bollinger Bands are no exception. The calculation is entirely about how much price has moved, never about which way it moves next.',
        },
        {
          prompt: 'The bands have squeezed to their tightest reading in six months. What is the honest read?',
          type: 'decision',
          spec: {
            options: [
              'A large move up is now certain',
              'Volatility is low; a bigger move becomes more likely eventually, direction unknown',
              'A large move down is now certain',
            ],
            correct: 'Volatility is low; a bigger move becomes more likely eventually, direction unknown',
          },
          explanation:
            'Low volatility, nothing more decided. "Eventually" and "unknown direction" are doing the real work in that sentence — both true, and both routinely dropped by anyone selling a squeeze as a trade signal.',
        },
      ],
    },
  ],
};

export default lesson;
