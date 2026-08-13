import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { verifyOrderPaymentSignature, verifySubscriptionPaymentSignature, verifyWebhookSignature } from './razorpay';

const KEY_SECRET = 'test_key_secret_do_not_use_in_prod';
const WEBHOOK_SECRET = 'test_webhook_secret_do_not_use_in_prod';

beforeEach(() => {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input, 'utf8').digest('hex');
}

describe('verifyOrderPaymentSignature', () => {
  it('accepts a correctly formed order_id|payment_id signature', () => {
    const signature = sign('order_abc|pay_xyz', KEY_SECRET);
    expect(verifyOrderPaymentSignature({ orderId: 'order_abc', paymentId: 'pay_xyz', signature })).toBe(true);
  });

  it('rejects a tampered payment id', () => {
    const signature = sign('order_abc|pay_xyz', KEY_SECRET);
    expect(verifyOrderPaymentSignature({ orderId: 'order_abc', paymentId: 'pay_evil', signature })).toBe(false);
  });

  it('rejects the subscription-order formula applied to an order — the two are not interchangeable', () => {
    // Deliberately signed in the WRONG order (payment|order instead of order|payment) —
    // this is the single most common integration bug, and this test is what catches it.
    const wrongOrderSignature = sign('pay_xyz|order_abc', KEY_SECRET);
    expect(verifyOrderPaymentSignature({ orderId: 'order_abc', paymentId: 'pay_xyz', signature: wrongOrderSignature })).toBe(
      false,
    );
  });

  it('rejects a signature made with the wrong secret', () => {
    const signature = sign('order_abc|pay_xyz', 'a-completely-different-secret');
    expect(verifyOrderPaymentSignature({ orderId: 'order_abc', paymentId: 'pay_xyz', signature })).toBe(false);
  });
});

describe('verifySubscriptionPaymentSignature', () => {
  it('accepts a correctly formed payment_id|subscription_id signature', () => {
    const signature = sign('pay_xyz|sub_abc', KEY_SECRET);
    expect(
      verifySubscriptionPaymentSignature({ subscriptionId: 'sub_abc', paymentId: 'pay_xyz', signature }),
    ).toBe(true);
  });

  it('rejects the order-formula order applied to a subscription', () => {
    const wrongOrderSignature = sign('sub_abc|pay_xyz', KEY_SECRET);
    expect(
      verifySubscriptionPaymentSignature({
        subscriptionId: 'sub_abc',
        paymentId: 'pay_xyz',
        signature: wrongOrderSignature,
      }),
    ).toBe(false);
  });
});

describe('verifyWebhookSignature', () => {
  it('accepts a signature over the exact raw body', () => {
    const body = '{"event":"payment.captured","payload":{}}';
    const signature = sign(body, WEBHOOK_SECRET);
    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it('rejects if the body was altered after signing — the whole point of a webhook signature', () => {
    const body = '{"event":"payment.captured","payload":{}}';
    const signature = sign(body, WEBHOOK_SECRET);
    const tampered = '{"event":"payment.captured","payload":{"amount":999999}}';
    expect(verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it('rejects a re-serialised body that differs only in whitespace', () => {
    const body = '{"event":"payment.captured","payload":{}}';
    const signature = sign(body, WEBHOOK_SECRET);
    const reformatted = '{"event": "payment.captured", "payload": {}}';
    expect(verifyWebhookSignature(reformatted, signature)).toBe(false);
  });

  it('does not accept an order/payment signature as a webhook signature', () => {
    const body = '{"event":"payment.captured"}';
    const wrongSecretSignature = sign(body, KEY_SECRET); // signed with the API secret, not the webhook secret
    expect(verifyWebhookSignature(body, wrongSecretSignature)).toBe(false);
  });
});
