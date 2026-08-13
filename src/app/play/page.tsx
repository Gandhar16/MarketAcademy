import { GameGrid } from '@/components/games/GameGrid';

export const metadata = { title: 'Games — Market Academy' };

export default function PlayIndex() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Games</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Ten games, each training one specific, measurable skill. None of them rank you on profit. Finish the matching
        course and a game is marked unlocked here — every game stays playable either way for now.
      </p>

      <GameGrid />

      <p className="mt-8 text-[13px] text-ink-faint">
        Games marked <span className="uppercase">modelled</span> run on generated draws rather than market data — the
        mathematics is the lesson there, and each one says so on its own page.
      </p>
    </main>
  );
}
