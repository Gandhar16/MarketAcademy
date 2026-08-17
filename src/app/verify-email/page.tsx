/**
 * Where a confirmation link lands.
 *
 * The token is redeemed here, in a server component, rather than by a fetch
 * from a client one. A mail client that prefetches links would otherwise burn
 * the token against a page that never rendered — and either way the person
 * should see the outcome on the page they opened, not after a spinner.
 */
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { markEmailVerified, redeemToken } from '@/lib/db/emailTokens';

export const metadata = { title: 'Confirm your email — Market Academy' };
export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  let heading = 'That link is not complete';
  let detail = 'It looks like only part of the address was copied. Open the link from the email again.';
  let good = false;

  if (token) {
    const db = await getDb();
    const redeemed = await redeemToken(db, token, 'verify');
    if (redeemed.ok) {
      await markEmailVerified(db, redeemed.value.userId, redeemed.value.email);
      heading = 'Address confirmed';
      detail =
        'That is the only thing it was needed for — you can now get back into this account if you forget your password.';
      good = true;
    } else {
      heading = 'That link did not work';
      detail = redeemed.message;
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{detail}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={good ? '/learn' : '/account'} className="btn-primary">
          {good ? 'Back to the lessons' : 'Go to your account'}
        </Link>
      </div>
    </main>
  );
}
