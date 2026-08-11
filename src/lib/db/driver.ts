/**
 * One database interface, two engines behind it.
 *
 * WHY THIS EXISTS
 *
 * The app was written against `node:sqlite`, which is synchronous and writes to
 * a file on local disk. That is a genuinely good choice for development — no
 * native module, no service, no connection string, `git clone` and it works.
 * It is also unhostable: every free platform that runs Node either has no
 * persistent disk at all, or has one that is wiped on each deploy.
 *
 * So persistence goes through this interface, and there are two drivers:
 *
 *   node:sqlite — local development and the entire test suite. No account, no
 *                 network, no credentials. `pnpm dev` must never require a
 *                 cloud login, or the project stops being clonable.
 *   libSQL      — production. Turso speaks the SQLite dialect, so the schema,
 *                 every query, and every migration in this directory are the
 *                 same text against both.
 *
 * THE COST, STATED PLAINLY
 *
 * The interface is async even though one of the two drivers is not. That is
 * unavoidable: a remote database cannot be made synchronous, and an interface
 * built around the synchronous one would only work locally. Every repository
 * function in this directory therefore awaits, including in tests where the
 * await resolves immediately.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *
 * No query builder, no ORM, no dialect abstraction. Both engines speak the same
 * SQL, so the interface only has to carry statements and rows across. Adding a
 * layer that rewrote queries would buy portability to a dialect nobody has
 * asked for, at the cost of every query becoming unreadable.
 */

/** What a parameter may be. Booleans are converted to 1/0 by the caller. */
export type SqlValue = string | number | bigint | null | Uint8Array;

export interface Db {
  /** Every matching row, as plain objects keyed by column name. */
  all<T>(sql: string, ...args: SqlValue[]): Promise<T[]>;
  /** The first row, or undefined. */
  get<T>(sql: string, ...args: SqlValue[]): Promise<T | undefined>;
  /** A statement whose result is not read. */
  run(sql: string, ...args: SqlValue[]): Promise<void>;
  /**
   * Several statements at once, with no parameters. Used for the schema and
   * for nothing else — it is the one entry point that cannot be parameterised,
   * so it must never see a value that came from a request.
   */
  exec(sql: string): Promise<void>;

  /**
   * Runs `fn` inside a transaction, committing on return and rolling back on
   * throw.
   *
   * Note the signature: `fn` receives its OWN `Db`. That is not decoration. A
   * remote driver runs a transaction on a dedicated connection, so a statement
   * issued against the outer handle during a transaction would execute outside
   * it — silently, and only in production. Passing the scoped handle makes the
   * mistake impossible to write rather than merely discouraged.
   */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;

  close(): Promise<void>;
}

/** Where the data lives, decided once from the environment. */
export type Backend = 'libsql' | 'node-sqlite';

/**
 * libSQL wins whenever it is configured, so a deployed environment cannot fall
 * back to a local file it does not have. Everything else — development, CI,
 * tests — uses node:sqlite.
 *
 * Takes a plain record rather than `NodeJS.ProcessEnv`: the framework augments
 * that type with required keys, and this only ever reads one optional one.
 */
export function chooseBackend(env: Record<string, string | undefined> = process.env): Backend {
  return env.TURSO_DATABASE_URL ? 'libsql' : 'node-sqlite';
}
