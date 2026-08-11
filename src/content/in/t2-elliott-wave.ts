import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — Elliott wave
 *
 * Every earlier lesson in this stage has admitted a degree of subjectivity
 * and still landed on real arithmetic underneath (a slope, a retracement
 * percentage, a measured-move target). Elliott wave is the sharpest version
 * of the problem: it has genuine rules, and the rules still do not pin down
 * a single count. That is not presented as a debunking. It is presented as
 * exactly what it is — a real, rule-constrained framework whose rules are
 * loose enough that two trained readers can label the same chart two
 * different ways and both be following them correctly.
 */
export const lesson: Lesson = {
  id: 'in-t2-elliott-wave',
  tier: 'T2',
  market: 'IN',
  title: 'Elliott wave: the count nobody can agree on',
  summary:
    'Five waves with the trend, three against it, each one built from the same pattern at a smaller scale. The rules are real. They still leave more than one legal way to label the same chart.',
  plainSummary:
    'Some traders label price swings with numbers, claiming a repeating five-and-three pattern. This shows the real rules behind that labelling, and why two people can follow the same rules and disagree.',
  objectives: [
    'Describe the five-wave impulse and three-wave correction structure',
    'State the wave-2 and wave-4 rules that actually constrain a count',
    'Check whether a proposed wave count is legal under those rules',
    'Explain why a completed count is not evidence that the method predicted anything',
  ],
  prerequisites: ['in-t2-continuation-patterns'],
  estimatedMinutes: 15,
  introduces: ['elliott-wave'],
  skills: ['elliott-wave', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A chart shows five up-legs followed by three down-legs. One analyst labels it a complete 1-2-3-4-5-A-B-C cycle. A second, equally trained analyst labels the final leg differently. What does that tell you?',
      options: [
        'One of them is simply wrong, and it can be shown',
        'Both labellings can be internally consistent with the rules — the chart alone does not decide between them',
        'Elliott wave only works on weekly charts, which is why they disagree',
      ],
      correct: 1,
      reveal:
        'Both can be legitimate. Elliott wave has real rules, covered in this lesson, and they rule some counts out entirely. What they do not do is force a single unique labelling onto a given chart. A swing that looks like the end of wave 5 to one reader can look like wave 3 of a larger, still-unfolding move to another, and neither has broken a rule. That gap between "rule-following" and "unique" is the entire subject of this lesson.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Five and three, at every scale',
      md:
        'The claim is fractal: waves 1, 3 and 5 are each themselves built from a smaller five-wave move, and waves 2 and 4 from a smaller three-wave move. Zoom into any leg and, in theory, the same shape repeats.\n\nThat is also exactly why disagreement is built in rather than accidental. A single swing can honestly be read as wave 3 of a small degree, or as wave 1 of a larger one still forming. Both are legal until much later, when there is far more chart to look at.',
    },
    {
      kind: 'figure',
      figure: 'ElliottWaveFigure',
      props: {},
      caption:
        'Toggle between the two labellings. The price path never changes — only the count does, and both readings are legal under the rules.',
    },
    {
      kind: 'example',
      title: 'The two rules that actually constrain a count',
      setup:
        'Wave 1 runs from ₹500 to ₹560, a ₹60 move. Wave 2 pulls back, and wave 3 then runs up to ₹680. Someone proposes a wave 4 low of ₹610. Check whether that reading is legal.',
      steps: [
        {
          label: 'Wave 1: start and end',
          detail: 'The move the whole count is anchored to',
          value: '₹500 → ₹560',
        },
        {
          label: 'The hard rule on wave 2',
          detail: 'It must not trade below the start of wave 1',
          compute: { fn: 'literal', value: 500 },
        },
        {
          label: 'Wave 3 high',
          detail: 'Given, for this check',
          value: '₹680',
        },
        {
          label: 'The hard rule on wave 4',
          detail: 'It must not overlap wave 1’s territory — must not trade below ₹560',
          compute: { fn: 'literal', value: 560 },
        },
        {
          label: 'Is a proposed wave 4 low of ₹610 legal here',
          detail: '₹610 sits above ₹560, so this reading does not break the rule',
          value: 'legal',
        },
      ],
      conclusion:
        'These are genuine constraints, and they do rule some counts out. They still leave many different, rule-following counts standing — which is the actual problem this lesson is about.',
    },
    {
      kind: 'predict',
      prompt: 'Using the same rule from the example, would a proposed wave 4 low of ₹540 be a legal count?',
      options: [
        'Yes — ₹540 is still a reasonable-looking pullback',
        'No — it trades below wave 1’s high of ₹560, overlapping wave 1’s territory',
        'Yes, because wave 4 is allowed to go anywhere',
      ],
      correct: 1,
      reveal:
        '₹540 sits below wave 1’s high of ₹560, which breaks the no-overlap rule. This is a genuinely useful check: it will throw out some counts as flatly illegal. What it cannot do is tell you which of the remaining legal counts is the right one — that is a separate, much harder question the rule does not answer.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'INFY.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'Try to count five waves up on this real chart, then try again starting one leg later. Notice how many different, rule-following counts you can produce from the same data.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Why professionals still use it, carefully',
      md:
        'Real analysts do use Elliott wave, mostly as one input among several rather than a standalone timing tool — a narrative about crowd psychology laid over price, not a precise instruction.\n\nThis course does not claim it "works" or "does not work", the way it does for a candlestick pattern with a measurable base rate. A framework whose rules permit more than one reading of the same chart is not something a simple detector can score. Pretending otherwise would be a worse dishonesty than admitting the limit.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'Wave 1 runs from ₹300 to ₹360. Under the wave-2 rule, what is the lowest price wave 2 is allowed to reach before the count is invalidated?',
          type: 'compute',
          spec: { metric: 'literal', value: 300, tolerance: 1, unit: '₹' },
          explanation:
            'Wave 2 must not trade below the start of wave 1, which is ₹300. Anything at or below that price breaks the rule and the count has to be redrawn from scratch.',
        },
        {
          prompt: 'Classify each statement about Elliott wave.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'Wave 2 must not retrace below the start of wave 1', category: 'Supported by the mechanism' },
              { label: 'The correct wave count is always obvious in real time', category: 'Folklore' },
              { label: 'A legal count can still turn out to be the wrong read of what happens next', category: 'Supported by the mechanism' },
              { label: 'Two trained analysts will always agree on the count', category: 'Folklore' },
            ],
          },
          explanation:
            'A count passing the wave-2 and wave-4 rules only means it has not been ruled out. It says nothing about whether price will actually do what that count implies next — those are two entirely different claims, and Elliott wave discussion routinely blurs them.',
        },
        {
          prompt: 'You are shown a completed 1-2-3-4-5 count on a chart, offered as proof the method predicted the top. What is the honest read?',
          type: 'decision',
          spec: {
            options: [
              'The count is proof the method works',
              'The count is one of several legal readings, chosen after the move had already happened',
              'Elliott wave has no rules at all, so this proves nothing either way',
            ],
            correct: 'The count is one of several legal readings, chosen after the move had already happened',
          },
          explanation:
            'Chosen with hindsight. A count drawn after the fact, on a chart with an obvious top already visible, is a very different achievement from calling that top before it happened. Almost every "the method predicted this" example online is the first kind, presented as the second.',
        },
      ],
    },
  ],
};

export default lesson;
