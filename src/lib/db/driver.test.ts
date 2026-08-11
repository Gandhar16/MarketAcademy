import { describe, expect, it } from 'vitest';
import { chooseBackend } from './driver';
import { openTestDb } from './index';
import { openNodeSqlite, databasePath } from './driver-node';

describe('choosing a backend', () => {
  it('uses libSQL whenever a Turso URL is configured', () => {
    // The important direction. A deployed environment must never quietly fall
    // back to a local file it does not have — it would work, and then vanish on
    // the next deploy.
    expect(chooseBackend({ TURSO_DATABASE_URL: 'libsql://x.turso.io' })).toBe('libsql');
  });

  it('uses node:sqlite when nothing is configured', () => {
    expect(chooseBackend({})).toBe('node-sqlite');
  });
});

describe('where the local file lives', () => {
  it('honours an override, including :memory:', () => {
    expect(databasePath({ MARKET_DB_PATH: ':memory:' })).toBe(':memory:');
    expect(databasePath({ MARKET_DB_PATH: '/tmp/x.db' })).toBe('/tmp/x.db');
  });

  it('defaults to a path under the project', () => {
    expect(databasePath({})).toMatch(/market-academy\.db$/);
  });
});

describe('the Db contract', () => {
  it('returns plain records keyed by column name', async () => {
    const db = await openTestDb();
    await db.run('INSERT INTO login_attempts (key, at) VALUES (?, ?)', 'k', 5);

    const rows = await db.all<{ key: string; at: number }>('SELECT key, at FROM login_attempts');
    expect(rows).toEqual([{ key: 'k', at: 5 }]);
    // No numeric aliases and no `length` — the libSQL row shape must not leak
    // through, or code that spreads a row gets three extra fields.
    expect(Object.keys(rows[0])).toEqual(['key', 'at']);
  });

  it('returns undefined rather than throwing on an empty get', async () => {
    const db = await openTestDb();
    expect(await db.get('SELECT * FROM users WHERE id = ?', 'nobody')).toBeUndefined();
  });

  it('commits a transaction that returns', async () => {
    const db = await openTestDb();
    const out = await db.tx(async (t) => {
      await t.run('INSERT INTO login_attempts (key, at) VALUES (?, ?)', 'a', 1);
      return 'done';
    });
    expect(out).toBe('done');
    expect(await db.all('SELECT * FROM login_attempts')).toHaveLength(1);
  });

  it('rolls back a transaction that throws, and rethrows the original error', async () => {
    const db = await openTestDb();
    await db.run('INSERT INTO login_attempts (key, at) VALUES (?, ?)', 'before', 1);

    await expect(
      db.tx(async (t) => {
        await t.run('INSERT INTO login_attempts (key, at) VALUES (?, ?)', 'during', 2);
        throw new Error('deliberate');
      }),
    ).rejects.toThrow('deliberate');

    const rows = await db.all<{ key: string }>('SELECT key FROM login_attempts');
    expect(rows.map((r) => r.key)).toEqual(['before']);
  });

  it('joins an outer transaction rather than nesting a second one', async () => {
    // SQLite has no nested transactions. Every place that would nest here has
    // an outer one already doing the job, so joining is correct — and a second
    // BEGIN would throw.
    const db = await openTestDb();
    await db.tx(async (t) => {
      await t.tx(async (inner) => {
        await inner.run('INSERT INTO login_attempts (key, at) VALUES (?, ?)', 'nested', 1);
      });
    });
    expect(await db.all('SELECT * FROM login_attempts')).toHaveLength(1);
  });

  it('enforces foreign keys, so a cascade actually cascades', async () => {
    const db = await openTestDb();
    await expect(
      db.run('INSERT INTO lesson_progress (user_id, lesson_id, updated_at) VALUES (?, ?, ?)', 'ghost', 'l', 1),
    ).rejects.toThrow();
  });

  it('opens an independent database per call, so tests cannot see each other', async () => {
    const a = openNodeSqlite(':memory:');
    const b = openNodeSqlite(':memory:');
    await a.exec('CREATE TABLE t (x INTEGER)');
    await expect(b.all('SELECT * FROM t')).rejects.toThrow();
    await a.close();
    await b.close();
  });
});
