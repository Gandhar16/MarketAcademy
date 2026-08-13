/**
 * Additive migrations.
 *
 * schema.ts is written as `CREATE TABLE IF NOT EXISTS`, which is exactly right
 * for a fresh database and does nothing at all for one that already exists. A
 * developer who has been running the site since before a column was added would
 * otherwise get "no such column" on the next boot, and the honest fix — delete
 * your database — is not a fix.
 *
 * The rule this file enforces on itself: migrations here are ADDITIVE ONLY.
 * Adding a nullable or defaulted column is safe to run against a live file and
 * safe to run twice. Dropping a column, renaming one, or rewriting data is not,
 * and does not belong in a function that runs on every process start. When one
 * of those is genuinely needed it gets a versioned script and a backup, not a
 * line here.
 */
import type { Db } from './driver';

interface AddColumn {
  table: string;
  column: string;
  /** The type and default, exactly as it appears in schema.ts. */
  definition: string;
}

/**
 * Kept in the same order the columns were introduced. Each one must also exist
 * in SCHEMA_SQL, so a fresh database and a migrated one end up identical —
 * a test asserts that rather than trusting anybody to remember.
 */
const ADDITIONS: AddColumn[] = [
  { table: 'game_runs', column: 'reason', definition: "TEXT NOT NULL DEFAULT ''" },
  { table: 'game_runs', column: 'planned_rr', definition: 'REAL' },
  { table: 'game_runs', column: 'xp_awarded', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'game_runs', column: 'outcome', definition: "TEXT NOT NULL DEFAULT 'flat'" },
  { table: 'game_runs', column: 'stopped_out', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'game_runs', column: 'winning_trades', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'game_runs', column: 'losing_trades', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'game_runs', column: 'encouragement', definition: "TEXT NOT NULL DEFAULT ''" },
  { table: 'user_stats', column: 'lesson_xp', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'user_stats', column: 'game_xp', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'user_stats', column: 'net_pnl', definition: 'REAL NOT NULL DEFAULT 0' },
  { table: 'user_stats', column: 'runs', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'user_stats', column: 'wins', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'user_stats', column: 'losses', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'user_stats', column: 'best_process', definition: 'REAL NOT NULL DEFAULT 0' },
  { table: 'users', column: 'plan', definition: "TEXT NOT NULL DEFAULT 'free'" },
  { table: 'users', column: 'plan_expires_at', definition: 'INTEGER' },
];

async function columnsOf(db: Db, table: string): Promise<Set<string>> {
  // The table name is a literal from ADDITIONS above, never from a request.
  // PRAGMA does not accept a bound parameter for it.
  const rows = await db.all<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((r) => r.name));
}

/** Applies every missing additive change. Safe to call on every start. */
export async function applyMigrations(db: Db): Promise<string[]> {
  const applied: string[] = [];
  const cache = new Map<string, Set<string>>();

  for (const a of ADDITIONS) {
    if (!cache.has(a.table)) cache.set(a.table, await columnsOf(db, a.table));
    const cols = cache.get(a.table)!;
    if (cols.has(a.column)) continue;
    await db.run(`ALTER TABLE ${a.table} ADD COLUMN ${a.column} ${a.definition}`);
    cols.add(a.column);
    applied.push(`${a.table}.${a.column}`);
  }

  return applied;
}

/** Exported for the test that keeps this file and schema.ts in agreement. */
export const MIGRATED_COLUMNS = ADDITIONS.map((a) => `${a.table}.${a.column}`);
