# Accounts, the database, and the leaderboard

Everything about how a learner is identified, what is stored about them, and how
a rank is computed. If you change any of it, change this file too.

---

## 1. Why there is a database at all

There was not one until now, and the reason for adding it is narrow: progress
should survive a new device, and a leaderboard needs somewhere to compare people.
Neither of those is possible in `localStorage`.

What did **not** change is that the site works completely without an account.
`localStorage` remains the source of truth for a running session; the server is a
merge target. A signed-out learner loses no feature except the leaderboard, and
never sees a sign-up wall.

## 2. The database

**SQLite via `node:sqlite`**, which ships inside Node 22+.

That choice buys: no native module to rebuild on every Node upgrade, no Docker,
no connection string, no free-tier database that expires. `git clone` and
`pnpm dev` gives you working accounts.

The honest cost: SQLite is a single-writer store on a local disk. It is right for
a learning site with thousands of users and wrong for one with millions. Every
query lives behind the repository functions in `src/lib/db/`, so replacing it is
bounded work rather than an archaeology project.

| File | What it owns |
|---|---|
| `src/lib/db/schema.ts` | The DDL, inlined as a string |
| `src/lib/db/index.ts` | Connection, WAL, `openTestDb()` |
| `src/lib/db/users.ts` | Accounts, sessions, sign-in throttling |
| `src/lib/db/progress.ts` | Server-side progress, snapshot merge, game runs |
| `src/lib/db/leaderboard.ts` | Ranking |

The schema lives in a `.ts` file rather than a loose `.sql` one because Next.js
bundles server code and does not carry stray files along with it — a
`readFileSync` of a sibling `.sql` works in dev and fails in production, which is
the worst failure mode available.

The database file defaults to `./data/market-academy.db` and honours
`MARKET_DB_PATH`. Tests pass `:memory:` and each gets its own, so they can run in
any order.

## 3. Passwords

**scrypt** from `node:crypto`, at OWASP's 2024 parameters (N=2¹⁷, r=8, p=1 —
about 128 MB per hash, which is the point).

Not bcrypt: it silently truncates at 72 bytes, turning a long passphrase into a
shorter one without telling anyone.

The stored format is `scrypt$N$r$p$salt$hash` — self-describing, so the cost
parameters can be raised later without invalidating everyone's password.
Verification uses the parameters recorded in the hash, not today's, and refuses
absurd ones so a hostile row cannot ask the process to allocate a gigabyte.

The only password rule is **length ≥ 10**. There is no strength meter, because
strength meters teach people to put a `1` and a `!` on the end of a word, which
produces a password that scores well and breaks instantly.

## 4. Sessions

- Token: 32 random bytes, base64url.
- **Stored as a SHA-256 hash.** A database dump does not hand over live sessions.
- Cookie: `httpOnly`, `sameSite=lax`, `secure` in production only (a `Secure`
  cookie on a plain-http localhost is silently dropped, which looks like broken
  auth).
- 30-day lifetime, slid forward on use but written at most once a day, so a page
  view is not a write.
- Expired rows are deleted on encounter rather than merely ignored, so the table
  does not only grow.
- Changing a password deletes every session for that user. That is the entire
  reason people change passwords.

### Sign-in throttling

8 failures per 15 minutes, keyed on **email + client address together**.

Keying on the email alone would let anyone lock a stranger out of their own
account by guessing badly on purpose. There is a test for exactly that.

Failed and successful sign-ins take the same time: a miss is compared against a
real hash of a value nobody can supply, so response time does not reveal which
addresses are registered.

## 5. Progress sync

`POST /api/progress/sync` sends the browser's snapshot and receives the merged
one — both directions in one round trip, because the interesting case is a
learner who worked signed-out on one device and signed-in on another. That is a
merge, not an upload.

**The merge takes the better value on every field, not the more recent one.**
Last-write-wins silently throws away a device's history; a learner who studied on
a phone and then opened a laptop would lose whichever they touched first. Merging
by best-score and furthest-progress means the worst case is keeping an
achievement twice, never losing one.

