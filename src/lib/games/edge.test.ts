import { describe, expect, it } from 'vitest';
import {
  MIN_TRADES_FOR_A_VERDICT,
  TRACK_RECORDS,
  assess,
  assessOwnRuns,
  coinFlips,
  coinFlipsWithCosts,
  cumulative,
  maxDrawdown,
  nullProbability,
  tradesNeededForSignificance,
  withEdge,
} from './edge';

describe('descriptive statistics', () => {
  it('accumulates a curve and finds the worst fall from a peak', () => {
    expect(cumulative([1, -1, 2])).toEqual([1, 0, 2]);
    // Up to 5, down to 1, back up: the hole is 4 deep even though it ended ahead.
    expect(maxDrawdown([2, 5, 3, 1, 6])).toBe(4);
    expect(maxDrawdown([1, 2, 3])).toBe(0);
  });

  it('counts wins and averages in R', () => {
    const a = assess([1, -1, 1, -1]);
    expect(a.n).toBe(4);
    expect(a.wins).toBe(2);
    expect(a.winRate).toBe(0.5);
    expect(a.meanR).toBe(0);
    expect(a.totalR).toBe(0);
  });
});

describe('the null test', () => {
  it('is deterministic — the same record always gets the same p-value', () => {
    const trades = withEdge(40, 0.5, 2, 99);
    expect(nullProbability(trades, 3)).toBe(nullProbability(trades, 3));
  });

  it('never returns exactly zero, however good the record', () => {
    // Fifty straight wins. Still not "impossible" — no finite resample can say so.
    expect(nullProbability(Array(50).fill(1), 3)).toBeGreaterThan(0);
  });

  it('calls a coin a coin', () => {
    // A long run of genuine coin flips should sit nowhere near significance.
    expect(nullProbability(coinFlips(200, 5), 3)).toBeGreaterThan(0.05);
  });

  it('finds a strong edge given enough trades', () => {
    expect(nullProbability(withEdge(300, 0.5, 2.5, 11), 3)).toBeLessThan(0.05);
  });

  /**
   * The property that makes the whole game honest: a SHORT stretch of a real
   * edge should usually fail to prove itself. If small samples came out
   * significant, the lesson would be backwards.
   */
  it('cannot prove even a real edge from a handful of trades', () => {
    expect(nullProbability(withEdge(10, 0.5, 2.5, 11), 3)).toBeGreaterThan(0.05);
  });
});

describe('how many trades would be needed', () => {
  it('is null for a record that is not making money', () => {
    expect(tradesNeededForSignificance(0, 1)).toBeNull();
    expect(tradesNeededForSignificance(-0.2, 1)).toBeNull();
  });

  it('grows as the edge shrinks', () => {
    const small = tradesNeededForSignificance(0.05, 1)!;
    const large = tradesNeededForSignificance(0.5, 1)!;
    expect(small).toBeGreaterThan(large);
  });

  it('grows with the noise around the edge', () => {
    expect(tradesNeededForSignificance(0.2, 2)!).toBeGreaterThan(tradesNeededForSignificance(0.2, 1)!);
  });
});

describe('cost drag', () => {
  it('turns a fair coin into a certain loser', () => {
    const flips = coinFlips(400, 7);
    const withCosts = coinFlipsWithCosts(400, 0.08, 7);
    // Same decisions, same order — only the fee is different.
    expect(assess(withCosts).wins).toBe(assess(flips).wins);
    expect(assess(withCosts).totalR).toBeLessThan(assess(flips).totalR);
    expect(assess(withCosts).meanR).toBeCloseTo(assess(flips).meanR - 0.08, 10);
  });
});

