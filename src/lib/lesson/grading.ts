/**
 * Checkpoint grading.
 *
 * Four task types, each graded on what the learner actually did rather than on
 * whether they typed something. The `compute` grader is the interesting one: it
 * does not hold an expected answer at all. It re-runs the cost engine against
 * the task's parameters and compares. That means a checkpoint answer can never
 * drift out of date when a statutory rate changes — the lesson, the simulator
 * and the grader all read the same source.
 *
 * All graders run SERVER-SIDE only (see /api/lesson/grade). Sending the grader
 * to the client would ship the answers with it.
 */
import { roundTripCost, computeCost } from '../engine/costs';
import { BROKER_IN_DISCOUNT, BROKER_IN_FULL_SERVICE } from '../engine/costs/india';
import type { Market, Product, Venue } from '../engine/costs/types';
import { validateOrder, type InstrumentSpec, type OrderRequest } from '../engine/order';

export type TaskType = 'decision' | 'compute' | 'construct' | 'classify';

export interface GradeResult {
  correct: boolean;
  /** 0–1. Partial credit where the task type supports it. */
  credit: number;
  /** Shown to the learner alongside the task's own explanation. */
  feedback: string;
  /** The right answer, revealed after grading. */
  expected?: string;
}

// ── decision ────────────────────────────────────────────────────────────────

export interface DecisionSpec {
  options: string[];
  correct: string;
}

export function gradeDecision(spec: DecisionSpec, answer: unknown): GradeResult {
  const picked = String(answer ?? '').trim();
  if (!picked) {
    return { correct: false, credit: 0, feedback: 'No decision recorded.', expected: spec.correct };
  }
  const correct = picked.toLowerCase() === spec.correct.toLowerCase();
  return {
    correct,
    credit: correct ? 1 : 0,
    feedback: correct
      ? 'That is the call the numbers support.'
      : `You chose "${picked}". The numbers point to "${spec.correct}".`,
    expected: spec.correct,
  };
}

// ── compute ─────────────────────────────────────────────────────────────────

/** What the grader should recompute. Extend this, never hardcode an answer. */
export type ComputeMetric =
  /**
   * A plain arithmetic answer that does not come from the cost engine — e.g.
   * position sizing. `value` holds it. Used sparingly: anything the engine can
   * derive should be derived, so it cannot drift out of date.
   */
  | 'literal'
  | 'roundTripCostPercent'
  | 'roundTripCostAmount'
  | 'breakevenPercent'
  | 'legCostAmount'
  | 'brokerageDelta';

export interface ComputeSpec {
  metric: ComputeMetric;
  market: Market;
  venue: Venue;
  product: Product;
  price: number;
  quantity: number;
  /** Absolute tolerance, in the units of the metric. */
  tolerance: number;
  /** For 'legCostAmount'. */
  side?: 'buy' | 'sell';
  /**
   * For 'legCostAmount' on options — how the position was closed. 'exercised'
   * switches the STT base from premium to intrinsic value, which is the whole
   * point of the T5 expiry lesson, so the grader has to model it.
   */
  disposal?: 'traded' | 'exercised' | 'expired_worthless';
  intrinsicPerUnit?: number;
  /** For 'brokerageDelta' — the two plans to difference. */
  plans?: [string, string];
  /** For 'literal'. */
  value?: number;
  unit?: string;
}

const PLANS = {
  'in-discount': BROKER_IN_DISCOUNT,
  'in-full-service': BROKER_IN_FULL_SERVICE,
} as const;

