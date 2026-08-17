'use client';

/**
 * Every way into this account, in one place.
 *
 * Two things live here because they answer the same question — "if I lose the
 * thing I normally sign in with, can I still get back in?" A confirmed address
 * is the password-reset route; a linked provider is another door. The panel
 * says plainly when there is only one of them, because that is the state where
 * losing it costs someone everything they have done.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SignInMethods {
  email: string;
  emailVerified: boolean;
  /** Providers already linked, as ids. */
  linked: string[];
  /** Everything configured on this deployment: id and the name to show. */
  available: { id: string; label: string }[];
  /** Whether a password can actually be used to sign in to this account. */
  hasPassword: boolean;
}

export function SignInMethodsPanel({ methods }: { methods: SignInMethods }) {
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unlinked = methods.available.filter((p) => !methods.linked.includes(p.id));
  // The count that matters: how many independent ways back in exist.
  const routesIn = methods.linked.length + (methods.hasPassword && methods.emailVerified ? 1 : 0);

  async function post(url: string) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.message ?? 'That did not work. Try again.');
      else {
        setNote(data.message ?? 'Done.');
        router.refresh();
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }
    setBusy(false);
  }

  return (
    <section className="rounded-lg border border-line bg-surface-2 p-5">
      <h2 className="text-lg font-medium tracking-tight">How you sign in</h2>

      {routesIn <= 1 && (
        <p className="mt-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink-muted">
          There is currently one way into this account. If you lose it, your progress goes with it — confirming your
          address or linking a second method takes a moment and fixes that.
        </p>
      )}

      {note && <p className="mt-3 text-sm text-ink">{note}</p>}
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink">{methods.email || 'No email address on this account'}</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {methods.emailVerified
                ? 'Confirmed — you can reset your password with it.'
                : 'Not confirmed yet, so a password reset cannot be sent here.'}
            </p>
          </div>
          {!methods.emailVerified && methods.email && (
            <button
              onClick={() => post('/api/auth/email/verify')}
              disabled={busy}
              className="min-h-9 rounded-md border border-line px-3 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
            >
              Send a confirmation link
            </button>
          )}
        </div>

        {methods.available.length > 0 && (
          <div className="border-t border-line pt-4">
            <p className="text-xs uppercase tracking-wider text-ink-faint">Linked accounts</p>

            <ul className="mt-2 space-y-2">
              {methods.linked.map((id) => {
                const label = methods.available.find((p) => p.id === id)?.label ?? id;
                return (
                  <li key={id} className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-ink">{label}</span>
                    <button
                      onClick={() => post(`/api/auth/oauth/${id}/unlink`)}
                      disabled={busy}
                      className="min-h-9 rounded-md border border-line px-3 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
                    >
                      Unlink
                    </button>
                  </li>
                );
              })}
              {methods.linked.length === 0 && <li className="text-sm text-ink-faint">None yet.</li>}
            </ul>

            {unlinked.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {unlinked.map((p) => (
                  // A link, not a fetch: linking is the same redirect flow as
                  // signing in, with `mode=link` so the callback attaches it to
                  // this account instead of finding or creating one.
                  <a
                    key={p.id}
                    href={`/api/auth/oauth/${p.id}/start?mode=link&next=/account`}
                    className="min-h-9 rounded-md border border-line px-3 py-2 text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    Link {p.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
