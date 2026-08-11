import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — position sizing
 *
 * The T4 lesson proves WHY sizing decides everything. This one, much earlier in
 * the curriculum, teaches the arithmetic so a beginner can do it before they
 * understand the ruin mathematics — because they will be placing trades long
 * before they reach T4, and "how many shares" is the question they will face
 * first.
 *
 * The single idea: decide the rupee loss you accept, then let the stop distance
 * determine the quantity. Everything else follows.
 */
export const lesson: Lesson = {
  id: 'in-t1-position-sizing',
  tier: 'T1',
  market: 'IN',
  title: 'How many shares should I buy?',
  summary:
    'Not "how much can I afford". The right question is how much you are willing to lose, and the answer determines the quantity for you.',
  plainSummary:
    '"How many shares should I buy?" has a real answer, and it is not "as many as I can afford". This shows the arithmetic, which takes about thirty seconds once you have seen it done.',
  objectives: [
    'Compute a position size from a risk budget and a stop distance',
    'Explain why position size and risk are not the same thing',
    'Say what to do when one lot risks more than your budget allows',
    'Recognise why a wider stop is not a way to trade bigger',
  ],
  prerequisites: ['in-t1-order-types'],
  estimatedMinutes: 14,
  introduces: ['position-size', 'risk-per-trade', 'lot-size', 'margin'],
  skills: ['position-sizing', 'risk-budget'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Your account is ₹2,00,000. You want to buy a stock at ₹1,400. How many shares should you buy?',
      options: [
        'As many as I can afford — 142',
        'A comfortable fraction, say 50',
        'It is impossible to say from this information',
      ],
      correct: 2,
      reveal:
        'Impossible to say, and noticing that is the entire lesson. Nothing here tells you where you would admit you were wrong. Without a stop there is no risk per share, and without risk per share there is no defensible quantity — only a guess dressed up as a decision. The question "how many shares" cannot be answered before the question "where do I get out", and almost every beginner answers them in the wrong order. Notice too that the first answer confuses SIZE with RISK: 142 shares is what the account can fund, which says nothing about what you stand to lose.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'RiskRewardDiagram',
      props: { entry: 1400 },
      caption:
        'Entry, stop and target drawn to scale. The stop distance is the number that decides your size — drag it and watch the required win rate move with it.',
    },
    {
      kind: 'example',
      title: 'The whole calculation, in four lines',
      setup:
        'Account of 2,00,000 rupees. You have found a setup: buy at 1,400, and you would admit you were wrong at 1,372. You are willing to lose 1 percent of the account on any single trade.',
      steps: [
        {
          label: 'The rupee risk you accept',
          detail: 'One percent of 2,00,000, decided before you looked at the chart',
          compute: { fn: 'riskAmount', equity: 200000, riskPercent: 1 },
        },
        {
          label: 'Risk per share',
          detail: 'Entry 1,400 minus stop 1,372',
          value: '28.00',
        },
        {
          label: 'Shares to buy',
          detail: 'Risk budget divided by risk per share, rounded down',
          compute: { fn: 'sizeFromStop', equity: 200000, riskPercent: 1, entry: 1400, stop: 1372 },
        },
        {
          label: 'The position that creates',
          detail: 'Half your account is deployed — but only one percent is at risk',
          compute: { fn: 'multiply', a: 1400, b: 71, dp: 0 },
        },
        {
          label: 'A tighter stop at 1,386 instead',
          detail: 'Half the risk per share means twice the shares, for the same rupee risk',
          compute: { fn: 'sizeFromStop', equity: 200000, riskPercent: 1, entry: 1400, stop: 1386 },
        },
      ],
      conclusion:
        'A tighter stop lets you buy more shares, not less. Size and risk move in opposite directions, which is the part that feels backwards until you have done the arithmetic once.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The temptation, and why it is a trap',
      md:
        'When the calculation returns a quantity that feels too small, there is an obvious fix: widen the stop. Now one lot fits the budget.\n\nIt does not. Widening the stop does not reduce your risk. It moves the point at which you admit you were wrong. You lose the same money, but later, and with less information. The honest conclusion is that the trade is **too big for this account today**, and that is the sizing rule doing its job rather than failing at it.',
    },
    {
      kind: 'widget',
      component: 'BreakevenSlider',
      props: { market: 'IN', product: 'intraday', price: 1400, minValue: 10_000, maxValue: 1_000_000 },
      takeaway:
        'And costs sit underneath the whole calculation. If your breakeven move is a third of your target, the risk you measured was never the only risk.',
    },
    {
      kind: 'predict',
      prompt:
        'Two traders both risk 1% per trade. One buys 20 shares of a ₹5,000 stock, the other 5,000 shares of a ₹20 stock. Who is taking more risk?',
      options: ['The first — bigger position', 'The second — more shares', 'Neither, by construction'],
      correct: 2,
      reveal:
        'Neither, and that is the point of sizing from the stop. Both have 1% of their account between the entry and the point at which they get out. The share count is irrelevant. The rupee value of the position is irrelevant. Risk is one thing only: how far the price must move against you before you exit, multiplied by how many units you hold. This is why experienced traders talk about "one R" rather than about rupees or share counts — it makes every trade comparable regardless of what it costs per share.',
      askWhy: false,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Account ₹5,00,000, risking 0.5% per trade. Entry ₹850, stop ₹833. How many shares?',
          type: 'compute',
          spec: {
            metric: 'literal',
            value: 147,
            tolerance: 2,
            unit: 'shares',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 850,
            quantity: 1,
          },
          explanation:
            '₹5,00,000 × 0.5% = ₹2,500 of risk, divided by ₹17 of stop distance, is 147 shares — a position of about ₹1,25,000, which is a quarter of the account. Notice again how far apart the position size and the risk are. Deploying 25% of your capital while risking 0.5% of it is entirely normal. It is exactly what the calculation is for.',
        },
        {
          prompt:
            'Same ₹5,00,000 account and 0.5% risk, but you want a NIFTY future where one lot risks ₹8,000 at your intended stop. Decide.',
          type: 'decision',
          spec: {
            options: ['Take one lot', 'Widen the stop to fit', 'Skip the trade'],
            correct: 'Skip the trade',
          },
          explanation:
            'Skip it. One lot risks ₹8,000 against a ₹2,500 budget — more than three times over. You cannot buy a third of a lot, and widening the stop only relocates the loss rather than shrinking it. The instrument is too large for this account at this risk level, which is a fact about the instrument and not a failure of nerve. The alternative worth knowing about is that smaller contracts exist precisely for this reason.',
        },
        {
          prompt:
            'Classify each change by what it does to the number of shares you should buy, holding your risk budget fixed.',
          type: 'classify',
          spec: {
            categories: ['Buy more shares', 'Buy fewer shares', 'No change'],
            items: [
              { label: 'You move the stop closer to the entry', category: 'Buy more shares' },
              { label: 'You move the stop further away', category: 'Buy fewer shares' },
              { label: 'The account grows', category: 'Buy more shares' },
              { label: 'You feel more confident about the trade', category: 'No change' },
              { label: 'The broker offers you more margin', category: 'No change' },
            ],
          },
          explanation:
            'Only three things move the number: the stop distance, the account size, and the risk percentage you chose. Confidence and available margin change nothing, and they are exactly the two inputs most people actually use. Margin in particular is a facility your broker offers to increase their revenue; it is not information about your trade.',
        },
      ],
    },
  ],
};

export default lesson;
