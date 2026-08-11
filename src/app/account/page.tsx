import { redirect } from 'next/navigation';
import { AccountPanel } from '@/components/auth/AccountPanel';
import { currentUser } from '@/lib/auth/session';

export const metadata = { title: 'Account — Market Academy' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
      <div className="mt-8">
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
