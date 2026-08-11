import Link from 'next/link';
import { GAME_CATALOGUE } from '@/lib/games/catalogue';

export const metadata = { title: 'Games — Market Academy' };

export default function PlayIndex() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Games</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Ten games, each training one specific, measurable skill. None of them rank you on profit.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
        {GAME_CATALOGUE.map((g) => (
          <Link key={g.slug} href={`/play/${g.slug}`} className="bg-surface p-5 transition-colors hover:bg-surface-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{g.name}</span>
              {g.modelled && (
                <span className="text-[10px] uppercase tracking-wider text-ink-faint">modelled</span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-accent">{g.skill}</div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{g.blurb}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-[13px] text-ink-faint">
        Games marked <span className="uppercase">modelled</span> run on generated draws rather than market data — the
        mathematics is the lesson there, and each one says so on its own page.
      </p>
    </main>
  );
}
