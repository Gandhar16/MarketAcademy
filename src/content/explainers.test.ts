import { describe, expect, it } from 'vitest';
import {
  EXPLAINERS,
  EXPLAINER_BY_ID,
  explainersForLesson,
  explainersForTerm,
  forMedium,
  READING_CHARS_PER_SECOND,
  runtimeOf,
  timeline,
} from './explainers';
import { GLOSSARY_BY_ID } from './glossary';
import { ANALOGIES } from './analogies';
import { canTradeAtBand, indiaPriceBand } from '@/lib/engine/halts';

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

  it('gives every lesson the explainer that shares the most of its words', () => {
    // The lesson pages embed the first result and only the first, so the order
    // is not cosmetic — it decides which explainer 81 lessons actually show.
    const [best] = explainersForLesson(['stt', 'brokerage', 'gst']);
    expect(best?.id).toBe('where-your-money-goes');
  });

  it('offers a lesson nothing when it shares no words with any explainer', () => {
    expect(explainersForLesson([])).toEqual([]);
    expect(explainersForLesson(['a-term-no-explainer-claims'])).toEqual([]);
  });

  it('ranks lesson matches deterministically, so a build cannot reshuffle them', () => {
    // Ties break on id rather than on position in EXPLAINERS, so reordering
    // that array cannot silently change which explainer a lesson embeds.
    const terms = EXPLAINERS.flatMap((e) => e.terms);
    const once = explainersForLesson(terms).map((e) => e.id);
    const twice = explainersForLesson([...terms].reverse()).map((e) => e.id);
    expect(once).toEqual(twice);
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
      for (const medium of ['page', 'video'] as const) {
        const runtime = runtimeOf(e, medium);
        expect(runtime, `${e.id} ${medium} runs ${Math.round(runtime)}s`).toBeLessThanOrEqual(240);
        expect(runtime, `${e.id} ${medium} is barely anything`).toBeGreaterThan(20);
      }
    }
  });

  it('gives the video more than the page, never less', () => {
    // The two cuts exist because a viewer cannot click through to a term page
    // or stop to think. If the video ever became the shorter one, the extra
    // scenes would have stopped being extra.
    for (const e of EXPLAINERS) {
      expect(runtimeOf(e, 'video'), e.id).toBeGreaterThan(runtimeOf(e, 'page'));
      expect(timeline(e, 'video').length, e.id).toBeGreaterThan(timeline(e, 'page').length);
    }
  });

  it('always gives a reader at least one real-world comparison, on the page too', () => {
    // Not a video extra. An explainer that reaches a learner only through
    // mechanism diagrams has skipped the step where they attach it to something
    // they already understand — which is the step that makes it stick. So every
    // explainer carries at least one `compare` scene in the PAGE cut, and the
    // video gets further ones on top.
    for (const e of EXPLAINERS) {
      const onPage = timeline(e, 'page').filter((s) => s.scene.kind === 'compare');
      expect(onPage.length, `${e.id} has no analogy a reader on the page would ever see`).toBeGreaterThan(0);
    }
  });

  it('still gives the video something the page does not have', () => {
    for (const e of EXPLAINERS) {
      const extra = e.chapters.flatMap((c) => c.scenes).filter((s) => s.only === 'video');
      expect(extra.length, `${e.id} has no video-only scenes`).toBeGreaterThan(0);
    }
  });

  it('strips video-only scenes out of what the page is handed', () => {
    // The player is a client component, so whatever it receives is serialised
    // into the HTML. Without this the analogy scenes would be downloaded by
    // every reader and rendered by none of them — invisible, so nothing would
    // ever have complained.
    for (const e of EXPLAINERS) {
      const page = forMedium(e, 'page');
      const prose = JSON.stringify(page);

      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          if (s.only !== 'video') continue;
          expect(prose.includes(s.caption.slice(0, 40)), `${e.id} ships a video caption to the page`).toBe(false);
          if (s.scene.kind === 'compare') {
            expect(prose.includes(s.scene.breaks.slice(0, 40)), `${e.id} ships an analogy to the page`).toBe(false);
          }
        }
      }
    }

    // And the video cut is handed back untouched.
    for (const e of EXPLAINERS) expect(forMedium(e, 'video')).toBe(e);
  });

  it('keeps the page cut playable after stripping', () => {
    // Filtering must not leave an empty chapter behind — that is a heading in
    // the chapter list that jumps nowhere.
    for (const e of EXPLAINERS) {
      const page = forMedium(e, 'page');
      expect(page.chapters.length, e.id).toBeGreaterThan(0);
      for (const c of page.chapters) expect(c.scenes.length, `${e.id} / ${c.title}`).toBeGreaterThan(0);
      expect(runtimeOf(page), e.id).toBeCloseTo(runtimeOf(e, 'page'), 6);
    }
  });

  it('never shows an analogy without saying where it breaks', () => {
    // The rule that keeps a comparison a teaching aid rather than a new thing
    // to be wrong about. Enforced rather than trusted, because `breaks` is the
    // field an author in a hurry would leave for later.
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          if (s.scene.kind !== 'compare') continue;
          expect(s.scene.breaks.length, `${e.id} / ${chapter.title}`).toBeGreaterThan(40);
          expect(s.scene.everyday.length, `${e.id} / ${chapter.title}`).toBeGreaterThan(40);
        }
      }
    }
  });

  it('takes its real-life examples from the analogies the site already teaches', () => {
    // Not retyped. If a compare scene's everyday half drifted from the glossary
    // analogy, a learner would meet two different versions of the same
    // comparison — and only one of them would be under the no-jargon test.
    const known = new Set(Object.values(ANALOGIES));
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          if (s.scene.kind !== 'compare') continue;
          expect(known.has(s.scene.everyday), `${e.id} / ${chapter.title} invents its own analogy`).toBe(true);
        }
      }
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
    // `band` draws a price RANGE and at most one stated price inside it, which
    // is arithmetic plus a hypothetical — the same status as the order-book
    // ladder. What stays forbidden is a sequence of prices joined into a line.
    // `candle` draws ONE candle from four stated numbers — the glyph as a
    // structure, in the explainer about what that structure discards. There is
    // no array field, because a list of candles is a chart of a week that never
    // happened.
    const allowed = new Set(['chain', 'bars', 'ladder', 'compare', 'band', 'candle']);
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
    // a rounded-off "assume 0.1%". Found by shape rather than by index —
    // inserting a scene should not be able to break an assertion about content.
    const bill = costs.chapters
      .flatMap((c) => c.scenes)
      .map((s) => s.scene)
      .find((scene) => scene.kind === 'bars' && scene.bars.length >= 5);
    expect(bill, 'no scene draws the full itemised bill').toBeDefined();
  });

  it('draws circuit bands the halts engine actually computes', () => {
    // The band is the one scene that looks most like a chart, so it is the one
    // most worth pinning to the engine. Recomputing it here rather than
    // comparing to a typed number means a rule change fails this test instead
    // of quietly producing a confident, wrong picture.
    const circuits = EXPLAINER_BY_ID.get('why-you-could-not-sell')!;
    const bands = circuits.chapters.flatMap((c) => c.scenes).map((s) => s.scene).filter((s) => s.kind === 'band');
    expect(bands.length).toBeGreaterThan(0);

    for (const band of bands) {
      const engine = indiaPriceBand(band.reference, band.bandPercent as 2 | 5 | 10 | 20);
      expect(band.lower).toBe(engine.lower);
      expect(band.upper).toBe(engine.upper);
      // And a marker, where present, has to sit inside or on the fence it is
      // being drawn against.
      if (band.at != null) {
        expect(band.at).toBeGreaterThanOrEqual(engine.lower);
        expect(band.at).toBeLessThanOrEqual(engine.upper);
      }
    }
  });

  it('quotes the engine on what you can do at a circuit, rather than paraphrasing it', () => {
    const circuits = EXPLAINER_BY_ID.get('why-you-could-not-sell')!;
    const verdicts = circuits.chapters
      .flatMap((c) => c.scenes)
      .map((s) => s.scene)
      .filter((s) => s.kind === 'band')
      .map((s) => s.verdict)
      .filter((v): v is string => Boolean(v));

    expect(verdicts.length).toBeGreaterThan(0);
    const engineWords = [
      canTradeAtBand('lower_circuit', 'sell').reason,
      canTradeAtBand('upper_circuit', 'buy').reason,
    ];
    for (const verdict of verdicts) expect(engineWords).toContain(verdict);
  });

  it('sizes positions with the portfolio engine, and keeps the risk identical', () => {
    // The claim the sizing explainer makes on screen is that three different
    // stop distances produce three different quantities at the SAME risk. If
    // that stopped being true the scene would be teaching the opposite lesson.
    const sizing = EXPLAINER_BY_ID.get('how-much-should-you-buy')!;
    const quantities = sizing.chapters[1].scenes[0].scene;
    const risks = sizing.chapters[1].scenes[1].scene;

    expect(quantities.kind).toBe('bars');
    expect(risks.kind).toBe('bars');
    if (quantities.kind !== 'bars' || risks.kind !== 'bars') return;

    // Distinct sizes…
    expect(new Set(quantities.bars.map((b) => b.value)).size).toBe(quantities.bars.length);
    // …identical risk.
    expect(new Set(risks.bars.map((b) => Math.round(b.value))).size).toBe(1);
    // …and a tighter stop must buy MORE, which is the counter-intuitive part.
    expect(quantities.bars[0].value).toBeGreaterThan(quantities.bars.at(-1)!.value);

    for (const bar of quantities.bars) expect(Number.isInteger(bar.value)).toBe(true);
  });

  it('never draws a candle that could not exist', () => {
    // The high has to be the highest thing and the low the lowest, or the
    // picture teaches a shape the market cannot produce — in the one explainer
    // whose entire subject is reading that shape correctly.
    for (const e of EXPLAINERS) {
      for (const chapter of e.chapters) {
        for (const s of chapter.scenes) {
          if (s.scene.kind !== 'candle') continue;
          const { open, high, low, close } = s.scene;
          const where = `${e.id} / ${chapter.title}`;
          expect(high, where).toBeGreaterThanOrEqual(Math.max(open, close));
          expect(low, where).toBeLessThanOrEqual(Math.min(open, close));
          expect(high, where).toBeGreaterThan(low);
        }
      }
    }
  });

  it('keeps every candle in an explainer identical, because that is the lesson', () => {
    // "Two different days, one identical candle" only works if the candle is
    // genuinely identical every time it is drawn. Four numbers retyped per
    // scene would eventually drift and quietly gut the argument.
    const candles = EXPLAINER_BY_ID.get('what-one-candle-hides')!.chapters
      .flatMap((c) => c.scenes)
      .map((s) => s.scene)
      .filter((s) => s.kind === 'candle')
      .map((s) => `${s.open}/${s.high}/${s.low}/${s.close}`);

    expect(candles.length).toBeGreaterThan(1);
    expect(new Set(candles).size).toBe(1);
  });

  it('does the multiple-testing arithmetic correctly', () => {
    // The scene's whole claim is that testing more worthless ideas makes a
    // false positive near-certain. Recomputed here rather than eyeballed,
    // because a wrong number in this particular scene would be the site
    // committing the exact error it is warning about.
    const backtest = EXPLAINER_BY_ID.get('why-the-backtest-lied')!;
    const chances = backtest.chapters
      .flatMap((c) => c.scenes)
      .map((s) => s.scene)
      .find((s) => s.kind === 'bars' && s.bars.some((b) => b.label.includes('idea')));

    expect(chances?.kind).toBe('bars');
    if (chances?.kind !== 'bars') return;

    for (const bar of chances.bars) {
      const n = Number(bar.label.match(/^(\d+)/)![1]);
      expect(bar.value).toBeCloseTo((1 - Math.pow(0.95, n)) * 100, 6);
    }
    // And it must be monotonic — more tries, more chance.
    const values = chances.bars.map((b) => b.value);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });

  it('lets the option explainer show a real melt to zero', () => {
    const opt = EXPLAINER_BY_ID.get('why-your-option-expired-worthless')!;

    // Identified by what it is — the week-by-week melt — rather than by where
    // it sits, so adding a scene ahead of it cannot silently retarget this at
    // a different chart.
    const decay = opt.chapters
      .flatMap((c) => c.scenes)
      .map((s) => s.scene)
      .find((scene) => scene.kind === 'bars' && scene.bars.some((b) => b.label.includes('Expiry')));
    expect(decay, 'no scene shows the week-by-week melt').toBeDefined();
    if (!decay || decay.kind !== 'bars') return;

    // Time value must fall monotonically and land on exactly zero at expiry.
    // Anything else means the pricer was called wrongly.
    const values = decay.bars.map((b) => b.value);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeLessThan(values[i - 1]);
    expect(values.at(-1)).toBeCloseTo(0, 6);
  });
});
