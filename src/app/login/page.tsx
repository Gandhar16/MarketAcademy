import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { currentUser } from '@/lib/auth/session';

export const metadata = { title: 'Sign in — Market Academy' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await currentUser()) redirect('/progress');

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        An account carries your progress between devices and puts you on the leaderboard if you want to be there.
        Everything on this site works without one.
      </p>
      <div className="mt-8">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
