'use client';

/**
 * The site navigation, at every width.
 *
 * One row, always. No hamburger and no disclosure panel — a menu that is
 * sometimes a button and sometimes a list of links is two components
 * pretending to be one, and it was the reason "is the hamburger showing when
 * it shouldn't be" kept coming up. Instead the row itself scrolls sideways
 * (`overflow-x-auto`) when it does not fit: nothing is ever hidden behind a
 * tap, it is at most a swipe away, and there is exactly one nav to keep
 * correct.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { AccountBalance } from './AccountBalance';

export interface NavItem {
  href: string;
  label: string;
}

export function HeaderNav({ items, displayName }: { items: NavItem[]; displayName: string | null }) {
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const reduceMotion = useReducedMotion();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6" aria-label="Main">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-medium tracking-tight">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
          <span className="hidden sm:inline">Market Academy</span>
          <span className="sm:hidden">Market&nbsp;Academy</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto text-[13px]">
          {items.map((n) => {
            const current = isCurrent(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={current ? 'page' : undefined}
                className={[
                  'relative shrink-0 py-1 transition-colors',
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
        </div>
      </nav>
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
        className="rounded-lg border border-line-strong px-3 py-1.5 text-ink transition-colors hover:border-accent hover:text-accent"
      >
        Sign up
      </Link>
    </>
  );
}
