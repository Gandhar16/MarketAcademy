import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { currentUser } from '@/lib/auth/session';

export const metadata = { title: 'Create an account — Market Academy' };
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  if (await currentUser()) redirect('/progress');

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Anything you have already done is kept — registering merges your existing progress rather than starting you
        over.
      </p>

      <div className="mt-8 space-y-6">
        <OAuthButtons next="/progress" verb="Sign up" />
        <AuthForm mode="register" />
      </div>

      <div className="mt-10 rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-ink-faint">
        <p className="font-medium text-ink-muted">What is stored</p>
        <p className="mt-2">
          Your email, your display name, a one-way hash of your password, and your progress through the lessons and
          games. If you sign up with Google or another provider, we keep the id it gives us and nothing else from it —
          no contacts, no calendar, no posting anywhere. No trading account is ever connected and no money moves
          through this site. You can delete all of it from the account page, and deletion means deletion.
        </p>
        <p className="mt-2">
          The only email we ever send is one you asked for: confirming your address, or resetting your password. No
          newsletter, no tips, no &ldquo;we miss you&rdquo;.
        </p>
      </div>
    </main>
  );
}
