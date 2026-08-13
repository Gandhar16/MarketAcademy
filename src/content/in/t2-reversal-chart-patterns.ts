import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — head and shoulders, double top, double bottom
 *
 * Candlestick patterns are a few-bar boolean rule — testable against real
 * base rates, which stage 5 already does. A multi-week chart SHAPE is not:
 * two competent chartists will place the peaks and the neckline a little
 * differently on the same chart, so a hard detector reporting a base rate
 * here would claim more precision than the tool actually has. The honest
 * lesson is the mechanism, the arithmetic of the measured-move target, and
 * an explicit statement of where the confirmation actually lives — which is
 * the neckline break, never the shape alone.
 */
export const lesson: Lesson = {
  id: 'in-t2-reversal-chart-patterns',
  tier: 'T2',
  market: 'IN',
  title: 'Head and shoulders, double tops and double bottoms',
  summary:
    'Three peaks, or two. The shape is easy to see once it has finished forming — the neckline break is what actually confirms it, and a measured-move target is pure arithmetic on the height of the shape.',
  plainSummary:
    'These are named shapes people spot on a chart and treat as a sign a trend is ending. This shows what actually confirms one, and where the price target it implies comes from.',
  objectives: [
    'Describe the anatomy of a head and shoulders and a double top or bottom',
    'Explain why a reversal shape needs an established prior trend to mean anything',
    'Explain why the neckline break, not the shape, is the actual confirmation',
    'Read the volume pattern that adds real weight to a shape, or takes it away',
    'Compute a measured-move target from the height of a shape',
  ],
  prerequisites: ['in-t2-fibonacci'],
  estimatedMinutes: 18,
  introduces: ['neckline', 'head-and-shoulders', 'double-top', 'measured-move'],
  skills: ['chart-patterns', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A chart forms three peaks: a tall one in the middle, two shorter ones on either side, roughly level with each other. Traders call this a head and shoulders. A warning of what?',
      options: [
        'The stock is definitely about to fall',
        'A rising trend running out of strength — IF price then closes below the neckline',
        'Nothing. Three peaks like this happen constantly by chance',
      ],
      correct: 1,
      reveal:
        'That "if" is the entire lesson. The three peaks are just a shape, and shapes like this appear on real charts all the time without meaning anything. What the pattern actually claims is conditional: a rising trend running out of strength, confirmed only if price then closes back below the neckline, the line drawn under the two troughs. Plenty of "head and shoulders" shapes never get that confirmation and simply keep rising. The shape by itself is not the signal.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'The exact same three-peak shape shows up twice: once at the top of a six-month rally, once in the middle of a flat, directionless month with no trend at all. Which one is actually worth calling a head and shoulders?',
      options: [
        'Both — the shape is the shape, wherever it forms',
        'Only the one after the rally — there is no established trend to reverse in the flat case',
        'Neither — three peaks never mean anything either way',
      ],
      correct: 1,
      reveal:
        'Only the one after the rally. The pattern’s entire claim is that a trend is running out of strength — and a trend has to exist first for that claim to mean anything. Three peaks in a flat, aimless month are not a rising trend ending, because there was no rising trend to begin with. The same shape, the same neckline, the same measured-move arithmetic all still work mechanically in the flat case. They just are not answering a real question, because the question — is this trend ending — never had a trend behind it.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'NecklineExplainer',
      props: {},
      takeaway:
        'Step through it once. The peaks form long before anything is confirmed — watch for the moment the line itself actually breaks.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The neckline is the trigger, not the peaks',
      md:
        'The three peaks form gradually and are easy to spot with hindsight. The **neckline** is what you actually watch in real time — the line under the two troughs between the peaks.\n\nA close back above the neckline usually cancels the setup entirely. Turned upside down, on three troughs instead of three peaks, the same shape is called inverse head and shoulders, read as a falling trend running out of strength. Two peaks instead of three is a double top; two troughs is a double bottom. All four share the same rule: the neckline break is the confirmation, not the shape.',
    },
    {
      kind: 'figure',
      figure: 'ChartPatternFigure',
      props: { pattern: 'head-shoulders' },
      caption: 'Three peaks, a neckline under the two troughs, and the measured-move target projected below it once the neckline breaks.',
    },
    {
      kind: 'example',
      title: 'Computing the measured-move target',
      setup:
        'A head and shoulders forms with the head peaking at ₹1,480, the neckline at ₹1,320, and price closing below the neckline at ₹1,310.',
      steps: [
        {
          label: 'Height of the head above the neckline',
          detail: '₹1,480 minus ₹1,320 — the whole shape reduces to this one number',
          compute: { fn: 'literal', value: 160 },
        },
        {
          label: 'Measured-move target below the breakout',
          detail: 'The same height, projected downward from the breakout close',
          compute: { fn: 'literal', value: 1150 },
        },
        {
          label: 'The target as a share of the breakout price',
          detail: 'How far the projection actually reaches',
          compute: { fn: 'spanPercent', high: 1310, low: 1150, reference: 1310, dp: 1 },
        },
        {
          label: 'What actually happened at ₹1,310',
          detail: 'A close below the neckline — this is the confirmation, not the three peaks',
          value: 'confirmed',
        },
      ],
      conclusion:
        'The measured move is arithmetic on a shape you already drew. The discipline is waiting for the neckline close before treating the projection as more than a hypothesis.',
    },
    {
      kind: 'predict',
      prompt:
        'A double top forms with both peaks near ₹960 and the neckline — the dip between them — at ₹890. Price closes at ₹880. Roughly where does the measured-move target sit?',
      options: [
        'Around ₹810, the same distance below ₹880 as the peak was above ₹890',
        'Around ₹890, right at the neckline',
        'It cannot be computed without knowing the exact date the peaks formed',
      ],
      correct: 0,
      reveal:
        '₹960 − ₹890 = ₹70 of height. Project that same ₹70 below the ₹880 breakout: ₹880 − ₹70 = ₹810. Same formula as the head-and-shoulders example, just measured off two peaks instead of three. The date the peaks formed changes nothing about the arithmetic — only the height and the breakout price matter.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'ChartPatternFigure',
      props: { pattern: 'double-top' },
      caption: 'Two peaks near the same height, a neckline at the dip between them, and the same measured-move arithmetic as head and shoulders.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The volume tell, from the classic source',
      md:
        'This family of shapes was formalised by Robert Edwards and John Magee in *Technical Analysis of Stock Trends* (1948), and their volume observation still holds up as a real, checkable pattern.\n\nIn a genuine head and shoulders, volume tends to run highest on the left shoulder, lower on the head, lowest on the right shoulder. Buying interest fades each peak, even as price makes new highs. A double top shows the same fade: the second peak typically trades lighter than the first.\n\nThe other half of the tell is the breakout. A neckline break on a real volume surge reads as far more convincing than one on quiet volume — many participants agreeing, versus a shape breaking on almost nobody trading it.',
    },
    {
      kind: 'predict',
      prompt:
        'Two head and shoulders formations look identical in shape. Formation A has clearly declining volume across the three peaks and a volume surge on the neckline break. Formation B has flat, unremarkable volume throughout, including on the breakout. Which is the more trustworthy reversal signal?',
      options: [
        'Both equally — volume adds nothing once the shape is confirmed by the neckline break',
        'Formation A — the fading peaks and the breakout surge are real, corroborating evidence, not just the shape',
        'Formation B — quiet volume means the move is more sustainable',
      ],
      correct: 1,
      reveal:
        'Formation A. The declining volume into each peak is a real sign that buyers are running out of conviction even as price keeps climbing. That is exactly what a topping trend running out of strength should look like. A neckline break on a volume surge means many participants agreed at once, rather than the price drifting through the line on light activity that could reverse just as easily. Neither volume pattern GUARANTEES anything — the same limit every tool in this stage runs into. But Formation A has two pieces of real, corroborating evidence behind it, and Formation B has only the shape.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A head and shoulders forms with a small left shoulder and a much taller right shoulder. Does the asymmetry invalidate the pattern?',
      options: [
        'Yes — the two shoulders must be roughly the same height for the pattern to count',
        'No — the core requirement is a taller head between two lower peaks, not matching shoulder heights',
        'Yes, because unequal shoulders mean the neckline cannot be drawn',
      ],
      correct: 1,
      reveal:
        'No. The defining requirement is a head clearly taller than both surrounding peaks, with a neckline under the two troughs. The shoulders rarely match exactly in real charts. Reasonable asymmetry does not disqualify the shape — the neckline break is still what confirms it.',
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
      title: 'Why this stage does not report a base rate here',
      md:
        'Candlestick patterns are a few-bar rule a computer can score against thousands of real bars, which is exactly what the earlier pattern-catalogue lesson does.\n\nA multi-week shape like this is not. Two competent chartists will place the peaks and the neckline a little differently on the same chart, so any single detector would report false precision. That is not a gap this course is hiding. It is the honest difference between a rule and a judgement call, worth remembering whenever someone quotes a win rate for one of these shapes.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A trader dismisses a head and shoulders because the right shoulder is noticeably taller than the left. Decide whether that reasoning is sound.',
          type: 'decision',
          spec: {
            options: [
              'Sound — the shoulders must match for the pattern to be valid',
              'Not sound — the core requirement is a taller head, and shoulder asymmetry alone does not disqualify it',
              'Sound, but only on weekly charts',
            ],
            correct: 'Not sound — the core requirement is a taller head, and shoulder asymmetry alone does not disqualify it',
          },
          explanation:
            'Not sound. A taller head between two lower peaks is the requirement, and the neckline break is still the confirmation. Minor asymmetry between the shoulders is ordinary.',
        },
        {
          prompt:
            'A head and shoulders has its head at ₹2,240, its neckline at ₹2,080, and closes at ₹2,070 on the breakout. What is the measured-move target?',
          type: 'compute',
          spec: { metric: 'literal', value: 1910, tolerance: 5, unit: '₹' },
          explanation:
            'Height: ₹2,240 − ₹2,080 = ₹160. Target: ₹2,070 − ₹160 = ₹1,910. The same two-step calculation every time — height above the neckline, then that same distance projected past the breakout.',
        },
        {
          prompt: 'Classify each statement about these chart shapes.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'The measured-move target is the shape’s height projected from the breakout', category: 'Supported by the mechanism' },
              { label: 'Three peaks always means the trend is over', category: 'Folklore' },
              { label: 'A close back above the neckline usually cancels the setup', category: 'Supported by the mechanism' },
              { label: 'The pattern is confirmed the moment the third peak forms', category: 'Folklore' },
            ],
          },
          explanation:
            'The last row is the one people get backwards most often. Confirmation is the neckline break, not the shape being visible. A great many "head and shoulders" shapes form and then simply keep rising, because the shape alone was never the signal.',
        },
        {
          prompt: 'You spot what looks like a head and shoulders forming, but price has not closed below the neckline yet. What should you do?',
          type: 'decision',
          spec: {
            options: [
              'Act now — the shape is already visible',
              'Wait for the neckline close, because the shape alone is not confirmation',
              'Ignore it — three-peak shapes are always coincidence',
            ],
            correct: 'Wait for the neckline close, because the shape alone is not confirmation',
          },
          explanation:
            'Wait for the close. Acting on the shape alone means acting on something that fails to confirm surprisingly often. Ignoring it outright throws away the one part of the idea — the neckline break — that is at least an observable, specific event rather than a shape you are pattern-matching by eye.',
        },
        {
          prompt: 'A double top forms, but the second peak trades on noticeably HIGHER volume than the first. What does that most honestly suggest?',
          type: 'decision',
          spec: {
            options: [
              'Nothing — volume is irrelevant once the second peak has formed',
              'It weakens the classic reversal read, since buying conviction actually grew into the second peak rather than fading',
              'It guarantees the pattern will fail',
            ],
            correct: 'It weakens the classic reversal read, since buying conviction actually grew into the second peak rather than fading',
          },
          explanation:
            'Weakens, not guarantees a failure. The classic tell is FADING volume into the second peak. Rising volume there is the opposite of what a topping pattern is supposed to show — a real reason for caution, not proof the pattern will fail outright. As with every volume observation in this lesson, it shifts how much weight to put on the shape rather than deciding the outcome by itself.',
        },
      ],
    },
  ],
};

export default lesson;
