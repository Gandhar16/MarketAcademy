import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — win rate is not the point
 *
 * The lesson that dismantles the single most common way beginners evaluate
 * themselves. "I win 7 out of 10" is a sentence that contains no information
 * about whether somebody is making money, and almost everybody believes it does.
 *
 * The mechanism is one multiplication, and once seen it cannot be unseen:
 * expectancy = (win rate x average win) − (loss rate x average loss). A 70% win
 * rate with a 1:4 reward-to-risk loses money. A 35% win rate at 3:1 makes it.
 *
 * This also sets up the XP gates on the games — the site refuses to award XP for
 * a run whose planned reward-to-risk is under 1.5:1, and this is the lesson that
 * explains why that number exists.
 */
export const lesson: Lesson = {
  id: 'in-t1-expectancy',
  tier: 'T1',
  market: 'IN',
  title: 'Win rate is not the point',
  summary:
    'Winning seven times out of ten tells you nothing about whether you made money. One multiplication settles it, and it changes what you should be measuring.',
  plainSummary:
    'Being right more often than wrong does not mean you are making money. This shows the sum that actually decides it.',
  objectives: [
    'Compute the average result per trade from a win rate and the two sizes',
    'Explain why a high win rate can still lose money',
    'Work out the win rate a given reward-to-risk needs to break even',
    'Decide whether a described strategy is worth taking',
  ],
  prerequisites: ['in-t1-stops'],
  estimatedMinutes: 14,
  introduces: ['risk-per-trade', 'breakeven', 'round-trip', 'position', 'expectancy'],
  skills: ['expectancy', 'risk-management', 'evaluation'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Two traders. Asha wins 7 trades in 10, making ₹1,000 each and losing ₹4,000 each. Bharat wins 3 in 10, making ₹5,000 each and losing ₹1,000 each. Who is ahead after 10 trades?',
      options: ['Asha, obviously', 'Bharat', 'About level'],
      correct: 1,
      reveal:
        'Bharat, and it is not close. Asha makes 7 times ₹1,000 and loses 3 times ₹4,000, which is ₹7,000 against ₹12,000 — she is down ₹5,000. Bharat makes 3 times ₹5,000 and loses 7 times ₹1,000, which is ₹15,000 against ₹7,000 — he is up ₹8,000. Asha is right more than twice as often as Bharat and she is losing money. This is why "how often are you right" is a question that cannot be answered usefully, and why nobody who does this seriously asks it.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The only sum that matters',
      md:
        'What you make per trade on average is:\n\n`(how often you win × the average win) − (how often you lose × the average loss)`\n\nTwo numbers on each side. A win rate on its own is one of four, which is why it settles nothing.\n\nThis average has a name — **expectancy** — and it is the number to judge a method by. Positive and small still compounds. Negative and exciting does not.',
    },
    {
      kind: 'figure',
      figure: 'RiskRewardDiagram',
      props: { entry: 1400 },
      caption:
        'Drag the two distances. The win rate you need just to break even moves with them, and it is the honest test of whether a setup is worth taking at all.',
    },
    {
      kind: 'example',
      title: 'The same trader, two exit rules',
      setup:
        'You risk ₹2,000 a trade and take 20 trades. Under rule A you take profits at ₹1,000 and win 65% of the time. Under rule B you hold for ₹6,000 and win only 30%. Same entries, same risk — only where you got out differs.',
      steps: [
        {
          label: 'Rule A — what the wins bring in',
          detail: '13 wins at ₹1,000',
          compute: { fn: 'multiply', a: 1000, b: 13, dp: 0 },
        },
        {
          label: 'Rule A — what the losses take out',
          detail: '7 losses at ₹2,000',
          compute: { fn: 'multiply', a: -2000, b: 7, dp: 0 },
        },
        {
          label: 'Rule B — what the wins bring in',
          detail: 'Only 6 wins, but at ₹6,000 each',
          compute: { fn: 'multiply', a: 6000, b: 6, dp: 0 },
        },
        {
          label: 'Rule B — what the losses take out',
          detail: '14 losses at ₹2,000. More than twice as many',
          compute: { fn: 'multiply', a: -2000, b: 14, dp: 0 },
        },
        {
          label: 'The difference between the two rules',
          detail: 'Rule A ends at minus ₹1,000; rule B ends at plus ₹8,000',
          compute: { fn: 'literal', value: 9000 },
        },
      ],
      conclusion:
        'The pleasant rule lost money and the uncomfortable one made it. Being right felt better and paid worse.',
    },
    {
      kind: 'predict',
      prompt:
        'You risk ₹1 to make ₹3 on every trade. Work it out before you look — what win rate do you need just to break even?',
      options: ['50%', '33%', '25%', '75%'],
      correct: 2,
      reveal:
        'Twenty-five percent. The formula is one divided by one plus the ratio: 1 ÷ (1 + 3) = 25%. So at 3:1 you can be wrong three times out of four and still be level, before costs. Run the same sum at 1:1 and you need 50%; at 1:3 you need 75%, which almost nobody sustains. Compute this before taking any setup. It converts "I think this will work" into a testable claim: do I really expect to be right more often than that?',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'risk-roulette',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'cost',
      title: 'And costs sit under all of it',
      md:
        'Every one of those trades pays charges twice, whether it won or lost.\n\nSo the break-even win rate is always slightly worse than the arithmetic above suggests, and the smaller your average trade, the worse it gets. A strategy with a genuine 2% edge and a 1% round-trip cost has half the edge you thought.\n\nThis is why frequency is not free. Doubling the number of trades doubles the cost drag while leaving the edge per trade exactly where it was.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'You win 40% of trades, averaging ₹3,000 on a win and ₹1,500 on a loss. What is your average result per trade, in rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 300, tolerance: 10, unit: '₹' },
          explanation:
            '(0.40 × ₹3,000) − (0.60 × ₹1,500) = ₹1,200 − ₹900 = ₹300 per trade. Positive, and modest, and that is exactly what a real edge looks like. Anybody promising a strategy where this number is large is describing something that does not survive contact with other people who can also do multiplication.',
        },
        {
          prompt:
            'Sort each statement by whether it tells you anything about whether a method makes money.',
          type: 'classify',
          spec: {
            categories: ['Tells you something', 'Tells you nothing on its own'],
            items: [
              { label: 'Average result per trade over 200 trades', category: 'Tells you something' },
              { label: 'Win rate together with the two average sizes', category: 'Tells you something' },
              { label: 'Win rate on its own', category: 'Tells you nothing on its own' },
              { label: 'The last five trades were all winners', category: 'Tells you nothing on its own' },
            ],
          },
          explanation:
            'You need both halves — how often, and how much — or you have half a sentence. The last row is worth naming separately. Five in a row is what a coin does regularly, and a run of wins is the commonest reason people increase size just before they should not.',
        },
        {
          prompt:
            'Somebody offers you a strategy that wins 85% of the time. Decide what to ask first.',
          type: 'decision',
          spec: {
            options: [
              'Nothing — 85% is excellent',
              'What is the average loss compared with the average win',
              'How many trades a day does it take',
            ],
            correct: 'What is the average loss compared with the average win',
          },
          explanation:
            'Ask for the other half. Very high win rates are usually produced by taking small profits and holding losses, which is exactly the shape that loses money slowly and then quickly. It is also the easiest number to advertise, because it sounds like skill and requires no context. A person who leads with a win rate and cannot immediately give you the average win and loss has told you something, and it is not about the strategy.',
        },
      ],
    },
  ],
};

export default lesson;
