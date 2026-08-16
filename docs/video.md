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

## The video is a different lesson from the page

They are two cuts of one authored list, not one thing shown twice. A scene
marked `only: 'video'` is skipped by the page; `timeline()` and `runtimeOf()`
both take a medium and default to `'page'`, so nothing that does not care about
video has to think about it.

The video gets more because a viewer has less. A reader on the page can click
through to a term page for the analogy, read the transcript, or stop and think.
A viewer can do none of those, so the comparison has to be drawn on screen and
the caveat said out loud. That is roughly **70 extra seconds per explainer.**

The extra scenes are a scene kind of their own — `compare` — with three parts:

| Panel | Content |
| --- | --- |
| **Something you already know** | The everyday analogy, imported from `analogies.ts`. Never retyped: a test asserts the text is byte-identical to the glossary's, so a learner cannot meet two versions of the same comparison. |
| **In the market** | What it maps to, with the engine-computed figure. |
| **Where the comparison breaks** | Required, not optional. |

Every explainer carries at least one `compare` scene **in the page cut**, not
only in the video — enforced by a test. An explainer that reaches a learner
purely through mechanism diagrams has skipped the step where they attach it to
something they already understand, and that is the step that makes it stick.
The video then gets further ones on top.

### Coverage

```bash
pnpm coverage          # how many lessons an explainer reaches
pnpm coverage --list   # the gap, and the terms that would close most of it
```

A lesson declares the terms it `introduces`; an explainer declares the terms it
covers; a lesson is *reached* when they overlap — the same relation the term
pages already use to surface an explainer. Currently **81/81**.

Worth being precise about what that measures: it is "everything this lesson
teaches is explained somewhere", not "this lesson has a bespoke explainer".
That is the right bar for surfacing help and it is not the same claim.

### Scene kinds, and the line they must not cross

`chain` · `bars` · `ladder` · `compare` · `band` · `candle`. A test asserts the
set, so adding to it is a deliberate, visible decision.

`candle` draws exactly ONE candle from four stated numbers — the glyph as a
structure, in the explainer about what that structure discards. There is no
array field, for the same reason `band` has no sequence: a list of candles is a
chart of a week that never happened.

`band` is the one that comes closest to drawing a market, and the distinction
worth holding is this: **a band is arithmetic** (±10% of a stated reference) and
**one `at` marker is a stated hypothetical**, exactly the status the order-book
ladder has always had. What stays forbidden — and what there is deliberately no
field for — is a *sequence* of prices. One point is an example; a line joining
several is a chart of a day that never happened. PLAN.md §7.1.

A `ladder` side may also be empty, which is not an edge case but the entire
picture of a locked circuit: orders stacked on one side, "nobody" on the other.
That needed a real fix — `Math.max()` of an empty side is `-Infinity`, which
would have made every bar `NaN` wide rather than failing loudly.

That third panel is the one worth defending. An analogy only ever shown working
teaches the analogy — the learner leaves confident about taxis. Naming the point
where it stops being true is what turns it back into a teaching aid, and it is
usually the most useful sentence on screen. `breaks` is a required field and a
test enforces a real one.

The illustrations are eight line drawings defined in `Scenes.tsx` as SVG paths
in `currentColor`. Deliberately crude: a photograph of a house would be
somebody's actual house and would invite study, where a five-line sketch says
"property" and gets out of the way of the sentence beside it.

## Narration

Every caption is spoken by [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)
(Apache 2.0) running locally through
[kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT), on CPU, with
no network call at synthesis time.

```bash
pnpm narrate                  # only captions that changed
pnpm narrate --force          # everything
pnpm narrate --voice=bf_emma  # different voice
```

**Piper was the other candidate and lost on quality.** It is several times
faster and audibly flatter, and flatness across three minutes of teaching audio
is the same defect as a caption that jumps around: it makes a careful thing feel
careless. Both are fully offline; only one is worth listening to. Measured here:
**310s of speech synthesised in 280s — 1.11× realtime** on the i7-7700HQ, CPU
only. The GPU is not involved and does not need to be.

### Why a synthetic voice is allowed to state statutory rates

This looked like the honesty problem that would kill the feature, and it
dissolves on inspection. The audio is generated **from the caption**, which is
generated **from the engine**. A voice physically cannot say a figure the
written caption does not contain — and `speech.test.ts` asserts exactly that:
every digit in a caption must survive into the spoken form.

The staleness question is handled the same way as everything else here.
`narration.json` is **keyed on the caption text itself**, not on a scene id.
Reword a caption and its key stops matching: the lookup misses, the scene falls
back to reading-speed timing with no audio, and `narration.test.ts` fails naming
the line. An id-keyed manifest would have gone on cheerfully playing the old
sentence over the new text — which is the precise failure this project exists to
make impossible.

### Speaking financial writing

`src/content/speech.ts` rewrites a caption for a voice without changing what it
says. Left alone, a TTS reads the cost explainer as "roopee one comma zero zero
comma zero zero zero" and pronounces STT as a word — both the kind of thing that
loses a listener's trust about thirty seconds in.

| Written | Spoken |
| --- | --- |
| `₹1,00,000` | one lakh rupees |
| `₹238.32` | 238 rupees 32 paise |
| `₹0.20` | 20 paise |
| `STT`, `GST`, `NSE` | S T T, G S T, N S E |
| `SEBI` | SEBI — said as a word by everyone who says it |
| `0.24%` | 0.24 percent |
| `T+1` | T plus 1 |
| `—` | a comma, which is the only punctuation a TTS reliably turns into a beat |

Lakh and crore rather than million, because the audience for a lesson about STT
counts in lakhs and a narrator who counts in millions is talking about somebody
else's market. Small precise charges stay exact — the entire point of the cost
breakdown is that ₹6.14 and ₹0.20 are real, so a narrator that rounds them into
lakhs argues the opposite of the lesson.

### Timing

`sceneSeconds()` takes the highest of three floors: how long the picture needs,
how long the caption takes to read at 15 chars/sec, and **how long the line
actually takes to say, plus 0.7s of silence**. The spoken length usually wins —
a natural speaking pace is slower than a comfortable silent read — which is why
adding narration made every explainer longer.

### Voice choice, named as a compromise

`af_heart` is Kokoro's highest-graded voice and it is American. An American
voice explaining the Indian securities transaction tax is a mismatch worth
admitting: Kokoro v1.0 ships no Indian English voice, and the alternative is a
lower-graded British one — an accent mismatch traded for an audible quality
drop. Clarity won. Revisit when the model ships something better.

### What is committed

The mp3s (mono, 64 kbps, ~3 MB total) live in `public/narration/` and **are**
committed, alongside `narration.json`. Both the site and `staticFile()` read
from there, so one location serves both consumers, and a fresh clone can render
a correct video without a 340 MB model download. The Kokoro model itself lives
in `vendor/kokoro/` and is gitignored.

On the site the narration is **off by default**, behind a "Narrate" toggle, with
`preload="none"`. A page that starts speaking is the behaviour everyone has
learned to resent, and nobody reading in an office wants a few hundred kilobytes
of speech spent on their behalf.

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
pnpm narrate             # speak any caption whose text has changed
pnpm video:studio        # preview and scrub in the Remotion Studio
pnpm video               # render every explainer to out/video/*.mp4
pnpm video --only=where-your-money-goes
pnpm video --scale=1     # 1280x720 instead of 1920x1080, roughly 2x faster
```

`pnpm video` refuses to start if any mp3 the manifest claims is missing. A
silent scene is the one defect nothing else in the pipeline complains about.

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
