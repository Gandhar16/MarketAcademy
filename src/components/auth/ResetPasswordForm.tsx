'use client';

/**
 * Choosing a new password from a reset link.
 *
 * The token stays in the URL and is posted from here rather than being redeemed
 * on page load: this page has to be safe to open twice, and a mail client that
 * prefetches the link must not spend the token before the person has typed
 * anything. Redemption happens on submit, with the new password, in one request.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/policy';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? 'That did not work. Ask for a new link.');
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5">
        <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink">
          Password changed. Every device that was signed in has been signed out — including this one, which is the
          point if somebody else had got in.
        </p>
        <button onClick={() => router.push('/login')} className="btn-primary w-full justify-center">
          Sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
          {error}{' '}
          <Link href="/forgot-password" className="text-accent hover:underline">
            Ask for a new link
          </Link>
          .
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">New password</span>
        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <span className="mt-1.5 block text-xs leading-relaxed text-ink-faint">
          At least {MIN_PASSWORD_LENGTH} characters. Three ordinary words beat one word with a &ldquo;!&rdquo; on the
          end — length is what makes a password hard to break, not punctuation.
        </span>
      </label>

      <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
        {busy ? 'Working…' : 'Set this password'}
      </button>
    </form>
  );
}
