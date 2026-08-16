#!/usr/bin/env node
/**
 * Which lessons have an explainer behind them, and which do not.
 *
 * A lesson declares the glossary terms it `introduces`. An explainer declares
 * the terms it covers. A lesson is "reached" when those overlap — which is also
 * exactly when the term pages surface the explainer to somebody studying that
 * lesson, so this is not a proxy for coverage, it is the same relation the site
 * already uses.
 *
 * Exists because "explainers for all the lessons" is a real goal and a number
 * nobody can hold in their head. Run it before deciding what to build next; the
 * biggest uncovered cluster is usually the right answer.
 *
 *   pnpm coverage
 *   pnpm coverage --list     # every uncovered lesson, with its terms
 */
import { build } from 'esbuild';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(ROOT, 'out', '.coverage');

mkdirSync(SCRATCH, { recursive: true });
const entry = path.join(SCRATCH, 'entry.mjs');
const bundled = path.join(SCRATCH, 'content.mjs');

writeFileSync(
  entry,
  `export { EXPLAINERS } from '@/content/explainers';\nexport { LESSONS } from '@/content/registry';\n`,
);

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundled,
  alias: { '@': path.join(ROOT, 'src') },
  logLevel: 'error',
});

const { EXPLAINERS, LESSONS } = await import(new URL(`file://${bundled.replace(/\\/g, '/')}`).href);

const covered = new Set(EXPLAINERS.flatMap((e) => e.terms));
const teaching = LESSONS.filter((l) => (l.introduces ?? []).length > 0);
const reached = teaching.filter((l) => l.introduces.some((t) => covered.has(t)));
const missing = teaching.filter((l) => !l.introduces.some((t) => covered.has(t)));

const TIERS = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'];
const pct = (a, b) => (b === 0 ? 100 : Math.round((a / b) * 100));

console.log(`${EXPLAINERS.length} explainers covering ${covered.size} glossary terms\n`);
console.log(`${reached.length}/${teaching.length} lessons reached (${pct(reached.length, teaching.length)}%)\n`);

for (const tier of TIERS) {
  const all = teaching.filter((l) => l.tier === tier);
  if (!all.length) continue;
  const hit = all.filter((l) => l.introduces.some((t) => covered.has(t)));
  const bar = '█'.repeat(Math.round((hit.length / all.length) * 20)).padEnd(20, '·');
  console.log(`  ${tier}  ${bar}  ${hit.length}/${all.length}`);
}

if (missing.length > 0 && process.argv.includes('--list')) {
  console.log('\nuncovered:');
  for (const tier of TIERS) {
    for (const l of missing.filter((m) => m.tier === tier)) {
      console.log(`  [${l.tier}] ${l.id}\n        ${l.title}\n        ${l.introduces.join(', ')}`);
    }
  }

  // The terms that would buy the most coverage next.
  const freq = new Map();
  for (const l of missing) for (const t of l.introduces) freq.set(t, (freq.get(t) ?? 0) + 1);
  console.log('\nhighest-leverage uncovered terms:');
  for (const [term, n] of [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`  ${String(n).padStart(2)}x  ${term}`);
  }
} else if (missing.length > 0) {
  console.log(`\n${missing.length} lessons uncovered. Re-run with --list to see them.`);
}

rmSync(SCRATCH, { recursive: true, force: true });
