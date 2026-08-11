import { describe, expect, it } from 'vitest';
import { LESSONS } from './registry';
import {
  SEQUENCE,
  SEQUENCE_BY_ID,
  SYLLABUS,
  nextBuilt,
  previousBuilt,
  resumeAt,
  stepOf,
} from './syllabus';
import { TIERS } from '@/lib/lesson/dsl';

describe('the syllabus is one ordered road', () => {
  it('numbers every topic exactly once, with no gaps', () => {
    expect(SEQUENCE.map((t) => t.step)).toEqual(SEQUENCE.map((_, i) => i + 1));
  });

  it('has no duplicate topic ids', () => {
    const ids = SEQUENCE.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never goes backwards in difficulty', () => {
    // This is the property that makes the sequence usable as a single road: a
    // learner working straight down it never meets a harder stage before an
    // easier one. Without it, "step 34" would be a number with no meaning.
    const rank = (t: string) => TIERS.indexOf(t as never);
    const ranks = SYLLABUS.map((s) => rank(s.tier));
    for (let i = 1; i < ranks.length; i++) expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
  });

  it('gives every stage a question a beginner would actually ask', () => {
    for (const s of SYLLABUS) {
      expect(s.question.endsWith('?'), s.id).toBe(true);
      expect(s.topics.length).toBeGreaterThan(0);
    }
  });
});

describe('the syllabus and the registry agree', () => {
  it('places every shipped lesson on the road', () => {
    for (const l of LESSONS) expect(stepOf(l.id), l.id).not.toBeNull();
  });

  it('marks exactly the shipped lessons as built', () => {
    const built = SEQUENCE.filter((t) => t.built).map((t) => t.id).sort();
    expect(built).toEqual(LESSONS.map((l) => l.id).sort());
  });

  it('keeps a lesson at or after each of its prerequisites', () => {
    for (const l of LESSONS) {
      const here = stepOf(l.id)!;
      for (const p of l.prerequisites) {
        const pre = stepOf(p);
        if (pre != null) expect(pre, `${l.id} needs ${p}`).toBeLessThan(here);
      }
    }
  });
});

describe('moving along the road', () => {
  const built = SEQUENCE.filter((t) => t.built);

  it('steps over topics that are not written yet', () => {
    // A gap in the middle of the course must never be a dead end. The learner
    // still SEES the gap on the map; it just cannot stop them.
    for (let i = 0; i < built.length - 1; i++) {
      expect(nextBuilt(built[i].id)?.id).toBe(built[i + 1].id);
    }
    expect(nextBuilt(built[built.length - 1].id)).toBeNull();
  });

  it('walks backwards symmetrically', () => {
    for (let i = 1; i < built.length; i++) {
      expect(previousBuilt(built[i].id)?.id).toBe(built[i - 1].id);
    }
    expect(previousBuilt(built[0].id)).toBeNull();
  });

  it('returns null for an id it has never heard of', () => {
    expect(nextBuilt('not-a-lesson')).toBeNull();
    expect(previousBuilt('not-a-lesson')).toBeNull();
    expect(stepOf('not-a-lesson')).toBeNull();
  });

  it('resumes at the earliest unfinished lesson, not the newest', () => {
    expect(resumeAt(new Set())?.id).toBe(built[0].id);
    expect(resumeAt(new Set([built[0].id]))?.id).toBe(built[1].id);
    // Finishing a later one out of order must not skip the earlier gap.
    expect(resumeAt(new Set([built[2].id]))?.id).toBe(built[0].id);
    expect(resumeAt(new Set(built.map((t) => t.id)))).toBeNull();
  });

  it('attaches the owning stage to every topic', () => {
    for (const t of SEQUENCE) {
      expect(t.stage.topics.some((x) => x.id === t.id), t.id).toBe(true);
      expect(SEQUENCE_BY_ID.get(t.id)).toBe(t);
    }
  });
});
