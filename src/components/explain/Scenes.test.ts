import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The property that makes a video build possible at all.
 *
 * `SceneView` must be a pure function of `elapsed`. A frame renderer asks for
 * t = 3.7s directly, out of order, on a machine where no clock is running, and
 * has to get back the same pixels the site shows at 3.7s. Anything that reads
 * the wall clock — a transition, a timer, an animation library that tracks
 * `performance.now()` — answers a different question ("3.7 seconds after you
 * asked me to start") and renders as a frozen or stuttering video.
 *
 * That failure is silent. Nothing throws; you just get 90 seconds of a still
 * picture and a caption track that appears to be describing something else.
 * So it is asserted on the source, which is blunt but catches the one edit
 * that would break it — someone reaching for a familiar animation import
 * because a scene felt stiff.
 */
const SOURCE = readFileSync(path.join(import.meta.dirname, 'Scenes.tsx'), 'utf8');

/**
 * Comments stripped before scanning.
 *
 * The first version of this test failed on the header of the very file it
 * guards, which explains at length why `performance.now` must not appear.
 * Naming a banned thing in prose is how the rule gets passed on; the test is
 * about what the code does.
 */
const SCENES = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('explainer scenes stay renderable to video', () => {
  it('never reads the wall clock', () => {
    const banned = [
      ['framer-motion', 'tracks performance.now(), so it cannot answer "draw t=3.7s"'],
      ['Date.now', 'the render machine has no meaningful clock'],
      ['performance.now', 'same'],
      ['requestAnimationFrame', 'frames are asked for out of order, not in sequence'],
      ['setTimeout', 'a frame render never waits'],
      ['setInterval', 'a frame render never waits'],
      ['transition:', 'CSS transitions animate between renders, and there is only one render per frame'],
    ];

    const found = banned.filter(([needle]) => SCENES.includes(needle));
    expect(
      found,
      found.map(([needle, why]) => `Scenes.tsx uses "${needle}" — ${why}. See the header of remotion/ExplainerVideo.tsx.`).join('\n'),
    ).toEqual([]);
  });

  it('holds no state of its own', () => {
    // A scene that remembers anything has a second input besides `elapsed`,
    // which means two renderers can disagree about the same moment.
    for (const hook of ['useState', 'useRef', 'useEffect', 'useReducer']) {
      expect(SCENES.includes(hook), `Scenes.tsx uses ${hook}`).toBe(false);
    }
  });

  it('drives every animated value through the one clamped helper', () => {
    // `at()` clamps at both ends. Holding a scene past its authored length then
    // shows its finished state rather than overshooting into a bar wider than
    // its track — which is what happens when a caption is reworded longer and
    // `sceneSeconds` quietly extends the scene.
    expect(SCENES).toMatch(/function at\(elapsed: number, delay: number, duration: number\): number/);
    expect(SCENES).toMatch(/Math\.max\(0, Math\.min\(1,/);
  });
});
