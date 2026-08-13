import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — the circuit you cannot sell into
 *
 * The first edge case, and the one that breaks the mental model most
 * completely: every lesson so far has assumed you can get out. This is the one
 * where you cannot.
 *
 * Beginners meet upper circuits first and love them, because a locked upper
 * circuit means the thing they own went up and nobody can sell. Then they own
 * it on the way down. A lower circuit with no buyers is a position you legally
 * hold and practically cannot leave, for days.
 */
export const lesson: Lesson = {
  id: 'in-t5-circuit-lock',
  tier: 'T5',
  market: 'IN',
  title: 'The upper circuit you cannot sell into',
  summary:
    'Every lesson so far assumed you can get out. This is the one where the exchange has stopped the price and there is nobody on the other side.',
  plainSummary:
    'Sometimes a price is not allowed to move any further that day. This shows what happens to you when that occurs.',
  objectives: [
    'Say what a price band is and why exchanges impose one',
    'Explain why a locked circuit means no exit rather than a bad price',
    'Compute what several locked days do to a position',
    'Decide what to do when holding something that is circuit-locked',
  ],
  prerequisites: ['in-t1-stops'],
  estimatedMinutes: 13,
  introduces: ['circuit-limit', 'liquidity', 'gap', 'stop-loss', 'order-book', 'market-order'],
  skills: ['edge-cases', 'liquidity', 'risk-management'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A share you hold falls to its 20% lower circuit and locks there. Your stop was at 8% down. What price did you get?',
      options: ['8% down, as planned', '20% down', 'You did not get out at all'],
      correct: 2,
      reveal:
        'You did not get out. This is the failure mode nobody prepares for. A locked lower circuit means the price cannot legally go lower that day, and everybody who wants to sell is queued at that one price with no buyers. Your stop triggered and became a sell order that simply sits there. It is not a bad fill; it is no fill. The position is yours until somebody is willing to buy, which may be tomorrow, or several days from now, at a much lower level.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'LockedQueueExplainer',
      props: {},
      takeaway:
        'Step through it once. A planned ₹16,000 loss becomes roughly ₹98,000, and no order type ever gets a fill.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What a price band is',
      md:
        'Exchanges cap how far a price may move in one session. In India that band is commonly 5%, 10% or 20%, depending on the share.\n\nThe intention is to slow a panic and give people time to think. It genuinely does that.\n\nThe consequence is that when the band is reached, **trading does not stop — the price does**. Orders can still be placed. They just cannot be filled at any price beyond the limit.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: {},
      takeaway:
        'Imagine this book with every buy order removed and a wall of sells at one price. That is a locked circuit, and no order type escapes it.',
    },
    {
      kind: 'example',
      title: 'Three locked days in a row',
      setup:
        'You hold 500 shares bought at ₹400, worth ₹2,00,000. Bad news arrives. The share has a 20% band and locks down for three consecutive sessions before trading resumes.',
      steps: [
        {
          label: 'What you held',
          detail: '500 shares at ₹400',
          compute: { fn: 'multiply', a: 400, b: 500, dp: 0 },
        },
        {
          label: 'After day one, locked at 20% down',
          detail: 'No sell was possible at any point',
          compute: { fn: 'multiply', a: 320, b: 500, dp: 0 },
        },
        {
          label: 'After day two',
          detail: 'Still locked. Your order is still queued',
          compute: { fn: 'multiply', a: 256, b: 500, dp: 0 },
        },
        {
          label: 'After day three',
          detail: 'The first session where a sale becomes possible',
          compute: { fn: 'multiply', a: 205, b: 500, dp: 0 },
        },
        {
          label: 'What the 8% stop was supposed to cost',
          detail: 'The plan, against the outcome',
          compute: { fn: 'percentOf', value: 200000, percent: -8 },
        },
      ],
      conclusion:
        'A planned ₹16,000 loss became roughly ₹98,000, and no rule was broken and no order failed.',
    },
    {
      kind: 'predict',
      prompt:
        'Same share, locked at the UPPER circuit instead — up 20%, no sellers. You do not own it and want to buy. Work out what happens.',
      options: [
        'You buy at the upper circuit price',
        'You cannot buy at all, for the same reason',
        'You buy at yesterday’s close',
      ],
      correct: 1,
      reveal:
        'You cannot buy. The mechanism is symmetric and people only ever notice one half of it. A locked upper circuit is a queue of buyers with nobody selling, so a buy order joins the queue and waits. This matters because an upper circuit feels like a missed opportunity and is really a warning. A share that locks up has a book thin enough for that to happen, and thin books lock downward too. The lock is a property of the share, not of the direction.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A share with a 5% band locks down three days in a row. On the fourth day, the exchange applies a WIDER 10% band instead. Why would the band itself change?',
      options: [
        'It never changes — bands are permanently fixed per share',
        'Exchanges sometimes widen the band after repeated locks, to let genuine price discovery happen',
        'The exchange is punishing sellers by making the fall worse',
      ],
      correct: 1,
      reveal:
        'To let the price actually move. A share stuck at a locked band every day with a one-sided queue is not discovering a real price. It is delaying the same outcome one session at a time. Widening the band after repeated locks is a real mechanism that lets the queue actually clear.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'circuit-breaker',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Which shares do this',
      md:
        'Not the large ones. NIFTY constituents have deep books and wide bands, and they very rarely lock.\n\nIt is the small and mid-sized companies, especially those with narrow 5% bands, thin volume, or a concentrated shareholding.\n\nSo the practical rule is a sizing rule, not an escape trick. **If a share can lock, assume your stop does not work on it**, and size the position as though the loss could be several times what you planned.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A share has locked at its 5% lower circuit for three consecutive sessions with no trades clearing. Decide what is most likely to happen next.',
          type: 'decision',
          spec: {
            options: [
              'The band stays fixed at 5% forever, regardless of how many days it locks',
              'The exchange may widen the band, letting the price actually move and the queue clear',
              'Trading in the share is permanently suspended after three locks',
            ],
            correct: 'The exchange may widen the band, letting the price actually move and the queue clear',
          },
          explanation:
            'The exchange may widen it. Repeated locks with no trades clearing is exactly the situation a wider band exists to resolve.',
        },
        {
          prompt:
            'You hold ₹3,00,000 of a share with a 20% band. It locks down for two consecutive sessions. What is the holding worth?',
          type: 'compute',
          spec: { metric: 'literal', value: 192000, tolerance: 2000, unit: '₹' },
          explanation:
            '₹3,00,000 × 0.8 × 0.8 = ₹1,92,000, and at no point could you sell. Two ordinary sessions took 36% with your stop sitting unfilled in the queue. This is why the sizing rule for these shares has to assume the stop will not work, rather than assuming it will.',
        },
        {
          prompt:
            'Sort each statement about a locked circuit.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'Orders can still be placed', category: 'True' },
              { label: 'The price cannot move past the band that day', category: 'True' },
              { label: 'A market order will get you out', category: 'Not true' },
              { label: 'A stop-loss protects you', category: 'Not true' },
            ],
          },
          explanation:
            'The first two describe the mechanism and the last two are what people assume it leaves intact. No order type helps, because the problem is not the order — it is that there is nobody on the other side at any permitted price. This is the clearest case of a risk that sizing handles and cleverness does not.',
        },
        {
          prompt:
            'You hold a small company that has just locked at its lower circuit on bad news. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Cancel the order and wait for a bounce',
              'Leave the sell order queued, and accept that the size was the real mistake',
              'Buy more, since it is now much cheaper',
            ],
            correct: 'Leave the sell order queued, and accept that the size was the real mistake',
          },
          explanation:
            'Leave it queued and learn the sizing lesson. Being early in the queue matters when trading resumes. The third answer is averaging down into a position you cannot exit, which doubles an exposure whose defining feature is that you have no control over it. The decision that mattered was made before any of this, when you chose the size.',
        },
      ],
    },
  ],
};

export default lesson;
