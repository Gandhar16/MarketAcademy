import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — trend without hindsight
 *
 * The first lesson of the chart stage, and the one that sets the standard for
 * everything after it: a definition you could have applied AT THE TIME, or it
 * is not a definition.
 *
 * WHY THIS IS THE HARDEST IDEA IN THE STAGE
 *
 * Looking at a finished chart, the trend is obvious. That obviousness is the
 * problem — it is manufactured entirely by knowing what happened next, and it
 * feels exactly like skill. Nobody has ever looked at a completed chart and
 * failed to see the trend, and almost nobody can name it on the right-hand edge
 * where the money is made.
 *
 * So the lesson does two things prose cannot: it makes the learner commit to a
 * mechanical rule with numbers in it, and then it puts them in the replay game
 * where the future genuinely does not exist. The gap between those two
 * experiences IS the lesson.
 */
export const lesson: Lesson = {
  id: 'in-t2-trend',
  tier: 'T2',
  market: 'IN',
  title: 'Trend, without hindsight',
  summary:
    'On a finished chart the trend is obvious. On the right-hand edge it is not. Build a rule you could have applied at the time, then try it where the future is genuinely hidden.',
  plainSummary:
    'Looking back, it is easy to say a price was going up. This shows how to decide that while it is still happening, which is much harder.',
  objectives: [
    'State a trend rule precise enough that two people would agree on it',
    'Explain why a trend is only ever visible with a delay',
    'Say what a rule costs you at every turning point',
    'Apply a stated rule to bars you have not seen the end of',
  ],
  prerequisites: ['in-t1-reading-candles'],
  estimatedMinutes: 16,
  introduces: ['moving-average', 'support', 'resistance', 'candle', 'ohlc', 'atr', 'base-rate'],
  skills: ['trend', 'chart-reading', 'hindsight'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You are shown a chart of the last year and asked whether it was in an uptrend. You answer instantly and correctly. What does that prove about your ability to spot a trend?',
      options: [
        'That you can read charts well',
        'Almost nothing — the answer was visible only because the year had finished',
        'That the pattern was a strong one',
      ],
      correct: 1,
      reveal:
        'Almost nothing. Every chart in every book is a finished chart, and on a finished chart the trend is not a judgement — it is a description. The skill being tested is naming a trend on the right-hand edge, where the next bar does not exist yet, and that is a completely different task. This gap has a name in the research: the fluency illusion. Watching somebody else solve a problem, or seeing a solved one, produces the confident feeling of being able to do it, and no ability to do it.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'HindsightExplainer',
      props: {},
      takeaway:
        'Step through it once. The dashed line marks the right-hand edge — everything past it is exactly what a real trend rule cannot see yet.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A rule, or it is not a definition',
      md:
        '"Higher highs and higher lows" is the usual answer, and it is not yet usable. Higher than what? Over how many bars? How much higher?\n\nA usable rule has numbers in it. For example: **the 20-bar average is above the 50-bar average, and the price is above both.** Two people given the same chart and that rule will always agree.\n\nThat is the test. If your definition can be applied differently by two honest people, it is a feeling with vocabulary attached, and it cannot be tested at all.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'three-up-days', symbol: 'RELIANCE.NS' },
      takeaway:
        'Three rising bars is the simplest possible trend rule. Read what actually followed it on real history — this is the number, not the story.',
    },
    {
      kind: 'example',
      title: 'What a rule costs you at a turn',
      setup:
        'Take the rule above: buy when the fast average crosses above the slow one, sell when it crosses back. A share runs from ₹1,000 to ₹1,400 and back to ₹1,050. The averages need bars to react, so the signals arrive late at both ends. Here is the bill.',
      steps: [
        {
          label: 'The whole move, top to bottom',
          detail: 'What a perfect trader with tomorrow’s newspaper would have made',
          compute: { fn: 'literal', value: 400 },
        },
        {
          label: 'Where the rule actually bought',
          detail: 'The averages needed the move to happen before they could cross',
          value: '₹1,090',
        },
        {
          label: 'Where the rule actually sold',
          detail: 'And they needed the turn to happen before they crossed back',
          value: '₹1,310',
        },
        {
          label: 'What the rule captured',
          detail: 'The middle of the move, which is all any lagging rule can take',
          compute: { fn: 'literal', value: 220 },
        },
        {
          label: 'Costs on a round trip at this size',
          detail: 'Charged on every signal, including the ones that reverse immediately',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 1090, quantity: 90 },
        },
      ],
      conclusion:
        'The rule gave up 45% of the move to the lag, and it will do that at every single turn. That is the price of a definition you can apply at the time.',
    },
    {
      kind: 'predict',
      prompt:
        'You make the averages faster, so the signals arrive sooner. Work out both consequences before you look.',
      options: [
        'Less given up at turns, and more false signals in a flat market',
        'Less given up at turns, with no downside',
        'More given up at turns, and fewer false signals',
      ],
      correct: 0,
      reveal:
        'Less lag and far more false signals. This is the only trade-off in the whole subject and it cannot be optimised away. A faster rule reacts sooner to real turns and also to noise, because at the moment it fires there is no way to tell which it is looking at. A slower rule ignores the noise and hands back more of every genuine move. Anybody selling you a setting that avoids both has tested it on the same data they tuned it on, which is a mistake with its own lesson later in the course.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'Using your rule, a stock is in an uptrend on the daily chart and in a downtrend on the weekly chart, at the same moment. Which of the two is "the" real trend?',
      options: [
        'The weekly one, since it covers more time and should always take priority',
        'The daily one, since it is more responsive to what is happening now',
        'Neither is more real — trend is a property of the rule and the timeframe applied, not a single fact about the stock',
      ],
      correct: 2,
      reveal:
        'Neither is more real. A trend rule always answers a question about a specific timeframe, and the two timeframes can genuinely disagree. A daily rule and a weekly rule are looking at different windows of the same prices. There is no hidden "true" trend underneath both readings. The honest response is to say which timeframe you mean, every time, rather than asking which chart is right.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'A real year. Cover the right-hand third with your hand and decide the trend at that point — then uncover it and see what you would have decided next.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The three states, not two',
      md:
        'Most descriptions offer up and down. Real charts spend a great deal of their time in neither, and that third state is where trend rules lose money.\n\nIn a sideways market a crossover rule fires, reverses, fires again, and pays charges every time. The strategy has not stopped working — it is doing exactly what it was designed to do, in conditions it was not designed for.\n\nSo the useful question before applying any trend rule is not "which way" but **"is this a trend at all"**.',
    },
    {
      kind: 'game',
      game: 'chart-replay',
      config: {},
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A trader says a stock is "clearly in an uptrend" without mentioning a timeframe, while your own daily-chart rule says it is in a downtrend. Decide.',
          type: 'decision',
          spec: {
            options: [
              'They must be wrong, since your rule disagrees',
              'Ask which timeframe they mean — both readings can be correct on their own chart',
              'Average the two views and treat it as sideways',
            ],
            correct: 'Ask which timeframe they mean — both readings can be correct on their own chart',
          },
          explanation:
            'Ask the timeframe. A trend statement with no stated timeframe is not yet a checkable claim, and two people can both be right if they are describing different windows of the same prices.',
        },
        {
          prompt:
            'A move runs 500 points. Your rule enters 120 points after the bottom and exits 90 points before the top. What percentage of the move does it capture?',
          type: 'compute',
          spec: { metric: 'literal', value: 58, tolerance: 1, unit: '%' },
          explanation:
            '500 − 120 − 90 = 290 points captured, and 290 ÷ 500 is 58%. Every lagging rule has a number like this, and it is worth computing before you adopt one. It sets the bar honestly. Your strategy is not competing with the whole move — it is competing with 58% of it, less costs, less the losing signals in between.',
        },
        {
          prompt:
            'Sort each definition of an uptrend by whether two honest people would always agree on it.',
          type: 'classify',
          spec: {
            categories: ['Two people would agree', 'Open to interpretation'],
            items: [
              { label: 'The 20-bar average is above the 50-bar average', category: 'Two people would agree' },
              { label: 'Price is above its 200-day average', category: 'Two people would agree' },
              { label: 'The chart looks strong', category: 'Open to interpretation' },
              { label: 'It is making higher highs', category: 'Open to interpretation' },
            ],
          },
          explanation:
            '"Higher highs" is the surprising one, and it belongs in the second column until you say higher than WHICH high, measured over how many bars. Without that it is applied one way when you are already long and another way when you are not. A definition you can bend after the fact is not evidence about the market — it is a record of what you wanted to believe.',
        },
        {
          prompt:
            'Your trend rule has produced six losing signals in a row in a flat market. Decide what that tells you.',
          type: 'decision',
          spec: {
            options: [
              'The rule has stopped working and should be replaced',
              'The rule is behaving exactly as designed, in conditions it does not suit',
              'The market is broken',
            ],
            correct: 'The rule is behaving exactly as designed, in conditions it does not suit',
          },
          explanation:
            'It is working as designed. A trend rule in a sideways market produces a run of small losses, and that is not a malfunction — it is the cost that pays for catching the next real move. Replacing the rule after six losses is how people end up switching strategies at exactly the wrong moment, over and over, and concluding that nothing works. The useful response is to know in advance how long a bad run can last.',
        },
      ],
    },
  ],
};

export default lesson;
