import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — the capstone
 *
 * Nine tools taught in this stage, none of them ranked against each other
 * until now. This lesson is the map: what each one actually answers, and the
 * one honest limit every single one of them shares — not one can tell you
 * which direction price goes next. It closes the stage by pointing back at
 * position sizing, the rule stage 3 taught long before any of these existed.
 */
export const lesson: Lesson = {
  id: 'in-t2-choosing-the-right-tool',
  tier: 'T2',
  market: 'IN',
  title: 'Which tool, for which job',
  summary:
    'A working map of every technical tool this stage taught — what each one actually answers, and the one thing none of them can tell you: which way price breaks.',
  plainSummary:
    'This stage taught many different chart tools. This lesson lines them up side by side and shows what each one is actually for.',
  objectives: [
    'Match each tool from this stage to the specific question it answers',
    'Explain why several tools agreeing on a price is not the same as certainty',
    'Decide what to do when two tools disagree on a level',
    'State the one thing every tool in this stage leaves undecided',
  ],
  prerequisites: ['in-t2-bollinger-bands'],
  estimatedMinutes: 15,
  introduces: [],
  skills: ['chart-reading', 'decision-making'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Before using any of these tools, you want to know if a stock is in a strong trend or just noisy chop. Which one answers that question most directly?',
      options: [
        'Fibonacci retracement',
        'Trend, defined by a rule you could have applied at the time',
        'An Elliott wave count',
      ],
      correct: 1,
      reveal:
        'The trend rule from earlier in this course. Most tools in this stage assume you already know the regime and answer a narrower question on top of it. Fibonacci assumes a trend exists and asks where a pullback inside it might end. Elliott wave assumes a structure and asks what phase it is in. Neither one tells you, from scratch, whether a trend is there at all.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A map, not a ranking',
      md:
        '**Support/resistance** — where price might pause. Most tools below reduce to this.\n\n**Trendlines** — is the trend intact, confirmed by a third touch.\n\n**Fibonacci** — where a pullback inside a trend might end.\n\n**Chart shapes** — reversal or pause, confirmed by the neckline or breakout, never the shape alone.\n\n**Candlesticks** — the only tools here with a real, tested base rate.\n\n**VWAP** — execution quality, never direction.\n\n**Volume profile, pivots, Bollinger** — where attention sits, a computed level, and whether volatility is compressed.',
    },
    {
      kind: 'example',
      title: 'When three tools point at the same price',
      setup:
        'A stock finds support at ₹640. That is also the ₹640 S1 pivot from yesterday’s OHLC. The Bollinger Bands there have squeezed to just 1.1% of price.',
      steps: [
        { label: 'Independent methods converging near ₹640', detail: 'A drawn support zone, a computed pivot, and a volatility squeeze', compute: { fn: 'literal', value: 3 } },
        { label: 'What that convergence means', detail: 'More attention on one price. Not more certainty about direction', value: 'confluence, not certainty' },
        { label: 'What happens next', detail: 'Every tool in this stage stops exactly here', value: 'unknown until it happens' },
      ],
      conclusion: 'Confluence is real and useful — it explains why some levels matter more than others. It has never once told anyone which way price breaks.',
    },
    {
      kind: 'predict',
      prompt: 'Two tools disagree: Fibonacci suggests support at ₹610, the pivot grid places S1 at ₹590. What should you do with that?',
      options: [
        'Average the two and use ₹600',
        'Treat both as separate hypotheses to watch live, not one more-precise number',
        'Discard both, since they disagree',
      ],
      correct: 1,
      reveal:
        'Two hypotheses, not one blended number. Averaging two judgement calls does not make a third, more accurate judgement call — it just hides how uncertain both were. Discarding both throws away real information: each is still a price worth watching, just not a price worth trusting on sight.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway: 'Toggle every indicator on at once. Pick a price where several of them cluster, and notice how confident that clustering feels compared to how little it actually promises.',
    },
    {
      kind: 'game',
      game: 'candle-sprint',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'The market does not know which tool you are using',
      md:
        'None of these nine tools has any power over price. Each is a lens a person chose to look through, and the market does not consult any of them before it moves.\n\nWhat protects you when a lens turns out to be wrong is not a better lens. It is the rule from stage 3: decide the loss you can accept before you enter, and let it set the size. That rule worked before any chart tool in this stage existed, and it still works when every single one of them is wrong.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'A drawn support zone, a Fibonacci level and a pivot S1 all sit within ₹4 of each other near ₹500. How many independent methods have converged on that price?',
          type: 'compute',
          spec: { metric: 'literal', value: 3, tolerance: 0, unit: 'methods' },
          explanation: 'Three, each built a completely different way — one by eye, one from a swing high and low, one from yesterday’s OHLC. Agreement between different methods is worth noticing precisely because they were not built to agree.',
        },
        {
          prompt: 'Classify each claim about the tools in this stage.',
          type: 'classify',
          spec: {
            categories: ['What these tools can do', 'What no tool in this stage can do'],
            items: [
              { label: 'Flag a price level worth watching more closely', category: 'What these tools can do' },
              { label: 'Tell you, in advance, which direction price breaks', category: 'What no tool in this stage can do' },
              { label: 'Measure whether volatility is compressed or expanded', category: 'What these tools can do' },
              { label: 'Guarantee an outcome because several tools agree', category: 'What no tool in this stage can do' },
            ],
          },
          explanation: 'Every tool in this stage can describe the present. Not one of them can promise the future, no matter how many of them happen to agree with each other on a given day.',
        },
        {
          prompt: 'Every tool in this stage points to the same price, and you feel confident. What still has to be decided before entering?',
          type: 'decision',
          spec: {
            options: [
              'Nothing — confluence this strong is enough on its own',
              'The size of the position, set by the loss you can accept if you are wrong',
              'Which tool gets the credit if the trade works',
            ],
            correct: 'The size of the position, set by the loss you can accept if you are wrong',
          },
          explanation: 'Size, decided by the acceptable loss. Confidence is a feeling, and every tool in this stage can produce it without earning it. The one decision that still matters regardless of how the tools line up is the one this course keeps returning to.',
        },
      ],
    },
  ],
};

export default lesson;
