import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  test: {
    environment: 'node',
    // `remotion/` is outside src but is real source: it is the only thing
    // standing between an explainer and an mp4 that quietly disagrees with it.
    include: ['src/**/*.test.ts', 'remotion/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(root, 'src') },
  },
});
