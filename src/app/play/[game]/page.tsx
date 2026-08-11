import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GAME_CATALOGUE, GAMES_BY_SLUG } from '@/lib/games/catalogue';
import { GameHost } from '@/components/games/registry';

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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/play" className="text-sm text-ink-faint transition-colors hover:text-ink">
        ← Games
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{entry.name}</h1>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-accent">{entry.skill}</div>
      <p className="mt-3 max-w-2xl text-ink-muted">{entry.intro}</p>
      <div className="mt-8">
        <GameHost slug={entry.slug} />
      </div>
    </main>
  );
}
