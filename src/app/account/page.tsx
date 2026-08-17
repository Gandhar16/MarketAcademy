import { redirect } from 'next/navigation';
import { AccountPanel } from '@/components/auth/AccountPanel';
import { SignInMethodsPanel } from '@/components/auth/SignInMethodsPanel';
import { PlanPanel } from '@/components/payments/PlanPanel';
import { currentUser } from '@/lib/auth/session';
import { enabledProviders } from '@/lib/auth/oauth';
import { getDb } from '@/lib/db';
import { linkedProviders } from '@/lib/db/oauthAccounts';
import { getLatestSubscriptionForUser, getUserPlan } from '@/lib/db/payments';
import { hasProAccess } from '@/lib/payments/access';
import { PLANS, type PlanId } from '@/lib/payments/plans';

export const metadata = { title: 'Account — Market Academy' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  const db = await getDb();
  const [planState, latestSubscription, linked] = await Promise.all([
    getUserPlan(db, user.id),
    getLatestSubscriptionForUser(db, user.id),
    linkedProviders(db, user.id),
  ]);
  const isPro = hasProAccess(planState);
  const planLabel =
    latestSubscription && latestSubscription.planId in PLANS
      ? PLANS[latestSubscription.planId as PlanId].label
      : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
      <div className="mt-8 space-y-8">
        <PlanPanel
          isPro={isPro}
          planLabel={planLabel}
          planExpiresAt={planState?.planExpiresAt ?? null}
          canCancel={Boolean(
            isPro && latestSubscription?.status === 'active' && latestSubscription.razorpaySubscriptionId != null,
          )}
        />
        <SignInMethodsPanel
          methods={{
            email: user.email,
            emailVerified: user.emailVerifiedAt != null,
            linked: linked.map((l) => l.provider),
            // Only what this deployment has credentials for, so the page never
            // offers a button that would land on a provider error page.
            available: enabledProviders().map((p) => ({ id: p.id, label: p.label })),
            hasPassword: user.hasPassword,
          }}
        />
        <AccountPanel
          user={{
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            leaderboardOptIn: user.leaderboardOptIn,
            market: user.market,
          }}
        />
      </div>
    </main>
  );
}
