import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — triangles, flags, wedges
 *
 * The reversal-pattern lesson taught the anatomy of a shape that claims a
 * trend is ENDING. This one is the same tool aimed at a pause: a triangle,
 * flag or wedge claims the trend is merely resting before continuing. It
 * reuses the trendline skill directly — a triangle is just two converging
 * trendlines — and it carries the same honest caveat as the reversal shapes:
 * the breakout direction, not the shape, is the only real information.
 */
export const lesson: Lesson = {
  id: 'in-t2-continuation-patterns',
  tier: 'T2',
  market: 'IN',
  title: 'Triangles, flags and wedges: pauses, not reversals',
  summary:
    'A narrowing range after a strong move is read as a pause, not a turn. Two converging trendlines make a triangle; a parallel channel makes a flag — and in every case the breakout direction is the only new information you get.',
  plainSummary:
    'Sometimes a trend goes sideways for a while before continuing. Traders draw shapes around that pause and give them names. This shows what those shapes are actually made of, and what they do and do not tell you.',
  objectives: [
    'Distinguish a continuation pattern from a reversal pattern',
    'Draw a triangle as two converging trendlines and explain what a flag changes about that',
    'Compute a measured-move target from a continuation pattern’s base height',
    'Explain why the breakout direction, not the shape, is the only real information it provides',
  ],
  prerequisites: ['in-t2-reversal-chart-patterns'],
  estimatedMinutes: 14,
  introduces: [],
  skills: ['chart-patterns', 'trendlines', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A stock rallies hard, then trades sideways in a narrowing range for two weeks before continuing upward. What does that pause actually mean?',
      options: [
        'It was a reversal — the rally had ended',
        'A pause, read as a continuation of the same trend rather than a change of direction',
        'It was a double top forming',
      ],
      correct: 1,
      reveal:
        'A pause. The narrowing range is exactly the shape a triangle is drawn from, and the folklore around it is that the prior trend usually resumes once price breaks out of it. Notice the word "usually" — that is a claim about probability, not a guarantee. Nothing about the shape forces the trend to continue, and the next few blocks are about exactly what the shape does and does not tell you.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two converging trendlines, and their cousins',
      md:
        'A triangle is drawn with the exact tool from the earlier trendline lesson, just twice: one line under the swing lows, one over the swing highs, sloping toward each other.\n\nA flag is the same pause with the two lines roughly parallel instead of converging — a brief channel after a sharp move. A wedge slopes both lines the same direction. A pennant is a small triangle that forms quickly after a sharp move, the same shape as a triangle at a smaller scale. All four are read the same way: a pause, and a breakout to watch for.',
    },
    {
      kind: 'figure',
      figure: 'ChartPatternFigure',
      props: { pattern: 'triangle' },
      caption: 'Two trendlines converging toward a breakout. There is no neckline here, because there is no single confirming level — only the eventual direction.',
    },
    {
      kind: 'example',
      title: 'The measured move from a triangle',
      setup:
        'A symmetrical triangle forms after a rally. Its widest point, near the start of the pattern, spans ₹40. Price breaks out above the triangle at ₹860.',
      steps: [
        {
          label: 'The base height of the triangle',
          detail: 'Measured at its widest point, before the lines converge',
          value: '₹40',
        },
        {
          label: 'Measured-move target above the breakout',
          detail: 'The same ₹40, projected upward from the breakout price',
          compute: { fn: 'literal', value: 900 },
        },
        {
          label: 'The target as a share of the breakout price',
          detail: 'How far the projection actually reaches',
          compute: { fn: 'spanPercent', high: 900, low: 860, reference: 860, dp: 1 },
        },
        {
          label: 'Which direction it would have broken, before it happened',
          detail: 'The one thing the triangle’s shape genuinely could not tell you in advance',
          value: 'unknown',
        },
      ],
      conclusion:
        'The target is the same arithmetic as a head and shoulders — height, projected from the breakout. The direction of that breakout was not something the shape itself could tell you before it happened.',
    },
    {
      kind: 'predict',
      prompt:
        'A flag forms after a sharp rally: a brief pullback channel sloping gently against the trend. What actually separates it from the triangle above?',
      options: [
        'Nothing — they are the same shape with different names',
        'The channel lines run roughly parallel instead of converging to a point, and the pause is usually shorter',
        'A flag always breaks downward, a triangle always breaks upward',
      ],
      correct: 1,
      reveal:
        'Parallel instead of converging, and typically a shorter pause after a sharper move. Everything else carries over: draw it with trendlines, measure its height, project that height from wherever it breaks. Treat the breakout direction as the only genuinely new information — never assumed in advance from the shape.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'HDFCBANK.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'Look for a stretch where the daily range visibly narrows after a strong move. That narrowing is what a triangle or flag is drawn around — see if you can find one, and notice how it eventually broke.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'The trend does not have to resume',
      md:
        '"Continuation" is the name of the folklore, not a guarantee written into the shape. A triangle can break either way, and plenty of them break against the prior trend.\n\nAs with the reversal shapes in the last lesson, this course does not report a base rate for triangles and flags. The same reason applies: the lines are drawn by eye, and a detector precise enough to score it would be inventing a precision the tool does not actually have.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'A continuation pattern has a base height of ₹25 and breaks DOWN through the lower trendline at ₹410. What is the measured-move target?',
          type: 'compute',
          spec: { metric: 'literal', value: 385, tolerance: 3, unit: '₹' },
          explanation:
            '₹410 − ₹25 = ₹385. Same formula as an upward breakout, just projected downward from the breakout price instead of upward.',
        },
        {
          prompt: 'Classify each statement about continuation patterns.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'The measured-move target is the base height projected from the breakout', category: 'Supported by the mechanism' },
              { label: 'A symmetrical triangle is guaranteed to break in the direction of the prior trend', category: 'Folklore' },
              { label: 'The breakout direction is the pattern’s only genuinely new information', category: 'Supported by the mechanism' },
              { label: 'A flag is simply a triangle with a different name', category: 'Folklore' },
            ],
          },
          explanation:
            'A flag’s lines run roughly parallel rather than converging, which is a real geometric difference, not just a naming choice. The "guaranteed" claim is the one to watch for anywhere in technical analysis — a shape can bias a probability without guaranteeing an outcome, and the two get conflated constantly.',
        },
        {
          prompt: 'Price is consolidating in a narrowing range after a strong rally. What should you actually wait for before assuming the rally resumes?',
          type: 'decision',
          spec: {
            options: [
              'Nothing — continuation is guaranteed by the pattern’s name',
              'The actual breakout, in either direction, before assuming anything',
              'Ten trading days passing, regardless of price',
            ],
            correct: 'The actual breakout, in either direction, before assuming anything',
          },
          explanation:
            'The breakout itself. Everything before it is a shape with a name and a folklore attached, and the folklore has a direction baked into it that the geometry does not actually guarantee.',
        },
      ],
    },
  ],
};

export default lesson;
