import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — spreads and combinations
 *
 * Almost every options course teaches this as a bestiary: here is a bull call
 * spread, here is an iron condor, here are the twelve you must memorise. That
 * approach fails because a name is not a mechanism — a learner who memorises
 * twelve recipes cannot build the thirteenth, and cannot tell when the one they
 * memorised no longer fits.
 *
 * So this lesson teaches ONE operation: adding a leg changes the shape. Every
 * named structure is then just a shape somebody found useful enough to name.
 * The learner builds the shapes rather than looking them up, and the embedded
 * game grades on the SHAPE, so an equivalent construction passes — which is the
 * point, because arriving at a different valid answer means you understood more
 * rather than less.
 */
export const lesson: Lesson = {
  id: 'in-t3-spreads',
  tier: 'T3',
  market: 'IN',
  title: 'Combining legs into a shape',
  summary:
    'Not a list of names to memorise. One operation — add a leg, change the shape — and every named structure falls out of it.',
  plainSummary:
    'You can hold more than one of these contracts at once, and together they behave differently from either alone. This shows you how to build the combination you want.',
  objectives: [
    'Describe what adding a second leg does to the shape of a position',
    'Say what a capped position gives up in exchange for capping the loss',
    'Compute the maximum gain and maximum loss of a two-leg position',
    'Build a structure that matches a stated target shape',
  ],
  prerequisites: ['in-t3-greeks'],
  estimatedMinutes: 17,
  introduces: ['option', 'call-option', 'put-option', 'strike-price', 'premium', 'expiry', 'moneyness', 'spot-price', 'underlying'],
  skills: ['payoffs', 'options-structures'],
  blocks: [
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 24000,
        editable: true,
        legs: [{ type: 'call', quantity: -1, strike: 24200, premium: 90 }],
      },
      takeaway:
        'One sold call. Read the worst case — it has no bottom. Now add a bought call at 24,400 and watch the open end close.',
    },
    {
      kind: 'predict',
      prompt:
        'You sold a 24,200 call for ₹90 and then bought a 24,400 call for ₹40. NIFTY finishes at 26,000. What have you lost?',
      options: ['Nothing — you collected ₹50', 'About ₹150', 'About ₹1,750', 'Everything above 24,200'],
      correct: 1,
      reveal:
        'About ₹150 per unit, and that is the most you can ever lose on it. The two levels are 200 apart, and you collected ₹50 net, so the worst case is 200 minus 50. Above 24,400 the two legs move together and cancel each other exactly, however far the index runs. That is the entire operation this lesson is about. The bought leg does nothing for you most of the time and costs ₹40 every single time. In exchange it converts an unlimited loss into a number you can write down before you enter.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'CappedShapeExplainer',
      props: {},
      takeaway:
        'Step through it once. The same open-ended loss line, closed by a single added leg above it.',
    },
    {
      kind: 'figure',
      figure: 'SpreadDiagram',
      props: {},
      caption:
        'Every leg you add is bought or sold in a real market with a gap between the two sides. A four-leg structure crosses that gap four times going in and four times coming out.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The only rule you need',
      md:
        'A position is the **sum** of its legs, at every price.\n\nAdd a bought leg and the shape bends upward from that level. Add a sold leg and it bends downward. That is it — every named structure is some arrangement of those bends.\n\nSo do not memorise names. Ask two questions of any position: **where does it bend**, and **what is the worst case at each end**? If both ends are closed, you know your maximum loss before you enter.',
    },
    {
      kind: 'example',
      title: 'Building a capped position, one leg at a time',
      setup:
        'NIFTY is at 24,000 with 30 days left and volatility at 14. You think it drifts up but not far. You want a position that gains from a modest rise, costs little, and cannot ruin you if you are badly wrong.',
      steps: [
        {
          label: 'Buy the 24,000 call',
          detail: 'Gains as NIFTY rises. On its own this is the whole cost',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24000, days: 30, ivPercent: 14, type: 'call' },
        },
        {
          label: 'Sell the 24,400 call against it',
          detail: 'You give up everything above 24,400 and get paid now for doing so',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24400, days: 30, ivPercent: 14, type: 'call' },
        },
        {
          label: 'Net cost of the pair',
          detail: 'Paid for one, collected on the other. This is also your maximum loss',
          compute: { fn: 'literal', value: 187 },
        },
        {
          label: 'The most it can make',
          detail: 'The 400-point gap between levels, less what the pair cost',
          compute: { fn: 'literal', value: 213 },
        },
        {
          label: 'Where you break even',
          detail: 'The lower level plus the net cost',
          compute: { fn: 'literal', value: 24187 },
        },
      ],
      conclusion:
        'Risk ₹187 to make ₹213, with both ends closed and both numbers known before you enter.',
    },
    {
      kind: 'predict',
      prompt:
        'Same position, but you sell the 24,200 call instead of the 24,400 — bringing the levels closer together. Work out the direction of each change before you look.',
      options: [
        'Costs less, and can make less',
        'Costs less, and can make more',
        'Costs more, and can make less',
      ],
      correct: 0,
      reveal:
        'Costs less and can make less. A nearer sold leg is worth more, so you collect more and your net cost falls. But the gap between the levels is what caps your gain, and you just narrowed it. This trade-off is the whole design space. Every structure you will ever meet is somebody choosing a point on it: pay more for a wider range of profit, or pay less and be right within a narrower band. Nobody gets both, and any explanation that suggests otherwise has left out a leg.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "You buy one 24,000 call, sell two 24,200 calls, and buy one 24,400 call — four contracts total. Using only the 'sum of legs' rule, is this position's maximum loss knowable before you enter?",
      options: [
        'No — positions with more than two legs are too complex to know the maximum loss in advance',
        "Yes — the same rule applies regardless of leg count: add up what each leg is worth at every price and read off the worst point",
        'Only with a formula specific to three-leg positions',
      ],
      correct: 1,
      reveal:
        "Yes. The 'sum of legs' rule does not care how many legs there are. The position's value at any price is each leg's value added together, and the worst point on that combined line is your maximum loss, knowable before you enter.",
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'payoff-builder',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'cost',
      title: 'What the bestiary leaves out',
      md:
        'Four legs means **eight** crossings of the bid-ask gap over the life of the trade, plus eight lots of charges.\n\nA structure whose maximum gain is ₹40 a unit can be a losing trade before the market does anything at all. This is why the elegant four-leg positions in tutorials perform so much worse in a real account than in the diagram.\n\nCompute the cost of getting in and out before you admire the shape.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            "A position combines four separate option contracts across three different strikes. Decide whether the 'add up the legs' method used for a two-leg spread still applies.",
          type: 'decision',
          spec: {
            options: [
              'No — four-leg positions need an entirely different method',
              "Yes — the method is the same regardless of leg count: sum each leg's value at every price",
              'Only if all four legs share the same strike',
            ],
            correct: "Yes — the method is the same regardless of leg count: sum each leg's value at every price",
          },
          explanation:
            'Yes, the same method. A position is always the sum of its legs, whether it has two of them or ten.',
        },
        {
          prompt:
            'You buy a 1,400 call for ₹60 and sell a 1,500 call for ₹25. What is the most this position can make, per unit?',
          type: 'compute',
          spec: { metric: 'literal', value: 65, tolerance: 1, unit: '₹' },
          explanation:
            'The gap between the levels is ₹100, and the pair cost you ₹35 net, so the most you can make is ₹65. Your maximum loss is that same ₹35. Both numbers exist before you enter and neither can be exceeded. That is exactly what the second leg bought you, and its price was everything above ₹1,500.',
        },
        {
          prompt:
            'Sort each statement by whether it is true of a single bought call or of that call with a higher one sold against it.',
          type: 'classify',
          spec: {
            categories: ['The single call', 'The capped pair'],
            items: [
              { label: 'Gains without limit if it keeps rising', category: 'The single call' },
              { label: 'Maximum gain is known before entry', category: 'The capped pair' },
              { label: 'Costs more to open', category: 'The single call' },
              { label: 'Loses less if nothing happens at all', category: 'The capped pair' },
            ],
          },
          explanation:
            'Every row is a trade, not an improvement. The pair is cheaper and safer in the flat case, and it hands back the one outcome people buy these for — the enormous rise. Neither is better in general. What matters is whether you are actually expecting the move that the uncapped version pays for, or just enjoying the possibility of it.',
        },
        {
          prompt:
            'Build the protective stop for 250 RELIANCE shares held at ₹1,400, capping the loss at ₹70 a share with the order type that guarantees an exit.',
          type: 'construct',
          spec: {
            instrument: { symbol: 'RELIANCE.NS', market: 'IN', tickSize: 0.05 },
            lastPrice: 1400,
            availableCash: 400_000,
            require: { side: 'sell', type: 'SL-M', triggerBetween: [1330, 1395], maxRiskPerUnit: 70 },
          },
          explanation:
            'A SELL SL-M with the trigger inside the band, on a multiple of the ₹0.05 tick. This sits in a spreads lesson deliberately: a capped structure caps the loss on the CONTRACTS, and it does nothing at all for the shares you hold underneath. People routinely build an elegant four-leg position and leave the largest exposure in the account completely unprotected.',
        },
      ],
    },
  ],
};

export default lesson;
