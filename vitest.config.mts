import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  test: {
    environment: 'node',
    /**
     * Well above vitest's 5s default, because several tests here are slow on
     * purpose rather than by accident.
     *
     * Anything that creates a user runs scrypt at the OWASP 2024 parameters —
     * roughly 128 MB and a deliberate fraction of a second per hash, which is
     * the entire point of the algorithm. A suite that creates a leaderboard's
     * worth of users pays that many times over, and under full parallelism it
     * drifts past five seconds on a laptop while passing comfortably when run
     * alone. That is a flake with no bug behind it, and the honest fix is to
     * stop asking a deliberately expensive function to be quick.
     *
     * This is NOT a licence to let a genuinely hanging test sit here: 20s is
     * still short enough that a deadlock fails the build rather than stalling
     * it.
     */
    testTimeout: 20_000,
    // `remotion/` is outside src but is real source: it is the only thing
    // standing between an explainer and an mp4 that quietly disagrees with it.
    include: ['src/**/*.test.ts', 'remotion/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(root, 'src') },
  },
});
