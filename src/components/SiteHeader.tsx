import { currentUser } from '@/lib/auth/session';
import { HeaderNav, type NavItem } from './HeaderNav';

const NAV: NavItem[] = [
  { href: '/learn', label: 'Course' },
  { href: '/play', label: 'Games' },
  { href: '/sim', label: 'Simulator' },
  { href: '/reasons', label: 'Reasoning' },
  { href: '/kb', label: 'Glossary' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/progress', label: 'Progress' },
];

/**
 * Server half of the header: it exists to read the session, which needs
 * `next/headers`. Everything that has state lives in HeaderNav.
 */
export async function SiteHeader() {
  const user = await currentUser();
  return <HeaderNav items={NAV} displayName={user?.displayName ?? null} />;
}
