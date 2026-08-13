import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T4 · Pro — rules a computer can follow
 *
 * Not a lesson about programming. It is about the discipline of specification:
 * writing an idea precisely enough that a machine could execute it, and
 * discovering in the process how much of the idea was never actually there.
 *
 * The valuable part happens before any code. "Buy when it breaks out" turns
 * into four unanswered questions — breaks out of what, measured over how long,
 * by how much, and what if it gaps past the level — and a person who cannot
 * answer them does not have a strategy. They have a feeling with a name.
 *
 * The lesson is useful to somebody who will never automate anything, which is
 * why it sits in the professional stage rather than being an engineering aside.
 */
export const lesson: Lesson = {
  id: 'in-t4-algo',
  tier: 'T4',
  market: 'IN',
  title: 'Rules a computer can follow',
  summary:
    'Writing an idea precisely enough for a machine reveals how much of it was never there. Most strategies die at the specification, before any code is written.',
  plainSummary:
    'Turning a trading idea into exact rules is harder than it sounds. This shows what that process reveals, even if you never automate anything.',
  objectives: [
    'Turn a vague setup description into a rule with no unanswered questions',
    'Identify the decisions a discretionary trader makes without noticing',
    'Say why a specification is useful even without automation',
    'Decide whether a described strategy is specific enough to test',
  ],
  prerequisites: ['in-t4-microstructure'],
  estimatedMinutes: 14,
  introduces: ['backtest', 'overfitting', 'lookahead-bias', 'base-rate', 'slippage', 'moving-average'],
  skills: ['specification', 'evidence', 'evaluation'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        '"Buy when it breaks out of resistance on good volume." How many decisions does a computer need answered that this sentence does not answer?',
      options: ['One or two', 'About four', 'Nine or more'],
      correct: 2,
      reveal:
        'Nine or more. Which resistance, measured over how many bars? How far above it counts as a break — one paisa, or half a percent? Good volume compared with what baseline? Do you buy the moment it crosses, or wait for the bar to close? What if it gaps straight past the level at the open? Where is the stop, where is the target, how much do you buy, and what happens if two setups fire on the same day? Every one of those is a decision a discretionary trader makes silently and differently each time, which is why their results cannot be tested.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'SpecificationGapExplainer',
      props: {},
      takeaway:
        'Step through it once. Nine or more silent decisions are hiding behind one confident-sounding sentence.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The specification is the product',
      md:
        'A rule a machine can follow has four parts and no gaps.\n\n**Entry.** A condition computable from data available at that moment.\n**Exit.** Both kinds — the one when you are wrong and the one when you are right.\n**Size.** A number, derived from the stop distance.\n**Everything else.** What happens on a gap, on two simultaneous signals, on a holiday, when the order does not fill.\n\nIf any of those is missing, you cannot test the idea. Not because testing is hard — because the idea is not yet a thing.',
    },
    {
      kind: 'game',
      game: 'chart-replay',
      config: {},
    },
    {
      kind: 'example',
      title: 'The same idea, before and after specification',
      setup:
        'The vague version is "buy breakouts on volume with a sensible stop". Here it is written so that two different people would place identical orders, which is the actual test.',
      steps: [
        {
          label: 'Entry condition',
          detail: 'Close above the highest high of the last 20 bars, by at least 0.3%',
          value: '20-bar high + 0.3%',
        },
        {
          label: 'Confirmation',
          detail: "Today's volume at least 1.5 times the average of the last 20 days",
          value: '1.5x 20-day average',
        },
        {
          label: 'Stop',
          detail: 'Below the lowest low of the last 10 bars, decided before entry',
          value: '10-bar low',
        },
        {
          label: 'Size, on a ₹5,00,000 account risking 1%',
          detail: 'Entry ₹1,400, stop ₹1,352 — the arithmetic, not a judgement',
          compute: { fn: 'sizeFromStop', equity: 500000, riskPercent: 1, entry: 1400, stop: 1352 },
        },
        {
          label: 'What the round trip costs',
          detail: 'Subtracted from every signal, winner or loser',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 1400, quantity: 104 },
        },
      ],
      conclusion:
        'Now it is testable. Whether it works is a separate question, and it is a question that can now be asked at all.',
    },
    {
      kind: 'predict',
      prompt:
        'You specify the rule, test it, and it loses money. Then you try 20-bar, 30-bar and 50-bar versions until one is profitable. What have you learnt?',
      options: [
        'That the profitable version is the right setting',
        'Almost nothing — you searched until the data agreed with you',
        'That the idea works but needs tuning',
      ],
      correct: 1,
      reveal:
        'Almost nothing. Trying settings until one passes is the multiplicity problem from stage 6, performed deliberately and while it feels like careful refinement. The result is contaminated by the search: whatever you found is the best-fitting number for this particular history, and best-fitting is not the same as real. The honest procedure is to specify once, from reasoning about the mechanism, and test once. If you must try several, hold data back and test the winner on it a single time.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "A trader writes: 'Buy when the 20-day average crosses above the 50-day average.' There is no exit rule at all, not vague, simply missing. Can this be tested?",
      options: [
        'Yes — untested exits do not affect whether a strategy can be evaluated',
        'No — without an exit, there is no way to know when a trade ends, so no result can be computed',
        'Yes, as long as the entry condition is precise',
      ],
      correct: 1,
      reveal:
        'No, it cannot be tested at all. Without an exit, a trade never closes, so there is no result to measure. A precise entry with no exit is not half a specification. It is an entry with nothing attached, and nothing can be evaluated until both halves exist.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PatternScanner',
      props: { symbol: 'RELIANCE.NS' },
      takeaway:
        'Ten fully specified rules, tested at once. Note that specifying them exactly is what made testing possible — and what makes the disappointing results trustworthy.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What automation does not fix',
      md:
        'A machine removes the emotion at the moment of execution. That is genuinely valuable and it is the whole benefit.\n\nIt does not improve the idea, and it moves the emotion rather than removing it. Now you decide whether to switch the system off, usually during a drawdown. Same decision, worse moment.\n\nAnd it introduces failures that discretion does not have: a stale data feed, a missed fill, a bug that sizes ten times too large. Those are silent and fast.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A trader has a precise, fully specified entry rule but no stated exit rule of any kind. Decide whether this strategy can be backtested.',
          type: 'decision',
          spec: {
            options: [
              'Yes, since the entry is precise and testable on its own',
              'No — without an exit, trades never close and no result exists to measure',
              'Yes, but only using the average holding period of similar strategies',
            ],
            correct: 'No — without an exit, trades never close and no result exists to measure',
          },
          explanation:
            'No. A trade that never closes produces no measurable result. An exit rule is not an optional extra — without it there is nothing to test.',
        },
        {
          prompt:
            'Account ₹5,00,000 risking 1%. Entry ₹1,400, stop at the 10-bar low of ₹1,352. How many shares does the rule buy?',
          type: 'compute',
          spec: { metric: 'literal', value: 104, tolerance: 3, unit: 'shares' },
          explanation:
            '₹5,000 of risk divided by ₹48 of stop distance is 104 shares. Note that nothing here was a judgement — every input came from the specification, which is the point. A rule where the size is chosen by feel is a rule with a hole in it, and the hole is where most of the variance in real results comes from.',
        },
        {
          prompt:
            'Sort each description by whether a computer could execute it without asking a question.',
          type: 'classify',
          spec: {
            categories: ['Fully specified', 'Still a feeling'],
            items: [
              { label: 'Close above the 20-bar high by at least 0.3%', category: 'Fully specified' },
              { label: 'Stop below the lowest low of the last 10 bars', category: 'Fully specified' },
              { label: 'Buy when the chart looks strong', category: 'Still a feeling' },
              { label: 'Exit when the move seems finished', category: 'Still a feeling' },
            ],
          },
          explanation:
            'The two on the right get applied differently depending on whether you are already in the position. Looser when you want to stay, tighter when you are nervous. That inconsistency is invisible from inside and is exactly what makes discretionary results impossible to evaluate. Writing the rule down does not commit you to automating it; it commits you to applying it the same way twice.',
        },
        {
          prompt:
            'Somebody offers you a system whose settings were chosen because they performed best over the last five years. Decide what you have learnt from that record.',
          type: 'decision',
          spec: {
            options: [
              'That the settings are good',
              'Very little — the settings were selected using the same data they are judged on',
              'That the system works in this market',
            ],
            correct: 'Very little — the settings were selected using the same data they are judged on',
          },
          explanation:
            'Very little. Given enough settings to try, one will look excellent on any five years whether or not it has merit — that is guaranteed by searching. The only meaningful evidence is performance on data that was not available when the settings were chosen. Ask when the parameters were fixed and what has happened since; a straight answer to that is worth more than any backtest chart.',
        },
      ],
    },
  ],
};

export default lesson;
