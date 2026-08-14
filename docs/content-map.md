# Content Map — Lessons, Games, and Where to Add More

This is the index to walk before adding or editing lesson/game content. It tells you what exists today, the exact shape a new entry must take, and which files to touch (and in what order) to add something new without breaking the validator or CI.

For the step-by-step "add a lesson" checklist and the full design rationale behind the stage ordering, `docs/course-sequence.md` is the primary source — this doc is the catalog + shape reference that sits alongside it.

## The big picture

```
src/content/
  syllabus.ts        <- the ORDER: 12 stages, 84 steps total, flattened + numbered
  registry.ts         <- the REGISTRY: every lesson file explicitly imported into LESSONS[]
  glossary.ts          <- ~115 terms, auto-linked into lesson prose
  claims.test.ts       <- one test per numeric claim made in any lesson's prose
  in/                    <- one file per India lesson, t{tier}-{slug}.ts (~85 files)
  us/                     <- does not exist yet — no US lessons written
```

A lesson only "exists" for real once it's in **all three** places: a topic entry in `syllabus.ts` (with `built: true`), a lesson file in `src/content/in/`, and an import in `registry.ts`. Missing any one of these either breaks the validator or means the lesson silently never ships — this is deliberate, per the comment in `registry.ts`: "the registry is the single place that answers 'what is in the course', the CI validator walks exactly this list, and a lesson file that exists but was never registered cannot silently ship half-finished."

## The syllabus — 12 stages, 84 steps

`src/content/syllabus.ts`:

```ts
interface SyllabusTopic { id: string; title: string; covers: string; built?: boolean }
interface SyllabusStage {
  id: string; question: string; name: string; courseTitle: string;
  tier: Tier; why: string; topics: SyllabusTopic[]; capstoneGames?: string[];
}
```

`SEQUENCE` flattens all stages into one ordered, 1-based-numbered list. Helpers: `stepOf()`, `nextBuilt()` / `previousBuilt()` (skip anything not yet `built: true`, never dead-end on an unwritten topic), `resumeAt(completed)` (earliest unfinished built topic — powers the "continue" button on `/learn`), `isStageComplete()`, `stageOf()`.

| Stage | Course title | Tier | Topics | Capstone game(s) |
|---|---|---|---|---|
| `stage-1` | Basics of the Stock Market | T0 | 8 — what-is-a-share, where-does-money-go, who-does-what, order-book, settlement, what-moves-price, gambling-vs-investing, index | — |
| `stage-2` | Placing a Trade | T1 | 5 — order-types, real-cost-of-a-trade, contract-note, reading-candles, first-trade | `order-gauntlet`, `cost-cutter` |
| `stage-3` | Risk & Position Sizing | T1 | 4 — position-sizing, stops, expectancy, journal | `chart-replay` |
| `stage-4` | Long-Term Investing | T1 | 4 — compounding, sip, index-vs-stock, dividends | `the-long-game` |
| `stage-5` | Technical Analysis I: Charts & Patterns | T2 | 7 — chart-types, trend, support-resistance, volume, does-this-pattern-work, pattern-catalogue, indicators | `candle-sprint` |
| `stage-5b` | Technical Analysis II: The Technician's Toolkit | T2 | 13 — trendlines, fibonacci, reversal-chart-patterns, continuation-patterns, elliott-wave, candlestick-patterns-2, fibonacci-confluence, vwap-volume-profile, pivot-points, bollinger-bands, rsi-divergence, adx-trend-strength, choosing-the-right-tool | — |
| `stage-6` | Fundamental Analysis I: Reading the Numbers | T2 | 5 — financials, profit-vs-cash, valuation, screening, sectors | — |
| `stage-6b` | Fundamental Analysis II: Analyst-Level Detail | T2 | 6 — return-ratios, debt-and-solvency, quality-of-earnings, moat, reading-annual-report, promoter-signals | — |
| `stage-7` | Trading Psychology | T2 | 3 — loss-aversion, anchoring, overtrading | `bias-buster` |
| `stage-8` | Options & Derivatives | T3 | 12 — margin, what-is-a-derivative, futures, call-and-put, strike-prices, options-from-first-principles, greeks, vix, iv, spreads, expiry, hedging | `payoff-builder`, `earnings-roulette` |
| `stage-9` | Professional Risk & Portfolio Management | T4 | 8 — risk-of-ruin, kelly, backtest-pitfalls, microstructure, portfolio, correlation, algo, tax | `risk-roulette` |
| `stage-10` | Market Edge Cases | T5 | 12 — circuit-lock, physical-settlement-trap, short-delivery, freeze-quantity, surveillance, corporate-actions, freak-trades, mtf, pledge, slb, gaps, liquidity | `circuit-breaker` |

