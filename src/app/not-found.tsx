import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="text-[11px] uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">That page does not exist</h1>
      <p className="mt-3 text-ink-muted">
        It may have been a lesson that has not been written yet. The curriculum plan lists everything that is coming.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/learn" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-ground">
          Go to the curriculum
        </Link>
        <Link href="/" className="rounded-lg border border-line-strong px-5 py-2.5 text-ink-muted">
          Home
        </Link>
      </div>
    </main>
  );
}
