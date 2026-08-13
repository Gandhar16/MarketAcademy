'use client';

/**
 * Plan status on the account page. Deliberately reads its state from props
 * computed server-side (see app/account/page.tsx) rather than fetching
 * itself — the plan is exactly the kind of fact that should never flash a
 * wrong value while a client-side fetch is in flight.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface PlanPanelProps {
  isPro: boolean;
  planLabel: string | null;
  /** null = lifetime (never expires) or not applicable. */
  planExpiresAt: number | null;
  /** True only when there is an active RECURRING subscription to cancel. */
  canCancel: boolean;
}

export function PlanPanel({ isPro, planLabel, planExpiresAt, canCancel }: PlanPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/payments/cancel', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setStatus(data.message ?? (res.ok ? 'Cancelled.' : 'Could not cancel.'));
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-medium">Plan</h2>

      {isPro ? (
        <>
          <p className="mt-2 text-sm text-ink-muted">
            <span className="font-medium text-ink">{planLabel}</span>
            {planExpiresAt == null ? (
              ' — lifetime access, no expiry.'
            ) : (
              <> — renews {new Date(planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</>
            )}
          </p>
          {canCancel && (
            <>
              <button onClick={() => void cancel()} disabled={busy} className="btn-secondary mt-4">
                Cancel plan
              </button>
              <p className="mt-2 text-[13px] text-ink-faint">
                You keep Pro access until the date above — cancelling stops the next charge, it does not cut off what
                you already paid for.
              </p>
            </>
          )}
          {status && <p className="mt-2 text-[13px] text-ink-muted">{status}</p>}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-muted">Free plan — the first four courses and six of the ten games.</p>
          <Link href="/pricing" className="btn-primary mt-4 inline-block">
            See plans
          </Link>
        </>
      )}
    </section>
  );
}