All topic files live at `src/content/in/t{tier}-{slug}.ts`, one lesson per file, default-exported, and the exported `id` must exactly match the `SyllabusTopic.id` — this identity is load-bearing (validator rules C6/C7 check it).

**Note**: `docs/course-sequence.md`'s stage-5b / stage-6b "built" counts predate several lessons that have since been written — treat `syllabus.ts` itself as the current source of truth for what's built, not that doc's prose.

## Lesson file shape — `src/lib/lesson/dsl.ts`

```ts
interface Lesson {
  id: string;                 // kebab-case, must match its SyllabusTopic.id
  tier: 'T0'|'T1'|'T2'|'T3'|'T4'|'T5';
  market: 'IN'|'US'|'BOTH';
  title: string;               // 4-90 chars
  summary: string;             // 20-240 chars — shown on the curriculum map
  plainSummary: string;        // 20-280 chars, zero-jargon — shown above objectives (rule R13)
  objectives: string[];        // 1-5, capability-phrased: "size a position from a stop distance"
  prerequisites: string[];     // other lesson ids — validated acyclic + sequence-monotonic
  estimatedMinutes: number;    // 3-40, aim for 8-15
  skills: string[];            // 1-6 — feeds spaced-repetition mastery tracking
  introduces: string[];        // glossary term ids this lesson actually TEACHES, not just uses
  blocks: Block[];             // 3-24 blocks; the validator enforces a minimum amount of interactivity
}
```

**Block kinds** (`Block` is a zod discriminated union):
- `prose` — markdown, ≤1200 chars per block. Keep it short; that's the point.
- `callout` — `tone: 'insight' | 'warning' | 'myth' | 'cost'`.
- `widget` — references a named component in `src/components/widgets/`, plus `props` and a `takeaway` line.
- `predict` — a prompt, 2-5 options, `correct` index, `reveal` text, optional `askWhy`. This is the "ask before you tell" mechanic — most lessons open with one.
- `chart` — snapshot or live source, `mode: 'view' | 'replay' | 'annotate'`.
- `game` — embeds a game inline by slug + config + optional `passScore` (rendered via `renderGame()` in `src/components/games/registry.tsx`).
- `checkpoint` — 1-6 graded tasks, each `decision | compute | construct | classify`; `compute` tasks specify a `metric`, the relevant inputs, and a numeric `tolerance`. Backed by `src/lib/lesson/grading.ts`.
- `example` — a setup plus 2-8 steps, each optionally `compute`-driven (calling into the real engine, e.g. `roundTripTotal`) so worked numbers can never drift out of sync with the actual math.
- `figure` — a named inline-SVG diagram from `src/components/visuals/`.

