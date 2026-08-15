# Rendering explainers to video

The explainers at `/explain` are React components. This is how they also become
mp4 files, why that is safe to do, and what it costs on real hardware.

## The rule that makes this possible

`src/components/explain/Scenes.tsx` is a **pure function of `elapsed`** — seconds
since the scene appeared. It reads no clock, holds no state, and starts no
transition.

That is the whole trick. A frame renderer asks for "the picture at t = 3.7s"
directly, out of order, on a machine where nothing is playing. A component built
on `performance.now()` can only answer a different question — "the picture 3.7
seconds after you told me to start" — and the result is 90 seconds of a still
frame under a caption track that appears to be describing a different video.

So the site player and the video renderer are **two clocks driving one set of
components**, not two sets of components somebody has to keep looking alike.
`src/components/explain/Scenes.test.ts` fails the build if an animation import
comes back.

## Why the video is a build output, not an asset

An mp4 is the only artefact on this site that can go stale in silence. It keeps
stating whatever STT rate it was rendered with, confidently, in a picture, long
after the rate changed — and nothing about the file looks wrong.

The mitigation is derivation, not vigilance. Every figure in every scene comes
from `computeCost`, `roundTripCost` and `blackScholesPrice` at module load. So:

> **A statutory rate change means re-running `pnpm video`.** A stale file is then
> a build somebody did not re-run, rather than a fact somebody had to remember.

`out/` is gitignored. The mp4s are never committed; they are produced when
needed and uploaded wherever they are going.

## Running it

```bash
pnpm video:studio        # preview and scrub in the Remotion Studio
pnpm video               # render every explainer to out/video/*.mp4
pnpm video --only=where-your-money-goes
pnpm video --scale=1     # 1280x720 instead of 1920x1080, roughly 2x faster
```

`scripts/render-videos.mjs` asks the bundle which compositions exist rather than
listing them, so a fourth explainer in `src/content/explainers.ts` renders a
fourth video with no edit anywhere.

It also moves Remotion's scratch directory to `out/.render-tmp`. The default is
the system temp directory under the user profile on C:, and this machine has
~7 GB free there against 530 GB on D: — a long render otherwise dies most of the
way through with a disk-full error that reads like a Remotion bug.

## What it costs, measured

Measured on the machine this was built on: **i7-7700HQ (4 cores / 8 threads),
16 GB RAM, GTX 1050 Ti 4 GB, Windows 11.** 300 frames at 1920×1080.

| Concurrency | Wall clock (incl. ~15s startup) |
| --- | --- |
| 2 | 37.3s |
| 3 | 43.5s |
| **4** | **33.3s** |
| 6 | 32.7s |

Four is the default in `remotion.config.ts` — the same as the physical core
count. Six is a rounding error faster and wants more RAM, which this machine
does not reliably have spare. Steady-state throughput is roughly **16 fps**, so
a three-minute explainer takes about six minutes.

Re-check on other hardware with `npx remotion benchmark <id> --concurrencies=2,4,6`
rather than guessing.

### The font mistake, recorded because it was expensive

The first working render managed **2 fps**. The cause was `loadFont()` with no
arguments: `@remotion/google-fonts` then pulls *every weight of every alphabet* —
126 requests for Inter and 96 for JetBrains Mono — and the renderer opens one
browser tab per unit of concurrency, so that is a few hundred network round
trips before the first frame, repeated per tab, on a render that has no business
touching the network at all.

Pinning to two weights of latin took it to 16 fps. Same pixels. There is a test.

## The GPU: it works, and it is still not the default

The short answer to "will my 1050 Ti help": **barely, and not for free.**

Remotion renders in headless Chromium, which disables the GPU by default, and
GPU acceleration only pays for WebGL, Skia, P5 and video decoding. Explainer
scenes are divs, borders and widths. The rendering half of the work is
CPU-bound and a better card would change nothing.

Encoding is a different story, and NVENC does work here. Remotion has supported
it on Windows since v4.0.484, but its bundled ffmpeg only ships NVENC on Linux,
so it needs a binaries directory assembled by hand — Remotion's own compositor
files plus an ffmpeg build that has `h264_nvenc`:

```powershell
$src = "node_modules/.pnpm/<hash>/node_modules/@remotion/compositor-win32-x64-msvc"
mkdir out/nvenc-bin
Copy-Item "$src/*" out/nvenc-bin
# then overwrite ffmpeg.exe and ffprobe.exe with a build that has NVENC
npx remotion render <id> out/video/<id>.mp4 --scale=1.5 --muted `
  --hardware-acceleration=required --binaries-directory=out/nvenc-bin
```

Measured, 300 frames, same content:

| | Wall clock | File size |
| --- | --- | --- |
| libx264 (CPU, default) | 30.3s | **227 KB** |
| h264_nvenc (GPU) | **26.9s** | 519 KB |

**11% faster for a 2.3× larger file.** For video going over the web to learners
on Indian mobile data, bytes matter more than four seconds of render time on a
machine that renders these a handful of times a year. So the default stays CPU,
and the GPU path is documented here rather than wired in — the assembled
binaries directory would need rebuilding after every `pnpm install`, which is
exactly the kind of quiet breakage that is worse than the problem it solves.

Two smaller notes from the same investigation:

- `--muted` is not just tidiness. These explainers are silent, and without it
  Remotion builds and muxes an empty AAC track — which is also the exact step
  that fails against an ffmpeg build with no AAC encoder.
- `swangle` (software OpenGL) is left as the backend rather than hardware
  `angle`. Hardware ANGLE has a history of leaking memory across long renders,
  and a leak on a 4-core laptop is a render that dies at 80%. Nothing here would
  get faster in exchange.

## Why Remotion and not Manim

Manim is the better-known tool and would run fine on this hardware — its Cairo
renderer is CPU-only and Manim 0.21 supports the installed Python 3.14. It was
rejected on one point, not on capability:

**adopting it means re-authoring every explainer in Python**, which forks the
content away from `computeCost` and `blackScholesPrice`. A Manim video would be
beautiful and would state a repealed STT rate with total confidence, because
nothing would connect it to the engine that knows better. That is the failure
mode PLAN.md §7 exists to prevent, wearing a friendlier face.

Motion Canvas and Revideo are MIT-licensed and TypeScript, which is genuinely
attractive, but they are canvas scene-graph APIs — existing React components do
not transfer, so they carry the same duplication cost without the Python.

Remotion imports `Scenes.tsx` and `explainers.ts` as they already exist. The mp4
is a render target of the same source of truth rather than a second copy of the
content. That is the entire argument.

### The licence, before it is load-bearing

Remotion is **not** MIT. It is free for an individual or a for-profit
organisation with **up to three employees**; beyond that it requires a paid
company licence. The threshold is headcount, not revenue — so this is fine today
and becomes a decision on the day Market Academy is four people, not on the day
it earns money. Recorded here so that day is not a surprise.

<https://github.com/remotion-dev/remotion/blob/main/LICENSE.md>
