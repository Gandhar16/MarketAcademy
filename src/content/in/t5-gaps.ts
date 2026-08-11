import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T5 · Edge cases — gap risk over closed sessions
 *
 * The stops lesson introduced this. Here it is in full, because gap risk is the
 * one hazard on this site that is completely unavoidable — you cannot hedge it
 * away cheaply, you cannot stop it, and the only lever is size.
 *
 * The measurement worth having: a share trades about 6.5 hours a day and the
 * world runs for 24. So roughly three-quarters of all elapsed time is time when
 * news can arrive and you cannot act, and over a weekend it is more.
 */
export const lesson: Lesson = {
  id: 'in-t5-gaps',
  tier: 'T5',
  market: 'IN',
  title: 'The weekend that skipped your stop',
  summary:
    'Most of the world happens while the market is shut. A stop is an instruction for when it is open, and there is no version of it that protects you overnight.',
  plainSummary:
    'News arrives when the market is closed, and prices jump when it reopens. This shows why no instruction can protect you from that.',
  objectives: [
    'Compute how much elapsed time the market is closed for',
    'Explain why no order type protects against an opening jump',
    'Work out what a gap does to a position sized for a smaller loss',
    'Decide how to size when a known event falls outside trading hours',
  ],
  prerequisites: ['in-t1-stops'],
  estimatedMinutes: 13,
  introduces: ['gap', 'stop-loss', 'trigger-price', 'volatility', 'liquidity', 'circuit-limit', 'position-size'],
  skills: ['edge-cases', 'risk-management', 'stops'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'The Indian market trades about 6 hours 15 minutes a day, five days a week. What fraction of a whole week is it actually open?',
      options: ['About half', 'About a third', 'Under a fifth'],
      correct: 2,
      reveal:
        'Under a fifth — roughly 31 hours out of 168, which is about 19%. For more than four-fifths of every week, news can arrive and you cannot act on it. That is not an unusual circumstance to plan for; it is the normal state of the world. Every stop you place is an instruction that only functions during that 19%, and the price at which trading resumes is whatever the accumulated news of the other 81% produced. There is no order type that changes this.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why a gap is not a fast move',
      md:
        'A fast move goes through every price on the way. A **gap** does not — the price simply reopens somewhere else, and the levels in between never traded.\n\nSo a stop at a level inside the gap was never reached, in the sense the exchange means. There was no moment when somebody traded there.\n\nYour order becomes active at the open and fills at the opening price. Nothing failed and nothing was skipped in error. The prices you were counting on simply did not exist.',
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'RELIANCE.NS', interval: '1d', range: '2y' },
      mode: 'view',
      takeaway:
        'Look for days where the open sits well away from the previous close. Every one of those is a session where a stop in between did nothing.',
    },
    {
      kind: 'example',
      title: 'A weekend on a properly sized position',
      setup:
        'You did everything right. Account ₹5,00,000, risking 1%, entry ₹1,400, stop ₹1,352 — 104 shares. Over the weekend the company announces something bad and it opens at ₹1,180.',
      steps: [
        {
          label: 'What you planned to risk',
          detail: '1% of the account, decided in advance',
          compute: { fn: 'riskAmount', equity: 500000, riskPercent: 1 },
        },
        {
          label: 'The position',
          detail: '₹5,000 of risk over ₹48 of stop distance',
          compute: { fn: 'sizeFromStop', equity: 500000, riskPercent: 1, entry: 1400, stop: 1352 },
        },
        {
          label: 'Where it actually filled',
          detail: 'The opening price, because nothing traded in between',
          compute: { fn: 'multiply', a: -220, b: 104, dp: 0 },
        },
        {
          label: 'As a share of the account',
          detail: 'Against the 1% you planned for',
          compute: { fn: 'literal', value: -4.6 },
        },
        {
          label: 'And the charges on the exit',
          detail: 'Paid on the way out of a position you did not choose to leave',
          compute: { fn: 'legCost', product: 'delivery', side: 'sell', price: 1180, quantity: 104 },
        },
      ],
      conclusion:
        'A perfectly executed plan produced 4.6 times the intended loss, and every rule was followed.',
    },
    {
      kind: 'predict',
      prompt:
        'You know results are due after Friday’s close. Work out which of these actually reduces the gap risk.',
      options: [
        'Moving the stop closer before the weekend',
        'Reducing the position size before the weekend',
        'Switching to a stop-limit order',
      ],
      correct: 1,
      reveal:
        'Only the size. A closer stop is inside the gap and does nothing — the price jumps over it exactly as it jumped over the original. A stop-limit is worse, because it may not fill at all and leaves you holding the position as it keeps falling. Size is the single lever that works here, because the loss is the gap multiplied by the quantity, and the quantity is the only one of those two you control. This is the clearest case on the entire site where the answer is arithmetic rather than technique.',
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
      title: 'When gaps are most likely',
      md:
        '**Before a known event.** Results, a policy decision, an election count. The date is public; act on it in advance.\n\n**Over long weekends.** More closed hours, more accumulated news, larger gaps.\n\n**In smaller companies.** Thinner books reopen further from where they closed, and may then lock at a circuit so you cannot leave at all.\n\nThe response to all three is the same and it is boring: hold less through them, and assume the stop will not work.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You hold 200 shares bought at ₹900 with a stop at ₹870. It gaps open at ₹790. What is the actual loss, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 22000, tolerance: 300, unit: '₹' },
          explanation:
            '₹110 a share on 200 shares is ₹22,000, against the ₹6,000 the stop was meant to cap it at. Doing this sum with a plausible gap — before entering, not afterwards — is what turns "my stop protects me" into a sizing decision. Assume a gap of two or three times your stop distance and check that you could live with it.',
        },
        {
          prompt:
            'Sort each measure by whether it reduces the damage from an opening gap.',
          type: 'classify',
          spec: {
            categories: ['Helps', 'Does not help'],
            items: [
              { label: 'Holding a smaller position', category: 'Helps' },
              { label: 'Closing before a known event', category: 'Helps' },
              { label: 'Moving the stop closer', category: 'Does not help' },
              { label: 'Using a stop-limit instead', category: 'Does not help' },
            ],
          },
          explanation:
            'The two that help both reduce your exposure during the closed period. The two that do not are attempts to be cleverer with an instruction that is not operating while the market is shut. This is the sharpest example of a distinction worth carrying: some risks are managed by technique, and some only by size.',
        },
        {
          prompt:
            'A company you hold reports results after Friday’s close and you have a full-sized position. Decide.',
          type: 'decision',
          spec: {
            options: [
              'Hold — you have a stop in place',
              'Reduce the position before the close, because the stop will not function overnight',
              'Move the stop closer for the weekend',
            ],
            correct: 'Reduce the position before the close, because the stop will not function overnight',
          },
          explanation:
            'Reduce it. You know an event is coming, you know the market will be shut when it lands, and you know the stop cannot act during that window. All three facts are available on Friday afternoon. The third answer is the one that feels responsible and achieves nothing, because a closer stop is still inside a gap that jumps over both of them.',
        },
      ],
    },
  ],
};

export default lesson;
