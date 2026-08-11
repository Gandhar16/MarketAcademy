/**
 * The lesson validator — the enforcement arm of PLAN.md §7.6.
 *
 * Schema validation (dsl.ts) checks that a lesson is well-formed. This file
 * checks that it is actually a LESSON and not a blog post wearing one as a
 * costume. It runs in CI; a violation fails the build.
 *
 * Every rule here exists because some real course fails it.
 */
import { isInteractive, isSupporting, parseLesson, type Block, type Lesson } from './dsl';
import { blockText, mentionsTerm, undefinedTerms } from './jargon';
import {
  LONG_SENTENCE_WORDS,
  TARGET_GRADE,
  readability,
  splitSentences,
  splitWords,
  verdict,
} from './readability';
import { ASSUMED_VOCABULARY, GLOSSARY_LOOKUP } from '@/content/glossary';
import { SEQUENCE, type SequencedTopic } from '@/content/syllabus';

/**
 * Glossary spellings, lowercased. Gunning fog excludes "familiar jargon" from
 * its complex-word count, and on this site a glossary term genuinely is
 * familiar — it carries its own definition one tap away.
 */
const FAMILIAR_WORDS = new Set(GLOSSARY_LOOKUP.map((g) => g.phrase.toLowerCase()));

export interface Violation {
  rule: string;
  lessonId: string;
  message: string;
  /** Index into lesson.blocks, where the rule is block-scoped. */
  blockIndex?: number;
}

/** The minimum fraction of blocks that must require the learner to act. */
export const MIN_INTERACTIVE_RATIO = 0.6;
/** The maximum number of prose/callout blocks that may appear back to back. */
export const MAX_CONSECUTIVE_PASSIVE = 2;
/** The hard ceiling on raw prose and callouts as a share of the whole lesson. */
export const MAX_TEXT_SHARE = 0.35;
/** How far after a worked example the question about it may appear. See R16. */
export const EXAMPLE_QUESTION_GAP = 3;

