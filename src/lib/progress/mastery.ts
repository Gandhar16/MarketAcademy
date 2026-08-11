/**
 * Mastery, decay, and the process score.
 *
 * Two ideas here, both from PLAN.md §7.4 and P8.
 *
 * 1. MASTERY DECAYS. A skill practised once in March is not a skill you have in
 *    August. We model retention with an exponential forgetting curve whose
 *    half-life EXTENDS with each successful review — the spacing effect. This
 *    is what turns "I finished the course" into "I can still do this".
 *
 * 2. PROCESS BEATS OUTCOME. A disciplined loss scores above a reckless win.
 *    Every leaderboard in the app ranks `processScore`, never P&L. Ranking on
 *    P&L is what makes StockGro-style apps teach gambling (PLAN.md §1).
 *
 * XP for a game run is the one place the result is allowed to matter, and only
 * after four gates about the decision have already been cleared — see `runXp`
 * for why that ordering is the whole point, and why the leaderboard still does
 * not read it.
 */
import { type Mood } from './encouragement';

export interface SkillMastery {
  skill: string;
  /** Retention at the last review, 0–1. */
  strength: number;
  /** Epoch ms of the last successful practice. */
  lastReviewedAt: number;
  /** Number of successful reviews. Drives half-life extension. */
  reviews: number;
  /** Current half-life in days. */
  halfLifeDays: number;
}

/** A brand-new skill forgets fast: half of it is gone in three days. */
export const INITIAL_HALF_LIFE_DAYS = 3;
/** Each successful review multiplies the half-life. 2.2x is a middling, safe value. */
export const HALF_LIFE_GROWTH = 2.2;
/** Beyond this, further spacing gains are not worth modelling. */
export const MAX_HALF_LIFE_DAYS = 180;
/** Below this retention a skill is considered due for review. */
export const REVIEW_THRESHOLD = 0.6;

/**
 * Current retention, decayed from the last review.
 *
 * R(t) = strength x 2^(-elapsedDays / halfLife)
 */
export function currentRetention(m: SkillMastery, now = Date.now()): number {
  const elapsedDays = Math.max(0, (now - m.lastReviewedAt) / 86_400_000);
  return m.strength * Math.pow(2, -elapsedDays / m.halfLifeDays);
}

export function isDue(m: SkillMastery, now = Date.now()): boolean {
  return currentRetention(m, now) < REVIEW_THRESHOLD;
}

/** Days until this skill decays below the review threshold. */
export function daysUntilDue(m: SkillMastery, now = Date.now()): number {
  const r = currentRetention(m, now);
  if (r <= REVIEW_THRESHOLD) return 0;
  return (Math.log2(r / REVIEW_THRESHOLD) * m.halfLifeDays);
}

export function newMastery(skill: string, now = Date.now()): SkillMastery {
  return { skill, strength: 0, lastReviewedAt: now, reviews: 0, halfLifeDays: INITIAL_HALF_LIFE_DAYS };
}

/**
 * Record a practice attempt.
 *
 * A pass consolidates: strength moves toward 1 and the half-life stretches.
 * A fail does NOT reset to zero — that would punish honest attempts and push
 * learners to avoid hard material. It pulls strength down and, importantly,
 * shortens the half-life, so the skill comes back around sooner.
 */
export function review(m: SkillMastery, passed: boolean, quality = 1, now = Date.now()): SkillMastery {
  const q = Math.min(1, Math.max(0, quality));
  const decayed = currentRetention(m, now);

  if (passed) {
    return {
      ...m,
      strength: Math.min(1, decayed + (1 - decayed) * (0.5 + 0.5 * q)),
      lastReviewedAt: now,
      reviews: m.reviews + 1,
      halfLifeDays: Math.min(MAX_HALF_LIFE_DAYS, m.halfLifeDays * (1 + (HALF_LIFE_GROWTH - 1) * q)),
    };
  }

  return {
    ...m,
    strength: Math.max(0, decayed * 0.6),
    lastReviewedAt: now,
    // Failure is information: this skill needs to come back sooner than we
    // thought. Never below the initial half-life.
    halfLifeDays: Math.max(INITIAL_HALF_LIFE_DAYS, m.halfLifeDays / HALF_LIFE_GROWTH),
  };
}

