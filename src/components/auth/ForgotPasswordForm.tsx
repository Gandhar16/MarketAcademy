'use client';

/**
 * Asking for a reset link.
 *
 * The confirmation this shows is deliberately the same whether or not there is
 * an account with that address — it repeats what the endpoint says, and the
 * endpoint says one thing on purpose. See the note in the route: a form anyone
 * can reach that distinguishes real addresses from imaginary ones is a way to
 * find out who has been learning to trade here.
 */
import { useState } from 'react';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/policy';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? 'Something went wrong. Try again.');
        setBusy(false);
        return;
      }
      setSent(data.message);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink">{sent}</p>
        <p className="text-xs leading-relaxed text-ink-faint">
          The link lasts an hour and works once. If you signed up with Google or another provider and never set a
          password, use that button on the sign-in page instead — there is no password to reset.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <span className="mt-1.5 block text-xs leading-relaxed text-ink-faint">
          The address you signed up with. You will be able to choose a new password of at least {MIN_PASSWORD_LENGTH}{' '}
          characters.
        </span>
      </label>

      <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
        {busy ? 'Working…' : 'Send me a reset link'}
      </button>
    </form>
  );
}
