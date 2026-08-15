# /// script
# requires-python = ">=3.10,<3.14"
# dependencies = [
#   "kokoro-onnx>=0.5.0",
#   "soundfile>=0.12",
# ]
# ///
"""
Speak a list of lines with Kokoro, entirely offline.

This is the only Python in the repository and it is deliberately dumb: it takes
a JSON job file in and writes wav files out. Every decision worth arguing about
— which captions exist, how they are normalised for speech, how long a scene
must therefore hold — lives in TypeScript next to the content it belongs to.
This file knows nothing about explainers.

It runs through `uv run`, which reads the inline metadata above and builds a
throwaway environment on a pinned Python. Nothing is installed system-wide and
there is no virtualenv to remember to activate — which matters because the
alternative, on a machine whose system Python is 3.14, is discovering that
kokoro-onnx caps at 3.13 halfway through a build.

Model choice is Kokoro-82M rather than Piper. Piper is several times faster and
noticeably flatter, and flatness across three minutes of teaching audio is the
same defect as a caption that jumps around: it makes a careful thing feel
careless. Both are fully offline; only one is worth listening to.
"""

import json
import sys
import time
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: narrate.py <jobs.json>", file=sys.stderr)
        return 2

    spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    jobs = spec["jobs"]

    if not jobs:
        print("nothing to synthesise")
        return 0

    print(f"loading Kokoro ({spec['voice']})…", flush=True)
    kokoro = Kokoro(spec["model"], spec["voices"])

    results = []
    started = time.time()

    for i, job in enumerate(jobs, 1):
        out = Path(job["out"])
        out.parent.mkdir(parents=True, exist_ok=True)

        samples, rate = kokoro.create(
            job["text"],
            voice=spec["voice"],
            speed=spec.get("speed", 1.0),
            lang=spec.get("lang", "en-us"),
        )
        sf.write(str(out), samples, rate)

        seconds = len(samples) / rate
        results.append({"key": job["key"], "out": job["out"], "seconds": seconds})
        print(f"  [{i}/{len(jobs)}] {seconds:5.1f}s  {job['text'][:58]}…", flush=True)

    spoken = sum(r["seconds"] for r in results)
    elapsed = time.time() - started
    print(f"\n{spoken:.0f}s of speech in {elapsed:.0f}s ({spoken / elapsed:.2f}x realtime)")

    Path(spec["report"]).write_text(json.dumps(results, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
