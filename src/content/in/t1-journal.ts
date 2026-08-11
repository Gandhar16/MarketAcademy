import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T1 · Beginner — the journal
 *
 * The last step of the survival stage, and the one that makes every other
 * lesson usable. Without a record written BEFORE the outcome, a learner has no
 * way to tell a good decision from a lucky one — and memory will not help,
 * because memory rewrites the reasoning to match the result.
 *
 * This is also the lesson that explains the site's own design to the learner.
 * The games demand a thesis before entry and publish the reasoning afterwards
 * (/reasons); the XP gates refuse to pay for a run with no stated reason. All of
 * that is this idea, made mechanical.
 */
export const lesson: Lesson = {
  id: 'in-t1-journal',
  tier: 'T1',
  market: 'IN',
  title: 'Writing down why, before you find out',
  summary:
    'A record written before the outcome is the only way to grade a decision separately from its result. Memory will not do it, because memory edits.',
  plainSummary:
    'Write down why you are buying, before you know how it turns out. This explains why that one habit is worth more than any chart.',
  objectives: [
    'Say why a decision and its outcome have to be graded separately',
    'List what a journal entry must contain to be useful later',
    'Explain why writing it after the fact does not work',
    'Classify a finished trade by decision quality rather than by result',
  ],
  prerequisites: ['in-t1-expectancy'],
  estimatedMinutes: 13,
  introduces: ['position', 'risk-per-trade', 'stop-loss', 'expectancy', 'base-rate'],
  skills: ['journalling', 'process', 'evaluation'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'You take a trade on a hunch, with no plan and no exit, and it makes ₹8,000. How should that trade be graded?',
      options: [
        'Well — it made money',
        'Badly — the decision was poor and the result was luck',
        'It cannot be graded either way',
      ],
      correct: 1,
      reveal:
        'Badly. The result was good and the decision was not, and those are separate things that people almost never separate. This matters because you will repeat what you believe worked. A profitable hunch teaches your brain that hunches work, and it will keep teaching that until a hunch of the same size goes the other way. The only defence is a record of what you were thinking, written before you knew, so that a good outcome cannot quietly rewrite a bad decision into a good one.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Four boxes, and none of them is a chart',
      md:
        'A journal entry that is useful six months later has four things in it, all written **before** the outcome.\n\n**Why.** One sentence on what you expect and why. If you cannot write it, you do not have one.\n\n**Where it is wrong.** The level at which the reason stops being true.\n\n**Size, and the arithmetic behind it.** Not "a few shares" — the number and how you got it.\n\n**What would change your mind.** Other than the price moving.',
    },
    {
      kind: 'widget',
      component: 'PatternBaseRate',
      props: { pattern: 'bullish-engulfing', symbol: 'RELIANCE.NS' },
      takeaway:
        'This is what a record of many attempts looks like. Your journal is the same thing about your own decisions, and nobody else will build it for you.',
    },
    {
      kind: 'example',
      title: 'Two entries, six months later',
      setup:
        'You review twenty trades. Two of them made about the same money. One has a journal entry and one does not. Here is what each is worth to you now.',
      steps: [
        {
          label: 'Trade A — what you wrote at the time',
          detail: 'Level held twice, stop under the swing low, target the prior high',
          value: '2.4 : 1 planned',
        },
        {
          label: 'Trade A — what it made',
          detail: 'The plan worked. You can check whether the reasoning was sound',
          compute: { fn: 'literal', value: 7800 },
        },
        {
          label: 'Trade B — what you wrote at the time',
          detail: 'Nothing. You remember it felt right',
          value: '—',
        },
        {
          label: 'Trade B — what it made',
          detail: 'The same money, and no information at all about how',
          compute: { fn: 'literal', value: 7500 },
        },
        {
          label: 'What you can repeat',
          detail: 'One of these is a method. The other is an anecdote',
          value: 'Trade A only',
        },
      ],
      conclusion:
        'Identical results, and only one of them made you better at this. The money was never the output — the record was.',
    },
    {
      kind: 'predict',
      prompt:
        'You did not journal at the time, but you write it up carefully a week later, once you know the outcome. How useful is that entry?',
      options: [
        'Just as useful — the details are still fresh',
        'Much less useful, because the outcome has already reshaped the memory',
        'More useful, since you now know what happened',
      ],
      correct: 1,
      reveal:
        'Much less useful, and the reason is not laziness. Once you know how something turned out, your memory of what you expected shifts toward it, quietly and without any sense of having changed anything. Psychologists call it hindsight bias, and knowing about it does not switch it off. So an entry written afterwards records what you now think you thought, which is exactly the thing the journal existed to protect against. The value comes entirely from the timestamp.',
      askWhy: true,
    },
    {
      kind: 'game',
      game: 'chart-replay',
      config: {},
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Four outcomes, not two',
      md:
        'Every finished trade lands in one of four boxes, and only two of them are what people expect.\n\n**Good decision, good result.** Repeat it.\n\n**Good decision, bad result.** The cost of doing business. Change nothing.\n\n**Bad decision, bad result.** The cheapest lesson available. Learn it.\n\n**Bad decision, good result.** The dangerous one, because it rewards the wrong behaviour and feels like skill. Without a journal it is indistinguishable from the first box.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Account ₹4,00,000, risking 1%. Entry ₹500, the idea fails below ₹480. How many shares goes in the journal?',
          type: 'compute',
          spec: { metric: 'literal', value: 200, tolerance: 4, unit: 'shares' },
          explanation:
            '₹4,000 of risk divided by ₹20 a share is 200 shares. Write the arithmetic in the journal, not just the answer. If a review shows you repeatedly took more than the rule allowed, that is a finding about you. It is invisible unless the sum sits next to the trade.',
        },
        {
          prompt:
            'Sort each finished trade by whether the DECISION was sound, ignoring what it made.',
          type: 'classify',
          spec: {
            categories: ['Sound decision', 'Poor decision'],
            items: [
              { label: 'Planned, sized, stop honoured — lost ₹2,000', category: 'Sound decision' },
              { label: 'Planned, sized, exited at target — made ₹5,000', category: 'Sound decision' },
              { label: 'No plan, no stop, doubled down — made ₹9,000', category: 'Poor decision' },
              { label: 'Planned, then moved the stop twice — lost ₹11,000', category: 'Poor decision' },
            ],
          },
          explanation:
            'The third row is the one that matters. It made the most money on this page and it is the worst decision on it. A trader without a journal remembers it as a success and does it again, larger. Grading on process rather than on result is not a moral position — it is the only way to get information out of a small number of noisy outcomes.',
        },
        {
          prompt:
            'You review three months of journal entries and find your losing trades average nearly twice your planned risk. Decide what that tells you.',
          type: 'decision',
          spec: {
            options: [
              'The market has been unusually volatile',
              'You are not honouring your own stops, and the record proves it',
              'The sizing formula needs adjusting',
            ],
            correct: 'You are not honouring your own stops, and the record proves it',
          },
          explanation:
            'You are not honouring the stops. This is precisely the finding a journal exists to produce — an unpleasant pattern about yourself, supported by dates and numbers rather than by a feeling. Notice that it is invisible without the record: any single trade can be explained away, and the pattern only appears once twenty of them are written down in the same place.',
        },
      ],
    },
  ],
};

export default lesson;
