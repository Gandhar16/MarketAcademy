/**
 * The `node:sqlite` driver — development, CI, and every test.
 *
 * Synchronous underneath, async at the boundary. The wrapping costs a
 * microtask per query and buys the property that the same repository code runs
 * against both engines. See ./driver.ts for why that trade is the right way
 * round.
 *
 * This file is imported only when no Turso URL is configured, so a production
 * deployment never loads it and never needs a writable disk.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { Db, SqlValue } from './driver';

/** Where the file lives. `:memory:` is honoured, which is how tests use it. */
export function databasePath(env: Record<string, string | undefined> = process.env): string {
  return env.MARKET_DB_PATH ?? path.join(process.cwd(), 'data', 'market-academy.db');
}

function wrap(handle: DatabaseSync, inTransaction: boolean): Db {
  const db: Db = {
    async all<T>(sql: string, ...args: SqlValue[]): Promise<T[]> {
      return handle.prepare(sql).all(...(args as never[])) as unknown as T[];
    },

    async get<T>(sql: string, ...args: SqlValue[]): Promise<T | undefined> {
      return handle.prepare(sql).get(...(args as never[])) as unknown as T | undefined;
    },

    async run(sql: string, ...args: SqlValue[]): Promise<void> {
      handle.prepare(sql).run(...(args as never[]));
    },

    async exec(sql: string): Promise<void> {
      handle.exec(sql);
    },

    async tx<T>(fn: (scoped: Db) => Promise<T>): Promise<T> {
      // SQLite has no nested transactions, and the places that would nest here
      // are all cases where the outer one is already doing the job. Joining it
      // is correct; issuing a second BEGIN would throw.
      if (inTransaction) return fn(db);

      handle.exec('BEGIN');
      try {
        const result = await fn(wrap(handle, true));
        handle.exec('COMMIT');
        return result;
      } catch (err) {
        handle.exec('ROLLBACK');
        throw err;
      }
    },

    async close(): Promise<void> {
      handle.close();
    },
  };

  return db;
}

export function openNodeSqlite(target = databasePath()): Db {
  if (target !== ':memory:') fs.mkdirSync(path.dirname(target), { recursive: true });

  const handle = new DatabaseSync(target);

  // WAL lets reads proceed while a write is in flight, which matters as soon as
  // two people are on the site at once. It is a no-op for :memory:.
  if (target !== ':memory:') handle.exec('PRAGMA journal_mode = WAL');
  handle.exec('PRAGMA foreign_keys = ON');
  // Without this, a concurrent write throws SQLITE_BUSY immediately instead of
  // waiting the moment or two the other writer actually needs.
  handle.exec('PRAGMA busy_timeout = 5000');

  return wrap(handle, false);
}