// ── Process score ───────────────────────────────────────────────────────────

export interface TradeRecord {
  /** Did the learner write a thesis and a stop BEFORE entering? */
  preCommitted: boolean;
  /** Risk taken on this trade as a fraction of account equity. */
  riskFraction: number;
  /** Did they honour their own stop, or move it? */
  honouredStop: boolean;
  /** Did they exit for a reason stated in the plan, or on impulse? */
  exitedPerPlan: boolean;
  /** Realised P&L. Used ONLY for reporting — never for the process score. */
  pnl: number;
  /** Did they size the position from the stop distance, or guess? */
  sizedFromStop: boolean;
  /**
   * Planned reward-to-risk at the moment of entry:
   *
   *   (target − entry) ÷ (entry − stop)
   *
   * Null when the learner entered without a target, which is itself the
   * finding: a trade with a stop and no target has an undefined reward-to-risk,
   * so there was never a number to be right or wrong about.
   */
  plannedRR?: number | null;
  /**
   * Did this trade end because the stop was hit?
   *
   * Distinct from `honouredStop`, which asks whether the stop was left where it
   * was put. A trade can honour its stop and never reach it; a trade can reach
   * it and have the stop dragged away first. Both facts are needed, and only
   * one of them was being recorded.
   */
  stoppedOut?: boolean;
}

export interface ProcessScore {
  /** 0–100. */
  score: number;
  components: Record<string, { earned: number; possible: number; note: string }>;
  /** Populated when the learner made money doing something reckless. */
  warnings: string[];
}

/** The maximum risk per trade before the score starts penalising it. */
export const RISK_CEILING = 0.02;

/**
 * Score a set of trades on process alone.
 *
 * Note what is absent: profit. A learner who follows their plan on ten losing
 * trades scores higher than one who doubled their account on a single 40%-risk
 * punt. That inversion is the entire pedagogical point, so we also emit an
 * explicit warning when a reckless trade happened to win — otherwise the
 * learner's brain records "that worked".
 */
export function processScore(trades: TradeRecord[]): ProcessScore {
  if (trades.length === 0) {
    return { score: 0, components: {}, warnings: ['No trades recorded yet.'] };
  }

  const n = trades.length;
  const frac = (pred: (t: TradeRecord) => boolean) => trades.filter(pred).length / n;

  const weights = {
    preCommitment: 25,
    sizing: 25,
    stopDiscipline: 30,
    exitDiscipline: 20,
  };

  const riskDiscipline =
    trades.reduce((s, t) => s + Math.min(1, RISK_CEILING / Math.max(t.riskFraction, 1e-9)), 0) / n;

  const components = {
    preCommitment: {
      earned: frac((t) => t.preCommitted) * weights.preCommitment,
      possible: weights.preCommitment,
      note: 'Thesis and stop written down before entry.',
    },
    sizing: {
      earned: ((frac((t) => t.sizedFromStop) + riskDiscipline) / 2) * weights.sizing,
      possible: weights.sizing,
      note: `Position sized from the stop, and risk kept at or under ${RISK_CEILING * 100}% of equity.`,
    },
    stopDiscipline: {
      earned: frac((t) => t.honouredStop) * weights.stopDiscipline,
      possible: weights.stopDiscipline,
      note: 'Stop honoured rather than moved once it was in danger.',
    },
    exitDiscipline: {
      earned: frac((t) => t.exitedPerPlan) * weights.exitDiscipline,
      possible: weights.exitDiscipline,
      note: 'Exited for a reason that was in the plan.',
    },
  };

  const score = Object.values(components).reduce((s, c) => s + c.earned, 0);

  const warnings: string[] = [];
  const luckyRecklessness = trades.filter((t) => t.pnl > 0 && (t.riskFraction > RISK_CEILING * 3 || !t.honouredStop));
  if (luckyRecklessness.length > 0) {
    warnings.push(
      `${luckyRecklessness.length} profitable trade${luckyRecklessness.length === 1 ? '' : 's'} came from ` +
        `oversized risk or an abandoned stop. That is a losing process that happened to pay this time — ` +
        `the outcome is not evidence the decision was good.`,
    );
  }

  const disciplinedLosses = trades.filter((t) => t.pnl < 0 && t.honouredStop && t.preCommitted && t.sizedFromStop);
  if (disciplinedLosses.length > 0) {
    warnings.push(
      `${disciplinedLosses.length} losing trade${disciplinedLosses.length === 1 ? '' : 's'} followed the plan exactly. ` +
        `Those are good trades. Losses that follow a plan are the cost of doing business, not mistakes.`,
    );
  }

  return { score: Math.round(score * 10) / 10, components, warnings };
}

