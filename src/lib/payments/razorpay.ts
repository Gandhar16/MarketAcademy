/**
 * Razorpay client and signature verification.
 *
 * Server-only. `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` never
 * leave this file — everything a browser needs is the public `key_id`
 * (safe to expose; it identifies the account, not a credential) plus an
 * order/subscription id created here.
 *
 * Two distinct signatures exist and are easy to confuse:
 *
 *  1. The CHECKOUT signature (`verifyCheckoutSignature`): returned to the
 *     browser when Razorpay's popup completes, and posted back to
 *     /api/payments/verify. This gives the learner an instant "you're Pro
 *     now" without waiting on a webhook round trip, and it uses one of two
 *     different HMAC input orders depending on whether it was an order
 *     (one-time) or a subscription (recurring) — see the two functions
 *     below, they are NOT interchangeable.
 *  2. The WEBHOOK signature (`verifyWebhookSignature`): signs the raw
 *     request body of a server-to-server call from Razorpay's infrastructure,
 *     using a DIFFERENT secret (the webhook secret, configured separately in
 *     the Razorpay dashboard, not the API key secret). This is the
 *     authoritative source of truth — the checkout signature only ever grants
 *     access optimistically; the webhook is what a refund, a failed
 *     recurring charge, or a cancellation actually flows through.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';

let client: Razorpay | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Payments cannot work without it — see docs/payments.md.`);
  }
  return value;
}

/** The public key id — safe to send to the browser, it is not a secret. */
export function razorpayKeyId(): string {
  return requireEnv('RAZORPAY_KEY_ID');
}

export function getRazorpayClient(): Razorpay {
  if (client) return client;
  client = new Razorpay({
    key_id: requireEnv('RAZORPAY_KEY_ID'),
    key_secret: requireEnv('RAZORPAY_KEY_SECRET'),
  });
  return client;
}

/** Constant-time compare, so a signature check can never become a timing oracle. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function hmacHex(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input, 'utf8').digest('hex');
}

/** For a one-time (lifetime) purchase: HMAC of `order_id|payment_id`. */
export function verifyOrderPaymentSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = hmacHex(`${opts.orderId}|${opts.paymentId}`, requireEnv('RAZORPAY_KEY_SECRET'));
  return safeEqual(expected, opts.signature);
}

/**
 * For a recurring plan's first (authorising) payment: HMAC of
 * `payment_id|subscription_id` — note the order is reversed relative to the
 * order-payment signature above. Getting this backwards is the single most
 * common Razorpay integration bug; it is called out explicitly for that
 * reason.
 */
export function verifySubscriptionPaymentSignature(opts: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = hmacHex(`${opts.paymentId}|${opts.subscriptionId}`, requireEnv('RAZORPAY_KEY_SECRET'));
  return safeEqual(expected, opts.signature);
}

/**
 * Verifies a webhook delivery against the RAW request body — re-serialised
 * JSON can differ byte-for-byte from what Razorpay actually signed, so the
 * caller must pass the exact text of the request, not a re-stringified
 * object. Uses the separate webhook secret, never the API key secret.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = hmacHex(rawBody, requireEnv('RAZORPAY_WEBHOOK_SECRET'));
  return safeEqual(expected, signature);
}
