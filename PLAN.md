# Market Academy — Build Plan

> Interactive, practical stock-market education. India-first (NSE/BSE), US as a second content pack.
> Real data only — live quotes + real historical OHLCV. No invented numbers, no hand-waving.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## 1. Competitive landscape & the pain points we are solving

I looked at what the incumbents actually do, and where learners get stuck.

| Player | What it does well | Where it fails the learner |
|---|---|---|
| **Zerodha Varsity** | Free, comprehensive, well-written, India-specific | It's a **textbook on a webpage**. Passive reading, no feedback loop, no way to know if you actually understood. Charts are static images. Zero practice. |
| **Investopedia Simulator** | Free, real tickers, portfolio view | **15–20 min delayed data**, static charts, no watchlist, poor mobile. Unlimited fake money → zero consequence. Costs/taxes are not modeled, so P&L is fiction. |
| **TradingView paper trading** | Excellent charts, real data | It's a *tool*, not a *course*. No curriculum, no feedback, no idea what to do next. Assumes you already know. |
| **Babypips** (forex, the best-structured of the lot) | Genuinely good progression, quizzes | Text + quiz. Quizzes test recall, not judgment. Forex-only. |
| **StockGro / Invstr / social sim apps** | Fun, gamified, social | Gamifies **P&L and leaderboards** — which actively teaches the wrong lesson (gambling, not process). Rewards lucky risk-takers. |
| **Udemy / YouTube "courses"** | Cheap, plentiful | Unverifiable claims, survivorship-bias storytelling, no cost/tax reality, often selling something. |

### The eight pain points, and our answer to each

| # | Pain point | Our fix |
|---|---|---|
| P1 | **Passive text.** You read 40 pages and can't do anything. | Lesson schema **structurally forbids** >2 prose blocks in a row. Every concept has a manipulable widget. |
| P2 | **Quizzes test recall, not judgment.** "What is a stop loss?" ≠ knowing when to use one. | **Predict-then-reveal**: you must commit to a decision on a live chart *before* the outcome is shown. Scored on decision quality, not memory. |
| P3 | **Costs and taxes are ignored**, so simulated P&L is a lie. | A real **cost engine** (STT, stamp duty, exchange txn, SEBI, GST, DP charges, brokerage slabs / SEC+TAF+commission). Every fill shows the breakdown. A ₹-accurate tax lesson. |
| P4 | **Paper trading has no friction** — perfect fills, infinite money. | Fill engine models **bid-ask spread, slippage by liquidity, gaps, partial fills, circuit halts, freeze quantity**. Account is small and finite. Blowing it up ends the run. |
| P5 | **Psychology is untrainable on paper** (real, honest limitation). | We can't manufacture fear of real loss. We *can* train the behaviours: **pre-commitment** (thesis + stop must be written and locked before entry), **tilt scenarios** (engineered losing streaks), **process score** that ranks a disciplined loss above a reckless win. |
| P6 | **Edge cases are never taught** — and they're what actually blows accounts. | A dedicated **Edge Cases track** *and* random injection of edge events into the simulator. Full list in §4. |
| P7 | **Backtests lie** (lookahead, survivorship, overfitting) and nobody shows you how. | A lesson where you build a "winning" strategy, then we reveal the lookahead bug in your own result. Replay engine is **strictly bar-by-bar — future bars are not in memory**, so cheating is impossible by construction. |
| P8 | **No sense of progress or retention.** | XP + streaks + **mastery decay** (spaced repetition — skills fade and must be refreshed) + **boss challenges** that gate tier progression. Leaderboards rank *process score*, never raw P&L. |

---

## 2. Architecture

Next.js 16 App Router · TypeScript (strict) · Tailwind 4 · Zustand · lightweight-charts.
Persistence: node:sqlite locally, Turso (libSQL) in production, behind one interface — see §3l.

```
market-academy/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                    landing
│  │  ├─ learn/                      curriculum map + lesson player
│  │  │  └─ [track]/[lesson]/
│  │  ├─ play/[game]/                games hub
│  │  ├─ sim/                        full trading simulator
│  │  ├─ progress/                   mastery dashboard
│  │  └─ api/
│  │     ├─ quote/                   live quotes   (cache 15s)
│  │     ├─ history/                 real OHLCV    (cache 1h)
│  │     ├─ search/                  symbol lookup
│  │     ├─ auth/                    register · login · logout · me
│  │     ├─ progress/                snapshot sync · game runs
│  │     ├─ leaderboard/             rankings
│  │     └─ reasons/                 public reasoning feed
│  │  ├─ kb/                         glossary / knowledge base
│  │  ├─ leaderboard/                rankings page
│  │  ├─ reasons/                    why other learners traded
│  │  ├─ login/ register/ account/   accounts
│  ├─ lib/
│  │  ├─ market/                     data layer (provider iface, live, snapshots, cache)
│  │  ├─ db/                         Db interface + node:sqlite / libSQL drivers, repositories, migrations
│  │  ├─ auth/                       scrypt hashing, session cookies
│  │  ├─ engine/                     order · matching · costs · portfolio · risk · options
│  │  ├─ lesson/                     lesson DSL, validator, readability, glossary annotation
│  │  └─ progress/                   XP gates, mastery decay, process score, persistence
│  ├─ components/
│  │  ├─ widgets/                    ~25 interactive primitives
│  │  ├─ chart/                      candle/replay/payoff charts
│  │  ├─ learn/                      the course track
│  │  ├─ visuals/                    inline-SVG figures
│  │  └─ games/                      ten games + run submission
│  └─ content/
│     ├─ syllabus.ts                the ordered road: 10 stages, 60 steps
│     ├─ glossary.ts                ~74 defined terms, auto-linked into prose
│     ├─ in/                        India curriculum
│     └─ us/                        US curriculum
└─ data/snapshots/                   bundled real OHLCV (offline + deterministic replays)
```

### Data layer — real data, two paths

* **Live** — `yahoo-finance2` behind our own API routes. Covers NSE (`RELIANCE.NS`, `^NSEI`) and US (`AAPL`, `^GSPC`) with one interface. Server-side, cached, rate-limited. Used for: live quote widgets, "trade today's market", current option chain.
* **Historical** — same provider for arbitrary lookups, **plus bundled real OHLCV snapshots** committed to the repo for every scripted replay. This is deliberate: a lesson that depends on a network call is a lesson that breaks. Snapshots make every learner's replay byte-identical, and the app works offline.
* **Never** synthetic prices presented as real. If a widget uses generated data (e.g. a Monte-Carlo ruin simulator), it is labelled as a model, not a market.

### Fill engine — why simulated P&L will be honest

Order → validate (margin, freeze qty, circuit band, tick size, lot size) → match against the bar's real OHLC with a spread model → apply slippage scaled by the bar's volume vs. its 20-bar average → partial fill if size > available liquidity → apply the full cost stack → update position, margin, and drawdown.

---

## 3. Curriculum — one sequence, 11 stages, 71 steps — COMPLETE

(This section's tier table below predates the full build and is stale — §3f
and §3m are the authoritative counts and per-stage detail.)

Each lesson = 8–15 min, 6–12 blocks, ≥60% interactive, at least one worked example
followed within three blocks by a question about it, and a graded checkpoint that
asks the learner to produce an answer rather than recognise one.

The tiers below are how difficulty is priced and how mastery decay is grouped.
The learner never navigates them: `/learn` is one numbered road of 71 steps, and
the mapping from stages to tiers is in §3f and §3m.

**T0 · Foundations** (8, `1 built`) — what a share actually is · exchange vs broker vs depository · demat & the settlement chain · order book mechanics · T+1 · who's on the other side of your trade
**T1 · Beginner** (18, `4 built`) — order types · the real cost of a trade · reading candles honestly · position sizing · index vs stock · SIP & compounding · your first full trade end-to-end
**T2 · Intermediate** (20, `2 built`) — technical analysis *with base rates* (does this pattern actually work?) · volume · support/resistance as zones · fundamentals · reading a P&L and balance sheet · valuation · screening
**T3 · Advanced** (22, `1 built`) — futures · options from first principles · greeks (interactive, not formulas) · spreads & payoffs · IV and IV crush · hedging · expiry mechanics
**T4 · Pro** (18, `2 built`) — risk of ruin math · Kelly and why you shouldn't use full Kelly · backtest pitfalls · market microstructure · algo basics · portfolio construction · tax optimisation
**T5 · Edge Cases** (24, `1 built`, unlocked progressively) — see §4

---

## 4. Edge cases we will actually cover

These are the things that blow up real accounts and appear in no beginner course.

