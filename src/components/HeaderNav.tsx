'use client';

/**
 * The site navigation, at every width.
 *
 * The previous header put seven links and the account controls in one flex row
 * with `flex-wrap`. On a desktop that is fine. On a 360px phone the links wrap
 * to three lines, the sticky header eats a third of the viewport, and every
 * page below it starts already scrolled. Wrapping is not responsiveness — it is
 * what happens when nothing was decided.
 *
 * So there are two layouts and one breakpoint:
 *
 *   below lg — wordmark, account state, and a disclosure button. The links live
 *              in a panel that pushes the page down when open, rather than a
 *              fixed overlay: an overlay on a short landscape phone screen has
 *              nowhere to put seven items.
 *   lg and up — everything inline, as before.
 *
 * The panel closes on route change, on Escape, and on any link tap. All three,
 * because a menu that stays open after navigation is the single most common
 * mobile-nav bug and each of those paths is how a real person closes it.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export interface NavItem {
  href: string;
  label: string;
}

export function HeaderNav({ items, displayName }: { items: NavItem[]; displayName: string | null }) {
  const pathname = usePathname();
  const panelId = useId();

  /**
   * The menu remembers WHICH page it was opened on, rather than a bare boolean
   * plus an effect that closes it on navigation. Same behaviour, and the close
   * is derived instead of being a second render triggered by the first — a
   * route change makes `openPath !== pathname` and the panel is simply closed.
   */
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (next: boolean) => setOpenPath(next ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPath(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6" aria-label="Main">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-medium tracking-tight">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
          <span className="hidden sm:inline">Market Academy</span>
          <span className="sm:hidden">Market&nbsp;Academy</span>
        </Link>

        {/* Wide screens: everything inline. */}
        <div className="hidden items-center gap-5 text-sm lg:flex">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isCurrent(n.href) ? 'page' : undefined}
              className={
                isCurrent(n.href) ? 'text-ink' : 'text-ink-muted transition-colors hover:text-ink'
              }
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 text-sm">
          <ThemeToggle />
          <AccountLinks displayName={displayName} />

          <button
            type="button"
            className="btn-secondary px-3 py-1.5 lg:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(!open)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden className="num text-base leading-none">
              {open ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </nav>

      {/* Narrow screens: a disclosure panel in normal flow. */}
      <div id={panelId} hidden={!open} className="border-t border-line bg-surface lg:hidden">
        <ul className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">
          {items.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isCurrent(n.href) ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={[
                  'block rounded-lg px-3 py-3 text-[15px] transition-colors',
                  isCurrent(n.href) ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                ].join(' ')}
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function AccountLinks({ displayName }: { displayName: string | null }) {
  if (displayName) {
    return (
      <Link href="/account" className="max-w-[9rem] truncate text-ink-muted transition-colors hover:text-ink">
        {displayName}
      </Link>
    );
  }
  return (
    <>
      {/* "Sign in" is the one that gets dropped on a phone rather than "Sign up":
          a returning user knows where their account is, and a new one does not. */}
      <Link href="/login" className="hidden text-ink-muted transition-colors hover:text-ink sm:inline">
        Sign in
      </Link>
      <Link
        href="/register"
        className="rounded-lg border border-line-strong px-3 py-1.5 text-ink transition-colors hover:border-accent hover:text-accent"
      >
        Sign up
      </Link>
    </>
  );
}
