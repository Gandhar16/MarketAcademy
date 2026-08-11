# The course as one sequence

## The problem this replaced

The curriculum used to be six tier buckets — T0 Foundations through T5 Edge
Cases — each holding one or two finished lessons. `/learn` rendered those
buckets, so a learner arriving for the first time saw eleven lessons scattered
across six mostly-empty headings.

That layout answers "how is this material organised", which is a question the
author has. It does not answer "where do I start and what comes next", which is
the only question anybody actually arrives with. Six half-empty buckets read as
a shelf of loose chapters, not as a course.

## What replaced it

`src/content/syllabus.ts` is the single ordered road: **12 stages, 84 steps**,
from what a share is to the edge cases that end accounts.

Every stage is titled with the plain-English **question it answers**, not with a
topic name. A beginner does not know they want "market microstructure"; they
know they want to know why their order filled worse than the screen showed.

| # | Stage | The question it answers | Tier | Steps |
|---|---|---|---|---|
| 1 | Ground floor | What am I actually buying, and who sells it to me? | T0 | 6 |
| 2 | Placing a trade | How do I buy something without getting a worse price than I expected? | T1 | 5 |
| 3 | Staying alive | How do I make sure one bad trade does not end this? | T1 | 4 |
| 4 | Owning for years | What if I do not want to trade at all? | T1 | 4 |
| 5 | Reading a chart honestly | Do the patterns everyone draws actually predict anything? | T2 | 6 |
| 5b | The technician's toolkit | How do traders actually mark up a chart, and which of those markings mean anything? | T2 | 13 (11 built) |
| 6 | Reading a business | Is this company worth what it costs? | T2 | 5 |
| 6b | Reading a business like an analyst | A company looks fine on the surface. What would change your mind? | T2 | 6 (3 built) |
| 7 | Your own head | Why do I keep doing the thing I promised myself I would not? | T2 | 3 |
| 8 | Leverage and derivatives | How do futures and options work, and why do they end so many accounts? | T3 | 12 |
| 9 | Thinking like a professional | How do people who do this for a living decide anything? | T4 | 8 |
| 10 | The things that end accounts | What is going to happen that nobody warned me about? | T5 | 12 |

Tiers still exist. They are how difficulty is priced (`lessonXp`) and how
mastery decay is grouped. The learner never has to think in them.

## The decisions worth defending

**Survival before selection.** Stage 3 (sizing, stops, expectancy) comes before
stage 5 (charts) and stage 6 (accounts). A good idea at the wrong size still
bankrupts you, and every course that teaches chart patterns in week one has the
order backwards.

**Holding is offered before trading.** Stage 4 says plainly that most people are
better served by owning an index for years than by trading it. A site that
monetised activity could not put that at step 20; this one has no reason not to.

**Behaviour comes after the first real decisions, not before.** A bias you have
already fallen for teaches more than one described to you in advance, so stage 7
follows the stages where the learner has actually chosen something.

**Gaps are visible.** A topic with no lesson written yet still gets its step
number, its one-line description, and a plain "not written yet" label on the
map. Hiding it would make the course look finished by making the missing parts
invisible — the same dishonesty as a fake progress bar.

**79 of 84 steps are written.** Five gaps are visible on the map right now —
`in-t2-rsi-divergence`, `in-t2-adx-trend-strength` in stage 5b, and
`in-t2-moat`, `in-t2-reading-annual-report`, `in-t2-promoter-signals` in
stage 6b — each with its title, one-line description and a "not written yet"
label rather than being hidden. The mechanism that makes this honest rather
than embarrassing is the same one from the original 65-lesson build: a gap
in place is more honest than a course that looks finished because the
missing parts are invisible. Full scope for each gap is in `PLAN.md` §3n.

**Stages 5b and 6b were inserted, not appended.** 5b sits after stage 5
because it depends on the base-rate scepticism stage 5 already taught. 6b
sits after stage 6 because it depends on the three statements and first
valuation stage 6 already taught, and before stage 7 because it is
depended on by nothing in behaviour. Inserting a stage mid-road only
requires giving it an id that sorts between its neighbours in the array —
step numbers are derived from array position, so nothing else needed
renumbering. Full design rationale in `PLAN.md` §3m and §3n.

**Nothing is locked.** Prerequisites are stated and validated; they are not
enforced in the UI. A learner who already knows what a candle is should not have
to sit through it, and a lock would teach them the site does not believe them.

## Two stages worth reading as worked examples

Every stage is now built. These two are the clearest illustrations of how one is put together.

**Stage 5 — reading a chart honestly (6 of 6).** The stage answers the patterns
question in full. `in-t2-pattern-catalogue` tests all ten named patterns at once
against real bars — engulfing both ways, hammer, shooting star, doji, gap up,
gap down, inside bar, three up days, three down days. No results table lives in
the lesson file: every figure is computed at render time from
`src/lib/analysis/patterns.ts`, because a hardcoded number would be a claim
about the world that quietly rots. The lesson also puts the contradiction on the
page — three down days is taught as capitulation and three up days as momentum,
which is two opposite rules for the same shape.

