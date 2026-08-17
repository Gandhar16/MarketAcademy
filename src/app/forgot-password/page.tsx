import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata = { title: 'Reset your password — Market Academy' };
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        We will send a link to your address. Your progress is untouched either way.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Remembered it?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
