import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Reading a business like an analyst — debt and solvency
 *
 * The return-ratios lesson showed debt inflating return on equity. This one
 * asks the other side of the same question: when does debt stop being a tool
 * and start being a real risk? `t2-sectors` already flagged that a single
 * debt-to-equity screen treats every bank in the country as dangerous — this
 * lesson is where that warning gets its full explanation.
 */
export const lesson: Lesson = {
  id: 'in-t2-debt-and-solvency',
  tier: 'T2',
  market: 'IN',
  title: 'Debt, and when it actually becomes dangerous',
  summary:
    'Debt is not automatically bad — most real businesses carry some. What matters is whether operating profit comfortably covers the interest, and whether near-term bills can be paid without selling anything.',
  plainSummary:
    'Companies borrow money, and that is not automatically a problem. This shows the numbers that tell you when borrowing has become a real risk instead of a normal part of running a business.',
  objectives: [
    'Compute debt-to-equity, interest coverage and the current ratio',
    'Explain why the same debt-to-equity number means different things in different industries',
    'Use interest coverage to judge whether debt is a real risk',
    'Decide whether a company’s debt load is a warning sign from its ratios',
  ],
  prerequisites: ['in-t2-return-ratios'],
  estimatedMinutes: 15,
  introduces: ['debt-to-equity', 'interest-coverage-ratio', 'current-ratio'],
  skills: ['fundamentals', 'ratios'],
  blocks: [
    {
      kind: 'predict',
      prompt: 'A company has a debt-to-equity ratio of 2.0 — it has borrowed twice what shareholders put in. Is that automatically a red flag?',
      options: [
        'Yes — any ratio above 1 means the company is over-leveraged',
        'Not necessarily — some industries run on borrowed money as a normal part of the business',
        'No — debt-to-equity never matters if the company is profitable',
      ],
      correct: 1,
      reveal:
        'Not necessarily. A bank’s entire business model is borrowing cheaply and lending at a margin — a debt-to-equity ratio that would alarm anyone looking at a software company is simply how banking works. This is the sectors lesson’s warning arriving in a specific number: the same ratio, applied blindly across every industry, calls half the banking sector "dangerous" and misses the actual risk elsewhere.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'InterestCoverageExplainer',
      props: {},
      takeaway:
        'Step through it once. The left gauge never moves — the warning shows up entirely on the right.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Three ratios, three different questions',
      md:
        '**Debt-to-equity** = total debt ÷ shareholder equity. How much has been borrowed relative to what shareholders put in.\n\n**Interest coverage ratio** = operating profit ÷ annual interest expense. Whether that debt can actually be serviced.\n\n**Current ratio** = current assets ÷ current liabilities. Whether near-term bills can be paid without selling anything.\n\nOf the three, interest coverage most directly answers "is this debt dangerous right now". A company can carry a large debt-to-equity ratio and still be safe if profit comfortably covers the interest.',
    },
    {
      kind: 'example',
      title: 'Reading the three ratios together',
      setup:
        'A company has total debt of ₹600 crore and shareholder equity of ₹300 crore. Operating profit is ₹90 crore and annual interest expense is ₹45 crore. Current assets are ₹180 crore against current liabilities of ₹120 crore.',
      steps: [
        { label: 'Debt-to-equity', detail: 'Total debt ÷ shareholder equity', compute: { fn: 'literal', value: 2 } },
        { label: 'Interest coverage ratio', detail: 'Operating profit ÷ interest expense', compute: { fn: 'literal', value: 2 } },
        { label: 'Current ratio', detail: 'Current assets ÷ current liabilities', compute: { fn: 'literal', value: 1.5 } },
      ],
      conclusion:
        'The debt-to-equity number alone looked worrying. The interest coverage of 2 is the one worth real concern — operating profit covers the interest bill only twice over, a thin margin if profit falls even modestly.',
    },
    {
      kind: 'predict',
      prompt: 'The same company’s operating profit falls by a third, from ₹90 crore to ₹60 crore, with interest expense unchanged at ₹45 crore. What is the new interest coverage ratio?',
      options: ['1.33 — still covering the interest, but with far less room', '2.0 — unchanged', '0.5 — the company can no longer pay its interest'],
      correct: 0,
      reveal:
        '₹60 crore ÷ ₹45 crore = 1.33. Interest is still covered, but only just. A further dip in profit, or a rise in interest rates, could tip the company into missing a payment. That is worth checking well before a debt-to-equity ratio alone, which would not have moved at all.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        'A company raises fresh money by issuing new shares and uses all of it to pay off debt. Debt-to-equity improves sharply. Is this an unambiguous improvement for existing shareholders?',
      options: [
        'Yes — lower debt is always better for shareholders',
        'Not unambiguous — existing shareholders now own a smaller slice of the company, a cost debt-to-equity alone does not show',
        'No — issuing new shares always destroys value',
      ],
      correct: 1,
      reveal:
        'Not unambiguous. Debt-to-equity looks better because the equity side grew and the debt side shrank. But existing shareholders now own a smaller percentage of the same business, a real dilution cost the ratio alone does not show.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'TATAMOTORS.NS', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway: 'A capital-intensive business like this one typically carries real debt. Price alone will not tell you whether that debt is comfortable — the ratios in this lesson are what would.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Falling interest coverage is the earlier warning',
      md:
        'Debt-to-equity is a snapshot of the balance sheet. Interest coverage moves with operating profit, which means it can warn you before a debt-to-equity ratio changes at all.\n\nA business whose interest coverage is falling year after year, even while debt-to-equity looks stable, is quietly losing its ability to service what it already owes. That trend is worth more than either ratio on its own.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A company halves its debt-to-equity ratio by issuing new shares to existing debt holders. Decide whether existing shareholders are automatically better off.',
          type: 'decision',
          spec: {
            options: [
              'Yes — a lower debt-to-equity ratio is always good for shareholders',
              'Not automatically — existing shareholders now own a smaller slice of the company, a cost the ratio does not capture',
              'No — issuing shares to pay debt is never a reasonable choice',
            ],
            correct:
              'Not automatically — existing shareholders now own a smaller slice of the company, a cost the ratio does not capture',
          },
          explanation:
            'Not automatically. The balance sheet got safer and existing owners got diluted at the same time — two separate facts the debt-to-equity number alone cannot distinguish.',
        },
        {
          prompt: 'A company has operating profit of ₹80 crore and annual interest expense of ₹20 crore. What is its interest coverage ratio?',
          type: 'compute',
          spec: { metric: 'literal', value: 4, tolerance: 0.2, unit: 'x' },
          explanation: '₹80 crore ÷ ₹20 crore = 4. Operating profit covers the interest bill four times over — a comfortable cushion before a missed payment becomes a real risk.',
        },
        {
          prompt: 'Classify each statement about debt and solvency.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'A debt-to-equity ratio above 1 is automatically dangerous', category: 'Folklore' },
              { label: 'Interest coverage ratio is operating profit divided by annual interest expense', category: 'Supported by the mechanism' },
              { label: 'The same debt-to-equity number means different things in a bank versus a software company', category: 'Supported by the mechanism' },
              { label: 'A current ratio above 1 guarantees a company will never run short of cash', category: 'Folklore' },
            ],
          },
          explanation:
            'The current ratio counts what is owed within a year against what could, in principle, be turned into cash within a year — but "in principle" is doing real work there. Inventory that cannot actually be sold quickly still counts toward the ratio.',
        },
        {
          prompt: 'A company’s interest coverage ratio has fallen from 6 to 2 over three years, while debt-to-equity has stayed roughly flat. What does that trend suggest?',
          type: 'decision',
          spec: {
            options: [
              'Nothing — debt-to-equity is unchanged, so the debt load is fine',
              'A real warning: the company’s ability to service its existing debt is weakening',
              'The company should take on more debt while ratios are still acceptable',
            ],
            correct: 'A real warning: the company’s ability to service its existing debt is weakening',
          },
          explanation:
            'A falling interest coverage ratio moves before debt-to-equity does, because it tracks profit rather than the balance sheet. Watching only the balance-sheet ratio would have missed this warning entirely.',
        },
      ],
    },
  ],
};

export default lesson;
