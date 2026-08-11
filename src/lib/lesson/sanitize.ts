/**
 * Answer stripping.
 *
 * The lesson player is a client component, so anything handed to it as props
 * is serialised into the page payload — rendered or not. That means a reveal
 * sitting in a `predict` block is readable in view-source before the learner
 * has committed, which quietly defeats predict-then-reveal for exactly the kind
 * of learner most likely to look.
 *
 * So the server sends lessons with answers removed, and the client fetches an
 * answer from /api/lesson/reveal at the moment of commitment.
 *
 * What this DOES guarantee: the answer is not in the page, not in the RSC
 * payload, and not obtainable by scrolling, inspecting the DOM, or reading the
 * source. Casual and semi-determined peeking is closed off.
 *
 * What it does NOT guarantee: the endpoint is public and unauthenticated, so
 * someone who reads our client code can call it directly. With no accounts
 * there is no way to prevent that, and pretending otherwise would be the same
 * kind of dishonesty this whole app exists to avoid. The learner who curls the
 * answer endpoint has chosen not to learn, and no amount of engineering fixes
 * that.
 */
import type { Block, Lesson } from './dsl';

export type SanitizedLesson = Lesson;

/** Remove everything that constitutes an answer. */
export function stripAnswers(lesson: Lesson): SanitizedLesson {
  return {
    ...lesson,
    blocks: lesson.blocks.map((b): Block => {
      if (b.kind === 'predict') {
        return { ...b, reveal: '', correct: -1 };
      }
      if (b.kind === 'checkpoint') {
        return {
          ...b,
          tasks: b.tasks.map((t) => ({ ...t, explanation: '', spec: stripSpec(t.type, t.spec) })),
        };
      }
      return b;
    }),
  };
}

/**
 * Strip the answer out of a task spec while keeping what the UI must render.
 *
 * A decision task still needs its options or there is nothing to click; it does
 * not need `correct`. A classify task needs the item labels and the category
 * list; it must not ship the mapping between them. Anything not explicitly
 * allowed here is dropped — a new spec field is withheld by default rather than
 * leaked by default.
 */
export function stripSpec(type: string, spec: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case 'decision':
      return { options: spec.options ?? [] };

    case 'compute':
      return { unit: spec.unit ?? '' };

    case 'classify':
      return {
        categories: spec.categories ?? [],
        items: Array.isArray(spec.items)
          ? (spec.items as { label: string }[]).map((i) => ({ label: i.label }))
          : [],
      };

    case 'construct':
      // The brief IS the question here, so it stays. The instrument spec is
      // public market structure, not an answer.
      return {
        instrument: spec.instrument ?? {},
        lastPrice: spec.lastPrice ?? 0,
        availableCash: spec.availableCash ?? null,
        require: spec.require ?? {},
      };

    default:
      return {};
  }
}

export interface RevealPayload {
  correct: number;
  reveal: string;
}

export function revealFor(lesson: Lesson, blockIndex: number): RevealPayload | null {
  const b = lesson.blocks[blockIndex];
  if (!b || b.kind !== 'predict') return null;
  return { correct: b.correct, reveal: b.reveal };
}

export interface CheckpointAnswers {
  explanations: string[];
}

export function checkpointAnswersFor(lesson: Lesson, blockIndex: number): CheckpointAnswers | null {
  const b = lesson.blocks[blockIndex];
  if (!b || b.kind !== 'checkpoint') return null;
  return { explanations: b.tasks.map((t) => t.explanation) };
}
