import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — ASM and GSM
 *
 * India's surveillance framework, which quietly changes the rules on a share
 * you already own, overnight, without the company doing anything.
 *
 * The consequence that matters: margin requirements jump, intraday trading can
 * be withdrawn, and in the severe stages trading is restricted to a periodic
 * call auction. A leveraged position in a share that enters surveillance can be
 * forced closed simply because the deposit requirement changed.
 */
export const lesson: Lesson = {
  id: 'in-t5-surveillance',
  tier: 'T5',
  market: 'IN',
  title: 'ASM, GSM and the surveillance ladder',
  summary:
    'The exchange can change the rules on a share you already hold, overnight. Margin jumps, intraday disappears, and in the worst stages you can trade once a week.',
  plainSummary:
    'Exchanges put unusual shares under extra restrictions. This explains what those are, and what they do to shares you already own.',
  objectives: [
    'Say what surveillance frameworks are for and what triggers them',
    'Describe what changes for a holder when a share enters one',
    'Compute the effect of a margin requirement rising overnight',
    'Decide how to size a position in a share that could enter surveillance',
  ],
  prerequisites: ['in-t3-margin'],
  estimatedMinutes: 13,
  introduces: ['margin', 'circuit-limit', 'liquidity', 'intraday', 'volatility', 'leverage'],
  skills: ['edge-cases', 'india-rules', 'risk-management'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A share you hold on margin is placed under additional surveillance tonight. What changes for you tomorrow?',
      options: [
        'Nothing — surveillance is about the company',
        'The margin requirement can jump sharply, and you must fund it or be closed',
        'Only new buyers are affected',
      ],
      correct: 1,
      reveal:
        'The requirement can jump, and it applies to the position you already hold. Surveillance measures are applied to the SHARE, not to new trades, so an existing holder wakes up needing far more collateral for a position they have not touched. In the stricter stages the requirement can go to 100%, meaning no leverage at all. If you cannot fund the difference that day, the position is closed for you — in a share that is under surveillance precisely because it has been moving strangely.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'OvernightMarginExplainer',
      props: {},
      takeaway:
        'Step through it once. The company did nothing, the price did nothing — and ₹1,50,000 is due by evening.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two frameworks, one idea',
      md:
        '**ASM** — additional surveillance. Applied to shares showing unusual price movement, volatility or concentration. It is not an accusation, and large well-known companies do occasionally appear.\n\n**GSM** — graded surveillance. For shares whose price looks disconnected from any financial reality. Stricter, and it escalates through stages.\n\nBoth work by making the share **harder and more expensive to trade**: higher margin, no intraday, tighter bands, and at the severe end only periodic auctions.',
    },
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: {},
      takeaway:
        'Move the requirement upward and watch what happens to a position already open. Surveillance does exactly that, overnight, without asking.',
    },
    {
      kind: 'example',
      title: 'An overnight requirement change',
      setup:
        'You hold ₹5,00,000 of a share against a ₹1,00,000 deposit — a 20% requirement. Tonight the share enters surveillance and the requirement goes to 50%.',
      steps: [
        {
          label: 'What you hold',
          detail: 'Position value, unchanged by any of this',
          compute: { fn: 'literal', value: 500000 },
        },
        {
          label: 'Deposit required yesterday',
          detail: '20% of the position',
          compute: { fn: 'percentOf', value: 500000, percent: 20 },
        },
        {
          label: 'Deposit required today',
          detail: '50%, on the same position, decided by the exchange',
          compute: { fn: 'percentOf', value: 500000, percent: 50 },
        },
        {
          label: 'What you must find, today',
          detail: 'Or the position is reduced for you',
          compute: { fn: 'literal', value: 150000 },
        },
        {
          label: 'And what a 10% fall would now cost',
          detail: 'On a position you may be forced to sell into that fall',
          compute: { fn: 'percentOf', value: 500000, percent: -10 },
        },
      ],
      conclusion:
        'The company did nothing, the price did nothing, and you owe ₹1,50,000 by this evening.',
    },
    {
      kind: 'predict',
      prompt:
        'A share moves to the most severe surveillance stage, where trading happens in a periodic call auction once a week. Work out what that means for an exit.',
      options: [
        'You can still sell any day, just with higher margin',
        'You can only trade in that weekly window, and only if somebody matches',
        'The exchange buys your shares back',
      ],
      correct: 1,
      reveal:
        'Only in that window, and only if somebody is on the other side. This is where a holding stops being a liquid asset in any meaningful sense. It exists and it has a notional value, and you cannot turn it into money except once a week, at whatever price the auction produces. It is the same lesson as the circuit lock in a slower form. Everything on this site about stops and exits assumes a market that is open and has participants, and surveillance can remove both.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A share exits surveillance after several months once its trading pattern normalises. Does the margin requirement drop back to normal immediately?',
      options: [
        'No — once a share has been under surveillance it can never return to normal margin requirements',
        'Yes, typically — once removed from the list, the requirement generally reverts to the ordinary rate',
        'It depends only on how long ago the company was founded',
      ],
      correct: 1,
      reveal:
        'Yes, typically. Surveillance measures are tied to the current trading pattern, not a permanent mark against the company. Once a share is removed from the list, the margin requirement generally reverts to whatever the ordinary rate is for a share of that kind.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'circuit-breaker',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'It is published, and almost nobody reads it',
      md:
        'The exchanges publish the current ASM and GSM lists, and updates before they take effect. It is free and it is checkable.\n\nThe practical habit is simple: **before buying anything outside the large well-known names, check whether it is on a list, and check again periodically for what you hold**.\n\nAnd size accordingly. A share that could enter surveillance is one where leverage is a bad idea, because the requirement can change faster than you can fund it.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A share is removed from a surveillance list after six months of calmer trading. Decide what most likely happens to its margin requirement.',
          type: 'decision',
          spec: {
            options: [
              'It stays at the surveillance-level requirement permanently',
              'It generally reverts to the ordinary requirement for a share of that kind',
              'It is set to zero as a reward for stabilising',
            ],
            correct: 'It generally reverts to the ordinary requirement for a share of that kind',
          },
          explanation:
            'It generally reverts. The restriction is tied to the current trading pattern, not a permanent mark, so it eases once the share is removed from the list.',
        },
        {
          prompt:
            'You hold ₹8,00,000 of a share at a 25% requirement. It moves to 100%. How much additional deposit is needed, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 600000, tolerance: 5000, unit: '₹' },
          explanation:
            '100% of ₹8,00,000 is ₹8,00,000, against ₹2,00,000 already posted, so ₹6,00,000 more — three times what you had committed, demanded within a day. Almost nobody has that available, which is why the practical outcome of a jump to 100% is a forced reduction rather than a top-up.',
        },
        {
          prompt:
            'Sort each consequence by whether surveillance can cause it.',
          type: 'classify',
          spec: {
            categories: ['Surveillance can do this', 'It does not'],
            items: [
              { label: 'Raise the margin on a position you already hold', category: 'Surveillance can do this' },
              { label: 'Withdraw intraday trading in that share', category: 'Surveillance can do this' },
              { label: 'Change the company’s earnings', category: 'It does not' },
              { label: 'Cancel trades you already completed', category: 'It does not' },
            ],
          },
          explanation:
            'It changes the terms of trading, not the business and not the past. That is a narrow power and it is enough to force a position closed, which is what makes it an edge case worth knowing. The business you researched is unchanged; the conditions under which you can hold it are not.',
        },
        {
          prompt:
            'You want to buy a small company that has doubled in two months on rising volume. Decide what to check first.',
          type: 'decision',
          spec: {
            options: [
              'Its earnings growth',
              'Whether it is on or near a surveillance list, and size as though leverage may vanish',
              'Its chart pattern',
            ],
            correct: 'Whether it is on or near a surveillance list, and size as though leverage may vanish',
          },
          explanation:
            'Check the list. A doubling on rising volume in a small company is precisely the profile that attracts surveillance, and the consequence lands on you rather than on the company. The earnings and the chart are worth examining too, and neither of them tells you that your margin might triple overnight. This is a free check that takes a minute and is skipped almost universally.',
        },
      ],
    },
  ],
};

export default lesson;
