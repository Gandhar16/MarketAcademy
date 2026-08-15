import { describe, expect, it } from 'vitest';
import {
  EXPLAINERS,
  EXPLAINER_BY_ID,
  explainersForTerm,
  READING_CHARS_PER_SECOND,
  runtimeOf,
  timeline,
} from './explainers';
import { GLOSSARY_BY_ID } from './glossary';

describe('explainers', () => {
  it('has unique, url-safe ids', () => {
    const ids = EXPLAINERS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9-]+$/);
  });

  it('only claims glossary terms that exist', () => {
    // The term pages surface an explainer by looking it up here. A typo would
    // silently mean the explainer never appears where it is most needed.
    for (const e of EXPLAINERS) {
      for (const t of e.terms) {
        expect(GLOSSARY_BY_ID.has(t), `${e.id} claims term "${t}", which does not exist`).toBe(true);
      }
    }
  });

  it('is reachable from the terms it claims', () => {
    for (const e of EXPLAINERS) {
      for (const t of e.terms) {
        expect(explainersForTerm(t).map((x) => x.id)).toContain(e.id);
      }
    }
  });

  it('captions every single scene', () => {
    // The caption is the source, not a subtitle. An uncaptioned scene is a
    // picture making a claim nobody wrote down — and it is also a scene that
    // says nothing at all to a screen reader.
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const [i, s] of chapter.scenes.entries()) {
          expect(s.caption.trim().length, `${e.id} / ${chapter.title} / scene ${i}`).toBeGreaterThan(30);
          expect(s.seconds, `${e.id} / ${chapter.title} / scene ${i}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('always gives a reader long enough to read the caption', () => {
    // A property of the timeline rather than a rule authors must remember. The
    // authored `seconds` is a floor for how long the PICTURE needs; the
    // timeline extends it whenever the words would not fit.
    for (const e of EXPLAINERS) {
      for (const entry of timeline(e)) {
        expect(
          entry.seconds,
          `"${entry.caption.slice(0, 40)}…" is ${entry.caption.length} characters in ${entry.seconds}s`,
        ).toBeGreaterThanOrEqual(entry.caption.length / READING_CHARS_PER_SECOND);
      }
    }
  });

  it('never shortens a scene the author asked to hold longer', () => {
    // The derivation is a floor, not an override. A slow scene stays slow.
    for (const e of EXPLAINERS) {
      const authored = e.chapters.flatMap((c) => c.scenes);
      timeline(e).forEach((entry, i) => {
        expect(entry.seconds).toBeGreaterThanOrEqual(authored[i].seconds);
      });
    }
  });

  it('stays short enough that somebody watches it to the end', () => {
    for (const e of EXPLAINERS) {
      expect(runtimeOf(e), `${e.id} runs ${runtimeOf(e)}s`).toBeLessThanOrEqual(240);
      expect(runtimeOf(e), `${e.id} is barely anything`).toBeGreaterThan(20);
    }
  });

  it('builds a timeline whose start times are contiguous and ordered', () => {
    for (const e of EXPLAINERS) {
      const entries = timeline(e);
      let expected = 0;
      for (const entry of entries) {
        expect(entry.startsAt, `${e.id}`).toBeCloseTo(expected, 6);
        expected += entry.seconds;
      }
      expect(expected).toBeCloseTo(runtimeOf(e), 6);
    }
  });

  it('never draws a price path, because a drawn price path is invented data', () => {
    // PLAN.md §7.1. There is no scene kind that could do this today, and this
    // test is what makes adding one a deliberate, visible decision rather than
    // an afternoon's convenience.
    const allowed = new Set(['chain', 'bars', 'ladder']);
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          expect(allowed.has(s.scene.kind), `${e.id} uses scene kind "${s.scene.kind}"`).toBe(true);
        }
      }
    }
  });

  it('derives its figures from the engines rather than typing them', () => {
    // The whole argument for building these in code rather than recording them
    // is that a statutory rate change re-derives the explainer. If the cost
    // explainer's captions stopped containing engine-computed rupee figures,
    // that argument would have quietly stopped being true.
    const costs = EXPLAINER_BY_ID.get('where-your-money-goes')!;
    const captions = costs.chapters.flatMap((c) => c.scenes.map((s) => s.caption)).join(' ');
    expect(captions).toMatch(/₹[\d,]+\.\d{2}/);

    // And the bill it draws has to be the real one: five distinct charges, not
    // a rounded-off "assume 0.1%".
    const bill = costs.chapters[1].scenes[0].scene;
    expect(bill.kind).toBe('bars');
    if (bill.kind === 'bars') expect(bill.bars.length).toBeGreaterThanOrEqual(5);
  });

  it('lets the option explainer show a real melt to zero', () => {
    const opt = EXPLAINER_BY_ID.get('why-your-option-expired-worthless')!;
    const decay = opt.chapters[1].scenes[0].scene;
    expect(decay.kind).toBe('bars');
    if (decay.kind !== 'bars') return;

    // Time value must fall monotonically and land on exactly zero at expiry.
    // Anything else means the pricer was called wrongly.
    const values = decay.bars.map((b) => b.value);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeLessThan(values[i - 1]);
    expect(values.at(-1)).toBeCloseTo(0, 6);
  });
});
