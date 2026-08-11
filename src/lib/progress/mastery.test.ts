import { describe, expect, it } from 'vitest';
import {
  currentRetention,
  daysUntilDue,
  isDue,
  lessonXp,
  newMastery,
  processScore,
  recordActivity,
  review,
  type TradeRecord,
} from './mastery';

const DAY = 86_400_000;
const T0 = 1_700_000_000_000;

describe('mastery decay', () => {
  it('halves retention over one half-life', () => {
    const m = review(newMastery('sizing', T0), true, 1, T0);
    const r0 = currentRetention(m, T0);
    const r1 = currentRetention(m, T0 + m.halfLifeDays * DAY);
    expect(r1).toBeCloseTo(r0 / 2, 5);
  });

  it('extends the half-life with each successful review — the spacing effect', () => {
    let m = newMastery('sizing', T0);
    const first = review(m, true, 1, T0).halfLifeDays;
    m = review(m, true, 1, T0);
    const second = review(m, true, 1, T0 + DAY).halfLifeDays;
    expect(second).toBeGreaterThan(first);
  });

  it('shortens the half-life on failure so the skill returns sooner', () => {
    let m = newMastery('sizing', T0);
    m = review(m, true, 1, T0);
    m = review(m, true, 1, T0 + DAY);
    const before = m.halfLifeDays;
    const after = review(m, false, 1, T0 + 2 * DAY).halfLifeDays;
    expect(after).toBeLessThan(before);
  });

  it('does not wipe a skill out entirely on one failure', () => {
    let m = review(newMastery('sizing', T0), true, 1, T0);
    m = review(m, false, 1, T0 + DAY);
    expect(m.strength).toBeGreaterThan(0);
  });

  it('never lets the half-life fall below the initial value', () => {
    let m = newMastery('sizing', T0);
    for (let i = 0; i < 10; i++) m = review(m, false, 1, T0 + i * DAY);
    expect(m.halfLifeDays).toBe(3);
  });

  it('marks an unpractised skill as due', () => {
    const m = review(newMastery('sizing', T0), true, 1, T0);
    expect(isDue(m, T0)).toBe(false);
    expect(isDue(m, T0 + 60 * DAY)).toBe(true);
  });

  it('reports days until due consistently with isDue', () => {
    const m = review(newMastery('sizing', T0), true, 1, T0);
    const d = daysUntilDue(m, T0);
    expect(isDue(m, T0 + (d - 0.1) * DAY)).toBe(false);
    expect(isDue(m, T0 + (d + 0.1) * DAY)).toBe(true);
  });
});

describe('process score', () => {
  const disciplined: TradeRecord = {
    preCommitted: true,
    riskFraction: 0.01,
    honouredStop: true,
    exitedPerPlan: true,
    pnl: -1200,
    sizedFromStop: true,
  };

  const reckless: TradeRecord = {
    preCommitted: false,
    riskFraction: 0.35,
    honouredStop: false,
    exitedPerPlan: false,
    pnl: 90_000,
    sizedFromStop: false,
  };

  it('ranks a disciplined loss above a reckless win', () => {
    expect(processScore([disciplined]).score).toBeGreaterThan(processScore([reckless]).score);
  });

  it('gives a perfect process a near-perfect score regardless of P&L', () => {
    const a = processScore([disciplined]);
    const b = processScore([{ ...disciplined, pnl: 50_000 }]);
    expect(a.score).toBe(b.score);
    expect(a.score).toBeGreaterThan(95);
  });

  it('calls out a profitable trade that came from recklessness', () => {
    expect(processScore([reckless]).warnings.join(' ')).toMatch(/not evidence the decision was good/);
  });

  it('affirms losses that followed the plan', () => {
    expect(processScore([disciplined]).warnings.join(' ')).toMatch(/cost of doing business/);
  });

  it('penalises oversized risk even when everything else is followed', () => {
    const oversized = { ...disciplined, riskFraction: 0.2 };
    expect(processScore([oversized]).score).toBeLessThan(processScore([disciplined]).score);
  });

  it('handles an empty record without dividing by zero', () => {
    expect(processScore([]).score).toBe(0);
  });
});

describe('streaks and XP', () => {
  it('increments on consecutive days and resets after a gap', () => {
    let s = { current: 0, longest: 0, lastActiveAt: 0 };
    s = recordActivity(s, T0);
    s = recordActivity(s, T0 + DAY);
    s = recordActivity(s, T0 + 2 * DAY);
    expect(s.current).toBe(3);
    s = recordActivity(s, T0 + 5 * DAY);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });

  it('does not double-count two sessions on the same day', () => {
    let s = { current: 0, longest: 0, lastActiveAt: 0 };
    s = recordActivity(s, T0);
    s = recordActivity(s, T0 + 3600_000);
    expect(s.current).toBe(1);
  });

  it('pays more XP for higher tiers and better checkpoint scores', () => {
    expect(lessonXp('T4', 100, true)).toBeGreaterThan(lessonXp('T0', 100, true));
    expect(lessonXp('T1', 100, true)).toBeGreaterThan(lessonXp('T1', 60, true));
  });

  it('pays less for a retry, but never nothing', () => {
    const retry = lessonXp('T1', 100, false);
    expect(retry).toBeLessThan(lessonXp('T1', 100, true));
    expect(retry).toBeGreaterThan(0);
  });
});
