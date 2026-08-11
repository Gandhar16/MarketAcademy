import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T3 · Advanced — expiry-day mechanics
 *
 * The day the abstraction ends. Everything earlier in the stage is about a
 * contract as a tradeable thing whose price moves; this is about what happens
 * when it stops being tradeable and becomes an obligation or nothing.
 *
 * Three mechanisms, in order of how many accounts they have damaged:
 *
 *   1. Settlement is against an AVERAGE, not the closing tick. People place
 *      trades in the last minutes believing they can influence or read a number
 *      that was already half-determined.
 *   2. Pin risk. Sitting exactly at the level on the last day is the one place
 *      where you cannot know whether you will be assigned.
 *   3. Indian single-stock contracts settle PHYSICALLY. That is the modern
 *      account-killer and it gets its own T5 lesson; this one makes sure nobody
 *      arrives there without warning.
 *
 * The lesson deliberately does NOT repeat the old "STT on exercised ITM
 * options" folklore, which was fixed on 2019-09-01 and is still everywhere.
 */
export const lesson: Lesson = {
  id: 'in-t3-expiry',
  tier: 'T3',
  market: 'IN',
  title: 'Expiry-day mechanics',
  summary:
    'The day a contract stops being a price and becomes an outcome. Settlement averages, the level you do not want to sit on, and the obligation nobody reads about first.',
  plainSummary:
    'These contracts have a last day. This explains exactly what happens on it, which is not what most people assume.',
  objectives: [
    'Say what price a contract is settled against, and why it is not the last tick',
    'Explain why sitting exactly at the level on the final day is the worst place to be',
    'Identify which contracts end in cash and which end in shares',
    'Compute what a contract is worth at expiry from a settlement price',
  ],
  prerequisites: ['in-t3-greeks'],
  estimatedMinutes: 15,
  introduces: ['expiry', 'option', 'strike-price', 'premium', 'intrinsic-value', 'time-value', 'moneyness', 'spot-price', 'physical-settlement', 'lot-size', 'underlying', 'future'],
  skills: ['expiry-mechanics', 'settlement'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'It is the last day. NIFTY spends the afternoon at 23,980, then jumps to 24,030 in the final two minutes. Your 24,000 call — is it worth anything?',
      options: [
        'Yes, it closed above the level',
        'Probably not — settlement uses an average of the last half hour',
        'Yes, but only the last 30 points',
      ],
      correct: 1,
      reveal:
        'Probably not. Indian index contracts are settled against the average price over the last half hour of trading, not the closing tick. An afternoon spent at 23,980 dominates that average, and two minutes at 24,030 barely moves it. This exists precisely to stop anybody buying the close to force a settlement in their favour. The practical consequence is that the live price in the final minutes tells you much less than it appears to. A contract that looks like it just came good may not have.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What the last day removes',
      md:
        'Everything you have learnt about these contracts assumes there is time left. On the final day that assumption expires with them.\n\n**Time value goes to exactly zero.** Not approximately. A contract is worth precisely what it would gain if used right now, and nothing else.\n\n**The choice disappears.** Anything in the money is exercised automatically. Anything out of the money simply ends.',
    },
    {
      kind: 'widget',
      component: 'ExpiryComparator',
      props: {},
      takeaway:
        'Move the settlement price across the level and watch the value of the position jump from nothing to something. There is no gentle slope on the last day.',
    },
    {
      kind: 'example',
      title: 'Four contracts, one settlement price',
      setup:
        'NIFTY settles at 24,050. You are holding four different contracts, all expiring today. Each cost you something a week ago, and each is now worth exactly what it would gain if used — no more.',
      steps: [
        {
          label: '23,900 call',
          detail: 'Settlement is 150 above the level',
          compute: { fn: 'optionIntrinsic', spot: 24050, strike: 23900, type: 'call' },
        },
        {
          label: '24,000 call',
          detail: 'In the money, but only just',
          compute: { fn: 'optionIntrinsic', spot: 24050, strike: 24000, type: 'call' },
        },
        {
          label: '24,100 call',
          detail: 'Settlement is below the level. It ends here',
          compute: { fn: 'optionIntrinsic', spot: 24050, strike: 24100, type: 'call' },
        },
        {
          label: '24,200 put',
          detail: 'Puts run the other way — this one finished well in the money',
          compute: { fn: 'optionIntrinsic', spot: 24050, strike: 24200, type: 'put' },
        },
        {
          label: 'The 24,100 call, a week earlier',
          detail: 'What it cost when there was still time in it',
          compute: { fn: 'optionPrice', spot: 24000, strike: 24100, days: 7, ivPercent: 14, type: 'call' },
        },
      ],
      conclusion:
        'The one that expired worthless was not obviously worthless a week ago. That is what time value is, and where it goes.',
    },
    {
      kind: 'predict',
      prompt:
        'Same settlement of 24,050. Work it out from the table before you look. You hold one lot of 75 of the 23,900 call. What do you receive?',
      options: ['₹150', '₹11,250', '₹1,800,000', 'Nothing until you sell it'],
      correct: 1,
      reveal:
        'Eleven thousand two hundred and fifty rupees. It is worth 150 points, and a lot is 75 units, so 150 × 75. You do not have to sell it, or do anything at all. An in-the-money index contract is settled in cash automatically, and the money appears in your account. If you answered ₹150 you read the points as rupees, which is the same error that makes people size these positions at a fraction of what they actually took on.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Pin risk: the level you do not want to sit on',
      md:
        'If you have **sold** a contract and the settlement lands almost exactly on your level, you are in the one situation nobody can resolve for you.\n\nSlightly in the money and you are assigned. Slightly out and you are not. You will not know which until after the close, and the two outcomes leave you holding completely different positions on the following morning.\n\nThe fix is not cleverness. It is closing the position before the last hour rather than collecting the final few rupees.',
    },
    {
      kind: 'widget',
      component: 'PhysicalSettlementCalculator',
      props: {},
      takeaway:
        'Switch it to a single-stock contract. Read what you would owe if it expires in the money — that number is not the premium, and it is not optional.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Index ends in cash. Single stocks end in shares.',
      md:
        'A NIFTY contract that finishes in the money pays you the difference in cash. Nothing is delivered and nothing is owed.\n\nA **single-stock** contract in India is settled by delivering the actual shares. A contract that cost ₹2,000 can leave you owing lakhs for the shares themselves, on a day you were not watching.\n\nThis is the modern account-killer and it has its own lesson later. For now: know which kind you are holding, and never let a single-stock contract reach the last day by accident.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'NIFTY settles at 23,860. You hold one lot of 75 of the 24,000 put. What do you receive, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 10500, tolerance: 10, unit: '₹' },
          explanation:
            '24,000 − 23,860 = 140 points, times a lot of 75, is ₹10,500. Two steps, and both are easy to get wrong: puts subtract in the opposite order to calls, and the answer is in points until you multiply by the lot. Doing this sum on the morning of the last day, for every contract you hold, takes a minute and removes every expiry-day surprise that is removable.',
        },
        {
          prompt:
            'You have SOLD a single-stock call. It is expiry day and the share is sitting within a rupee of your level. Decide what to do.',
          type: 'decision',
          spec: {
            options: [
              'Hold — it is a coin flip and the premium is already yours',
              'Close the position now, even at a poor price',
              'Wait for the close and see which way it lands',
            ],
            correct: 'Close the position now, even at a poor price',
          },
          explanation:
            'Close it. The two outcomes are not symmetric: assigned means delivering shares you may not own, against money you may not have, discovered after the market has shut. The few rupees of remaining premium are not payment for that. This is the one situation in derivatives where the correct move is to accept a bad price on purpose, because the alternative is an outcome you cannot size in advance.',
        },
        {
          prompt:
            'Sort each contract by how it is settled in India when it finishes in the money.',
          type: 'classify',
          spec: {
            categories: ['Settled in cash', 'Settled by delivering shares'],
            items: [
              { label: 'A NIFTY index call', category: 'Settled in cash' },
              { label: 'A BANKNIFTY index put', category: 'Settled in cash' },
              { label: 'A RELIANCE single-stock call', category: 'Settled by delivering shares' },
              { label: 'A single-stock futures contract', category: 'Settled by delivering shares' },
            ],
          },
          explanation:
            'The split is index against single stock, and it is the single most consequential thing on this page. An index contract can only ever pay or expire. A single-stock contract can hand you an obligation many times its own price, and it does so automatically, on a Thursday, whether or not you were paying attention.',
        },
      ],
    },
  ],
};

export default lesson;
