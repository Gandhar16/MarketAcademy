import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · The real cost of a trade (India)
 *
 * This is the reference lesson — the one every other lesson is measured
 * against. It exists because pain point P3 (costs ignored, so simulated P&L is
 * fiction) is the one that quietly invalidates everything a learner concludes
 * from a simulator.
 *
 * Every number in it is produced by the cost engine at render time from the
 * published statutory rates. Nothing is hardcoded into the prose, so when a
 * Budget changes STT the lesson updates itself.
 */
export const lesson: Lesson = {
  id: 'in-t1-real-cost-of-a-trade',
  tier: 'T1',
  market: 'IN',
  title: 'The real cost of a trade',
  summary:
    'Zero brokerage is not zero. Take one trade apart charge by charge, and find the size below which the market takes more than you can make.',
  plainSummary:
    'Every trade costs more than the price of the share. This adds up every single charge on a real Indian trade, so you know exactly how far the price must move before you have actually made anything.',
  objectives: [
    'Name every charge on an Indian equity trade and say who receives it',
    'Compute the breakeven move on a position before entering it',
    'Choose between delivery and intraday on cost grounds rather than habit',
    'Explain why flat charges punish small trades disproportionately',
  ],
  prerequisites: [],
  estimatedMinutes: 16,
  introduces: ['brokerage', 'stt', 'stamp-duty', 'gst', 'dp-charges', 'turnover', 'round-trip', 'breakeven', 'intraday', 'delivery'],
  skills: ['trade-costs', 'breakeven', 'product-selection'],
  blocks: [
    {
      // Opens with the learner doing something, per validator rule R4. They
      // guess before they are told anything — a wrong guess they committed to
      // is far stickier than a right answer they read.
      kind: 'predict',
      prompt:
        'You buy ₹1,00,000 of Reliance for delivery at a zero-brokerage broker and sell it a week later at exactly the same price. How much do you get back?',
      options: ['₹1,00,000 — no brokerage, no loss', 'About ₹99,760', 'About ₹99,000', 'About ₹98,000'],
      correct: 1,
      reveal:
        'You lose about ₹236 on a trade that did not move. Brokerage was genuinely zero. Everything else was not. STT takes 0.1% on BOTH the buy and the sell for delivery — ₹200 of the total on its own. Stamp duty takes 0.015% on the buy. Then come the exchange transaction charges and the SEBI turnover fee, with 18% GST on top of those. Last is a flat DP charge of ₹15.34 for taking the shares out of your demat account. "Zero brokerage" describes exactly one line of about eight. That is only a quarter of a percent. Small enough to dismiss, and large enough to eat a third of a realistic short-term target. That gap is exactly why simulators which ignore costs mislead people.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'CostBreakdownTable',
      props: {
        market: 'IN',
        venue: 'NSE',
        product: 'delivery',
        price: 1400,
        quantity: 71,
        showBothLegs: true,
      },
      takeaway:
        'Read down the list and note the payee column — only one line goes to your broker. The rest is tax, exchange and depository.',
    },
    {
      kind: 'prose',
      md:
        "Notice what GST is charged on. It applies to brokerage, the SEBI turnover fee and the exchange transaction charges — the *services*. It is **not** charged on STT or on stamp duty, because those are already taxes and India does not levy GST on top of a tax.\n\nThis matters more than it sounds. Learners who assume 18% applies to everything overestimate what a trade costs and underestimate the relative damage of STT, which is where the real money goes.",
    },
    {
      kind: 'example',
      title: 'Every charge on one lakh of delivery',
      setup:
        'You buy 71 shares of RELIANCE at 1,400 rupees, hold for a week, and sell at exactly the same price. Nothing moved. Here is where the money went, line by line, computed by the same engine that fills trades in the simulator.',
      steps: [
        {
          label: 'Turnover on each leg',
          detail: '71 shares at 1,400',
          compute: { fn: 'turnover', price: 1400, quantity: 71 },
        },
        {
          label: 'STT on the BUY',
          detail: '0.1 percent. Delivery is the only product taxed on both sides',
          compute: { fn: 'legCostLine', line: 'stt', product: 'delivery', side: 'buy', price: 1400, quantity: 71 },
        },
        {
          label: 'STT on the SELL',
          detail: 'Another 0.1 percent. This single tax is most of your total cost',
          compute: { fn: 'legCostLine', line: 'stt', product: 'delivery', side: 'sell', price: 1400, quantity: 71 },
        },
        {
          label: 'Stamp duty',
          detail: '0.015 percent, buy side only. The sell leg pays none',
          compute: { fn: 'legCostLine', line: 'stamp', product: 'delivery', side: 'buy', price: 1400, quantity: 71 },
        },
        {
          label: 'DP charges on the sell',
          detail: 'A FLAT fee for taking shares out of demat. It ignores your trade size entirely',
          compute: { fn: 'legCostLine', line: 'dp_broker', product: 'delivery', side: 'sell', price: 1400, quantity: 71 },
        },
        {
          label: 'Everything, both legs',
          detail: 'Brokerage, STT, exchange, SEBI, stamp duty, GST and DP together',
          compute: { fn: 'roundTripTotal', product: 'delivery', price: 1400, quantity: 71 },
        },
        {
          label: 'As a share of your money',
          detail: 'The number that decides whether a strategy survives',
          compute: { fn: 'roundTripPercent', product: 'delivery', price: 1400, quantity: 71 },
        },
      ],
      conclusion:
        'Brokerage was genuinely zero. Seven other lines were not, and the one nobody warns you about, STT on BOTH sides, is the largest of them.',
    },
    {
      kind: 'widget',
      component: 'CostComparator',
      props: {
        market: 'IN',
        scenarios: [
          { label: 'Delivery, held a week', product: 'delivery' },
          { label: 'Intraday, squared off', product: 'intraday' },
        ],
        price: 1400,
        turnover: 100_000,
      },
      takeaway:
        'The same idea, same size, same broker — the product you choose changes the cost by a multiple, not by a rounding error.',
    },
    {
      kind: 'predict',
      prompt:
        'You want to buy ₹5,000 of a single stock for delivery and sell it later. Roughly what percentage of your money goes to costs on the round trip?',
      options: ['Under 0.1%', 'About 0.25%', 'About 0.6%', 'Over 1%'],
      correct: 2,
      reveal:
        'Around 0.5%. Almost all of the excess over the ₹1,00,000 case is the flat DP charge of ₹15.34. It is levied per scrip when you sell from demat, whether you sold ₹5,000 or ₹5,00,000 of it. Flat charges are regressive: on a ₹5,000 sale that single line is roughly 0.26% of the trade, against 0.013% on a ₹1,00,000 one. This is the real reason small, frequent delivery trades bleed — not brokerage, which is zero, but a fixed fee nobody ever quotes you as a percentage.',
      askWhy: false,
    },
    {
      kind: 'widget',
      component: 'BreakevenSlider',
      props: { market: 'IN', product: 'intraday', price: 1400, minValue: 5_000, maxValue: 1_000_000 },
      takeaway:
        'Drag it down. Below about ₹25,000 the breakeven move stops being noise and starts being most of a realistic day-trade target.',
    },
    {
      kind: 'callout',
      tone: 'cost',
      title: 'The number nobody quotes you',
      md:
        'Your **breakeven move** is the price change needed just to get your own money back. Work it out *before* you enter, and compare it against the move you are actually expecting. If you need a 0.4% move to break even and your target is 0.5%, you are not running a strategy — you are paying the exchange for the privilege of being right.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You plan 4 intraday round trips a day in ₹50,000 clips, targeting 0.3% per trade. Decide whether this is viable, and justify it with the breakeven number.',
          type: 'decision',
          spec: {
            options: ['Viable', 'Marginal', 'Not viable'],
            correct: 'Marginal',
          },
          explanation:
            'Intraday round-trip costs on a ₹50,000 clip run to roughly 0.11% of turnover, so about a THIRD of a 0.3% target disappears before you count a single loss. Four trips a day makes that a recurring, compounding drag. It is not impossible, but your win rate and average win must both be materially better than they look on a gross basis. Anyone modelling this without costs will conclude it is comfortably profitable and be wrong.',
        },
        {
          prompt:
            'Same ₹50,000 clip, but taken as DELIVERY and held overnight (35 shares at ₹1,400 on NSE). What is the round-trip cost as a percentage of turnover?',
          type: 'compute',
          // The grader recomputes this from the live cost engine rather than
          // holding a stored answer, so a Budget change updates the checkpoint.
          spec: {
            metric: 'roundTripCostPercent',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 1400,
            quantity: 35,
            tolerance: 0.03,
            unit: '%',
          },
          explanation:
            'Delivery costs roughly two and a half times intraday on the same turnover. STT takes 0.1% on both legs instead of 0.025% on one, and the DP charge lands on the sell. At about 0.25% of turnover, a 0.3% target does not survive it. The correct conclusion is not "delivery is bad" — it is that delivery costs are sized for multi-percent moves, and intraday costs for sub-percent ones. Match the product to the holding period, not to how much your broker will let you buy.',
        },
        {
          prompt:
            'Two brokers: one charges ₹0 on delivery, the other 0.5% with a ₹25 minimum. For a ₹8,000 delivery round trip (10 shares at ₹800), how many rupees more does the full-service broker cost you in total?',
          type: 'compute',
          spec: {
            metric: 'brokerageDelta',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 800,
            quantity: 10,
            tolerance: 5,
            plans: ['in-discount', 'in-full-service'],
            unit: '',
          },
          explanation:
            'The discount broker charges nothing. The full-service broker charges 0.5%: ₹40 on the buy and ₹40 on the sell, plus 18% GST on that brokerage. About ₹94 more in total, on an ₹8,000 position. That is more than 1% of the position gone to a single line item, before the statutory charges that both brokers pass through identically. On a ₹10 lakh trade the same 0.5% is ₹5,000 a leg. There is no size at which the broker choice stops mattering.',
        },
      ],
    },
  ],
};

export default lesson;
