import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GAME_CATALOGUE, GAMES_BY_SLUG } from '@/lib/games/catalogue';
import { GameHost } from '@/components/games/registry';
import { ProPaywall } from '@/components/payments/ProPaywall';
import { GameLeaderboard } from '@/components/games/GameLeaderboard';
import { isGameGated, paywallEnabled } from '@/lib/payments/access';
import { currentUserHasProAccess } from '@/lib/payments/gate';
import { currentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { gameLeaderboard, gameRankOf } from '@/lib/db/leaderboard';

export function generateStaticParams() {
  return GAME_CATALOGUE.map((g) => ({ game: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const entry = GAMES_BY_SLUG.get(game);
  return { title: entry ? `${entry.name} — Market Academy` : 'Game — Market Academy' };
}

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const entry = GAMES_BY_SLUG.get(game);
  if (!entry) notFound();

  const allowed = !paywallEnabled() || !isGameGated(entry.slug) || (await currentUserHasProAccess());

  const db = await getDb();
  const user = await currentUser();
  const [entries, you] = await Promise.all([
    gameLeaderboard(db, entry.slug),
    user ? gameRankOf(db, user.id, entry.slug) : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/play" className="text-sm text-ink-faint transition-colors hover:text-ink">
        ← Games
      </Link>

      {/* Below lg: one column, leaderboard falls in below the game — there is
          nowhere to put a 300px sidebar next to a chart on a phone. lg and
          up: the leaderboard sits beside the game the whole time, including
          right after a run is filed, so "did that beat anyone" is answered
          by glancing right rather than a trip to a separate page. */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{entry.name}</h1>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-accent">{entry.skill}</div>
          <p className="mt-3 max-w-2xl text-ink-muted">{entry.intro}</p>
          <div className="mt-8">
            {allowed ? (
              <GameHost slug={entry.slug} />
            ) : (
              <ProPaywall
                title={`${entry.name} is a Pro game`}
                body="Six of the twelve games stay free forever. This is one of the six with real engine complexity behind it, and it's part of Pro."
              />
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <GameLeaderboard entries={entries} you={you} />
        </aside>
      </div>
    </main>
  );
}
