# XP, risk-reward, and the reasoning feed

## The design being rejected

The obvious way to award XP for a trading game is: some for finishing, more for
profit. It is what every "learn to trade" app with a leaderboard ships, and it
is the design that teaches gambling.

A learner who puts the whole account on one coin-flip and wins reaches the top
of the board, and the lesson their brain records is *that worked*. From the
outside, a lucky decision and a good one produce an identical number.

## The design that is here

**Five gates, and the order of them is the whole point.**

`runXp(trades, reason, processScore)` in `src/lib/progress/mastery.ts`.

| # | Gate | Threshold | About |
|---|---|---|---|
| 1 | A reason you can defend | ≥ 40 characters | the decision |
| 2 | Reward worth the risk | mean planned R:R ≥ 1.5:1, **and** every trade had a target | the decision |
| 3 | No gambling markers | no trade over 6% of equity; no stop moved or ignored | the decision |
| 4 | Process floor | `processScore` ≥ 60 | the decision |
| 5 | **The plan paid** | net P&L > 0 | the result |

Gate 5 comes **last**, and it can only be reached by a run that has already
cleared the other four. A profitable run that risked a fifth of the account
never gets there — gate 3 killed it. So the result is a multiplier on a decision
already judged sound, never a way to buy past a bad one.

That is a different claim from "profit is irrelevant", and it is deliberately
the one this makes.

## What a winning run is worth

```
xp = BASE_RUN_XP + (MAX_RUN_XP − BASE_RUN_XP) × (0.5 × processQuality + 0.5 × rrQuality)
```

- `BASE_RUN_XP` = 90 — cleared every gate and won.
- `MAX_RUN_XP` = 200 — perfect process on a 4:1 plan.
- `processQuality` scales 60 → 100 on the process score.
- `rrQuality` scales 1.5:1 → 4:1 on the mean planned reward-to-risk.

**It does not scale with the size of the win.** Winning is a gate, not a
quantity — otherwise the biggest number wins again, and the biggest number
belongs to whoever took the most risk. A ₹1 win and a ₹10,000,000 win on the
same plan pay identically, and a test says so.

A 4:1 plan executed cleanly is worth more than twice a 1.5:1 plan scraped
through. That is the weighting doing what it is for.

## Losing runs

Zero XP, and a message. Never the same message twice in a row.

`src/lib/progress/encouragement.ts` holds five pools — `stopped-out`, `lost`,
`gates-failed`, `gambled`, `flat` — and picks by **FNV-1a hash of the run id**,
not `Math.random()`. The message is stored on the run and shown again on every
read; a random pick would give the same run different words each time the page
loaded, which reads as a bug. Hashing gives one stable message per run, varied
across runs, and reproducible in a test.

The pools are constrained by a test: no line may predict a future result. "It
will come good", "you'll get the next one", "you're due" — that is gambler's
talk and it is the exact voice this site exists to argue with. What they may
say is that the decision was sound, because a stop that was hit and honoured is
the system working:

> Your stop did its job and you let it. That is the single hardest habit in this
> and you already have it.

In the UI the encouragement renders **above** the gate list. The gates are
useful and they are also a column of red crosses, and that should not be the
first thing somebody reads after a stop-out.

## Why this does not break the leaderboard

Game XP now carries an outcome signal. The leaderboard's knowledge component
used to read total XP — so winning would have bought rank, quietly, with nobody
having decided to allow it.

So `user_stats` splits the number:

| Column | Earned from | Ranked on |
|---|---|---|
| `lesson_xp` | checkpoints | **yes** — the knowledge component |
| `game_xp` | winning runs that cleared the gates | no |
| `xp` | `lesson_xp + game_xp`, kept in sync | no — displayed only |

A test plays ten large winning runs and asserts every rank and score on the
board is byte-identical afterwards. PLAN.md §7 rule 4 holds exactly where it
decides what the product values *in public*.

The split also fixed a latent sync bug: `mergeSnapshot` used to write the
client's XP straight to `xp`. A phone that had never played a game would have
pushed its lesson XP and silently wiped out game XP earned on a laptop. Client
XP now goes to `lesson_xp` only, and `loadSnapshot` returns `lesson_xp` as the
client's `xp` — returning the combined total would fold game XP into lesson XP a
little more on every device swap. `IncomingSnapshot` (no totals) and `Snapshot`
(with them) are separate types so the boundary is unforgeable rather than
remembered.

## What every run records

`game_runs` — one row per run, complete enough to rescore or audit later:

`process_score` · `accuracy` · `pnl` · `trades` · `process_json` (the raw
TradeRecords) · `reason` · `planned_rr` · `xp_awarded` · `outcome`
(win/loss/flat) · `stopped_out` · `winning_trades` · `losing_trades` ·
`encouragement`

`user_stats` — running totals, updated inside the same transaction:

`lesson_xp` · `game_xp` · `xp` · `net_pnl` · `runs` · `wins` · `losses` ·
`best_process` · `process_score` · streaks · `lessons_done`

**P&L accumulates whichever way a run went.** A learner is entitled to know what
their decisions actually cost, and a scoreboard that only added up the good runs
would be the same lie as a broker's marketing page.

`TradeRecord` gained `stoppedOut`, which is a genuinely different question from
`honouredStop`: a trade can honour a stop it never reached, and a trade can
reach one that was dragged away first. Only one of those was being recorded.

## The reasoning feed

`/reasons`, backed by `src/lib/db/reasons.ts` and `GET /api/reasons`.

Every filed run carries the learner's own account of what they were trying to
do. On Chart Replay the box is pre-filled with the theses they wrote before each
entry — they already did that thinking — but stays editable.

**Ordered by time, not by score.** Sorting by process score would make it a
second leaderboard showing the same handful of runs for weeks. Newest-first
shows what people are thinking today, including the runs that went wrong, which
are the more instructive half. "Cleared every gate" is a filter, not the
default.

**Only opted-in learners appear**, and only runs carrying a reason.
`reasonsByUser` shows a learner their own history regardless — it is their data.

**P&L is shown, greyed and last.** A card with careful reasoning and a loss is
the most useful thing on the page, and it has to be possible to see that it
lost.

### Safety

The reason is learner-supplied text shown to other learners. Stripped of angle
brackets at the API boundary, stored as text, rendered through React as a
string — never `dangerouslySetInnerHTML`. Three layers, none load-bearing alone.

## Migrations

`schema.ts` is `CREATE TABLE IF NOT EXISTS`, which does nothing to an existing
database. `src/lib/db/migrate.ts` carries additive `ADD COLUMN` changes only:
safe against a live file, safe to run twice, run on every start.

Two tests keep it honest — one drops `game_runs` to its old shape and asserts
the migration restores it and is then idempotent; the other asserts the
migration is a **no-op on a fresh database**, which is what stops `migrate.ts`
and `schema.ts` drifting apart.
