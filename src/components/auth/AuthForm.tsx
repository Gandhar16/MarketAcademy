'use client';

/**
 * Sign in / register.
 *
 * One component for both, because the two forms differ by two fields and a verb,
 * and splitting them means fixing every bug twice.
 *
 * On success it pushes whatever is in localStorage up to the server before
 * navigating. A learner who did four lessons signed-out and then registered
 * keeps those four lessons — losing them would be the single most annoying
 * thing this feature could do.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/policy';
import { pushLocalProgress } from '@/lib/progress/sync';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          isRegister ? { email, displayName, password, leaderboardOptIn: optIn } : { email, password },
        ),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? 'Something went wrong. Try again.');
        setBusy(false);
        return;
      }

      // Best effort. A sync failure must not block a successful sign-in — the
      // local copy is still there and the next sync will carry it.
      await pushLocalProgress().catch(() => {});

      router.push('/progress');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <Field label="Email" hint="Used to sign you in, and to send only what you ask for — a confirmation link, or a password reset.">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
      </Field>

      {isRegister && (
        <Field label="Display name" hint="What the leaderboard would show. Not your real name unless you want it to be.">
          <input
            type="text"
            required
            maxLength={24}
            autoComplete="nickname"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
          />
        </Field>
      )}

      <Field
        label="Password"
        hint={
          isRegister
            ? `At least ${MIN_PASSWORD_LENGTH} characters. Three ordinary words beat one word with a "!" on the end — length is what makes a password hard to break, not punctuation.`
            : undefined
        }
      >
        <input
          type="password"
          required
          minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
      </Field>

      {isRegister && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-4 text-sm">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span>
            <span className="font-medium text-ink">Show me on the leaderboard</span>
            <span className="mt-1 block text-ink-muted">
              You can change this any time. Leave it off and you are not on the board at all — not hidden, absent.
            </span>
          </span>
        </label>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
        {busy ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}
      </button>

      {!isRegister && (
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-ink-muted hover:text-ink hover:underline">
            Forgotten your password?
          </Link>
        </p>
      )}

      <p className="text-center text-sm text-ink-muted">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/register" className="text-accent hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-ink-faint">{hint}</span>}
    </label>
  );
}
