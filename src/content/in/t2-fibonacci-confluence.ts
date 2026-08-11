import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — confluence at Fibonacci levels
 *
 * The Fibonacci lesson taught the mechanism and the reflexivity argument.
 * The candlestick and chart-shape lessons each taught a single tool in
 * isolation. This lesson is where traders actually combine them — a hammer
 * or an engulfing candle landing exactly on a 61.8% retracement is read as a
 * stronger setup than either alone. The honest claim underneath that is
 * narrower than it sounds: more traders are watching that price, which is
 * real, but the two signals are not independent evidence, because a human
 * eye chose both of them off the same chart.
 */
export const lesson: Lesson = {
  id: 'in-t2-fibonacci-confluence',
  tier: 'T2',
  market: 'IN',
  title: 'When a candle or a chart shape lands on a Fibonacci level',
  summary:
    'A hammer at the 61.8% retracement is treated as a stronger setup than a hammer on its own. That is real — more attention concentrates there. It is not the same as more certainty.',
  plainSummary:
    'Traders often watch for two different chart signals lining up at the exact same price. This shows why that combination draws extra attention, and why it is not extra proof.',
  objectives: [
    'Explain what confluence means and why it draws attention',
    'Name the retracement levels most commonly watched for confluence',
    'Compute whether a real candle or pattern lines up with a retracement level',
    'Explain why two subjective signals agreeing is not the same as independent evidence',
  ],
  prerequisites: ['in-t2-fibonacci', 'in-t2-reversal-chart-patterns', 'in-t2-continuation-patterns', 'in-t2-candlestick-patterns-2'],
  estimatedMinutes: 16,
  introduces: ['confluence'],
  skills: ['fibonacci', 'confluence', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A bullish engulfing candle forms exactly at the 61.8% retracement of a prior rally. Compared to the same candle forming at a random, unremarkable price, is it more likely to mark a genuine reversal?',
      options: [
        'No difference — a candle is a candle, wherever it forms',
        'Traders treat it as a stronger setup, mainly because attention and orders concentrate at that price',
        'Yes, guaranteed — Fibonacci levels are mathematically special',
      ],
      correct: 1,
      reveal:
        'Traders treat it as stronger, and the reason is the same reflexivity argument from the Fibonacci lesson. Nothing in the arithmetic changed. What changed is that a well-watched price and a well-known candle shape now sit in the same place, and that draws more eyes and more orders than either would alone. That is a real effect on ATTENTION. It is not a mathematical upgrade to the candle itself.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Confluence, and which levels get watched',
      md:
        '**Confluence** is what traders call it when two or more separate tools point at the same price — a retracement level, a chart-shape neckline, a reversal candle.\n\nIt feels like double confirmation, which is why it is worth examining. Both signals were drawn by the same person, off the same chart. They are one judgement, expressed twice.\n\nThe **50%–61.8% band** — the golden zone — gets the most attention of all. 38.2% is watched next. 78.6% and 23.6% are watched by far fewer people.',
    },
    {
      kind: 'example',
      title: 'Checking a real case for confluence',
      setup: 'A stock rallies from ₹800 to ₹1,000. It pulls back and prints a hammer candle at ₹923.',
      steps: [
        { label: '38.2% retracement of the ₹800–₹1,000 rally', detail: '₹1,000 minus 38.2% of the ₹200 range', compute: { fn: 'literal', value: 923.6 } },
        { label: 'Where the hammer actually printed', detail: 'Given', value: '₹923' },
        { label: 'Distance between the two', detail: 'Close enough to call it confluence', compute: { fn: 'literal', value: 0.6 } },
        { label: 'What that proximity adds', detail: 'More traders watching this exact price. Nothing about the hammer itself', value: 'attention only' },
      ],
      conclusion: 'The candle and the level did not become more predictive by lining up. What changed is how many other people are watching the same few rupees.',
    },
    {
      kind: 'predict',
      prompt: 'The same hammer instead prints at ₹960, far from any standard retracement level. Should you weight it differently from the ₹923 case?',
      options: [
        'Yes — weight it less, since there is no confluence',
        'Yes — weight it less, but only because fewer traders are watching that price, not because the candle itself is weaker',
        'No difference at all',
      ],
      correct: 1,
      reveal:
        'The second answer draws the distinction that matters. The candle’s own base rate, from the earlier candlestick lessons, has not changed at all between the two cases. What differs is how much of the market is watching this particular price. That is a real, separate effect — and a different claim from "this candle is more trustworthy here".',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'INFY.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'Find a pullback on this real chart. Estimate the 61.8% retracement by eye, and check whether any candle shape landed near it. Notice how much of that judgement is you choosing where to look.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Confluence is not independent evidence',
      md:
        'Two independent witnesses agreeing is strong evidence, because each could have been wrong in a different way. Two tools drawn by the same eye, off the same swing points, do not have that property.\n\nA Fibonacci grid and a candle shape both come from you looking at the same chart and making a judgement call. Stacking them does not multiply your odds of being right the way two genuinely independent signals would. It mainly tells you where a crowd is looking.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'A rally runs from ₹1,500 to ₹1,700. Where does the 61.8% retracement sit?',
          type: 'compute',
          spec: { metric: 'literal', value: 1576.4, tolerance: 1, unit: '₹' },
          explanation: '₹1,700 − (0.618 × ₹200) = ₹1,576.40. The same formula from the Fibonacci lesson, applied to a fresh pair of anchors.',
        },
        {
          prompt: 'Classify each statement about confluence.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'A reversal candle at a Fibonacci level draws more attention from other traders', category: 'Supported by the mechanism' },
              { label: 'Confluence makes a signal mathematically more likely to be correct', category: 'Folklore' },
              { label: 'The 50%–61.8% band is the most widely watched retracement zone', category: 'Supported by the mechanism' },
              { label: 'Two subjective signals agreeing is the same as two independent pieces of evidence', category: 'Folklore' },
            ],
          },
          explanation:
            'The independence claim is the one worth remembering longest. Real independent evidence comes from different sources that could fail separately. A Fibonacci grid and a candle shape both come from the same chart and the same pair of eyes.',
        },
        {
          prompt: 'A morning star pattern completes exactly at the 61.8% retracement of a prior decline. How much extra certainty should that combination give you?',
          type: 'decision',
          spec: {
            options: [
              'A large amount — two signals means twice the confidence',
              'Some — worth noting as a place where more traders are watching, not proof of anything',
              'None at all — combining signals never means anything',
            ],
            correct: 'Some — worth noting as a place where more traders are watching, not proof of anything',
          },
          explanation:
            'Some, and no more than that. The middle answer is the only one that survives the reasoning in this lesson — confluence is a real fact about attention, not a multiplier on how right you are.',
        },
      ],
    },
  ],
};

export default lesson;