- `attempts`, `bestScore`, `lastBlockIndex`, `xp`, streaks → **max**
- `completedAt` → **earliest non-null**, because that is when it actually happened
- mastery `strength` → the more recent review; `halfLifeDays` → the longer

Two things are never taken on trust from the client: `lessonsDone` is recounted
from the rows, and `processScore` is derived only from recorded game runs.

## 6. Game runs and the process score

`POST /api/progress/run` accepts **trade records, not a score**. The server does
the scoring. A leaderboard whose numbers are supplied by the thing being ranked
is decoration.

The honest limit: the trade records are still client-reported, because the game
runs in the browser. What this buys is that every score on the board came from
one scorer with one set of rules, and that inflating a score requires lying about
behaviour rather than about a number.

The individual `TradeRecord`s are stored, not just the resulting number, so that
when the scorer changes — and it will — historical runs can be rescored instead
of the board mixing two definitions of the same metric.

A user's rolling process score is the average of their most recent
`PROCESS_WINDOW` (20) runs. Recent, so improvement shows up; averaged, so one
lucky run does not.

## 7. The leaderboard

> PLAN.md §7 rule 4: a disciplined loss ranks above a reckless win.

A leaderboard is where that rule either holds or quietly dies, because a
leaderboard is the loudest statement a product makes about what it values. Every
trading game that ranks by returns teaches people to gamble: over a short contest
the winner is whoever took the most risk and got away with it, and everyone
watching learns that lesson whether or not it was intended.

**So P&L is stored, shown, and never ranked.**

```
score = (discipline × 50 + knowledge × 35 + consistency × 15) / 100
```

| Component | Source | Shape |
|---|---|---|
| discipline | rolling process score | linear, scaled by `min(1, runs/5)` |
| knowledge | XP | `log1p(xp) / log1p(20 000)`, capped |
| consistency | longest streak | `min(1, streak/60)`, capped |

- **XP is log-scaled** so grinding cannot dominate. The gap between nothing and
  ten lessons matters far more than the gap between 200 and 210.
- **Discipline is discounted below 5 runs**, not zeroed. A beginner with two good
  runs belongs on the board, behind the person who has proved it twenty times.
- **Opt-in only.** Leaving it off means absent from the board, not hidden from
  the page.
- **Ties share a rank and the next one skips** — 1, 2, 2, 4. Anything else
  invents a distinction the data does not support.

### How this is enforced rather than promised

Four tests in `src/lib/db/leaderboard.test.ts`:

1. A disciplined loser outranks a reckless winner, and the board shows the
   winner is down money.
2. Multiplying every recorded P&L by 100 changes **no** rank and **no** score.
3. `leaderboardInputs()` enumerates what a rank is made of; `pnl` is not in it.
4. No index in the schema mentions `pnl` — ranking by it is not even cheap.

The P&L column is present, last, greyed, unsortable, and footnoted. Hiding it
would be evasive; ranking by it would teach the opposite of everything the
lessons argue for.

## 8. Deleting an account

`DELETE /api/auth/me` is a real delete. Every table cascades from `users`, so
one statement removes the account, its sessions, its progress, its mastery
record and every game run. There is no archive and no recovery window — nothing
is retained to undo it with, and the UI says so and asks the learner to type
`DELETE` first.

## 9. What is deliberately absent

- **No email is ever sent.** No verification, no password reset, no marketing.
  The address is a login handle. A reset flow needs a mail provider, and adding
  one to satisfy a hypothetical is how a project acquires an ops burden.
- **No OAuth.** One more provider to depend on, for an account that guards a
  learning streak.
- **No roles or admin UI.** Nothing yet needs one.
- **No rate limit on registration beyond the shared HTTP limiter.**

Each of these is a real gap, not an oversight. Password reset is the one most
likely to be needed first.
