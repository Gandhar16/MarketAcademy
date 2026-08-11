import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — hedging
 *
 * The last step of stage 8, and the one that closes the loop: derivatives were
 * invented for this, and retail almost never uses them for it.
 *
 * THE HONEST VERSION, WHICH IS NOT THE SALES VERSION
 *
 * "Protect your portfolio" is sold as prudence. It is a purchase, and it is a
 * purchase with a negative expected return — you are paying somebody to take a
 * risk, and they price it to make money. Over many years, continuous protection
 * costs more than the crashes it covers.
 *
 * That does not make it wrong. It makes it insurance, and insurance is bought
 * for a reason other than expected value: because a particular outcome would be
 * unrecoverable rather than merely unpleasant. The lesson makes the learner
 * compute the annual cost first, then decide — which is the order nobody uses.
 */
export const lesson: Lesson = {
  id: 'in-t3-hedging',
  tier: 'T3',
  market: 'IN',
  title: 'Paying to reduce a risk',
  summary:
    'What derivatives were actually invented for. Work out the annual cost of protection before deciding whether the thing you fear is worth insuring against.',
  plainSummary:
    'You can pay to limit how much you lose if things go badly. This shows what that costs over a year, so you can decide whether it is worth it.',
  objectives: [
    'Describe what a protective position does to the shape of a holding',
    'Compute the annual cost of continuous protection as a share of the holding',
    'Explain why protection has a negative expected return and can still be rational',
    'Say what a covered sold call gives up in exchange for its income',
  ],
  prerequisites: ['in-t3-spreads'],
  estimatedMinutes: 16,
  introduces: ['option', 'put-option', 'call-option', 'strike-price', 'premium', 'expiry', 'moneyness', 'spot-price', 'underlying', 'position', 'drawdown'],
  skills: ['hedging', 'payoffs', 'portfolio'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You hold ₹10,00,000 of an index fund and you are worried about a crash. You buy puts 10% below the current level, costing 1.2% of the holding for three months. What is the expected effect over ten years?',
      options: [
        'You come out ahead — crashes happen',
        'Roughly break even, since it is a fair price',
        'You come out behind, by a meaningful amount',
      ],
      correct: 2,
      reveal:
        'You come out behind. Continuous protection at that price costs roughly 4.8% a year, and the crashes it covers do not arrive often enough or deep enough to repay that on average. Somebody is selling you those puts and they are not doing it as a favour. This is not a criticism of hedging — it is what insurance IS. Your house insurance also has a negative expected return, and you buy it anyway, because the outcome it covers is unrecoverable rather than merely expensive. That distinction is the entire subject.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 24000,
        editable: true,
        legs: [{ type: 'put', quantity: 1, strike: 21600, premium: 290 }],
      },
      takeaway:
        'This is the protection alone. Now imagine the holding underneath it — a straight rising line — and add the two together in your head.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What protection does to the shape',
      md:
        'A holding on its own is a straight line: it gains as the price rises and loses as it falls, without limit in either direction.\n\nAdd a bought put and the line **flattens below the level**. Falls beyond that point stop costing you anything, because the contract gains exactly as fast as the holding loses.\n\nWhat you gave up is not the upside. It is the **premium** — paid whether or not the fall ever arrives, which over enough years is most of the time.',
    },
    {
      kind: 'example',
      title: 'What a year of protection actually costs',
      setup:
        'You hold ₹10,00,000 of an index fund. You buy protection 10% below the current level, renewed every three months, at 1.2% of the holding each time. Here is the arithmetic nobody does before starting.',
      steps: [
        {
          label: 'Cost of one quarter',
          detail: '1.2% of the holding, paid up front',
          compute: { fn: 'percentOf', value: 1000000, percent: 1.2 },
        },
        {
          label: 'Four quarters of it',
          detail: 'Protection is not a one-off — it expires and has to be replaced',
          compute: { fn: 'multiply', a: 12000, b: 4, dp: 0 },
        },
        {
          label: 'As a share of the holding',
          detail: 'The drag on your return, every year, before anything happens',
          compute: { fn: 'literal', value: 4.8 },
        },
        {
          label: 'Over ten years, ignoring compounding',
          detail: 'What continuous protection costs across a decade',
          compute: { fn: 'multiply', a: 48000, b: 10, dp: 0 },
        },
        {
          label: 'What it saves in one 25% crash',
          detail: 'Falls below the 10% level are covered — 15% of the holding',
          compute: { fn: 'percentOf', value: 1000000, percent: 15 },
        },
      ],
      conclusion:
        'Ten years of protection costs ₹4,80,000 and one serious crash returns ₹1,50,000. You need roughly three of them a decade to break even.',
    },
    {
      kind: 'predict',
      prompt:
        'Same holding, but you buy protection 20% below the level instead of 10%. Work out both directions before you look.',
      options: [
        'Cheaper, and it covers less',
        'Cheaper, and it covers the same',
        'More expensive, and it covers more',
      ],
      correct: 0,
      reveal:
        'Cheaper, and it covers less. A level further away is less likely to be reached, so it costs less — and the first 20% of any fall is now yours to absorb. This is the same trade-off as an insurance excess, and it is where the real decision lives. The useful question is never "should I hedge" but "what size of loss would actually damage me". Protect against that, and accept everything above it. Protecting against a 5% fall is paying somebody to remove an outcome you could have survived comfortably.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PayoffChart',
      props: {
        centre: 24000,
        editable: true,
        legs: [
          { type: 'put', quantity: 1, strike: 22800, premium: 200 },
          { type: 'call', quantity: -1, strike: 25200, premium: 190 },
        ],
      },
      takeaway:
        'Protection paid for by selling away the upside. Read both ends: the fall is capped, and so is the rise. Almost free, and not free at all.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'The version that sounds like free money',
      md:
        'Selling a call against shares you already own is called a covered call, and it is genuinely popular because the income is real and arrives reliably.\n\nWhat it costs is the one outcome you were holding the shares for. Every large rise is capped at your level, and those rare large rises are where most long-term returns come from.\n\nSo it converts an occasional enormous gain into a steady small income. That is a real choice. It is not, as it is usually sold, a way of holding shares that simply pays more.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You hold ₹5,00,000 of a fund and pay 0.9% every quarter for protection. What does a full year cost, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 18000, tolerance: 100, unit: '₹' },
          explanation:
            '0.9% of ₹5,00,000 is ₹4,500 a quarter, and four of those is ₹18,000 — 3.6% of the holding every year, before the market does anything at all. Almost nobody computes this before starting, because each individual purchase feels small. The annual figure is the one that decides whether the protection is worth having.',
        },
        {
          prompt:
            'Sort each statement by whether it is true of buying protection or of selling a call against shares you own.',
          type: 'classify',
          spec: {
            categories: ['Buying protection', 'Selling a call against shares'],
            items: [
              { label: 'Money leaves your account now', category: 'Buying protection' },
              { label: 'Money arrives in your account now', category: 'Selling a call against shares' },
              { label: 'Caps how much you can lose', category: 'Buying protection' },
              { label: 'Caps how much you can gain', category: 'Selling a call against shares' },
            ],
          },
          explanation:
            'They are opposite trades and they are often sold as a pair, which hides that each one gives something up. Protection costs money continuously to remove a rare disaster. A covered call collects money continuously to remove a rare windfall. Doing both at once leaves you with a holding that can neither fall far nor rise far, and you should know that is what you built.',
        },
        {
          prompt:
            'You are 25, investing monthly for retirement, and you are considering permanent protection against falls. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Yes — never risk a crash',
              'Probably not, because a long horizon already absorbs falls and the annual cost compounds against you',
              'Only during years when the market looks expensive',
            ],
            correct:
              'Probably not, because a long horizon already absorbs falls and the annual cost compounds against you',
          },
          explanation:
            'Probably not. Protection is for a loss you could not recover from. A 25-year-old adding money monthly recovers from falls by continuing to add money, because a crash is when units are cheap. Paying 3 to 5% a year for four decades to avoid that is a very expensive way to feel calm. The third answer is market timing wearing a safety jacket: if you could tell which years needed protection, you would not need the protection.',
        },
      ],
    },
  ],
};

export default lesson;
