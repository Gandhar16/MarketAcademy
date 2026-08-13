import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — investing, trading and gambling-like behaviour
 *
 * Not a moral lecture, and not a claim that a disciplined process makes a
 * loss impossible. The one thing this lesson has to land is that "investing",
 * "trading" and "gambling" are not three different assets or three different
 * levels of virtue — they are distinguished by the PROCESS behind a decision,
 * and that process has to be graded independently of whether it happened to
 * win or lose this one time.
 *
 * This lesson stays at T0 depth on purpose: no stop-loss formulas, no
 * position-sizing arithmetic, no expectancy calculation. Those are real,
 * useful, and belong to Stage 3 (`in-t1-position-sizing`, `in-t1-expectancy`,
 * `in-t1-journal`) — introducing them here would be exactly the kind of
 * premature jargon this course's own rules exist to prevent. The "process
 * over outcome" idea itself is reused, plainly, from `in-t1-journal`.
 */
export const lesson: Lesson = {
  id: 'in-t0-gambling-vs-investing',
  tier: 'T0',
  market: 'IN',
  title: 'Is this investing, trading, or gambling?',
  summary:
    'Investing, trading and gambling-like behaviour are not different assets — they are different processes. This tells them apart, and shows why a disciplined decision can still lose and a reckless one can still win.',
  plainSummary:
    'Whether something counts as investing, trading, or gambling-like behaviour depends on the decision process, not on the asset or on whether it made money. This shows how to tell them apart.',
  objectives: [
    'Distinguish investing, trading and gambling-like behaviour by process, not by the asset or the eventual result',
    'Name the specific behaviours that make a decision gambling-like',
    'Explain that outcomes stay uncertain even for a disciplined investor or trader',
    'Say why a calculated risk is not the same thing as a safe one',
  ],
  prerequisites: ['in-t0-what-moves-price'],
  estimatedMinutes: 12,
  introduces: [],
  skills: ['foundations', 'decision-quality'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Two people each put money into the same company. Person A saw a tip online and felt good about it — no plan for being wrong. Person B researched the company and decided in advance how much they could afford to lose. A year later, both are up 15%. Who was gambling?',
      options: [
        'Person A — they had no process',
        'Person B — research does not remove risk either',
        'Neither — both made money, so both were fine',
      ],
      correct: 0,
      reveal:
        'Person A. The 15% gain does not change that. Whether a decision counts as gambling-like is decided by the process at the moment it was made, not by what happened afterwards. Person B had a reason and a limit; Person A had a feeling. Had the price fallen 15% instead, Person A would have had no plan for it at all — that gap was already there before either of them knew the outcome.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'ProcessOutcomeExplainer',
      props: {},
      takeaway:
        'Step through it once. The colour never changes at the last step — process is graded the moment the decision is made, not after the coin lands.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Three processes, not three assets',
      md:
        '**Investing** — ownership, or lending, with a longer time horizon and a reasoned process. The outcome still stays uncertain.\n\n**Trading, or speculation** — a shorter-horizon bet on a price move that is itself uncertain. It can be just as disciplined as investing, or just as reckless — the horizon is shorter, not the standard of care.\n\n**Gambling-like behaviour** — chasing a loss by betting bigger to "win it back". No loss limit decided in advance. Most of what you have in one idea, or a bet too big for what you can afford to lose. Treating a win as proof of skill.\n\nA **calculated risk** means the downside, the size and the uncertainty were genuinely considered beforehand. It does not make a loss impossible — it means the loss, if it comes, is not a surprise.',
    },
    {
      kind: 'example',
      title: 'Same fall, four times the damage',
      setup:
        'Two people each start with ₹1,00,000 of savings — an illustrative figure only. Compare what each decided BEFORE either result was known, then see both a year later, when each holding happens to be down 10%.',
      steps: [
        {
          label: 'Person A commits',
          detail: '20% of savings to a researched, long-term holding — the rest stays elsewhere',
          compute: { fn: 'percentOf', value: 100000, percent: 20 },
        },
        {
          label: 'Person B commits',
          detail: '80% of savings to a tip, with no plan for being wrong',
          compute: { fn: 'percentOf', value: 100000, percent: 80 },
        },
        {
          label: 'A year later',
          detail: 'By coincidence, both holdings are down the same percentage',
          value: 'Both down 10%',
        },
        {
          label: "Person A's loss, in rupees",
          detail: '10% of what was actually committed',
          compute: { fn: 'percentOf', value: 20000, percent: 10 },
        },
        {
          label: "Person B's loss, in rupees",
          detail: '10% of what was actually committed',
          compute: { fn: 'percentOf', value: 80000, percent: 10 },
        },
      ],
      conclusion:
        'The identical 10% fall costs Person B four times as much in rupees. Not because the idea was worse, but because how much to commit was never decided with a limit in mind. Size is part of the process too.',
    },
    {
      kind: 'widget',
      component: 'ProcessNotOutcomeLab',
      props: {},
      takeaway:
        'Grade the decision, not the result. Two of these six scenarios are a disciplined process that still lost money — and one is a reckless process that happened to win.',
    },
    {
      kind: 'predict',
      prompt:
        'Trade X: sized and limited in advance, lost the pre-set amount, exited exactly as planned. Trade Y: no plan, most of the account on one idea, made a large profit. Which was the better DECISION?',
      options: ['Trade X — the plan was followed, regardless of the result', 'Trade Y — it made more money', 'They were equally good decisions'],
      correct: 0,
      reveal:
        'Trade X. A losing trade that matched its plan exactly is the process working, not failing — the loss was already accepted as a possible outcome before it happened. Trade Y worked out, this time, despite carrying a risk nobody had actually sized or limited. Judging trade Y as the better decision because it happened to win is exactly the error this lesson exists to name.',
      askWhy: true,
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'A calculated risk is not a safe one',
      md:
        'None of this is a claim that a disciplined process protects you from losing money — it does not, and nobody who tells you otherwise is teaching you honestly. A sound process can lose. A reckless one can win. What a sound process actually buys you is a decision you can defend, repeat, and learn from, whatever it happens to make this one time.\n\nThis also is not a moral judgement on gambling itself. It is a warning that gambling-like BEHAVIOUR — chasing losses, no pre-set limit, an oversized or overly concentrated bet — quietly shows up inside ordinary investing and trading decisions, disguised as confidence.',
    },
    {
      kind: 'example',
      title: 'Same starting mistake, three years apart',
      setup:
        'An investor puts 60% of a ₹3,00,000 account into one company after a tip, with no limit decided in advance. It falls 20% in year one. Watch what "chasing losses" actually does to the numbers over the two years that follow.',
      steps: [
        { label: 'Amount committed to the one company', detail: '60% of ₹3,00,000, no pre-set limit', compute: { fn: 'percentOf', value: 300000, percent: 60 } },
        { label: 'Year 1 — falls 20%, loss so far', detail: '20% of the ₹1,80,000 committed', compute: { fn: 'percentOf', value: 180000, percent: 20 } },
        { label: 'Year 2 — adds another ₹1,00,000 "to average down"', detail: 'No new limit decided either — the same undisciplined pattern repeats', value: 'Total now committed: ₹2,44,000' },
        { label: 'Year 2 — falls a further 15%', detail: '15% of the new, larger ₹2,44,000 committed', compute: { fn: 'percentOf', value: 244000, percent: 15 } },
        { label: 'Where the account stands after two years of "no limit, then add more"', detail: 'Two losses, each bigger than a pre-set limit would ever have allowed', value: 'Down well over a third of what was ever put into this one holding' },
      ],
      conclusion:
        'The mistake was not the first 60% commitment alone — it was never having a limit to stop there. Adding more after a loss, with still no limit, is the same undisciplined decision made twice, at a larger size each time. A pre-committed limit would have ended this story after year one, at a fixed, known cost.',
    },
    {
      kind: 'predict',
      prompt:
        'An investor loses money on Trade A, sized and limited exactly as planned. Frustrated, they immediately put a much larger, unplanned amount into Trade B — a completely different company — "to make it back quickly." Is Trade B gambling-like behaviour?',
      options: [
        'No — Trade A was disciplined, so the investor has earned some latitude on Trade B',
        'Yes — Trade B has its own process, made in the moment, driven by chasing the earlier loss rather than by a plan',
        'It depends only on whether Trade B makes money',
      ],
      correct: 1,
      reveal:
        'Yes. Trade B is judged entirely on its own process, at the moment it was placed. That process was chasing a loss with an unplanned, oversized bet — exactly the gambling-like behaviour this lesson names. Trade A being disciplined does not transfer any credit to Trade B; each decision is graded independently, on what was known and decided when it was made. This is also the trap in the phrase "making it back". It treats the account as a single scoreboard to settle rather than a series of separate decisions, each needing its own limit.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'After a disciplined, planned loss on one holding, an investor puts double their usual amount into an unrelated company the same afternoon. There is no new research and no pre-set limit — the goal is just to recover the loss faster. Decide.',
          type: 'decision',
          spec: {
            options: [
              'This is fine, since the first trade was disciplined',
              'This is gambling-like behaviour on its own terms, regardless of how the first trade was handled',
              'This is fine as long as the second trade also happens to win',
            ],
            correct:
              'This is gambling-like behaviour on its own terms, regardless of how the first trade was handled',
          },
          explanation:
            'It is judged on its own process — an oversized, unresearched bet with no pre-set limit, driven by chasing an earlier loss. Whether the first trade was disciplined, and whether this second trade wins or loses, do not change what kind of decision it was at the moment it was made.',
        },
        {
          prompt: 'An investor with a ₹2,00,000 account puts 70% of it into one small company. How many rupees, exactly?',
          type: 'compute',
          spec: { metric: 'literal', value: 140000, tolerance: 1000 },
          explanation: '70% of ₹2,00,000 is ₹1,40,000 — worth working out exactly, since "70% in one idea" reads very differently once it is a rupee figure that size.',
        },
        {
          prompt:
            'That investor puts 70% of their capital into one small company. After it falls, they add more money each time it drops further, "to get back to even faster", with no point at which they had decided in advance to stop. Sort each statement about this situation.',
          type: 'classify',
          spec: {
            categories: ['A real process problem here', 'Not actually the problem'],
            items: [
              { label: 'Putting 70% of capital into a single holding', category: 'A real process problem here' },
              { label: 'Adding more money after each loss, to recover faster', category: 'A real process problem here' },
              { label: 'The company chosen was a small one', category: 'Not actually the problem' },
              { label: 'The holding lost money at all', category: 'Not actually the problem' },
            ],
          },
          explanation:
            'The two real problems are extreme concentration (70% in one idea) and chasing losses (adding specifically to recover faster, with no limit). Company size is not itself gambling-like behaviour — a small, well-researched holding of a sensible size is not this. Neither is losing money; a loss can happen inside a perfectly sound process, which is the whole point of the earlier lab.',
        },
        {
          prompt:
            'Without naming a different security to buy or sell, what is the single safest PROCESS change for next time?',
          type: 'decision',
          spec: {
            options: [
              'Decide a maximum loss and a size limit before entering, and hold to them regardless of what happens after',
              'Switch to a larger, more well-known company instead',
              'Wait for an even bigger loss before adding more, to be more confident the recovery is real',
            ],
            correct: 'Decide a maximum loss and a size limit before entering, and hold to them regardless of what happens after',
          },
          explanation:
            'The second option changes which security is involved rather than fixing the process — the exact same concentration-and-chasing pattern would still be available on a large, well-known company. The third option does not remove the problem, it just moves the same undisciplined "add more and hope" behaviour to a later, larger loss. Deciding limits in advance, and actually holding to them, is the one change that addresses both problems identified above — not which asset is chosen, but how the decision is made.',
        },
      ],
    },
  ],
};

export default lesson;