Around it: **trend** (a rule two honest people would agree on, or it is a feeling
with vocabulary attached), **volume** (every trade has a buyer and a seller, so
"more buyers than sellers" cannot be true of anything), and **indicators** (all
of them are arithmetic on prices already on screen; an N-bar average is about
N/2 bars behind, always).

**Stage 8 — leverage and derivatives (12 of 12).** It used to open on "an option
is a bet with a clock on it" — a good lesson, and the *second* one. It assumed a
reader who already knew you can hold a contract about a share without holding
the share, which is exactly the assumption a course starting from zero is not
allowed to make. The whole stage was rebuilt as a ramp, and the order is the
argument:

1. **What margin actually lends you.** Not about derivatives at all — about the
   one mechanism that makes every later contract dangerous. Computes the loss
   before it mentions the gain, because "trade 5x with the same capital" is
   true and is an advertisement.
2. **A contract about a share is not a share.** A farmer agreeing in June to
   sell rice in November. No pricing at all; a formula here would bury the one
   idea the step is for. Ends on the question that splits the stage: *must you,
   or may you?*
3. **Futures: an agreement to trade later.** The simpler object — no premium, no
   decay, no strike, a straight line for a payoff. Every difficulty it has,
   options also have, and they are far easier to see when nothing else moves.
   Teaches the basis as carry, not as sentiment.
4. **Calls and puts, from scratch.** Most courses teach the four positions as a
   2×2 grid, which is tidy and teaches nothing, because a grid does not say who
   is exposed to what. This teaches one position properly and derives the other
   three by asking what the person on the other side must be feeling.
5. **Which strikes exist, and why.** The grid is published by the exchange, not
   chosen by traders. Moneyness is a relationship rather than a property. A
   cheap row is cheap because it is currently worth nothing. Recommends no
   strike — "buy slightly out of the money" is a position instruction wearing a
   teacher's coat.
6. **An option is a bet with a clock on it.** What you are actually paying for.
7. **The greeks you can feel.** Four questions, no formulas, ordered by how much
   damage each does to a beginner rather than by convention: theta first,
   because it is the only certainty.
8. **India VIX.** Mostly about what it is *not*: quoted annualised, so 14
   implies about 4% for a month; and built from contracts that pay both ways, so
   no direction can get into it. A size, not a sign.
9. **Implied volatility and the crush.** "IV is 45%" and "this is expensive" are
   one sentence in two units. The embedded game does what prose cannot — the
   learner gets the direction right and loses.
10. **Combining legs into a shape.** One operation, not a bestiary of twelve
    names: a leg bends the shape. Counts the eight bid-ask crossings a four-leg
    structure pays, which is what the tutorials leave out.
11. **Expiry-day mechanics.** Settlement is an average, not the last tick. Pin
    risk. And index ends in cash while single stocks end in shares.
12. **Paying to reduce a risk.** Computes the annual cost first, then decides.
    Protection has a negative expected return and can still be rational, and
    saying both halves is the lesson.

## The invariants, and what holds them

`validateSyllabus(lessons, sequence)` in `src/lib/lesson/validator.ts`:

- **C6-not-in-syllabus** — a registered lesson that is not on the road is
  unreachable except by URL.
- **C6-syllabus-orphan** — a topic marked `built: true` with no lesson behind it
  is a link to nowhere.
- **C7-sequence-inversion** — a lesson may not depend on something further down
  the road than itself. C4 already forbids a higher *tier*; this is the finer
  version within the one linear order.

`validateSyllabus` takes the sequence as an argument, defaulting to the real
one. `validateCurriculum` deliberately does **not** call it: that function judges
a set of lessons against each other and nothing else, which is what lets it be
tested with three synthetic lessons. A check that silently reads a module-level
constant is a check nothing else can be tested around.

`src/content/syllabus.test.ts` adds the properties the validator cannot see:
the steps are numbered 1..N with no gaps, difficulty never goes backwards across
stages, `nextBuilt`/`previousBuilt` step over unwritten topics rather than dead-
ending on them, and `resumeAt` returns the *earliest* unfinished lesson rather
than the newest — finishing step 12 out of order must not skip step 3.

## Navigating it

- `/learn` — the whole road, one column at every width, with the learner's
  position, a continue button, and per-stage completion.
- `/learn/[lesson]` — carries "Step 46 of 65 · Thinking like a professional" at
  the top and previous/next cards at the bottom. A lesson reached from a search
  result is otherwise context-free, and the step counter is the difference
  between a page and a course.

## Adding a lesson

1. Add the topic to the right stage in `src/content/syllabus.ts` if it is not
   already listed, in the position it belongs.
2. Write the lesson with the topic's `id` as the lesson id. They must match
   exactly — that identity is what lets the order be derived rather than
   maintained in two places.
3. Register it in `src/content/registry.ts`.
4. Flip `built: true` on the topic.

Getting any of those wrong fails `pnpm verify`, with a message that says which.
