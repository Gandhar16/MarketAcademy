# Hosting

## Why GitHub Pages cannot serve this

GitHub Pages serves static files. It runs no code.

This application is 36 routes, and `next build` reports every one of them as
`ƒ (Dynamic) server-rendered on demand`. That is not an accident of
configuration — three things in it are server-side *on purpose*:

1. **Answers never reach the client.** `stripAnswers()` removes them before a
   lesson crosses into client code; reveals come from `/api/lesson/reveal` only
   after the learner commits. Statically exported, every answer key ships in the
   bundle.
2. **The replay engine has no future bars.** `src/lib/replay/server-session.ts`
   streams one bar at a time and there is deliberately no endpoint that accepts
   a bar index. Statically exported, the whole series is in the browser and the
   no-lookahead guarantee is a comment rather than a fact.
3. **Sessions are httpOnly cookies** validated against a database.

Points 1 and 2 are PLAN.md §7 rules 2 and 5. A static build does not degrade
them; it removes them.

So: **Vercel + Turso**. Both free, and nothing is lost.

## The two engines

Persistence goes through the `Db` interface in `src/lib/db/driver.ts`:

| Where | Driver | Why |
|---|---|---|
| Local dev, CI, every test | `node:sqlite` | No account, no network, no credentials. `git clone && pnpm dev` has to work. |
| Production | `@libsql/client` → Turso | No free host gives you a disk that survives a deploy. |

`chooseBackend()` picks libSQL whenever `TURSO_DATABASE_URL` is set, so a
deployed environment cannot silently fall back to a local file it does not have.

Turso speaks the SQLite dialect, so `schema.ts`, every query and every migration
are the *same text* against both. There is no query builder and no dialect
layer, because there is nothing to translate.

### The one thing that changed everywhere

The interface is **async**, even though `node:sqlite` is not. A remote database
cannot be made synchronous, and an interface shaped around the synchronous one
would only ever have worked locally. So every repository function awaits,
including in tests where the await resolves immediately.

`tx(fn)` hands the callback **its own `Db`**. That is not decoration: a remote
driver runs a transaction on a dedicated connection, so a statement issued
against the outer handle during a transaction would execute *outside* it —
silently, and only in production. Passing the scoped handle makes that mistake
impossible to write.

## Deploying

### 1. Create the database

```bash
# https://docs.turso.tech/quickstart
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create market-academy
turso db show market-academy --url        # → libsql://…
turso db tokens create market-academy     # → the auth token
```

The free tier is 500 databases, 9 GB total, 1 billion row reads a month. This
application will not come close.

### 2. Deploy

```bash
npx vercel            # link the project
npx vercel --prod
```

Set two environment variables in the Vercel project (Settings → Environment
Variables), for Production **and** Preview:

```
TURSO_DATABASE_URL=libsql://market-academy-<org>.turso.io
TURSO_AUTH_TOKEN=<token>
```

Nothing else is required. The schema is created and migrated on first
connection, by `getDb()`.

### 3. Check it

```bash
curl https://<your-app>.vercel.app/api/health
# {"ok":true,"backend":"libsql","schema":"ready"}
```

If that says `"backend":"node-sqlite"`, the environment variables did not reach
the runtime and the deployment is writing to a disk that will vanish. That is
precisely the failure this endpoint exists to catch, because everything else
looks fine.

## Local development

Nothing to configure. With no `TURSO_DATABASE_URL`, the app opens
`./data/market-academy.db` and creates the schema. Override the path with
`MARKET_DB_PATH`; `:memory:` is honoured, which is how tests use it.

To run against Turso locally — worth doing once before the first real deploy —
put the same two variables in `.env.local`.

## Cold starts and connection reuse

`getDb()` caches the **promise**, not the handle, so two requests arriving
during a cold start share one initialisation instead of racing to create the
schema twice. On a serverless platform that is the normal case, not an exotic
one. A failed initialisation is *not* cached, or one bad moment on the network
would break the process permanently.

## What would need to change for Postgres

Little, and it is worth saying because it is the honest measure of whether this
abstraction was worth building. `Db` would gain a Postgres driver;
`schema.ts` would need `SERIAL`/`TIMESTAMP` equivalents and the `ON CONFLICT`
syntax is already compatible; `PRAGMA table_info` in `migrate.ts` would become
`information_schema.columns`. Every call site would be untouched.
