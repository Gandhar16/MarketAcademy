import { currentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getUserPlan } from '@/lib/db/payments';
import { hasProAccess } from '@/lib/payments/access';
import { PLANS } from '@/lib/payments/plans';
import { CheckoutButton } from '@/components/payments/CheckoutButton';

export const metadata = { title: 'Pricing — Market Academy' };
export const dynamic = 'force-dynamic';

const CARD_ORDER = ['monthly', 'quarterly', 'annual', 'lifetime'] as const;

export default async function PricingPage() {
  const user = await currentUser();
  const planState = user ? await getUserPlan(await getDb(), user.id) : null;
  const isPro = hasProAccess(planState);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Go Pro</h1>
        <p className="mt-3 text-ink-muted">
          Free stays free forever — Ground Floor, Placing a Trade, Risk &amp; Position Sizing, and Long-Term Investing,
          plus six of the ten games. Pro unlocks the rest: technical and fundamental analysis, options, professional
          risk management, edge cases, and the four games with real engine complexity behind them.
        </p>
      </div>

      {isPro && (
        <p className="mx-auto mt-6 max-w-md rounded-lg border border-up/40 bg-up/10 px-4 py-3 text-center text-sm text-up">
          You already have Pro access.{' '}
          <a href="/account" className="underline underline-offset-2">
            Manage your plan
          </a>
          .
        </p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARD_ORDER.map((id) => {
          const plan = PLANS[id];
          const recommended = id === 'annual';
          return (
            <div
              key={id}
              className={[
                'flex flex-col rounded-xl border bg-surface p-5',
                recommended ? 'border-accent ring-1 ring-accent/40' : 'border-line',
              ].join(' ')}
            >
              {recommended && (
                <span className="mb-2 self-start rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                  Best value
                </span>
              )}
              <h2 className="text-lg font-medium">{plan.label}</h2>
              <p className="num mt-1 text-2xl font-semibold">
                ₹{(plan.amountPaise / 100).toLocaleString('en-IN')}
                {plan.kind === 'subscription' && (
                  <span className="text-sm font-normal text-ink-faint">
                    {' '}
                    / {plan.period === 'yearly' ? 'year' : plan.interval === 1 ? 'month' : `${plan.interval} months`}
                  </span>
                )}
              </p>
              <p className="mt-1 text-[13px] text-ink-faint">{plan.billingNote}</p>
              {plan.kind === 'one_time' && (
                <p className="mt-1 text-[13px] text-ink-faint">One payment. No recurring charge, ever.</p>
              )}
              <div className="mt-5 flex-1" />
              <CheckoutButton
                planId={plan.id}
                label={isPro ? 'Switch to this plan' : `Get ${plan.label}`}
                signedIn={user != null}
                variant={recommended ? 'primary' : 'secondary'}
              />
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] text-ink-faint">
        Cancel a recurring plan any time — you keep access until the period you already paid for ends, never cut off
        early. Payments are handled by Razorpay; no card details ever touch this site&apos;s servers.
      </p>
    </main>
  );
}
