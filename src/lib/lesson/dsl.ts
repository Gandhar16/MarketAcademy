/**
 * The lesson DSL.
 *
 * PLAN.md P1 says passive text is the core failure of every incumbent, and §7.6
 * says "interactive by construction, enforced by the lesson validator in CI".
 * This file is where that promise becomes a type and a schema rather than a
 * good intention. A lesson that is secretly a blog post FAILS TO BUILD.
 *
 * The rules the validator enforces are listed on `validateLesson` in
 * ./validator.ts. The important design decision here is that interactivity is
 * not a property an author asserts — it is derived from the block types used.
 */
import { z } from 'zod';

// ── Blocks ──────────────────────────────────────────────────────────────────

const proseBlock = z.object({
  kind: z.literal('prose'),
  /** Markdown. Deliberately capped — see validator rule R2. */
  md: z.string().min(1).max(1200),
});

const calloutBlock = z.object({
  kind: z.literal('callout'),
  tone: z.enum(['insight', 'warning', 'myth', 'cost']),
  title: z.string().min(1).max(120),
  md: z.string().min(1).max(800),
});

/**
 * A manipulable widget. `component` names a registered React component in
 * src/components/widgets; `props` is passed through and validated by that
 * component's own schema at registration time.
 */
const widgetBlock = z.object({
  kind: z.literal('widget'),
  component: z.string().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
  /** What the learner is meant to notice. Required — a widget with no point is decoration. */
  takeaway: z.string().min(10).max(300),
});

/**
 * Predict-then-reveal. The answer to pain point P2: the learner must COMMIT to
 * a judgement before seeing the outcome. The outcome is only sent to the client
 * after a commitment is recorded, so peeking at the DOM does not help.
 */
const predictBlock = z.object({
  kind: z.literal('predict'),
  prompt: z.string().min(10).max(400),
  /** What the learner is choosing between. 2–5 options keeps it a judgement, not a lottery. */
  options: z.array(z.string().min(1).max(160)).min(2).max(5),
  /** Index into `options`. */
  correct: z.number().int().min(0),
  /** Shown after commitment, whether right or wrong. This is where the teaching happens. */
  reveal: z.string().min(20).max(1500),
  /**
   * Scored on judgement, not recall. A `reasoning` prompt asks the learner WHY
   * before revealing — self-explanation is the single best-evidenced study
   * technique and costs us one textarea.
   */
  askWhy: z.boolean().default(false),
});

/**
 * A live or replayed chart the learner acts on. `dataset` is either a bundled
 * snapshot id (deterministic, offline-safe) or a live symbol.
 */
const chartBlock = z.object({
  kind: z.literal('chart'),
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('snapshot'), snapshotId: z.string().min(1) }),
    z.object({
      type: z.literal('live'),
      symbol: z.string().min(1),
      interval: z.enum(['1m', '5m', '15m', '1h', '1d', '1wk', '1mo']),
      range: z.string().min(1),
    }),
  ]),
  mode: z.enum(['view', 'replay', 'annotate']),
  takeaway: z.string().min(10).max(300),
});

/** A short embedded run of one of the games from PLAN.md §5. */
const gameBlock = z.object({
  kind: z.literal('game'),
  game: z.string().min(1),
  config: z.record(z.string(), z.unknown()).default({}),
  /** Score the learner must reach for the lesson checkpoint to pass. */
  passScore: z.number().min(0).max(100).optional(),
});

/** The graded end-of-lesson checkpoint. Exactly one per lesson. */
const checkpointBlock = z.object({
  kind: z.literal('checkpoint'),
  /** Must be a decision or a construction, never a definition-recall question. */
  tasks: z
    .array(
      z.object({
        prompt: z.string().min(10).max(400),
        type: z.enum(['decision', 'compute', 'construct', 'classify']),
        /** Free-form; interpreted by the task runner for that type. */
        spec: z.record(z.string(), z.unknown()),
        explanation: z.string().min(20).max(1200),
      }),
    )
    .min(1)
    .max(6),
});

/**
 * A worked example: a concrete situation taken apart step by step, with real
 * numbers.
 *
 * This exists because explaining a concept and DEMONSTRATING it are different
 * things, and almost every course does only the first. A step whose `compute`
 * field is set has its value produced by an engine at render time rather than
 * typed by the author — so a worked example can never quietly drift out of date
 * when a statutory rate changes.
 */