export function validateLesson(input: unknown): { lesson: Lesson; violations: Violation[] } {
  const lesson = parseLesson(input);
  const violations: Violation[] = [];
  const v = (rule: string, message: string, blockIndex?: number) =>
    violations.push({ rule, lessonId: lesson.id, message, blockIndex });

  const blocks = lesson.blocks;

  // R1 — interaction must dominate TEXT.
  //
  // The denominator is deliberately interactive + text, NOT every block. The
  // failure this rule exists to prevent is passive reading, and a worked
  // example or a diagram is not that — those are the things that make a
  // concept land. Counting them against an author would punish exactly the
  // behaviour we want and push lessons back toward prose.
  //
  // R12 below then caps raw text independently, so the two rules together say:
  // interaction beats text, and text is a minority of the lesson either way.
  const interactive = blocks.filter(isInteractive).length;
  const textual = blocks.filter((b) => !isInteractive(b) && !isSupporting(b)).length;
  const weighed = interactive + textual;
  const ratio = weighed === 0 ? 1 : interactive / weighed;
  if (ratio < MIN_INTERACTIVE_RATIO) {
    v(
      'R1-interactive-ratio',
      `Interaction is only ${Math.round(ratio * 100)}% of the interaction-plus-text in this lesson ` +
        `(${interactive} interactive against ${textual} prose/callout). The floor is ` +
        `${Math.round(MIN_INTERACTIVE_RATIO * 100)}%. Replace a paragraph with a widget the learner can manipulate, ` +
        `or a predict-then-reveal that makes them commit.`,
    );
  }

  // R12 — raw text can never be more than a third of a lesson, whatever the
  // interactive count is. This is the hard cap on wall-of-text.
  const textShare = textual / blocks.length;
  if (textShare > MAX_TEXT_SHARE) {
    v(
      'R12-text-heavy',
      `${Math.round(textShare * 100)}% of this lesson is prose or callouts (${textual}/${blocks.length}). ` +
        `The ceiling is ${Math.round(MAX_TEXT_SHARE * 100)}%. Turn a paragraph into a worked example or a diagram.`,
    );
  }

  // R2 — no more than two passive blocks in a row.
  //
  // A worked example or a diagram resets the counter alongside interactive
  // blocks. They are not interaction, but they genuinely do break up a wall of
  // text — and penalising an author for illustrating a point would push the
  // lesson back toward the prose this rule exists to prevent.
  let run = 0;
  blocks.forEach((b, i) => {
    if (isInteractive(b) || isSupporting(b)) {
      run = 0;
      return;
    }
    run += 1;
    if (run === MAX_CONSECUTIVE_PASSIVE + 1) {
      v(
        'R2-consecutive-prose',
        `${run} passive blocks in a row ending here. After ${MAX_CONSECUTIVE_PASSIVE}, the learner has stopped ` +
          `reading and started scrolling. Break it with something they can touch.`,
        i,
      );
    }
  });

  // R3 — exactly one checkpoint, and it must be last.
  const checkpoints = blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.kind === 'checkpoint');
  if (checkpoints.length === 0) {
    v('R3-checkpoint', 'Lesson has no checkpoint. An ungraded lesson gives the learner no way to know if they understood it.');
  } else if (checkpoints.length > 1) {
    v('R3-checkpoint', `Lesson has ${checkpoints.length} checkpoints. There must be exactly one.`);
  } else if (checkpoints[0].i !== blocks.length - 1) {
    v('R3-checkpoint', 'The checkpoint must be the final block.', checkpoints[0].i);
  }

  // R4 — the lesson must open with something other than a wall of prose.
  // The first screen decides whether the learner stays.
  if (blocks[0] && blocks[0].kind === 'prose' && blocks[1] && blocks[1].kind === 'prose') {
    v('R4-cold-open', 'The lesson opens with two prose blocks. Open with a widget, a chart, or a prediction instead.', 0);
  }

  // R5 — every widget and chart must state its takeaway. (Schema enforces
  // presence; this catches placeholder text that technically satisfies it.)
  blocks.forEach((b, i) => {
    const text = 'takeaway' in b ? b.takeaway : 'caption' in b ? b.caption : null;
    if (text && /^(tbd|todo|placeholder|xxx)/i.test(text.trim())) {
      v('R5-placeholder', `Placeholder text: "${text}".`, i);
    }
  });

  // R6 — predict blocks must have a `correct` index that exists.
  blocks.forEach((b, i) => {
    if (b.kind !== 'predict') return;
    if (b.correct >= b.options.length) {
      v('R6-predict-index', `correct index ${b.correct} is out of range for ${b.options.length} options.`, i);
    }
    if (b.reveal.length < 60) {
      v(
        'R6-predict-reveal',
        'The reveal is too short to teach anything. Explain WHY the other options are wrong, not just which one is right.',
        i,
      );
    }
  });

  // R7 — checkpoint tasks must demand judgement, not recall. A task whose
  // prompt begins "What is..." or "Define..." is a vocabulary quiz, which is
  // pain point P2 in a different hat.
  blocks.forEach((b, i) => {
    if (b.kind !== 'checkpoint') return;
    b.tasks.forEach((t, ti) => {
      if (/^\s*(what is|what are|define|which of the following best describes)\b/i.test(t.prompt)) {
        v(
          'R7-recall-question',
          `Checkpoint task ${ti + 1} is a recall question ("${t.prompt.slice(0, 60)}…"). ` +
            `Ask the learner to DECIDE or COMPUTE something instead.`,
          i,
        );
      }
    });
  });

  // R10 — every lesson must contain at least one worked example.
  //
  // Explaining a concept and demonstrating it on concrete numbers are different
  // acts, and the second is the one learners remember. This is the rule that
  // makes "with examples" structural rather than a good intention.
  if (!blocks.some((b) => b.kind === 'example')) {
    v(
      'R10-no-worked-example',
      'Lesson has no worked example. Every concept needs at least one concrete, numbered walkthrough with real ' +
        'numbers — an explanation on its own is the thing learners nod along to and cannot reproduce.',
    );
  }

  // R16 — an example must be followed by a question about it.
  //
  // R10 already forces a worked example to exist. This is the other half, and
  // it is the half that decides whether anything was learnt: a walkthrough the
  // learner reads and nods along to produces the fluency illusion — the feeling
  // of understanding that comes from watching someone else do it. The only way
  // to find out whether it transferred is to ask them to do the next one.
  //
  // So every example must be followed within EXAMPLE_QUESTION_GAP blocks by
  // something that demands an answer. Close enough that the numbers are still
  // on screen; the gap allows one paragraph of framing in between, not a
  // detour through the rest of the lesson.
  blocks.forEach((b, i) => {
    if (b.kind !== 'example') return;
    const window = blocks.slice(i + 1, i + 1 + EXAMPLE_QUESTION_GAP);
    if (!window.some((w) => w.kind === 'predict' || w.kind === 'checkpoint')) {
      v(
        'R16-example-without-question',
        `The worked example "${b.title}" is never tested. Follow it within ${EXAMPLE_QUESTION_GAP} blocks with a ` +
          `predict-then-reveal that changes one number and asks the learner to work it out themselves. ` +
          `Reading a solution feels like understanding it; producing one is the only proof.`,
        i,
      );
    }
  });

  // R17 — the checkpoint must ask the learner to APPLY, not only to choose.
  //
  // A checkpoint made entirely of `decision` and `classify` tasks can be passed
  // by recognising the right-looking answer. At least one task has to make them
  // produce something — a number they computed or a structure they built —
  // because that is the difference between "I follow this" and "I can do this".
  blocks.forEach((b, i) => {
    if (b.kind !== 'checkpoint') return;
    if (!b.tasks.some((t) => t.type === 'compute' || t.type === 'construct')) {
      v(
        'R17-checkpoint-not-applied',
        'Every checkpoint task here is a choice between options. Add at least one `compute` or `construct` task, ' +
          'so passing requires producing an answer rather than recognising one.',
        i,
      );
    }
  });

  // R13 — every lesson needs a plain-language summary.
  //
  // The audit that produced this rule found lessons whose `summary` was written
  // in the vocabulary of someone who already understood the topic — perfectly
  // clear to the author, and no help at all to the person deciding whether they
  // are in the right place. A learner should never have to already know the
  // subject to find out whether a lesson is for them.
  if (!lesson.plainSummary) {
    v(
      'R13-no-plain-summary',
      'Lesson has no `plainSummary`. Write one sentence a complete beginner can read: what they will be able to ' +
        'do afterwards, with no jargon in it at all.',
    );
  } else {
    // A lesson may name the thing it teaches — the options lesson has to be
    // allowed to say "option". What it may not do is lean on vocabulary it
    // never explains.
    const allowed = new Set<string>([...ASSUMED_VOCABULARY, ...lesson.introduces]);
    const jargon = GLOSSARY_LOOKUP.filter((g) => !allowed.has(g.id)).filter((g) =>
      mentionsTerm(lesson.plainSummary!, g.phrase),
    );

    if (jargon.length > 0) {
      v(
        'R13-plain-summary-jargon',
        `The plain summary uses ${jargon.map((j) => `"${j.phrase}"`).join(', ')}. ` +
          `This one sentence is the only part of the lesson a beginner reads before deciding to leave, so it is the ` +
          `one place jargon is not allowed at all.`,
      );
    }
  }

  // R14 / R15 — readability.
  //
  // The audit that produced these found something more useful than "the lessons
  // are too hard". The AVERAGES were already fine — grade 4.9 to 8.1 across all
  // eleven lessons, every one inside the plain-English band. What was wrong was
  // the TAIL: 38 sentences of 32 words or more, the worst of them 62 words.
  //
  // That distinction matters, because a beginner does not drown in the average.
  // They drown in the one sentence that lists six statutory charges with three
  // subordinate clauses, give up there, and never reach the good paragraph
  // after it. So R15 polices individual sentences and R14 merely holds the
  // average where it already is.
  //
  // Glossary terms are passed as `familiar`, which is what the Gunning fog
  // definition means by familiar jargon — and is honest here, because a term
  // on this site carries its own definition on the page.
  const lessonText = blocks.map(blockText).filter(Boolean).join('\n\n');
  const stats = readability(lessonText, FAMILIAR_WORDS);

  if (stats.fleschKincaidGrade > TARGET_GRADE) {
    v(
      'R14-reading-level',
      `Reads at grade ${stats.fleschKincaidGrade.toFixed(1)} (${verdict(stats)}); the ceiling is ${TARGET_GRADE}. ` +
        `Average sentence is ${stats.wordsPerSentence.toFixed(1)} words. Shorten sentences before reaching for ` +
        `shorter words — sentence length is the bigger lever and the one a reader actually feels.`,
    );
  }

  blocks.forEach((b, i) => {
    for (const sentence of splitSentences(blockText(b))) {
      const n = splitWords(sentence).length;
      if (n < LONG_SENTENCE_WORDS) continue;
      v(
        'R15-long-sentence',
        `A ${n}-word sentence. The cap is ${LONG_SENTENCE_WORDS}. Split it at the first "and", ";" or "—": ` +
          `"${sentence.slice(0, 70)}…"`,
        i,
      );
    }
  });

  // R11 — example steps must show their working, not just an answer.
  blocks.forEach((b, i) => {
    if (b.kind !== 'example') return;
    const bare = b.steps.filter((s) => s.value == null && s.compute == null);
    if (bare.length === b.steps.length) {
      v('R11-example-no-values', 'No step in this example produces a value. A worked example needs numbers.', i);
    }
  });

  // R8 — declared skills must be referenced by the content in some way. A skill
  // tag nobody teaches corrupts the mastery-decay model downstream.
  if (lesson.skills.length > lesson.objectives.length + 2) {
    v(
      'R8-skill-inflation',
      `${lesson.skills.length} skills declared against ${lesson.objectives.length} objectives. ` +
        `Over-tagging inflates mastery scores for things the lesson never actually taught.`,
    );
  }

  // R9 — estimated time must be plausible for the block count. Roughly one
  // minute per passive block and two per interactive one.
  const expected = blocks.reduce((m, b) => m + (isInteractive(b) ? 2 : isSupporting(b) ? 1.5 : 1), 0);
  if (lesson.estimatedMinutes < expected * 0.5 || lesson.estimatedMinutes > expected * 2.5) {
    v(
      'R9-time-estimate',
      `estimatedMinutes is ${lesson.estimatedMinutes} but the block mix suggests roughly ${expected}. ` +
        `A wrong estimate breaks the learner's trust on the very first lesson.`,
    );
  }

  return { lesson, violations };
}

