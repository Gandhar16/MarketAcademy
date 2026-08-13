# Payments

Razorpay, INR only. US-market monetization was explicitly deferred to a later
Stripe integration when this was scoped — nothing here assumes a second
currency exists.

## The kill switch

Enforcement ships OFF by default. `PAYWALL_ENABLED` is unset (or anything
other than the literal string `true`) means **nothing is actually locked** —
every gate check in `src/lib/payments/access.ts`'s `paywallEnabled()`
consumers (the lesson page, `/api/lesson/reveal`, `/api/lesson/grade`, the
game page, an embedded game inside a lesson, and `/api/replay`'s
session-start) stays open, while the DB, the checkout flow, the webhook, and
the "Pro" badges on course/game cards are all fully live. This mirrors how
the game-unlock badge shipped cosmetic-only during testing before becoming a
real gate (see the original comment in `GameGrid.tsx`).

This means you can deploy the whole feature, set up Razorpay, and even walk
a real checkout through to completion — the plan gets recorded correctly in
the database — all while every learner still has full access to everything.
Set `PAYWALL_ENABLED=true` in Vercel (Production and Preview) once you're
ready to actually start gating content.

Note `hasProAccess()` itself is deliberately **not** affected by the switch
— the account and pricing pages call it directly to show a learner their
real "Free" vs "Pro" status, and that has to stay honest regardless of
whether enforcement is switched on. The switch only affects what happens at
each enforcement call site.

## Why Razorpay and not Stripe

Stripe India has been invite-only since May 2024 and, even with an invite,
only accepts cards for INR — no UPI, no netbanking, which is how most Indian
users actually pay. Razorpay is self-serve, accepts sole-proprietor KYC (PAN
+ Aadhaar + a bank account, no registered company required), and costs
roughly the same (~2–3% + GST) once Stripe's separate 0.7% Billing fee on
recurring charges is accounted for. See the pricing-tier discussion this was
built from for the full comparison.

## What this environment could not verify

No real Razorpay account or API keys exist in the environment this was built
in, so the following are built correctly against Razorpay's documented API
and SDK, but **not exercised against a live checkout**:

- The Razorpay Checkout widget actually opening and completing a payment.
- The exact CSP allowances (`checkout.razorpay.com`, `api.razorpay.com`,
  `lumberjack.razorpay.com` in `next.config.ts`) being sufficient — these are
  Razorpay's standard integration domains, not confirmed against a real
  browser console. **Check the console for CSP violation errors the first
  time you actually open the checkout widget**, the same way the CSP's
  earlier mistake (blocking Next's own hydration scripts) should have been
  caught before shipping, not after.
- A real webhook delivery from Razorpay's infrastructure.

Everything gated on those (signature math, DB state transitions, access
checks) has test coverage using synthetic signatures and an in-memory
database — see `src/lib/payments/*.test.ts` and `src/lib/db/payments.test.ts`.

## What you need to do before this works

### 1. Create a Razorpay account

Sole-proprietor KYC is enough to start — PAN, Aadhaar, a bank account. See
[razorpay.com/blog/payment-gateway-kyc-onboarding-india](https://razorpay.com/blog/payment-gateway-kyc-onboarding-india/).

### 2. Create three Subscription Plans in the Razorpay dashboard

Dashboard → Subscriptions → Plans → Create Plan. These MUST match
`src/lib/payments/plans.ts` exactly — the amount charged is whatever the
Plan says, not whatever this code says, so a mismatch here silently charges
the wrong amount:

| Plan | Amount | Billing cycle |
|---|---|---|
| Monthly | ₹199 | Every 1 month |
| Quarterly | ₹499 | Every 3 months |
| Annual | ₹1,499 | Every 1 year |

Lifetime has no Plan — it's a one-time Razorpay Order, created directly by
`/api/payments/checkout` from the ₹4,999 in `plans.ts`.

Each created Plan gives you a `plan_xxxxxxxxxxxxx` id. Set those as env vars
(names below).

### 3. Set environment variables

In Vercel (Settings → Environment Variables, for Production **and**
Preview) and in `.env.local` for local testing:

```
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx        # or rzp_test_… while testing
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx     # never sent to the browser
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx # set when you create the webhook below — a different secret from the key secret
RAZORPAY_PLAN_MONTHLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_QUARTERLY=plan_xxxxxxxxxxxxx
RAZORPAY_PLAN_ANNUAL=plan_xxxxxxxxxxxxx
```

Razorpay gives you separate test-mode (`rzp_test_…`) and live-mode
(`rzp_live_…`) key pairs — use test mode until a real checkout has been
walked through end to end at least once.

### 4. Create the webhook

Dashboard → Webhooks → Add New Webhook.

- **URL**: `https://<your-domain>/api/payments/webhook`
- **Secret**: generate one, put it in `RAZORPAY_WEBHOOK_SECRET` above — this
  is NOT the same as `RAZORPAY_KEY_SECRET`.
- **Active events**, exactly these six (the handler ignores anything else,
  so subscribing to more is harmless but subscribing to fewer breaks
  renewal/cancellation tracking):
  - `payment.captured`
  - `subscription.activated`
  - `subscription.charged`
  - `subscription.cancelled`
  - `subscription.completed`
  - `subscription.halted`

### 5. Check it

```bash
curl -X POST https://<your-domain>/api/payments/checkout \
  -H "Content-Type: application/json" -H "Cookie: ma_session=<a real signed-in session>" \
  -d '{"planId":"lifetime"}'
# {"keyId":"rzp_...","kind":"one_time","orderId":"order_...","amount":499900,"currency":"INR"}
```

A `503 not_configured` response means an env var above is missing; the error
message names which one in the server logs.

## What "Pro" actually gates

Defined once, in `src/lib/payments/access.ts`:

- **Courses**: T0 (Foundations) and T1 (Beginner) — the first four courses —
  stay free forever. T2 through T5 require Pro. Enforced server-side in
  `app/learn/[lesson]/page.tsx` (the lesson's content is never sent to a
  non-Pro browser at all) and independently in `/api/lesson/reveal` and
  `/api/lesson/grade`, so the gate can't be bypassed by calling those
  directly with a lesson id.
- **Games**: `chart-replay`, `payoff-builder`, `circuit-breaker`,
  `earnings-roulette` — the four with real engine complexity — require Pro.
  The other six stay free. Enforced at `/play/[game]/page.tsx`, independently
  again for a game embedded *inside* a lesson (a free-tier lesson can embed
  a Pro-tier game — see `t1-journal.ts` embedding `chart-replay` — so the
  lesson being free does not make the game free), and — the one API-level
  enforcement, since `chart-replay` is the only game with a server-held
  resource worth protecting — at `/api/replay`'s session-start action.

## How access is computed

`users.plan` (`'free' | 'pro'`) and `users.plan_expires_at` are what every
gate check reads — one row, no join. `plan_expires_at` is `NULL` for either
`'free'` (meaningless) or a **lifetime** grant (`'pro'`, never expires) —
those two are told apart by `plan` alone, never by the timestamp being
absent.

Nothing actively flips `plan` back to `'free'` when a subscription lapses —
there is no cron in a serverless deployment to run that job reliably.
`hasProAccess()` re-checks the expiry on every call instead, so a stale
`plan='pro'` row past its `plan_expires_at` costs nothing.

The `subscriptions` table is the audit trail and what the account page reads
for "renews on" / "cancelled, active until" — it is never on the hot path of
a gate check. `payment_events` exists purely for webhook idempotency:
Razorpay retries a delivery on anything but a 200, so the same event arriving
twice is the ordinary case, not a failure mode.
