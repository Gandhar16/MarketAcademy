/**
 * The CI gate for PLAN.md §7.6.
 *
 * Every registered lesson must pass both the schema and the interactivity
 * rules, and the curriculum as a whole must have a coherent prerequisite graph.
 * A lesson that turns into a blog post fails here, in CI, before anyone reads it.
 */
import { describe, expect, it } from 'vitest';
import { LESSONS } from './registry';
import { formatViolations, validateCurriculum, validateLesson, validateSyllabus } from '@/lib/lesson/validator';
import { isInteractive, isSupporting } from '@/lib/lesson/dsl';

describe('curriculum', () => {
  it('has at least one lesson registered', () => {
    expect(LESSONS.length).toBeGreaterThan(0);
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s passes lesson validation', (_id, lesson) => {
    const { violations } = validateLesson(lesson);
    expect(formatViolations(violations)).toBe('All lessons pass validation.');
  });

  it('has a coherent prerequisite graph', () => {
    const violations = validateCurriculum(LESSONS);
    expect(formatViolations(violations)).toBe('All lessons pass validation.');
  });

  it('sits on the syllabus road, in a consistent order', () => {
    // C6 and C7: every shipped lesson is reachable from /learn, every topic
    // marked built has a lesson behind it, and no lesson depends on something
    // further down the road than itself.
    expect(formatViolations(validateSyllabus(LESSONS))).toBe('All lessons pass validation.');
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s lets interaction dominate text', (_id, lesson) => {
    const interactive = lesson.blocks.filter(isInteractive).length;
    const textual = lesson.blocks.filter((b) => !isInteractive(b) && !isSupporting(b)).length;
    expect(interactive / (interactive + textual)).toBeGreaterThanOrEqual(0.6);
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s is not text-heavy', (_id, lesson) => {
    const textual = lesson.blocks.filter((b) => !isInteractive(b) && !isSupporting(b)).length;
    expect(textual / lesson.blocks.length).toBeLessThanOrEqual(0.35);
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s contains a worked example', (_id, lesson) => {
    expect(lesson.blocks.some((b) => b.kind === 'example')).toBe(true);
  });

  it('uses unique, url-safe lesson ids', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });
});
