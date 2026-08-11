import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — support and resistance as zones
 *
 * Support and resistance is the most drawn, least examined idea in technical
 * analysis. This lesson does three things almost no course does: it explains
 * the actual mechanism (resting orders, not magic), it insists on zones rather
 * than lines, and it makes the learner confront the fact that a level everyone
 * can see is a level everyone trades against.
 */
export const lesson: Lesson = {
  id: 'in-t2-support-resistance',
  tier: 'T2',
  market: 'IN',
  title: 'Levels are zones, and everyone can see them',
  summary:
    'Why price pauses at round numbers, why your line should be a band, and what happens to a level once enough people are watching it.',
  plainSummary:
    'People draw lines on charts and say prices bounce off them. This explains what is actually happening underneath, and why your line should be a band.',
  objectives: [
    'Explain the order-book mechanism behind a support level',
    'Draw a level as a zone and justify the width',
    'Say why obvious levels attract stop-hunting',
    'Size a stop relative to a level rather than to a round number',
  ],
  prerequisites: ['in-t0-order-book'],
  estimatedMinutes: 14,
  introduces: ['support', 'resistance', 'resting-order', 'atr'],
  skills: ['support-resistance', 'order-book', 'stop-placement'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A stock has bounced off ₹1,200 three times. Why does price keep stopping there?',
      options: [
        'The level has memory — it is a technical property of the chart',
        'Enough people have resting buy orders around ₹1,200',
        'Coincidence; three touches is not many',
      ],
      correct: 1,
      reveal:
        'Resting orders, and both of the other answers contain something true. There is nothing mystical about a price. A level "holds" because there is size in the book near it: buyers who liked it before, funds with an average cost there, traders whose stops sit just beneath. When that size is consumed, the level stops holding, which is why levels fail permanently rather than weakening gradually. And the third answer deserves respect: three touches genuinely is a small sample, and a level drawn on three points is a hypothesis rather than a fact. What makes support real is depth in the book, and that is a thing you can partly observe rather than a thing you have to believe.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: { preset: 'liquid', defaultQuantity: 800, allowPresetSwitch: true },
      takeaway:
        'This is what a level actually is: quantity sitting at a price. Send an order big enough to eat through it and watch the "support" disappear — because that is precisely what breaking a level means.',
    },
    {
      kind: 'example',
      title: 'Why your line should be a band',
      setup:
        'A stock has lows at 1,198, 1,203, 1,196 and 1,201 over the past two months. You want to buy "at support". Where exactly? And how wide does the zone need to be before it is describing the data rather than one point of it?',
      steps: [
        {
          label: 'The four lows',
          detail: 'They span 1,196 to 1,203 — no single price was ever the level',
          value: '1,196–1,203',
        },
        {
          label: 'The zone width',
          detail: 'Seven rupees, as a share of the price',
          compute: { fn: 'spanPercent', high: 1203, low: 1196, reference: 1200, dp: 2 },
        },
        {
          label: 'A typical daily range on this stock',
          detail: 'ATR of about 24 rupees, so the zone is well inside one day of noise',
          value: '2.00%',
        },
        {
          label: 'A stop 5 rupees below a LINE at 1,200',
          detail: 'Inside the zone. It gets hit by ordinary noise, not by being wrong',
          value: '1,195',
        },
        {
          label: 'A stop below the ZONE instead',
          detail: 'Below 1,196 with room for the noise — wrong only when the level genuinely fails',
          value: '1,188',
        },
      ],
      conclusion:
        'A line is a guess about one price. A zone describes what the data actually did. That is the difference between a stop which fails when you are wrong, and one which fails when you are right but early.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Everyone can see your line',
      md:
        'A round number on a widely watched chart is not your private observation. Thousands of people have drawn the same line, and a good number of them have put stops just beneath it.\n\nA cluster of stops in a known place is **liquidity**, and liquidity attracts participants who want to trade against it. That is what people mean by stop-hunting — not a conspiracy, just the ordinary consequence of a large, predictable pool of orders sitting somewhere obvious.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'inside-bar', symbol: 'RELIANCE.NS' },
      takeaway:
        'The same scepticism applies here as anywhere. Before trusting a level-based setup, check what the pattern behind it is actually worth on real bars.',
    },
    {
      kind: 'predict',
      prompt:
        'Price breaks below a well-watched support at ₹1,200, trades down to ₹1,188, then closes back above ₹1,205 the same day. What most likely happened?',
      options: [
        'The level failed and then recovered',
        'Stops below the level were triggered and absorbed',
        'Impossible to say from the candle',
      ],
      correct: 2,
      reveal:
        'Impossible to say — and if you chose the second answer you were reasoning well but claiming more than the data supports. Everything in the candle is consistent with the stop-run story, and it is a common story. It is equally consistent with genuine selling that met genuine buying, or with an unrelated seller finishing an order. This is the T1 candle lesson doing its work: a daily bar records four prices and discards the path, so any narrative you attach to it is a narrative. The useful discipline is to notice that a level was probed and reclaimed — that is observable — without deciding you know who did it or why.',
      askWhy: false,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You want to buy near a support zone spanning ₹1,196–₹1,203 on a stock whose ATR is ₹24. Decide where the stop goes.',
          type: 'decision',
          spec: {
            options: ['₹1,199, inside the zone', '₹1,195, just below the zone', '₹1,180, below the zone plus noise'],
            correct: '₹1,180, below the zone plus noise',
          },
          explanation:
            'Below the zone with room for a typical day of movement. A stop at ₹1,199 sits inside the zone itself and will be hit by the ordinary wobble that defines the zone. ₹1,195 is barely outside and is exactly where the crowd puts theirs, which makes it the most likely price to be probed. ₹1,180 is roughly two-thirds of an ATR below the zone: it fails when the level genuinely breaks, which is the only time you actually want to be out.',
        },
        {
          prompt:
            'Compute the zone width as a percentage of price for lows at ₹848, ₹852, ₹845 and ₹851 on a stock trading at ₹850.',
          type: 'compute',
          spec: {
            metric: 'literal',
            value: 0.82,
            tolerance: 0.05,
            unit: '%',
            market: 'IN',
            venue: 'NSE',
            product: 'delivery',
            price: 850,
            quantity: 1,
          },
          explanation:
            '(852 − 845) ÷ 850 = 0.82%. Worth computing rather than eyeballing, because it tells you whether your intended stop is inside the noise. Put a 0.5% stop on a level whose own zone is 0.82% wide and you have not built a risk control. You have committed to being stopped out by the very behaviour that defined the level.',
        },
        {
          prompt: 'Classify each statement about levels.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'Price pauses where resting orders sit', category: 'Supported by the mechanism' },
              { label: 'Broken support becomes resistance because the chart remembers', category: 'Folklore' },
              { label: 'Round numbers attract orders because people think in round numbers', category: 'Supported by the mechanism' },
              { label: 'The more times a level is tested, the stronger it gets', category: 'Folklore' },
              { label: 'Obvious levels accumulate stops nearby', category: 'Supported by the mechanism' },
            ],
          },
          explanation:
            'The mechanism is always orders: someone willing to transact at a price. Round numbers matter because humans place orders at them, which is a fact about people rather than about charts. The "stronger with each test" claim is not merely unsupported. It is backwards. Each test consumes some of the resting size, so a level tested many times has less behind it than one tested once.',
        },
      ],
    },
  ],
};

export default lesson;
