import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — trendlines
 *
 * The support/resistance lesson already made the case that a level is orders
 * in the book, not magic. A trendline is the same idea tilted: instead of a
 * horizontal band, it is a diagonal one, and it inherits every honesty
 * problem a horizontal level has plus one of its own — two points ALWAYS make
 * a line, so drawing one proves nothing by itself. The third touch is where
 * the proof would have to come from, and even that is read after the fact.
 */
export const lesson: Lesson = {
  id: 'in-t2-trendlines',
  tier: 'T2',
  market: 'IN',
  title: 'Drawing a trendline that means something',
  summary:
    'Two swing points always make a line. A third touch is what turns that line into something worth paying attention to — and even then, two chartists rarely draw it in the same place.',
  plainSummary:
    'Traders draw lines through chart highs and lows and act as if price will respect them. This shows how that line actually gets drawn, and why two people rarely draw it the same way.',
  objectives: [
    'Draw a trendline through two swing points and explain why that alone proves nothing',
    'Say what a third touch adds that the first two points could not',
    'Recompute where a rising or falling trendline sits before using it as a stop level',
    'Explain why a trendline drawn after a move looks more obvious than it would have in real time',
  ],
  prerequisites: ['in-t2-support-resistance'],
  estimatedMinutes: 14,
  introduces: ['swing-point', 'trendline'],
  skills: ['trendlines', 'chart-reading', 'stop-placement'],
  blocks: [
    {
      kind: 'predict',
      prompt: 'You draw a straight line through two swing lows on a chart. What have you actually created?',
      options: [
        'A rule the market has to obey from here on',
        'A hypothesis, confirmed only if a third touch respects it',
        'Nothing at all until the line is eventually broken',
      ],
      correct: 1,
      reveal:
        'A hypothesis. Any two points on a page can be joined by a line — that is geometry, not evidence about the market. What turns a trendline into something worth watching is a THIRD point that respects it without you having chosen it to fit. The third answer goes too far the other way: the line can be genuinely useful while it holds, it just has not earned that yet with only two points behind it. The whole discipline is not drawing it, it is waiting to see if it is confirmed.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two points always make a line',
      md:
        'This is the trap a trendline sets that a horizontal support zone does not. A **swing point** requires nothing more than a high or low surrounded by smaller ones, and any chart has dozens of them.\n\nPick two that happen to line up and you can draw something that LOOKS like a trend. That is why the confirming touch matters so much more than the first two points do. It is the only part of the process you did not choose in advance.',
    },
    {
      kind: 'figure',
      figure: 'TrendlineFigure',
      props: {},
      caption:
        'Two swing lows, a line drawn through them, and the touch that actually confirms it. Press replay and watch how little the first two points alone tell you.',
    },
    {
      kind: 'example',
      title: 'A trendline is a moving target',
      setup:
        'A rising trendline drawn through two swing lows sits at ₹1,180 today and climbs ₹2.50 a day. The stock trades at ₹1,214, and its ATR is ₹19.',
      steps: [
        {
          label: 'Where the trendline sits today',
          detail: 'Read straight off the line you drew, not off the current price',
          value: '₹1,180',
        },
        {
          label: 'Where it will sit five trading days from now',
          detail: 'The slope keeps moving whether you update it or not',
          compute: { fn: 'literal', value: 1192.5 },
        },
        {
          label: 'A stop placed exactly on the line',
          detail: 'Sits inside the ordinary wobble this stock makes most days',
          value: '₹1,180',
        },
        {
          label: 'A stop below the line, with ATR room',
          detail: 'Line minus one ATR — the same idea as a support zone',
          compute: { fn: 'literal', value: 1161 },
        },
      ],
      conclusion:
        'A trendline is a moving target, not a fixed price. Recompute where it sits before using it, and give it the same ATR-sized room you would give a horizontal zone.',
    },
    {
      kind: 'predict',
      prompt: 'The same trendline gets touched a fourth time instead of a third. Does that make it more reliable?',
      options: [
        'Yes — more touches always means more reliable',
        'Not necessarily — each touch can consume some of the resting orders behind it',
        'No — a fourth touch means it is about to break',
      ],
      correct: 1,
      reveal:
        'Not necessarily, and this is the same finding the support/resistance lesson made about horizontal levels. Every touch is a test of the orders sitting near that price, and passing a test can spend some of the size that made the level hold. A line touched four times is not automatically stronger than one touched twice — it depends on what is actually left in the book, which a chart cannot show you directly.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'candle-sprint',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Hindsight draws a better line than you did',
      md:
        'Open any chart six months later and the trendline looks obvious — a clean diagonal, touched four or five times, impossible to miss.\n\nThat chart is not the one you were looking at in real time. Halfway through the move you had two points and a guess, not a confirmed line. The version that looks obvious afterward is drawn with information you did not have when it would have mattered.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt: 'A trendline sits at ₹640 today and rises ₹1.20 a day. Where does it sit 10 trading days from now?',
          type: 'compute',
          spec: { metric: 'literal', value: 652, tolerance: 1, unit: '₹' },
          explanation:
            '₹640 + (₹1.20 × 10) = ₹652. A trendline is arithmetic on a slope, and the number changes every session whether or not you redraw the line. Using a stale value from a week ago is a small, easy-to-miss way of misjudging where price actually is relative to the line.',
        },
        {
          prompt: 'Classify each statement about trendlines.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'Two points are enough to draw a line', category: 'Supported by the mechanism' },
              { label: 'Two points are enough to trust a line', category: 'Folklore' },
              { label: 'A confirming touch adds real information', category: 'Supported by the mechanism' },
              { label: 'The steeper the line, the more reliable it is', category: 'Folklore' },
            ],
          },
          explanation:
            'Steepness is a choice you made when picking which two points to connect, not a property of the market. A steep line is often just a line drawn through a sharper, more recent move — it says nothing about whether the next touch will hold.',
        },
        {
          prompt: 'Price approaches a trendline for the third time. What should decide whether you trust it here?',
          type: 'decision',
          spec: {
            options: [
              'Whether the line looks convincing on the chart',
              'Whether price actually respects it on this touch, live',
              'How many times it has already been touched',
            ],
            correct: 'Whether price actually respects it on this touch, live',
          },
          explanation:
            'The live touch is the only test that has not already happened. A line that "looks convincing" is a line you already believe, which is not evidence. And touch count, as the earlier predict showed, cuts both ways — more tests can mean less resting size behind the level, not more conviction that it will hold.',
        },
      ],
    },
  ],
};

export default lesson;