**India:** circuit limits & price bands · ASM / GSM surveillance · freeze quantity · short delivery & auction settlement · physical settlement of stock F&O on expiry (the modern account-killer — note the old "STT on exercised ITM options" trap was **removed on 2019-09-01** and the folklore is out of date) · peak margin penalties · corporate action strike adjustment · bonus/split/rights/buyback · ex-date gaps · illiquid option freak trades · upper-circuit trap (can't exit) · muhurat/special sessions · SLB · pledge & haircut · MTF risk · T+1 vs T+0 pilot.

**US:** LULD halts & limit states · PDT rule · wash sale · assignment risk on short options · pin risk at expiry · dividend-driven early assignment on calls · hard-to-borrow & buy-ins · after-hours liquidity traps · reverse splits & delisting · SSR (short sale restriction) · options multiplier changes after corp actions · settlement/GFV in cash accounts.

**Universal:** gap risk over weekends · liquidity evaporation in a crash · slippage on stops in a fast market · stop-hunting · survivorship bias · lookahead bias · overfitting · sequence-of-returns risk · correlation going to 1 in a drawdown.

---

## 5. Games — each teaches one specific, measurable skill

| Game | Skill it trains | Mechanic | Built |
|---|---|---|---|
| **Chart Replay** *(core engine)* | Decision-making without hindsight | Real historical bars fed one at a time. Future is not loaded. Long/short/flat + stop each bar. | `[x]` |
| **Order Gauntlet** | Order-type selection | Timed scenarios → pick market/limit/SL/SL-M/bracket/GTT. Wrong choice shows what it would have cost. | `[x]` |
| **Cost Cutter** | Cost drag awareness | Same trade idea, different holding period/instrument/broker. Minimise total cost. | `[x]` |
| **Risk Roulette** | Position sizing & ruin | Same edge, different bet size, real random draws. Watch 20%-per-trade go bankrupt. | `[x]` |
| **Payoff Builder** | Options structures | Drag legs to match a target payoff diagram, priced with real IV. | `[x]` |
| **Circuit Breaker** | Edge-case survival | Halts, gaps, upper-circuit lock-in. Get out alive. | `[x]` |
| **Earnings Roulette** | IV crush | Buy the straddle before results, watch premium evaporate on a correct direction call. | `[x]` |
| **Bias Buster** | Behavioural traps | Framing, anchoring, disposition effect — you fall for it, then it's explained. | `[x]` |
| **Candle Sprint** | Pattern recognition speed | Rapid-fire ID, with honest hit-rate stats shown after. | `[x]` |
| **The Long Game** | Compounding & sequence risk | 30-year horizon, real historical return sequences, inflation-adjusted. | `[x]` |

---

## 6. Milestones

**Status legend:** `[x]` done and tested · `[~]` in progress · `[ ]` not started

Current state: **638 unit tests green**, plus 5 live-network tests run on demand.
Typecheck clean, lint clean, production build clean, 27 routes serving.

**M2 is complete.** All six tier-representative lessons and all ten games ship.
**Eleven lessons now**, every one carrying a worked example and at least one diagram.

---

### M1 · Foundation — `[x]` COMPLETE

| Piece | Status | Where |
|---|---|---|
| Scaffold (Next 16, TS strict, Tailwind 4, vitest) | `[x]` | — |
| Design tokens + landing page | `[x]` | `src/app/globals.css`, `src/app/page.tsx` |
| Data layer: provider, TTL cache + coalescing, rate limiter | `[x]` | `src/lib/market/` |
| API routes `/api/quote` `/api/history` `/api/search` | `[x]` | `src/app/api/` |
| Live + historical data verified against real NSE and US markets | `[x]` | `src/lib/market/live.integration.test.ts` |
| Cost engine IN + US, every rate cited and dated | `[x]` | `src/lib/engine/costs/` |
| Circuit breakers, price bands, LULD | `[x]` | `src/lib/engine/halts.ts` |
| Order types + exchange-grade validation | `[x]` | `src/lib/engine/order.ts` |
| Fill engine: spread, impact, partial fills, gaps, circuit locks | `[x]` | `src/lib/engine/fill.ts` |
| Lesson DSL + validator (9 lesson rules, 4 curriculum rules) | `[x]` | `src/lib/lesson/` |
| Mastery decay, process score, XP, streaks | `[x]` | `src/lib/progress/mastery.ts` |
| Portfolio, P&L, drawdown, size-from-stop | `[x]` | `src/lib/engine/portfolio.ts` |

---

### M2 · Vertical slice — `[x]` COMPLETE

| Piece | Status | Where |
|---|---|---|
| Replay engine — private bars, one-way cursor, guarded reveal | `[x]` | `src/lib/engine/replay.ts` |
| Server-side bar streaming (future never reaches the client) | `[x]` | `src/lib/replay/server-session.ts` |
| Progress store (localStorage, write-once commitments) | `[x]` | `src/lib/progress/store.ts` |
| Widget registry + cost/expiry/settlement widgets | `[x]` | `src/components/widgets/` |
| Lesson player with gating and server-held answers | `[x]` | `src/components/lesson/`, `src/lib/lesson/sanitize.ts` |
| Checkpoint grading: decision / compute / construct / classify | `[x]` | `src/lib/lesson/grading.ts` |
| Candle chart (lightweight-charts v5) | `[x]` | `src/components/chart/CandleChart.tsx` |
| Games: Chart Replay · Risk Roulette · Cost Cutter | `[x]` | `src/components/games/` |
| The full simulator at `/sim` (pure reducer + thin UI) | `[x]` | `src/lib/sim/reducer.ts`, `src/components/sim/` |
| Routes `/learn` `/play` `/sim` `/progress` + 404 + error boundary | `[x]` | `src/app/` |
| Content-claim tests (prose figures checked against the engine) | `[x]` | `src/content/claims.test.ts` |
| Lesson T1 · The real cost of a trade | `[x]` | `src/content/in/t1-real-cost-of-a-trade.ts` |
| Lesson T4 · Why a good strategy still goes broke | `[x]` | `src/content/in/t4-risk-of-ruin.ts` |
| Lesson T5 · The ₹2,000 option that owes ₹7,00,000 | `[x]` | `src/content/in/t5-physical-settlement-trap.ts` |
| Lesson T0 · Who is on the other side of your trade | `[x]` | `src/content/in/t0-order-book.ts` |
| Lesson T2 · Does this pattern actually work? | `[x]` | `src/content/in/t2-does-this-pattern-work.ts` |
| Lesson T3 · An option is a bet with a clock on it | `[x]` | `src/content/in/t3-options-from-first-principles.ts` |

---

### M3 · Content scale-out — `[x]` COMPLETE — engines, widgets, games, accounts, glossary and all 65 lessons

#### 3a. Shared engines — `[x]` COMPLETE

Built first because the lessons and games both depend on them.

| Engine | Status | Tests | Where |
|---|---|---|---|
| Order book model + market-order walk | `[x]` | 21 | `src/lib/analysis/orderbook.ts` |
| Options: Black–Scholes, greeks, IV solve, payoff profiles | `[x]` | 36 | `src/lib/engine/options.ts` |
| Pattern detection + base rates + significance verdicts | `[x]` | 19 | `src/lib/analysis/patterns.ts` |
| `/api/patterns` — scores patterns against real history | `[x]` | — | `src/app/api/patterns/route.ts` |
| Compounding, inflation, sequence-of-returns risk | `[x]` | 21 | `src/lib/games/compounding.ts` |
| Risk of ruin + Kelly | `[x]` | 16 | `src/lib/games/ruin.ts` |
| Seeded RNG (models only, never prices) | `[x]` | — | `src/lib/util/rng.ts` |

#### 3b. Lesson widgets — `[x]` COMPLETE

| Widget | For | Status |
|---|---|---|
| `OrderBookLadder` — manipulable depth ladder, shows what a market order eats | T0 | `[x]` |
| `SettlementChain` — order → exchange → clearing → depository → T+1 | T0 | `[x]` |
| `PatternBaseRate` — hit rate vs base rate on real data, with the verdict | T2 | `[x]` |
| `PatternScanner` — pick a symbol, score every pattern, sort by edge | T2 | `[x]` |
| `GreeksExplorer` — drag spot/time/IV, watch the greeks move | T3 | `[x]` |
| `PayoffChart` — payoff diagram with breakevens and unbounded-arrow honesty | T3 | `[x]` |

#### 3c. Games — `[x]` ALL TEN SHIP

| Game | Skill trained | Engine it needs | Status |
|---|---|---|---|
| **Order Gauntlet** | Order-type selection under time pressure | `order.ts` validator | `[x]` |
| **Payoff Builder** | Options structures | `options.ts` | `[x]` |
| **Circuit Breaker** | Edge-case survival: halts, gaps, upper-circuit lock-in | `halts.ts`, `fill.ts` | `[x]` |
| **Earnings Roulette** | IV crush — right direction, still lose | `options.ts` | `[x]` |
| **Bias Buster** | Framing, anchoring, disposition effect | content only | `[x]` |
| **Candle Sprint** | Pattern recognition, then the honest hit rate | `patterns.ts` | `[x]` |
| **The Long Game** | Compounding and sequence risk over 30 years | `compounding.ts` | `[x]` |

#### 3d. Worked examples and diagrams — `[x]` COMPLETE

Two additions that change how every lesson teaches, not just what it contains.

| Piece | Status | Where |
|---|---|---|
| `example` block kind — numbered, step-by-step walkthroughs | `[x]` | `src/lib/lesson/dsl.ts` |
| Engine-computed example values (17 functions) | `[x]` | `src/lib/lesson/examples.ts` |
| `figure` block kind — inline SVG diagrams | `[x]` | `src/lib/lesson/dsl.ts` |
| `CandleAnatomy` — draggable OHLC, names the shape you build | `[x]` | `src/components/visuals/candle-anatomy.tsx` |
| `SpreadDiagram` · `SettlementTimeline` · `LongShortDiagram` · `CompoundingCurve` · `RiskRewardDiagram` | `[x]` | `src/components/visuals/diagrams.tsx` |
| **R10** — every lesson MUST contain a worked example | `[x]` | `src/lib/lesson/validator.ts` |
| **R11** — example steps must produce numbers, not just prose | `[x]` | `src/lib/lesson/validator.ts` |
| **R12** — raw text capped at 35% of any lesson | `[x]` | `src/lib/lesson/validator.ts` |

Two design decisions worth keeping:

- **Example values are computed, not typed.** A step carries a `compute` spec
  evaluated by the same engines that fill real trades. A worked example
  therefore cannot go stale — change a statutory rate and every walkthrough in
  the course re-derives itself. `examples.test.ts` verifies every shipped step
  evaluates, and that no example hardcodes all of its values.
- **Diagrams are drawn in code, never shipped as images.** They inherit the
  theme, scale to any width, cost nothing to download, and several respond to
  input — which no PNG can. None of them depict market data; they depict
  mechanisms, which is why they can be drawn from first principles without
  violating §7.1.

**R1 was also re-derived.** It previously measured interactive blocks against
ALL blocks, which meant adding a diagram or a worked example pushed a lesson
toward failing. The denominator is now interaction-plus-text: supporting blocks
are excluded entirely, and R12 caps raw text separately. The two rules together
say *interaction beats text, and text is a minority regardless* — which is what
the rule always meant.

#### 3e. Chart indicators — `[x]` COMPLETE

TradingView-style technical analysis, available inside the games.

| Piece | Status | Where |
|---|---|---|
| Indicator engine: SMA, EMA, Wilder, RSI, MACD, Bollinger, ATR, VWAP | `[x]` | `src/lib/analysis/indicators.ts` |
| Multi-pane chart with overlays and indicator panes | `[x]` | `src/components/chart/CandleChart.tsx` |
| Toolbar with live readouts and warm-up notices | `[x]` | `src/components/chart/ChartToolbar.tsx` |
| Entry/stop price lines drawn on the chart | `[x]` | `CandleChart` `priceLines` |
| Wired into Chart Replay | `[x]` | `src/components/games/ChartReplay.tsx` |

**The property that matters**: every indicator is CAUSAL. `value[i]` is computed
from `bars[0..i]` only, and the tests prove it — computing an indicator over a
prefix must produce byte-identical values to computing it over the whole series
and truncating. A centred smoother or a forward-anchored VWAP would fail that
test loudly. This is what lets indicators appear in Chart Replay at all: they
draw from exactly the bars the learner can see, so they cannot leak the future
that the server-side streaming works so hard to withhold.

Warm-up is surfaced rather than hidden. A learner who enables SMA 50 twenty bars
into a replay is told "needs 50 bars, has 20" instead of staring at a blank
overlay and filing a bug — which turns an apparent defect into a small lesson
about what a moving average actually is.

#### 3f. Curriculum — `[x]` COMPLETE · 65 of 65 steps written

**The whole course ships.** One ordered road, 10 stages, 65 steps, zero to
professional, in `src/content/syllabus.ts`. `/learn` renders it as a single
numbered track at every screen width, and there is no longer a "not written yet"
label anywhere on it. Full write-up in `docs/course-sequence.md`.

Every stage is titled with the plain-English QUESTION it answers, because a
beginner does not know they want "market microstructure"; they know they want to
know why their order filled at a worse price than the screen showed.

| # | Stage | Question | Tier | Steps |
|---|---|---|---|---|
| 1 | Ground floor | What am I actually buying, and who sells it to me? | T0 | 6 |
| 2 | Placing a trade | How do I buy without getting a worse price than I expected? | T1 | 5 |
| 3 | Staying alive | How do I make sure one bad trade does not end this? | T1 | 4 |
| 4 | Owning for years | What if I do not want to trade at all? | T1 | 4 |
| 5 | Reading a chart honestly | Do the patterns everyone draws actually predict anything? | T2 | 6 |
| 6 | Reading a business | Is this company worth what it costs? | T2 | 5 |
| 7 | Your own head | Why do I keep doing what I promised myself I would not? | T2 | 3 |
| 8 | Leverage and derivatives | How do futures and options work, and why do they end so many accounts? | T3 | 12 |
| 9 | Thinking like a professional | How do people who do this for a living decide anything? | T4 | 8 |
| 10 | The things that end accounts | What is going to happen that nobody warned me about? | T5 | 12 |

Every step carries a worked example, a question about that example, and a graded
checkpoint that asks the learner to produce an answer rather than recognise one.
Every numeric claim in prose is covered by `claims.test.ts`. **1,122 tests pass.**

##### The ordering decisions worth defending

- **Survival before selection.** Stage 3 (sizing, stops, expectancy) comes before
  charts and before accounts. A good idea at the wrong size still bankrupts you.
- **Holding is offered before trading.** Stage 4 says plainly that most people
  are better served owning an index for years. A site that monetised activity
  could not put that at step 16.
- **Behaviour after the first real decisions.** A bias you have already fallen
  for teaches more than one described in advance, so stage 7 follows the stages
  where the learner has actually chosen something.
- **Edge cases last.** Each one only makes sense once the normal case is second
  nature, and the final step is the assumption all 64 others rest on.

##### The through-line

The course opens on "where does your ₹14,000 actually go" and closes on "the
buyers have left and there is no price at all". Between them, one rule recurs at
every scale and is named again in the last checkpoint: **decide the loss you can
accept before you enter, and let it set the size.** It appears as position
sizing in stage 3, as Kelly in stage 9, as portfolio limits, and finally as the
only protection that still functions when stops, diversification and the order
book have all stopped working.

Several lessons exist mainly to defuse something:

- **What a share is** — buying on the exchange gives the company nothing.
- **What moves a price** — not good news; news better than expected.
- **The ten named patterns** — all tested at once, and the folklores contradict
  each other (three down days is capitulation, three up days is momentum).
- **Volume** — every trade has a buyer and a seller, so "more buyers than
  sellers" cannot be true of anything.
- **Indicators** — arithmetic on prices already on screen; an N-bar average is
  about N/2 bars behind, always.
- **Rupee-cost averaging** — worse than a lump sum on average, and right anyway,
  for a behavioural reason that survives being stated accurately.
- **Valuation** — a multiple is a sentence about expectations, not a score.
- **Hedging** — negative expected return, and still sometimes rational.
- **Kelly** — half of it costs a quarter of the growth; twice it costs all of it.

##### Still open

- [ ] Boss challenges gating stage progression
- [ ] US content pack (`src/content/us/`) — the syllabus is India-only today
- [ ] A second pass on stage 6 once a financial-statement widget exists; those
      five lessons lean on predicts and examples because no widget renders
      accounts yet

#### 3g. Accounts, database and ranking — `[x]` COMPLETE

Full write-up in `docs/accounts-and-ranking.md`.

| Piece | Status | Where |
|---|---|---|
| SQLite via `node:sqlite` — no native module, no service, no connection string | `[x]` | `src/lib/db/` |
| scrypt password hashing at OWASP 2024 parameters, self-describing hash format | `[x]` | `src/lib/auth/password.ts` |
| Sessions: 32-byte token, stored SHA-256 hashed, httpOnly cookie, 30-day sliding | `[x]` | `src/lib/db/users.ts` |
| Sign-in throttling keyed on email **and** address, so nobody can lock a stranger out | `[x]` | `loginBackoffSeconds` |
| Register / login / logout / me / delete-account routes | `[x]` | `src/app/api/auth/` |
| Sign-in, sign-up and account pages | `[x]` | `/login`, `/register`, `/account` |
| Progress sync that MERGES rather than overwrites | `[x]` | `src/lib/db/progress.ts` |
| Game runs scored server-side from trade records | `[x]` | `/api/progress/run` |
| Leaderboard: overall, discipline, knowledge, consistency + per-game | `[x]` | `src/lib/db/leaderboard.ts`, `/leaderboard` |
| Account deletion that actually deletes, via cascades | `[x]` | `DELETE /api/auth/me` |

**The leaderboard ranks process, not profit**, which is §7 rule 4 made
structural. P&L is stored, shown in a greyed unsortable column, and is an input
to nothing. Four tests hold that line: a disciplined loser outranks a reckless
winner; multiplying every P&L by 100 moves no rank and no score;
`leaderboardInputs()` enumerates what a rank is made of and `pnl` is not in it;
and no index in the schema mentions `pnl`, so ranking by it is not even cheap.

Verified live against a production build: rank 1 was down ₹7,200, rank 2 was up
₹4,50,000. A client posting `processScore: 100` for a reckless trade was scored
0.3.

Still open, and each is a real gap rather than an oversight: **no password
reset** (needs a mail provider), no OAuth, no admin UI, no registration rate
limit beyond the shared HTTP limiter.

#### 3h. Plain language and the knowledge base — `[x]` COMPLETE

Full write-up in `docs/plain-language.md`.

Prompted by the question "are the lessons in layman terms?", which was worth
measuring rather than guessing. The audit found **192 uses of jargon across 11
lessons with zero definitions attached** — because plain STYLE is not plain
VOCABULARY. "Price pauses where resting orders sit" has no long words in it and
is opaque to anyone who does not know what an order is.

| Piece | Status | Where |
|---|---|---|
| Glossary of ~74 terms, each defined for someone who has never traded | `[x]` | `src/content/glossary.ts` |
| Automatic first-occurrence linking — authors mark up nothing | `[x]` | `src/lib/lesson/annotate.ts` |
| Tap-to-define popover, on phone as well as desktop | `[x]` | `src/components/lesson/GlossaryPopover.tsx` |
| Searchable glossary page, searching definitions and not just terms | `[x]` | `/kb` |
| `plainSummary` on every lesson, shown above the objectives | `[x]` | DSL + `LessonPlayer` |
| Rule C5 — a lesson may not lean on vocabulary from a later tier | `[x]` | `validator.ts` |
| Rule R13 — every lesson needs a jargon-free plain summary | `[x]` | `validator.ts` |
| `introduces` on the lesson DSL, inherited down the prerequisite graph | `[x]` | `dsl.ts`, `jargon.ts` |

C5 found 17 real cases on first run and each was resolved: reworded where the
term taught nothing, declared in `introduces` where the lesson genuinely teaches
it, or fixed as a false positive — `t1-position-sizing` said "the first option",
meaning the first multiple-choice answer, which would have shown a beginner a
definition of a derivatives contract.

Still open: nothing checks reading level, `more` and `example` text is unchecked
(only `plain` is), and — the largest gap by far — **no lesson has been tested on
an actual beginner.** Every claim here is about structure, not about whether it
works on a person.

#### 3i. Infrastructure for scale — `[ ]`

- [ ] Bundled OHLCV snapshots in `data/snapshots/` for deterministic, offline replays
- [ ] Spaced-repetition review queue surfaced in the UI (engine exists, no screen yet)
- [ ] Random injection of edge events into the simulator (PLAN §4)

---

#### 3j. XP, the result gate, and the reasoning feed — `[x]` COMPLETE

Full write-up in `docs/xp-and-reasoning.md`.

**Five gates, and the ORDER of them is the design.** Four are about the
decision; the fifth asks whether it paid, and can only be reached by a run that
already cleared the other four. A profitable run that risked a fifth of the
account never gets there. So the result is a multiplier on a decision already
judged sound, never a way to buy past a bad one.

| # | Gate | Threshold | About |
|---|---|---|---|
| 1 | A reason you can defend | ≥ 40 characters | the decision |
| 2 | Reward worth the risk | mean planned R:R ≥ 1.5:1, and every trade had a target | the decision |
| 3 | No gambling markers | no trade over 6% of equity, no stop moved or ignored | the decision |
| 4 | Process floor | `processScore` ≥ 60 | the decision |
| 5 | The plan paid | net P&L > 0 | the result |

- [x] XP weighted upward for a better process score AND a better planned ratio: 90 for a bare clearance, 200 for perfect process on a 4:1 plan
- [x] XP does **not** scale with the size of the win — winning is a gate, not a quantity, or the biggest risk-taker wins again
- [x] A losing run earns nothing and gets a randomised, run-stable encouragement
- [x] Five message pools, picked by FNV-1a hash of the run id rather than `Math.random()`, so one run always shows one message
- [x] A test forbids any message that predicts a future result — "you're due" is the voice this site argues with
- [x] Encouragement renders ABOVE the gate list; a column of red crosses is not what to read first after a stop-out
- [x] `stoppedOut` on `TradeRecord` — a genuinely different question from `honouredStop`
- [x] Chart Replay records whether the stop was actually reached

**The leaderboard stayed outcome-blind.** Game XP now carries an outcome
signal, and the knowledge component used to read total XP — so winning would
have bought rank, quietly. `user_stats` splits `lesson_xp` (checkpoints, ranked)
from `game_xp` (winning runs, not ranked), with `xp` kept as the sum for
display. A test plays ten large winning runs and asserts every rank and score is
identical afterwards.

The split also closed a latent sync bug: client XP used to be written straight
to `xp`, so a phone that had never played would have wiped out game XP earned on
a laptop. `IncomingSnapshot` and `Snapshot` are now separate types, so
server-owned totals cannot be authored by a browser.

**Everything is recorded.** `game_runs` carries `process_json`, `reason`,
`planned_rr`, `xp_awarded`, `outcome`, `stopped_out`, `winning_trades`,
`losing_trades` and `encouragement`. `user_stats` carries `lesson_xp`,
`game_xp`, `xp`, `net_pnl`, `runs`, `wins`, `losses`, `best_process`. P&L
accumulates whichever way a run went — a scoreboard that only added up the good
runs would be the same lie as a broker's marketing page.

- [x] `/reasons` — public reasoning feed, newest-first, opt-in only, P&L greyed and last
- [x] Additive migrations in `src/lib/db/migrate.ts`, with a test asserting they are a no-op on a fresh database

#### 3k. Responsive across every screen — `[x]` COMPLETE

- [x] Header: inline above `lg`, disclosure panel below it, closing on route change, Escape and tap
- [x] Every page padded mobile-first (`px-4 py-10 sm:px-6 sm:py-16`) instead of at desktop values
- [x] Leaderboard becomes a card list below `md` — eight columns behind a horizontal scrollbar is technically responsive and practically unreadable
- [x] Cost widget's three-figure row collapses to one column below `sm`
- [x] `body { overflow-x: clip }` — not `hidden`, which would create a scroll container and break the sticky header
- [x] Media capped at `max-width: 100%`; long unbroken tokens wrap; range inputs given a 28px touch target
- [x] Explicit `viewport` export with `viewportFit: 'cover'`, pinch-zoom deliberately left enabled

#### 3l. Hostable on a free tier — `[x]` COMPLETE

Full write-up in `docs/hosting.md`.

**GitHub Pages cannot serve this, and the reason is a feature.** `next build`
reports all 36 routes as `ƒ (Dynamic)`. Three things are server-side on purpose:
answers are stripped before a lesson crosses into client code (§7.5), the replay
engine holds no future bars and exposes no bar-index endpoint (§7.2), and
sessions are httpOnly cookies checked against a database. A static export does
not degrade those — it deletes them.

So: **Vercel + Turso**, both free, nothing lost.

Persistence now goes through the `Db` interface in `src/lib/db/driver.ts`:

| Where | Driver | Why |
|---|---|---|
| Local dev, CI, every test | `node:sqlite` | No account, no network, no credentials. `git clone && pnpm dev` has to work. |
| Production | `@libsql/client` → Turso | No free host gives you a disk that survives a deploy. |

- [x] `chooseBackend()` picks libSQL whenever `TURSO_DATABASE_URL` is set, so a deploy cannot silently fall back to a local file it does not have
- [x] Turso speaks the SQLite dialect, so schema, queries and migrations are the same text against both — no query builder, no dialect layer
- [x] Every repository function is async; the interface could not be otherwise, because a remote database cannot be made synchronous
- [x] `tx(fn)` hands the callback its OWN `Db` — a remote transaction runs on its own connection, so a statement issued against the outer handle would execute *outside* it, silently, and only in production
- [x] Integer columns normalised at the boundary: the remote driver returns bigint where node:sqlite returns number
- [x] libSQL rows rebuilt from `columns` rather than spread — a raw row carries numeric aliases and `length` alongside the real fields
- [x] `getDb()` caches the promise, not the handle, so a cold start does not race two schema creations; a failed init is not cached
- [x] `/api/health` reports which backend is live — a deploy writing to a disk that will vanish otherwise looks perfectly healthy
- [x] 11 driver-contract tests: commit, rollback-and-rethrow, nested-joins-outer, foreign keys on, row shape, per-call isolation

Verified end to end against a running server: register → file a winning run
(178 XP) → three stop-outs (0 XP, varied encouragement, P&L still accumulated)
→ a reckless 90,000 win (0 XP, two gates failed). The leaderboard showed
knowledge 0.0 throughout, with 178 game XP on the account — outcome-blind, as
designed.

#### 3m. Technical-analysis toolkit — drawing tools and chart patterns — `[x]` COMPLETE

**Why this stage exists.** The course already tests candlestick patterns and
support/resistance against real base rates (§3f, stage 5). What it does not yet
cover is the rest of the technician's actual toolkit — the things a trader
draws on a chart by hand: trendlines, Fibonacci levels, the named reversal and
continuation SHAPES (head and shoulders, double top/bottom, triangles, flags),
Elliott wave counts, and the three-candle patterns the ten-pattern catalogue
left out (evening star, morning star, three white soldiers/crows, harami).
Requested explicitly, with the instruction to research beyond the named
examples and to prefer a short animated visual over a static image wherever
one can show HOW something is drawn rather than just what it looks like.

**The honesty problem this stage has to solve.** Candlestick patterns are a
few-bar boolean rule — `patterns.ts` can detect one on 20,000 real bars and
report a real base rate, which is exactly what stage 5 already does. A
trendline, a Fibonacci grid, a head-and-shoulders or an Elliott wave count is
not a boolean rule. Two competent chartists draw the same chart differently.
That is not a gap in this course's rigor — it is the actual, honest fact about
these tools, and pretending otherwise (by inventing a detector and reporting a
number as if it were as solid as the candlestick base rates) would be a worse
failure than not testing them at all. So the house style for THIS stage is
different from stage 5's: rather than "here is the measured edge", it is
"here is the mechanism, here is exactly how to draw it, and here is why two
people drawing it will not agree" — the same scepticism the course already
applies everywhere, aimed at a class of tool where subjectivity is the
finding rather than an oversight.

**Where real testing IS possible, it is still done.** The three-candle
patterns extend `PATTERNS` in `src/lib/analysis/patterns.ts` with real
detectors — evening star, morning star, three white soldiers, three black
crows, bullish harami, bearish harami — and get the same `PatternScanner` /
`PatternBaseRate` treatment as the existing ten, because that IS mechanically
testable. The line between "testable" and "a judgement call" is drawn
explicitly in the Elliott wave lesson, because that is the sharpest case of
it: the same five swings can be labelled as a complete five-wave impulse or
as wave 3 of a larger one, and both labellings survive contact with the
chart. That is not a shortcoming of the learner's technique. It is the
reason professional Elliott wave counts disagree with each other in real
time, and the lesson says so.

**Visual design — short animation instead of a video.** No lesson in this
course ships a video file or a GIF; every diagram is inline SVG so it
inherits the theme, stays sharp at any width, and costs nothing to download
(`docs/plain-language.md` §2 explains why). This stage is the first to
animate them: `framer-motion` has been a dependency since the project
started and unused until now (M4 noted this explicitly). A new
`src/components/visuals/ta-tools.tsx` holds five parameterised, autoplaying
figures that step through HOW a tool is drawn, with a replay control:

- `TrendlineFigure` — places two swing points, draws the line through them,
  then shows a third touch confirming it and a break invalidating it.
- `FibonacciFigure` — anchors a swing low and swing high, draws the
  retracement grid level by level (23.6/38.2/50/61.8/78.6), then the two
  common extension levels (161.8/261.8) projected beyond the swing.
- `ChartPatternFigure` — one component, five `pattern` values
  (`head-shoulders` · `inverse-head-shoulders` · `double-top` ·
  `double-bottom` · `triangle`), draws the shape, the neckline, and the
  measured-move projection.
- `ElliottWaveFigure` — labels five impulse waves then three correction
  waves in sequence, then replays the SAME price path with an alternative,
  equally defensible count to make the subjectivity point concrete rather
  than asserted.
- `CandlestickTrioFigure` — three candles appearing in sequence for the
  evening-star/morning-star family, extending the `CandleAnatomy` visual
  language from stage 2.

**New syllabus stage.** Inserted as `stage-5b` in `src/content/syllabus.ts`,
between stage 5 (Reading a chart honestly) and stage 6 (Reading a business) —
after the base-rate scepticism of stage 5 is established, before valuation.
Tier T2, question: *"How do traders actually mark up a chart — and which of
those markings mean anything?"*

| Topic id | Title | Tests against real data? |
|---|---|---|
| `in-t2-trendlines` | Drawing a trendline that means something | No — mechanism + subjectivity |
| `in-t2-fibonacci` | Fibonacci retracement and extension | No — mechanism + reflexivity argument |
| `in-t2-reversal-chart-patterns` | Head and shoulders, double tops and double bottoms | No — mechanism + measured-move arithmetic |
| `in-t2-continuation-patterns` | Triangles, flags and wedges: pauses, not reversals | No — mechanism, contrasted with stage-5 rigor |
| `in-t2-elliott-wave` | Elliott wave: the count nobody can agree on | No, by design — the disagreement IS the lesson |
| `in-t2-candlestick-patterns-2` | Evening star, morning star, and the three-candle patterns | **Yes** — real `PatternScanner`/`PatternBaseRate` |

**New glossary entries**, tier T2, category `charts` unless noted:
`swing-point` · `trendline` · `fibonacci-retracement` · `neckline` ·
`head-and-shoulders` · `double-top` · `measured-move` · `elliott-wave`
(category `analysis`). `vwap` already exists and is already taught in
`in-t2-indicators`; a volume-profile lesson was scoped out — see "still open".

**Progress — `[x]` COMPLETE**

- [x] Plan written here
- [x] Glossary entries (8) — `swing-point` · `trendline` · `fibonacci-retracement` ·
      `neckline` · `head-and-shoulders` · `double-top` · `measured-move` ·
      `elliott-wave`. All pass `glossary.test.ts` (needs-cycle check, no
      undeclared jargon in `plain`). One real C5 collision found and fixed:
      `in-t1-journal` used "swing low" as ordinary flavour text in a worked
      example, three tiers before the term is taught — reworded to "recent
      low" rather than adding it to a T1 lesson's `introduces`.
- [x] `patterns.ts` — six new candlestick detectors: `morning-star` ·
      `evening-star` · `three-white-soldiers` · `three-black-crows` ·
      `bullish-harami` · `bearish-harami`. `PATTERNS` now has 16 entries;
      `PatternScanner` and `PatternBaseRate` needed no changes at all —
      both already iterate the array generically.
- [x] `ta-tools.tsx` — five animated figures, all using `framer-motion`
      (installed since the project started, unused until this stage; see M4)
- [x] `in-t2-trendlines`
- [x] `in-t2-fibonacci`
- [x] `in-t2-reversal-chart-patterns`
- [x] `in-t2-continuation-patterns`
- [x] `in-t2-elliott-wave`
- [x] `in-t2-candlestick-patterns-2`
- [x] Syllabus stage `stage-5b` inserted, registry updated, `built: true` on
      all six topics — syllabus is now **11 stages, 71 steps**, all built
- [x] `pnpm verify` clean — `tsc --noEmit` · `eslint --max-warnings=0` ·
      1,164 tests (up from 1,129) · `next build` (91 static pages, up from
      85) · smoke-tested on a live dev server against the real Turso
      database: all six lesson pages return 200, `/kb` renders all eight
      new terms, `/learn` shows the new stage

**R15 fired on every single one of these six lessons** — same finding as the
original 65-lesson build, still the rule that actually bites in practice.

**Superseded — see §3n:** the note that used to live here about VWAP, volume
profile and Ichimoku being cut is resolved below. An interactive
draw-your-own-trendline widget remains genuinely out of scope — the animated
figure teaches the mechanism; a fully interactive version is a larger widget
than either stage needed.

#### 3n. Second toolkit pass — more TA tools, and fundamentals in depth — `[~]` 7 of 11 built

**Why a second pass.** §3m asked "did we cover support and resistance" —
yes, `in-t2-support-resistance` shipped in the original 65-lesson build
(stage 5, before §3m even started) and is unchanged. What was missing is
breadth: real intraday tools traders actually open every morning (VWAP,
pivot points), one more testable-vs-untestable technical tool
(Bollinger Bands, RSI divergence), and — the larger gap — fundamental
analysis stayed at five lessons (statements, cash vs profit, valuation,
screening, sectors) with no lesson on the actual RATIOS analysts compute,
why a number that looks good can be a warning sign, or where to look in a
real filing. This pass researches both gaps and fills them.

**Research — the technical-analysis half.** What professional and serious
retail traders actually use, beyond what stage 5 / 5b already cover
(trend, support/resistance, moving averages, RSI, MACD, ATR, the ten+six
candlestick patterns, trendlines, Fibonacci, chart shapes, Elliott wave):

| Tool | Real usage | Testable here? |
|---|---|---|
| VWAP | The single most-used intraday reference on NSE desks — institutions benchmark execution against it | Already computed (`indicators.ts`); the LESSON is new |
| Volume profile | Value area / point of control — where volume concentrated by PRICE, not by time. Genuinely different information from a normal volume-by-time chart | No live histogram widget exists; mechanism figure, same honesty as chart shapes |
| Pivot points | The classic five-level intraday grid (P, R1–R2, S1–S2) — still on every intraday trader's screen, mechanically identical to yesterday's OHLC | Pure arithmetic — computed live from real yesterday's bars via `compute` |
| Bollinger Bands | Already computed and already toggleable on every `chart` block in this app | **Yes** — live indicator, real squeeze/expansion behaviour |
| RSI divergence | Distinct claim from "RSI > 70 is overbought" (already taught) — price and momentum disagreeing | No — geometry-matching across swings is a judgement call, same honesty as chart shapes |
| ADX | Trend-strength companion to the existing trend lesson | Not yet computed; taught conceptually with worked arithmetic, like Elliott wave |
| Ichimoku Cloud | Real, but five overlapping lines with no consensus reading even among practitioners | **Cut again, deliberately** — worse fit than Elliott wave, not better; noted so nobody re-researches this |
| Gann angles/fans | Numerology-adjacent; no credible mechanism, no serious practitioner consensus | **Cut** — the site does not teach tools it cannot state an honest mechanism for |

**Research — the fundamentals half.** What "detailed fundamental learning"
concretely means, beyond the five lessons that exist:

| Lesson | What to look for | Why it matters | Why it can mislead |
|---|---|---|---|
| Return ratios (ROE/ROCE/ROA) | How efficiently capital is turned into profit | The engine behind stage 4's compounding curve — this is what compounds | High ROE can be leverage, not skill; ROCE strips that out |
| Debt and solvency | Debt-to-equity, interest coverage, current ratio | Whether the company survives a bad year | `t2-sectors` already flags that the SAME ratio means different things for a bank vs a software firm |
| Quality of earnings | Profit vs. operating cash flow divergence, receivable days, related-party transactions | Catches manipulated or fragile profit before the market does | Extends `t2-profit-vs-cash` directly rather than repeating it |
| Economic moat | Pricing power, market-share stability, margin durability vs. peers | The reason stage 4 says "hold for years" is defensible for SOME companies and not others | Moats erode; a moat lesson that promises permanence would be the site's first invented claim |
| Reading an annual report | MD&A, auditor's report/qualifications, related-party note, cash flow statement FIRST | The actual document, not a summary of it | Most of it is written to be skimmed past; this teaches where the real information hides |
| Promoter and governance signals | Pledged shares, promoter buying/selling, board independence | India-specific — promoter behaviour is a stronger public signal here than in most markets | A promoter buying is not proof of anything by itself; the lesson is explicit about that |

**Progress — `[x]` COMPLETE for everything checked below**

- [x] Plan and research written here
- [x] `in-t2-vwap-volume-profile`
- [x] `in-t2-pivot-points`
- [x] `in-t2-bollinger-bands`
- [x] `in-t2-choosing-the-right-tool` — capstone added mid-pass; maps all
      nine built technical tools to the specific question each answers, and
      closes the whole stage by pointing back at stage 3's position-sizing
      rule, the one thing every tool leaves undecided
- [x] `in-t2-return-ratios`
- [x] `in-t2-debt-and-solvency`
- [x] `in-t2-quality-of-earnings`
- [ ] `in-t2-rsi-divergence`
- [ ] `in-t2-adx-trend-strength`
- [ ] `in-t2-moat`
- [ ] `in-t2-reading-annual-report`
- [ ] `in-t2-promoter-signals`
- [x] New glossary entries for everything built so far (10 — 3 more than
      planned, since `in-t2-bollinger-bands` also had to introduce
      `volatility`, a T3 term used a tier early, which `curriculum.test.ts`
      caught immediately)
- [x] `VolumeProfileFigure` added to `ta-tools.tsx` (a sixth animated
      figure, not in the original plan — needed once VWAP got its own
      lesson and volume profile turned out to deserve more than a mention)
- [x] `WARMUP_BARS` in `src/lib/replay/server-session.ts` raised from 60 to
      150 (three months of daily bars to seven) — a direct fix for
      "not enough history to analyse before acting", confirmed live via
      `/api/replay`: `warmup.length` now returns 150
- [x] `pnpm verify` clean on everything built so far — `tsc --noEmit` ·
      `eslint --max-warnings=0` · 1,213 tests (up from 1,164) · `next build`
      (98 static pages, up from 91) · all seven new lesson pages return 200
      on a live dev server, `/kb` renders all ten new terms

**Where the built ones live:** the four TA lessons are appended to
`stage-5b` (now 12 topics — the original six, plus these four, plus two
still-open gaps). The three fundamentals lessons open a new `stage-6b`,
"Reading a business like an analyst", inserted between stage 6 and stage 7 —
after the first five fundamentals lessons, before behaviour. Syllabus is now
**12 stages, 83 steps, 78 built**.

**Still open, explicitly, for whoever continues this:** the five unchecked
items above have their `id`, title and one-line scope already decided in
this table — writing them is "pick the next box", not "start from
research". `in-t2-rsi-divergence` and `in-t2-adx-trend-strength` extend
`stage-5b`; the other three extend `stage-6b`.

#### 3o. Confluence — candlestick and chart-shape signals at Fibonacci levels — `[x]` COMPLETE

**The gap.** Every tool in `stage-5b` up to this point was taught in
isolation. Real technical traders combine them — specifically, a reversal
candle (hammer, engulfing, morning/evening star) or a chart shape completing
right at a Fibonacci retracement is read as a stronger setup than either
alone. That combination, and which retracement levels actually get watched
for it (the 50%–61.8% "golden zone" most of all), was not taught anywhere.

**The honest version of the claim.** "Confluence" is real as an ATTENTION
effect — more traders watching one price means more orders cluster there,
the same reflexivity argument the Fibonacci lesson already made. It is NOT
independent evidence in the statistical sense: a Fibonacci grid and a candle
shape are both drawn by the same person off the same chart, so stacking them
does not multiply how likely either is to be right. `in-t2-fibonacci-confluence`
teaches exactly this distinction — attention, not certainty — rather than
either dismissing confluence or overselling it.

- [x] `in-t2-fibonacci-confluence` — inserted into `stage-5b` right after
      `in-t2-candlestick-patterns-2`, with four prerequisites
      (`in-t2-fibonacci`, `in-t2-reversal-chart-patterns`,
      `in-t2-continuation-patterns`, `in-t2-candlestick-patterns-2` — every
      tool it combines has to be taught first)
- [x] New glossary entry `confluence` (tier T2, `needs: ['fibonacci-retracement', 'candle']`)
- [x] `pnpm verify` clean — 1,220 tests (up from 1,213), build succeeds,
      lesson returns 200 live, `/kb` renders `confluence`

Syllabus is still **12 stages**, now **84 steps, 79 built, 5 gaps** (the
same five from §3n — this lesson didn't touch them, it only added one more
built topic to `stage-5b`).

#### 3p. Real data instead of illustrative diagrams, for the tools that support it — `[x]` COMPLETE for 3 of 6

**The ask.** Every figure in `ta-tools.tsx` up to this point was an
illustrative MECHANISM diagram — a hand-authored zigzag standing in for a
chart, same convention as `diagrams.tsx`. Explicit feedback: show how to
mark these tools up on an actual small real chart, the way a learner would
do it themselves, not an abstract line drawing.

**What was actually feasible to do for real, honestly.** Three of the six
figures reduce to an algorithm a computer can run against real bars —
finding the largest real swing, finding real pivot lows, or running an
existing `patterns.ts` detector against real history until it fires. Those
three were rebuilt on real, live-fetched data:

- **`TrendlineFigure`** — `findTrendlineAnchors` finds two real swing lows
  (a pivot-low scan, widening the window on failure rather than inventing a
  point); `findLineTouch` checks whether a real third touch exists in the
  window. Both outcomes are shown honestly: a confirmed touch when one is
  found, and the equally common "still waiting" case when it is not — the
  lesson never only shows the flattering version.
- **`FibonacciFigure`** — `findLargestSwing` is a max-profit-style single
  pass that finds the single largest real low-to-high rally in a year of
  daily bars. Not chosen by eye; found by scanning, which is exactly how a
  learner would find one themselves.
- **`CandlestickTrioFigure`** — reuses the EXACT `PATTERNS_BY_ID` detector
  from `patterns.ts` (the same rule `PatternScanner` tests at scale),
  scanning a pool of ten liquid symbols until a genuine occurrence of
  morning-star or evening-star turns up. If none turns up across the pool,
  the figure says so honestly rather than falling back to a drawn shape.

**What was deliberately left illustrative, and why.** `ChartPatternFigure`
(head-and-shoulders, double-top/bottom, triangle), `ElliottWaveFigure` and
`VolumeProfileFigure` remain hand-authored MECHANISM diagrams. Reliably
finding a real occurrence of a multi-week geometric shape in a small fetched
window is a shape-detection problem, not a swing-scan or an existing
detector — a materially larger job than the other three, and each of those
lessons already says explicitly that these shapes are drawn by eye and not
base-rate-tested for the same reason. Worth doing later if wanted; not
attempted this pass rather than faked.

**New pure module, tested independently of React**, matching the
`patterns.ts` / `patterns.tsx` split: `src/lib/analysis/chart-drawing.ts`
holds `findLargestSwing`, `findPivotLows`, `findTrendlineAnchors`,
`findLineTouch` and `retracementLevel`, all pure functions over `Candle[]`.
`chart-drawing.test.ts` — 11 tests, including a case that checks the
algorithm returns `null` rather than inventing a trendline anchor when none
exists.

- [x] `chart-drawing.ts` + 11 passing tests
- [x] `TrendlineFigure`, `FibonacciFigure`, `CandlestickTrioFigure` rebuilt on real data
- [x] `useRealBars` / `useRealPatternExample` — loading is DERIVED from
      whether held data matches the current key, same pattern
      `usePatternStats` already used in `widgets/patterns.tsx`; this is
      what made `eslint-plugin-react-hooks`'s `set-state-in-effect` pass
      cleanly on the first correct attempt (the naive "reset state
      synchronously at the top of the effect" version failed it)
- [x] Lesson captions in `in-t2-trendlines`, `in-t2-fibonacci`,
      `in-t2-candlestick-patterns-2` updated to say so
- [x] `pnpm verify` clean — 1,231 tests (up from 1,220), build succeeds
      (99 static pages), all real symbols used
      (RELIANCE/HDFCBANK/TCS/INFY/ICICIBANK/ITC/SBIN/TATAMOTORS/MARUTI/SUNPHARMA)
      confirmed live via `/api/history` with 250 real daily bars each

**Not verified visually in a browser.** No browser-automation tool was
available this session — verification is `tsc` + `eslint` +
`chart-drawing.test.ts` + confirming the real API returns sufficient real
data for every hardcoded symbol + SSR not crashing on the affected lesson
pages. The client-side fetch-and-draw logic itself (what actually runs
after hydration) has not been eyeballed in an actual browser. Worth a manual
check before calling this fully done.

**Still open:** `ChartPatternFigure`, `ElliottWaveFigure`,
`VolumeProfileFigure` on real data — genuinely harder (shape detection, not
a swing scan), scoped above, not started.

#### 3q. Chart Replay's next-bar button, and chart-type coverage — `[x]` COMPLETE

**The game fix.** `Hold, next bar →` / `Stay flat, next bar →` sat at the
bottom of `ChartReplay`, below the thesis form and the stop/target sliders.
Advancing a bar meant scrolling away from the chart to click it, then
scrolling back up to see what changed. Both buttons already called the
identical `advance()` — a `Next bar →` control was added directly into the
chart's own header row, next to `Last / Equity / bars left`, so it is
always adjacent to the chart regardless of scroll position or which stance
panel is showing below. The two original buttons stay exactly where they
were; this is a second way to reach the same action, not a replacement.

**The candlestick coverage gap.** Every chart in this course had been shown
one way — a filled candlestick — with no lesson on the fact that candlestick
is one of several conventions, or on what a single bar actually compresses
at a given interval. New `in-t2-chart-types`, inserted as the FIRST topic of
stage 5 (before `in-t2-trend`, since every later lesson assumes the reader
already knows what they are looking at):

- **OHLC bar chart** — the same four prices as a candle, drawn as a tick
  left (open) and a tick right (close) on a single vertical line. Predates
  colour screens.
- **Heikin-Ashi** — each bar's open is the midpoint of the PREVIOUS
  Heikin-Ashi bar, not this bar's real open. Smooths a trend and makes
  reversals look calmer — and means the prices are not real trade prices, so
  a stop or target set directly off one is set off a number nobody could
  actually transact at. This is the sharpest "why not" in the lesson.
- **Hollow candles** — pack in two facts a plain candle does not: fill
  (hollow/solid) is close vs. this bar's own open; colour is close vs. the
  PREVIOUS bar's close.
- **Line chart** — only the close survives; the whole range is gone.
- **What one bar compresses, by interval** — 1 minute is one minute; 1 day
  is a full 375-minute NSE session (9:15–15:30); 1 week is UP TO five
  sessions, fewer around a holiday, with no label on the bar to tell you
  which; 1 month is roughly 21 sessions.

**New figure, on real data**: `ChartTypeFigure` fetches 40 real days of TCS
and renders the SAME real bars as all five types behind a tab switcher —
nothing about the underlying trading changes between tabs, only the
encoding, made concrete rather than asserted. `toHeikinAshi` (the real
transform) is a new pure function in `chart-drawing.ts`, tested — including
a test that its second bar's open is NOT the real second bar's open, which
is the whole point of the series.

- [x] `Next bar →` added to `ChartReplay`'s chart header
- [x] `toHeikinAshi` in `chart-drawing.ts` + 3 new tests (14 total in that file)
- [x] `ChartTypeFigure` — real data, five-way toggle, registered in `visuals/registry.tsx`
- [x] Three new glossary entries: `ohlc-bar-chart`, `heikin-ashi`, `hollow-candle`
- [x] `in-t2-chart-types` — inserted as the new first topic of stage 5
- [x] `pnpm verify` clean — 1,241 tests (up from 1,231), build succeeds
      (100 static pages), lesson and game both return 200 live, `/kb`
      renders all three new terms

Syllabus is now **12 stages, 85 steps, 80 built, 5 gaps** (same five as
before — this pass didn't touch them).

**Same visual-verification caveat as §3p**: no browser-automation tool was
available this session, so the `ChartTypeFigure` tab-switching and the
`ChartReplay` button placement have not been eyeballed in an actual
browser. `tsc`/`eslint`/tests/build/live-200s all pass; a manual look is
still worth doing.

#### 3r. An animated mouse cursor for the click-drag tools — `[x]` COMPLETE

**The ask.** The figures in §3p mark up real charts, but the marking itself
just appeared — a dot fading in at each anchor, no sense of a person
actually clicking and dragging the way they would on a real platform.
Explicit request: show the mouse doing it, bottom to top for Fibonacci, and
the same treatment for the other tools that are genuinely drawn by a
click-and-drag gesture.

**New shared component, `MouseDrag`.** A small cursor glyph (`CURSOR_PATH`)
that fades in at the first point, a click ripple, a drag to the second
point, a click ripple there too. Built from two NESTED `motion.g` groups
rather than one keyframed animation — the outer handles the fade-in at a
fixed position, the inner handles the `(0,0) → (to − from)` offset after a
further delay. SVG transforms on nested groups compose additively, so this
sidesteps keyframe-timing-fraction arithmetic entirely: the visible result
lands exactly on `to` because inner + outer offsets literally add up in the
SVG coordinate system, not because the timing was tuned to make it look
right.

**Where it was added, and where it deliberately was not:**

- **`FibonacciFigure`** — bottom to top, exactly as asked: press at the
  swing low, drag up, release at the swing high. The grid now waits for the
  drag to finish before it starts drawing.
- **`TrendlineFigure`** — click swing low 1, drag to swing low 2, release;
  the trendline itself now draws in only after the release.
- **`ChartPatternFigure`** — the mouse traces the neckline left to right for
  every non-triangle shape (head-and-shoulders, inverse, double-top,
  double-bottom); the triangle variant has no single neckline to trace, so
  it was left as-is.
- **NOT added to `CandlestickTrioFigure` or `VolumeProfileFigure`.** Neither
  is a click-and-drag gesture — a candlestick pattern is FOUND in real
  history, not drawn, and a volume profile is computed, not anchored by two
  points. Adding a fake drag gesture to either would have taught a false
  mechanism.
- **NOT added to `ElliottWaveFigure`.** Labelling eight sequential points is
  a different gesture from a two-point drag, and chaining eight small drags
  would have been busier than instructive. Flagged here rather than done
  half-heartedly — worth a dedicated multi-point cursor treatment later if
  wanted, not attempted this pass.

Every existing animation delay downstream of an anchor point was re-timed
to wait for the drag to actually finish (press → drag → release) before
the tool starts drawing, in all three figures — not just layered visually
on top of the old schedule.

- [x] `MouseDrag` shared component in `ta-tools.tsx`
- [x] Wired into `FibonacciFigure`, `TrendlineFigure`, `ChartPatternFigure`, all re-timed
- [x] `pnpm verify` clean — 1,241 tests (unchanged — pure animation/UI, no
      logic changed), build succeeds, all four affected lesson pages
      return 200 live

**Same visual-verification caveat as §3p and §3q**, and it matters more
here than anywhere else in this stage: this is a purely visual feature, and
no browser-automation tool was available to actually watch the cursor move.
The `translateX`/`translateY` animation technique is framer-motion's
standard, documented way to animate an arbitrary transform on any element
including SVG groups — not something invented for this — but it has not
been eyeballed running. If anything about the cursor looks wrong, this is
the first place to look.

#### 3s. Marking swing highs and lows themselves, one bar at a time — `[x]` COMPLETE

**The gap §3r left.** Every figure in §3r assumes the learner can already
SPOT a swing point — `findPivotLows` runs invisibly, the two anchors just
appear. Both the trendline and Fibonacci lessons introduce `swing-point` as
a term without ever showing the actual check a person runs against a real
bar. Explicit request: show that check itself, with the mouse.

**New `SwingPointFigure`, on real bars.** Fetches real ICICI Bank history
and runs the exact one-neighbour-each-side rule `findPivotLows` already
implements, but SLOWED DOWN and shown three times: click a candidate bar,
draw a dashed guide out to the bar on each side, colour that neighbour
green if it sits higher (supports the case) or red if it sits lower
(breaks it), then a verdict — ✓ for a genuine swing low, ✗ naming which
side failed. Two of the three examples are real confirmed swing lows; the
third is deliberately the honestly tricky case — a real bar found NEAR a
real swing low, close enough to look like a candidate, that fails the
check on one side. Nothing here is a hand-picked "obviously wrong" example.

New shared `MouseClick` (press, ripple, release — no drag) alongside the
`MouseDrag` from §3r, for tools checked one point at a time rather than
anchored by two.

**Where it lives.** Inserted into `in-t2-trendlines` — the lesson that
already introduces `swing-point` — right before the existing
`TrendlineFigure`, so the sequence now reads: here is how you CHECK a
candidate bar, here is how you DRAW a line through two confirmed ones.
`FibonacciFigure` and the other figures were left as-is; they already
assume the swing-point skill this new figure is what actually teaches.

- [x] `MouseClick` shared component in `ta-tools.tsx`
- [x] `SwingPointFigure` — real data, three worked checks (two confirmed, one rejected), registered in `visuals/registry.tsx`
- [x] Inserted into `in-t2-trendlines`, new objective added, `estimatedMinutes` 14 → 15
- [x] `pnpm verify` clean — 1,241 tests (unchanged — no logic outside the
      component changed; the geometry it calls, `findPivotLows`, was
      already tested in §3p), build succeeds, lesson returns 200 live

**Same visual-verification caveat as §3p–3r**: not eyeballed in an actual
browser this session.

#### 3t. A real chart-toggle bug, wider real-data windows, and pattern significance — `[x]` COMPLETE

**The bug, reported directly by the user.** Clicking a lower-pane indicator
(Volume, RSI, MACD, ATR) on the live `chart` DSL block made the price
candles disappear entirely — not just visually odd, actually broken.

Root cause, in `CandleChart.tsx`: the chart-creation `useEffect` depended
on `[totalHeight]`, and `totalHeight = height + activePanes.length * 90`.
Toggling any pane indicator changes `activePanes.length`, which changes
`totalHeight`, which re-ran that effect — and its cleanup calls
`chart.remove()` and builds a **brand-new** chart and candlestick series
from scratch. The effect that feeds the price series its data only depends
on `[candles]`, so it never re-ran for the new series. Net effect: a fresh,
empty candlestick series sitting on screen with no data ever pushed into
it. The fix is architectural, not a patch: the chart is now created ONCE
(mount-only effect, `eslint-disable` with a comment explaining why), and a
SEPARATE effect calls `chart.applyOptions({ height: totalHeight })` to
resize the existing chart whenever the pane count changes — no teardown,
no empty series, ever.

**Wider real-data windows, on request.** `TrendlineFigure` and
`SwingPointFigure` both used to crop tightly around just the points being
demonstrated. Widened both to show a fuller real daily chart — more real
history before the first anchor, more room after the last one — so the
trendline and the swing-point checks sit inside actual context instead of
a narrow strip. `SwingPointFigure`'s fetch range also grew from 6mo to 1y
to support the wider window reliably.

**Pattern significance — where a reversal shape has to form to mean
anything.** `in-t2-reversal-chart-patterns` taught the anatomy and the
neckline confirmation, but never the gate in front of both: a
head-and-shoulders claims a trend is running out of strength, and a trend
has to actually exist first for that claim to be meaningful. New predict
block makes this concrete — the identical three-peak shape, once after a
six-month rally and once in a flat, directionless month, and only the
first one is worth calling a head and shoulders. The mechanism (neckline,
measured-move arithmetic) works identically in both cases; only one of
them is answering a real question.

- [x] `CandleChart.tsx` — chart lifecycle split into a mount-only creation
      effect and a separate resize effect; the vanishing-on-toggle bug is
      structurally impossible now, not just less likely
- [x] `TrendlineFigure` — window widened (`p1 − 18` to `p2 + 35`, was `p1 − 8` to `p2 + 22`)
- [x] `SwingPointFigure` — window widened (`slice(-60)`, was `slice(-42)`), fetch range 6mo → 1y, min-bars guard raised to 65
- [x] `in-t2-reversal-chart-patterns` — new predict block on the prior-trend
      requirement, new objective, checkpoint untouched (already solid)
- [x] `pnpm verify` clean — 1,241 tests (unchanged for the chart-toggle fix
      and window widening, since neither touches tested logic; content
      tests re-passed for the lesson change), build succeeds, all affected
      pages return 200 live, `HDFCBANK.NS`/`ICICIBANK.NS` confirmed
      returning 250 real daily bars for 1y each

**Still open from the original ask, not attempted this pass:** a
systematic "how to spot it" pass across every indicator lesson (e.g. the
volume tell — declining volume into the right shoulder of a head and
shoulders, or into the second peak of a double top, is a real supporting
signal not yet taught anywhere), and the same prior-trend framing applied
explicitly to `in-t2-continuation-patterns` (it already implies the
requirement in every example's setup — "a stock rallies hard, then..." —
but never states the gate as its own predict the way the reversal lesson
now does). Both are small, well-scoped additions for a future pass rather
than done half-heartedly here.

#### 3u. Fibonacci in both directions, and a real bug caught before shipping — `[x]` COMPLETE for Fibonacci; still open for the rest

**The ask, with a concrete example given.** Every tool in this stage so far
only demonstrated the uptrend case — drag from a swing low up to a swing
high. The explicit request: show the downtrend case too (drag from the
high down to the low, so the retracement measures how far a BOUNCE might
climb before the decline resumes, not how far a pullback might fall) — and
do the same depth pass, with real research, across every indicator and
chart pattern: what it shows, why it matters, when and where to use it,
not just quizzes.

**Scope decision, stated plainly.** A full research-and-rewrite pass across
every indicator and pattern lesson already built (roughly fifteen of them)
is a large body of work. This pass did ONE of them — Fibonacci — all the
way through, rather than a thin pass across all fifteen. The rest are
listed below as the next boxes to pick up, each already scoped.

**`retracementLevel` turned out to already be direction-agnostic.** Rather
than writing a second formula, the existing function works correctly for a
downtrend if the two arguments are simply swapped — `from` is wherever the
retracement STARTS (0%), `to` is wherever it ENDS (100%), and extensions
continue past `from` away from `to`. Proven with new tests calling it with
the arguments swapped and checking the mirrored outputs, rather than
asserted. New `findLargestDecline` in `chart-drawing.ts` is the mirror of
`findLargestSwing` — a max-drawdown-style scan for the largest real
high-to-low decline, tested the same way.

**A real bug caught before it shipped.** The first version of
`FibonacciFigure`'s direction toggle had `anchorFrom`/`anchorTo` backward
for the uptrend case — it would have silently swapped which price landed
on the 38.2% line and which landed on 61.8%. Caught by manually tracing
the arithmetic against the lesson's own worked numbers before running
anything, not by a test catching it after the fact (the pure-function
tests for `retracementLevel` pass either way, since they call it directly
with explicit arguments — the bug was only in which arguments the
COMPONENT passed). Worth remembering: a correct, tested pure function does
not guarantee the component wiring it up is correct.

**`in-t2-fibonacci` substantially expanded**, leaning on `example` blocks
(informational walkthroughs, not more quizzes) to add depth without
breaking the interaction ratio — `example` and `figure` blocks are
"supporting" content, excluded from the R1 interactive/text ratio
entirely, which is what made room for real research-backed depth:

- **Where 61.8% and 38.2% actually come from** — the Fibonacci sequence's
  consecutive-ratio convergence to ≈0.618, stated as real, checkable
  mathematics.
- **Where 50% comes from instead** — Dow Theory, decades before Fibonacci
  retracement existed, on the observation that markets often give back
  roughly half a move. Not folklore invented for this course; a real,
  separate historical origin, now stated rather than only implied.
- **When and where to use it at all** — during a pullback or bounce inside
  an existing trend; a flat, directionless market has no clean swing to
  anchor a grid to in the first place.
- **The downtrend worked example**, mirroring the uptrend one with
  different real numbers, plus a downtrend transfer-test predict showing
  the identical ₹6.18-per-₹10 anchor sensitivity the uptrend case already
  demonstrated — same fragility, proven in both directions rather than
  asserted once.

- [x] `findLargestDecline` in `chart-drawing.ts` + 3 tests
- [x] `retracementLevel` JSDoc rewritten to state the direction-agnostic
      contract explicitly + 2 new tests calling it swapped
- [x] `FibonacciFigure` — direction toggle (Uptrend/Downtrend), real data
      both ways, anchor-order bug caught and fixed before shipping
- [x] `in-t2-fibonacci` — new callout (ratio origins + when/where), new
      downtrend example, new downtrend predict, new checkpoint task,
      objectives rewritten, `estimatedMinutes` 14 → 18
- [x] `pnpm verify` clean — 1,246 tests (up from 1,241), build succeeds,
      lesson returns 200 live

**Still open, explicitly, for whoever continues this** — the same
"what/why/when/where, in both directions where applicable, with real
research" treatment, not yet applied to: `in-t2-pivot-points`,
`in-t2-bollinger-bands`, `in-t2-vwap-volume-profile`, `in-t2-indicators`
(RSI/MACD/moving averages/ATR), `in-t2-reversal-chart-patterns` and
`in-t2-continuation-patterns` (the volume tell from §3t), `in-t2-elliott-wave`,
`in-t2-candlestick-patterns-2`. Each is a well-defined, bounded addition in
the same shape as this one — pick a lesson, research the real mechanism
and its real historical/practical context, add depth through `example`
blocks rather than more predicts, verify the block ratios still pass. The
user asked to go through this list "one by one in depth" — §3v below is
the first of that explicit sequence.

---

#### 3v. Trendlines in both directions — the first of the "one by one, in depth" sequence — `[x]` COMPLETE

Picked up the first item from §3u's open list: `in-t2-trendlines` only
ever showed the uptrend case (a rising line through higher swing lows).
Added the mirror — a falling line through lower swing highs — with the
same real-data-scan-not-chosen-by-eye discipline the rest of this stage
uses, plus the what/why/when/where research pass.

**New pure functions in `chart-drawing.ts`, mirroring the existing
low-based ones exactly:**

- `findPivotHighs(bars, window)` — mirror of `findPivotLows`.
- `findFallingTrendlineAnchors(bars)` — mirror of `findTrendlineAnchors`:
  first pivot high, then the next pivot high that sits LOWER (a genuine
  lower high), widening the pivot window on failure and returning `null`
  rather than inventing a point, same honesty rule as the rising case.
- `findLineTouchHigh(bars, p1, p2, afterIdx, tolerance)` — mirror of
  `findLineTouch`, checking a real bar's HIGH against the projected line
  instead of its low.
- 6 new tests (findPivotHighs ×2, findFallingTrendlineAnchors ×2,
  findLineTouchHigh ×2) — 25 tests total in this file, up from 19.

**`TrendlineFigure` rewritten with a direction toggle**, same UI pattern
as `FibonacciFigure`'s Uptrend/Downtrend buttons. Uptrend branch is the
untouched original logic; downtrend branch swaps every low-based call for
its high-based mirror (`findLargestDecline` instead of `findLargestSwing`
for the fallback anchor, `findFallingTrendlineAnchors`/`findLineTouchHigh`
instead of the rising versions) and a shared `priceAt(i)` helper picks
`.low` or `.high` per bar so the rest of the geometry (slope, `lineAt`,
domain, touch detection) is written once and used both ways rather than
duplicated. Line colour flips (`--color-up` / `--color-down`) so the two
modes are visually distinct at a glance, not just by the caption text.

**`in-t2-trendlines` research content added:**

- New callout **"Which direction, and why it matters"** — the actual
  drawing rule stated for both lines (rising: swing low → next higher
  swing low, floor buyers defend; falling: swing high → next lower swing
  high, ceiling sellers defend), plus explicit guidance on WHEN each
  applies (higher-lows sequence vs lower-highs sequence) and the single
  most common misuse: forcing a line onto a sideways, non-trending chart
  that has no clean swing sequence to anchor to at all.
- New **example**, mirroring the existing "moving target" one: a short
  trade's stop placed on a falling trendline, recomputed forward, then
  widened by one ATR above the line — the same "give it room" lesson the
  long case already taught, proven in the other direction with different
  real numbers rather than just asserted to also apply.
- New **predict**: a close firmly above a falling trendline after two
  months of respected lower highs — what does it signal? Correct answer:
  demand overwhelming the supply that capped every prior rally, a real
  and meaningful shift, but not a guarantee — flags the common false-break
  case and why most traders wait for a close rather than an intraday poke
  through the line.
- New **checkpoint task**: compute where a falling trendline sits N days
  forward (same arithmetic as the existing rising-line task, subtracting
  instead of adding).
- Objectives rewritn to explicitly name both directions; figure caption
  updated to describe the toggle; `estimatedMinutes` 15 → 17.
- Fixed 3 R15 (sentence too long) violations and 2 schema-size violations
  (objectives >5 items, caption >300 chars) along the way — same
  familiar validator loop as every other content turn this stage.

- [x] `findPivotHighs`, `findFallingTrendlineAnchors`, `findLineTouchHigh`
      in `chart-drawing.ts` + 6 new tests (25 total, up from 19)
- [x] `TrendlineFigure` — direction toggle, real data both ways, shared
      `priceAt` helper instead of duplicating the geometry
- [x] `in-t2-trendlines` — new callout (drawing rule + when/where), new
      downtrend example, new downtrend predict, new checkpoint task
- [x] `pnpm verify` clean — 1,252 tests (up from 1,246), build succeeds
      (100 static pages), lesson returns 200 live

---

#### 3w. Pivot points, depth pass — second of the "one by one, in depth" sequence — `[x]` COMPLETE

Picked up the second item from the open list: `in-t2-pivot-points`. No
new pure functions or figures needed here — this tool is computed
arithmetic, not eyeballed geometry, so the depth came entirely from
research-backed content added via `callout`/`example`/`predict` blocks.

**What was added:**

- **Real historical origin, stated explicitly**: the pivot formula
  predates electronic charting — floor traders on open-outcry exchanges
  needed a fixed set of numbers they could compute once by hand before
  the bell and carry mentally through the session. "Floor trader pivots"
  is still the name. This also explains something practical the lesson
  did not previously say: unlike a trendline or Fibonacci grid, a pivot
  grid is never dragged onto a chart by eye. It is computed once,
  drawn as five flat horizontal rays valid for exactly ONE session, and
  thrown away and recomputed the next day — never carried forward.
- **R3/S3 added**, with a worked example comparing two stocks that share
  almost the same pivot but wildly different prior-day ranges (₹7 vs
  ₹47), producing R3–S3 grid widths of ₹21 vs ₹141. The width itself is
  taught as a real signal — a tight prior day's compressed grid makes a
  clean breakout more meaningful than the same move on an already-wide
  grid.
- **New predict on the opening-gap read**: where the day's first trade
  lands relative to the grid (above R1 / below S1 / inside it) is real
  floor-trader information about opening order flow, not noise — flagged
  as a read, not a rule the market obeys.
- New checkpoint task computing S3 from the lesson's existing worked
  numbers.
- Objectives 4 → 5 (R3/S3 + grid-width reading, and the "where does this
  come from and why does it reset daily" objective); `estimatedMinutes`
  13 → 16.
- Fixed 4 R15 (sentence too long) violations along the way, one of which
  needed a second pass — a 32-word sentence was still rejected, meaning
  the cap is a strict "under 32," not "at most 32."

- [x] `in-t2-pivot-points` — origin callout, R3/S3 + grid-width example,
      opening-gap predict, new checkpoint task, objectives 4 → 5
- [x] `pnpm verify` clean — 1,252 tests (no new pure functions this
      lesson, so the count is unchanged from §3v), build succeeds
      (100 static pages), lesson returns 200 live

---

### M4 · Polish — `[ ]`

- [x] Mobile layout pass across header, pages, leaderboard, widgets — see §3k
- [ ] Accessibility audit: keyboard paths, focus order, screen-reader labels on charts
- [x] Motion and transitions — five figures in `ta-tools.tsx` use Framer
      Motion (§3m); still unused elsewhere in the app
- [ ] Performance: bundle split for the charting library, route-level prefetch
- [ ] Offline support once snapshots land
- [ ] Onboarding flow and share cards

---

### How to write the next lesson — read this first

This section exists so that anybody, with no memory of how the previous ones
were written, can add a lesson that passes CI on the first or second try. It is
the accumulated cost of writing thirty of them.

#### The four files you touch, in this order

1. **`src/content/syllabus.ts`** — find the topic. Its `id` is the lesson id,
   exactly. If the topic is not listed, add it in the position it belongs.
2. **`src/content/in/<file>.ts`** — write the lesson. Template below.
3. **`src/content/registry.ts`** — import it and add it to `LESSONS`.
4. **`src/content/syllabus.ts`** again — set `built: true` on the topic.

Getting any of these wrong fails `pnpm verify` with a message naming the fix.

#### The block template that passes on the first try

```
predict · callout · widget|figure · example · predict · widget|chart|game · callout · checkpoint
```

Eight blocks. That gives interactive 5 (2 predict + 1 widget + 1 chart/game +
checkpoint) against text 2, which is 71% — comfortably over the 60% floor — and
a text share of 25% against a 35% ceiling. `estimatedMinutes` around 13–16.

Vary it freely; just keep counting. The two constraints that bite are R1
(interaction beats text) and R12 (text is under a third of ALL blocks).

#### Every rule, and what actually trips you up

| Rule | What it wants | How it bites in practice |
|---|---|---|
| R1 | interactive ÷ (interactive + text) ≥ 0.6 | Only prose/callout count as text. Example and figure are neutral. |
| R2 | ≤2 passive blocks in a row | example/figure reset the counter, so callout·example·callout is fine. |
| R3 | exactly one checkpoint, and it is last | — |
| R4 | do not open with two prose blocks | Open with a predict or widget. |
| R6 | predict `reveal` ≥ 60 chars | Never a problem if the reveal explains why the other options are wrong. |
| R7 | no "What is…" checkpoint prompts | Ask them to decide or compute. |
| R9 | `estimatedMinutes` within 0.5×–2.5× of 2·interactive + 1.5·supporting + 1·text | Wide band; 13–16 is safe for eight blocks. |
| R10/R11 | ≥1 example, and ≥1 step with `value` or `compute` | — |
| R13 | `plainSummary`, with no glossary term outside `ASSUMED_VOCABULARY ∪ introduces` | **Watch ordinary words.** "apps offer…" tripped on `offer`. |
| R14 | Flesch–Kincaid grade ≤ 9 | Never fired in 30 lessons. R15 catches it first. |
| **R15** | **no sentence ≥ 32 words** | **This is the one. It fires on almost every lesson, usually 2–5 times.** |
| R16 | every example followed within 3 blocks by a predict or the checkpoint | The template above satisfies it. |
| R17 | checkpoint has ≥1 `compute` or `construct` task | — |
| C4/C7 | prerequisites are earlier in tier AND earlier in the sequence | — |
| **C5** | **no glossary term from a later tier without `introduces`** | **The second one that fires. See below.** |

#### R15 — write short sentences and you will still fail it

Em-dashes are the usual culprit: a sentence with `— and` in the middle is
almost always over 32 words. The fix is mechanical — replace the dash with a
full stop and start a new sentence. Do not try to write your way around it in
advance; write the lesson, run the validator, split what it names.

#### C5 — the ordinary-English trap, which is now well documented

A T0/T1 lesson cannot use a T3 term. Fine. What actually happens is that a
perfectly ordinary English word collides with a glossary alias:

| Word | Innocent use that failed | Glossary entry |
|---|---|---|
| `support` | "raise it with support" | support level |
| `edge` | "the right-hand edge of the chart" | expectancy |
| `lot` | "is that a lot?" | lot size |
| `spot` | "spot a trend" | spot price |
| `offer` | "apps offer dozens of tools" | ask |
| `basis` | "on a per-trade basis" | futures basis |
| `underlying` | "the underlying cause" | underlying asset |
| `expires` | "the offer expires" | expiry |
| `order` | "in order to" | order (uses `neverAfter`) |

**The fix is always in the glossary, never in the lesson.** Move the bare word
to `searchAliases`, set `noAutoLink: true`, and give `aliases` an unambiguous
multi-word form (`support level`, `spot price`, `lot size`). Expect to find a
new one roughly every four lessons.

If the collision is genuine — the lesson really does teach the term — add the
id to `introduces` instead. If a term is being taught much earlier than its
`tier` says, change the tier (this is why `expectancy` moved from T4 to T1).

#### The compute vocabularies, which are NOT the same

- **Worked-example steps** use `compute: { fn: ... }` from
  `src/lib/lesson/examples.ts`: `legCost` · `legCostLine` · `roundTripTotal` ·
  `roundTripPercent` · `breakevenPercent` · `breakevenMove` · `turnover` ·
  `optionPrice` · `optionIntrinsic` · `optionTimeValue` · `optionGreek` ·
  `bookWalkAverage` · `bookWalkSlippage` · `bookWalkCost` · `bookWalkLevels` ·
  `sizeFromStop` · `riskAmount` · `compoundFinal` · `literal` · `multiply` ·
  `percentOf` · `spanPercent`
- **Checkpoint tasks** use `spec: { metric: ... }` from
  `src/lib/lesson/grading.ts`: `literal` · `roundTripCostPercent` ·
  `roundTripCostAmount` · `breakevenPercent` · `legCostAmount` ·
  `brokerageDelta`

Using one name in the other place shipped a crash once. Both now throw on an
unknown name.

Checkpoint task types: `decision` · `compute` · `classify` · `construct`.
A `construct` task grades a real order — the protective-stop pattern used in
several lessons is a good starting point, and `side: 'sell'` for a long
position (a buy-side stop below the market is not a protective stop, and the
grader will fail it).

#### What exists to build lessons out of

**Widgets** (`src/components/widgets/registry.tsx`): CostBreakdownTable ·
CostComparator · BreakevenSlider · BrokerComparator · ExpiryComparator ·
PhysicalSettlementCalculator · MarginLadder · OrderBookLadder · SettlementChain ·
PatternBaseRate · PatternScanner · GreeksExplorer · PayoffChart

**Figures** (`src/components/visuals/registry.tsx`): CandleAnatomy ·
SpreadDiagram · SettlementTimeline · LongShortDiagram · CompoundingCurve ·
RiskRewardDiagram

**Games**: chart-replay · order-gauntlet · cost-cutter · risk-roulette ·
payoff-builder · circuit-breaker · earnings-roulette · bias-buster ·
candle-sprint · the-long-game

A `chart` block takes a live symbol: `{ type: 'live', symbol: 'RELIANCE.NS',
interval: '1d', range: '1y' }`.

#### The loop

```bash
npx vitest run src/content/          # fast — validator + claims + syllabus
npx tsc --noEmit && npx eslint src --max-warnings=0
npx vitest run                       # everything
npx next build                       # catches what tests do not
```

Run the first one after every lesson. It names the rule, the block index and
the offending sentence, which is enough to fix without thinking.

#### The house style, which the rules do not enforce

- **Open with a prediction that has a counter-intuitive answer.** The learner
  should be wrong, and interested in why.
- **Every reveal explains why the WRONG options are wrong**, not just which is
  right. That is where the teaching is.
- **The second predict is the transfer test** — change one number from the
  worked example and hand it back. R16 exists to force this.
- **Say what a thing is NOT.** Half of these lessons are defusing a piece of
  folklore, and naming it explicitly is more useful than quietly omitting it.
- **Never recommend a position.** "Buy slightly out of the money" is a trade
  instruction wearing a teacher's coat. Teach the mechanism and stop.
- **Numbers come from the engine.** Use `compute` rather than typing a figure,
  so a statutory-rate change cannot silently make a lesson wrong.
- **Any number stated in prose needs a claim test** in
  `src/content/claims.test.ts`.


### Working notes for whoever picks this up

- **Run `pnpm verify`** — typecheck, lint, and the full unit suite. Live-network
  tests are excluded on purpose; run them with `MARKET_LIVE=1 pnpm test:live`.
- **Every statutory rate carries a source URL and a verification date** in the
  file header. Change the rate, change the citation.
- **Prefer `compute` over a typed value** in every worked-example step. A
  hardcoded number is a number that will one day be wrong.
- **Two compute vocabularies exist and they are NOT the same.**
  `src/lib/lesson/examples.ts` serves worked-example steps (`fn:`);
  `src/lib/lesson/grading.ts` serves checkpoint tasks (`metric:`). Using one
  name in the other place shipped a crash once — both now throw on an
  unknown name rather than returning undefined.
- **Any lesson that states a number needs a claim test** in
  `src/content/claims.test.ts`. This has already caught four wrong figures and
  one wrong answer key before they reached a learner.
- **Ordinary English words are not jargon, and the glossary must know it.**
  `put`, `call`, `stop`, `gap`, `long`, `short` and `option` are verbs and
  everyday nouns far more often than they are instruments. Each is
  `searchAliases` rather than auto-linked, and `order` carries
  `neverAfter: ['in']` so "in order to" is left alone. A wrong definition
  popping up over an ordinary word is worse than no definition at all.
- **The annotator must re-split after every insertion.** Annotating
  "market order" inserts a `<button>`; a stale tag-split then let "order" match
  *inside that button*. This shipped as a nested button with the wrong
  definition and is covered by a test now.
- **A leaderboard is the loudest statement a product makes about what it
  values.** If it ranks by returns, it teaches gambling regardless of what the
  lessons say, because over a short contest the winner is whoever took the most
  risk and got away with it. P&L is shown and never ranked; four tests hold that.
- **Two content traps found and corrected so far**, both worth remembering:
  the "STT on exercised ITM options" story was fixed on 2019-09-01 and the
  folklore is out of date; and payoff bounded/unbounded cannot be sampled from
  chart edges, it has to be derived from the legs.

- **Six half-empty buckets read as a shelf, not a course.** The tier layout
  answered "how is this organised", which is the author's question. It never
  answered "where do I start and what comes next", which is the only question a
  learner arrives with. One numbered road of 60 steps replaced it, and the
  unwritten steps are shown IN PLACE rather than hidden — a course that looks
  finished because the gaps are invisible is a fake progress bar.
- **XP that reads profit teaches gambling, whatever the lessons say.** From the
  outside a lucky decision and a good one produce the same number, so any XP
  rule that reads that number rewards both. `runXp` gates on four things —
  a written reason, planned reward-to-risk, no reckless sizing or abandoned
  stops, and a process floor — and reads P&L nowhere. A test runs the identical
  decision set at −₹5,000 and +₹5,000 and asserts the XP is the same number.
- **Publish reasoning, not results.** A feed of returns teaches you to copy
  whoever got lucky. "I sized at 0.8% because the stop had to sit under the
  swing low" is a sentence you can learn from, disagree with, or catch an error
  in. `/reasons` is ordered newest-first rather than best-first on purpose: the
  runs that went wrong are the more instructive half, and sorting by score would
  make it a second leaderboard showing the same handful of runs for weeks.
- **Wrapping is not responsiveness.** The old header put seven links and the
  account controls in one `flex-wrap` row. On a phone they wrapped to three
  lines, the sticky header ate a third of the viewport, and every page started
  already scrolled. Wrapping is what happens when nothing was decided.
- **`overflow-x: clip` on the body, never `hidden`.** `hidden` creates a scroll
  container, which silently breaks `position: sticky` on the header. `clip`
  does not, and still kills the whole class of "one element is 3px too wide and
  now the page rocks sideways" bugs.
- **A validator that reads a module-level constant cannot be tested around it.**
  C6 and C7 compare lessons against the global syllabus, so they live in
  `validateSyllabus(lessons, sequence = SEQUENCE)` rather than inside
  `validateCurriculum`, which judges a set of lessons against each other and
  nothing else. Folding them in broke every synthetic-lesson test at once,
  which was the design telling on itself.

---

## 7. Non-negotiables

1. **No invented market data.** Real prices or an explicitly labelled model.
2. **No lookahead.** Replay engine physically cannot see future bars.
3. **Every trade shows its true cost.**
4. **Reward process, not outcome.** A disciplined loss scores above a reckless win.
5. **No advice.** This teaches mechanics and reasoning. It never says what to buy.
6. **Interactive by construction**, enforced by the lesson validator in CI.
