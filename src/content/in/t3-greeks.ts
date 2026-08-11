import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — the greeks
 *
 * Taught as answers to "what happens if one thing changes", never as formulas.
 * The learner drags each input in turn with everything else held still, which
 * is the only way the four become distinguishable rather than a vocabulary list.
 *
 * The ordering is by how much damage each one does to a beginner, not by the
 * conventional delta-gamma-theta-vega:
 *
 *   theta — the certainty. Charged every day, no market condition exempts you.
 *   delta — the one people think they bought.
 *   vega  — the ambush. Loses money with the direction call correct.
 *   gamma — why a calm short position is calm right up until it is not.
 *
 * No formula appears anywhere in this lesson, deliberately. A learner who can
 * say which greek is about to hurt them has everything they need; one who can
 * recite Black–Scholes and cannot answer that has nothing.
 */
export const lesson: Lesson = {
  id: 'in-t3-greeks',
  tier: 'T3',
  market: 'IN',
  title: 'The greeks you can feel',
  summary:
    'Four questions, not four formulas. Hold everything still, move one input, and watch what it does — then find out which one is about to cost you money.',
  plainSummary:
    'The price of these contracts moves for four separate reasons. This shows you each one on its own, by changing a single thing at a time.',
  objectives: [
    'Name which measure is guaranteed to work against a buyer every day',
    'Predict the direction each measure moves when one input changes',
    'Explain why a correct direction call can still lose money',
    'Say what a seller is exposed to that a buyer is not',
  ],
  prerequisites: ['in-t3-options-from-first-principles'],
  estimatedMinutes: 16,
  introduces: ['option', 'premium', 'expiry', 'volatility', 'strike-price', 'spot-price', 'time-value', 'intrinsic-value', 'moneyness', 'underlying'],
  skills: ['greeks', 'options-pricing'],
  blocks: [
    {
      kind: 'widget',
      component: 'GreeksExplorer',
      props: { strike: 24000, spot: 24000, days: 45, iv: 14, type: 'call' },
      takeaway:
        'Change one slider at a time and keep the others still. Every measure below is simply the answer to one of those single changes.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Four questions with names',
      md:
        '- **Delta** — if the price moves ₹1, how much does the contract move?\n- **Theta** — what does one day cost me, if nothing else changes?\n- **Vega** — what happens if people start expecting bigger moves?\n- **Gamma** — how fast does delta itself change?\n\nThat is all they are. Not extra machinery, not a model you have to trust — just the four separate reasons a price can move, kept apart so you can see which one is acting.',
    },
    {
      kind: 'predict',
      prompt:
        'You hold a contract for a month. The price never moves, expectations never change, nothing happens at all. Which measure has cost you money?',
      options: ['Delta', 'Theta', 'Vega', 'None — nothing happened'],
      correct: 1,
      reveal:
        'Theta, and it is the only one of the four that is a certainty. Delta helps or hurts depending on direction. Vega depends on whether expectations rose or fell. Gamma is genuinely on your side while you hold the contract. Theta has no such condition attached: every day that passes removes some of what you paid for, and there is no market state in which it does not. It also accelerates. The final week costs far more per day than the first, so a contract that looked survivable in week one bleeds out in week four.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'One day, four separate causes',
      setup:
        'A NIFTY 24,000 call, 30 days out, expectations at 14. NIFTY is at 24,000. We change exactly one thing at a time and read the price after each — so every difference below has one cause and only one.',
      steps: [
        {
          label: 'Where we start',
          detail: 'Price equals level, so none of this is value it already has',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24000, days: 30, ivPercent: 14, type: 'call' },
        },
        {
          label: 'Delta: NIFTY moves up 100 points',
          detail: 'Nothing else touched. The contract gains roughly half the move',
          compute: { fn: 'optionPrice', spot: 24100, strike: 24000, days: 30, ivPercent: 14, type: 'call' },
        },
        {
          label: 'Theta: one day passes instead',
          detail: 'Back to 24,000, one day fewer. Charged whether the market opened or not',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24000, days: 29, ivPercent: 14, type: 'call' },
        },
        {
          label: 'Vega: expectations rise from 14 to 20',
          detail: 'Same price, same day. Only what people will pay for uncertainty changed',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24000, days: 30, ivPercent: 20, type: 'call' },
        },
        {
          label: 'What a day costs, as a number',
          detail: 'Theta itself, quoted per day',
          compute: { fn: 'optionGreek', greek: 'theta', spot: 24000, strike: 24000, days: 30, ivPercent: 14, type: 'call' },
        },
      ],
      conclusion:
        'Four different causes, four different sizes, and only one of them was about being right on direction.',
    },
    {
      kind: 'predict',
      prompt:
        'Same contract. Work it out from the example before you look: expectations FALL from 14 to 10 and NIFTY rises 50 points on the same day. What is the likely result?',
      options: [
        'A gain — you were right on direction',
        'A loss is quite possible, because vega can outweigh a small move',
        'Nothing changes — the two cancel exactly',
      ],
      correct: 1,
      reveal:
        'A loss is quite possible. In the example, six points of expectation was worth far more than 100 points of index movement. So four points of expectation lost against 50 points gained is not an obvious win at all. This is the ambush, and it catches people who have never separated the four causes. They were right about the direction and watched the index go their way, and the position lost money. So they conclude the market is rigged, rather than that they had an exposure they never priced.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'GreeksExplorer',
      props: { strike: 24000, spot: 23600, days: 7, iv: 22, type: 'put' },
      takeaway:
        'Seven days left and in the money. Drag the price back and forth across the level and watch delta swing violently — that swing is gamma.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What a seller is holding',
      md:
        'Selling one of these is the exact mirror. Time becomes your ally and movement becomes your enemy.\n\nThat is why it feels like free money for weeks and then takes it back in an afternoon. The profits arrive as a slow drip — theta, every day, reliably. The losses arrive all at once, through gamma, when the price reaches the level and delta stops being a number and starts being a direction.\n\nCollecting ₹90 caps your best case at ₹90. It does not cap the other side.',
    },
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 24000,
        editable: true,
        legs: [{ type: 'call', quantity: -1, strike: 24200, premium: 90 }],
      },
      takeaway:
        'A sold call, drawn out. Read the worst case, then add a bought call above it and watch the open end close.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A contract has a delta of 0.45. The underlying rises ₹20 and nothing else changes. Roughly how much does the contract gain, per unit?',
          type: 'compute',
          spec: { metric: 'literal', value: 9, tolerance: 0.6, unit: '₹' },
          explanation:
            '0.45 × ₹20 = ₹9. Delta is a rate, so it converts a move in the underlying into a move in the contract. Note the word roughly: delta itself changes as the price moves, which is gamma, so the answer drifts over a large move. Over ₹20 it is close enough to be useful, and that is exactly how delta should be used.',
        },
        {
          prompt:
            'You have sold a contract. Sort each event by whether it helps or hurts you.',
          type: 'classify',
          spec: {
            categories: ['Helps me', 'Hurts me'],
            items: [
              { label: 'A week passes with no movement', category: 'Helps me' },
              { label: 'People start expecting bigger moves', category: 'Hurts me' },
              { label: 'A large jump toward the level', category: 'Hurts me' },
              { label: 'Expectations fall after an announcement', category: 'Helps me' },
            ],
          },
          explanation:
            'Every row flips compared with holding the contract, which is the useful way to remember it: a seller is short everything a buyer is long. The dangerous asymmetry is in the sizes rather than the signs. Two of these arrive slowly and in small amounts; one of them can arrive in a single morning and be larger than everything collected so far.',
        },
        {
          prompt:
            'You are long a contract with 3 days left, and the price is sitting right at your level. Decide which measure is the biggest threat.',
          type: 'decision',
          spec: {
            options: ['Delta', 'Theta', 'Vega', 'Gamma'],
            correct: 'Theta',
          },
          explanation:
            'Theta. Sitting at the level with three days left means almost the entire remaining price is time value. Time value goes to exactly zero at expiry, with certainty, and fastest at the end. Gamma is large here too, but gamma is on your side as a holder. Vega matters less with so little time left. The threat is the calendar, and no amount of being right about direction slows it down.',
        },
      ],
    },
  ],
};

export default lesson;
