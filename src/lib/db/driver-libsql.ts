/**
 * The libSQL driver — production, against Turso.
 *
 * Turso speaks the SQLite dialect, so every statement in this directory is the
 * same text here as it is against `node:sqlite`. Nothing is rewritten and
 * nothing is dialect-specific; the only real differences are that calls go over
 * the network and that a transaction needs its own connection.
 *
 * ROWS
 *
 * A libSQL `Row` is addressable both by column name and by numeric index, and
 * carries a `length`. Spreading one would produce an object with `0`, `1`,
 * `length` and the real columns all mixed together, which then reaches code
 * expecting a clean record. So rows are rebuilt from `columns` explicitly.
 *
 * TRANSACTIONS
 *
 * `client.transaction()` returns a handle on its own connection. Statements
 * issued against the outer client during that window are NOT in the
 * transaction — they run beside it. That is why `tx` hands the callback a
 * scoped `Db` rather than letting it reuse the outer one, and why the
 * transaction is always closed in a `finally`: an unclosed one holds a
 * connection until it times out.
 */
import { createClient, type Client, type ResultSet, type Transaction } from '@libsql/client';
import type { Db, SqlValue } from './driver';

/** Rebuilds a plain record from the column names, dropping the index aliases. */
function toRows<T>(rs: ResultSet): T[] {
  return rs.rows.map((row) => {
    const out: Record<string, unknown> = {};
    rs.columns.forEach((name, i) => {
      out[name] = row[i];
    });
    return out as T;
  });
}

type Executor = Pick<Client, 'execute'> | Pick<Transaction, 'execute'>;

function wrap(exec: Executor, client: Client, tx: Transaction | null): Db {
  const db: Db = {
    async all<T>(sql: string, ...args: SqlValue[]): Promise<T[]> {
      return toRows<T>(await exec.execute({ sql, args }));
    },

    async get<T>(sql: string, ...args: SqlValue[]): Promise<T | undefined> {
      return toRows<T>(await exec.execute({ sql, args }))[0];
    },

    async run(sql: string, ...args: SqlValue[]): Promise<void> {
      await exec.execute({ sql, args });
    },

    async exec(sql: string): Promise<void> {
      // executeMultiple is the only path that takes several statements, and it
      // takes no parameters at all — which is exactly the constraint we want on
      // the one entry point that cannot be parameterised.
      if (tx) throw new Error('exec() runs several statements and cannot be used inside a transaction.');
      await client.executeMultiple(sql);
    },

    async tx<T>(fn: (scoped: Db) => Promise<T>): Promise<T> {
      // Already inside one: join it. Nesting is not supported and every place
      // that would nest here has an outer transaction already doing the work.
      if (tx) return fn(db);

      const t = await client.transaction('write');
      try {
        const result = await fn(wrap(t, client, t));
        await t.commit();
        return result;
      } catch (err) {
        await t.rollback().catch(() => {
          // The transaction may already be dead — that is the usual reason we
          // are in this branch. The original error is the one worth throwing.
        });
        throw err;
      } finally {
        t.close();
      }
    },

    async close(): Promise<void> {
      client.close();
    },
  };

  return db;
}

export function openLibsql(env: Record<string, string | undefined> = process.env): Db {
  const url = env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not set. See docs/hosting.md for how to provision one.');
  }

  const client = createClient({ url, authToken: env.TURSO_AUTH_TOKEN });
  return wrap(client, client, null);
}