/**
 * Whole-curriculum checks that a single lesson cannot see: unique ids, valid
 * prerequisites, and no cycles.
 */
export function validateCurriculum(lessons: Lesson[]): Violation[] {
  const violations: Violation[] = [];
  const byId = new Map<string, Lesson>();

  for (const l of lessons) {
    if (byId.has(l.id)) {
      violations.push({ rule: 'C1-duplicate-id', lessonId: l.id, message: `Duplicate lesson id "${l.id}".` });
    }
    byId.set(l.id, l);
  }

  for (const l of lessons) {
    for (const p of l.prerequisites) {
      if (!byId.has(p)) {
        violations.push({
          rule: 'C2-missing-prerequisite',
          lessonId: l.id,
          message: `Prerequisite "${p}" does not exist.`,
        });
      }
    }
  }

  // C3 — prerequisite graph must be acyclic, else the learner can never start.
  const state = new Map<string, 'visiting' | 'done'>();
  const walk = (id: string, trail: string[]): void => {
    const s = state.get(id);
    if (s === 'done') return;
    if (s === 'visiting') {
      violations.push({
        rule: 'C3-prerequisite-cycle',
        lessonId: id,
        message: `Prerequisite cycle: ${[...trail, id].join(' → ')}.`,
      });
      return;
    }
    state.set(id, 'visiting');
    for (const p of byId.get(id)?.prerequisites ?? []) walk(p, [...trail, id]);
    state.set(id, 'done');
  };
  for (const l of lessons) walk(l.id, []);

  // C4 — a lesson must not require a prerequisite from a higher tier.
  const tierIndex = (t: string) => Number(t.slice(1));
  for (const l of lessons) {
    for (const p of l.prerequisites) {
      const pre = byId.get(p);
      if (pre && tierIndex(pre.tier) > tierIndex(l.tier)) {
        violations.push({
          rule: 'C4-tier-inversion',
          lessonId: l.id,
          message: `${l.id} (${l.tier}) requires ${p} from the higher tier ${pre.tier}.`,
        });
      }
    }
  }

  // C5 — a lesson must not lean on vocabulary from a later tier.
  //
  // This is the rule the jargon audit produced. Auto-linking (annotate.ts)
  // handles the ordinary case: an unfamiliar word gets a dotted underline and a
  // definition on tap. What auto-linking cannot fix is a T1 lesson whose
  // ARGUMENT depends on lot sizes and margin — a popup does not rescue a
  // beginner from a paragraph they were never equipped to follow, it just tells
  // them how far behind they are.
  //
  // The fix is one of: reword to avoid the term, declare it in `introduces` and
  // actually teach it, or move the lesson to a later tier.
  for (const l of lessons) {
    const rank = tierIndex(l.tier);
    for (const u of undefinedTerms(l, byId)) {
      const termTier = u.entry.tier;
      if (!termTier || tierIndex(termTier) <= rank) continue;
      violations.push({
        rule: 'C5-jargon-ahead-of-tier',
        lessonId: l.id,
        blockIndex: u.blockIndex,
        message:
          `Uses "${u.phrase}" (${u.term}, a ${termTier} term) in a ${l.tier} lesson without teaching it. ` +
          `Reword it, add "${u.id}" to \`introduces\` and explain it, or move the lesson later.`,
      });
    }
  }

  return violations;
}

