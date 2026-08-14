import { currentUser } from '@/lib/auth/session';
import { HeaderNav, type NavItem } from './HeaderNav';

// Leaderboard is deliberately not a top-nav link: it stays reachable from
// every game's own board ("Full leaderboard →") and from /account, which is
// where "how am I doing" belongs — the header is for getting somewhere, not
// for a second scoreboard link.
const NAV: NavItem[] = [
  { href: '/learn', label: 'Course' },
  { href: '/play', label: 'Games' },
  { href: '/sim', label: 'Simulator' },
  { href: '/reasons', label: 'Reasoning' },
  { href: '/kb', label: 'Glossary' },
  { href: '/progress', label: 'Progress' },
  { href: '/pricing', label: 'Pricing' },
];

/**
 * Server half of the header: it exists to read the session, which needs
 * `next/headers`. Everything that has state lives in HeaderNav.
 */
export async function SiteHeader() {
  const user = await currentUser();
  return <HeaderNav items={NAV} displayName={user?.displayName ?? null} />;
}
