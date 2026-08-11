import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — short delivery and the auction
 *
 * The settlement lesson mentioned this in one paragraph. Here it is in full,
 * because the penalty is uncapped and the way people fall into it is entirely
 * innocent: selling shares that are in the account but not yet settled.
 *
 * The mechanism worth landing: the auction price is whatever it takes to buy
 * the shares, plus a penalty, and the exchange is not shopping carefully on
 * your behalf. It has to deliver, so it pays what it must.
 */
export const lesson: Lesson = {
  id: 'in-t5-short-delivery',
  tier: 'T5',
  market: 'IN',
  title: 'Short delivery and the auction',
  summary:
    'Sell shares you cannot deliver and the exchange buys them for you, at a price it does not negotiate, and sends you the bill.',
  plainSummary:
    'If you sell shares and cannot hand them over, somebody else buys them for you and you pay. This shows how that happens by accident.',
  objectives: [
    'Say what short delivery is and the ordinary way people cause it',
    'Explain why the auction price is usually much worse than the market',
    'Compute the cost of failing to deliver on a given sale',
    'Decide how to avoid it entirely',
  ],
  prerequisites: ['in-t0-settlement'],
  estimatedMinutes: 13,
  introduces: ['t-plus-one', 'delivery', 'depository', 'short-selling', 'liquidity'],
  skills: ['edge-cases', 'settlement'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You buy 100 shares on Monday and sell them on Monday afternoon as a delivery trade. What is the risk?',
      options: [
        'None — you bought them first',
        'You cannot deliver on Tuesday, because your own purchase settles on Tuesday too',
        'You pay double charges',
      ],
      correct: 1,
      reveal:
        'You may not be able to deliver. Your purchase settles on Tuesday, and so does your sale — so on Tuesday morning you owe 100 shares and the 100 you bought have not arrived yet. Usually the exchange nets these and nothing happens. Occasionally it does not work out, and then you have sold something you cannot hand over. This is the ordinary, innocent way people meet short delivery: not by short selling deliberately, but by trading in and out of a delivery position inside the settlement window.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What the exchange does about it',
      md:
        'It does not leave the buyer holding nothing. On the settlement day the exchange runs an **auction**: it buys the shares from whoever will supply them, and delivers them to your buyer.\n\nThen it charges you the difference, plus a penalty.\n\nThe important part is that the exchange is not shopping around. It **has** to deliver, so it pays what it must — which means the auction price is routinely far above the market price on that day.',
    },
    {
      kind: 'widget',
      component: 'SettlementChain',
      props: {},
      takeaway:
        'Follow the shares through settlement. Short delivery is what happens when the second-last step fails and somebody still has to receive the shares.',
    },
    {
      kind: 'example',
      title: 'What one failed delivery costs',
      setup:
        'You sold 200 shares at ₹800 and could not deliver. On auction day the market price is ₹840, and the auction fills at ₹890 because it must fill at any price. Here is the bill.',
      steps: [
        {
          label: 'What you sold them for',
          detail: '200 shares at ₹800',
          compute: { fn: 'multiply', a: 800, b: 200, dp: 0 },
        },
        {
          label: 'What the auction paid',
          detail: '₹890 — well above the ₹840 market price that day',
          compute: { fn: 'multiply', a: 890, b: 200, dp: 0 },
        },
        {
          label: 'The difference charged to you',
          detail: 'You keep the ₹800 sale and pay the shortfall',
          compute: { fn: 'multiply', a: -90, b: 200, dp: 0 },
        },
        {
          label: 'If you had simply bought at market instead',
          detail: 'The cost of fixing it yourself, at ₹840',
          compute: { fn: 'multiply', a: -40, b: 200, dp: 0 },
        },
        {
          label: 'What the auction cost above that',
          detail: 'The price of not handling it yourself',
          compute: { fn: 'multiply', a: -50, b: 200, dp: 0 },
        },
      ],
      conclusion:
        'The shortfall was ₹8,000 and the auction turned it into ₹18,000, on a sale of ₹1,60,000.',
    },
    {
      kind: 'predict',
      prompt:
        'The same failure on an illiquid small company rather than a large one. Work out what changes.',
      options: [
        'Nothing — the rule is the same',
        'Much worse, because the auction must buy from a thin book',
        'Better, because small companies are cheaper',
      ],
      correct: 1,
      reveal:
        'Much worse. The auction has to acquire the shares from whoever will sell, and in a thin book that means walking a long way up. Auction prices on illiquid shares can settle well above anything trading that day, because the buyer is compelled and everybody knows it. This is the liquidity lesson arriving with a penalty attached. The shares hardest to sell normally are also the ones where failing to deliver costs the most.',
      askWhy: true,
    },
    {
      kind: 'figure',
      figure: 'SettlementTimeline',
      props: {},
      caption:
        'The window where this happens. Anything sold before the purchase settles is a promise you may not be able to keep.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'How to never meet this',
      md:
        '**Do not sell delivery shares before they have settled.** To trade in and out on the same day, use the intraday product. It is designed for exactly that and squares off automatically.\n\n**Check your holdings, not your order history.** The number that matters is what the depository says you have, not what you believe you bought.\n\n**Be careful with pledged shares.** Shares given as collateral may not be freely deliverable, and that surprises people.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You sold 300 shares at ₹500 and failed to deliver. The auction fills at ₹580. What are you charged for the shortfall, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 24000, tolerance: 200, unit: '₹' },
          explanation:
            '₹80 of difference on 300 shares is ₹24,000, on a sale of ₹1,50,000 — a 16% penalty for a settlement mistake rather than a market one. The size is not proportional to your error; it is proportional to whatever the auction had to pay, which is a number you do not control.',
        },
        {
          prompt:
            'Sort each action by whether it risks short delivery.',
          type: 'classify',
          spec: {
            categories: ['Risks it', 'Safe'],
            items: [
              { label: 'Selling delivery shares that settle tomorrow', category: 'Risks it' },
              { label: 'Selling shares currently pledged as collateral', category: 'Risks it' },
              { label: 'Selling shares held for a year', category: 'Safe' },
              { label: 'Buying and selling in the same session as intraday', category: 'Safe' },
            ],
          },
          explanation:
            'The two risky rows both involve shares you appear to have but cannot freely hand over. The intraday row is safe precisely because nothing is ever delivered — the product exists so that same-session trading does not touch the settlement system at all. Choosing the right product for the intent removes this entire category of problem.',
        },
        {
          prompt:
            'You realise on settlement morning that you cannot deliver shares you sold. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Do nothing and let the auction handle it',
              'Buy the shares in the market immediately, before the auction runs',
              'Cancel the sale',
            ],
            correct: 'Buy the shares in the market immediately, before the auction runs',
          },
          explanation:
            'Buy them yourself. The market price is almost always better than the auction price, because you can shop and the exchange cannot. Cancelling is not available — the sale already happened and somebody is owed shares. Acting early is the whole of the remedy here, and it is only possible if you noticed, which is why checking settled holdings rather than order history matters.',
        },
      ],
    },
  ],
};

export default lesson;
