import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — buying the same amount every month
 *
 * Rupee-cost averaging is sold in India as a strategy that reduces risk. It is
 * not. It is a strategy that reduces REGRET, and that is a genuinely valuable
 * and completely different thing.
 *
 * The honest position, which almost no marketing material states:
 *
 *   - Investing a lump sum immediately beats spreading it out, on average,
 *     because the market rises more often than it falls.
 *   - Spreading it out wins when the market falls early, which is exactly when
 *     a lump-sum investor abandons the plan.
 *   - So the case for it is behavioural, not mathematical, and the behavioural
 *     case is strong enough that it does not need the mathematical one.
 *
 * A lesson that oversold this would be doing the same thing as the fund
 * advertisements, and the learner would eventually find out.
 */
export const lesson: Lesson = {
  id: 'in-t1-sip',
  tier: 'T1',
  market: 'IN',
  title: 'Buying the same amount every month',
  summary:
    'It buys more units when prices are low and fewer when they are high. What it does not do is reduce risk — and the real reason to do it is better than the one you were told.',
  plainSummary:
    'Putting in a fixed amount every month is the most common way people invest. This explains what it actually does for you and what it does not.',
  objectives: [
    'Explain why a fixed rupee amount buys more units when prices are low',
    'Say what regular investing protects you from and what it does not',
    'Compare investing a lump sum against spreading it over a year',
    'Decide which approach suits a given person and why',
  ],
  prerequisites: ['in-t1-compounding'],
  estimatedMinutes: 13,
  introduces: ['index', 'drawdown', 'volatility'],
  skills: ['long-term', 'behaviour', 'compounding'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You invest ₹10,000 a month for three months. The price is ₹100, then ₹50, then ₹100. What is your average cost per unit?',
      options: ['₹83.33 — the average of the prices', '₹75', '₹100'],
      correct: 1,
      reveal:
        'Seventy-five rupees, not ₹83.33. A fixed rupee amount buys 100 units, then 200 units, then 100 units — 400 units for ₹30,000, which is ₹75 each. You automatically bought more when it was cheap and fewer when it was dear, without deciding anything. That is the real mechanism, and it is genuinely useful. Notice what it is not: it did not protect you from the fall. If the price had gone 100, 50, 25 you would still be down. It improves your average price; it does not remove the risk.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Fixed rupees, not fixed units',
      md:
        'The whole effect comes from buying a fixed **amount of money** rather than a fixed number of units.\n\nAt a low price your ₹10,000 buys more; at a high price it buys fewer. So your money automatically weights itself toward the cheaper months, and your average cost ends up below the average price.\n\nThat is arithmetic, it is reliable, and it is smaller than most people imagine. It is not the main reason this works.',
    },
    {
      kind: 'figure',
      figure: 'CompoundingCurve',
      props: {},
      caption:
        'Regular contributions add a new line to this curve every month, each one with less time left to grow. The earliest ones do most of the work.',
    },
    {
      kind: 'example',
      title: 'Lump sum against spreading it out',
      setup:
        'You have ₹12,00,000. Option A puts it all in today. Option B invests ₹1,00,000 a month for twelve months. The market rises steadily at 10% a year. This is the ordinary case, not the dramatic one.',
      steps: [
        {
          label: 'Option A after one year',
          detail: 'The whole amount, invested for the full twelve months',
          compute: { fn: 'compoundFinal', initial: 1200000, contribution: 0, years: 1, ratePercent: 10 },
        },
        {
          label: 'Option B, roughly',
          detail: 'On average each rupee was invested for about half the year',
          compute: { fn: 'compoundFinal', initial: 600000, contribution: 0, years: 1, ratePercent: 10 },
        },
        {
          label: 'What was sitting in cash under option B',
          detail: 'Money waiting its turn earns nothing from the market',
          compute: { fn: 'literal', value: 600000 },
        },
        {
          label: 'The gap after one year',
          detail: 'In a rising market, waiting costs',
          compute: { fn: 'literal', value: 60000 },
        },
        {
          label: 'And over ten years at the same rate',
          detail: 'That one-year gap keeps compounding too',
          compute: { fn: 'compoundFinal', initial: 60000, contribution: 0, years: 10, ratePercent: 10 },
        },
      ],
      conclusion:
        'In a rising market, spreading it out costs money. Since the market rises more often than it falls, that is the usual case.',
    },
    {
      kind: 'predict',
      prompt:
        'Given that, why is investing monthly still the right answer for most people?',
      options: [
        'Because it reduces risk',
        'Because most people do not have a lump sum, and those who do often panic in a fall',
        'Because it produces better returns on average',
      ],
      correct: 1,
      reveal:
        'Because of the person, not the arithmetic. Most people are investing from a salary, so monthly is not a choice — it is what having a job looks like. And for those with a lump sum, the real risk is not the market. It is investing everything on Monday, watching it fall 15% by Friday, and abandoning the plan entirely. Spreading it out is worse on average and far better in the case that actually destroys outcomes. That is a completely honest reason, and it is a better one than the reduced-risk claim it is usually sold with.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'the-long-game',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: '"It protects you in a falling market"',
      md:
        'It does not. If the market falls for five years, every contribution you made is worth less than you paid for it and you are down.\n\nWhat it does is let you keep buying while prices are low, so the recovery starts from a lower average cost. That is real and it is worth having.\n\nThe claim to be careful with is any suggestion that regular investing removes the possibility of loss. Nothing does, and a plan sold on that basis is a plan you will abandon at the worst moment.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You invest ₹6,000 a month for three months at prices of ₹200, ₹100 and ₹150. What is your average cost per unit, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 138.46, tolerance: 2, unit: '₹' },
          explanation:
            '30 + 60 + 40 = 130 units for ₹18,000, which is about ₹138.46 each. The simple average of the three prices is ₹150, so the method saved you about ₹11.54 a unit. That is the whole effect, it is real, and it is modest — which is exactly why the behavioural argument matters more than this one.',
        },
        {
          prompt:
            'Sort each claim about investing a fixed amount monthly.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'It buys more units when prices are lower', category: 'True' },
              { label: 'It makes a plan easier to stick to', category: 'True' },
              { label: 'It protects you from losing money', category: 'Not true' },
              { label: 'It beats a lump sum on average', category: 'Not true' },
            ],
          },
          explanation:
            'The two true rows are the honest case and they are enough. The last row is the one that surprises people: on average, in a market that rises more often than it falls, getting invested sooner wins. The reason to invest monthly anyway is the second row, and a reason that survives being stated accurately is worth more than one that does not.',
        },
        {
          prompt:
            'Someone inherits ₹20,00,000, has never invested before, and is nervous. Decide what to suggest.',
          type: 'decision',
          spec: {
            options: [
              'All of it today — the arithmetic says so',
              'Spread it over 12 months, because the plan they will actually stick to beats the one that is optimal on paper',
              'Wait for a market fall',
            ],
            correct:
              'Spread it over 12 months, because the plan they will actually stick to beats the one that is optimal on paper',
          },
          explanation:
            'Spread it. The first answer is right on average and wrong for this person. A 20% fall in month two ends the plan permanently, and no arithmetic recovers from that. The third answer is not a plan at all. Notice that the correct answer is knowingly suboptimal — the best strategy for somebody is the best one they will still be following in five years.',
        },
      ],
    },
  ],
};

export default lesson;
