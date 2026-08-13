import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — step 2
 *
 * The previous lesson landed that a share is ownership, not a loan. This one
 * fixes the second most common beginner confusion: assuming every purchase of
 * a share sends money to the company that share belongs to. It almost never
 * does. Nearly all trading happens in the SECONDARY market — one investor
 * buying from another — and the PRIMARY market, where the company itself
 * receives the money, is a comparatively rare event that an IPO is one
 * example of.
 *
 * Deliberately out of scope here: settlement timing, order types, bid/ask,
 * demat mechanics and broker fees. Those each have their own lesson later in
 * this stage — this one lesson's whole job is tracing where the money and the
 * shares go, nothing else.
 */
export const lesson: Lesson = {
  id: 'in-t0-where-does-money-go',
  tier: 'T0',
  market: 'IN',
  title: 'Where does your money go when you buy a share?',
  summary:
    'A company receives money only when it sells shares itself — the primary market. Almost every other trade pays another investor, in the secondary market.',
  plainSummary:
    'When you buy a listed share, your money almost always goes to another investor, not the company. This shows the one time it does go to the company, and why that is different.',
  objectives: [
    'Distinguish a primary-market sale from a secondary-market trade',
    'Explain what an IPO is, and that it is one specific primary-market event',
    'Trace where the money and the shares each go, in a primary sale and in a secondary trade',
    'Say why buying a listed share on the exchange usually pays another investor, not the company',
  ],
  prerequisites: ['in-t0-what-is-a-share'],
  estimatedMinutes: 11,
  introduces: ['primary-market', 'secondary-market', 'ipo'],
  skills: ['foundations', 'market-structure'],
  blocks: [
    {
      kind: 'predict',
      prompt: 'You buy a listed Mango Motors share from an exchange for ₹100. Does Mango Motors receive your ₹100 today?',
      options: [
        'Yes, in full',
        'No — the money goes to whoever was selling that share, not to Mango Motors',
        'Yes, but only a portion, after fees',
      ],
      correct: 1,
      reveal:
        'No. Buying a listed share almost always means buying it FROM another investor, not from the company. Mango Motors is not a party to that trade at all — it already sold that share, once, to somebody, at some earlier point. Today your ₹100 goes to whoever was holding it and chose to sell. A company only receives money when it sells shares itself, which is a much rarer event with its own name: the primary market.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'MoneyFlowExplainer',
      props: {},
      takeaway:
        'Step through it once. Watch which node the money actually reaches each time — and which trade Mango Motors is not even a party to.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Two markets, one confusing habit of speech',
      md:
        'The **primary market** is a company selling NEW shares itself, directly, to raise money. The money goes straight to the company. An **IPO** — a company\'s first sale of shares to the public — is the best-known example, but a company can sell new shares again later too.\n\nThe **secondary market** is everything after that: existing shareholders trading those same shares among themselves, on an exchange. No new shares are created, and the company receives nothing. Almost every trade you will ever place is in the secondary market — "buying a share" usually means buying it from a person, not from a company.',
    },
    {
      kind: 'widget',
      component: 'MoneySecuritiesFlow',
      props: {},
      takeaway:
        'Toggle between the two scenarios. The price is identical in both — what differs is who sends the money, who receives it, and whether any new shares were created at all.',
    },
    {
      kind: 'example',
      title: 'Two ₹100 trades, two different destinations',
      setup:
        'Mango Motors is a fictional company, invented for this example. Compare two trades that both happen at ₹100 a share. A: Mango Motors sells 100 brand-new shares directly to investors. B: Maya, an existing shareholder, sells her 1 share to Arjun.',
      steps: [
        {
          label: 'Scenario A — money paid',
          detail: '100 new shares at ₹100 each',
          compute: { fn: 'multiply', a: 100, b: 100, dp: 0 },
        },
        { label: 'Scenario A — who receives it', detail: 'A primary-market sale', value: 'Mango Motors, in full' },
        { label: 'Scenario A — change in shares outstanding', detail: '100 shares that did not exist before today', value: '+100' },
        {
          label: 'Scenario B — money paid',
          detail: '1 existing share at ₹100',
          compute: { fn: 'multiply', a: 100, b: 1, dp: 0 },
        },
        { label: 'Scenario B — who receives it', detail: 'A secondary-market trade', value: 'Maya, the seller — not Mango Motors' },
        { label: 'Scenario B — change in shares outstanding', detail: 'The same 1 share simply changed hands', value: 'No change' },
      ],
      conclusion:
        'The same ₹100 price, in both cases. What differs entirely is the destination of the money and whether any new shares were created — and that difference is exactly what "primary" versus "secondary" market means.',
    },
    {
      kind: 'predict',
      prompt:
        'Mango Motors runs an IPO, selling 500 new shares directly to the public at ₹100 each. A month later, you buy one of those same shares from another investor on the exchange for ₹105. In THIS second purchase, where does your ₹105 go?',
      options: [
        'To Mango Motors, since the shares originally came from an IPO',
        'To the investor who sold you the share — Mango Motors already received its money once, at the IPO',
        'Split between Mango Motors and the seller',
      ],
      correct: 1,
      reveal:
        'To the investor who sold it to you. An IPO is a one-time event — Mango Motors received money once, when it first sold those shares. Every trade after that, no matter how many times the share changes hands, is a secondary-market trade between two investors. The share does not carry a memory of its IPO origin that reroutes money back to the company on every later sale.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'One share, five owners, one payment to Mango Motors',
      setup:
        'Follow a single Mango Motors share across its whole life. It is issued in the IPO, then trades hands four more times over the following two years, at different prices each time.',
      steps: [
        { label: 'IPO — Mango Motors issues the share', detail: 'Sold to Investor 1 at ₹100 — the only primary-market moment in this whole chain', value: 'Mango Motors receives ₹100' },
        { label: 'Trade 2 — Investor 1 sells to Investor 2', detail: 'At ₹110, six months later', value: 'Investor 1 receives ₹110' },
        { label: 'Trade 3 — Investor 2 sells to Investor 3', detail: 'At ₹95, after a weak quarter', value: 'Investor 2 receives ₹95' },
        { label: 'Trade 4 — Investor 3 sells to Investor 4', detail: 'At ₹130, a year after the IPO', value: 'Investor 3 receives ₹130' },
        { label: 'Total received by Mango Motors across all four trades', detail: 'Every trade after the IPO, added up', compute: { fn: 'literal', value: 100 } },
      ],
      conclusion:
        'Four trades, four different prices, four different sellers paid — and Mango Motors receives money exactly once, at the very first step. The other three payments are investors paying investors. This is the ordinary life of almost every share you will ever hold.',
    },
    {
      kind: 'predict',
      prompt:
        'Two years after its IPO, Mango Motors sells another 200 brand-new shares directly to investors to raise more money — this is called a Follow-on Public Offer, or FPO. Is this primary market or secondary market?',
      options: [
        'Secondary — the company already did its one primary-market event at the IPO',
        'Primary — any time the company itself issues new shares, no matter how many times',
        'Neither — an FPO is a special third category',
      ],
      correct: 1,
      reveal:
        'Primary. The IPO is not the only primary-market event a company ever has — it is just the first one. Any time Mango Motors itself issues brand-new shares directly to investors, that sale is primary market, whether it is the first time or the fifth. An FPO works exactly like the IPO scenario from this lesson\'s first example: new shares are created, and the money goes straight to the company.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A company already listed for six years sells 400 new shares directly to raise money for an expansion — an FPO. Decide who receives the money.',
          type: 'decision',
          spec: {
            options: [
              'The company, since it is issuing the shares itself',
              'Existing shareholders, since they already own the company',
              'Whoever the shares are eventually resold to on the exchange',
            ],
            correct: 'The company, since it is issuing the shares itself',
          },
          explanation:
            'The company. An FPO is a primary-market sale exactly like an IPO — the fact that the company has already been listed and traded for years does not change this. What matters for the primary/secondary distinction is whether NEW shares are being created by the company right now, not how long the company has already been public.',
        },
        {
          prompt: 'Mango Motors sells 250 new shares directly to investors at ₹200 each. How much money, in rupees, does Mango Motors receive?',
          type: 'compute',
          spec: { metric: 'literal', value: 50000, tolerance: 500 },
          explanation:
            '250 × ₹200 = ₹50,000. This is a primary-market sale — the company is issuing the shares itself, so the full amount goes to Mango Motors.',
        },
        {
          prompt: 'Sort each statement about primary and secondary markets.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'An IPO is one specific example of a primary-market sale', category: 'True' },
              { label: 'Every time a listed share changes hands, the company receives more money', category: 'Not true' },
              { label: 'In a secondary-market trade, the number of shares outstanding does not change', category: 'True' },
              { label: "Once a company's shares are listed, all further trading always funds the company", category: 'Not true' },
            ],
          },
          explanation:
            'Both "Not true" rows share the same mistake — assuming a trade funds the company just because the shares trace back to that company. Only a primary-market sale, where the company itself is issuing the shares, does that. Everything else is investors trading among themselves.',
        },
        {
          prompt:
            'Mango Motors ran its IPO two years ago. Today you buy 5 of its shares from another investor on the exchange for ₹150 each, ₹750 total. Where does your ₹750 go, and why?',
          type: 'decision',
          spec: {
            options: [
              'To Mango Motors, because the shares trace back to its IPO',
              'To the investor selling you the shares — Mango Motors already received its money once, at the IPO, and is not a party to this trade',
              'Split between Mango Motors and the seller, since both have a claim on the shares',
              'Nowhere yet — the exchange holds it until the shares settle',
            ],
            correct:
              'To the investor selling you the shares — Mango Motors already received its money once, at the IPO, and is not a party to this trade',
          },
          explanation:
            'The first option confuses a share\'s ORIGIN with today\'s transaction — an IPO happened once, years ago, and does not re-trigger on every later trade. The third invents a split with no mechanism behind it: a secondary trade has exactly one buyer and one seller, full stop. The fourth confuses this lesson\'s question — where the money eventually goes — with settlement timing, which is a separate, later lesson; the destination is still the seller, whenever the money arrives. It goes to the seller because this is squarely a secondary-market trade. Mango Motors already raised what it needed, once, at the IPO — it has not been a party to any trade since.',
        },
      ],
    },
  ],
};

export default lesson;
