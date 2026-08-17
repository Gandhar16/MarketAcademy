# Signing in, and the email that supports it

Three ways into an account, and one mechanism behind the two emails this site
sends. Nothing here is on until you configure it — the site runs, and every
lesson and game works, with none of these variables set.

---

## What you have to do, in order

Both of these are yours to do; neither can be done from the codebase.

### 1. A domain you can send from

Email providers will not let you send as `you@gmail.com`, and if one did, every
receiving server would bin it on the DMARC check. You need a domain — the one
the site is on is fine — and you verify it with the provider by adding the DNS
records they give you.

Then the sending address is something at that domain: `hello@yourdomain.com`,
`no-reply@yourdomain.com`. That is the address to give me when you have it.

### 2. Resend

The Vercel Marketplace lists exactly one messaging provider, which is Resend,
and it is the right one for this anyway — transactional email, a plain HTTP API,
a free tier that covers a site at this stage.

```bash
vercel integration add resend
```

That provisions `RESEND_API_KEY` into the project automatically. If you would
rather not use the Marketplace, sign up at resend.com and set the key by hand.

Then set the from address, which the integration cannot guess:

```bash
vercel env add EMAIL_FROM        # e.g. "Market Academy <hello@yourdomain.com>"
```

---

## Environment variables

| Variable | Needed for | Notes |
|---|---|---|
| `SITE_URL` | OAuth, email links | `https://market-academy-three.vercel.app`. **Required in production.** Every redirect URI and every link in an email is built from it — deliberately, rather than from the request's `Host` header, which an attacker can set. |
| `RESEND_API_KEY` | Email | From the Marketplace integration, or the Resend dashboard. |
| `EMAIL_FROM` | Email | `Name <address@your-verified-domain>`. Both this and the key must be set before anything is sent. |
| `EMAIL_REPLY_TO` | Optional | Only set it if somebody reads that mailbox. |
| `OAUTH_GOOGLE_CLIENT_ID` / `_SECRET` | Google sign-in | |
| `OAUTH_GITHUB_CLIENT_ID` / `_SECRET` | GitHub sign-in | |
| `OAUTH_MICROSOFT_CLIENT_ID` / `_SECRET` | Microsoft sign-in | |
| `OAUTH_FACEBOOK_CLIENT_ID` / `_SECRET` | Facebook sign-in | |

**A provider appears on the sign-in page only when both of its variables are
set.** That is the whole enablement mechanism: ship Google today, add GitHub in
a month, no code change either time. A button that leads to a provider error
page is worse than no button.

### The redirect URI to register

Each provider's console asks for one. It is always:

```
{SITE_URL}/api/auth/oauth/{provider}/callback
```

so for Google in production:

```
https://market-academy-three.vercel.app/api/auth/oauth/google/callback
```

Register the localhost one too, or you cannot test locally:

```
http://localhost:3000/api/auth/oauth/google/callback
```

Where to get the credentials:

- **Google** — console.cloud.google.com → APIs & Services → Credentials → OAuth
  client ID → Web application. You will also have to fill in the OAuth consent
  screen; while it is in "testing" only accounts you list can sign in.
- **GitHub** — Settings → Developer settings → OAuth Apps.
- **Microsoft** — Entra ID → App registrations.
- **Facebook** — developers.facebook.com → Facebook Login. Note this one needs
  app review before anyone outside your own test users can sign in.

---

## The decision worth knowing about

When someone signs in with a provider we have never seen before, and their email
matches an account that already exists, we link the two **only if the provider
states it has verified that address**.

Google says so (`email_verified`). GitHub says so per-address. **Microsoft and
Facebook do not say so at all** — so those sign-ins never join an existing
account automatically. They make their own, and the learner can link it
deliberately from the account page.

This is not caution for its own sake. Several providers let someone put an
address on their profile without confirming it. If we matched on that, anyone
could type your address into a Facebook profile, sign in here, and walk into
your account — progress, Pro plan and all. An unverified address is therefore
treated as no address, never as a weaker yes.

The same rule has a second consequence worth knowing: an unverified OAuth
account does **not** claim the email in the unique `email_key` column. It gets a
namespaced key instead, so the real owner of that address can still register or
sign in normally later.

---

## The two emails

Only two, both asked for, neither marketing:

- **Confirm your address** — sent from the account page. Confirming is what
  makes a password reset possible, and that is the only thing it unlocks.
- **Reset your password** — from `/forgot-password`.

Both links are hashed at rest, work once, expire in an hour, and are retired the
moment a newer one is issued. Three per account per fifteen minutes, because the
send button is otherwise a way to have this site post mail to a stranger's inbox
on demand.

`/api/auth/password/forgot` **always answers the same thing** whether or not the
account exists. This site knows what people have been practising, and a form
anyone can reach that distinguishes real addresses from imaginary ones is a way
to find out who has been learning to trade here.

Resetting a password signs out every device, including the one that did it. If
the reset happened because somebody else had got in, leaving their session alive
would defeat the point.

### Without configuration

- **Locally** — the message is printed to the terminal, link and all, and
  reported as sent. A fresh clone can exercise the whole flow with no account
  anywhere; clicking the link out of your terminal is faster than an inbox.
- **In production** — sending is refused and the caller is told, rather than
  quietly reporting success. A learner waiting for a reset that was never going
  to arrive is the worst of the available outcomes.

---

## What is deliberately not here

- **Apple sign-in.** Its client secret is a JWT you sign with a `.p8` key and
  rotate every six months, and it answers with `form_post` rather than a query
  string. That is a different shape from the other four and wants its own piece
  of work, not a special case bolted onto the generic flow. Worth adding if an
  iOS app ever ships, since Apple then requires it.
- **Email change.** The `email_tokens` table already carries the address a token
  was sent to, precisely so a change-of-address confirmation can go to the new
  one before it becomes the account's. The flow itself is not built.
- **A welcome email, a newsletter, an unsubscribe footer.** There is nothing to
  unsubscribe from. An unsubscribe link on a password reset is copied from
  marketing mail and only makes people wonder what else they were signed up for.
