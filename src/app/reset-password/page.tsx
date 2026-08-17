import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'Choose a new password — Market Academy' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1>

      {token ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            This link works once. Setting a password here signs out every device that was signed in.
          </p>
          <div className="mt-8">
            <ResetPasswordForm token={token} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            This page needs the link from the reset email — it looks like only part of the address was copied.
          </p>
          <div className="mt-8">
            <Link href="/forgot-password" className="btn-primary">
              Ask for a new link
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
