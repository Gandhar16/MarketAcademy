import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — portfolio construction
 *
 * The step where the unit of analysis stops being the trade. Everything up to
 * here sized one position against one stop. This asks what happens when eight
 * of those positions are open at once and four of them are really the same bet.
 *
 * The central finding: risk per trade is not risk per portfolio. Eight
 * positions at 1% each is 8% of exposure if they are independent, and much
 * closer to 4% of one bet if they are all the same sector — which is exactly the
 * situation a screen produces, as stage 6 showed.
 */
export const lesson: Lesson = {
  id: 'in-t4-portfolio',
  tier: 'T4',
  market: 'IN',
  title: 'Building a portfolio, not a pile of trades',
  summary:
    'Eight positions at 1% risk each is not 8% of risk. It depends entirely on how many of them are secretly the same bet.',
  plainSummary:
    'Sizing one trade is not the same as sizing a whole account. This shows what happens when you hold several things at the same time.',
  objectives: [
    'Distinguish risk per position from risk across the whole account',
    'Identify positions that are really the same bet under different names',
    'Compute total exposure when several positions can fail together',
    'Set a limit that survives the case where everything correlates',
  ],
  prerequisites: ['in-t4-kelly'],
  estimatedMinutes: 14,
  introduces: ['position-size', 'risk-per-trade', 'drawdown', 'risk-of-ruin', 'index'],
  skills: ['portfolio', 'position-sizing', 'risk-management'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You hold eight positions, each risking 1% of the account. Five of them are Indian banks. How much are you really risking?',
      options: [
        '8% — one percent each',
        'Closer to 4%, because the five banks are largely one bet',
        'Less than 8%, because diversification always helps',
      ],
      correct: 1,
      reveal:
        'Closer to 4%. The three unrelated positions carry 3% between them. The five banks behave as roughly one bet on rates and credit, so they contribute about one position of risk rather than five. Everything that hurts a bank hurts all of them on the same morning. This is the gap between what a position-sizing rule promises and what an account actually carries, and it is invisible if you only ever look at one trade at a time.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two different questions',
      md:
        '**Per position.** How much do I lose if this one idea fails? Answered by the stop and the size — stage 3 settled it.\n\n**Per account.** How much do I lose if the WORST plausible day happens to everything at once? Not answered by the first question at all.\n\nThe second only equals the sum of the first when the positions are genuinely independent. They rarely are, and they are least independent exactly when it matters.',
    },
    {
      kind: 'game',
      game: 'risk-roulette',
      config: {},
    },
    {
      kind: 'example',
      title: 'The same eight positions, two ways of counting',
      setup:
        'A ₹10,00,000 account with eight open positions, each sized to risk 1% — ₹10,000 each. Five are banks, one is a software firm, one is a cement maker, one is a pharmaceutical company.',
      steps: [
        {
          label: 'Risk per position',
          detail: '1% of the account, exactly as the sizing rule intended',
          compute: { fn: 'riskAmount', equity: 1000000, riskPercent: 1 },
        },
        {
          label: 'The sum, if all eight were independent',
          detail: 'What the position-sizing rule appears to promise',
          compute: { fn: 'multiply', a: 10000, b: 8, dp: 0 },
        },
        {
          label: 'What the five banks really represent',
          detail: 'One bet on rates and credit, sized at five times',
          compute: { fn: 'multiply', a: 10000, b: 5, dp: 0 },
        },
        {
          label: 'Distinct bets actually held',
          detail: 'Banks, software, cement, pharma',
          compute: { fn: 'literal', value: 4 },
        },
        {
          label: 'Loss if the banking sector has a bad week',
          detail: 'Five stops hit on the same morning, plus costs',
          compute: { fn: 'multiply', a: -10000, b: 5, dp: 0 },
        },
      ],
      conclusion:
        'Eight positions, four bets, and one ordinary sector event takes 5% of the account rather than 1%.',
    },
    {
      kind: 'predict',
      prompt:
        'You cap total risk at 6% of the account and cap any one sector at 2%. Work it out — how many 1% bank positions can you hold?',
      options: ['Six', 'Two', 'Five'],
      correct: 1,
      reveal:
        'Two. The sector cap binds long before the total does, which is exactly what it is for. Without it, a screen that happens to like banks fills your account with banks and the position-sizing rule raises no objection at all — every individual trade obeys it. A sector cap is the mechanism that turns "I am diversified, I hold eight things" into a claim that survives contact with a bad Tuesday. It is also unpopular, because it stops you from buying more of whatever is currently working.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: {},
      takeaway:
        'And if any of those positions are leveraged, the sector event does not take 5% of the account — it takes a multiple of it.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Three limits, decided before you need them',
      md:
        '**Per position.** The stop-based size from stage 3. Usually 1%.\n\n**Per sector or theme.** So that a screen cannot quietly build one enormous bet out of several small ones.\n\n**Per account, total.** The most you can lose if every open stop is hit on the same day. That day exists, because what triggers stops tends to happen to everybody at once.\n\nAll three are written down in advance. A limit invented while a position is losing is not a limit.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Account ₹8,00,000. You hold six positions each risking 1.5%. What is your total risk if every stop is hit, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 72000, tolerance: 500, unit: '₹' },
          explanation:
            '1.5% of ₹8,00,000 is ₹12,000, times six is ₹72,000 — 9% of the account in a single bad session. Each individual trade looked conservative and the total is not. This sum takes ten seconds and almost nobody does it, because the sizing rule feels like it has already answered the question.',
        },
        {
          prompt:
            'Sort each pair by whether they are genuinely separate bets.',
          type: 'classify',
          spec: {
            categories: ['Separate bets', 'Largely the same bet'],
            items: [
              { label: 'A bank and a pharmaceutical company', category: 'Separate bets' },
              { label: 'A software exporter and a cement maker', category: 'Separate bets' },
              { label: 'Two large private banks', category: 'Largely the same bet' },
              { label: 'A car maker and a car-parts supplier', category: 'Largely the same bet' },
            ],
          },
          explanation:
            'The last pair is the one people miss — they are different companies in different index sectors, and their fortunes depend on the same thing. The useful test is not what industry classification says but what single piece of news would move both. If you can name one, they are one bet, and they should be sized as one.',
        },
        {
          prompt:
            'Your screen returns twelve names and nine are from one sector. You have a 2% sector cap. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Take all nine — the screen found them for a reason',
              'Take the two best and leave the rest, because the cap exists for exactly this',
              'Raise the cap, since the sector clearly looks attractive',
            ],
            correct: 'Take the two best and leave the rest, because the cap exists for exactly this',
          },
          explanation:
            'Take two. The screen concentrated in one sector because your filter measures something structural about that industry. The concentration is a property of the filter, not evidence about the future. The third answer is how every limit dies: it is raised at exactly the moment it first becomes inconvenient, which is exactly the moment it was written for.',
        },
      ],
    },
  ],
};

export default lesson;
