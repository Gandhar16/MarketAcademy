import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Technician's toolkit — ADX and trend strength
 *
 * The trend lesson (`in-t2-trend`) taught DIRECTION: higher highs and higher
 * lows, or the opposite. ADX answers a different question entirely — not
 * which way, but how HARD. A market can trend up, trend down, or go
 * nowhere, and ADX cannot tell the first two apart on its own. That single
 * fact, stated plainly and checked against a worked calculation, is the
 * whole lesson.
 */
export const lesson: Lesson = {
  id: 'in-t2-adx-trend-strength',
  tier: 'T2',
  market: 'IN',
  title: 'ADX: telling a trend from a chop',
  summary:
    'ADX rises when a market trends hard, in EITHER direction, and falls when it goes nowhere. It cannot tell an uptrend from a downtrend by itself — that is a different question, answered by a different pair of numbers.',
  plainSummary:
    'This number measures how strongly a market is trending, without saying which way. This shows what actually drives it, and why a rising ADX during a downtrend is not a bullish signal.',
  objectives: [
    'Explain what ADX measures, and what it deliberately does not',
    'Compute a single day\'s directional movement from a real high/low pair',
    'Say why +DI and -DI, not ADX itself, carry the direction',
    'Decide what a rising ADX during a decline actually means',
  ],
  prerequisites: ['in-t2-trend'],
  estimatedMinutes: 16,
  introduces: ['adx'],
  skills: ['adx', 'trend-strength', 'chart-reading'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A stock is in a strong, sustained downtrend. Its ADX reading is high and rising. What does that rising ADX actually mean?',
      options: [
        'The downtrend is about to reverse upward',
        'The trend — in whichever direction it is already moving — is strong, and getting stronger',
        'ADX cannot be computed during a downtrend',
      ],
      correct: 1,
      reveal:
        'The trend is strong and strengthening, full stop — ADX does not know or say which direction that trend runs. It is built to measure conviction, not direction. A hard-falling market registers exactly the same rising ADX a hard-rising one would. Reading a rising ADX as automatically bullish is one of the most common mistakes made with this indicator, and it comes from forgetting what ADX was actually built to answer.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'AdxDirectionExplainer',
      props: {},
      takeaway:
        'Step through it once. The ADX line is drawn identically under both trends — that is the whole lesson in one shape.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'One more tool from the same 1978 book',
      md:
        'ADX comes from the same source as RSI and ATR — J. Welles Wilder Jr.\'s 1978 book *New Concepts in Technical Trading Systems*, which also introduced Parabolic SAR. It is built from **+DI** and **−DI**: how much of today\'s range extended upward versus downward, smoothed over time.\n\n**+DI rising above −DI** carries the direction — an uptrend gaining strength. **ADX itself** is built from the GAP between +DI and −DI, regardless of which one is on top, which is exactly why it cannot tell you which side is winning. Direction lives in +DI/−DI. Strength lives in ADX. They are two different questions, answered by different numbers from the same calculation.',
    },
    {
      kind: 'example',
      title: 'A single day\'s directional movement, computed',
      setup:
        'Yesterday\'s high was ₹500, low ₹488. Today\'s high is ₹512, low ₹495. Directional movement compares how far each side of the range extended versus yesterday.',
      steps: [
        { label: '+DM — today\'s high minus yesterday\'s high', detail: '512 − 500', compute: { fn: 'literal', value: 12 } },
        { label: '−DM — yesterday\'s low minus today\'s low', detail: '488 − 495 (a negative number counts as zero)', value: '0' },
        { label: 'Which side won today', detail: 'Only the larger, positive one counts for the day', value: '+DM = 12' },
        { label: 'What this one day says about direction', detail: 'Upward extension dominated — a single day\'s data point toward +DI, not −DI', value: 'upward' },
      ],
      conclusion:
        'A real ADX reading smooths many days of exactly this comparison. One day tells you almost nothing on its own — the same lag every averaged indicator in this course carries.',
    },
    {
      kind: 'predict',
      prompt:
        'Same stock, but today\'s high only reaches ₹503 (a small ₹3 push) while the low falls hard to ₹470. Recompute which side wins today.',
      options: [
        '+DM still wins, since the market touched a higher price today than yesterday',
        '−DM wins — the low fell further below yesterday\'s low than the high rose above yesterday\'s high',
        'They cancel out to zero',
      ],
      correct: 1,
      reveal:
        '−DM wins. +DM = 503 − 500 = 3. −DM = 488 − 470 = 18. Eighteen beats three, so downward movement dominates today, even though the market still technically ticked to a marginally higher high. The trap is assuming "made a new high" automatically means +DM wins. What actually counts is how FAR each side extended past yesterday\'s same side, and here the down move dwarfs the up move.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'ADX has sat below 15 for two months (a long chop) and has just turned up sharply to 22. Does the sharp rate of that turn tell you how big the eventual move will be?',
      options: [
        'Yes — a sharp ADX turn always means a huge move is coming',
        'Not reliably — ADX confirms a trend has started strengthening, but carries no information about how far it will run',
        'No — ADX turning up after a chop is meaningless noise',
      ],
      correct: 1,
      reveal:
        'Not reliably. ADX rising confirms that directional movement is currently dominating over chop, which is genuinely useful. It was never built to size the move ahead — a different question entirely, the same gap between "is this real" and "how far does it go" that runs through this stage.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'TCS.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'Find a stretch that trends hard and a stretch that chops sideways doing nothing. ADX is the number that would tell those two apart without you eyeballing it. Direction, separately, is what the trend lesson already taught you to read from the highs and lows themselves.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: '"ADX above 25" is folklore doing the same thing 70/30 did for RSI',
      md:
        'A common rule of thumb treats ADX above 25 as "trending" and below 20 as "choppy". Like RSI\'s 70/30, this is a round number that became convention rather than a law the market obeys.\n\nADX also LAGS, for the same reason every averaged indicator in this course does — it is built from smoothed data. That means it confirms a trend is already underway rather than announcing one at its start. Waiting for ADX to cross 25 means waiting until a meaningful part of the move has already happened.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'After two months of low, flat ADX, the reading turns up sharply. A trader assumes this guarantees an unusually large move is starting. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Reasonable — a sharp ADX turn is a size prediction',
              'Not reasonable — ADX confirms a trend is strengthening, but says nothing about how large it will eventually be',
              'Reasonable, but only above ADX 25',
            ],
            correct:
              'Not reasonable — ADX confirms a trend is strengthening, but says nothing about how large it will eventually be',
          },
          explanation:
            'Not reasonable. ADX answers whether directional movement currently dominates, not how large the eventual move will be.',
        },
        {
          prompt: 'Yesterday\'s high was ₹640, low ₹620. Today\'s high is ₹655, low ₹610. Which side wins today\'s directional movement, and by how much?',
          type: 'compute',
          spec: { metric: 'literal', value: 15, tolerance: 1, unit: '₹' },
          explanation:
            '+DM = 655 − 640 = 15. −DM = 620 − 610 = 10. The larger of the two is +DM at ₹15, so upward movement wins today — the same comparison as the lesson\'s worked example, just with both sides genuinely competing this time.',
        },
        {
          prompt: 'Classify each statement about ADX.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'ADX rises during a strong downtrend, not just a strong uptrend', category: 'Supported by the mechanism' },
              { label: 'A rising ADX is automatically a bullish signal', category: 'Folklore' },
              { label: 'Direction is carried by +DI and −DI, not by ADX itself', category: 'Supported by the mechanism' },
              { label: 'ADX crossing 25 marks the exact start of a new trend', category: 'Folklore' },
            ],
          },
          explanation:
            'ADX measures conviction, not direction, and it is built from smoothed data, so it confirms strength after a trend is already underway rather than flagging the start of one.',
        },
        {
          prompt: 'ADX has been rising for two weeks while price has been falling hard the whole time. What is the honest read?',
          type: 'decision',
          spec: {
            options: [
              'The stock is about to reverse upward, since ADX is rising',
              'The downtrend is strengthening — ADX rising says nothing about a reversal',
              'ADX has malfunctioned, since it should only rise in uptrends',
            ],
            correct: 'The downtrend is strengthening — ADX rising says nothing about a reversal',
          },
          explanation:
            'A strengthening downtrend, read correctly. ADX rises for a strong move in either direction. Reading a rising ADX as bullish regardless of which way price is actually moving is exactly the mistake the lesson opened with.',
        },
      ],
    },
  ],
};

export default lesson;
