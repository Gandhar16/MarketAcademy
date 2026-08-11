import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { currentUser } from '@/lib/auth/session';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved here so the header renders signed-in on the very first paint,
  // instead of flashing "Sign in" and correcting itself a moment later.
  const user = await currentUser();

  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-ground"
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
          <div id="content" className="flex-1">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