/** Recompute the expected value from the live engine. No stored answers. */
export function computeExpected(spec: ComputeSpec): number {
  const base = {
    market: spec.market,
    venue: spec.venue,
    product: spec.product,
    price: spec.price,
    quantity: spec.quantity,
  } as const;

  switch (spec.metric) {
    case 'literal': {
      if (typeof spec.value !== 'number' || !Number.isFinite(spec.value)) {
        throw new Error("A 'literal' compute task needs a numeric `value` in its spec.");
      }
      return spec.value;
    }
    case 'roundTripCostPercent': {
      const rt = roundTripCost({ ...base, side: 'buy' }, spec.price);
      return (rt.total / (spec.price * spec.quantity)) * 100;
    }
    case 'roundTripCostAmount':
      return roundTripCost({ ...base, side: 'buy' }, spec.price).total;
    case 'breakevenPercent':
      return roundTripCost({ ...base, side: 'buy' }, spec.price).breakevenPercent;
    case 'legCostAmount':
      return computeCost({
        ...base,
        side: spec.side ?? 'buy',
        disposal: spec.disposal,
        intrinsicPerUnit: spec.intrinsicPerUnit,
      }).total;
    case 'brokerageDelta': {
      const [a, b] = spec.plans ?? ['in-discount', 'in-full-service'];
      const planA = PLANS[a as keyof typeof PLANS];
      const planB = PLANS[b as keyof typeof PLANS];
      if (!planA || !planB) throw new Error(`Unknown broker plan in checkpoint spec: ${a} / ${b}`);
      const costA = roundTripCost({ ...base, side: 'buy', brokerage: planA }, spec.price).total;
      const costB = roundTripCost({ ...base, side: 'buy', brokerage: planB }, spec.price).total;
      return Math.abs(costB - costA);
    }
    default:
      // Without this, an unknown metric falls through the switch and this
      // function returns undefined despite being declared `: number` — which
      // then blows up two frames away in a formatter, with a message that says
      // nothing about the actual cause. Naming the bad metric here turns a
      // baffling crash into a one-line fix.
      throw new Error(
        `Unknown compute metric "${String(spec.metric)}". Valid metrics: literal, roundTripCostPercent, ` +
          `roundTripCostAmount, breakevenPercent, legCostAmount, brokerageDelta.`,
      );
  }
}

/** Parses "0.42%", "₹1,234.56", "1234" — learners type all three. */
export function parseNumeric(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[₹$,\s%]/g, '');
  if (cleaned.length === 0) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function gradeCompute(spec: ComputeSpec, answer: unknown): GradeResult {
  const expected = computeExpected(spec);
  const given = parseNumeric(answer);
  const unit = spec.unit ? ` ${spec.unit}`.trimEnd() : spec.metric.endsWith('Percent') ? '%' : '';
  const decimals = spec.metric === 'literal' ? 0 : spec.metric.endsWith('Percent') ? 3 : 2;
  const fmt = (n: number) => `${n.toFixed(decimals)}${unit}`;

  if (given == null) {
    return {
      correct: false,
      credit: 0,
      feedback: 'That is not a number. Work the figure out — the point of this one is the arithmetic.',
      expected: fmt(expected),
    };
  }

  const diff = Math.abs(given - expected);
  if (diff <= spec.tolerance) {
    return { correct: true, credit: 1, feedback: `Correct — ${fmt(expected)}.`, expected: fmt(expected) };
  }

  // Partial credit for the right order of magnitude. Being 20% out on a cost
  // calculation still means you understand that costs are material, which is
  // the actual lesson; being 100x out means you multiplied instead of divided.
  const withinOrder = expected !== 0 && diff <= Math.abs(expected) * 0.5;
  return {
    correct: false,
    credit: withinOrder ? 0.5 : 0,
    feedback: withinOrder
      ? `Close — you said ${fmt(given)}, it is ${fmt(expected)}. Right ballpark, so check which charge you missed.`
      : `You said ${fmt(given)}; it is ${fmt(expected)}. That gap usually means a whole charge was left out, or a percentage was applied to the wrong base.`,
    expected: fmt(expected),
  };
}

// ── classify ────────────────────────────────────────────────────────────────

export interface ClassifySpec {
  categories: string[];
  items: { label: string; category: string }[];
}

export function gradeClassify(spec: ClassifySpec, answer: unknown): GradeResult {
  const given = (answer ?? {}) as Record<string, string>;
  const right = spec.items.filter((i) => (given[i.label] ?? '').toLowerCase() === i.category.toLowerCase());
  const credit = spec.items.length === 0 ? 0 : right.length / spec.items.length;
  const wrong = spec.items.filter((i) => !right.includes(i));

  return {
    correct: credit === 1,
    credit,
    feedback:
      credit === 1
        ? 'Every one placed correctly.'
        : `${right.length} of ${spec.items.length} correct. Misplaced: ${wrong.map((w) => `${w.label} → ${w.category}`).join(', ')}.`,
  };
}

// ── construct ───────────────────────────────────────────────────────────────

/**
 * The learner builds an order that must satisfy stated constraints. Graded by
 * running the real order validator plus the task's own requirements — so a
 * "correct" answer here is one the exchange would actually accept.
 */
