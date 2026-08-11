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

## 3. Curriculum — one sequence, 10 stages, 65 steps — COMPLETE

Each lesson = 8–15 min, 6–12 blocks, ≥60% interactive, at least one worked example
followed within three blocks by a question about it, and a graded checkpoint that
asks the learner to produce an answer rather than recognise one.

The tiers below are how difficulty is priced and how mastery decay is grouped.
The learner never navigates them: `/learn` is one numbered road of 60 steps, and
the mapping from stages to tiers is in §3f.

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

---

### M4 · Polish — `[ ]`

- [x] Mobile layout pass across header, pages, leaderboard, widgets — see §3k
- [ ] Accessibility audit: keyboard paths, focus order, screen-reader labels on charts
- [ ] Motion and transitions (Framer Motion is installed, unused so far)
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
