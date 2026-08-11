# Making the lessons readable by someone who knows nothing

## The question that produced this

> "Did we make the lessons in layman terms, since everyone should be able to
> learn it irrespective of level — people who don't know anything should not
> feel overwhelmed?"

The answer was **no**, and it was worth measuring rather than guessing.

## The audit

`src/lib/lesson/jargon.ts` scans every lesson for terms in the glossary and
reports which are used without ever being explained. Run against the 11 lessons
that existed at the time:

**192 uses of jargon across 11 lessons. Zero definitions attached.**

Per lesson it ranged from 9 (`t1-reading-candles`) to 26
(`t4-backtest-pitfalls`).

### Why this was invisible

The lessons were written in plain-sounding English. That is not the same thing as
plain vocabulary. Take a real sentence from the support-and-resistance lesson:

> "Price pauses where resting orders sit."

Nine words, none of them long, and completely opaque to someone who does not know
what an order is — let alone a *resting* one. The gap is invisible to whoever
wrote the sentence and obvious to everyone reading it.

That is precisely the class of problem that needs a mechanism, because the author
is the one person in the world who cannot see which words are unfamiliar.

## The four things built in response

### 1. A glossary — `src/content/glossary.ts`

Every term the site uses, with a `plain` definition written for someone who has
never opened a trading account.

Four rules, all enforced by `glossary.test.ts` rather than by good intentions:

- **A definition may not use jargon it has not declared in `needs`.** Otherwise a
  definition moves the problem rather than solving it. Six foundational words
  (`share`, `price`, `order`, `exchange`, `fill`, `broker`) are exempt — see
  `ASSUMED_VOCABULARY` and keep that list short.
- **No dependency cycles.** A cycle means two definitions each assume the other.
  This caught a real one: `option` needed `premium`, and `premium` needed
  `option`.
- **No definition may depend on a term from a later tier.**
- **Say what it IS before what it does.** "A stop is an instruction" beats "a
  stop protects you from losses".

### 2. Automatic linking — `src/lib/lesson/annotate.ts`

**Nobody marks anything up.** The renderer finds glossary terms itself and
annotates the first occurrence of each within a lesson — where a definition is
useful, and after which it is clutter. Adding a term to the glossary
retroactively annotates every lesson that already used it.

Tapping the dotted underline opens the definition in place. Tap, not hover:
hover does not exist on a phone, and a definition only a mouse can reach is one
half the readers never see.

Three things this had to get right, each of which was a real bug caught by
`annotate.test.ts`:

- **Never rewrite inside a tag.** `class="text-ink"` contains "ink".
- **Re-split after every insertion.** Annotating "market order" inserts a
  `<button>`; a stale split then let "order" match *inside that button*,
  producing a nested button and the wrong definition. The matcher now re-splits
  on every term.
- **Ordinary English is not jargon.** `put`, `call`, `stop`, `gap`, `long`,
  `short` and `option` are verbs and everyday nouns far more often than they are
  instruments. Each is `searchAliases` (findable on the glossary page) rather
  than auto-linked, and `order` carries `neverAfter: ['in']` so that "in order
  to" is left alone. A wrong definition is worse than no definition.

  This list keeps growing, and **every addition was found by C5 failing**, not
  by anybody reviewing the glossary. Writing the derivatives and chart stages
  turned up six more: `basis` ("on a per-trade basis"), `underlying` ("the
  underlying cause"), `spot` ("spot a trend"), `offer` ("apps offer dozens of
  tools"), `edge` ("the right-hand edge of the chart") and `lot` ("is that a
  lot?"). Each now auto-links only in an unambiguous form — `futures basis`,
  `underlying asset`, `spot price`, `lot size` — and stays findable by search.

  By the end of the 65-lesson build the list had grown again: `support`
  ("raise it with support"), `expires` ("the offer expires"). Every one was
  found by C5 failing during a build, never by review, and the fix is always in
  the glossary rather than in the lesson. Expect roughly one new collision per
  four lessons written.

  `edge` is the instructive one. It is genuinely the site's term of art, which
  is *why* the collision matters: a definition of expectancy appearing over "the
  edge of the chart" reads as a bug, and the reader stops trusting the
  underlining everywhere else.

The cost is real and worth naming: the T3 options lesson cannot auto-link its own
subject. It compensates by declaring `introduces: ['option']`.

### 3. Two validator rules

**C5 — jargon ahead of its tier.** Auto-linking handles the ordinary case. What
it cannot fix is a T1 lesson whose *argument* depends on lot sizes and margin — a
popup does not rescue a beginner from a paragraph they were never equipped to
follow, it just tells them how far behind they are.

C5 found 17 such cases. Each was resolved one of three ways:

- **Reworded**, where the term taught nothing. `t0-order-book` closed by naming
  four T1 concepts a beginner had no use for; `t1-real-cost` said "F&O" once in
  passing. Both now say something a beginner can read.
- **Declared in `introduces`**, where the lesson genuinely does teach it. The
  order-book lesson really does teach market orders, limit orders and slippage —
  walking the book *is* the lesson.
- **Fixed as a false positive.** `t1-position-sizing` said "the first option
  confuses SIZE with RISK", meaning the first multiple-choice answer. It now says
  "the first answer".

**R13 — every lesson needs a `plainSummary`.** One sentence a complete beginner
can read, with no jargon in it at all, shown above the objectives on the lesson
page. Objectives are written in the vocabulary of someone who already knows the
subject, which is exactly the wrong first thing for a beginner to see.

A lesson may name the thing it teaches — the options lesson has to be allowed to
say "option" — so terms in `introduces` are exempt. Everything else is not.

### 4. The glossary page — `/kb`

Every term, grouped, searchable. Search matches the **definition text**, not just
the term, because the reader who most needs this page is the one who does not
know the word yet. Someone typing "the price I get if I sell" should land on
`bid`; searching titles only would help exactly the people who need no help.

Each entry shows the plain definition, and on request a deeper `more`, a concrete
`example` with real numbers, what it builds on, and which lessons teach it. That
last list is computed from the lessons, because a hand-kept one would be wrong
within a week.

## What was added afterwards

**Reading level is now checked.** The gap named below as "nothing checks reading
level" was closed by `src/lib/lesson/readability.ts` and rules R14 and R15. The
audit that produced them found something sharper than expected: the *averages*
were already fine — grade 4.9 to 8.1 across every lesson — and the damage was
entirely in the tail, 38 sentences of 32 words or more with the worst at 62.

So R15 polices individual sentences and R14 merely holds the average where it
already was. In practice R15 is the rule that fires: writing the remaining 54
lessons tripped it two to five times each, almost always on a sentence with an
em-dash in the middle. The fix is mechanical — replace the dash with a full stop.

## What is still not covered

- **The glossary is ~80 terms** against 65 lessons. It has kept pace so far
  because C5 fails loudly when it has not.
- **`more` and `example` may use jargon** — only `plain` is checked. That is
  deliberate (the second layer is for a reader who wants the mechanism) but it
  means the second layer can drift.
- **Readability formulas measure sentence and word length, and nothing else.**
  They cannot see whether an argument is ordered sensibly or whether an analogy
  lands. They are a smoke alarm, not a grade.
- **No lesson has been tested on an actual beginner.** Every claim in this
  document is about structure, not about whether it works. That is the single
  biggest gap and no amount of tooling closes it.
