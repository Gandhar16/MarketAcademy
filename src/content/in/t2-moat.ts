import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T2 · Reading a business like an analyst — economic moat
 *
 * The return-ratios and debt lessons taught how to measure what a business
 * has already done. A moat is a claim about what protects that performance
 * from competitors doing the same thing next year. It is the least
 * mechanical concept in this stage — no single ratio computes it — so the
 * honest treatment is naming the concrete sources of one, and testing
 * whether a learner can tell a real moat from a business merely doing well
 * right now.
 */
export const lesson: Lesson = {
  id: 'in-t2-moat',
  tier: 'T2',
  market: 'IN',
  title: 'Does this business have a moat, and does it matter',
  summary:
    'A moat is a durable reason competitors cannot simply copy what is working and compete the profit away. High margins today are a result. A moat is the reason those margins might still be high in ten years.',
  plainSummary:
    'Some companies keep earning strong profits for decades; others see a good run copied away by competitors within a few years. This shows what actually protects a business from that, and what does not.',
  objectives: [
    'Name the concrete sources of a durable competitive advantage',
    'Distinguish a moat from a temporary run of good results',
    'Compute what a margin difference is worth over several years of compounding',
    'Decide how much a stated "moat" claim should be trusted without evidence',
  ],
  prerequisites: ['in-t2-quality-of-earnings'],
  estimatedMinutes: 15,
  introduces: ['moat'],
  skills: ['fundamentals', 'moat'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'Two companies both earn 25% operating margins this year. Company A has held that margin for fifteen years. Company B hit it for the first time this year, up from 8% two years ago. Which is more likely protected by a real moat?',
      options: [
        'Both equally — the margin number is what matters, not its history',
        'Company A — fifteen years of a margin competitors have not managed to erode is itself evidence of a real barrier',
        'Company B — a fast-rising margin shows stronger momentum',
      ],
      correct: 1,
      reveal:
        'Company A. A margin sustained for fifteen years, through multiple competitors presumably trying to copy it, is itself strong evidence something is actually stopping them. A margin that jumped in the last year could be a real improvement, or it could be a temporary edge — a hot product cycle, a one-off cost cut, a stumbling competitor. That kind of edge erodes the moment somebody else notices the opportunity. Duration under competitive pressure is the whole test a single year of good numbers cannot pass.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'MoatCompoundExplainer',
      props: {},
      takeaway:
        'Step through it once. Both companies grow identically — the entire ₹208cr gap in year 10 comes from whether the margin held.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'Four concrete sources, not a vibe',
      md:
        '**Switching costs** — genuinely painful or expensive for a customer to leave, even if a rival is slightly cheaper.\n\n**Network effects** — the product gets more valuable to each user as more users join, which a new entrant cannot replicate without already having the users.\n\n**Cost advantages** — a structurally lower cost to produce or deliver, from scale, location or a process rivals cannot cheaply copy.\n\n**Intangible assets** — a brand, patent or licence that lets a company charge more, or keeps a competitor out entirely, not decoration on top of otherwise identical products.\n\nA business can look excellent without any of these. That is exactly the case a moat claim needs evidence for, not a category it gets to skip.',
    },
    {
      kind: 'example',
      title: 'What a margin difference is worth, compounded',
      setup:
        'Two companies both grow revenue 10% a year for ten years, starting at ₹1,000 crore. Company A holds a 20% operating margin throughout. Company B\'s margin fades from 20% to 12% over the same period as competitors copy its edge.',
      steps: [
        { label: 'Company A — profit in year 10', detail: 'Revenue compounds; margin stays fixed at 20%', compute: { fn: 'literal', value: 518.7 } },
        { label: 'Company B — profit in year 10', detail: 'Same revenue, but margin has faded to 12%', compute: { fn: 'literal', value: 311.2 } },
        { label: 'The gap this creates, in year 10 alone', detail: 'Company A\'s profit minus Company B\'s', compute: { fn: 'literal', value: 207.5 } },
        { label: 'What actually diverged', detail: 'Not growth — both grew identically. The margin the moat protected', value: 'margin, not growth' },
      ],
      conclusion:
        'Identical revenue growth, wildly different profit outcomes. A moat\'s entire economic value shows up in whether the margin holds, which is precisely why "the business is growing" is not the same claim as "the business has a moat".',
    },
    {
      kind: 'predict',
      prompt:
        'A company\'s annual report describes it as having "a strong moat" three times in the chairman\'s letter. What should that phrase, by itself, be worth to your assessment?',
      options: [
        'Meaningful — companies would not claim it if it were not true',
        'Very little — a moat is demonstrated by margins holding under competitive pressure over years, not asserted in a letter',
        'It should be weighted more heavily the more times it is repeated',
      ],
      correct: 1,
      reveal:
        'Very little on its own. Every company would like to be described as having a moat, and the phrase costs nothing to write. The four sources named earlier are checkable against actual numbers — margin history, market share over time, whether a competitor with more capital has tried and failed to compete it away. A claim repeated three times in one letter is not stronger evidence than the same claim made once; repetition is a writing choice, not data.',
      askWhy: true,
    },
    {
      kind: 'predict',
      prompt:
        "A company has genuinely held a 25% margin for a decade through a strong brand — a real moat by this lesson's own measures. A new government price cap then forces margins down to 10% overnight. Did the moat fail?",
      options: [
        'Yes — a margin that falls this fast proves the moat was never real',
        'No — the moat is still intact; an external regulatory action, not competition, changed the economics',
        'It is impossible to say without more information',
      ],
      correct: 1,
      reveal:
        'No, the moat itself did not fail. A moat is specifically about protection from COMPETITORS copying an advantage. Nothing in the four sources protects against a government changing the rules. The brand is still there; regulation is a different kind of risk entirely.',
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
      title: 'Every moat erodes eventually — the question is the rate',
      md:
        'No competitive advantage is permanent. Patents expire, brands fall out of favour, technology that created a cost edge becomes commodity. "Moat" describes how SLOWLY that erosion happens, not whether it happens at all.\n\nThe honest question is never "does this company have a moat, yes or no". It is "how many years of evidence support this margin holding, and what would have to change for a competitor to close the gap". A moat is a rate of decay, read in decades for the strongest ones and in single years for the weakest.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            "A company with a genuine decade-long moat sees its margin cut in half overnight by a new regulatory price cap, unrelated to any competitor's actions. Decide whether this disproves the moat.",
          type: 'decision',
          spec: {
            options: [
              'Yes — any sudden margin drop disproves a moat claim',
              'No — the moat protects against competitors copying an advantage, not against regulatory or political risk',
              'It depends only on how large the margin drop was',
            ],
            correct:
              'No — the moat protects against competitors copying an advantage, not against regulatory or political risk',
          },
          explanation:
            'No. A moat is specifically about competitive protection. Regulatory risk is real and worth tracking separately, but it is not what the four sources in this lesson claim to guard against.',
        },
        {
          prompt: 'A company holds a 30% operating margin for twelve consecutive years despite three well-funded competitors entering its market. What does that duration most honestly suggest?',
          type: 'decision',
          spec: {
            options: [
              'Nothing — margins fluctuate for many reasons',
              'Real evidence of a durable advantage, since well-funded rivals trying and failing to erode it is the actual test',
              'The company is definitely overvalued at this margin',
            ],
            correct: 'Real evidence of a durable advantage, since well-funded rivals trying and failing to erode it is the actual test',
          },
          explanation:
            'Competitors with capital trying and failing is exactly the pressure test a moat claim needs to survive. Twelve years of it surviving is real evidence, not proof of anything about the stock price, which is a separate question this lesson does not answer.',
        },
        {
          prompt: 'Revenue of ₹500 crore grows at 10% a year. What is revenue after 10 years?',
          type: 'compute',
          spec: { metric: 'literal', value: 1297, tolerance: 15, unit: '₹ crore' },
          explanation:
            '₹500 crore × (1.10)^10 ≈ ₹1,297 crore. The same compounding arithmetic behind the lesson\'s worked example — growth alone says nothing about whether the margin applied to that revenue will hold.',
        },
        {
          prompt: 'Classify each statement about economic moats.',
          type: 'classify',
          spec: {
            categories: ['Supported by the mechanism', 'Folklore'],
            items: [
              { label: 'A margin sustained for many years under competitive pressure is real evidence of a moat', category: 'Supported by the mechanism' },
              { label: 'A company calling itself "moated" in its own annual report is meaningful evidence', category: 'Folklore' },
              { label: 'Switching costs, network effects, cost advantages and intangible assets are checkable sources of an advantage', category: 'Supported by the mechanism' },
              { label: 'A moat, once established, lasts forever', category: 'Folklore' },
            ],
          },
          explanation:
            'Every moat erodes eventually — the whole discipline is judging the rate, not assuming permanence. A self-description in a shareholder letter costs nothing to write and proves nothing on its own.',
        },
      ],
    },
  ],
};

export default lesson;
