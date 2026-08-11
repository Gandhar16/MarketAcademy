'use client';

/**
 * Account settings: display name, leaderboard opt-in, sign out, delete.
 *
 * Deletion is a real delete, not a flag, so it asks for the word DELETE first —
 * the one confirmation pattern that cannot be dismissed by muscle memory.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from './SessionProvider';
import { pushLocalProgress } from '@/lib/progress/sync';

export function AccountPanel({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [optIn, setOptIn] = useState(user.leaderboardOptIn);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setStatus(null);
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName, leaderboardOptIn: optIn }),
    });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? 'Saved.' : (data.message ?? 'Could not save.'));
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function signOut() {
    // Push anything unsynced before the session goes away, or the last lesson
    // of the session only exists on this device.
    await pushLocalProgress().catch(() => {});
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  async function destroy() {
    setBusy(true);
    await fetch('/api/auth/me', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-medium">Profile</h2>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium">Display name</span>
          <input
            className="input"
            maxLength={24}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span>
            <span className="font-medium">Show me on the leaderboard</span>
            <span className="mt-1 block text-ink-muted">
              Off means absent from the board entirely, not merely hidden from the page.
            </span>
          </span>
        </label>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={busy} className="btn-primary">
            Save
          </button>
          {status && <span className="text-sm text-ink-muted">{status}</span>}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-medium">Session</h2>
        <p className="mt-2 text-sm text-ink-muted">Signed in as {user.email}.</p>
        <button onClick={signOut} className="btn-secondary mt-4">
          Sign out
        </button>
      </section>

      <section className="rounded-xl border border-danger/40 bg-danger/5 p-5">
        <h2 className="text-lg font-medium">Delete this account</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your account, progress, mastery record and every game run are removed from the database. There is no archive
          and no recovery window — nothing is retained to undo this with.
        </p>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="btn-danger mt-4">
            Delete account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1.5 block">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm.
              </span>
              <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </label>
            <div className="flex gap-3">
              <button onClick={destroy} disabled={confirmText !== 'DELETE' || busy} className="btn-danger">
                Delete permanently
              </button>
              <button onClick={() => setShowDelete(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
