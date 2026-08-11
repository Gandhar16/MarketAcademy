import { describe, expect, it } from 'vitest';
import {
  BASE_RUN_XP,
  MAX_RUN_XP,
  MIN_PLANNED_RR,
  MIN_PROCESS_FOR_XP,
  MIN_REASON_CHARS,
  RISK_CEILING,
  RR_BONUS_CEILING,
  meanPlannedRR,
  runXp,
  summariseOutcome,
  type TradeRecord,
} from './mastery';

const GOOD_REASON =
  'Bought the retest of the 1,400 level because the last two touches held, with the stop under the swing low.';

/** A well-run trade that PAID. The baseline for anything that should earn XP. */
function won(over: Partial<TradeRecord> = {}): TradeRecord {
  return {
    preCommitted: true,
    riskFraction: 0.01,
    honouredStop: true,
    exitedPerPlan: true,
    sizedFromStop: true,
    pnl: 2_500,
    plannedRR: 2.5,
    stoppedOut: false,
    ...over,
  };
}

/** The same decisions, stopped out. */
const stopped = (over: Partial<TradeRecord> = {}) => won({ pnl: -1_000, stoppedOut: true, ...over });

const failed = (r: ReturnType<typeof runXp>) => r.notes.filter((n) => !n.passed).map((n) => n.gate);

describe('the reward-to-risk average', () => {
  it('ignores trades that never had a target rather than scoring them zero', () => {
    // Counting them as zero would let one careful 3:1 trade paper over five
    // with no plan at all. They get their own gate instead.
    expect(meanPlannedRR([won({ plannedRR: 3 }), won({ plannedRR: null })])).toBe(3);
  });

  it('is null when nothing had a target', () => {
    expect(meanPlannedRR([won({ plannedRR: null })])).toBeNull();
    expect(meanPlannedRR([])).toBeNull();
  });

  it('rejects nonsense values instead of averaging them in', () => {
    expect(meanPlannedRR([won({ plannedRR: -2 }), won({ plannedRR: 4 })])).toBe(4);
    expect(meanPlannedRR([won({ plannedRR: Number.NaN })])).toBeNull();
  });
});

describe('summarising a run', () => {
  it('counts wins, losses and whether a stop was hit', () => {
    const o = summariseOutcome([won(), stopped(), won({ pnl: 0 })]);
    expect(o).toMatchObject({ wins: 1, losses: 1, stoppedOut: true, won: true });
    expect(o.netPnl).toBe(1_500);
  });

  it('reports a flat run as neither won nor stopped out', () => {
    expect(summariseOutcome([])).toMatchObject({ won: false, stoppedOut: false, netPnl: 0 });
  });
});

describe('the gates come before the result', () => {
  // This ordering IS the design. The result is a multiplier on a decision that
  // has already been judged sound — never a way to buy past a bad one.
  it('pays nothing for a reckless run that won big', () => {
    const gamble = won({ riskFraction: RISK_CEILING * 10, pnl: 500_000, plannedRR: 8 });
    const r = runXp([gamble], GOOD_REASON);
    expect(r.xp).toBe(0);
    expect(r.gambling).toBe(true);
    expect(r.mood).toBe('gambled');
    expect(failed(r)).toContain('No gambling markers');
  });

  it('pays nothing when a stop was abandoned, however profitable', () => {
    const r = runXp([won({ honouredStop: false, pnl: 90_000 })], GOOD_REASON);
    expect(r.xp).toBe(0);
    expect(r.mood).toBe('gambled');
  });

  it('pays nothing for a win with no stated reason', () => {
    const r = runXp([won()], 'felt right');
    expect(r.xp).toBe(0);
    expect(failed(r)).toContain('A reason you can defend');
    expect(r.mood).toBe('gates-failed');
  });

  it('counts a reason only if it is long enough to be one', () => {
    expect(runXp([won()], 'x'.repeat(MIN_REASON_CHARS - 1)).xp).toBe(0);
    expect(runXp([won()], 'x'.repeat(MIN_REASON_CHARS)).xp).toBeGreaterThan(0);
  });

  it('pays nothing for a win whose planned reward never justified the risk', () => {
    const r = runXp([won({ plannedRR: MIN_PLANNED_RR - 0.5 })], GOOD_REASON);
    expect(r.xp).toBe(0);
    expect(failed(r)).toContain(`Reward worth the risk (${MIN_PLANNED_RR}:1 or better)`);
    expect(r.notes.find((n) => n.gate.startsWith('Reward'))!.detail).toMatch(/break even/);
  });

  it('pays nothing for a win entered with a stop but no target', () => {
    const r = runXp([won({ plannedRR: null })], GOOD_REASON);
    expect(r.xp).toBe(0);
    expect(r.meanRR).toBeNull();
    expect(r.notes.find((n) => n.gate.startsWith('Reward'))!.detail).toMatch(/undefined/);
  });

  it('pays nothing below the process floor even on a win', () => {
    const r = runXp([won()], GOOD_REASON, MIN_PROCESS_FOR_XP - 0.1);
    expect(r.xp).toBe(0);
    expect(failed(r)).toContain(`Process score of ${MIN_PROCESS_FOR_XP} or better`);
  });
});

