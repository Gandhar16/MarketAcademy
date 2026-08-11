import { Simulator } from '@/components/sim/Simulator';

export const metadata = { title: 'Simulator — Market Academy' };

export default function SimPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Simulator</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Today&rsquo;s real market, a ₹1,00,000 account, and the full Indian cost stack on every fill. A round trip at an
        unchanged price loses money here — because it does in reality, and a simulator that hides that is teaching you
        something false.
      </p>
      <div className="mt-10">
        <Simulator />
      </div>
    </main>
  );
}
