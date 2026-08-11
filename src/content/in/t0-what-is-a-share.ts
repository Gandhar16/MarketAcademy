import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — step 1 of the whole course
 *
 * This is the first thing anybody reads. It has to assume nothing at all, and
 * it has to be interesting to somebody who is not yet sure they care.
 *
 * THE FRAMING
 *
 * Not "a share is a unit of ownership" — that is a definition, and a definition
 * teaches nobody anything. Instead: a company needs money, it can borrow or it
 * can sell part of itself, and the second choice is where every share that
 * exists came from. Ownership then falls out as a consequence rather than
 * arriving as vocabulary.
 *
 * The one thing this lesson must land, because everything in stage 1 depends on
 * it: buying a share on the exchange gives the company nothing. That transaction
 * is between you and another person, and the company is not a party to it. Almost
 * every beginner believes the opposite, and it is the root of a dozen later
 * confusions about what "supporting a company" means.
 */
export const lesson: Lesson = {
  id: 'in-t0-what-is-a-share',
  tier: 'T0',
  market: 'IN',
  title: 'What a share actually is',
  summary:
    'A company needs money and can sell part of itself to get it. Everything else — prices, exchanges, dividends — follows from that one transaction.',
  plainSummary:
    'Companies sell small pieces of themselves to raise money. Buying one of those pieces makes you a part owner. This explains what that really means.',
  objectives: [
    'Explain why a company would sell part of itself rather than borrow',
    'Say what you own, and what you do not, after buying one share',
    'Work out what fraction of a company a given number of shares represents',
    'Say who receives your money when you buy on an exchange',
  ],
  prerequisites: [],
  estimatedMinutes: 11,
  introduces: ['share', 'exchange', 'dividend', 'index'],
  skills: ['foundations', 'ownership'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You buy 10 shares of Reliance on your phone for ₹14,000. Where does that ₹14,000 go?',
      options: [
        'To Reliance, to build things with',
        'To another person who was selling those shares',
        'To the exchange, which passes it on',
      ],
      correct: 1,
      reveal:
        'To another person. This is the single most common misunderstanding about the whole market, and it changes how you should think about everything else. Reliance sold its shares once, years ago, and received money then. Since that day those shares have been passed from one owner to the next, and the company is not part of any of it. Buying shares today does not fund the company any more than buying a second-hand car funds the factory. What you bought is the right to whatever those shares are worth later, from somebody who no longer wanted them.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Why the shares exist at all',
      md:
        'A company that needs money has two choices.\n\n**Borrow it.** Cheaper, and it has to be repaid whatever happens. If the business struggles, the lender still wants their money.\n\n**Sell part of itself.** No repayment, ever. In exchange the new owners keep a slice of everything the company earns from now on, permanently.\n\nEvery **share** in existence came from a company making that second choice. A share is simply the unit they cut it into.',
    },
    {
      kind: 'example',
      title: 'What one share of Reliance is, exactly',
      setup:
        'Reliance has divided itself into roughly 6.7 billion shares. You buy 10 of them at ₹1,400 each. Here is precisely what you now own, and what it cost.',
      steps: [
        {
          label: 'What you paid',
          detail: '10 shares at ₹1,400 each',
          compute: { fn: 'multiply', a: 1400, b: 10, dp: 0 },
        },
        {
          label: 'Shares the company is divided into',
          detail: 'Everybody who owns Reliance owns some of these',
          value: '6,70,00,00,000',
        },
        {
          label: 'The fraction you own',
          detail: '10 divided by 6.7 billion, as a percentage',
          value: '0.00000015%',
        },
        {
          label: 'What the whole company is therefore worth',
          detail: 'Every share at the price of the last one traded',
          compute: { fn: 'multiply', a: 1400, b: 6700000000, dp: 0 },
        },
        {
          label: 'What Reliance received from your purchase',
          detail: 'You bought from another person, not from the company',
          compute: { fn: 'literal', value: 0 },
        },
      ],
      conclusion:
        'A tiny fraction, a real one, and none of the money went to the company.',
    },
    {
      kind: 'predict',
      prompt:
        'A different company is divided into 50 crore shares and each one trades at ₹200. Work out what the whole company is worth before you look.',
      options: ['₹250 crore', '₹1,000 crore', '₹10,000 crore', '₹200 crore'],
      correct: 2,
      reveal:
        'Ten thousand crore. It is 50 crore shares times ₹200 each. This number has a name — the market value of the company — and it is the only honest way to compare two companies by price. A share costing ₹5,000 is not expensive and one costing ₹20 is not cheap; those numbers depend entirely on how many slices the company chose to cut itself into. A company can double its share count overnight and halve the price of each, and nothing whatsoever has changed about the business.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'CostBreakdownTable',
      props: { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: 1400, quantity: 10 },
      takeaway:
        'The ₹14,000 was not the whole cost. Every line here is a real statutory charge, and there is a whole lesson on them later.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'What ownership actually gets you',
      md:
        'Two real things, and one that surprises people.\n\n**A vote.** On certain company decisions, weighted by how many shares you hold. With ten shares this is theoretical; the principle is not.\n\n**A claim on payouts.** If the company decides to distribute cash to owners — a **dividend** — you get your fraction of it.\n\nAnd the surprise: you are **last in line**. If the company is wound up, lenders, suppliers and employees are all paid before shareholders see anything, and usually there is nothing left.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A company is divided into 20 crore shares, each trading at ₹350. What is the whole company worth, in crore rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 7000, tolerance: 10, unit: 'crore' },
          explanation:
            '20 crore × ₹350 = ₹7,000 crore. This is the number to compare between companies, never the share price on its own. Two companies at ₹350 a share can be worth ₹500 crore and ₹5,00,000 crore. The share price says nothing about which is which — only about how finely each one sliced itself.',
        },
        {
          prompt:
            'Sort each statement by whether it is true after you buy 10 shares on the exchange.',
          type: 'classify',
          spec: {
            categories: ['True', 'Not true'],
            items: [
              { label: 'You own a fraction of the company', category: 'True' },
              { label: 'You are entitled to your share of any dividend', category: 'True' },
              { label: 'The company received your money', category: 'Not true' },
              { label: 'You can ask the company for your money back', category: 'Not true' },
            ],
          },
          explanation:
            'The two true statements are about ownership, and they are real. The two false ones are about the company, which was not involved in your purchase at all. Nobody has to give you your money back either. The only way out is to find another buyer, which is exactly what the exchange is for.',
        },
        {
          prompt:
            'A company announces it will split each share into five, so a ₹1,000 share becomes five ₹200 shares. Decide what happened to the value of your holding.',
          type: 'decision',
          spec: {
            options: ['It fell by 80%', 'It is unchanged', 'It rose fivefold'],
            correct: 'It is unchanged',
          },
          explanation:
            'Unchanged. You now hold five times as many shares at a fifth of the price, and five times a fifth is one. Nothing about the business changed and no money moved. This catches people constantly, because a chart showing the price dropping from ₹1,000 to ₹200 looks alarming and is an accounting event. The number of slices is a decision about packaging, never about value.',
        },
      ],
    },
  ],
};

export default lesson;