export interface ConstructSpec {
  instrument: InstrumentSpec;
  lastPrice: number;
  availableCash?: number;
  require: {
    side?: 'buy' | 'sell';
    type?: OrderRequest['type'];
    /** Trigger must sit within this band, inclusive. */
    triggerBetween?: [number, number];
    /** Risk per unit (entry to trigger) must not exceed this. */
    maxRiskPerUnit?: number;
    minQuantity?: number;
  };
}

export function gradeConstruct(spec: ConstructSpec, answer: unknown): GradeResult {
  const a = (answer ?? {}) as Partial<OrderRequest>;

  const order: OrderRequest = {
    id: 'checkpoint',
    symbol: spec.instrument.symbol,
    side: a.side ?? 'buy',
    quantity: Number(a.quantity ?? 0),
    type: a.type ?? 'MARKET',
    product: a.product ?? 'intraday',
    limitPrice: a.limitPrice != null ? Number(a.limitPrice) : undefined,
    triggerPrice: a.triggerPrice != null ? Number(a.triggerPrice) : undefined,
    validity: a.validity ?? 'DAY',
    placedAt: 0,
  };

  const validation = validateOrder(order, spec.instrument, {
    lastPrice: spec.lastPrice,
    availableCash: spec.availableCash,
  });

  if (!validation.ok) {
    return {
      correct: false,
      credit: 0,
      feedback: `The exchange would reject this order. ${validation.reason}${validation.hint ? ` ${validation.hint}` : ''}`,
    };
  }

  const failures: string[] = [];
  const r = spec.require;

  if (r.side && order.side !== r.side) failures.push(`the task asked for a ${r.side} order`);
  if (r.type && order.type !== r.type) {
    failures.push(`the task asked for a ${r.type} order, not ${order.type}`);
  }
  if (r.minQuantity && order.quantity < r.minQuantity) {
    failures.push(`quantity must be at least ${r.minQuantity}`);
  }
  if (r.triggerBetween) {
    const [lo, hi] = r.triggerBetween;
    if (order.triggerPrice == null || order.triggerPrice < lo || order.triggerPrice > hi) {
      failures.push(`the trigger must sit between ${lo} and ${hi}`);
    }
  }
  if (r.maxRiskPerUnit != null && order.triggerPrice != null) {
    const risk = Math.abs(spec.lastPrice - order.triggerPrice);
    if (risk > r.maxRiskPerUnit) {
      failures.push(`risk per unit is ${risk.toFixed(2)}, above the ${r.maxRiskPerUnit} the task allowed`);
    }
  }

  if (failures.length === 0) {
    return { correct: true, credit: 1, feedback: 'Valid, and it meets every constraint. The exchange would accept it.' };
  }

  // A structurally valid order that misses a constraint is worth something —
  // the learner has understood order mechanics but not the risk brief.
  return {
    correct: false,
    credit: 0.4,
    feedback: `The order is structurally valid, but ${failures.join('; ')}.`,
  };
}

// ── entry point ─────────────────────────────────────────────────────────────

export function gradeTask(type: TaskType, spec: Record<string, unknown>, answer: unknown): GradeResult {
  switch (type) {
    case 'decision':
      return gradeDecision(spec as unknown as DecisionSpec, answer);
    case 'compute':
      return gradeCompute(spec as unknown as ComputeSpec, answer);
    case 'classify':
      return gradeClassify(spec as unknown as ClassifySpec, answer);
    case 'construct':
      return gradeConstruct(spec as unknown as ConstructSpec, answer);
  }
}

export interface CheckpointGrade {
  score: number;
  results: GradeResult[];
}

export function gradeCheckpoint(
  tasks: { type: TaskType; spec: Record<string, unknown> }[],
  answers: unknown[],
): CheckpointGrade {
  const results = tasks.map((t, i) => {
    try {
      return gradeTask(t.type, t.spec, answers[i]);
    } catch (err) {
      // A broken spec must not cost the learner marks. It is our bug.
      return {
        correct: false,
        credit: 0,
        feedback: `This task could not be graded: ${err instanceof Error ? err.message : 'unknown error'}. Reported as a content bug, not counted against you.`,
      } satisfies GradeResult;
    }
  });

  const gradable = results.length;
  const score = gradable === 0 ? 0 : Math.round((results.reduce((s, r) => s + r.credit, 0) / gradable) * 100);
  return { score, results };
}
