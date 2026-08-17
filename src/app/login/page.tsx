import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { currentUser } from '@/lib/auth/session';

export const metadata = { title: 'Sign in — Market Academy' };
export const dynamic = 'force-dynamic';

/**
 * The only sentences this page will show for a failed social sign-in.
 *
 * The callback sends a code and this is the whole vocabulary, so a crafted
 * `?error=` cannot put words of somebody else's choosing above a real sign-in
 * form. An unrecognised code falls through to a generic line rather than being
 * echoed back.
 */
const OAUTH_ERRORS: Record<string, string> = {
  unavailable: 'That sign-in method is not available.',
  cancelled: 'Sign-in was cancelled. Nothing was shared, and nothing changed.',
  provider_error: 'That provider could not complete the sign-in. Try again, or use an email address.',
  expired: 'That sign-in took too long, or the page was reloaded. Please start again.',
  mismatch: 'That sign-in did not match the one that was started. Please try again.',
  unverified: 'That sign-in could not be verified, so it was stopped. Please try again.',
  no_code: 'The provider sent you back without a sign-in code. Please try again.',
  unreachable: 'Could not reach that provider. Try again in a moment.',
  signed_out: 'You were signed out before that finished. Sign in and try again.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect('/progress');

  // The OAuth callback cannot render a page — it is a redirect — so it hands
  // its reason over in the query string and this is where it gets said.
  const { error: code } = await searchParams;
  const error = code
    ? (OAUTH_ERRORS[code] ?? 'That sign-in could not be completed. Please try again.')
    : null;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        An account carries your progress between devices and puts you on the leaderboard if you want to be there.
        Everything on this site works without one.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-6">
        <OAuthButtons next="/progress" />
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
