#!/usr/bin/env node
/**
 * Generate the narration for every explainer caption.
 *
 * The chain is: caption (the written truth) → `speakable()` (the same sentence,
 * pronounceable) → Kokoro (offline neural TTS) → mp3 in `public/narration/` →
 * `src/content/narration.json`, which is what the site and the video renderer
 * both read.
 *
 * WHY THE MANIFEST IS KEYED ON THE CAPTION TEXT
 *
 * Because that is the thing that can go stale. Reword a caption and its key
 * stops matching, the lookup misses, the scene silently falls back to
 * reading-speed timing with no audio — and `narration.test.ts` fails, naming
 * the caption whose voice is now wrong. An id-keyed manifest would have kept
 * happily playing the old sentence over the new text, which is the failure this
 * whole pipeline is built to make impossible.
 *
 * It also means this script is incremental for free: a caption whose key is
 * already in the manifest, with its mp3 still on disk, is not re-synthesised.
 *
 * Usage:
 *   pnpm narrate                 # only what changed
 *   pnpm narrate --force         # everything, e.g. after changing voice
 *   pnpm narrate --voice=bf_emma
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { build } from 'esbuild';

const ROOT = path.resolve(import.meta.dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'narration');
const MANIFEST = path.join(ROOT, 'src', 'content', 'narration.json');
const SCRATCH = path.join(ROOT, 'out', '.narrate');
const MODEL_DIR = path.join(ROOT, 'vendor', 'kokoro');

/**
 * Kokoro's highest-graded voice.
 *
 * An American voice explaining the Indian securities transaction tax is a
 * compromise, and worth naming as one: Kokoro v1.0 ships no Indian English
 * voice, and the alternative — a lower-graded British one — trades an accent
 * mismatch for an audible quality drop. Clarity won. `--voice` overrides it,
 * and `docs/video.md` records the trade so it can be revisited when the model
 * ships something better.
 */
const DEFAULT_VOICE = 'af_heart';

/** Silence after the last word before the scene is allowed to change. */
const TAIL_SECONDS = 0.7;

function flag(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}
const FORCE = process.argv.includes('--force');
const VOICE = flag('voice', DEFAULT_VOICE);

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) throw new Error(`could not start ${command}: ${result.error.message}`);
  if (result.status !== 0) {
    console.error(`\n${command} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
  return result.stdout.trim();
}

// ── read the content out of TypeScript ──────────────────────────────────────
// The captions and the normaliser live in `src/`, behind the `@/` alias and
// several layers of engine imports. Bundling is how Node gets to look at them
// without a second, hand-maintained copy of the script existing somewhere.
async function loadContent() {
  mkdirSync(SCRATCH, { recursive: true });
  const entry = path.join(SCRATCH, 'entry.mjs');
  const bundled = path.join(SCRATCH, 'content.mjs');

  writeFileSync(
    entry,
    `export { EXPLAINERS } from '@/content/explainers';\nexport { speakable } from '@/content/speech';\n`,
  );

  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: bundled,
    alias: { '@': path.join(ROOT, 'src') },
    logLevel: 'warning',
  });

  return import(new URL(`file://${bundled.replace(/\\/g, '/')}`).href);
}

const { EXPLAINERS, speakable } = await loadContent();

// ── work out what needs saying ──────────────────────────────────────────────
const existing = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { lines: {} };
const previous = existing.voice === VOICE && !FORCE ? existing.lines : {};

mkdirSync(AUDIO_DIR, { recursive: true });

const wanted = [];
for (const explainer of EXPLAINERS) {
  let n = 0;
  for (const chapter of explainer.chapters) {
    for (const scene of chapter.scenes) {
      n += 1;
      wanted.push({
        caption: scene.caption,
        text: speakable(scene.caption),
        // Deterministic and readable. Not a hash: when a render sounds wrong,
        // the person debugging it wants to know which file to play.
        file: `${explainer.id}-${String(n).padStart(2, '0')}.mp3`,
      });
    }
  }
}

const fresh = wanted.filter((w) => {
  const kept = previous[w.caption];
  return !(kept && kept.file === w.file && existsSync(path.join(AUDIO_DIR, kept.file)));
});

console.log(`${wanted.length} captions, ${fresh.length} to synthesise (voice: ${VOICE})\n`);

// ── say them ────────────────────────────────────────────────────────────────
const spokenSeconds = {};
for (const w of wanted) {
  const kept = previous[w.caption];
  if (kept && !fresh.includes(w)) spokenSeconds[w.caption] = kept.seconds;
}

if (fresh.length > 0) {
  const jobsPath = path.join(SCRATCH, 'jobs.json');
  const reportPath = path.join(SCRATCH, 'report.json');

  writeFileSync(
    jobsPath,
    JSON.stringify({
      model: path.join(MODEL_DIR, 'kokoro-v1.0.onnx'),
      voices: path.join(MODEL_DIR, 'voices-v1.0.bin'),
      voice: VOICE,
      speed: 1.0,
      lang: 'en-us',
      report: reportPath,
      jobs: fresh.map((w) => ({
        key: w.caption,
        text: w.text,
        out: path.join(SCRATCH, 'wav', w.file.replace(/\.mp3$/, '.wav')),
      })),
    }),
  );

  if (!existsSync(path.join(MODEL_DIR, 'kokoro-v1.0.onnx'))) {
    console.error(`Kokoro model not found in ${path.relative(ROOT, MODEL_DIR)}.`);
    console.error('See docs/video.md — it is a one-time download and is gitignored.');
    process.exit(1);
  }

  // uv builds the environment from the header of narrate.py. Its cache goes on
  // D: for the same reason the render scratch does: C: has ~7 GB free and
  // onnxruntime plus a pinned CPython is not a small download.
  run('uv', ['run', '--python', '3.12', '--no-project', 'scripts/narrate.py', jobsPath], {
    UV_CACHE_DIR: process.env.UV_CACHE_DIR ?? 'D:\\.uv-cache',
  });

  // wav → mp3. Speech at 24 kHz mono needs nothing like a music bitrate, and
  // these files are committed, so the size is somebody's clone forever.
  console.log('\nencoding…');
  for (const result of JSON.parse(readFileSync(reportPath, 'utf8'))) {
    const wav = result.out;
    const target = wanted.find((w) => w.caption === result.key);
    const mp3 = path.join(AUDIO_DIR, target.file);
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '64k', mp3]);
    // Measured from the encoded file, not from the sample count: the mp3 is
    // what actually plays, and its duration is the one the timing must respect.
    spokenSeconds[result.key] = Number(
      capture('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]),
    );
  }
}

// ── write the manifest ──────────────────────────────────────────────────────
const lines = {};
for (const w of wanted) {
  lines[w.caption] = { file: w.file, seconds: Number(spokenSeconds[w.caption].toFixed(3)) };
}

writeFileSync(
  MANIFEST,
  `${JSON.stringify({ voice: VOICE, tailSeconds: TAIL_SECONDS, lines }, null, 2)}\n`,
);

rmSync(SCRATCH, { recursive: true, force: true });

const total = Object.values(lines).reduce((t, l) => t + l.seconds, 0);
console.log(`\n${Object.keys(lines).length} lines, ${(total / 60).toFixed(1)} min of narration.`);
console.log(`Manifest: ${path.relative(ROOT, MANIFEST)} — commit it with the mp3s.`);
