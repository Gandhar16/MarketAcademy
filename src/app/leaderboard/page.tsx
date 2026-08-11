import Link from 'next/link';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { getDb } from '@/lib/db';
import { leaderboard, rankOf } from '@/lib/db/leaderboard';
import { currentUser } from '@/lib/auth/session';

export const metadata = { title: 'Leaderboard — Market Academy' };
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const db = await getDb();
  const user = await currentUser();
  const entries = await leaderboard(db, 'overall');
  const you = user ? await rankOf(db, user.id, 'overall') : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Leaderboard</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
        This board ranks <strong className="text-ink">how you traded</strong>, not how much you made. A learner who
        planned the trade, sized it from their stop, honoured that stop and lost money outranks one who bet a third of
        the account on a hunch and got lucky — because over the next hundred trades, the first one is still solvent.
      </p>

      <div className="mt-10">
        <LeaderboardTable initialBoard="overall" initialEntries={entries} you={you} />
      </div>

      {!user && (
        <p className="mt-10 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-ink-muted">
          <Link href="/register" className="text-accent hover:underline">
            Create an account
          </Link>{' '}
          to appear here. Everything on the site works without one — the board is the only thing that needs to know who
          you are.
        </p>
      )}
    </main>
  );
}
