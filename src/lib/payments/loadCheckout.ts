'use client';

/**
 * Loads Razorpay's Checkout script on demand rather than on every page load —
 * it is only ever needed on /pricing and the account page's "manage plan"
 * flow. Must be loaded from checkout.razorpay.com directly (not bundled) to
 * stay PCI-compliant; see next.config.ts for the matching CSP allowances.
 */
const SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
}

type RazorpayGlobal = { Razorpay: new (opts: RazorpayCheckoutOptions) => RazorpayInstance };

let loading: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window !== 'undefined' && (window as unknown as Partial<RazorpayGlobal>).Razorpay) {
    return Promise.resolve();
  }
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('Could not load the payment widget. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export function getRazorpayConstructor(): RazorpayGlobal['Razorpay'] {
  return (window as unknown as RazorpayGlobal).Razorpay;
}
