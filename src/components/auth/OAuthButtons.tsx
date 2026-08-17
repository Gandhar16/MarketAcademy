/**
 * The "continue with…" row.
 *
 * A server component on purpose: which providers exist is decided by which
 * credentials are configured, and that is server-only knowledge. Rendering it
 * here means the browser is never sent the name of a provider it cannot use,
 * and there is no flash of four buttons collapsing to one.
 *
 * Plain links, not fetches. The whole flow is a sequence of top-level
 * navigations, so a button that submits nothing and posts nothing is exactly
 * right — and it keeps working with JavaScript still loading.
 */
import { enabledProviders } from '@/lib/auth/oauth';

/** Brand marks, inline. Four small paths beat a dependency and a network request. */
function Mark({ provider }: { provider: string }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  switch (provider) {
    case 'google':
      return (
        <svg {...common}>
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
          />
          <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
          <path
            fill="#EA4335"
            d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
          />
        </svg>
      );
    case 'github':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.9 18.3 5.2 18.3 5.2c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
        </svg>
      );
    case 'microsoft':
      return (
        <svg {...common}>
          <path fill="#F25022" d="M2 2h9.3v9.3H2z" />
          <path fill="#7FBA00" d="M12.7 2H22v9.3h-9.3z" />
          <path fill="#00A4EF" d="M2 12.7h9.3V22H2z" />
          <path fill="#FFB900" d="M12.7 12.7H22V22h-9.3z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common} fill="#1877F2">
          <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function OAuthButtons({ next, verb = 'Continue' }: { next?: string; verb?: string }) {
  const providers = enabledProviders();
  // Nothing configured yet: render nothing at all rather than an empty divider
  // with a hopeful heading over it.
  if (providers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {providers.map((p) => {
          const href = `/api/auth/oauth/${p.id}/start${next ? `?next=${encodeURIComponent(next)}` : ''}`;
          return (
            <a
              key={p.id}
              href={href}
              // `min-h-11` — a 44px target, the size a fingertip actually hits.
              className="flex min-h-11 items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <Mark provider={p.id} />
              {verb} with {p.label}
            </a>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-faint">or use an email address</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
