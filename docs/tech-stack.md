# Tech Stack — What's used, where, and why

Reference doc. For deep narrative on any one subsystem, the linked docs below go further than this file does — this is the map, not the territory.

## Framework & runtime

**Next.js 16.3.0 (App Router)** — `src/app/**`. Every route is a folder: `page.tsx` (view), `route.ts` (API), `layout.tsx`, `error.tsx`, `not-found.tsx`. Dynamic routes: `learn/[lesson]`, `learn/course/[stageId]`, `play/[game]`. All ~36 routes are server-rendered on demand — nothing is statically exported. Three deliberate reasons (full rationale: `docs/hosting.md`):
1. Lesson checkpoint answers are stripped server-side and only released via `/api/lesson/reveal` after the learner commits — a static export would ship the answers in the HTML.
2. The replay engine streams one candle at a time from the server so "no lookahead" is structurally true, not just a promise the client-side code keeps.
3. Sessions are httpOnly cookies validated against a DB on every request.

`next.config.ts` carries the security headers (see Deployment, below).

**React 19.2.8 / react-dom 19.2.8** — standard server/client split. Server components fetch data directly (DB, market service, session) and resolve things like Pro-gating *before* handing off to a client component, because env vars and session cookies aren't readable in the browser. Client components are marked `'use client'` (all games, the progress store, interactive lesson blocks).

**TypeScript 5** — strict mode. `@/*` → `./src/*` (see `tsconfig.json`).

## Data & persistence

**`@libsql/client` 0.17.4 + dual DB driver** (`src/lib/db/`)
- `driver.ts` — the `Db` interface (`all`, `get`, `run`, `exec`, `tx`, `close`) and `chooseBackend()`.
- `driver-node.ts` — `node:sqlite` (dev/CI/tests — ships in Node 22+, zero setup).
- `driver-libsql.ts` — Turso/libSQL (production).
- `index.ts` — `getDb()` caches the connection *promise* (not the handle) so concurrent cold-start requests share one init; WAL mode; `openTestDb()` for in-memory test DBs.

**Why two drivers**: Vercel has no persistent disk, so production needs a remote DB — Turso is the free, SQLite-wire-compatible option. But requiring cloud credentials just to `git clone && pnpm dev` is friction nobody should pay. Both drivers speak identical SQL against `schema.ts` — no ORM, no dialect layer. `tx(fn)` hands the callback its own scoped `Db` deliberately: in production a transaction runs on a dedicated connection, so writes against the outer handle inside a transaction would silently land outside it. Migrations (`migrate.ts`) are additive-only (`ADD COLUMN`), idempotent, run on every boot. Full rationale + deploy steps: `docs/hosting.md`.

**Auth** (`src/lib/auth/`)
- `session.ts` — cookie plumbing via `next/headers`; `currentUser()`, `startSession()`, `endSession()`, `requireUser()` (returns `User | Response` — callers check `instanceof Response`). Cookie: `ma_session`, httpOnly, `sameSite=lax`, `secure` in prod, 30-day sliding TTL (rewritten at most once/day, not every request).
- `password.ts` — scrypt (`node:crypto`) at OWASP-2024 params (N=2¹⁷, r=8, p=1, ~128MB/hash). Chosen over bcrypt specifically because bcrypt silently truncates passwords at 72 bytes. Self-describing storage format: `scrypt$N$r$p$salt$hash`.
- `policy.ts` — sign-in/password policy (min length 10, deliberately no strength meter).
- Full writeup: `docs/accounts-and-ranking.md`.

## Market data

