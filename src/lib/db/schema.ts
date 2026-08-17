/**
 * The schema, inlined as a string rather than read from a .sql file at runtime.
 *
 * Next.js bundles server code and does not carry loose .sql files along with it,
 * so a fs.readFileSync of a sibling file works in dev and fails in production —
 * the worst failure mode there is. One template literal, one source of truth.
 */
export const SCHEMA_SQL = `-- Market Academy schema.
--
-- SQLite via node:sqlite (built into Node 22+), so there is no native module to
-- compile and no service to run. The file lives at MARKET_DB_PATH, defaulting to
-- ./data/market-academy.db. Tests open ':memory:'.
--
-- Two rules shape this schema:
--
--  1. The learner owns their data. Everything keyed to a user cascades on delete,
--     so "delete my account" is one statement and leaves nothing behind.
--  2. The leaderboard ranks PROCESS, not profit (PLAN.md §7 rule 4). P&L is
--     stored because hiding it would be dishonest, but no index orders by it and
--     no ranking query reads it. That is enforced by a test, not by good manners.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL,
  -- Lowercased email. UNIQUE lives here rather than on \`email\` so that
  -- Ram@x.com and ram@x.com cannot both register.
  email_key      TEXT NOT NULL UNIQUE,
  display_name   TEXT NOT NULL,
  -- Always present, even for someone who only ever signs in with Google. That
  -- account gets an UNUSABLE hash: correctly formed, derived from random bytes
  -- nobody holds, so verification runs the full scrypt and fails. A NULL here
  -- would have meant relaxing NOT NULL — which SQLite cannot do additively —
  -- and would have left every password check with a null branch to get wrong.
  password_hash  TEXT NOT NULL,
  -- Whether that hash is a real password or the unusable placeholder above.
  -- It cannot be inferred from the hash itself, which is the entire point of
  -- the placeholder: it is well-formed and indistinguishable, so that a failed
  -- sign-in costs the same time either way. Defaults to 1, which is correct for
  -- every account that existed before social sign-in.
  has_password   INTEGER NOT NULL DEFAULT 1,
  -- Epoch ms the address was proven to belong to this person: they followed a
  -- link sent to it, or a provider that verifies addresses asserted it. NULL
  -- means unproven, which is the state every password sign-up starts in.
  email_verified_at INTEGER,
  created_at     INTEGER NOT NULL,
  last_seen_at   INTEGER NOT NULL,
  -- Opt-in. A learner who never ticks this is absent from the leaderboard
  -- entirely, not merely hidden from the page.
  leaderboard_opt_in INTEGER NOT NULL DEFAULT 0,
  market         TEXT NOT NULL DEFAULT 'IN',
  -- 'free' | 'pro'. The source of truth for access checks is this column, not
  -- the subscriptions table below — it is denormalised on purpose so a gate
  -- check is one row read, not a join, on every lesson and every game page.
  plan           TEXT NOT NULL DEFAULT 'free',
  -- Epoch ms the current Pro grant lapses. NULL means either 'free' (the
  -- column is meaningless) or a lifetime grant (paid once, never expires) —
  -- the two are disambiguated by \`plan\` alone, never by this being NULL.
  plan_expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  -- SHA-256 of the cookie token. A stolen database does not yield live sessions.
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  user_agent   TEXT
);

CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

-- One row per external identity linked to an account: Google, GitHub,
-- Microsoft, Facebook. A user may have several, and signing in with any of them
-- lands on the same account.
--
-- The primary key is (provider, provider_user_id), NOT the email. Providers let
-- people change their address, and reusing the email as the identity would mean
-- a changed Gmail address silently became a different person — or worse, became
-- somebody else's account. The provider's own immutable subject id is the only
-- stable handle.
CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider          TEXT NOT NULL,
  provider_user_id  TEXT NOT NULL,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- What the provider reported at link time. Kept for display and support, and
  -- deliberately NOT used to find the account on later sign-ins.
  email             TEXT,
  linked_at         INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS oauth_accounts_user ON oauth_accounts(user_id);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL,
  completed_at  INTEGER,
  attempts      INTEGER NOT NULL DEFAULT 0,
  best_score    REAL NOT NULL DEFAULT 0,
  last_block    INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS skill_mastery (
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill          TEXT NOT NULL,
  strength       REAL NOT NULL,
  half_life_days REAL NOT NULL,
  last_review_at INTEGER NOT NULL,
  reviews        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, skill)
);

-- One row per completed game run. \`process_json\` holds the TradeRecord fields
-- the process scorer needs, so a score can be recomputed if the scorer changes
-- rather than being frozen at whatever the rules were on the day.
CREATE TABLE IF NOT EXISTS game_runs (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game           TEXT NOT NULL,
  played_at      INTEGER NOT NULL,
  process_score  REAL NOT NULL,
  accuracy       REAL,
  pnl            REAL,
  trades         INTEGER NOT NULL DEFAULT 0,
  process_json   TEXT NOT NULL DEFAULT '[]',
  -- The learner's own account of what they were doing and why. Shown to other
  -- learners on /reasons when the author has opted in to the leaderboard, which
  -- is the only place on this site where one person's thinking is visible to
  -- another. Reasoning is the thing worth copying; a P&L number is not.
  reason         TEXT NOT NULL DEFAULT '',
  -- Mean planned reward-to-risk across the run. NULL when no trade carried a
  -- target, which is a different failure from a bad ratio and is reported as one.
  planned_rr     REAL,
  -- XP this run earned. Zero is an ordinary, expected value: see runXp() for
  -- the gates. Stored rather than recomputed so a learner's total cannot move
  -- underneath them when the rules are next tightened.
  xp_awarded     INTEGER NOT NULL DEFAULT 0,
  -- 'win' | 'loss' | 'flat'. Derived from pnl at write time and stored, so the
  -- feed and the stats never disagree about what happened.
  outcome        TEXT NOT NULL DEFAULT 'flat',
  -- At least one trade ended by the stop being hit. Distinct from whether the
  -- stop was HONOURED, which is a different question and already scored.
  stopped_out    INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades  INTEGER NOT NULL DEFAULT 0,
  -- The message shown for a run that earned nothing. Stored rather than picked
  -- at render time, so re-reading a run does not reshuffle what it said.
  encouragement  TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS game_runs_user ON game_runs(user_id, game);
CREATE INDEX IF NOT EXISTS game_runs_rank ON game_runs(game, process_score DESC);
-- Deliberately absent: an index on pnl. Nothing in this application ranks by it.

CREATE TABLE IF NOT EXISTS user_stats (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  -- Total XP, kept as lesson_xp + game_xp. Displayed; never ranked on directly.
  xp             INTEGER NOT NULL DEFAULT 0,
  -- Split deliberately. Game XP now rewards a well-reasoned WIN, so it carries
  -- an outcome signal. The leaderboard's knowledge component reads lesson_xp
  -- ONLY, which is earned from checkpoints and cannot be influenced by a
  -- profitable trade. That is how the ranking stays outcome-blind (PLAN.md §7
  -- rule 4) while XP still rewards playing well. A test holds it.
  lesson_xp      INTEGER NOT NULL DEFAULT 0,
  game_xp        INTEGER NOT NULL DEFAULT 0,
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_longest INTEGER NOT NULL DEFAULT 0,
  last_active_at INTEGER NOT NULL DEFAULT 0,
  lessons_done   INTEGER NOT NULL DEFAULT 0,
  process_score  REAL NOT NULL DEFAULT 0,
  -- Running totals over every recorded run. Shown on the account and the
  -- leaderboard; not an input to any rank.
  net_pnl        REAL NOT NULL DEFAULT 0,
  runs           INTEGER NOT NULL DEFAULT 0,
  wins           INTEGER NOT NULL DEFAULT 0,
  losses         INTEGER NOT NULL DEFAULT 0,
  best_process   REAL NOT NULL DEFAULT 0,
  updated_at     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS user_stats_xp ON user_stats(xp DESC);

-- One row per fill the simulator's live order book actually executed. The
-- simulator otherwise keeps its state in memory only (see lib/sim/reducer.ts)
-- and would lose every position and every line of the blotter on a refresh;
-- this is what survives one — the client replays these fills, oldest first,
-- through the same fill logic that produced them the first time, and gets
-- back the identical account. \`realised\` is added to \`user_stats.net_pnl\`
-- the moment a fill closes or reduces a position, same as a completed game
-- run, so the simulator shares the one account balance rather than floating
-- free of it. \`id\` is caller-supplied and is the de-dupe key: a retried POST
-- for a fill already on file is a no-op, not a double-counted P&L.
CREATE TABLE IF NOT EXISTS sim_fills (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at         INTEGER NOT NULL,
  symbol     TEXT NOT NULL,
  product    TEXT NOT NULL,
  side       TEXT NOT NULL,
  quantity   REAL NOT NULL,
  price      REAL NOT NULL,
  realised   REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS sim_fills_user ON sim_fills(user_id, at);

-- One row per trade a cash-based game (Chart Replay, Margin Call, Expiry Day,
-- Circuit Breaker, Earnings Roulette) actually closed. Realised P&L is banked
-- into \`user_stats.net_pnl\` the moment the trade closes, not when the run is
-- later filed for XP — a win or a loss is real money the instant it happens,
-- and a learner switching games mid-session must not find the header back at
-- the base balance because they had not yet clicked "file this run". Filing a
-- run (see recordGameRun in lib/db/progress.ts) no longer touches net_pnl at
-- all; it only scores and records what already happened here. \`id\` is
-- caller-supplied and is the de-dupe key, same as sim_fills.
CREATE TABLE IF NOT EXISTS game_fills (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game     TEXT NOT NULL,
  at       INTEGER NOT NULL,
  pnl      REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS game_fills_user ON game_fills(user_id, at);

-- Single-use links sent to an email address: confirm this address, reset this
-- password. One table rather than two, because the rules that matter — hashed
-- at rest, single use, short expiry, invalidate the siblings on use — are
-- identical and would otherwise be written twice and drift.
--
-- \`token_hash\`, never the token. The email carries the only copy; a database
-- dump yields nothing that can be redeemed, exactly as with sessions.
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- 'verify' | 'reset'
  purpose     TEXT NOT NULL,
  -- The address it was sent TO, which is not always users.email: a change-of-
  -- address confirmation goes to the new one before it becomes the account's.
  email       TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  -- Set the moment it is redeemed. The row is kept rather than deleted so a
  -- second click on the same link can say "already used" instead of the
  -- alarming "this link is invalid".
  used_at     INTEGER
);

CREATE INDEX IF NOT EXISTS email_tokens_user ON email_tokens(user_id, purpose);
CREATE INDEX IF NOT EXISTS email_tokens_expiry ON email_tokens(expires_at);

-- Failed sign-in attempts, for throttling. Keyed on the email being attempted
-- AND the client address, so one attacker cannot lock out a real user by
-- hammering their address from elsewhere.
CREATE TABLE IF NOT EXISTS login_attempts (
  key        TEXT NOT NULL,
  at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts(key, at);

-- One row per Razorpay order (lifetime) or subscription (monthly/quarterly/
-- annual) a user has ever started checkout on. \`users.plan\`/\`plan_expires_at\`
-- is what every access check reads; this table is the audit trail and the
-- thing a webhook updates — see lib/db/payments.ts for why the two are kept
-- separate rather than computing plan state from this table on every read.
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id                 TEXT NOT NULL,
  -- Present for a one-time (lifetime) purchase, NULL for a recurring plan.
  razorpay_order_id       TEXT,
  -- Present for a recurring plan, NULL for a one-time purchase.
  razorpay_subscription_id TEXT,
  -- 'created' | 'active' | 'cancelled' | 'completed' | 'halted' | 'expired'.
  -- Mirrors Razorpay's own subscription status vocabulary directly rather than
  -- inventing a parallel one, so a webhook payload maps onto this with no
  -- translation table to keep in sync.
  status                  TEXT NOT NULL DEFAULT 'created',
  -- Epoch ms the current billing period ends. NULL for a lifetime purchase.
  current_period_end      INTEGER,
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS subscriptions_user ON subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_razorpay_order ON subscriptions(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_razorpay_subscription ON subscriptions(razorpay_subscription_id) WHERE razorpay_subscription_id IS NOT NULL;

-- Every Razorpay webhook event actually applied, keyed on Razorpay's own event
-- id. Razorpay retries a webhook delivery on anything but a 200, so the same
-- event WILL arrive more than once in the ordinary case, not just as a
-- failure mode — this table is what makes applying one twice a no-op instead
-- of a double-charge or a double-extension of a billing period.
CREATE TABLE IF NOT EXISTS payment_events (
  razorpay_event_id TEXT PRIMARY KEY,
  event_type        TEXT NOT NULL,
  processed_at      INTEGER NOT NULL
);
`;
