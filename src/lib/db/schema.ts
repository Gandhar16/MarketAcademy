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
  password_hash  TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  last_seen_at   INTEGER NOT NULL,
  -- Opt-in. A learner who never ticks this is absent from the leaderboard
  -- entirely, not merely hidden from the page.
  leaderboard_opt_in INTEGER NOT NULL DEFAULT 0,
  market         TEXT NOT NULL DEFAULT 'IN'
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

-- Failed sign-in attempts, for throttling. Keyed on the email being attempted
-- AND the client address, so one attacker cannot lock out a real user by
-- hammering their address from elsewhere.
CREATE TABLE IF NOT EXISTS login_attempts (
  key        TEXT NOT NULL,
  at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts(key, at);
`;
