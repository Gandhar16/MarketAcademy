import { describe, expect, it } from 'vitest';
import { validateCurriculum, validateLesson, validateSyllabus } from './validator';
import type { Lesson } from './dsl';

const predict = () => ({
  kind: 'predict' as const,
  prompt: 'Same trade, but the stop is twice as far away. How many shares can you buy now?',
  options: ['Half as many', 'The same', 'Twice as many'],
  correct: 0,
  reveal:
    'Half as many. The risk budget did not change; the risk per share doubled. Double the stop distance, half the position — that is the whole method in one line, and it is why a wider stop is not the safer choice it feels like.',
  askWhy: true,
});

const widget = (i: number) => ({
  kind: 'widget' as const,
  component: 'OrderBookDepth',
  props: {},
  takeaway: `Takeaway number ${i} that says something specific.`,
});

const prose = (text = 'Some explanatory prose that sets up the next interaction.') => ({
  kind: 'prose' as const,
  md: text,
});

const example = () => ({
  kind: 'example' as const,
  title: 'A concrete case',
  setup: 'You buy 100 shares at ₹1,400 and sell them a week later at the same price.',
  steps: [
    { label: 'Turnover', detail: '100 shares at ₹1,400', value: '₹1,40,000' },
    { label: 'Charges', detail: 'The full statutory stack on both legs', value: '₹236.49' },
  ],
  conclusion: 'A trade that did not move still cost you money, which is the whole point.',
});

const checkpoint = () => ({
  kind: 'checkpoint' as const,
  tasks: [
    {
      prompt: 'The stock is 2% from your stop and volume has dried up. Decide: hold, cut, or add.',
      type: 'decision' as const,
      spec: { correct: 'cut' },
      explanation: 'Cutting is correct here because the thesis depended on participation that is no longer present.',
    },
    // R17: a checkpoint made only of choices can be passed by recognising the
    // right-looking answer, so the fixture carries a task that has to be
    // produced rather than picked.
    {
      prompt: 'A market buy for 400 shares hits the ladder above. What average price do you pay?',
      type: 'compute' as const,
      spec: { metric: 'literal', tolerance: 0.05, value: 1401.2 },
      explanation:
        'The first 250 fill at ₹1,400.90 and the remaining 150 at ₹1,401.70, which averages ₹1,401.20 — a worse price than the one on the screen.',
    },
  ],
});

const base = (over: Partial<Lesson> = {}): unknown => ({
  id: 'order-book-basics',
  tier: 'T0',
  market: 'IN',
  title: 'What the order book actually is',
  summary: 'Look inside the book, place orders against it, and see who is on the other side of your trade.',
  plainSummary:
    'Before you buy anything it helps to know who is selling it to you. This shows the queue of people waiting behind every number on the screen.',
  objectives: ['Read a depth ladder and say what will happen to a market order of a given size'],
  prerequisites: [],
  estimatedMinutes: 10,
  skills: ['order-book'],
  // The fixture's worked example talks about turnover and its checkpoint about
  // volume, both of which the glossary places at T1. Declared here so the
  // fixture is a lesson that legitimately passes C5 rather than one that
  // happens to dodge it.
  introduces: ['order-book', 'turnover', 'volume'],
  blocks: [widget(1), prose(), example(), widget(2), widget(3), checkpoint()],
  ...over,
});

