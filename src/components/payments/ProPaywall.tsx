'use client';

import Link from 'next/link';

/**
 * Rendered instead of a lesson, a game, or an embedded game block when the
 * visitor lacks Pro access. Marked 'use client' so it can also be rendered
 * from LessonPlayer (a client component, for an embedded game block) as well
 * as directly from server pages (the lesson page, the game page) — either
 * way the actual gate is enforced by the caller never handing this component
 * real content to begin with, not by hiding it with CSS a devtools session
 * could unhide.
 */
export function ProPaywall({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-accent/40 bg-surface p-8 text-center">
        <span className="text-[11px] uppercase tracking-wider text-accent">Pro</span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>
        <Link href="/pricing" className="btn-primary mt-6 inline-block">
          See plans
        </Link>
      </div>
    </div>
  );
}
