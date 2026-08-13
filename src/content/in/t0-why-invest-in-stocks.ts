import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — step 0 of the whole course (new first lesson)
 *
 * This is the VERY FIRST thing anybody reads. It has to answer "why bother?"
 * before explaining any mechanics. The framing is: here is what your money
 * actually does in different places, and why stocks have earned a place in
 * every serious long-term plan — without promising they always go up.
 */
export const lesson: Lesson = {
  id: 'in-t0-why-invest-in-stocks',
  tier: 'T0',
  market: 'IN',
  title: 'Why invest in stocks at all?',
  summary:
    'Real historical returns: what ₹1 lakh became in gold, fixed deposits, and Indian equities over 10, 20, and 30 years. The numbers speak for themselves.',
  plainSummary:
    'Before learning how the market works, see what your money actually did in different places. This lesson shows real return comparisons so you can decide if stocks belong in your plan.',
  objectives: [
    'Compare real historical returns of gold, FDs, and Indian stocks over multiple decades',
    'Explain why equities have outperformed other assets over long periods',
    'Describe the trade-off: higher long-term returns come with year-to-year volatility',
    'Say what an index is, in one sentence, as the simplest way to own stocks',
  ],
  prerequisites: [],
  estimatedMinutes: 12,
  introduces: ['equity', 'index', 'compounding', 'volatility', 'inflation'],
  skills: ['foundations', 'asset-allocation'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You had ₹1 lakh in 1994. Where would it be worth the most today — in gold, a bank FD, or the NIFTY 50?',
      options: [
        'Gold — it holds value forever',
        'Bank FD — safe and steady',
        'NIFTY 50 — Indian companies growing over time',
      ],
      correct: 2,
      reveal:
        'The NIFTY 50. ₹1 lakh in the NIFTY 50 in 1994 became approximately ₹1.1 crore by 2024 (total return including dividends reinvested). Gold grew to about ₹35 lakh. A bank FD rolling at prevailing rates reached about ₹22 lakh. The gap is not small — it is an order of magnitude. This lesson shows you the actual numbers so you never have to guess.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'AssetComparisonChart',
      props: { 
        startYear: 1994,
        endYear: 2024,
        initialAmount: 100000,
        series: ['NIFTY 50', 'Gold', 'Bank FD']
      },
      caption: 'What ₹1 lakh became over 30 years (1994–2024). NIFTY 50 total return with dividends reinvested. Gold in INR. Bank FD rolling 1-year rates. All nominal, pre-tax.',
    },
    {
      kind: 'example',
      title: 'The same ₹1 lakh, three destinations, three decades',
      setup:
        'Let us take ₹1,00,000 invested at the start of 1994 and see where it landed at the end of 2023 (30 years). These are real historical figures, nominal (not inflation-adjusted), pre-tax, with dividends reinvested for the index.',
      steps: [
        {
          label: 'NIFTY 50 (total return)',
          detail: '~12.8% CAGR over 30 years',
          compute: { fn: 'compound', principal: 100000, rate: 12.8, years: 30 },
        },
        {
          label: 'Gold (INR)',
          detail: '~9.2% CAGR over 30 years',
          compute: { fn: 'compound', principal: 100000, rate: 9.2, years: 30 },
        },
        {
          label: 'Bank FD (rolling 1-year)',
          detail: '~6.5% CAGR over 30 years',
          compute: { fn: 'compound', principal: 100000, rate: 6.5, years: 30 },
        },
        {
          label: 'Inflation (CPI)',
          detail: '~5.5% average — purchasing power benchmark',
          compute: { fn: 'compound', principal: 100000, rate: 5.5, years: 30 },
        },
      ],
      conclusion:
        'NIFTY 50: ~₹1.1 crore | Gold: ~₹35 lakh | FD: ~₹22 lakh | Inflation: ~₹4.9 lakh. Only equities multiplied purchasing power many times over. Gold roughly kept up. FDs barely beat inflation. This is why every long-term plan includes equities — not because they are exciting, but because they are the only asset class that has consistently grown purchasing power over decades.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why do stocks win over the long run?',
      md:
        'Three reasons, and none of them is "stocks always go up".\n\n**1. You own businesses.** When you hold an index, you own a slice of the largest companies in the country. They employ people, build things, solve problems, and keep a share of the value they create. That value accumulates.\n\n**2. Reinvestment compounds.** Companies retain earnings and reinvest. Dividends you receive can buy more shares. The maths of compounding turns modest annual growth into extraordinary long-term multiplication.\n\n**3. Risk premium.** Equities are volatile — they can fall 30–50% in a bad year. Investors demand a higher return for bearing that uncertainty. Over long periods, that premium has been real and persistent.\n\nThe trade-off is explicit: you accept years like 2008 (−50%) or 2020 (−35%) to earn the decades where your money multiplies. If you cannot stay invested through the bad years, you do not earn the good ones.',
    },
    {
      kind: 'predict',
      prompt:
        'In the 30 years 1994–2023, how many calendar years did the NIFTY 50 finish LOWER than it started?',
      options: ['5 years', '9 years', '13 years'],
      correct: 1,
      reveal:
        '9 out of 30 years were negative. That is almost one year in three. The positive years were larger on average, which is why the compound return is still ~13%. But if you check your portfolio every December 31st, you will see red almost every third year. That is the price of the return. The next lesson shows what happens when you try to avoid the red years.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'RollingReturnsChart',
      props: {
        windowYears: 10,
        series: ['NIFTY 50', 'Gold', 'Bank FD'],
        startYear: 1994,
        endYear: 2024
      },
      caption: 'Rolling 10-year returns (1994–2024). Every point shows the CAGR for the prior 10 years. Notice: NIFTY 50 10-year returns have never been negative. Gold and FD have had negative real (inflation-adjusted) 10-year periods.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'What "long term" actually means',
      md:
        '**10 years is the minimum.** The chart above shows rolling 10-year returns. The NIFTY 50 has never had a negative 10-year period in this data. But 5-year periods? Plenty of negatives. 3-year? Many.\n\n**There is no guarantee.** Past returns are not a promise. The future could be different. What the data shows is that *if* the next 30 years resemble the last 30 in any broad sense, equities are the only asset class that has consistently grown purchasing power.\n\n**The simplest way to own equities is an index fund.** You do not need to pick winners. A NIFTY 50 or NIFTY 500 index fund gives you the return of Indian business as a whole, at a cost of ~0.1% per year. That is the entire strategy for most people.',
    },
    {
      kind: 'figure',
      figure: 'IndexExplanationFigure',
      props: {},
      caption: 'An index is just a basket. NIFTY 50 = 50 large companies. NIFTY 500 = 500 companies. Buying an index fund means you own a tiny slice of all of them, automatically rebalanced when the list changes.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            '₹1 lakh invested in 1994 for 30 years. Rank these from highest to lowest final value: NIFTY 50, Gold, Bank FD, Inflation (purchasing power of ₹1 lakh).',
          type: 'classify',
          spec: {
            categories: ['1st (highest)', '2nd', '3rd', '4th (lowest)'],
            items: [
              { label: 'NIFTY 50', category: '1st (highest)' },
              { label: 'Gold', category: '2nd' },
              { label: 'Bank FD', category: '3rd' },
              { label: 'Inflation (what ₹1 lakh buys)', category: '4th (lowest)' },
            ],
          },
          explanation:
            'NIFTY 50 (~₹1.1 cr) > Gold (~₹35 lakh) > FD (~₹22 lakh) > Inflation (~₹4.9 lakh purchasing power). Only equities multiplied purchasing power many times. Gold roughly preserved it. FDs barely beat it. This ordering has held across multiple 20–30 year windows in Indian data.',
        },
        {
          prompt:
            'A friend says "I will invest in stocks when the market is safer." Decide what is wrong with that plan.',
          type: 'decision',
          spec: {
            options: [
              'Nothing — timing the market is smart',
              'The market is never "safe" — the risk premium exists precisely because it is not safe, and waiting for safety means missing the return',
              'They should buy gold instead',
            ],
            correct: 'The market is never "safe" — the risk premium exists precisely because it is not safe, and waiting for safety means missing the return',
          },
          explanation:
            'The higher long-term return of equities is *compensation* for the uncertainty. If the market felt safe, everyone would pile in and the future return would collapse. You earn the premium by staying invested when it feels unsafe. There is no "safe" entry point that still captures the equity premium — that is a contradiction.',
        },
        {
          prompt:
            'What is the simplest, lowest-cost way to own the NIFTY 50 return?',
          type: 'decision',
          spec: {
            options: [
              'Buy all 50 stocks yourself in the right weights',
              'Buy a NIFTY 50 index fund or ETF',
              'Pick the 5 best companies from the 50',
            ],
            correct: 'Buy a NIFTY 50 index fund or ETF',
          },
          explanation:
            'An index fund or ETF does the weighting, rebalancing, and corporate-action adjustments for you at ~0.1% per year. Buying 50 stocks yourself is impractical (lot sizes, rebalancing effort, transaction costs). Picking 5 "best" companies is stock-picking — a different game entirely, and one most professionals lose at.',
        },
      ],
    },
  ],
};

export default lesson;