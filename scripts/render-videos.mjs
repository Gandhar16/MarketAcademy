#!/usr/bin/env node
/**
 * Render every explainer to an mp4.
 *
 * This exists rather than a bare `npx remotion render` for three reasons, each
 * of which was a real problem on the machine this was built on:
 *
 *  1. **The composition list is not typed here.** It is asked for, from the
 *     bundle, every run. Adding a fourth explainer to `src/content/explainers.ts`
 *     therefore renders a fourth video with no edit to this file — the same
 *     rule as `remotion/Root.tsx`, for the same reason.
 *
 *  2. **The scratch directory is moved off C:.** Remotion writes its frame
 *     pipe and a pre-encode file to the system temp directory, which on Windows
 *     is under the user profile. This machine has ~7 GB free on C: and 530 GB
 *     free on D:, so the default is a render that dies most of the way through
 *     with a disk-full error that reads like a Remotion bug.
 *
 *  3. **Narration has to exist first.** The mp3s under `public/narration/` are
 *     what the compositions mix in, and a missing one is a silent scene that
 *     nothing complains about. Checked here rather than discovered on playback.
 *
 * On the GPU: see `docs/video.md`. Short version — it works, it is ~11% faster,
 * and it makes the file 2.3× bigger. It is not the default.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const ENTRY = './remotion/index.ts';
const OUT_DIR = path.join(ROOT, 'out', 'video');

/**
 * 1.5× a 1280×720 composition is a true 1920×1080 file.
 *
 * Scaling at render time rather than laying the frame out at 1920 means text is
 * rasterised at the final size — sharp — while every number in the layout stays
 * one a person can picture. See the header of `remotion/ExplainerVideo.tsx`.
 */
const DEFAULT_SCALE = 1.5;

function flag(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

/**
 * The Remotion CLI's own entry script, run under this Node.
 *
 * Not `npx remotion`, and not `node_modules/.bin/remotion` either. Both of
 * those are `.cmd` shims on Windows, and spawning a `.cmd` needs `shell: true`,
 * which concatenates arguments instead of escaping them — Node warns about it
 * (DEP0190) and it breaks the first time a path contains a space. Resolving the
 * real .js file and handing it to `process.execPath` sidesteps the shell
 * entirely and is faster besides, since npx does not have to resolve anything.
 */
const REMOTION_CLI = (() => {
  // `remotion-cli.js` itself is not listed in the package's `exports`, so it
  // cannot be resolved directly. `package.json` is, and it names the bin —
  // which is the package's own declaration of where its entry point lives,
  // rather than a path guessed from the outside.
  const require_ = createRequire(import.meta.url);
  const manifestPath = require_.resolve('@remotion/cli/package.json');
  const manifest = require_('@remotion/cli/package.json');
  return path.join(path.dirname(manifestPath), manifest.bin.remotion);
})();

function run(args, { capture = false } = {}) {
  const result = spawnSync(process.execPath, [REMOTION_CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: process.env,
  });
  if (result.error) {
    console.error(`\nCould not start the Remotion CLI: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nremotion ${args[0]} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
  return result.stdout ?? '';
}

// ── scratch space ───────────────────────────────────────────────────────────
// Set before anything spawns, so every child inherits it. TEMP and TMP both,
// because different layers of the stack read different ones on Windows.
const scratch = path.join(ROOT, 'out', '.render-tmp');
mkdirSync(scratch, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });
process.env.TEMP = scratch;
process.env.TMP = scratch;
process.env.TMPDIR = scratch;

// ── narration has to be there first ─────────────────────────────────────────
// A missing mp3 is a silent scene, and silence is the one defect nothing in
// the render pipeline will complain about. Checked against the manifest that
// the compositions themselves read, so this cannot disagree with them.
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'src', 'content', 'narration.json'), 'utf8'));
const missing = Object.values(manifest.lines)
  .map((line) => line.file)
  .filter((file) => !existsSync(path.join(ROOT, 'public', 'narration', file)));

if (missing.length > 0) {
  console.error(`${missing.length} narration file(s) missing, e.g. ${missing[0]}`);
  console.error('Run `pnpm narrate` first — see docs/video.md.');
  process.exit(1);
}

// ── what to render ──────────────────────────────────────────────────────────
const only = flag('only', null);
const scale = flag('scale', String(DEFAULT_SCALE));
const concurrency = flag('concurrency', null);

console.log('Asking the bundle which explainers exist…');

// `--quiet` is quiet about compositions, not about everything: progress glyphs
// and cleanup notices still reach stdout, and one of them once became a
// composition id called "🧹". Filtering to the id shape that
// `explainers.test.ts` already enforces is a real constraint rather than a
// guess about which characters to strip.
const ids = run(['compositions', ENTRY, '--quiet'], { capture: true })
  .trim()
  .split(/\s+/)
  .filter((token) => /^[a-z0-9-]+$/.test(token));

const targets = only ? ids.filter((id) => id === only) : ids;
if (targets.length === 0) {
  console.error(only ? `No explainer with id "${only}". Known: ${ids.join(', ')}` : 'No compositions found.');
  process.exit(1);
}

console.log(`Rendering ${targets.length} explainer(s) at scale ${scale} into ${path.relative(ROOT, OUT_DIR)}\n`);

const started = Date.now();
for (const [i, id] of targets.entries()) {
  console.log(`[${i + 1}/${targets.length}] ${id}`);
  run([
    'render',
    ENTRY,
    id,
    path.join(OUT_DIR, `${id}.mp4`),
    `--scale=${scale}`,
    ...(concurrency ? [`--concurrency=${concurrency}`] : []),
  ]);
}

const minutes = (Date.now() - started) / 60_000;
console.log(`\nDone in ${minutes.toFixed(1)} min. Files are in ${path.relative(ROOT, OUT_DIR)}.`);
console.log('These are build outputs, not source — they are gitignored, and a rate change means re-running this.');