/**
 * Checks the shipped lessons against the SYLLABUS — the one ordered road a
 * learner actually navigates (src/content/syllabus.ts).
 *
 * Deliberately separate from validateCurriculum. That function judges a set of
 * lessons against each other and nothing else, which is what lets it be tested
 * with three synthetic ones. This function necessarily compares against a
 * global document, so it takes that document as an argument with the real one
 * as the default: a check that silently reads a module-level constant is a
 * check nothing else can be tested around.
 */
export function validateSyllabus(lessons: Lesson[], sequence: readonly SequencedTopic[] = SEQUENCE): Violation[] {
  const violations: Violation[] = [];
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const bySlug = new Map(sequence.map((t) => [t.id, t]));

  // C6 — the syllabus and the registry must agree, in both directions.
  //
  // A lesson that exists but is not on the road is unreachable except by URL,
  // and a topic flagged `built` with no lesson behind it is a link to nowhere.
  // Neither should be something a learner discovers by clicking on it.
  for (const l of lessons) {
    if (!bySlug.has(l.id)) {
      violations.push({
        rule: 'C6-not-in-syllabus',
        lessonId: l.id,
        message:
          `"${l.id}" is registered but does not appear in src/content/syllabus.ts, so nothing links to it. ` +
          `Add it to the stage it belongs in — the syllabus decides the order, not the registry.`,
      });
    }
  }
  for (const t of sequence) {
    if (t.built && !byId.has(t.id)) {
      violations.push({
        rule: 'C6-syllabus-orphan',
        lessonId: t.id,
        message: `Syllabus step ${t.step} ("${t.title}") is marked built, but no lesson with that id is registered.`,
      });
    }
  }

  // C7 — the sequence must be honest about dependencies.
  //
  // C4 already stops a lesson requiring a higher TIER. This is the finer
  // version: within the one linear road, a prerequisite must come earlier. A
  // learner working straight down it should never arrive at a lesson whose
  // stated prerequisite is forty steps further on.
  for (const l of lessons) {
    const here = bySlug.get(l.id);
    if (!here) continue;
    for (const p of l.prerequisites) {
      const pre = bySlug.get(p);
      if (pre && pre.step > here.step) {
        violations.push({
          rule: 'C7-sequence-inversion',
          lessonId: l.id,
          message:
            `Step ${here.step} requires "${p}", which is step ${pre.step} — later in the course. ` +
            `Move one of them, or drop the prerequisite.`,
        });
      }
    }
  }

  return violations;
}

export function formatViolations(violations: Violation[]): string {
  if (violations.length === 0) return 'All lessons pass validation.';
  return violations
    .map((v) => `${v.lessonId}${v.blockIndex != null ? ` [block ${v.blockIndex}]` : ''} — ${v.rule}\n    ${v.message}`)
    .join('\n\n');
}

/** Exported for the CI script so block-level helpers stay in one place. */
export function countInteractive(blocks: Block[]): number {
  return blocks.filter(isInteractive).length;
}
