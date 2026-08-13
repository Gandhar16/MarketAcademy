'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRazorpayConstructor, loadRazorpayCheckout } from '@/lib/payments/loadCheckout';
import type { PlanId } from '@/lib/payments/plans';

interface CheckoutResponse {
  keyId: string;
  kind: 'one_time' | 'subscription';
  orderId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
}

export function CheckoutButton({
  planId,
  label,
  signedIn,
  variant = 'primary',
}: {
  planId: PlanId;
  label: string;
  signedIn: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!signedIn) {
      router.push(`/login?next=/pricing`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await loadRazorpayCheckout();

      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json().catch(() => ({}))) as CheckoutResponse & { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Could not start checkout.');

      const Razorpay = getRazorpayConstructor();
      const rzp = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Market Academy',
        description: label,
        order_id: data.kind === 'one_time' ? data.orderId : undefined,
        subscription_id: data.kind === 'subscription' ? data.subscriptionId : undefined,
        theme: { color: '#2dd4a7' },
        modal: {
          // The learner closed the widget without paying — not an error, just
          // back to an idle button.
          ondismiss: () => setBusy(false),
        },
        handler: (response) => {
          void (async () => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ planId, ...response }),
              });
              const verifyData = await verifyRes.json().catch(() => ({}));
              if (!verifyRes.ok) throw new Error(verifyData.message ?? 'Payment could not be verified.');
              router.push('/account');
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Payment could not be verified.');
            } finally {
              setBusy(false);
            }
          })();
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.');
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => void start()}
        disabled={busy}
        className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} w-full disabled:opacity-60`}
      >
        {busy ? 'Opening…' : signedIn ? label : 'Sign in to continue'}
      </button>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </div>
  );
}
