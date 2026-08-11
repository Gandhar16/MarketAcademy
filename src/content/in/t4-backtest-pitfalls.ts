import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — why backtests lie
 *
 * PLAN.md pain point P7. Every other course either does not mention backtesting
 * or teaches it as though a good historical result were evidence. This lesson
 * names the four specific mechanisms by which a backtest overstates itself, and
 * points at the fact that the learner has already been protected from one of
 * them by construction — the replay engine cannot read ahead, which is a claim
 * this app can make and demonstrate.
 */
export const lesson: Lesson = {
  id: 'in-t4-backtest-pitfalls',
  tier: 'T4',
  market: 'BOTH',
  title: 'Why your backtest is lying to you',
  summary:
    'Four specific mechanisms turn a losing strategy into a beautiful equity curve. Each one is easy to commit by accident and invisible in the result.',
  plainSummary:
    'Testing an idea against past prices is easy. Testing it honestly is not. This shows the four specific ways such a test flatters itself, each of which is easy to commit by accident.',
  objectives: [
    'Name the four ways a backtest systematically overstates performance',
    'Recognise lookahead bias in a strategy description',
    'Explain why survivorship bias inflates index-based tests',
    'Estimate how much of a backtested edge costs will consume',
  ],
  prerequisites: ['in-t2-does-this-pattern-work', 'in-t1-real-cost-of-a-trade'],
  estimatedMinutes: 16,
  introduces: ['backtest', 'lookahead-bias', 'survivorship-bias', 'overfitting'],
  skills: ['backtesting', 'statistical-scepticism', 'trade-costs'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A strategy rule reads: "Buy when today closes above the 20-day average, at today\'s close." Backtested over ten years it returns 34% a year. What is wrong?',
      options: [
        'Nothing — that is a valid rule',
        'You cannot know today\'s close until the close, so you cannot buy at it',
        'Twenty days is too short a lookback',
      ],
      correct: 1,
      reveal:
        'You cannot act on the close at the close. By the time you know the closing price, the session is over and the only price available to you is tomorrow\'s open — which can gap. This is LOOKAHEAD BIAS in its most common form, and it is devastating precisely because the rule sounds so reasonable that it survives review. Every backtesting framework makes it easy to commit: the closing price is right there in the row you are iterating over. The fix is to act on the NEXT bar. That is exactly what the replay engine in this app does. An order you submit while looking at a bar fills against the following one, always, with no way to configure that away.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'What is left after costs',
      setup:
        'A backtest shows a strategy averaging 0.8 percent per trade on 50,000 rupee intraday positions, with 250 round trips a year. The equity curve is beautiful. Here is what it looks like once the trades are actually paid for.',
      steps: [
        {
          label: 'Gross return per round trip',
          detail: 'What the backtest reported, before anything is deducted',
          value: '0.800%',
        },
        {
          label: 'Real cost of one round trip',
          detail: 'Statutory charges on a 50,000 rupee intraday position',
          compute: { fn: 'roundTripPercent', product: 'intraday', price: 1400, quantity: 35 },
        },
        {
          label: 'Slippage on entry and exit',
          detail: 'Two market orders against a real book, which no backtest models by default',
          compute: { fn: 'bookWalkSlippage', quantity: 800, side: 'buy' },
        },
        {
          label: 'Annual cost drag at 250 trips',
          detail: 'Charges alone, compounding against you all year',
          compute: { fn: 'multiply', a: 250, b: 53.02, dp: 0 },
        },
        {
          label: 'On a 50,000 rupee account',
          detail: 'That annual charge as a share of the capital being traded',
          value: '26.5%',
        },
      ],
      conclusion:
        'The strategy did not stop working. It was never measured net of the two things that were always going to happen: charges, and the price moving away as you take liquidity.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Survivorship — the one nobody notices',
      md:
        'Backtest a rule across "the NIFTY 50" using today\'s constituents and you have quietly excluded every company that fell out of the index. Those are exactly the ones that performed badly.\n\nYour sample is the survivors, and a strategy tested only on things that turned out fine looks remarkably good at picking things that turn out fine. Fixing this needs point-in-time constituent data, which is expensive and which is why almost nobody does it.',
    },
    {
      kind: 'widget',
      component: 'PatternScanner',
      props: { symbol: 'RELIANCE.NS' },
      takeaway:
        'Change the symbol a few times and watch the "best" pattern reshuffle. Every reshuffle is another test you have run — and the more you look, the lower the bar you are actually clearing.',
    },
    {
      kind: 'predict',
      prompt:
        'You test 200 strategy variations and keep the best one. It clears the 5% significance threshold. How impressed should you be?',
      options: ['Very — it beat a real statistical test', 'Not at all', 'Somewhat, with reservations'],
      correct: 1,
      reveal:
        'Not at all. At a 5% threshold you expect about 10 of 200 random variations to look significant by chance alone. Finding one therefore proves nothing. You have not discovered an edge; you have run a search and reported the maximum. This is OVERFITTING. It is why professional research fixes the hypothesis before looking, and tests it on data never touched during development. Anything found by scanning is treated as a candidate needing fresh evidence. The uncomfortable corollary: the more effort you put into optimising a backtest, the less its result means.',
      askWhy: true,
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
            'A rule says: "Sell when the day\'s high is more than 3% above the open." Decide whether this is implementable.',
          type: 'decision',
          spec: {
            options: ['Yes, implementable', 'No — it needs information from the future', 'Only with intraday data'],
            correct: 'No — it needs information from the future',
          },
          explanation:
            'The day\'s high is only known once the day is over. During the session you can see that price is currently 3% above the open, which is a different and much weaker rule — it may go higher, and it may come back. "Only with intraday data" is the tempting answer and it is still wrong: no amount of granularity tells you whether the current level is the high. Any rule referencing a bar\'s high, low or close as a trigger for action WITHIN that bar is lookahead.',
        },
        {
          prompt: 'Match each flaw to what it does to the result.',
          type: 'classify',
          spec: {
            categories: ['Inflates returns', 'Understates risk'],
            items: [
              { label: 'Acting on a bar\'s close during that bar', category: 'Inflates returns' },
              { label: 'Testing only current index constituents', category: 'Inflates returns' },
              { label: 'Keeping the best of 200 variations', category: 'Inflates returns' },
              { label: 'Assuming every order fills at the mid price', category: 'Inflates returns' },
              { label: 'Ignoring that correlations rise in a crash', category: 'Understates risk' },
            ],
          },
          explanation:
            'The first four all push the reported return upward, which is why backtests are systematically optimistic rather than randomly wrong — every easy mistake happens to flatter you. The last is different and sneakier: a portfolio backtest can report an honest return while badly understating drawdown, because the diversification it relied on evaporates in exactly the conditions that matter.',
        },
        {
          prompt:
            'A backtest reports 0.8% gross per trade. Compute the real round-trip cost percentage on a ₹50,000 intraday position and decide how much of the edge survives.',
          type: 'compute',
          spec: {
            metric: 'roundTripCostPercent',
            market: 'IN',
            venue: 'NSE',
            product: 'intraday',
            price: 1400,
            quantity: 35,
            tolerance: 0.03,
            unit: '%',
          },
          explanation:
            'Roughly 0.11% of turnover in statutory charges, so about an eighth of the gross edge before slippage — and slippage on two market orders can easily match the charges again. The strategy is probably still positive, which is the honest answer, but the return is materially smaller than advertised and the drawdowns are unchanged. That combination is what turns a strategy someone can hold through a bad month into one they abandon.',
        },
      ],
    },
  ],
};

export default lesson;
