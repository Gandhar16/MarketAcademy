import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge Cases — physical settlement of stock F&O (India)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A NOTE ON WHAT THIS LESSON REPLACED, because it is itself a lesson.
 *
 * This slot originally taught "the ITM expiry STT trap" — the story that letting
 * an in-the-money option expire incurs STT on the full contract value. That was
 * true until 2019-09-01, when the base was changed to intrinsic value only and
 * the trap was explicitly removed.
 *
 *   https://zerodha.com/marketintel/bulletin/230019/no-more-stt-trap-on-exercised-options-from-today
 *
 * The story is still repeated across Indian trading forums and courses years
 * later, which is exactly the "unverifiable, outdated claim" failure PLAN.md §1
 * accuses the incumbents of. We caught it here before shipping, and the lesson
 * now debunks the folklore rather than repeating it.
 *
 * What IS current and genuinely dangerous is physical settlement of single-stock
 * F&O, where a small option position converts into an obligation to fund the
 * FULL contract value.
 *
 * SOURCES — verified 2026-08-09:
 *   https://support.zerodha.com/category/trading-and-markets/trading-faqs/f-otrading/articles/policy-on-physical-settlement
 *   https://zerodha.com/varsity/chapter/quick-note-on-physical-settlement-2/
 *   https://zerodha.com/charges/  (0.25% physical delivery charge)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const lesson: Lesson = {
  id: 'in-t5-physical-settlement',
  tier: 'T5',
  market: 'IN',
  title: 'The ₹2,000 option that owes ₹7,00,000',
  summary:
    'Single-stock options are physically settled in India. Hold a cheap in-the-money one to expiry and you owe the full contract value — not the premium you paid.',
  plainSummary:
    'Some Indian contracts do not simply pay out at the end — they hand you the actual shares, and the bill that comes with them. This shows how a small holding becomes a very large bill overnight.',
  objectives: [
    'Say which Indian derivatives are physically settled and which are cash settled',
    'Describe how margin escalates in the four days before expiry',
    'Compute the delivery obligation and charges on an ITM stock option',
    'Decide when to close a stock option position, and why the calendar matters more than the chart',
  ],
  prerequisites: ['in-t1-real-cost-of-a-trade'],
  estimatedMinutes: 17,
  introduces: ['physical-settlement', 'lot-size'],
  skills: ['options-expiry', 'physical-settlement', 'edge-cases'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You buy one lot of a RELIANCE ₹1,350 call for ₹8 — about ₹2,000 on a 250-share lot. At expiry RELIANCE closes at ₹1,400, so your option is ₹50 in the money. You do nothing. What lands in your account?',
      options: [
        '₹12,500 profit, settled in cash',
        '₹12,500 profit, minus a bit of STT',
        'An obligation to BUY 250 shares for ₹3,37,500',
        'Nothing — the option lapses',
      ],
      correct: 2,
      reveal:
        'You are now buying 250 shares of RELIANCE at ₹1,350, and you need ₹3,37,500 to do it. Single-stock options in India are PHYSICALLY SETTLED: an in-the-money call at expiry is not paid out in cash, it is exercised into actual shares. The position is genuinely worth ₹12,500 more than you paid for it. Realising that is another matter. It means funding a position 168 times the size of your premium, plus a physical delivery charge of 0.25% of the settled value, plus stamp duty and DP charges. If your account cannot fund it, your broker squares you off at whatever the market offers and charges you for the privilege. Index options — NIFTY, BANKNIFTY — are cash settled and do none of this. Stock options are a different instrument wearing the same name.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'PhysicalSettlementCalculator',
      props: { strike: 1350, spot: 1400, lotSize: 250, premium: 8 },
      takeaway:
        'Compare the premium you risked against the obligation you take on. The ratio is the whole point — and it gets worse the cheaper the option was.',
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'The STT trap you have probably read about is out of date',
      md:
        'Search this topic and you will find hundreds of posts warning that an in-the-money option expiring incurs STT on the **full contract value**. That was true, and it was brutal — and it was **fixed on 1 September 2019**. STT on exercise has been charged on **intrinsic value** ever since, at the same `0.15%` that applies to selling in the market.\n\nThe folklore outlived the rule by years. Physical settlement is the risk that actually replaced it.',
    },
    {
      kind: 'example',
      title: 'The 2,000 rupee option that owes 3,37,500',
      setup:
        'One lot of a RELIANCE 1,350 call, which is 250 shares, bought for 8 rupees. RELIANCE closes at 1,400 on expiry and you do nothing. Here is the arithmetic of what you now owe.',
      steps: [
        {
          label: 'What you risked',
          detail: '8 rupees premium times 250 shares',
          compute: { fn: 'multiply', a: 8, b: 250, dp: 0 },
        },
        {
          label: 'What the position is worth',
          detail: '50 rupees in the money times 250 shares. Genuinely a good trade',
          compute: { fn: 'multiply', a: 50, b: 250, dp: 0 },
        },
        {
          label: 'What you must now FUND',
          detail: 'You are buying 250 shares at the 1,350 strike. This is not optional',
          compute: { fn: 'multiply', a: 1350, b: 250, dp: 0 },
        },
        {
          label: 'Physical delivery charge at 0.25 percent',
          detail: 'Levied on the settled value, purely because you did not close in time',
          compute: { fn: 'percentOf', value: 337500, percent: 0.25 },
        },
        {
          label: 'Margin required on expiry day alone',
          detail: 'Half the contract value, demanded before the obligation even lands',
          compute: { fn: 'percentOf', value: 337500, percent: 50, dp: 0 },
        },
      ],
      conclusion:
        'The obligation is 168 times the premium you risked. Selling the option in the market instead realises the same 12,500 and creates none of it.',
    },
    {
      kind: 'prose',
      md:
        'The obligation does not arrive on expiry day as a surprise. It is telegraphed by **escalating margin** across the final four sessions, as the exchange progressively makes you prove you can fund what you are about to owe.\n\nThis is why a stock option position that was comfortable on Monday can generate a margin call on Wednesday without the price moving at all.',
    },
    {
      kind: 'widget',
      component: 'MarginLadder',
      props: { contractValue: 337_500 },
      takeaway:
        'The price has not moved in any of these columns. The only thing changing is the calendar.',
    },
    {
      kind: 'predict',
      prompt:
        'It is E-2 — two sessions before expiry — and you hold that ITM RELIANCE call in a ₹50,000 account. What is the correct action?',
      options: [
        'Hold. The option is profitable and profit is the point.',
        'Close it in the market now and take the profit in cash.',
        'Hold, and arrange the ₹3,37,500 before expiry day.',
      ],
      correct: 1,
      reveal:
        'Close it. The profit is identical either way, because the contract sells in the market for roughly its intrinsic value. Closing it turns the position into cash. No delivery obligation, no margin call, no 0.25% delivery charge. The third route is not wrong in principle. A trader who genuinely wants the shares may take it deliberately. It is wrong only when the funds do not exist — which is where almost every retail account stands. The general rule for single-stock options is simple and unglamorous: know your lot size times your strike, and if that number is larger than your account, be out before expiry week.',
      askWhy: false,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'One lot of 250 shares is physically settled at a strike of ₹1,350. What is the physical delivery charge at 0.25% of the settled value, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', tolerance: 20, unit: '', value: 843.75, market: 'IN', venue: 'NSE', product: 'options', price: 8, quantity: 250 },
          explanation:
            '0.25% of ₹3,37,500 is ₹843.75 — on a position whose premium was ₹2,000. That single charge is 42% of everything you risked, and it is levied purely because you did not close the position in time. Netted-off positions such as spreads are charged at a lower 0.1%, but a naked long option is not netted off.',
        },
        {
          prompt:
            'Classify each instrument by how it settles at expiry. Getting this wrong is what produces the surprise.',
          type: 'classify',
          spec: {
            categories: ['Physically settled', 'Cash settled'],
            items: [
              { label: 'RELIANCE 1350 call', category: 'Physically settled' },
              { label: 'NIFTY 24000 call', category: 'Cash settled' },
              { label: 'HDFCBANK futures', category: 'Physically settled' },
              { label: 'BANKNIFTY put', category: 'Cash settled' },
            ],
          },
          explanation:
            'Single-stock futures and options are physically settled; index derivatives are cash settled. The instruments look identical on a trading screen and behave completely differently on the third Thursday of the month. If you trade only index options you will never meet this rule — which is precisely why it catches people the first time they trade a stock option.',
        },
        {
          prompt:
            'Your account holds ₹50,000 and you are long one ITM stock option with a contract value of ₹3,37,500, two days before expiry. Decide.',
          type: 'decision',
          spec: {
            options: ['Hold to expiry and take delivery', 'Close the position now', 'Hold and hope the broker squares it off'],
            correct: 'Close the position now',
          },
          explanation:
            'Close it. Taking delivery needs ₹3,37,500 you do not have. Relying on the broker to square you off is the worst of the three. It happens at a time you do not choose and a price you do not control, with a ₹50 plus GST charge attached. If it fails, the delivery proceeds anyway and your account goes into debit at 0.05% interest. Closing it yourself costs a normal exit and keeps every decision in your hands.',
        },
      ],
    },
  ],
};

export default lesson;