describe('the deck', () => {
  it('has a stated answer that agrees with the statistics', () => {
    for (const record of TRACK_RECORDS) {
      const a = assess(record.trades, 1);
      if (record.correct === 'edge') {
        // Only claim an edge is proven when the record actually clears the bar.
        expect(a.significant, `${record.id} claims a proven edge`).toBe(true);
        expect(a.meanR).toBeGreaterThan(0);
      }
      if (record.correct === 'no-edge') {
        // Never label something a loser while it is making money.
        expect(a.meanR, `${record.id} claims to lose by design`).toBeLessThan(0);
      }
      if (record.correct === 'unproven') {
        expect(a.significant, `${record.id} claims to be unprovable`).toBe(false);
      }
    }
  });

  /**
   * The distribution IS the lesson: most real records cannot be called. If a
   * future edit made "unproven" rare, the game would quietly start teaching
   * that track records are usually readable, which is the opposite of true.
   */
  it('has "not enough trades" as its most common answer', () => {
    const count = (a: string) => TRACK_RECORDS.filter((r) => r.correct === a).length;
    expect(count('unproven')).toBeGreaterThan(count('edge'));
    expect(count('unproven')).toBeGreaterThan(count('no-edge'));
  });

  it('contains at least one real edge that the record cannot prove', () => {
    const cruel = TRACK_RECORDS.filter((r) => r.truth === 'edge' && r.correct === 'unproven');
    expect(cruel.length).toBeGreaterThan(0);
  });

  it('contains a high win rate that still loses money', () => {
    const grinder = TRACK_RECORDS.find((r) => r.id === 'the-grinder')!;
    const a = assess(grinder.trades, 1);
    expect(a.winRate).toBeGreaterThan(0.6);
    expect(a.totalR).toBeLessThan(0);
  });

  it('states numbers in its copy that match the generated trades', () => {
    const numbersIn = (text: string) => (text.match(/\d+(\.\d+)?/g) ?? []).map(Number);

    for (const record of TRACK_RECORDS) {
      const a = assess(record.trades, 1);
      const quoted = new Set([...numbersIn(record.claim), ...numbersIn(record.context)]);
      // Whenever the copy quotes a trade count or a win count, it must be true.
      expect(quoted.has(a.n), `${record.id} should state its ${a.n} trades`).toBe(true);
      expect(
        quoted.has(a.wins) || quoted.has(Math.round(a.winRate * 100)),
        `${record.id} should state ${a.wins} wins or a ${Math.round(a.winRate * 100)}% rate`,
      ).toBe(true);
    }
  });

  it('gives every record an explanation that survives being read alone', () => {
    for (const record of TRACK_RECORDS) {
      expect(record.explanation.length, record.id).toBeGreaterThan(200);
      expect(record.claim.length, record.id).toBeGreaterThan(20);
    }
  });

  it('uses ids that are unique', () => {
    expect(new Set(TRACK_RECORDS.map((r) => r.id)).size).toBe(TRACK_RECORDS.length);
  });
});

describe('judging the learner’s own runs', () => {
  it('refuses to say anything about too few runs', () => {
    expect(assessOwnRuns([100, -50, 200])).toBeNull();
  });

  it('refuses when every run was flat', () => {
    expect(assessOwnRuns([0, 0, 0, 0, 0, 0])).toBeNull();
  });

  it('normalises rupees to comparable units', () => {
    const small = assessOwnRuns([100, -100, 300, -100, 100, -50]);
    // The same shape of results at a hundred times the size must read the same.
    const large = assessOwnRuns([10000, -10000, 30000, -10000, 10000, -5000]);
    expect(small!.meanR).toBeCloseTo(large!.meanR, 10);
    expect(small!.winRate).toBe(large!.winRate);
  });

  /**
   * The guard that matters most. Six straight wins IS unlikely under a fair
   * coin, so the p-value alone would call it proven — and telling somebody with
   * six lucky runs that they have an edge is the exact harm this game exists to
   * prevent.
   */
  it('never certifies an edge from a short winning streak, however clean', () => {
    const result = assessOwnRuns([500, 400, 600, 300, 500, 450])!;
    expect(result.n).toBeLessThan(MIN_TRADES_FOR_A_VERDICT);
    expect(result.significant).toBe(false);
    expect(result.tradesNeeded).toBeGreaterThan(0);
  });

  it('will certify a long, genuinely strong record', () => {
    const many = Array.from({ length: 60 }, (_, i) => (i % 3 === 0 ? -1000 : 1200));
    expect(assessOwnRuns(many)!.significant).toBe(true);
  });
});