`INTERACTIVE_KINDS = ['widget','predict','chart','game','checkpoint']`, `SUPPORTING_KINDS = ['example','figure']` (passive, but exempt from the "not a wall of text" rule since they're doing real work).

**Reference lesson to copy the pattern from**: `src/content/in/t1-real-cost-of-a-trade.ts` — opens with a `predict` block, uses four `widget` blocks (`CostReceiptExplainer`, `CostBreakdownTable`, `CostComparator`, `BreakevenSlider`), a `compute`-driven `example`, a `callout`, and closes with a 4-task `checkpoint`.

## Adding a new lesson — order of operations

1. Add a `SyllabusTopic` entry to the right stage in `src/content/syllabus.ts` (with `built: false` initially, or omit `built` — it defaults falsy).
2. Write `src/content/in/t{tier}-{new-slug}.ts`, default-exporting a `Lesson` whose `id` matches the syllabus topic id exactly.
3. Register it: add the import + entry in `src/content/registry.ts`'s `LESSONS` array.
4. Flip `built: true` on the syllabus topic once the lesson file is real and registered.
5. If the lesson states any number in prose (cost figures, statutory rates, historical returns, anything computed) — add a matching `it('claim: ...', ...)` test to `src/content/claims.test.ts` that recomputes it live from the engine (`src/lib/engine/costs/*`, `src/lib/analysis/*`) rather than hardcoding the expected value.
5. Run `pnpm verify` — the lesson/curriculum/syllabus validators (`src/lib/lesson/validator.ts`) will fail loudly on: missing interactivity, prose too long, missing `plainSummary`, jargon used ahead of its declared tier, id mismatch between syllabus/registry/file, or a forward-referencing prerequisite.

Full step-by-step with more narrative: `docs/course-sequence.md`.

## Glossary — `src/content/glossary.ts` (~115 terms)

```ts
type GlossaryCategory = 'basics'|'orders'|'costs'|'charts'|'risk'|'derivatives'|'structure'|'analysis'|'india'|'us';
interface GlossaryEntry {
  id: string; term: string; aliases?: string[]; searchAliases?: string[];
  noAutoLink?: boolean; category: GlossaryCategory;
  plain: string;          // 1-2 sentences, zero unexplained jargon — "is" before "does"
  more?: string;           // optional deeper / jargon-allowed layer
  example?: string;        // concrete numbers
  needs?: string[];        // dependency term ids (cycle-checked)
  neverAfter?: string[];   // preceding words that mean this ISN'T the term (e.g. 'order' right after 'in')
  tier?: Tier;              // earliest tier a learner is expected to meet this term
}
```

Consumed by `src/lib/lesson/annotate.ts` (auto-links the first occurrence of each term in lesson prose), `src/lib/lesson/jargon.ts` (flags unexplained jargon — validator rule C5), and the `/kb` page (`src/app/kb/page.tsx`). `src/content/glossary.test.ts` enforces: no jargon inside a `plain` definition unless it's declared in `needs` (short exemption list: share/price/order/exchange/fill/broker), no dependency cycles, no term depending on something introduced at a later tier.

**Adding a term**: add an entry to `GLOSSARY` in `glossary.ts`, run `pnpm test` — the glossary test suite catches cycles/jargon/tier violations immediately. Full system narrative: `docs/plain-language.md`.

## "Claims" — the numeric fact-checking convention

Not a data file — a testing pattern in `src/content/claims.test.ts`. Every number stated in a lesson's prose (e.g. "a ₹1,00,000 delivery round trip costs about ₹236") gets its own test that recomputes the figure live from the real engine and asserts the lesson text is still correct, within tolerance. This means a statutory rate change (a Budget update to STT, for instance) that makes a lesson's stated number wrong fails CI instead of quietly going stale. Organized per-lesson with `describe` blocks named after the lesson id.

**When adding/editing a lesson with any number in its prose**: add or update the matching claim test in the same PR — this is a hard rule, not a nice-to-have (stated explicitly in `PLAN.md`).

## Games — `src/lib/games/catalogue.ts` + `src/components/games/registry.tsx`

| Slug | Name | Trains | Component | Capstone of |
|---|---|---|---|---|
| `chart-replay` | Chart Replay | Decision-making without hindsight | `src/components/games/ChartReplay.tsx` | stage-3 (also embedded in `t1-journal`) |
| `order-gauntlet` | Order Gauntlet | Order-type selection under pressure | `OrderGauntlet.tsx` | stage-2 |
| `cost-cutter` | Cost Cutter | Cost-drag awareness | `CostCutter.tsx` | stage-2 |
| `chart-replay`'s sibling `the-long-game` | The Long Game | Compounding & sequence risk (real NIFTY 2005-2024 data) | `TheLongGame.tsx` | stage-4 |
| `candle-sprint` | Candle Sprint | Pattern recognition + honest hit rate | `CandleSprint.tsx` | stage-5 |
| `bias-buster` | Bias Buster | Behavioural traps | `BiasBuster.tsx` | stage-7 |
| `payoff-builder` | Payoff Builder | Options structures, graded on payoff shape (modelled) | `PayoffBuilder.tsx` | stage-8 |
| `earnings-roulette` | Earnings Roulette | IV crush, Black-Scholes-priced (modelled) | `EarningsRoulette.tsx` | stage-8 |
| `risk-roulette` | Risk Roulette | Position sizing / risk of ruin (modelled) | `RiskRoulette.tsx` | stage-9 |
| `circuit-breaker` | Circuit Breaker | Edge-case survival | `CircuitBreaker.tsx` | stage-10 |

`modelled: true` on a catalogue entry means the game runs on a statistical/Black-Scholes model rather than real fetched market data (Risk Roulette, Payoff Builder, Earnings Roulette).

**Adding a new game**:
1. Add a `GameEntry` to `GAME_CATALOGUE` in `src/lib/games/catalogue.ts` (`slug`, `name`, `skill`, `blurb`, `intro`, optional `modelled`).
2. Build the component under `src/components/games/`.
3. Register it in `GAMES` in `src/components/games/registry.tsx` — an unregistered slug renders a visible dev-facing error naming the exact file to fix, so this step is hard to forget silently.
4. If it should be a course capstone, add its slug to that stage's `capstoneGames` in `syllabus.ts`.
5. If it should also be embeddable inside a lesson, use a `game` block in the lesson file — it renders via `renderGame()` in the registry.

Supporting (non-game) components: `GameGrid.tsx` (`/play` index), `GameLeaderboard.tsx` (per-game sidebar), `RunSubmit.tsx` (submits a completed run to `/api/progress/run`).

## Where content shows up (routes)

| Route | File | What it does |
|---|---|---|
| `/learn` | `src/app/learn/page.tsx` | Full syllabus road — one column, shows position + continue button + per-stage completion |
| `/learn/course/[stageId]` | `src/app/learn/course/[stageId]/page.tsx` | Single stage/course view |
| `/learn/[lesson]` | `src/app/learn/[lesson]/page.tsx` | Lesson player — "Step N of 84 · Stage name"; resolves Pro-gating server-side before rendering |
| `/play` | `src/app/play/page.tsx` | Game index, reads `GAME_CATALOGUE` |
| `/play/[game]` | `src/app/play/[game]/page.tsx` | Individual game page + per-game leaderboard sidebar |
| `/kb` | `src/app/kb/page.tsx` | Glossary browse/search |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | Global leaderboard — `score = discipline×50 + knowledge×35 + consistency×15`; P&L is shown but never ranked (a disciplined loss ranks above a reckless win — `PLAN.md` §7) |
| `/reasons` | `src/app/reasons/page.tsx` | Learner-submitted trade-thesis feed |
| `/sim` | `src/app/sim/page.tsx` | Standalone simulator |

## Deeper reading

| Question | Doc |
|---|---|
| Exact step-by-step for adding a lesson, and why the stages are ordered this way | `docs/course-sequence.md` |
| How auto-linking/jargon-detection/readability scoring works | `docs/plain-language.md` |
| XP formula, encouragement messages, reasoning feed | `docs/xp-and-reasoning.md` |
| Full per-lesson design log, rejected alternatives, validator rule catalogue | `PLAN.md` |
| Which content/games are free vs. Pro-gated | `docs/payments.md` |
</content>