**`yahoo-finance2` 4.0.1** (`src/lib/market/yahoo.ts`) — the only free source that covers both NSE (`RELIANCE.NS`, `^NSEI`) and US tickers behind one interface. Called only from server API routes (`/api/quote`, `/api/history`, `/api/search`), never the browser. One process-wide client (Yahoo needs a cookie/crumb handshake that's cheaper to cache than redo). Known limits handled explicitly in code: NSE quotes can lag, intraday history caps around 60 days, index volume is often `null` and is passed through as `null` rather than coerced to `0`.

**`src/lib/market/cache.ts`** — in-memory `TTLCache<T>` with request coalescing (concurrent callers for the same key share one in-flight fetch) plus a `RateLimiter`.

**`src/lib/market/service.ts`** — orchestrates provider + cache + rate limit, TTLs tuned to what the data actually is: quotes 15s, intraday history 60s, closed daily/weekly/monthly history 1hr (it's immutable once the candle closes), search 10min. `apiLimiter` = 120 req/min/IP. Deliberately in-memory, no Redis — "the data is public and cheap to refetch."

## Trading engine

`src/lib/engine/`
- `order.ts` — order vocabulary: `MARKET`/`LIMIT`/`SL`/`SL-M`, `InstrumentSpec` (lot size, freeze quantity, price bands). The SL vs SL-M distinction (stop-limit can fail to fill in a gap; stop-market is guaranteed but at whatever price) is modeled precisely because Order Gauntlet trains exactly that judgement call.
- `replay.ts` — `ReplaySession`. The no-lookahead invariant is structural: the private candle array is never exposed, `visible()` returns a copy sliced to the cursor, and there is no `seek`/`peek`/`rewind` — only one-directional `step()`. Documented scope limit: this guarantees no *app code* can look ahead, but a client-side array could still theoretically be inspected in a browser network tab — the real fix is server-side bar streaming (`src/lib/replay/server-session.ts`), which is why Chart Replay's actual scoring is server-authoritative, not just this class.
- `costs/` — `types.ts`, `india.ts` (NSE/BSE/MCX statutory rates: STT, stamp duty, GST, exchange/SEBI turnover fees, DP charges — each annotated with a citation URL and a "verified" date so a Budget rate change is traceable), `us.ts` (US equivalent). Every number here is exercised by `costs.test.ts` and cross-checked again by `src/content/claims.test.ts` wherever a lesson states the number in prose.
- `halts.ts`, `options.ts` — circuit/halt logic and options pricing (Black-Scholes, backing Earnings Roulette and the options lessons).
- `fill.ts` / `portfolio.ts` (referenced from `replay.ts`) — fill matching against a bar's OHLC and account P&L application.

**Server-authoritative replay** (`src/lib/replay/server-session.ts`, `src/lib/replay/client.ts`) — the production Chart Replay path. Bars are revealed one at a time from an in-memory server session; the server checks stop/target hits against the bar's actual high/low (gap-aware) and auto-closes positions itself, so client-submitted trade data can be verified or overridden rather than trusted. This is what actually enforces "no fabricated trades" and "no lookahead" in the deployed game, with `ReplaySession` above as the underlying primitive it's built on.

## Content & lesson engine

`src/lib/lesson/`
- `dsl.ts` — the zod schema for every lesson (`lessonSchema`, `blockSchema`). Nine block kinds: `prose`, `callout`, `widget`, `predict`, `chart`, `game`, `checkpoint`, `example`, `figure`. This is the enforcement mechanism that turns "a lesson must be interactive" from a style guideline into a schema failure at parse time.
- `validator.ts` — cross-cutting rules beyond the schema: R1 (must contain interactive blocks), R2 (prose length cap), R4 (opens with something the learner *does*), R13 (every lesson needs a `plainSummary`), C5 (no jargon ahead of its tier), C6/C7 (syllabus/registry consistency, no forward dependency in the sequence).
- `sanitize.ts` — `stripAnswers()`, removes correct answers/reveal text server-side before a lesson payload reaches client code.
- `grading.ts` — checkpoint task grading (decision/compute/construct/classify), backs `/api/lesson/grade`.
- `annotate.ts` — auto-links glossary terms into lesson prose on first occurrence.
- `jargon.ts` — scans lessons for unexplained jargon (backs validator rule C5).
- `readability.ts` — Flesch-style grade level + per-sentence length checks.
- Full narrative: `docs/plain-language.md`.

**`zod` 4.4.3** is the library doing the schema/validation heavy lifting above, plus general API input validation elsewhere.

## Games

- `src/lib/games/catalogue.ts` — single source of truth for the 10 games (`GameEntry`: slug, name, skill, blurb, intro, optional `modelled`). Read by both `/play` (index) and `/play/[game]` (detail), so a game can't exist on one without the other.
- `src/components/games/registry.tsx` — `GAMES: Record<string, ComponentType>` mapping slug → component, plus `GameHost` (server-safe wrapper — a server component can render it but not call a client function directly) and `renderGame()` (function form, used to embed a game inline inside a lesson's `game` block). An unregistered slug renders a visible dev-facing error naming the exact file to fix, not a silent blank.
- `src/lib/games/{ruin,compounding,scenarios}.ts` — supporting simulation math (risk-of-ruin, compounding, scripted scenarios).
- `src/lib/analysis/{patterns,orderbook,indicators}.ts` — pattern base-rate stats, order-book mechanics, technical indicators, backing several games and lesson widgets.

## Payments

`src/lib/payments/` + `src/app/api/payments/`
- `razorpay.ts` — client + two distinct HMAC-SHA256 signature checks (checkout: `order_id|payment_id`; webhook: raw body against `RAZORPAY_WEBHOOK_SECRET` — easy to swap by mistake, kept in separate functions on purpose).
- `plans.ts` — plan/price definitions, must mirror the Razorpay dashboard exactly.
- `gate.ts` / `access.ts` — `currentUserHasProAccess()`, `paywallEnabled()` (the `PAYWALL_ENABLED` kill switch, default OFF), `isTierGated()`, `isGameGated()` — the one place "what Pro actually gates" is defined.
- `loadCheckout.ts` — client-side Razorpay Checkout script loader.
- Routes: `checkout` (creates Order/Subscription), `verify` (checkout-signature check, optimistic grant), `webhook` (authoritative signature check — the real source of truth for state transitions), `cancel`.

**Why Razorpay over Stripe**: INR pricing needs UPI/netbanking, which Stripe India doesn't offer self-serve (invite-only, cards-only). Razorpay does self-serve KYC for a sole proprietor. Full runbook incl. required dashboard Plan IDs and webhook events: `docs/payments.md`.

## UI & styling

**Tailwind CSS v4** (`@tailwindcss/postcss`) — `src/app/globals.css` uses the CSS-first `@theme` config (no `tailwind.config.js`). Design tokens: near-black ground, one amber accent, and colour-blind-safe teal/amber for up/down instead of red/green (~8% of men can't reliably distinguish red/green — a real accessibility reason, not a style whim). Tailwind v4 emits some utilities as inline `style` attributes, which is why the CSP allows `'unsafe-inline'` on `style-src`.

**`framer-motion` 13.0.0** — reusable primitives in `src/components/motion/{Reveal,Stagger}.tsx`, used directly in nav, theme toggle, course/game grids, the lesson player, and the leaderboard sidebar. Used sparingly by design intent ("designed to make you think," not a flashy dashboard).

**`lightweight-charts` 5.2.0** — `src/components/chart/CandleChart.tsx`, renders candle/OHLC series for lesson chart blocks and the replay/simulator UI.

**`zustand` 5.0.14** — `src/lib/progress/store.ts` only. Client-side learner progress (lesson completion, attempts, best scores, predict-block commitments, mastery/streak state) persisted to `localStorage` via the `persist` middleware, so the site works with zero account. Has a `version` field + migration hook so this can later become a cache layer in front of the server DB. Syncs to the server via `src/lib/progress/sync.ts` / `POST /api/progress/sync` using a best-of-both-devices merge, not last-write-wins (`docs/accounts-and-ranking.md` §5).

**`clsx` / `tailwind-merge`** — declared in `package.json` but currently unused anywhere in `src/` (no `cn()` helper exists). Flagging so nobody goes looking for a className-merge utility that isn't there; safe to remove or safe to start using, whichever comes first.

## Testing & tooling

- **`vitest` 4.1.10`** (`vitest.config.mts`) — tests colocated next to source (`*.test.ts`), `@` alias to `src/`. `pnpm test` runs everything except `src/lib/market/live.integration.test.ts`, which only runs under `pnpm test:live` with `MARKET_LIVE=1` set, since it hits the real Yahoo API.
- **`pnpm verify`** = `typecheck && lint && test` — the standard pre-commit gate.
- **`eslint` 9** flat config (`eslint.config.mjs`), extends `eslint-config-next` (core-web-vitals + typescript).
- **`typescript` 5** strict mode.

## Deployment

**Vercel + Turso**, both free tier — chosen because the app is 100% dynamically server-rendered (see the Next.js section above for why static export was rejected).

**`next.config.ts`** sets security headers on every route: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` (camera/mic/geo/usb off; `payment=(self)` pre-provisioned for a future Payment Request API integration), HSTS (2yr, includeSubDomains, preload), `X-DNS-Prefetch-Control: off`.

**CSP specifics** (heavily commented in-file after a real incident): `script-src 'self' 'unsafe-inline'` plus the Razorpay origins (`checkout.razorpay.com`, `api.razorpay.com`, `lumberjack.razorpay.com`) on script-src/img-src/connect-src/frame-src. `'unsafe-inline'` is there because hash-pinning was tried first and broke hydration in production: Next's App Router injects its own per-page inline `<script>` tags for RSC flight data (`self.__next_f.push(...)`) that a hash-based CSP can't enumerate. `'unsafe-inline'` on `script-src` is Next's own documented default for apps not using nonce-based CSP. The Razorpay CSP additions are flagged as not yet verified against a live browser console (no real Razorpay keys exist in this dev environment).

Full deploy runbook (Turso setup, env vars, `vercel --prod`): `docs/hosting.md`.

## Where to go deeper

| Topic | Doc |
|---|---|
| DB/driver design, deploy runbook | `docs/hosting.md` |
| Auth, sessions, progress sync, leaderboard scoring | `docs/accounts-and-ranking.md` |
| Glossary/jargon/readability system | `docs/plain-language.md` |
| XP system, encouragement messages, reasoning feed | `docs/xp-and-reasoning.md` |
| Razorpay setup, plans, webhook events, kill switch | `docs/payments.md` |
| Full curriculum design log, validator rule catalogue, product rationale | `PLAN.md` |
</content>
