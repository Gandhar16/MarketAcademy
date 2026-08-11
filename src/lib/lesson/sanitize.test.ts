import { describe, expect, it } from 'vitest';
import { checkpointAnswersFor, revealFor, stripAnswers } from './sanitize';
import { LESSONS } from '@/content/registry';

describe('answer stripping', () => {
  it.each(LESSONS.map((l) => [l.id, l] as const))(
    '%s ships no predict reveals or correct indices to the client',
    (_id, lesson) => {
      const safe = stripAnswers(lesson);
      const serialized = JSON.stringify(safe);

      for (const block of lesson.blocks) {
        if (block.kind !== 'predict') continue;
        expect(serialized).not.toContain(block.reveal);
      }
      for (const block of safe.blocks) {
        if (block.kind !== 'predict') continue;
        expect(block.reveal).toBe('');
        expect(block.correct).toBe(-1);
      }
    },
  );

  it.each(LESSONS.map((l) => [l.id, l] as const))(
    '%s ships no checkpoint explanations or answer specs',
    (_id, lesson) => {
      const serialized = JSON.stringify(stripAnswers(lesson));
      for (const block of lesson.blocks) {
        if (block.kind !== 'checkpoint') continue;
        for (const task of block.tasks) {
          expect(serialized).not.toContain(task.explanation);
        }
      }
    },
  );

  it('keeps everything the learner legitimately needs', () => {
    const lesson = LESSONS[0];
    const safe = stripAnswers(lesson);
    expect(safe.title).toBe(lesson.title);
    expect(safe.blocks).toHaveLength(lesson.blocks.length);
    for (const [i, b] of safe.blocks.entries()) {
      const original = lesson.blocks[i];
      expect(b.kind).toBe(original.kind);
      if (b.kind === 'predict' && original.kind === 'predict') {
        expect(b.prompt).toBe(original.prompt);
        expect(b.options).toEqual(original.options);
      }
      if (b.kind === 'checkpoint' && original.kind === 'checkpoint') {
        expect(b.tasks.map((t) => t.prompt)).toEqual(original.tasks.map((t) => t.prompt));
      }
    }
  });

  it('serves the answer back from the unstripped lesson', () => {
    const lesson = LESSONS[0];
    const predictIndex = lesson.blocks.findIndex((b) => b.kind === 'predict');
    const r = revealFor(lesson, predictIndex);
    expect(r).not.toBeNull();
    expect(r!.reveal.length).toBeGreaterThan(20);
    expect(r!.correct).toBeGreaterThanOrEqual(0);
  });

  it('serves checkpoint explanations back', () => {
    const lesson = LESSONS[0];
    const idx = lesson.blocks.findIndex((b) => b.kind === 'checkpoint');
    const a = checkpointAnswersFor(lesson, idx);
    expect(a!.explanations.every((e) => e.length > 20)).toBe(true);
  });

  it('returns null for a block that has no answer', () => {
    const lesson = LESSONS[0];
    const idx = lesson.blocks.findIndex((b) => b.kind === 'widget');
    expect(revealFor(lesson, idx)).toBeNull();
    expect(checkpointAnswersFor(lesson, idx)).toBeNull();
  });
});