describe('the result gate', () => {
  it('pays a win that cleared every gate', () => {
    const r = runXp([won()], GOOD_REASON);
    expect(failed(r)).toEqual([]);
    expect(r.xp).toBeGreaterThanOrEqual(BASE_RUN_XP);
    expect(r.mood).toBeNull();
  });

  it('pays nothing for a disciplined loss, and says so kindly', () => {
    const r = runXp([stopped()], GOOD_REASON);
    expect(r.xp).toBe(0);
    expect(r.mood).toBe('stopped-out');
    // Everything except the result held. That has to be visible.
    expect(failed(r)).toEqual(['The plan paid']);
    expect(r.notes.find((n) => n.gate === 'The plan paid')!.detail).toMatch(/nothing here says the decision was wrong/);
  });

  it('distinguishes a stop-out from an ordinary losing exit', () => {
    expect(runXp([stopped()], GOOD_REASON).mood).toBe('stopped-out');
    expect(runXp([won({ pnl: -400, stoppedOut: false })], GOOD_REASON).mood).toBe('lost');
  });

  it('reports a run with no trades as flat, not as a failure', () => {
    const r = runXp([], GOOD_REASON);
    expect(r.xp).toBe(0);
    expect(r.mood).toBe('flat');
  });
});

describe('weighting a winning run', () => {
  it('pays more for a better process score', () => {
    const bare = runXp([won()], GOOD_REASON, MIN_PROCESS_FOR_XP);
    const perfect = runXp([won()], GOOD_REASON, 100);
    expect(perfect.xp).toBeGreaterThan(bare.xp);
  });

  it('pays more for a plan that asked for more reward against the same risk', () => {
    // The behaviour the weighting exists to reward: same discipline, better
    // ratio. A 4:1 plan is worth meaningfully more than a 1.5:1 scrape.
    const thin = runXp([won({ plannedRR: MIN_PLANNED_RR })], GOOD_REASON, 100);
    const fat = runXp([won({ plannedRR: RR_BONUS_CEILING })], GOOD_REASON, 100);
    expect(fat.xp).toBeGreaterThan(thin.xp);
    expect(fat.xp).toBe(MAX_RUN_XP);
  });

  it('never pays less than the base or more than the ceiling', () => {
    const worst = runXp([won({ plannedRR: MIN_PLANNED_RR })], GOOD_REASON, MIN_PROCESS_FOR_XP);
    const best = runXp([won({ plannedRR: RR_BONUS_CEILING * 5 })], GOOD_REASON, 100);
    expect(worst.xp).toBe(BASE_RUN_XP);
    expect(best.xp).toBe(MAX_RUN_XP);
  });

  it('does not scale with the SIZE of the win', () => {
    // Winning is a gate, not a quantity. Otherwise the biggest number wins
    // again, and the biggest number belongs to whoever took the most risk.
    const small = runXp([won({ pnl: 1 })], GOOD_REASON, 100);
    const huge = runXp([won({ pnl: 10_000_000 })], GOOD_REASON, 100);
    expect(huge.xp).toBe(small.xp);
  });
});

describe('the notes', () => {
  it('explains all five gates, passed or failed', () => {
    // A learner who earned nothing is owed the reason more than one who earned
    // everything, so the notes are not conditional on the verdict.
    for (const r of [runXp([won()], GOOD_REASON), runXp([stopped({ honouredStop: false })], 'no')]) {
      expect(r.notes).toHaveLength(5);
      for (const n of r.notes) expect(n.detail.length).toBeGreaterThan(20);
    }
  });

  it('puts the result last, so the reasoning is read first', () => {
    expect(runXp([won()], GOOD_REASON).notes.at(-1)!.gate).toBe('The plan paid');
  });
});