// ── XP and streaks ──────────────────────────────────────────────────────────

export interface Streak {
  current: number;
  longest: number;
  /** Epoch ms of the last day with activity. */
  lastActiveAt: number;
}

const dayOf = (ms: number) => Math.floor(ms / 86_400_000);

export function recordActivity(streak: Streak, now = Date.now()): Streak {
  const today = dayOf(now);
  const last = dayOf(streak.lastActiveAt);
  if (today === last) return streak;
  const current = today === last + 1 ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastActiveAt: now };
}

/**
 * XP for completing a lesson.
 *
 * Scaled by tier so advanced material is worth more, and by checkpoint score so
 * scraping a pass is not the same as mastering it. Deliberately NOT scaled by
 * simulated profit.
 */
export function lessonXp(tier: string, checkpointScore: number, firstAttempt: boolean): number {
  const tierMultiplier = 1 + Number(tier.slice(1)) * 0.35;
  const base = 100 * tierMultiplier;
  const quality = 0.5 + 0.5 * Math.min(1, Math.max(0, checkpointScore / 100));
  // A retry is worth less than a first-time pass, but never worthless — we want
  // learners to go back and get it right.
  return Math.round(base * quality * (firstAttempt ? 1 : 0.6));
}

// ── XP for a game run ───────────────────────────────────────────────────────

/**
 * XP FOR PLAYING A GAME.
 *
 * The obvious design — XP for finishing, more XP for profit — is the design
 * that teaches gambling, and it is what every "learn to trade" app with a
 * leaderboard actually ships. A learner who bets the whole account on one
 * coin-flip and wins takes the top of the board, and the lesson recorded in
 * their head is "that worked".
 *
 * So a run earns XP only if it clears three GATES, all of which are about the
 * decision rather than the result:
 *
 *   1. A written reason. The learner has to say what they were doing and why,
 *      in enough words to be a thought rather than a shrug. This is also what
 *      other players read (see `reasons` in the database), so it is the part of
 *      the system that makes reasoning public and comparable.
 *   2. A planned reward-to-risk worth taking. Entering with a stop but no
 *      target is not a plan; entering to make ₹1 while risking ₹3 is a plan
 *      that needs a 75% hit rate to break even, and nobody has one.
 *   3. No reckless sizing and no abandoned stops. One of either voids the run.
 *
 *   4. A process score of 60 or better.
 *
 * And only THEN does the result count. A fifth gate asks whether the run
 * actually paid, and the XP above the base scales with how much reward the plan
 * asked for and how cleanly it was executed.
 *
 * THE ORDER OF THOSE TWO THINGS IS THE ENTIRE DESIGN.
 *
 * A profitable run that risked a fifth of the account cannot reach the result
 * gate: `gambling` killed it three gates earlier. So the result is a multiplier
 * on a decision that has already been judged sound — never a way to buy past a
 * bad one. That is a different claim from "profit is irrelevant", and it is the
 * one this function makes.
 *
 * A losing run earns nothing and is told, in varied words, that the decision
 * may well have been right (see ./encouragement.ts). The two are not in
 * tension: XP is the reward for a well-reasoned win, and it is deliberately NOT
 * what the leaderboard ranks. Rankings read `process_score` and `lesson_xp`,
 * both outcome-blind, so PLAN.md §7 rule 4 holds exactly where it decides what
 * the product values in public.
 */
