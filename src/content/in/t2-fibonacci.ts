import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — Fibonacci retracement and extension
 *
 * Fibonacci retracement inherits the trendline lesson's honesty problem and
 * sharpens it: the levels are exact-looking numbers, computed to one decimal
 * place, derived from exactly two inputs a human chose by eye. The precision
 * of the arithmetic is real. The precision it implies about the anchors is
 * not. This lesson teaches the mechanism, computes the grid from real
 * numbers, and is explicit that 50% — the level most people watch — is not
 * even part of the Fibonacci sequence.
 */
export const lesson: Lesson = {
  id: 'in-t2-fibonacci',
  tier: 'T2',
  market: 'IN',
  title: 'Fibonacci retracement and extension',
  summary:
    'Anchor a swing low and a swing high, and a grid of exact-looking levels appears. The arithmetic is fixed. The two points you chose to anchor it on are not.',
  plainSummary:
    "Traders draw a grid of price levels between a big move's start and end, and treat some of them as likely pause points. This shows where those numbers actually come from, and how little it takes to shift every one of them.",
  objectives: [
    'Compute a retracement level from a swing low, a swing high and a percentage',
    'Explain why the grid has exactly two inputs and nothing else',
    'Say why the 50% level is on every chart despite not being a Fibonacci ratio',
    'Explain why two traders anchoring the same rally usually get different levels',
  ],
  prerequisites: ['in-t2-trendlines'],
  estimatedMinutes: 14,
  introduces: ['fibonacci-retracement'],
  skills: ['fibonacci', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A stock rallies from ₹1,000 to ₹1,200 and pulls back. Traders start watching ₹1,124 as a likely level to buy. Where does ₹1,124 come from?',
      options: [
        'A round number near the middle of the move',
        '38.2% of the ₹200 rally, retraced down from the high',
        'The average of the 50-day and 200-day moving averages',
      ],
      correct: 1,
      reveal:
        '₹1,200 − (0.382 × ₹200) = ₹1,123.60, rounded to ₹1,124. That is the entire calculation. It is not a round number, and it has nothing to do with moving averages — it is one fixed percentage applied to one measured move. The whole appeal of Fibonacci retracement is that this looks precise. It is precise, in the same sense that multiplying two numbers correctly is precise. Whether the two numbers being multiplied deserve that much trust is a separate question, and the rest of this lesson is about that question.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Exactly two inputs',
      md:
        'A retracement grid needs a swing low and a swing high, and nothing else. Every level on it is that swing high minus a fixed percentage of the range between the two.\n\nThat means the entire grid lives or dies on two choices a human made by eye. Move either anchor a few rupees and every single level moves with it, by exactly the same percentage each time.',
    },
    {
      kind: 'figure',
      figure: 'FibonacciFigure',
      props: {},
      caption:
        'Anchor a swing low and a swing high, and the grid draws itself. The arithmetic is fixed. The two anchors are a judgement call — press replay and watch how much of the figure depends on just those two points.',
    },
    {
      kind: 'example',
      title: 'Computing the grid from real numbers',
      setup:
        'A stock rallies from a swing low of ₹840 to a swing high of ₹1,040, a ₹200 move. Here is where the standard levels actually sit.',
      steps: [
        {
          label: '23.6% retracement',
          detail: 'High minus 23.6% of the ₹200 range',
          compute: { fn: 'literal', value: 992.8 },
        },
        {
          label: '50% retracement',
          detail: 'Not a Fibonacci ratio at all — it is here because traders watch it',
          compute: { fn: 'literal', value: 940 },
        },
        {
          label: '61.8% retracement',
          detail: 'The ratio most associated with the whole idea',
          compute: { fn: 'literal', value: 916.4 },
        },
        {
          label: '161.8% extension, beyond the high',
          detail: 'A target if the move keeps going rather than pausing at the swing high',
          compute: { fn: 'literal', value: 1163.6 },
        },
      ],
      conclusion:
        'Every one of these numbers came from exactly two inputs. Change either anchor by a few rupees and the whole grid moves with it.',
    },
    {
      kind: 'predict',
      prompt:
        'Same stock, but you anchor the swing low at ₹850 instead of ₹840 — ten rupees most people would call close enough. Work out what happens to the 61.8% level.',
      options: [
        'Nothing — ten rupees will not move it noticeably',
        'It shifts by roughly six rupees, because the level is a percentage of that same input',
        'It becomes invalid and has to be redrawn from scratch',
      ],
      correct: 1,
      reveal:
        'Roughly six rupees. The range shrinks from ₹200 to ₹190, so 61.8% of it is ₹117.42 instead of ₹123.60 — a ₹6.18 shift in the level from a ten-rupee change in one anchor. Nothing is "invalid"; the arithmetic still works perfectly. That is precisely the problem. The grid happily produces a clean, confident-looking number from almost any two points you feed it. It gives you no way to tell a good anchor from a careless one.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'TCS.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'Find the largest rally on this real chart and imagine anchoring a grid to it. Two people looking at the same chart would likely pick two different swing points, and each would get a full page of confident-looking numbers.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'Why the levels sometimes seem to work anyway',
      md:
        'Enough traders watch the same round percentages that orders genuinely cluster near them. That can make price pause there, not because of a law of markets, but because a crowd is watching the same number.\n\nThat is a real effect and a limited one. It says a WATCHED level can matter a little. It does not say which level on your grid is worth watching. It does not make the grid more accurate than any other popular way of picking a number.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: "A stock's swing low is ₹500 and swing high is ₹700. Where does the 38.2% retracement sit?",
          type: 'compute',
          spec: { metric: 'literal', value: 623.6, tolerance: 1, unit: '₹' },
          explanation:
            '₹700 − (0.382 × ₹200) = ₹623.60. The same formula every time: swing high minus a fixed percentage of the range. Nothing about a specific stock or a specific day changes the arithmetic — only the two anchors do.',
        },
        {
          prompt: 'Classify each statement about Fibonacci retracement.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'The retracement price is the swing high minus a fixed percentage of the range', category: 'Supported by the mechanism' },
              { label: '50% belongs to the actual Fibonacci sequence', category: 'Folklore' },
              { label: 'Moving either anchor shifts every level in the grid', category: 'Supported by the mechanism' },
              { label: 'A level holds because of a mathematical law of markets', category: 'Folklore' },
            ],
          },
          explanation:
            'The 50% row is the sharpest myth here: it is on every chart, and it simply is not one of the ratios the sequence produces. It survives because traders watch it, which is a fact about crowds, not about mathematics.',
        },
        {
          prompt:
            'Two traders draw a Fibonacci grid on the same rally and end up with retracement levels four rupees apart. What does that most likely tell you?',
          type: 'decision',
          spec: {
            options: [
              'One of them made an arithmetic mistake',
              'They anchored on slightly different swing points, and the whole grid moved with it',
              'Fibonacci retracement has been proven wrong on this stock',
            ],
            correct: 'They anchored on slightly different swing points, and the whole grid moved with it',
          },
          explanation:
            'Different anchors, same correct arithmetic. A four-rupee gap between two careful traders is not a bug in the tool. It is what the tool does whenever two people eyeball a swing high or low slightly differently, which is most of the time.',
        },
      ],
    },
  ],
};

export default lesson;
