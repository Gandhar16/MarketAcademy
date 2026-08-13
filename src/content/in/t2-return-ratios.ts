import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Reading a business like an analyst — return ratios
 *
 * Stage 4 showed a compounding curve driven by a single number: the rate of
 * return reinvested year after year. This lesson is about where that rate
 * actually comes from inside a real business, and the single most common way
 * it gets inflated — debt, dressed up as efficiency.
 */
export const lesson: Lesson = {
  id: 'in-t2-return-ratios',
  tier: 'T2',
  market: 'IN',
  title: 'Return on equity, capital and assets',
  summary:
    'ROE looks like the headline number. It can be inflated by debt alone, with nothing about the underlying business improving. ROCE is the check that catches it.',
  plainSummary:
    'These are the ratios that measure how well a company turns money into profit. This shows what each one actually measures, and how the most-quoted one can be misleading.',
  objectives: [
    'Compute return on equity, return on capital employed and return on assets',
    'Explain how debt can inflate return on equity without improving the business',
    'Use the gap between return on equity and return on capital employed as a check',
    'Decide which of two companies is more genuinely efficient from their ratios',
  ],
  prerequisites: ['in-t2-sectors'],
  estimatedMinutes: 15,
  introduces: ['roe', 'roce', 'roa'],
  skills: ['fundamentals', 'ratios'],
  blocks: [
    {
      kind: 'predict',
      prompt: 'Company A has a return on equity of 30%. Company B has 15%. Is Company A necessarily the better business?',
      options: [
        'Yes — 30% beats 15%',
        'Not necessarily — return on equity can be inflated by debt rather than by genuine efficiency',
        'No — lower numbers are always safer and better',
      ],
      correct: 1,
      reveal:
        'Not necessarily. Return on equity divides profit by the SHAREHOLDERS’ slice of the company. Borrow heavily and that slice shrinks relative to the whole business, which mechanically pushes the ratio up even if the underlying operations have not improved at all. A 30% figure sitting on a mountain of debt is a different fact than a 30% figure sitting on almost none.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'RoeRoceGapExplainer',
      props: {},
      takeaway:
        'Step through it once. The gap that opens up between the two bars is exactly what the borrowed money contributed — nothing else changed.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Three ratios, three different capital bases',
      md:
        '**Return on equity** = net profit ÷ shareholder equity. What shareholders earned on their own money.\n\n**Return on capital employed** = operating profit ÷ (equity + debt). What the WHOLE capital base earned, debt included.\n\n**Return on assets** = net profit ÷ total assets. What everything the company owns earned, however it was funded.\n\nThe rate this whole family of ratios describes is the same rate that drives the compounding curve from earlier in this course, reinvested year after year.',
    },
    {
      kind: 'example',
      title: 'When leverage does the work',
      setup:
        'A company reports ₹40 crore net profit. Shareholder equity is ₹200 crore. Total debt is ₹300 crore. Operating profit is ₹70 crore.',
      steps: [
        { label: 'Return on equity', detail: 'Net profit ÷ shareholder equity', compute: { fn: 'literal', value: 20 } },
        { label: 'Capital employed', detail: 'Equity plus debt', compute: { fn: 'literal', value: 500 } },
        { label: 'Return on capital employed', detail: 'Operating profit ÷ capital employed', compute: { fn: 'literal', value: 14 } },
        { label: 'The gap between the two', detail: 'What the debt alone added to the headline number', compute: { fn: 'literal', value: 6 } },
      ],
      conclusion: 'A 20% return on equity looks better than a 14% return on capital employed tells the truth. The gap is exactly what the debt contributed.',
    },
    {
      kind: 'predict',
      prompt:
        'The same company pays off all its debt over several years. Equity stays ₹200 crore, operating profit stays ₹70 crore, but capital employed is now just ₹200 crore. What happens to return on capital employed?',
      options: [
        'Falls further',
        'Rises to about 35%, converging toward the equity return now that leverage is gone',
        'Stays exactly the same',
      ],
      correct: 1,
      reveal:
        '₹70 crore ÷ ₹200 crore = 35%. Without debt in the capital base, the ratio rises toward the territory return on equity was already claiming. This is the actual test for whether a high headline number was ever genuine: watch what happens to it as leverage changes, not just what it reads on one balance sheet.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A company has ₹500 crore net profit, ₹2,000 crore shareholder equity, and ₹5,000 crore of total assets, much of it idle cash. Which ratio best reflects how efficiently ALL its assets are being used?',
      options: [
        'Return on equity, since shareholders are what matters most',
        'Return on assets, since it divides profit by everything the company owns, cash included',
        'Return on capital employed, since it excludes cash entirely',
      ],
      correct: 1,
      reveal:
        'Return on assets. It divides profit by everything the company owns, so a large pile of idle cash drags the ratio down, reflecting that those assets are not being put to work. ROE and ROCE can both look fine while a company sits on cash doing nothing.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'the-long-game',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'myth',
      title: 'High return on equity is not proof of quality',
      md:
        'Banks run on leverage by the nature of the business, so their return on equity sits structurally higher than a software company’s for reasons that have nothing to do with skill.\n\nThat is the same warning the sectors lesson gave about comparing ratios across industries. Return on capital employed is the sturdier comparison specifically because it puts debt back into the denominator instead of hiding it.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Net profit is ₹300 crore and total assets are ₹6,000 crore, much of it idle cash. What is return on assets, in percent?',
          type: 'compute',
          spec: { metric: 'literal', value: 5, tolerance: 0.3, unit: '%' },
          explanation:
            '₹300 ÷ ₹6,000 × 100 = 5%. A low ROA next to a healthy ROE is often exactly this pattern — assets, including cash, that are not being deployed productively.',
        },
        {
          prompt: 'Net profit is ₹25 crore. Shareholder equity is ₹125 crore. What is return on equity?',
          type: 'compute',
          spec: { metric: 'literal', value: 20, tolerance: 0.5, unit: '%' },
          explanation: '₹25 crore ÷ ₹125 crore = 20%. The same division every time: profit over the shareholders’ own stake.',
        },
        {
          prompt: 'Classify each statement about return ratios.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'Return on equity is net profit divided by shareholder equity', category: 'Supported by the mechanism' },
              { label: 'A high return on equity always means efficient management', category: 'Folklore' },
              { label: 'Return on capital employed strips out the effect of leverage that return on equity does not', category: 'Supported by the mechanism' },
              { label: 'Return on equity and return on capital employed always move together', category: 'Folklore' },
            ],
          },
          explanation:
            'The two ratios agreeing closely is itself informative — it means debt is not doing the heavy lifting. Watching for that gap, not just the headline number, is the actual skill this lesson teaches.',
        },
        {
          prompt: 'One company has return on equity 28% and return on capital employed 12%. Another has 18% and 17%. Which looks more genuinely efficient?',
          type: 'decision',
          spec: {
            options: [
              'The first, because 28% is the larger number',
              'The second, because its two ratios sit close together, meaning debt is not doing the work',
              'Impossible to tell without more information',
            ],
            correct: 'The second, because its two ratios sit close together, meaning debt is not doing the work',
          },
          explanation:
            'The second company. A 16-point gap in the first company is a large amount of leverage doing the work a 28% headline number implied belonged to the business itself.',
        },
      ],
    },
  ],
};

export default lesson;