export interface RunXp {
  xp: number;
  /** Every gate, passed or failed, in words the learner can act on. */
  notes: { gate: string; passed: boolean; detail: string }[];
  /** True when the run shows the specific markers of a gamble rather than a trade. */
  gambling: boolean;
  /** Mean planned reward-to-risk across trades that had a target at all. */
  meanRR: number | null;
  /** Summary of how it went. Recorded on the run and used to pick the message. */
  outcome: RunOutcome;
  /** Which pool the encouragement should come from. Null when XP was earned. */
  mood: Mood | null;
}

export interface RunOutcome {
  netPnl: number;
  won: boolean;
  /** At least one trade ended by the stop being hit. */
  stoppedOut: boolean;
  wins: number;
  losses: number;
}

export function summariseOutcome(trades: TradeRecord[]): RunOutcome {
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  return {
    netPnl,
    won: netPnl > 0,
    stoppedOut: trades.some((t) => t.stoppedOut === true),
    wins: trades.filter((t) => t.pnl > 0).length,
    losses: trades.filter((t) => t.pnl < 0).length,
  };
}

/** Below this, the reward does not pay for the risk often enough to matter. */
export const MIN_PLANNED_RR = 1.5;
/** Enough words to be a reason. Shorter than this is "felt right" with extra letters. */
export const MIN_REASON_CHARS = 40;
/** A run must show at least this much process before any XP is on the table. */
export const MIN_PROCESS_FOR_XP = 60;
/** Risk above this multiple of RISK_CEILING is a gamble, whatever the outcome. */
export const RECKLESS_RISK_MULTIPLE = 3;
/** The most a single run can be worth: gates cleared, perfect process, 4:1 planned. */
export const MAX_RUN_XP = 200;
/** What a run is worth having merely cleared every gate and won. */
export const BASE_RUN_XP = 90;
/** Planned reward-to-risk at which the ratio bonus is fully earned. */
export const RR_BONUS_CEILING = 4;

/**
 * Mean planned reward-to-risk, over the trades that actually had a target.
 *
 * Trades with no target are excluded from the mean rather than counted as zero,
 * because they are a different failure and get their own gate below. Averaging
 * them in would let one careful 3:1 trade paper over five with no plan at all.
 */
export function meanPlannedRR(trades: TradeRecord[]): number | null {
  const rr = trades
    .map((t) => t.plannedRR)
    .filter((r): r is number => typeof r === 'number' && Number.isFinite(r) && r > 0);
  if (rr.length === 0) return null;
  return rr.reduce((a, b) => a + b, 0) / rr.length;
}

