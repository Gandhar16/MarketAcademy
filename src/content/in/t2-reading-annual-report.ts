import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Reading a business like an analyst — reading the actual document
 *
 * The prior lessons in this stage taught what to compute FROM an annual
 * report — ratios, receivable days, the checklist. This lesson is about the
 * document itself: a few-hundred-page filing most people never open,
 * skimming instead a broker's summary or a headline number. The specific
 * claim worth landing is which sections carry the real information and
 * which is boilerplate, because reading the whole thing cover to cover is
 * not what any working analyst actually does either.
 */
export const lesson: Lesson = {
  id: 'in-t2-reading-annual-report',
  tier: 'T2',
  market: 'IN',
  title: 'Reading an annual report, not a summary of one',
  summary:
    'Most of a few-hundred-page annual report is boilerplate. A handful of specific sections carry almost all the real information — the auditor\'s report, the related-party note, and the cash flow statement, read in that order.',
  plainSummary:
    'Annual reports run to hundreds of pages, and almost nobody reads all of them. This shows the small number of sections that actually carry new information, and the order worth reading them in.',
  objectives: [
    'Name the three sections that carry most of an annual report\'s real information',
    'Explain why an unqualified auditor opinion is a floor, not a green light',
    'Read a related-party note and decide what question it actually raises',
    'Decide what to do when the chairman\'s letter and the numbers disagree',
  ],
  prerequisites: ['in-t2-moat'],
  estimatedMinutes: 15,
  introduces: [],
  skills: ['fundamentals', 'annual-report'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A 300-page annual report contains a glossy 4-page chairman\'s letter describing an excellent year, and a 2-line auditor\'s note buried on page 210 flagging a "material uncertainty". Which one carries more real information about risk?',
      options: [
        'The chairman\'s letter — it is written by the person who actually runs the company',
        'The 2-line auditor note — a paid, independent third party has to sign their name to it',
        'Neither — both are just boilerplate every company includes',
      ],
      correct: 1,
      reveal:
        'The auditor\'s note, even at two lines. The chairman\'s letter is marketing copy written by the same people whose performance it is describing — there is no independent check on it saying anything. An auditor is a paid, licensed third party whose entire professional reputation rests on that signature. A phrase like "material uncertainty" is not filler. It is the most carefully chosen, legally reviewed language in the entire document. Length has nothing to do with how much real information a section carries.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'ReportSectionsExplainer',
      props: {},
      takeaway:
        'Step through it once. The block that shrinks in weight is four times the size of the one that grows.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Three sections, read in this order',
      md:
        '**The auditor\'s report, first.** An unqualified ("clean") opinion is a floor — the numbers were not found materially misleading. It is not praise, and says nothing about whether the business itself is good. A qualified opinion or an "emphasis of matter" paragraph is worth reading in full.\n\n**The related-party note, second.** Money moving to entities connected to promoters or directors, disclosed here even when entirely legal. Size and frequency both matter; one small, explained transaction is ordinary business.\n\n**The cash flow statement, third**, cross-checked against the profit and loss the chairman\'s letter is built around — the same profit-versus-cash gap the quality-of-earnings lesson taught, read here from the source.',
    },
    {
      kind: 'example',
      title: 'Reading a related-party note',
      setup:
        'A note discloses: the company paid ₹18 crore to a firm owned by the promoter\'s brother for "consulting services" this year, up from ₹4 crore last year. Total company revenue is ₹1,200 crore.',
      steps: [
        { label: 'Related-party payment as a share of revenue', detail: '18 ÷ 1,200', compute: { fn: 'literal', value: 1.5 } },
        { label: 'Year-on-year change in that payment', detail: '18 ÷ 4 — a multiple, not a percentage', compute: { fn: 'literal', value: 4.5 } },
        { label: 'Is this, alone, proof of wrongdoing', detail: 'No — consulting fees to a related party can be entirely legitimate', value: 'not proof' },
        { label: 'What it actually is', detail: 'A specific, checkable question: what changed, and does the disclosed reason hold up', value: 'a question worth asking' },
      ],
      conclusion:
        'A 4.5x jump in a related-party payment is small as a share of total revenue. It is still worth a specific question: what changed this year that quadrupled a fee to a director\'s relative. The note gives you the number. It does not give you the answer.',
    },
    {
      kind: 'predict',
      prompt:
        'The chairman\'s letter describes "a transformative year of growth". The cash flow statement shows operating cash flow FELL for the second year running while reported profit rose both years. What should you do with the disagreement?',
      options: [
        'Trust the chairman\'s letter — leadership has the fullest picture of the business',
        'Trust the cash flow statement — it is the harder, auditable number the letter is not required to reconcile with',
        'Average the two impressions',
      ],
      correct: 1,
      reveal:
        'The cash flow statement. A chairman\'s letter is not required to be numerically consistent with anything — it is prose, not an audited figure. Operating cash flow falling for two straight years while reported profit rises is exactly the profit-versus-cash divergence flagged elsewhere in this stage. It directly contradicts the letter\'s framing. When the narrative and the hard numbers disagree, the numbers were audited and the narrative was not.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "A company's headline revenue grew 12%. Its segment-wise note shows one division grew 40% while its largest division shrank 5%. Does the headline number alone tell the full story?",
      options: [
        'Yes — the total growth is what matters for the company as a whole',
        'No — the segment breakdown reveals growth that is concentrated and uneven, which the single headline number hides',
        'No, because segment notes are usually inaccurate',
      ],
      correct: 1,
      reveal:
        "No. The headline 12% is real, but it is an average hiding a very different story underneath — one division covering for the company's largest division actually shrinking. A segment note is worth checking whenever growth looks unusually smooth.",
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'earnings-roulette',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'A clean audit opinion is a floor, not a verdict',
      md:
        '"Unqualified opinion" means the auditor found no material misstatement — a legal and accounting bar, not a judgement about business quality. Plenty of genuinely weak or declining businesses carry a clean audit opinion every single year.\n\nTreating a clean opinion as reassurance the business itself is sound confuses two different questions: whether the numbers are honestly presented, and whether the business behind them is any good. The first is what an auditor checks. The second is the entire rest of this course.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            "A company's total revenue grew 10%, but its segment note shows this came entirely from one small division while its two largest divisions were flat or declining. Decide how to read the headline figure.",
          type: 'decision',
          spec: {
            options: [
              'As solid, broad-based growth across the company',
              'As concentrated in one segment, meaning the headline hides weakness in the core business',
              'As meaningless, since segment data cannot be trusted',
            ],
            correct: 'As concentrated in one segment, meaning the headline hides weakness in the core business',
          },
          explanation:
            'Concentrated, not broad-based. The segment note is exactly the kind of detail a single headline growth number cannot show.',
        },
        {
          prompt: 'A related-party payment of ₹9 crore against total revenue of ₹450 crore. What is it as a percentage of revenue?',
          type: 'compute',
          spec: { metric: 'literal', value: 2, tolerance: 0.2, unit: '%' },
          explanation:
            '9 ÷ 450 × 100 = 2%. The same calculation as the lesson\'s worked example — a specific number to weigh, not a verdict by itself.',
        },
        {
          prompt: 'Classify each statement about reading an annual report.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'An unqualified audit opinion means the business is a good investment', category: 'Folklore' },
              { label: 'The cash flow statement is a harder check on profit than the chairman\'s letter', category: 'Supported by the mechanism' },
              { label: 'A related-party transaction disclosed in the notes is automatically fraudulent', category: 'Folklore' },
              { label: 'Length of a section is not a measure of how much real information it carries', category: 'Supported by the mechanism' },
            ],
          },
          explanation:
            'Both folklore rows share the same error: treating a document\'s TONE — reassuring audit language, an explained related-party note — as a verdict rather than checking the actual substance underneath it.',
        },
        {
          prompt: 'You have one hour before a decision and a 300-page annual report you have not opened yet. What is the sensible use of that hour?',
          type: 'decision',
          spec: {
            options: [
              'Read the chairman\'s letter and the investor presentation summary',
              'Go directly to the auditor\'s report, the related-party note, and the cash flow statement',
              'Skip the report entirely and rely on the stock\'s recent price action',
            ],
            correct: 'Go directly to the auditor\'s report, the related-party note, and the cash flow statement',
          },
          explanation:
            'The three sections this lesson named carry almost all of the real, checkable information in a document mostly built from boilerplate and marketing prose. An hour spent there beats a much longer read of the sections written to reassure rather than inform.',
        },
      ],
    },
  ],
};

export default lesson;
