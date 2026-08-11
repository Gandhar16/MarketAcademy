import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Intermediate — the three statements
 *
 * Accounting taught as three questions rather than three documents. A beginner
 * confronted with a balance sheet learns line items and retains nothing; a
 * beginner told "each statement answers one question, and here is the question"
 * can then read any of them.
 *
 *   Profit and loss — did it make money this year?
 *   Balance sheet   — what does it own and owe right now?
 *   Cash flow       — did any actual money move?
 *
 * The third is the one nobody reads and the one that catches problems first,
 * which is why the next lesson is about it exclusively.
 */
export const lesson: Lesson = {
  id: 'in-t2-financials',
  tier: 'T2',
  market: 'IN',
  title: 'The three statements, in plain words',
  summary:
    'Three documents, three questions. Did it make money, what does it own and owe, and did any actual cash move — in that order, because they answer different things.',
  plainSummary:
    'Companies publish three reports about themselves. This explains what question each one answers, without any accounting words.',
  objectives: [
    'State the one question each statement answers',
    'Say why profit and cash are different numbers',
    'Read a simple set of figures and say whether the business is growing',
    'Decide which statement to look at for a given question',
  ],
  prerequisites: ['in-t0-what-is-a-share'],
  estimatedMinutes: 13,
  introduces: ['share', 'dividend', 'index'],
  skills: ['fundamentals', 'accounting-basics'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'A company reports a profit of ₹100 crore for the year. How much cash did it collect that year?',
      options: [
        '₹100 crore',
        'Impossible to say from that number alone',
        'More than ₹100 crore',
      ],
      correct: 1,
      reveal:
        'Impossible to say, and that surprises almost everybody. Profit counts a sale when the sale is made, not when the customer pays. A company can book ₹100 crore of profit while every customer still owes it money, and have nothing in the bank. It can also collect a great deal of cash in a year it reports a loss. Profit and cash are two different questions with two different answers, and each has its own statement. Confusing them is the single most common error in reading company accounts.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Three questions, one each',
      md:
        '**Profit and loss.** *Did it make money over the year?* Revenue at the top, costs below it, profit at the bottom. It covers a period.\n\n**Balance sheet.** *What does it own and owe, right now?* A photograph on one date. What it owns minus what it owes is what belongs to shareholders.\n\n**Cash flow.** *Did actual money move?* The one that is hardest to dress up, and the one almost nobody reads.',
    },
    {
      kind: 'predict',
      prompt:
        'A company owns ₹500 crore of things and owes ₹350 crore. What belongs to the shareholders?',
      options: ['₹500 crore', '₹350 crore', '₹150 crore'],
      correct: 2,
      reveal:
        'A hundred and fifty crore — what it owns minus what it owes. This is the whole balance sheet in one subtraction, and everything else on it is detail about the two sides. It is also why shareholders are last in line: lenders are owed the ₹350 crore first, and shareholders get whatever survives. A company whose debts grow faster than its assets is shrinking the shareholders’ share even while the business appears to be getting bigger.',
      askWhy: true,
    },
    {
      kind: 'example',
      title: 'One year, read three ways',
      setup:
        'A company sells ₹800 crore of goods, at a cost of ₹560 crore, with ₹140 crore of other expenses. It owns ₹900 crore and owes ₹600 crore. Customers still owe it ₹120 crore of that year’s sales.',
      steps: [
        {
          label: 'Profit and loss — gross profit',
          detail: 'Sales of ₹800 crore less the ₹560 crore they cost to make',
          compute: { fn: 'literal', value: 240 },
        },
        {
          label: 'Profit and loss — what is left at the bottom',
          detail: 'Less the ₹140 crore of other expenses',
          compute: { fn: 'literal', value: 100 },
        },
        {
          label: 'Balance sheet — what belongs to shareholders',
          detail: 'Owns ₹900 crore, owes ₹600 crore',
          compute: { fn: 'literal', value: 300 },
        },
        {
          label: 'Cash flow — what has not arrived',
          detail: 'Counted as profit, still sitting with customers',
          compute: { fn: 'literal', value: 120 },
        },
        {
          label: 'Profit that arrived as actual money',
          detail: '₹100 crore of profit, ₹120 crore still owed to them',
          compute: { fn: 'literal', value: -20 },
        },
      ],
      conclusion:
        'A profitable year with negative cash. Both statements are correct and they are describing different things.',
    },
    {
      kind: 'predict',
      prompt:
        'You want to know whether a company can survive the next six months. Which statement do you read first?',
      options: ['Profit and loss', 'Balance sheet', 'Cash flow'],
      correct: 2,
      reveal:
        'Cash flow, and it is not close. Companies do not fail because they are unprofitable — plenty of unprofitable companies survive for years. They fail because on a particular Tuesday they cannot pay somebody. That is a cash question, and only one of the three statements answers it. The profit line tells you whether the business model works over time; the cash statement tells you whether it lives long enough to find out. When those two disagree, the cash one is the more urgent.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: 'TCS.NS', interval: '1mo', range: '5y' },
      mode: 'view',
      takeaway:
        'Five years of a real company. The accounts explain what the business did; this line is what people were willing to pay for it. They are not the same story.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'Which numbers are opinions',
      md:
        'Some figures in a set of accounts are facts and some are judgements, and they sit in the same table looking identical.\n\n**Fact.** Cash in the bank. Countable, verifiable.\n\n**Judgement.** How long a machine will last, what unsold stock is worth, whether a customer will pay.\n\nThose judgements are legal, normal and made by the company itself. So a change in profit can come from the business, or from somebody revising an estimate, and the accounts alone will not always tell you which.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'A company owns ₹1,200 crore and owes ₹850 crore. What belongs to shareholders, in crore rupees?',
          type: 'compute',
          spec: { metric: 'literal', value: 350, tolerance: 5, unit: 'crore' },
          explanation:
            '₹1,200 − ₹850 = ₹350 crore. This one subtraction is the balance sheet, and tracking it across several years tells you more than any single year does. A number that grows steadily is a business retaining value for its owners; one that shrinks while sales rise is usually a business borrowing to grow.',
        },
        {
          prompt:
            'Sort each question by which statement answers it.',
          type: 'classify',
          spec: {
            categories: ['Profit and loss', 'Balance sheet', 'Cash flow'],
            items: [
              { label: 'Did it make money this year?', category: 'Profit and loss' },
              { label: 'How much does it owe right now?', category: 'Balance sheet' },
              { label: 'Can it pay its bills next month?', category: 'Cash flow' },
              { label: 'Are its costs rising faster than its sales?', category: 'Profit and loss' },
            ],
          },
          explanation:
            'Each statement answers one kind of question and is silent on the others. Most confusion about company accounts comes from asking a balance-sheet question of a profit statement and getting an answer that seems wrong. Knowing which document to open is most of the skill.',
        },
        {
          prompt:
            'A company reports record profits while its cash keeps falling. Decide what to do next.',
          type: 'decision',
          spec: {
            options: [
              'Nothing — record profits are good news',
              'Find out why: profit without cash usually means customers are not paying',
              'Sell immediately',
            ],
            correct: 'Find out why: profit without cash usually means customers are not paying',
          },
          explanation:
            'Investigate. The gap between profit and cash is where almost every accounting problem shows up first. It usually has an ordinary explanation: fast growth genuinely consumes cash. But the gap is a question, and a company that reports record profits for three years while cash falls every year has told you something the headline number did not.',
        },
      ],
    },
  ],
};

export default lesson;
