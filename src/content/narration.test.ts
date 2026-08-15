import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { EXPLAINERS, narrationFor, runtimeOf, sceneSeconds, timeline } from './explainers';
import narration from './narration.json';

const AUDIO_DIR = path.join(import.meta.dirname, '..', '..', 'public', 'narration');
const lines = narration.lines as Record<string, { file: string; seconds: number }>;
const ALL_SCENES = EXPLAINERS.flatMap((e) => e.chapters.flatMap((c) => c.scenes));

/**
 * The failure this file exists to catch is not a crash. It is a video that
 * renders perfectly and says the wrong thing — a caption reworded after its
 * audio was generated, so the voice confidently states the previous figure
 * over the corrected text. Nothing about that file looks broken.
 *
 * The manifest is keyed on the caption itself, so the check is simply that
 * every caption still has a key. Reword one and this fails, naming it.
 */
describe('narration', () => {
  it('has a current recording for every caption', () => {
    const stale = ALL_SCENES.filter((s) => !narrationFor(s.caption)).map((s) => s.caption);
    expect(
      stale,
      `${stale.length} caption(s) have no narration. Run \`pnpm narrate\`:\n` +
        stale.map((c) => `  "${c.slice(0, 70)}…"`).join('\n'),
    ).toEqual([]);
  });

  it('has no recordings left over from captions that no longer exist', () => {
    // The other direction. An orphan is harmless to play but means the manifest
    // has stopped describing the content, which is how it stops being trusted.
    const captions = new Set(ALL_SCENES.map((s) => s.caption));
    const orphans = Object.keys(lines).filter((c) => !captions.has(c));
    expect(orphans.map((o) => o.slice(0, 60))).toEqual([]);
  });

  it('ships the audio file each line claims', () => {
    for (const [caption, line] of Object.entries(lines)) {
      expect(existsSync(path.join(AUDIO_DIR, line.file)), `${line.file} missing for "${caption.slice(0, 40)}…"`).toBe(
        true,
      );
    }
  });

  it('gives every spoken line room to finish before the scene changes', () => {
    // The one timing guarantee that matters. Without it the voice is cut off
    // mid-word by the next scene, which sounds like a bug in the audio rather
    // than in the arithmetic.
    for (const explainer of EXPLAINERS) {
      for (const entry of timeline(explainer)) {
        if (!entry.narration) continue;
        expect(
          entry.seconds,
          `"${entry.caption.slice(0, 40)}…" speaks for ${entry.narration.seconds}s in ${entry.seconds}s`,
        ).toBeGreaterThanOrEqual(entry.narration.seconds);
      }
    }
  });

  it('leaves a beat of silence after the last word', () => {
    for (const scene of ALL_SCENES) {
      const spoken = narrationFor(scene.caption);
      if (!spoken) continue;
      expect(sceneSeconds(scene) - spoken.seconds).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('still fits inside a runtime somebody will watch to the end', () => {
    // Narration makes every explainer longer, because a natural speaking pace
    // is slower than a comfortable silent read. This is the check that the
    // extra length has not quietly turned a two-minute explainer into a lecture.
    // The video cut is the one at risk: it carries the extra analogy scenes,
    // and those have the longest captions and therefore the longest narration.
    for (const e of EXPLAINERS) {
      for (const medium of ['page', 'video'] as const) {
        const runtime = runtimeOf(e, medium);
        expect(runtime, `${e.id} ${medium} runs ${Math.round(runtime)}s`).toBeLessThanOrEqual(240);
      }
    }
  });

  it('degrades to silence rather than to nonsense', () => {
    // An unknown caption must return null, not a neighbouring line. This is
    // what makes a fresh clone with no generated audio behave exactly as the
    // site did before narration existed.
    expect(narrationFor('a caption nobody ever wrote')).toBeNull();
    expect(narrationFor('')).toBeNull();
  });

  it('names the voice it was generated with', () => {
    // Regenerating with a different voice must rewrite every line, not blend
    // two. The script keys its incremental skip on this field.
    expect(narration.voice).toMatch(/^[a-z]{2}_[a-z]+$/);
  });
});