const exampleBlock = z.object({
  kind: z.literal('example'),
  title: z.string().min(4).max(120),
  /** The concrete situation. Specific names and numbers, never "suppose a stock". */
  setup: z.string().min(20).max(600),
  steps: z
    .array(
      z.object({
        label: z.string().min(3).max(120),
        /** Shown as the working. Supports the same mini-markdown as prose. */
        detail: z.string().min(5).max(500),
        /** Literal value to display, e.g. "₹1,40,000". Ignored when `compute` is set. */
        value: z.string().max(80).optional(),
        /** Engine-computed value. See `src/lib/lesson/examples.ts` for the vocabulary. */
        compute: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(2)
    .max(8),
  /** The one sentence a learner should carry away. */
  conclusion: z.string().min(20).max(400),
});

/**
 * A diagram. `figure` names a registered inline-SVG illustration.
 *
 * Diagrams are drawn in code rather than shipped as images: they inherit the
 * theme, scale to any width, stay legible on a phone, and add nothing to the
 * asset budget. Several of them are also manipulable, which a PNG never is.
 */
const figureBlock = z.object({
  kind: z.literal('figure'),
  figure: z.string().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
  caption: z.string().min(10).max(300),
});

export const blockSchema = z.discriminatedUnion('kind', [
  proseBlock,
  calloutBlock,
  widgetBlock,
  exampleBlock,
  figureBlock,
  predictBlock,
  chartBlock,
  gameBlock,
  checkpointBlock,
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockKind = Block['kind'];

/** Block kinds that require the learner to DO something. */
/**
 * Block kinds that require the learner to DO something.
 *
 * `example` and `figure` are deliberately NOT here. A worked example is read,
 * and a diagram is looked at — both are enormously better than prose, and
 * neither is interaction. Counting them as interactive would let a lesson
 * satisfy rule R1 without the learner ever touching anything, which is exactly
 * the loophole the rule exists to close.
 */
export const INTERACTIVE_KINDS: BlockKind[] = ['widget', 'predict', 'chart', 'game', 'checkpoint'];

/**
 * Blocks that are passive but still carry their weight. The consecutive-prose
 * rule (R2) treats these more generously than raw prose, because a diagram
 * between two paragraphs genuinely does break up a wall of text.
 */
export const SUPPORTING_KINDS: BlockKind[] = ['example', 'figure'];

export function isSupporting(block: Block): boolean {
  return SUPPORTING_KINDS.includes(block.kind);
}

export function isInteractive(block: Block): boolean {
  return INTERACTIVE_KINDS.includes(block.kind);
}

// ── Lesson ──────────────────────────────────────────────────────────────────

export const TIERS = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  T0: 'Foundations',
  T1: 'Beginner',
  T2: 'Intermediate',
  T3: 'Advanced',
  T4: 'Pro',
  T5: 'Edge Cases',
};

export const lessonSchema = z.object({
  /** Stable id, used in URLs and in the progress store. Never renumber these. */
  id: z.string().regex(/^[a-z0-9-]+$/, 'Lesson ids are lowercase kebab-case'),
  tier: z.enum(TIERS),
  market: z.enum(['IN', 'US', 'BOTH']),
  title: z.string().min(4).max(90),
  /** One sentence. Shown on the curriculum map. */
  summary: z.string().min(20).max(240),
  /**
   * What the learner will be able to DO afterwards. Phrased as capabilities,
   * not topics: "size a position from a stop distance", not "position sizing".
   */
  objectives: z.array(z.string().min(10).max(160)).min(1).max(5),
  /** Lesson ids that must be completed first. Validated to exist and be acyclic. */
  prerequisites: z.array(z.string()).default([]),
  /** Honest estimate in minutes. §3 targets 8–15. */
  estimatedMinutes: z.number().int().min(3).max(40),
  /** Skills this lesson contributes mastery toward. Drives spaced repetition. */
  skills: z.array(z.string().min(2)).min(1).max(6),
  /**
   * Glossary ids this lesson actually TEACHES, as opposed to merely mentions.
   *
   * Declaring a term here does two things: it satisfies validator rule C5 for
   * this lesson and every lesson downstream of it, and it puts the lesson in
   * the "taught in" list on the glossary page. Mentioning a term is free;
   * claiming to teach one is a promise the curriculum graph then relies on.
   */
  introduces: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
  /**
   * The lesson in one sentence, for someone who does not yet know why they
   * should care. `summary` sells the lesson to a learner browsing the map;
   * this explains it to a beginner who is not sure they are in the right place.
   */
  plainSummary: z.string().min(20).max(280).optional(),
  blocks: z.array(blockSchema).min(3).max(24),
});

export type Lesson = z.infer<typeof lessonSchema>;

/** Convenience for authors: parse and throw with a readable message. */
export function parseLesson(input: unknown): Lesson {
  const r = lessonSchema.safeParse(input);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Lesson failed schema validation:\n${issues}`);
  }
  return r.data;
}
