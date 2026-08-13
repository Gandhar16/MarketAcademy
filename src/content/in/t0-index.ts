import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — what an index is counting
 *
 * "The market was up today" is the most repeated sentence in financial media
 * and it hides two things worth knowing: which basket, and weighted how.
 *
 * The finding that makes this lesson land is that a WEIGHTED index can rise on a
 * day when most of its companies fell. That is not a flaw and it is not a trick —
 * it is what weighting means — but a beginner who does not know it will keep
 * being puzzled that their holdings fell on a green day.
 *
 * The lesson also quietly does the work for stage 4: if you understand that an
 * index is a basket that drops its failures and keeps its winners, the argument
 * for owning one instead of picking is already half made.
 */
export const lesson: Lesson = {
  id: 'in-t0-index',
  tier: 'T0',
  market: 'IN',
  title: 'What an index is counting',
  summary:
    'NIFTY and Sensex are baskets, weighted by size. That weighting is why "the market was up" can be true on a day when most companies fell.',
  plainSummary:
    'When the news says the market rose, it means one particular basket of companies rose. This explains what is in that basket and how it is counted.',
  objectives: [
    'Say what an index is and what decides which companies are in it',
    'Explain why a weighted index can rise while most of its companies fall',
    'Compute the effect of a large company moving against a small one',
    'Describe what happens to a company that is dropped from an index',
  ],
  prerequisites: ['in-t0-what-is-a-share'],
  estimatedMinutes: 11,
  introduces: ['index', 'volume'],
  skills: ['foundations', 'index-construction'],
  blocks: [
    {
      kind: 'predict',
      prompt:
        'NIFTY rises 1% today. Of its 50 companies, 32 finished lower. Is that possible?',
      options: [
        'No — the arithmetic would not work',
        'Yes, if the biggest companies rose enough',
        'Only if there was an error in the calculation',
      ],
      correct: 1,
      reveal:
        'Perfectly possible, and it happens regularly. NIFTY is weighted by company size, so the largest few members carry far more of it than the smallest. If two or three giants have a strong day, they can outweigh thirty ordinary companies having a mildly bad one. This is why "the market was up" and "most of my holdings fell" are often both true on the same afternoon. Anybody puzzled by that has simply not been told how the number is built.',
      askWhy: true,
    },
    {
      kind: 'widget',
      component: 'IndexWeightExplainer',
      props: {},
      takeaway:
        'Step through it once. Watch how much of the final number comes from the single biggest block — that is the entire mechanism.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'A basket, and a rule for counting it',
      md:
        'An **index** is two decisions.\n\n**Which companies are in it.** NIFTY takes 50 large, heavily traded companies from the NSE. A committee reviews the list and changes it periodically.\n\n**How much each one counts.** Not equally. Each company’s weight depends on its size, so the largest members move the number far more than the smallest.\n\nThat is the whole construction. Everything the index does afterwards follows from those two choices.',
    },
    {
      kind: 'example',
      title: 'A tiny index, to see the weighting',
      setup:
        'Imagine an index of just three companies, weighted by size. Big Ltd is 70% of it, Mid Ltd is 20% and Small Ltd is 10%. Today Big rises 2% and both of the others fall 3%.',
      steps: [
        {
          label: 'What Big contributes',
          detail: 'A 2% rise, counted at 70% weight',
          compute: { fn: 'percentOf', value: 2, percent: 70 },
        },
        {
          label: 'What Mid contributes',
          detail: 'A 3% fall, counted at 20% weight',
          compute: { fn: 'percentOf', value: -3, percent: 20 },
        },
        {
          label: 'What Small contributes',
          detail: 'A 3% fall, counted at 10% weight',
          compute: { fn: 'percentOf', value: -3, percent: 10 },
        },
        {
          label: 'The index move',
          detail: 'Add the three contributions together',
          compute: { fn: 'literal', value: 0.5 },
        },
        {
          label: 'How many companies actually fell',
          detail: 'Two out of three, on a day the index rose',
          compute: { fn: 'literal', value: 2 },
        },
      ],
      conclusion:
        'The index rose 0.5% while two of its three companies fell. Nothing is wrong — that is what weighting by size does.',
    },
    {
      kind: 'predict',
      prompt:
        'Same three-company index. This time Big falls 1% and both smaller companies rise 4%. Work it out before you look.',
      options: ['The index rises about 0.5%', 'The index is roughly flat', 'The index falls about 1%'],
      correct: 0,
      reveal:
        'It rises about 0.5%. Big contributes minus 0.7, Mid contributes plus 0.8 and Small plus 0.4, which nets to plus 0.5. The useful thing here is not the arithmetic but the habit: whenever an index move surprises you, ask what the largest few members did. In NIFTY a handful of companies account for a very large share of the whole thing. So the headline number is often telling you about them rather than about the market broadly.',
      askWhy: true,
    },
    {
      kind: 'chart',
      source: { type: 'live', symbol: '^NSEI', interval: '1d', range: '1y' },
      mode: 'view',
      takeaway:
        'A real year of NIFTY. This single line is 50 companies weighted by size — no individual company you own moves quite like it.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'The index quietly takes out the rubbish',
      md:
        'Companies leave an index when they shrink or fail, and are replaced by ones that have grown.\n\nSo the basket is not a fixed set of companies held forever. It is a rule that keeps the successful ones and drops the rest, automatically, without anybody having to make a call.\n\nThat is worth sitting with. A long-term chart of an index is not the record of fifty companies doing well — it is the record of a rule that removed the failures along the way.',
    },
    {
      kind: 'example',
      title: 'A single giant can hide forty-nine ordinary days',
      setup:
        'Same three-company index as before — Big Ltd 70%, Mid Ltd 20%, Small Ltd 10%. This time only Big moves at all; Mid and Small are both flat, unchanged all day.',
      steps: [
        { label: 'Big Ltd today', detail: 'Rises 3%, counted at its 70% weight', compute: { fn: 'percentOf', value: 3, percent: 70 } },
        { label: 'Mid Ltd today', detail: 'Perfectly flat — 0% change, counted at 20% weight', compute: { fn: 'percentOf', value: 0, percent: 20 } },
        { label: 'Small Ltd today', detail: 'Also perfectly flat — 0% change, counted at 10% weight', compute: { fn: 'percentOf', value: 0, percent: 10 } },
        { label: 'The index move', detail: 'Add the three contributions together', compute: { fn: 'literal', value: 2.1 } },
        { label: 'How many of the three companies actually did anything', detail: 'Two sat completely still all day', compute: { fn: 'literal', value: 1 } },
      ],
      conclusion:
        'The index rose 2.1% on a day when two of its three members did not move at all. A single large member is often enough, on its own, to produce a headline number that reads as "the whole market moved" — when in fact only one company did.',
    },
    {
      kind: 'predict',
      prompt:
        'Big Ltd has 1,000 shares outstanding. The founding family holds 600 of them and has no plans to ever sell. Indices like NIFTY weight by FREE-FLOAT market value — shares realistically available to trade. How many of Big Ltd\'s shares actually count toward its index weight?',
      options: [
        'All 1,000 — total shares outstanding is what matters',
        'Only the 400 not held by the founding family — free-float excludes locked-in founder holdings',
        'None — a company with a majority founder holding cannot be in the index at all',
      ],
      correct: 1,
      reveal:
        'Only the 400. Free-float weighting deliberately excludes shares that are not realistically available to trade — founder holdings that are not coming to market chief among them. The logic is that an index is meant to represent what an ordinary investor could actually go out and buy, and 600 locked-away shares are not part of that. So two companies with identical total market value can carry very different index weights, if one has a much larger founder holding than the other. The smaller free float counts for less, not more.',
      askWhy: true,
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Small Ltd has 2,000 shares outstanding at ₹100 each. Its founders hold 1,200 of them permanently. Using free-float weighting, what value actually counts toward its index weight?',
          type: 'compute',
          spec: { metric: 'literal', value: 80000, tolerance: 1000, unit: '₹' },
          explanation:
            '800 free-float shares × ₹100 = ₹80,000, not the full ₹2,00,000 of total market value. The 1,200 founder-held shares are excluded entirely, because they are not realistically available to be bought by anybody else. This is why total market value and index weight are not the same number, and why a company\'s headline size can overstate its actual pull on the index.',
        },
        {
          prompt:
            'A company is 8% of an index and rises 5% today. How much does it add to the index, in percentage points?',
          type: 'compute',
          spec: { metric: 'literal', value: 0.4, tolerance: 0.02, unit: 'points' },
          explanation:
            '5% × 8% = 0.4 percentage points. Doing this for the top few members explains most days. When a commentator says the market was dragged down by one company, this is the sum they did. It is worth checking: the contribution is often far smaller than the story implies.',
        },
        {
          prompt:
            'Sort each statement by whether an index level can tell you it.',
          type: 'classify',
          spec: {
            categories: ['The index tells you this', 'It does not'],
            items: [
              { label: 'How that weighted basket moved today', category: 'The index tells you this' },
              { label: 'Roughly how the largest companies did', category: 'The index tells you this' },
              { label: 'Whether most companies rose', category: 'It does not' },
              { label: 'How your own holdings did', category: 'It does not' },
            ],
          },
          explanation:
            'It tells you about a specific weighted basket and, mostly, about its biggest members. It does not tell you how the typical company did — for that you would want a count of how many rose and fell, which is published and almost never quoted. And it certainly says nothing about your holdings unless you happen to own that basket.',
        },
        {
          prompt:
            'A friend says a long-term index chart proves that companies reliably grow over decades. Decide what is wrong with that.',
          type: 'decision',
          spec: {
            options: [
              'Nothing — the chart shows exactly that',
              'The index dropped its failures along the way, so the chart is not a record of the same companies',
              'Charts of the past prove nothing about anything',
            ],
            correct:
              'The index dropped its failures along the way, so the chart is not a record of the same companies',
          },
          explanation:
            'The basket changed. Companies that collapsed were removed and replaced by ones that had grown, so the line is the record of a selection rule and not of a fixed set of businesses. This effect has a name and a whole lesson later in the course. It does not make index investing a bad idea — the automatic replacement is genuinely part of what you are buying. It makes the SENTENCE wrong.',
        },
      ],
    },
  ],
};

export default lesson;
