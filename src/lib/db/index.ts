/**
 * The database handle.
 *
 * Two engines behind one interface — see ./driver.ts for the whole argument.
 * The short version: `node:sqlite` locally so the repository clones and runs
 * with no account and no credentials, and libSQL (Turso) in production because
 * no free host gives you a disk that survives a deploy.
 *
 * Which one is in use is decided once, from the environment, and nothing above
 * this file knows or cares.
 */
import type { Db } from './driver';
import { chooseBackend } from './driver';
import { openNodeSqlite, databasePath } from './driver-node';
import { SCHEMA_SQL } from './schema';
import { applyMigrations } from './migrate';

export type { Db } from './driver';
export { databasePath } from './driver-node';
export { chooseBackend } from './driver';

let handle: Db | null = null;
let ready: Promise<Db> | null = null;

/**
 * Opens the database, creates the schema, and applies any missing columns.
 *
 * The promise is cached rather than the handle, so that two requests arriving
 * during a cold start share one initialisation instead of racing to create the
 * schema twice. On a serverless platform that is the normal case, not an
 * exotic one.
 */
export function getDb(): Promise<Db> {
  if (ready) return ready;

  ready = (async () => {
    const backend = chooseBackend();

    // Imported lazily so a production bundle does not pull in node:sqlite and a
    // local one does not need the network client. Neither is heavy; the point
    // is that a misconfigured environment fails on the connection rather than
    // on a module that was never going to work.
    const db =
      backend === 'libsql' ? (await import('./driver-libsql')).openLibsql() : openNodeSqlite();

    await db.exec(SCHEMA_SQL);
    // Brings a database created before a column existed up to the current
    // shape. A no-op on a fresh one, which is why it runs unconditionally.
    await applyMigrations(db);

    handle = db;
    return db;
  })();

  // A failed initialisation must not be cached, or the process is permanently
  // broken by one bad moment on the network.
  ready.catch(() => {
    ready = null;
  });

  return ready;
}

/**
 * A throwaway in-memory database. Every test gets its own, so tests never see
 * each other's users and can run in any order.
 *
 * Always node:sqlite, never libSQL — a test suite that talks to a hosted
 * database is a test suite that fails when the wifi does.
 */
export async function openTestDb(): Promise<Db> {
  const db = openNodeSqlite(':memory:');
  await db.exec(SCHEMA_SQL);
  await applyMigrations(db);
  return db;
}

/** Closes and forgets the singleton. Used by tests and by a graceful shutdown. */
export async function closeDb(): Promise<void> {
  const open = handle;
  handle = null;
  ready = null;
  await open?.close();
}

/** Reported on the health endpoint, so a deploy can be checked at a glance. */
export function describeBackend(): { backend: string; location: string } {
  const backend = chooseBackend();
  return backend === 'libsql'
    ? { backend: 'libsql', location: process.env.TURSO_DATABASE_URL ?? '' }
    : { backend: 'node-sqlite', location: databasePath() };
}
