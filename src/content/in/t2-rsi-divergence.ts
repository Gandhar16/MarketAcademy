import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — RSI divergence
 *
 * `in-t2-indicators` already touched divergence once, in a single predict,
 * as the honest exception to that lesson's "no future information" thesis —
 * a real, structural disagreement between two pieces of arithmetic, more
 * defensible than a static overbought/oversold line. This lesson is that
 * exception taught properly: the mechanism, a worked calculation, and the
 * same honesty every hand-drawn chart shape in this stage gets — matching
 * two swing points by eye is a judgement call, so no base rate is reported.
 */
export const lesson: Lesson = {
  id: 'in-t2-rsi-divergence',
  tier: 'T2',
  market: 'IN',
  title: 'RSI divergence: when price and momentum disagree',
  summary:
    'Price prints a new extreme. RSI does not agree. That disagreement is a real, structural fact about the arithmetic — and matching the two swings by eye is exactly the same judgement call as drawing any other chart shape.',
  plainSummary:
    'Sometimes price makes a new high or low while a popular momentum indicator does not follow it there. This shows what that disagreement actually means, and why spotting it is a judgement call, not a mechanical test.',
  objectives: [
    'Define bullish and bearish divergence between price and RSI',
    'Compute RSI at two swing points and check whether they actually disagree',
    'Explain why divergence is more defensible than a static RSI threshold',
    'Explain why this stage reports no base rate for it, the same reason as a hand-drawn chart shape',
  ],
  prerequisites: ['in-t2-indicators'],
  estimatedMinutes: 15,
  introduces: ['rsi-divergence'],
  skills: ['rsi-divergence', 'chart-reading', 'evidence'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A stock makes a LOWER low than its previous swing low. At the same moment, RSI makes a HIGHER low than it did at the previous swing. What does that disagreement actually tell you?',
      options: [
        'Nothing — RSI always moves with price',
        'The decline that produced the new low was, by this measure, weaker than the one before it',
        'Price is definitely about to reverse upward',
      ],
      correct: 1,
      reveal:
        'A weaker decline, by the RSI measure specifically — not a guaranteed reversal. RSI compares the size of recent up moves to recent down moves. If the down moves behind a new low are smaller, in aggregate, than the down moves behind the previous low, RSI can fail to make a new low too. That is a real fact about the arithmetic, not folklore. It is still built entirely from past prices, so it carries the same hard ceiling every indicator in this course does — no guarantee, no certainty about what happens next.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'DivergenceExplainer',
      props: {},
      takeaway:
        'Step through it once. The RSI bar only turns green once both values are actually computed — not because the second low merely looked gentler.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two kinds of disagreement',
      md:
        '**Bullish divergence** — price makes a LOWER low, RSI makes a HIGHER low. Read as selling pressure fading even as price keeps falling.\n\n**Bearish divergence** — price makes a HIGHER high, RSI makes a LOWER high. Read as buying pressure fading even as price keeps rising.\n\nBoth need the same two ingredients: two comparable swing points on price, and RSI measured at those exact same two points. Get the swing points wrong and the whole comparison is meaningless — which is exactly why this is harder than reading a single RSI value.',
    },
    {
      kind: 'example',
      title: 'Checking a real disagreement, numerically',
      setup:
        'Swing low 1: over the prior 5 days, the stock moved +₹2, −₹6, −₹4, +₹1, −₹5. Swing low 2, a few weeks later, at a LOWER price: +₹3, −₹3, −₹2, +₹2, −₹3.',
      steps: [
        { label: 'Swing low 1 — average loss', detail: '(6 + 4 + 5) ÷ 5', compute: { fn: 'literal', value: 3 } },
        { label: 'Swing low 1 — average gain', detail: '(2 + 1) ÷ 5', compute: { fn: 'literal', value: 0.6 } },
        { label: 'Swing low 1 — RSI', detail: '100 − [100 ÷ (1 + RS)], RS = 0.6 ÷ 3', compute: { fn: 'literal', value: 16.7 } },
        { label: 'Swing low 2 — average loss', detail: '(3 + 2 + 3) ÷ 5', compute: { fn: 'literal', value: 1.6 } },
        { label: 'Swing low 2 — average gain', detail: '(3 + 2) ÷ 5', compute: { fn: 'literal', value: 1 } },
        { label: 'Swing low 2 — RSI', detail: 'RS = 1 ÷ 1.6', compute: { fn: 'literal', value: 38.5 } },
      ],
      conclusion:
        'Price made a lower low, but RSI rose from 16.7 to 38.5 — a genuine higher low, computed, not eyeballed. The second decline was measurably less severe than the first, even though price itself went further.',
    },
    {
      kind: 'predict',
      prompt:
        'Same setup, but swing low 2\'s five days are: +₹1, −₹5, −₹5, 0, −₹4. Work out whether this is still bullish divergence against swing low 1\'s RSI of 16.7.',
      options: [
        'Yes — RSI is still higher than 16.7',
        'No — average loss is now larger, so RSI comes out lower than 16.7, and there is no divergence',
        'It cannot be determined from this information',
      ],
      correct: 1,
      reveal:
        'No divergence here. Average loss: (5+5+4)÷5 = 2.8. Average gain: 1÷5 = 0.2. RS = 0.2÷2.8 = 0.071. RSI = 100 − [100÷1.071] ≈ 6.6 — LOWER than swing low 1\'s 16.7, not higher. Price made a lower low and RSI agreed, making a lower low of its own. That is confirmation, the ordinary case, not divergence. It is easy to assume divergence is present just because price looks weak. The only way to actually know is to compute both points.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'Price makes a HIGHER low than its previous swing low, in an uptrend, while RSI makes a LOWER low at the same two points. This is hidden bullish divergence. Is it read the same way as ordinary bullish divergence?',
      options: [
        'Yes, identically — any price/RSI disagreement means the same thing',
        'No — ordinary divergence is a possible reversal signal; hidden divergence is read as the existing trend possibly continuing',
        'No — hidden divergence cannot be computed from RSI at all',
      ],
      correct: 1,
      reveal:
        'No, the reverse read. Ordinary bullish divergence (price lower low, RSI higher low) is watched near the bottom of a decline as a possible reversal. Hidden bullish divergence shows up during an uptrend\'s pullback and is read as momentum resetting without the trend weakening — continuation, not reversal.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'HDFCBANK.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'Toggle RSI on. Find two price swing lows (or highs) and compare where RSI sits at each. Most of the time the two agree — divergence is the exception, not the rule, which is exactly why it draws attention when it happens.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Why this stage reports no base rate here',
      md:
        'A candlestick pattern is a few-bar boolean rule a detector can score against thousands of real bars. Divergence is not that. It needs two swing points chosen by eye, the same subjective step a trendline or a head-and-shoulders neckline needs.\n\nTwo careful readers comparing the same chart can genuinely pick different swing points and reach different verdicts, exactly the honesty this course already gave every hand-drawn chart shape. That does not make divergence useless — the arithmetic is real once the points are chosen. It means treating a claimed win rate for it with the same scepticism as a win rate for a hand-drawn triangle.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'During an established uptrend, a pullback prints a higher low in price but a lower low in RSI at the same two points. Decide what this hidden divergence is traditionally read as.',
          type: 'decision',
          spec: {
            options: [
              'A reversal warning, exactly like ordinary bullish divergence',
              'A sign the uptrend may be resetting and continuing, not reversing',
              'Meaningless, since hidden divergence has no real definition',
            ],
            correct: 'A sign the uptrend may be resetting and continuing, not reversing',
          },
          explanation:
            'Continuation, not reversal. Hidden divergence during an established trend is read the opposite way from ordinary divergence at a trend\'s extreme.',
        },
        {
          prompt: 'Over 5 days a stock moves +₹1, −₹4, −₹3, +₹2, −₹2. What is the RSI at this swing point?',
          type: 'compute',
          spec: { metric: 'literal', value: 25, tolerance: 2, unit: '' },
          explanation:
            'Average gain = (1+2)÷5 = 0.6. Average loss = (4+3+2)÷5 = 1.8. RS = 0.6÷1.8 = 0.33. RSI = 100 − [100÷1.33] ≈ 25. The same two-average formula every time, whatever the pattern being checked.',
        },
        {
          prompt: 'Classify each statement about RSI divergence.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'Bullish divergence requires price to make a lower low while RSI makes a higher low', category: 'Supported by the mechanism' },
              { label: 'Divergence guarantees a reversal within a few days', category: 'Folklore' },
              { label: 'Divergence needs two swing points chosen by eye, like a trendline', category: 'Supported by the mechanism' },
              { label: 'Any time price looks weak, divergence is present', category: 'Folklore' },
            ],
          },
          explanation:
            'The last row is the trap this lesson\'s second predict was built to catch. Divergence is present only when both RSI values are actually computed and genuinely disagree — not whenever a decline merely looks tired.',
        },
        {
          prompt: 'Two traders mark different swing lows on the same chart and reach opposite verdicts on whether bullish divergence is present. What does that tell you?',
          type: 'decision',
          spec: {
            options: [
              'One of them made an arithmetic mistake',
              'They chose different swing points, and the honest read depends on which points are genuinely comparable',
              'RSI divergence has been disproven on this stock',
            ],
            correct: 'They chose different swing points, and the honest read depends on which points are genuinely comparable',
          },
          explanation:
            'Different inputs, not a broken formula. Choosing the swing points is the judgement call in this tool, the same way choosing which two swing lows to draw a trendline through is. The arithmetic on top of a chosen pair of points is exact; the choice of which pair is not.',
        },
      ],
    },
  ],
};

export default lesson;
