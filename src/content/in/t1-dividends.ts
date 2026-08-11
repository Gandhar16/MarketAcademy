import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — dividends, splits and bonuses
 *
 * Three corporate actions, and one question that separates them: did money
 * leave the company, or did the arithmetic change?
 *
 * A dividend is real cash going out. A split and a bonus are re-labelling
 * exercises that leave your holding worth exactly what it was worth before. The
 * chart drops in all three cases, and only one of them cost you anything — which
 * is why the ex-date drop causes so much confusion and so many complaints to
 * brokers about "missing money".
 *
 * The lesson also has to defuse the dividend-chasing idea: buying just before
 * the record date does not get you free money, because the price drops by
 * roughly the dividend on the ex-date. That is arithmetic, not a coincidence.
 */
export const lesson: Lesson = {
  id: 'in-t1-dividends',
  tier: 'T1',
  market: 'IN',
  title: 'Dividends, splits and bonuses',
  summary:
    'One question separates all three: did money actually leave the company? The chart drops either way, and only one of them cost you anything.',
  plainSummary:
    'Companies sometimes pay out cash or hand out extra shares. This explains which of those puts money in your pocket and which only changes the arithmetic.',
  objectives: [
    'Say which corporate actions move real money and which only change the count',
    'Explain why a price falls on the ex-date and what that means for you',
    'Compute the value of a holding before and after a split or bonus',
    'Decide whether buying before a dividend is worth doing',
  ],
  prerequisites: ['in-t1-index-vs-stock'],
  estimatedMinutes: 13,
  introduces: ['dividend', 'corporate-action', 'share', 't-plus-one', 'gap'],
  skills: ['corporate-actions', 'long-term'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A share is ₹1,000 and pays a ₹20 dividend. On the ex-date it opens at ₹980. You held it throughout. What happened to your money?',
      options: [
        'You lost ₹20 a share',
        'Nothing — you have ₹980 of share and ₹20 of cash coming',
        'You gained ₹20 a share',
      ],
      correct: 1,
      reveal:
        'Nothing changed. The company handed out ₹20 a share in cash, so it is worth ₹20 a share less than it was — the money moved from inside the company to your bank account. You still have ₹1,000 of value, in two pieces instead of one. The drop is arithmetic, not a fall in the ordinary sense, and it is why chasing dividends by buying just before the date achieves nothing. You pay ₹1,000, receive ₹20, and hold something worth ₹980. Free money would require the seller not to notice.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'One question tells you which is which',
      md:
        'Ask: **did money actually leave the company?**\n\n**Dividend.** Yes. Cash goes from the company to shareholders. The company is genuinely worth less afterwards, by exactly that much.\n\n**Split.** No. Each share becomes several, each worth proportionally less. Nothing moved.\n\n**Bonus.** No. Extra shares are issued to existing holders. Again, nothing moved — the same pie, cut into more slices.\n\nOnly the first one puts anything in your pocket.',
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '1d', range: '2y' },
      mode: 'view',
      takeaway:
        'Look for single-day drops with no news attached. Some of them are ex-dates, where the fall is arithmetic rather than an opinion about the company.',
    },
    {
      kind: 'example',
      title: 'The same holding, three events',
      setup:
        'You hold 100 shares at ₹1,000, worth ₹1,00,000. Three different things happen in three different years. Follow the value of your holding through each.',
      steps: [
        {
          label: 'A ₹20 dividend — cash you receive',
          detail: 'Real money, leaving the company and arriving with you',
          compute: { fn: 'multiply', a: 20, b: 100, dp: 0 },
        },
        {
          label: 'And the shares afterwards',
          detail: '100 shares at ₹980. Total value unchanged at ₹1,00,000',
          compute: { fn: 'multiply', a: 980, b: 100, dp: 0 },
        },
        {
          label: 'A 1-for-1 bonus — shares afterwards',
          detail: '200 shares at ₹500 each. No money moved anywhere',
          compute: { fn: 'multiply', a: 500, b: 200, dp: 0 },
        },
        {
          label: 'A 5-for-1 split — shares afterwards',
          detail: '500 shares at ₹200 each. Again, exactly the same value',
          compute: { fn: 'multiply', a: 200, b: 500, dp: 0 },
        },
        {
          label: 'What you actually gained across all three',
          detail: 'Only the dividend was real. The other two were arithmetic',
          compute: { fn: 'multiply', a: 20, b: 100, dp: 0 },
        },
      ],
      conclusion:
        'Two of the three events moved nothing at all, and both of them made the chart look like a crash.',
    },
    {
      kind: 'predict',
      prompt:
        'You hold 300 shares at ₹600 and the company announces a 3-for-1 split. Work out both numbers before you look.',
      options: [
        '900 shares at ₹200',
        '900 shares at ₹600',
        '100 shares at ₹1,800',
      ],
      correct: 0,
      reveal:
        'Nine hundred shares at ₹200, and your ₹1,80,000 is still ₹1,80,000. Three times the shares, a third of the price. The reason companies do this is entirely psychological: a ₹200 share feels more approachable than a ₹600 one, and more people buy small numbers of it. Nothing about the business changed. If a chart appears to drop 67% overnight with no news, check for a split first. Historical prices are usually adjusted, but not always, and an unadjusted chart has fooled many people.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'CostBreakdownTable',
      props: { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: 1000, quantity: 100 },
      takeaway:
        'And buying in order to catch a dividend costs this, twice, for a payout that was already in the price you paid.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Two dates, and settlement decides which matters',
      md:
        'The **record date** is when the company reads the shareholder register. The **ex-date** is the first day the share trades without the entitlement.\n\nBecause India settles the next working day, you must buy at least one working day before the record date to be on the register. Buying on the record date itself is too late.\n\nThis is the first place settlement quietly governs a real decision, and it catches somebody every single year.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You hold 400 shares at ₹250. The company announces a 1-for-1 bonus. What is your holding worth afterwards, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 100000, tolerance: 100, unit: '₹' },
          explanation:
            'Exactly ₹1,00,000, the same as before. You now hold 800 shares at ₹125. A bonus feels like a gift and is a re-labelling — the company gave you more pieces of the thing you already owned. Anybody who tells you a bonus issue is a reason to buy has not done this multiplication.',
        },
        {
          prompt:
            'Sort each corporate action by whether real money moves.',
          type: 'classify',
          spec: {
            categories: ['Money actually moves', 'Only the arithmetic changes'],
            items: [
              { label: 'Dividend', category: 'Money actually moves' },
              { label: 'Share buyback', category: 'Money actually moves' },
              { label: 'Bonus issue', category: 'Only the arithmetic changes' },
              { label: 'Stock split', category: 'Only the arithmetic changes' },
            ],
          },
          explanation:
            'The two on the left reduce the company’s cash and are genuine transfers to shareholders. The two on the right change how many slices exist and nothing else. Every one of the four makes the share price drop, which is exactly why the question "did money leave the company" is more useful than looking at the chart.',
        },
        {
          prompt:
            'Someone plans to buy a share the day before the ex-date purely to collect a 3% dividend, then sell. Decide.',
          type: 'decision',
          spec: {
            options: [
              'A clever way to earn 3%',
              'The price drops by roughly the dividend, so they gain nothing and pay costs twice',
              'Worth it if the share recovers quickly',
            ],
            correct: 'The price drops by roughly the dividend, so they gain nothing and pay costs twice',
          },
          explanation:
            'They gain nothing and pay charges on both legs. In India the dividend is also taxable in the receiver’s hands, so the strategy can be reliably worse than doing nothing. The third answer is the seductive one. It is a bet that the share will rise, dressed up as a dividend strategy — and if that is the bet, the dividend is irrelevant to it.',
        },
      ],
    },
  ],
};

export default lesson;
