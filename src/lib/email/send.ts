/**
 * Sending mail.
 *
 * Resend, over its HTTP API. One POST with a JSON body — an SDK for that would
 * be a dependency, a supply-chain surface and an upgrade treadmill in exchange
 * for `fetch` with a header on it.
 *
 * ── Three states, on purpose ────────────────────────────────────────────────
 *
 *  - **Configured** (`RESEND_API_KEY` and `EMAIL_FROM` both set) — mail is sent.
 *  - **Unconfigured, in development** — the message is written to the console,
 *    link and all, and reported as delivered. `pnpm dev` on a fresh clone must
 *    not require an account and a verified domain before anyone can look at the
 *    sign-up flow, and a confirmation link you can click out of the terminal is
 *    a better local experience than a real inbox anyway.
 *  - **Unconfigured, in production** — refused, loudly, and the caller decides
 *    what to tell the person. Silently pretending to send a password reset is
 *    the worst of the three outcomes: the learner waits for a mail that was
 *    never going to arrive.
 *
 * Nothing above this file knows which state it is in. Callers get `sent` or a
 * reason, and behave the same either way.
 */

/** See db/driver.ts: `NodeJS.ProcessEnv` has required keys a test cannot supply. */
type Env = Record<string, string | undefined>;

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type SendResult = { ok: true; id: string | null } | { ok: false; message: string };

const ENDPOINT = 'https://api.resend.com/emails';

export function emailConfigured(env: Env = process.env): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

/**
 * The address mail comes from — the one thing here that cannot be invented.
 *
 * It has to be at a domain verified with the provider; sending as a Gmail or
 * Outlook address will be rejected outright by the provider and, if it somehow
 * were not, by every receiving server's DMARC check.
 */
export function emailFrom(env: Env = process.env): string {
  return env.EMAIL_FROM ?? 'Market Academy <onboarding@resend.dev>';
}

/**
 * Where a reply goes, if it is worth offering one at all. Left unset by default:
 * an unattended reply-to on a "do not reply" mail is worse than none.
 */
export function emailReplyTo(env: Env = process.env): string | undefined {
  return env.EMAIL_REPLY_TO || undefined;
}

export async function sendMail(mail: Mail, env: Env = process.env): Promise<SendResult> {
  if (!emailConfigured(env)) {
    if (env.NODE_ENV === 'production') {
      return {
        ok: false,
        message: 'Email is not configured on this deployment, so that could not be sent.',
      };
    }
    // Development: the terminal IS the inbox.
    console.info(
      [
        '',
        '─── email (not sent: RESEND_API_KEY / EMAIL_FROM unset) ───',
        `To:      ${mail.to}`,
        `Subject: ${mail.subject}`,
        '',
        mail.text,
        '───────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );
    return { ok: true, id: null };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom(env),
        to: [mail.to],
        subject: mail.subject,
        // Both parts, always. A text/plain alternative is what keeps a message
        // out of the spam folder and readable in a client that blocks HTML.
        text: mail.text,
        html: mail.html,
        ...(emailReplyTo(env) ? { reply_to: emailReplyTo(env) } : {}),
      }),
    });

    if (!res.ok) {
      // The provider's own message is for whoever holds the API key, not for
      // the learner — it can name the account and the domain.
      console.error(`Resend rejected a message: ${res.status} ${await res.text().catch(() => '')}`);
      return { ok: false, message: 'That message could not be sent just now. Please try again shortly.' };
    }

    const body: unknown = await res.json().catch(() => null);
    const id =
      typeof body === 'object' && body !== null && typeof (body as { id?: unknown }).id === 'string'
        ? (body as { id: string }).id
        : null;
    return { ok: true, id };
  } catch (error) {
    console.error('Could not reach the email provider', error);
    return { ok: false, message: 'That message could not be sent just now. Please try again shortly.' };
  }
}