describe('lesson validator', () => {
  it('passes a well-formed interactive lesson', () => {
    const { violations } = validateLesson(base());
    expect(violations).toEqual([]);
  });

  it('rejects a lesson that is mostly prose', () => {
    const { violations } = validateLesson(
      base({ blocks: [prose(), prose('a'), prose('b'), prose('c'), widget(1), example(), checkpoint()], estimatedMinutes: 10 } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R1-interactive-ratio');
  });

  it('rejects three passive blocks in a row', () => {
    const { violations } = validateLesson(
      base({
        blocks: [widget(1), prose('a'), prose('b'), prose('c'), widget(2), widget(3), widget(4), widget(5), example(), checkpoint()],
        estimatedMinutes: 17,
      } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R2-consecutive-prose');
  });

  it('rejects a lesson with no checkpoint', () => {
    const { violations } = validateLesson(base({ blocks: [widget(1), widget(2), example(), widget(3)] } as never));
    expect(violations.map((v) => v.rule)).toContain('R3-checkpoint');
  });

  it('rejects a checkpoint that is not the last block', () => {
    const { violations } = validateLesson(
      base({ blocks: [widget(1), example(), checkpoint(), widget(2), widget(3)] } as never),
    );
    expect(violations.some((v) => v.rule === 'R3-checkpoint')).toBe(true);
  });

  it('rejects a cold open of two prose blocks', () => {
    const { violations } = validateLesson(
      base({
        blocks: [prose('a'), prose('b'), widget(1), widget(2), widget(3), widget(4), example(), checkpoint()],
        estimatedMinutes: 14,
      } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R4-cold-open');
  });

  it('rejects recall-style checkpoint questions', () => {
    const { violations } = validateLesson(
      base({
        blocks: [
          widget(1),
          widget(2),
          example(),
          widget(3),
          {
            kind: 'checkpoint',
            tasks: [
              {
                prompt: 'What is a stop-loss order?',
                type: 'classify',
                spec: {},
                explanation: 'A stop-loss is an instruction that becomes live when a trigger price is reached.',
              },
            ],
          },
        ],
      } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R7-recall-question');
  });

  it('rejects a predict block whose reveal explains nothing', () => {
    const { violations } = validateLesson(
      base({
        blocks: [
          widget(1),
          {
            kind: 'predict',
            prompt: 'The bar gaps below your stop. What fills?',
            options: ['At the stop', 'At the open', 'Nothing'],
            correct: 1,
            reveal: 'It fills at the open.',
            askWhy: false,
          },
          widget(2),
          example(),
          checkpoint(),
        ],
      } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R6-predict-reveal');
  });

  it('rejects an implausible time estimate', () => {
    const { violations } = validateLesson(base({ estimatedMinutes: 40 }));
    expect(violations.map((v) => v.rule)).toContain('R9-time-estimate');
  });

  it('rejects a lesson with no worked example', () => {
    const { violations } = validateLesson(
      base({ blocks: [widget(1), widget(2), widget(3), checkpoint()], estimatedMinutes: 8 } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R10-no-worked-example');
  });

  it('rejects a worked example that produces no numbers', () => {
    const bare = {
      kind: 'example',
      title: 'All talk',
      setup: 'A situation described at length but never actually computed anywhere.',
      steps: [
        { label: 'First', detail: 'Some reasoning with no number attached to it' },
        { label: 'Second', detail: 'More reasoning, still no number anywhere in sight' },
      ],
      conclusion: 'A conclusion that nothing in the steps actually supports numerically.',
    };
    const { violations } = validateLesson(
      base({ blocks: [widget(1), bare, widget(2), widget(3), checkpoint()], estimatedMinutes: 10 } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R11-example-no-values');
  });

  it('lets a diagram break up a run of prose', () => {
    const figure = { kind: 'figure', figure: 'SpreadDiagram', props: {}, caption: 'The gap between bid and ask.' };
    const { violations } = validateLesson(
      base({
        blocks: [widget(1), prose('a'), prose('b'), figure, prose('c'), prose('d'), example(), widget(2), checkpoint()],
        estimatedMinutes: 13,
      } as never),
    );
    expect(violations.map((v) => v.rule)).not.toContain('R2-consecutive-prose');
  });

  it('rejects placeholder takeaways', () => {
    const { violations } = validateLesson(
      base({
        blocks: [
          { kind: 'widget', component: 'X', props: {}, takeaway: 'TODO write this later' },
          widget(2),
          example(),
          widget(3),
          checkpoint(),
        ],
      } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R5-placeholder');
  });

  it('rejects a lesson with no plain-language summary', () => {
    const { violations } = validateLesson(base({ plainSummary: undefined } as never));
    expect(violations.map((v) => v.rule)).toContain('R13-no-plain-summary');
  });

  it('rejects a plain summary that is itself full of jargon', () => {
    const { violations } = validateLesson(
      base({
        plainSummary: 'Size your position from the stop-loss and watch what slippage does to your breakeven.',
      } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R13-plain-summary-jargon');
  });

  it('lets a lesson name the thing it actually teaches', () => {
    // The options lesson has to be allowed to say "option" in its own summary.
    const { violations } = validateLesson(
      base({
        introduces: ['order-book', 'turnover', 'volume', 'slippage'],
        plainSummary: 'What slippage is, and why the number you saw is not always the number you paid for it.',
      } as never),
    );
    expect(violations.map((v) => v.rule)).not.toContain('R13-plain-summary-jargon');
  });

  it('throws a readable error on a schema violation', () => {
    expect(() => validateLesson(base({ id: 'Not Kebab Case' }))).toThrow(/kebab-case/);
  });
});

describe('curriculum validator', () => {
  const lesson = (id: string, tier: string, prerequisites: string[] = []) =>
    validateLesson(base({ id, tier, prerequisites } as never)).lesson;

  it('accepts a well-ordered curriculum', () => {
    const v = validateCurriculum([lesson('a', 'T0'), lesson('b', 'T1', ['a'])]);
    expect(v).toEqual([]);
  });

  it('catches a lesson leaning on vocabulary from a later tier', () => {
    // A beginner three lessons in does not know what a lot size is, and a
    // definition popup does not rescue a paragraph they were never equipped to
    // follow. This is the rule the jargon audit produced.
    const ahead = validateLesson(
      base({
        id: 'too-early',
        tier: 'T1',
        introduces: ['turnover', 'volume'],
        blocks: [
          widget(1),
          prose('One lot of the NIFTY future needs margin you do not have.'),
          example(),
          widget(2),
          widget(3),
          checkpoint(),
        ],
      } as never),
    ).lesson;

    const rules = validateCurriculum([ahead]).map((v) => v.rule);
    expect(rules).toContain('C5-jargon-ahead-of-tier');
  });

  it('stops complaining once the lesson declares that it teaches the term', () => {
    const declared = validateLesson(
      base({
        id: 'declares-it',
        tier: 'T1',
        introduces: ['turnover', 'volume', 'lot-size', 'margin', 'future'],
        blocks: [
          widget(1),
          prose('One lot of the NIFTY future needs margin you do not have.'),
          example(),
          widget(2),
          widget(3),
          checkpoint(),
        ],
      } as never),
    ).lesson;

    expect(validateCurriculum([declared]).map((v) => v.rule)).not.toContain('C5-jargon-ahead-of-tier');
  });

  it('lets a later lesson rely on a term a prerequisite taught', () => {
    const parent = validateLesson(
      base({ id: 'teaches-lots', tier: 'T3', introduces: ['turnover', 'volume', 'lot-size'] } as never),
    ).lesson;
    const child = validateLesson(
      base({
        id: 'uses-lots',
        tier: 'T3',
        prerequisites: ['teaches-lots'],
        introduces: ['turnover', 'volume'],
        blocks: [widget(1), prose('Size it in lots.'), example(), widget(2), widget(3), checkpoint()],
      } as never),
    ).lesson;

    expect(validateCurriculum([parent, child]).map((v) => v.rule)).not.toContain('C5-jargon-ahead-of-tier');
  });

  it('catches duplicate ids', () => {
    const v = validateCurriculum([lesson('a', 'T0'), lesson('a', 'T0')]);
    expect(v.map((x) => x.rule)).toContain('C1-duplicate-id');
  });

  it('catches a prerequisite that does not exist', () => {
    const v = validateCurriculum([lesson('b', 'T1', ['ghost'])]);
    expect(v.map((x) => x.rule)).toContain('C2-missing-prerequisite');
  });

  it('catches a prerequisite cycle', () => {
    const v = validateCurriculum([lesson('a', 'T0', ['b']), lesson('b', 'T0', ['a'])]);
    expect(v.map((x) => x.rule)).toContain('C3-prerequisite-cycle');
  });

  it('catches a lesson requiring material from a higher tier', () => {
    const v = validateCurriculum([lesson('easy', 'T0', ['hard']), lesson('hard', 'T3')]);
    expect(v.map((x) => x.rule)).toContain('C4-tier-inversion');
  });
});

describe('R16 — an example must be followed by a question about it', () => {
  // The rule that turns "give examples" into a structural property. A
  // walkthrough the learner reads and nods along to produces the fluency
  // illusion; the only way to find out whether it transferred is to ask.
  it('passes when a prediction follows the example', () => {
    const { violations } = validateLesson(
      base({
        blocks: [widget(1), example(), predict(), widget(2), widget(3), checkpoint()],
      } as never),
    );
    expect(violations.map((v) => v.rule)).not.toContain('R16-example-without-question');
  });

  it('fails when the example is buried too far from the next question', () => {
    const { violations } = validateLesson(
      base({
        blocks: [widget(1), example(), widget(2), widget(3), widget(4), prose(), checkpoint()],
      } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R16-example-without-question');
  });

  it('accepts the checkpoint itself as the question when it is close enough', () => {
    const { violations } = validateLesson(
      base({ blocks: [widget(1), widget(2), widget(3), example(), checkpoint()] } as never),
    );
    expect(violations.map((v) => v.rule)).not.toContain('R16-example-without-question');
  });
});

describe('R17 — the checkpoint must ask the learner to apply', () => {
  it('fails a checkpoint made only of choices', () => {
    const choicesOnly = {
      kind: 'checkpoint' as const,
      tasks: [
        {
          prompt: 'The stock is 2% from your stop and volume has dried up. Decide: hold, cut, or add.',
          type: 'decision' as const,
          spec: { correct: 'cut' },
          explanation: 'Cutting is right because the thesis depended on participation that is no longer there.',
        },
        {
          prompt: 'Sort these four orders by how certain each one is to fill.',
          type: 'classify' as const,
          spec: {},
          explanation: 'A market order fills first and worst; a far limit may never fill at all, which is the trade-off.',
        },
      ],
    };
    const { violations } = validateLesson(
      base({ blocks: [widget(1), prose(), example(), widget(2), choicesOnly] } as never),
    );
    expect(violations.map((v) => v.rule)).toContain('R17-checkpoint-not-applied');
  });

  it('passes when at least one task has to be produced rather than picked', () => {
    const { violations } = validateLesson(base());
    expect(violations.map((v) => v.rule)).not.toContain('R17-checkpoint-not-applied');
  });
});

describe('syllabus validator', () => {
  const lesson = (id: string, tier: string, prerequisites: string[] = []) =>
    validateLesson(base({ id, tier, prerequisites } as never)).lesson;

  const stage = { id: 's', name: 'Stage', question: 'Why?', tier: 'T0', why: 'Because.', topics: [] } as never;
  const topic = (id: string, step: number, built = true) =>
    ({ id, step, built, title: id, covers: 'Something.', stage }) as never;

  it('accepts a registry that matches the road', () => {
    const road = [topic('a', 1), topic('b', 2)];
    expect(validateSyllabus([lesson('a', 'T0'), lesson('b', 'T1', ['a'])], road)).toEqual([]);
  });

  it('catches a lesson nothing links to', () => {
    const v = validateSyllabus([lesson('orphan', 'T0')], [topic('a', 1)]);
    expect(v.map((x) => x.rule)).toContain('C6-not-in-syllabus');
  });

  it('catches a topic marked built with no lesson behind it', () => {
    const v = validateSyllabus([], [topic('promised', 1)]);
    expect(v.map((x) => x.rule)).toContain('C6-syllabus-orphan');
  });

  it('says nothing about a topic that is honestly unbuilt', () => {
    expect(validateSyllabus([], [topic('later', 1, false)])).toEqual([]);
  });

  it('catches a lesson that depends on something further down the road', () => {
    const road = [topic('first', 1), topic('second', 2)];
    const v = validateSyllabus([lesson('first', 'T0', ['second']), lesson('second', 'T0')], road);
    expect(v.map((x) => x.rule)).toContain('C7-sequence-inversion');
  });
});
