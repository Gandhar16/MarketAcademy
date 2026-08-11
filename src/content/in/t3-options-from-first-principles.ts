import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — options from first principles
 *
 * Options are taught badly almost everywhere: either as formulas nobody
 * internalises, or as strategies with names and no mechanism. This lesson
 * teaches the two things that actually matter — an option is a decaying bet on
 * a distribution, and the greeks are just its derivatives — by making the
 * learner move the inputs and watch what happens.
 *
 * The greek that ruins people is theta, and the one that surprises them is
 * vega, so both get their own reveal.
 */
export const lesson: Lesson = {
  id: 'in-t3-options-from-first-principles',
  tier: 'T3',
  market: 'IN',
  title: 'An option is a bet with a clock on it',
  summary:
    'Forget the formulas. Move the spot, the days and the volatility, and watch what an option is actually made of — then find out why being right about direction is not enough.',
  plainSummary:
    'An option is a bet with a deadline attached. This builds one up from nothing so the price makes sense to you, rather than being a number a screen shows you.',
  objectives: [
    'Separate an option’s price into intrinsic value and time value',
    'Predict how delta, gamma, theta and vega respond to spot, time and volatility',
    'Explain why a correct directional call can still lose money',
    'Read a payoff diagram and identify where loss is unbounded',
  ],
  prerequisites: ['in-t1-real-cost-of-a-trade'],
  estimatedMinutes: 19,
  introduces: ['option', 'call-option', 'put-option', 'strike-price', 'premium', 'expiry', 'intrinsic-value', 'time-value', 'volatility'],
  skills: ['options-pricing', 'greeks', 'payoffs'],
  blocks: [
    {
      kind: 'widget',
      component: 'GreeksExplorer',
      props: { strike: 24000, spot: 24000, days: 30, iv: 14, type: 'call' },
      takeaway:
        'Drag "days to expiry" from 30 down to 0 without touching anything else. Watch the price fall even though the spot never moved.',
    },
    {
      kind: 'predict',
      prompt:
        'You buy a NIFTY 24,000 call with 30 days left. Thirty days pass. NIFTY is at exactly 24,000 — precisely where you predicted. What is your option worth?',
      options: ['Roughly what I paid', 'A bit less than I paid', 'Zero', 'It depends on volatility'],
      correct: 2,
      reveal:
        'Zero. You were exactly right about direction and you lost every rupee. An at-the-money option has NO intrinsic value — it is entirely time value, and time value is guaranteed to reach zero at expiry. This is the most expensive misunderstanding in retail derivatives trading. Buying the contract is not a bet that you are right. It is a bet that you are right BY ENOUGH, BEFORE a specific date. The market being flat is not a neutral outcome for you. It is the worst one.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The two components, and only two',
      md:
        'Every option price splits into exactly two parts.\n\n**Intrinsic value** is what it would be worth if expiry were right now — spot minus strike, floored at zero. It cannot be taken from you by the passage of time.\n\n**Time value** is everything else: the market’s price for the possibility that things improve. It decays to zero by expiry with certainty, and it decays *faster* as expiry approaches.',
    },
    {
      kind: 'example',
      title: 'Where a 180 rupee premium actually goes',
      setup:
        'A NIFTY 24,000 call with 30 days left, NIFTY at 24,000, implied volatility 14 percent. Watch the premium dissolve as the calendar advances and nothing else changes at all: same spot, same volatility, only time passing.',
      steps: [
        {
          label: 'Today, 30 days out',
          detail: 'Entirely time value, because spot equals strike so intrinsic value is zero',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24000, days: 30, ivPercent: 14, type: 'call' },
        },
        {
          label: 'What a day costs you (theta)',
          detail: 'Charged whether the market opens or not. Options decay over weekends too',
          compute: { fn: 'optionGreek', greek: 'theta', spot: 24000, strike: 24000, days: 30, ivPercent: 14, type: 'call' },
        },
        {
          label: 'Two weeks later, spot unchanged',
          detail: 'You were right that it would not fall. That has not helped',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24000, days: 16, ivPercent: 14, type: 'call' },
        },
        {
          label: 'Three days from expiry',
          detail: 'Decay accelerates. The last week costs far more per day than the first',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24000, days: 3, ivPercent: 14, type: 'call' },
        },
        {
          label: 'At expiry, NIFTY exactly at 24,000',
          detail: 'The intrinsic value of an at-the-money option',
          compute: { fn: 'optionIntrinsic', spot: 24000, strike: 24000, type: 'call' },
        },
      ],
      conclusion:
        'You predicted the market perfectly and lost 100 percent of the premium. Buying an option is not a bet that you are right, it is a bet that you are right by enough, before a date.',
    },
    {
      kind: 'widget',
      component: 'GreeksExplorer',
      props: { strike: 24000, spot: 23400, days: 45, iv: 12, type: 'put' },
      takeaway:
        'Now hold everything still and drag implied volatility from 12% to 40%. Nothing about the market changed — only what people are willing to pay for uncertainty.',
    },
    {
      kind: 'predict',
      prompt:
        'You buy a straddle before results, expecting a big move. The result is announced, the stock jumps 4% — and your position loses money. What happened?',
      options: [
        'The move was not big enough to cover both premiums',
        'Implied volatility collapsed after the announcement',
        'Both of these, and the second usually dominates',
      ],
      correct: 2,
      reveal:
        'Both, and the volatility collapse usually dominates. Before an event, the market knows something is coming and prices options for a large move — implied volatility rises, and you pay for it. The moment the news is out, the uncertainty is gone and IV falls off a cliff, often from 45% to 20% overnight. Your vega exposure loses instantly and it does not care that you got the direction right. This is IV crush, and it is why "buy options before earnings" is a strategy that feels obvious and loses money with impressive consistency. The move has to beat not just the premium but the volatility repricing.',
      askWhy: true,
    },
    {
      kind: 'prose',
      md:
        'The greeks are not extra machinery. They are just the answers to "what happens if one thing changes":\n\n**Delta** — if spot moves ₹1. **Gamma** — how fast delta itself changes, which is why short options are calm right up until they are not. **Theta** — what a day costs you. **Vega** — what a 1% change in implied volatility does.\n\nYou do not need the formulas. You need to know which one is about to hurt you.',
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
        'This is a naked short call. Read the max-loss figure, then add a long call above it and watch the shape close.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You are long a 30-day at-the-money option. Which greek is guaranteed to work against you every single day, regardless of what the underlying does?',
          type: 'decision',
          spec: { options: ['Delta', 'Gamma', 'Theta', 'Vega'], correct: 'Theta' },
          explanation:
            'Theta. Delta helps or hurts depending on direction. Vega depends on whether volatility rises or falls. Gamma is genuinely on your side when you hold the contract. Theta is the one certainty. Every day that passes takes time value out of a long option and there is no market condition under which it does not. It also accelerates: the last week costs far more per day than the first.',
        },
        {
          prompt:
            'You sold an option and collected ₹90. Classify what you have taken on in each dimension.',
          type: 'classify',
          spec: {
            categories: ['Works for me', 'Works against me'],
            items: [
              { label: 'Time passing (theta)', category: 'Works for me' },
              { label: 'Implied volatility rising (vega)', category: 'Works against me' },
              { label: 'A large move against the strike (gamma)', category: 'Works against me' },
              { label: 'The market going nowhere', category: 'Works for me' },
            ],
          },
          explanation:
            'Selling options is the mirror image of buying them: time is now your ally and movement is your enemy. That is why it feels like free money for weeks and then takes it all back in an afternoon. The profits arrive in a slow drip. The losses arrive all at once. Collecting ₹90 caps your best case at ₹90 while leaving the worst case open, which is a trade you can make deliberately but should never make casually.',
        },
        {
          prompt:
            'A NIFTY 24,000 call trades at ₹180 with NIFTY at 24,000. How much of that ₹180 is intrinsic value?',
          type: 'compute',
          spec: {
            metric: 'literal',
            value: 0,
            tolerance: 0.01,
            unit: '',
            market: 'IN',
            venue: 'NSE',
            product: 'options',
            price: 180,
            quantity: 65,
          },
          explanation:
            'Zero. Spot equals strike, so exercising immediately would gain nothing — the entire ₹180 is time value, and the entire ₹180 is scheduled to disappear by expiry. When someone says an at-the-money option is "fairly priced", what they mean is that the market has priced the probability of a move. You are not buying the stock’s direction, you are buying the market’s uncertainty about it.',
        },
      ],
    },
  ],
};

export default lesson;