export function runXp(trades: TradeRecord[], reason: string, score = processScore(trades).score): RunXp {
  const notes: RunXp['notes'] = [];
  const n = trades.length;
  const rr = meanPlannedRR(trades);
  const outcome = summariseOutcome(trades);

  const reckless = trades.filter((t) => t.riskFraction > RISK_CEILING * RECKLESS_RISK_MULTIPLE);
  const abandoned = trades.filter((t) => !t.honouredStop);
  const untargeted = trades.filter((t) => t.plannedRR == null);
  const gambling = reckless.length > 0 || abandoned.length > 0;

  const reasonOk = reason.trim().length >= MIN_REASON_CHARS;
  notes.push({
    gate: 'A reason you can defend',
    passed: reasonOk,
    detail: reasonOk
      ? 'You wrote down what you were doing. Other learners can read it and disagree with you, which is the point.'
      : `Write at least ${MIN_REASON_CHARS} characters explaining what you were trying to do and why. ` +
        'A run with no stated reason cannot be graded on reasoning, and cannot teach anybody else anything.',
  });

  const rrOk = rr != null && rr >= MIN_PLANNED_RR && untargeted.length === 0;
  notes.push({
    gate: `Reward worth the risk (${MIN_PLANNED_RR}:1 or better)`,
    passed: rrOk,
    detail:
      untargeted.length > 0
        ? `${untargeted.length} of ${n} trades had a stop but no target, so their reward-to-risk is undefined. ` +
          'Decide where you are getting out on the good side before you enter, or you will decide it while it moves.'
        : rr == null
          ? 'No trade in this run recorded a planned reward-to-risk.'
          : rr >= MIN_PLANNED_RR
            ? `Mean planned reward-to-risk was ${rr.toFixed(2)}:1. That leaves room to be wrong more often than right.`
            : `Mean planned reward-to-risk was only ${rr.toFixed(2)}:1, so you need to win ` +
              `${Math.round((100 / (1 + rr)) * 10) / 10}% of the time just to break even before costs.`,
  });

  notes.push({
    gate: 'No gambling markers',
    passed: !gambling,
    detail: gambling
      ? [
          reckless.length > 0
            ? `${reckless.length} trade${reckless.length === 1 ? '' : 's'} risked more than ` +
              `${RISK_CEILING * RECKLESS_RISK_MULTIPLE * 100}% of equity.`
            : null,
          abandoned.length > 0
            ? `${abandoned.length} stop${abandoned.length === 1 ? ' was' : 's were'} moved or ignored once it was in danger.`
            : null,
        ]
          .filter(Boolean)
          .join(' ') + ' Either one voids the run, whether it made money or lost it.'
      : 'Risk stayed inside your budget and every stop was honoured.',
  });

  const processOk = score >= MIN_PROCESS_FOR_XP;
  notes.push({
    gate: `Process score of ${MIN_PROCESS_FOR_XP} or better`,
    passed: processOk,
    detail: `This run scored ${score.toFixed(1)} on process — pre-commitment, sizing, stops and exits.`,
  });

  const planOk = reasonOk && rrOk && !gambling && processOk && n > 0;

  // The last gate, and the one that comes LAST for a reason.
  //
  // The result is allowed to matter — but only after the plan has already
  // cleared every other bar. That ordering is the whole design. A win with a
  // 20:1 bet and no stop cannot reach this line, because `gambling` killed it
  // four gates ago; the result is a multiplier on a good decision, never a way
  // to buy your way past a bad one.
  notes.push({
    gate: 'The plan paid',
    passed: outcome.won,
    detail: outcome.won
      ? `The run finished ahead by ${Math.abs(outcome.netPnl).toFixed(0)}, on a plan that cleared every gate above.`
      : outcome.stoppedOut
        ? 'Your stop was hit and you honoured it. No XP for a losing run — and nothing here says the decision was wrong.'
        : 'The run finished behind. No XP, which is about the result and not about the reasoning.',
  });

  // Two independent bonuses on top of the base, both about the decision:
  // how cleanly the run was executed, and how much reward the plan asked for
  // against the risk it accepted. A 3:1 plan executed perfectly is worth more
  // than a 1.5:1 plan scraped through, and the numbers say so.
  const processQuality = clamp01((score - MIN_PROCESS_FOR_XP) / (100 - MIN_PROCESS_FOR_XP));
  const rrQuality = rr == null ? 0 : clamp01((rr - MIN_PLANNED_RR) / (RR_BONUS_CEILING - MIN_PLANNED_RR));
  const headroom = MAX_RUN_XP - BASE_RUN_XP;

  const earned = planOk && outcome.won;
  const xp = earned ? Math.round(BASE_RUN_XP + headroom * (0.5 * processQuality + 0.5 * rrQuality)) : 0;

  const mood: Mood | null = earned
    ? null
    : n === 0
      ? 'flat'
      : gambling
        ? 'gambled'
        : !planOk
          ? 'gates-failed'
          : outcome.stoppedOut
            ? 'stopped-out'
            : 'lost';

  return { xp, notes, gambling, meanRR: rr, outcome, mood };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
