import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — does this pattern actually work?
 *
 * The lesson that separates this course from every other technical-analysis
 * course. Rather than teaching patterns as though they work, it hands the
 * learner the tool to CHECK, run against real history, and lets the numbers say
 * what they say.
 *
 * The expected emotional arc is disappointment followed by relief: most of the
 * folklore is noise, and knowing that is worth more than another twenty
 * patterns. The point is not that technical analysis is worthless — it is that
 * a hit rate without a base rate is not evidence of anything.
 */
export const lesson: Lesson = {
  id: 'in-t2-does-this-pattern-work',
  tier: 'T2',
  market: 'IN',
  title: 'Does this pattern actually work?',
  summary:
    'Every course teaches you what a bullish engulfing means. None of them show you the hit rate — or the base rate it has to beat. Let’s check.',
  plainSummary:
    'Somebody tells you a chart pattern works 54% of the time. This shows you how to check that claim yourself, on real data, and why 54% is usually worth nothing at all.',
  objectives: [
    'State why a hit rate is meaningless without the base rate beside it',
    'Test a candlestick pattern against real history and read the verdict',
    'Recognise when a sample is too small to conclude anything',
    'Explain why a pattern that looks strong on one symbol usually is not',
  ],
  prerequisites: ['in-t0-order-book'],
  estimatedMinutes: 16,
  introduces: ['base-rate', 'statistical-significance', 'expectancy', 'backtest'],
  skills: ['base-rates', 'pattern-testing', 'statistical-scepticism'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A bullish engulfing candle appears. Over the next five days the stock closes higher 54% of the time. Is that an edge?',
      options: [
        'Yes — better than a coin flip',
        'No — I would need to know how often it rises anyway',
        'Yes, but only a small one',
      ],
      correct: 1,
      reveal:
        'You cannot possibly tell yet, and that is the entire lesson. The Indian market closes higher over any random five-day window roughly 53–55% of the time, because it has drifted upward for decades. A signal that "works" 54% of the time may be doing nothing whatsoever — you would have got the same result by buying on a day chosen because it was a Tuesday. The number that matters is the hit rate MINUS the base rate. Almost nobody who sells you a pattern will show you the second number, and now you know to ask for it.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'BaseRateExplainer',
      props: {},
      takeaway:
        'Step through it once. The two bars are nearly identical — the entire finding is the sliver of daylight between them.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'bullish-engulfing', symbol: 'RELIANCE.NS' },
      takeaway:
        'Real bars, five years, computed live. Change the pattern and the symbol. Look at the gap between the two bars, not the height of the first one.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'What the sample size is quietly doing',
      md:
        'A pattern that fires **eleven times** in five years and works on eight of them looks spectacular — 73%! It is also completely meaningless. Eleven coin flips land 8-heads about one time in ten by pure luck.\n\nThe widget refuses to give a verdict below thirty occurrences, and marks anything under two standard errors as noise. Those two guards remove most of the internet’s technical-analysis claims on their own.',
    },
    {
      kind: 'example',
      title: 'How to read one of these claims properly',
      setup:
        'Someone shows you a screenshot: bullish engulfing on NIFTY, 58 percent win rate over five days. Here is the sequence of questions that turns that into either evidence or nothing at all.',
      steps: [
        {
          label: '1. What is the base rate?',
          detail: 'How often is the market up over ANY five days? Indian equities drift upward, so this is well above half',
          value: 'about 53%',
        },
        {
          label: '2. What is the edge, then?',
          detail: '58 minus 53. The only number that describes the signal rather than the market',
          value: '+5 points',
        },
        {
          label: '3. How many occurrences?',
          detail: 'Fewer than 30 and there is no measurement at all, whatever the percentage says',
          value: 'must ask',
        },
        {
          label: '4. How many things were tested?',
          detail: 'Ten patterns across eight stocks is eighty tests. Four will look significant by luck alone',
          value: 'must ask',
        },
        {
          label: '5. Does it survive costs?',
          detail: 'An intraday round trip on 50,000 rupees costs this much of turnover before the idea earns anything',
          compute: { fn: 'roundTripPercent', product: 'intraday', price: 1400, quantity: 35 },
        },
      ],
      conclusion:
        'A hit rate on its own answers none of these five questions. Notice how rarely anyone showing you one has the answers.',
    },
    {
      kind: 'widget',
      component: 'PatternScanner',
      props: { symbol: 'RELIANCE.NS' },
      takeaway:
        'Ten patterns ranked at once. Now change the symbol and watch the ranking shuffle — that instability IS the finding.',
    },
    {
      kind: 'predict',
      prompt:
        'You scan ten patterns across eight stocks and find one combination with a genuinely large, statistically significant edge. What have you found?',
      options: [
        'A tradeable edge',
        'Probably nothing — you ran eighty tests and kept the best one',
        'A starting point that needs one more backtest',
      ],
      correct: 1,
      reveal:
        'Probably nothing. Run eighty tests at a 5% significance threshold and you expect about four to look significant by chance alone. Keeping the winner is not research, it is selection — and it is the single most common way a backtest lies to the person who ran it. This is why professionals fix the hypothesis BEFORE looking, test it on data they have never touched, and treat anything discovered by scanning as a candidate rather than a result. If you take one thing from this tier, take this: the more places you look, the lower the bar you are actually clearing.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A pattern shows a genuine, statistically significant edge on RELIANCE over 5 years, but tests to nothing on nine other large stocks over the same period. What is the most defensible conclusion?',
      options: [
        'The pattern is a real, tradeable edge specific to RELIANCE',
        'Most likely a coincidence found by testing many stocks and keeping the one that looked good',
        'It proves patterns work differently for every company',
      ],
      correct: 1,
      reveal:
        'Most likely a coincidence. Testing a pattern on ten different stocks is effectively ten separate tests, and by chance alone roughly one in twenty will look significant even with nothing real going on. A result that shows up on exactly one of ten stocks and nowhere else fits that description far better than it fits a genuine, company-specific mechanism.',
      askWhy: true,
    },
    {
      kind: 'prose',
      md:
        'None of this makes chart reading useless. Patterns are a **vocabulary for describing what the market is doing** — a hammer really does tell you sellers were rejected at a level, and that is worth knowing.\n\nWhat it is not is a **predictive claim** you can trade without evidence. Use the shapes to describe; use base rates to decide.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A pattern tests as significant on one stock out of twelve tested, with no obvious reason that stock should behave differently. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Trade it on that one stock, since the number is real',
              'Treat it as most likely a chance result from testing twelve stocks and keeping the best one',
              'Test it on twelve more stocks to be sure',
            ],
            correct:
              'Treat it as most likely a chance result from testing twelve stocks and keeping the best one',
          },
          explanation:
            'Treat it as likely chance. Testing many stocks and reporting the one that looked best is exactly the selection problem this lesson names. The more places you look, the lower the bar a lucky result has to clear.',
        },
        {
          prompt:
            'A pattern shows a 61% hit rate over 22 occurrences, against a 53% base rate. Decide whether to trade it.',
          type: 'decision',
          spec: { options: ['Trade it', 'Do not trade it', 'Trade it at reduced size'], correct: 'Do not trade it' },
          explanation:
            'Do not trade it. Twenty-two occurrences is far too small to distinguish 61% from 53% — the confidence interval around that hit rate is roughly ±20 points. "Reduced size" is the tempting answer and it is still wrong: sizing down manages the loss, it does not manufacture evidence. You do not have a small edge here; you have no measurement.',
        },
        {
          prompt:
            'A pattern beats its base rate by 1.2 points, significantly, over 900 occurrences on a stock you would trade intraday. Your round-trip cost is 0.11% of turnover. Decide.',
          type: 'decision',
          spec: {
            options: ['Trade it — the edge is real', 'Do not trade it', 'Trade it in delivery instead'],
            correct: 'Do not trade it',
          },
          explanation:
            'Do not trade it. The edge is real, and it is too small to survive contact with costs. A 1.2 point improvement in hit rate at roughly break-even payoff is worth a few basis points. You are paying 11 of them per round trip. Delivery is worse, not better: it costs more than double. A statistically real edge that is smaller than your costs is not an opportunity, it is a slow way to donate to the exchange.',
        },
        {
          prompt:
            'Compute the edge, in percentage points, of a signal with a 57.4% hit rate against a 53.1% base rate.',
          type: 'compute',
          spec: {
            metric: 'literal',
            value: 4.3,
            tolerance: 0.2,
            unit: 'pts',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 100,
            quantity: 1,
          },
          explanation:
            '4.3 points. That is the only number worth reporting, and it is the one that almost never appears in a course, a video, or a screenshot of somebody’s winning trades. Whenever you are shown a hit rate on its own, the correct response is to ask what the base rate was — and to notice how often nobody knows.',
        },
      ],
    },
  ],
};

export default lesson;
