import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { currentUser } from '@/lib/auth/session';
import { MarketThemeBackground } from '@/components/MarketThemeBackground';
import { TermDefinitions } from '@/components/glossary/TermDefinitions';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const mono = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Market Academy — learn the market by doing',
  description:
    'Interactive stock market education grounded in real NSE and US market data, real costs, and real fills. No lookahead, no fake P&L.',
};

/**
 * Stated explicitly rather than relying on the framework default.
 *
 * `maximumScale` and `userScalable` are deliberately left alone: several
 * widgets here are dense with numbers, and a site that blocks pinch-zoom is
 * unusable for anybody who needs to zoom. `viewportFit: 'cover'` lets the
 * sticky header sit under the status bar on a notched phone instead of leaving
 * a band of background above it.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0d12',
};

/**
 * Sets `data-theme` on <html> before the browser paints anything, reading
 * the same `localStorage` key `ThemeToggle` writes to. Without this, the
 * page would render in the default dark theme first and then visibly snap
 * to a stored light/market preference a moment later — the classic
 * flash-of-wrong-theme bug. A blocking inline script in <head> is the only
 * point in the page lifecycle early enough to prevent that; anything in
 * <body>, including a client component's first effect, runs after paint.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('ma-theme');
    if (t === 'light' || t === 'market') document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved here so the header renders signed-in on the very first paint,
  // instead of flashing "Sign in" and correcting itself a moment later.
  const user = await currentUser();

  // suppressHydrationWarning below is scoped to this element's own attributes
  // only (React does not propagate it to children) and is the standard fix
  // for exactly this case: the blocking `theme-init` script sets `data-theme`
  // on the real <html> element before React hydrates, which React would
  // otherwise flag as a server/client mismatch every time a non-default theme
  // is stored — an intentional difference, not a bug.
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <MarketThemeBackground />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-emphasis"
        >
          Skip to content
        </a>
        <SessionProvider
          user={
            user && {
              id: user.id,
              displayName: user.displayName,
              email: user.email,
              leaderboardOptIn: user.leaderboardOptIn,
              market: user.market,
            }
          }
        >
          <SiteHeader />
          {/* Wraps the whole app, not just the lessons: jargon turns up in a
              cost breakdown after a fill far more often than it turns up in a
              paragraph, and until now only the paragraph had a definition. */}
          <TermDefinitions className="flex flex-1 flex-col">
            <div id="content" className="flex-1">
              {children}
            </div>
          </TermDefinitions>
        </SessionProvider>
      </body>
    </html>
  );
}
