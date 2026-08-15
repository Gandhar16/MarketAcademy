/**
 * Render settings, tuned for the machine this actually runs on.
 *
 * WHERE THE TIME GOES, AND WHY THE GPU BARELY MATTERS
 *
 * Remotion renders in headless Chromium, which disables the GPU by default, and
 * Remotion's own guidance is that GPU acceleration pays off for WebGL, Skia,
 * P5 and video decoding — none of which is in here. Explainer scenes are divs,
 * borders and widths. So the render is CPU-bound on however many Chrome tabs
 * fit in RAM, and a bigger graphics card would change nothing.
 *
 * The card is not useless, though: encoding can come off the CPU. See
 * `docs/video.md` for the NVENC pass, which is a separate step on purpose —
 * Remotion ships its own ffmpeg, and reaching into it would be fragile.
 *
 * `swangle` (software) is left as the OpenGL backend deliberately rather than
 * switching to `angle` (hardware). Hardware ANGLE has a history of leaking
 * memory across long renders, and a leak on a 4-core laptop with a couple of
 * gigabytes free is a two-hour render that dies at 80%. Nothing here would get
 * faster in exchange.
 */
import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind-v4';
import path from 'node:path';

Config.setEntryPoint('./remotion/index.ts');

/**
 * jpeg over png for the intermediate frames: png is materially slower and the
 * only thing it buys is an alpha channel, which a lesson explainer does not
 * have. Quality is pushed up because these frames are mostly flat colour and
 * thin lines, where jpeg ringing is most visible.
 */
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);

/**
 * Four, on a four-physical-core i7. Chrome tabs are the unit of concurrency
 * here and each one wants a few hundred megabytes; going to eight to match the
 * thread count reliably makes it slower, not faster, once the machine starts
 * swapping. `npx remotion benchmark` is the way to re-check this on other
 * hardware rather than guessing again.
 */
Config.setConcurrency(4);

Config.overrideWebpackConfig((current) => {
  const withTailwind = enableTailwind(current);

  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...withTailwind.resolve?.alias,
        // The same `@/*` the app and the tests use. Without this the video
        // would need its own copy of the components, which is the one thing
        // this whole build exists to avoid.
        '@': path.join(process.cwd(), 'src'),
      },
    },
  };
});
