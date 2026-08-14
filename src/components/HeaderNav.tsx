'use client';

/**
 * The site navigation.
 *
 * A floating glass pill rather than a flush-edge bordered bar — translucent,
 * blurred, no hard box around it. Below 900px the links collapse behind a
 * disclosure button; at 900px and up they are inline. The breakpoint is a
 * CSS one (`min-[900px]:`), not a JS resize listener, so it reacts to an
 * actual resize (a maximised window dragged narrower, a DevTools device
 * toggle) exactly like the media query it is, with no extra state to get out
 * of sync with the viewport.
 *
 * The panel remembers WHICH page it was opened on rather than a bare
 * boolean: a route change makes `openPath !== pathname` and the panel is
 * simply closed, no separate effect needed.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { AccountBalance } from './AccountBalance';

export interface NavItem {
  href: string;
  label: string;
}

export function HeaderNav({ items, displayName }: { items: NavItem[]; displayName: string | null }) {
  const pathname = usePathname();
  const panelId = useId();
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
  const reduceMotion = useReducedMotion();

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div className="mx-auto w-full max-w-6xl">
        <nav
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface/60 px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-surface/40"
          aria-label="Main"
        >
          <Link href="/" className="flex shrink-0 items-center gap-2 font-medium tracking-tight">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
            <span className="hidden sm:inline">Market Academy</span>
            <span className="sm:hidden">Market&nbsp;Academy</span>
          </Link>

          <div className="hidden items-center gap-3 text-[13px] min-[900px]:flex">
            {items.map((n) => {
              const current = isCurrent(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={current ? 'page' : undefined}
                  className={[
                    'relative py-1 transition-colors',
                    current ? 'text-ink' : 'text-ink-muted hover:text-ink',
                  ].join(' ')}
                >
                  {n.label}
                  {current && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-accent"
                      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3 text-sm">
            <ThemeToggle />
            <AccountLinks displayName={displayName} />

            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10 min-[900px]:hidden"
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

        {/* Narrow screens: a glass panel of its own, floating just below the pill. */}
        <div
          id={panelId}
          hidden={!open}
          className="mt-2 rounded-2xl border border-white/10 bg-surface/70 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 min-[900px]:hidden"
        >
          <ul>
            {items.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={isCurrent(n.href) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={[
                    'block rounded-xl px-3 py-3 text-[15px] transition-colors',
                    isCurrent(n.href) ? 'bg-white/10 text-ink' : 'text-ink-muted hover:bg-white/5 hover:text-ink',
                  ].join(' ')}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

function AccountLinks({ displayName }: { displayName: string | null }) {
  if (displayName) {
    return (
      <Link href="/account" className="flex items-center gap-2 text-ink-muted transition-colors hover:text-ink">
        <span className="hidden max-w-[9rem] truncate sm:inline">{displayName}</span>
        <AccountBalance />
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
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-ink transition-colors hover:border-accent/50 hover:text-accent"
      >
        Sign up
      </Link>
    </>
  );
}
