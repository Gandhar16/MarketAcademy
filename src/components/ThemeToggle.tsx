'use client';

/**
 * Three-way theme switch: dark (the site's original, still the default),
 * light, and market — a dark base with a visibly animated ticker/candle
 * backdrop (`MarketThemeBackground`), all driven by the same `data-theme`
 * attribute this component sets on `<html>`.
 *
 * The active segment is marked with a `layoutId`-shared pill (framer-motion)
 * rather than a hand-computed `left` offset — the spring physics come for
 * free and stay correct if a segment's width ever changes, instead of a CSS
 * `calc()` that would silently drift out of sync. The choice is persisted to
 * `localStorage` and applied by a blocking inline script in `layout.tsx`'s
 * `<head>` BEFORE this component ever mounts, so there is no flash of the
 * wrong theme on load.
 */
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const THEMES = ['dark', 'light', 'market'] as const;
type Theme = (typeof THEMES)[number];

const THEME_META: Record<Theme, { label: string }> = {
  dark: { label: 'Dark' },
  light: { label: 'Light' },
  market: { label: 'Market' },
};

/** Crisp, minimal line icons — moon, sun, candlestick bars — sized to sit inside a 1.75rem slot. */
function ThemeIcon({ theme }: { theme: Theme }) {
  const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none' as const };
  if (theme === 'dark') {
    return (
      <svg {...common} aria-hidden>
        <path
          d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (theme === 'light') {
    return (
      <svg {...common} aria-hidden>
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5" />
          <path d="M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" />
        </g>
      </svg>
    );
  }
  // market — candlestick bars, rising, echoing the app's up/down accent pair
  return (
    <svg {...common} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6.5 9v6" />
        <path d="M12 4v11" />
        <path d="M17.5 11v6" />
      </g>
      <rect x="5" y="10.2" width="3" height="4.2" rx="0.6" fill="currentColor" />
      <rect x="10.5" y="6.5" width="3" height="5.5" rx="0.6" fill="currentColor" />
      <rect x="16" y="13.5" width="3" height="4.2" rx="0.6" fill="currentColor" />
    </svg>
  );
}

export const THEME_STORAGE_KEY = 'ma-theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing or a full quota — the toggle still works for this load.
  }
}

export function ThemeToggle() {
  // Starts `null` on both the server render AND the client's first
  // (hydration) render — reading `document` any earlier would make those
  // two renders disagree, the classic hydration-mismatch bug. The effect
  // below then reads the real value the blocking <head> script already set,
  // exactly once, which is the legitimate "subscribe to an external system
  // after mount" case React's own effect docs describe — not state that
  // could instead be derived from props or synced some other way.
  const [theme, setTheme] = useState<Theme | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a value the blocking <head> script set before mount; there is no earlier, hydration-safe point to read it from.
    setTheme(current && (THEMES as readonly string[]).includes(current) ? (current as Theme) : 'dark');
  }, []);

  if (!theme) {
    // A fixed-size placeholder, not nothing — avoids a layout shift once the
    // real control mounts a moment later.
    return <span className="inline-block h-8 w-[6.5rem]" aria-hidden />;
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative inline-flex h-8 items-center gap-0.5 rounded-full border border-line-strong bg-surface-2 p-0.5"
    >
      {THEMES.map((t) => {
        const active = theme === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              applyTheme(t);
              setTheme(t);
            }}
            title={THEME_META[t].label}
            className="relative flex h-7 w-8 items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95"
          >
            {active && (
              <motion.span
                layoutId="theme-pill"
                className="absolute inset-0 rounded-full bg-accent shadow-sm shadow-accent/30"
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 32 }}
              />
            )}
            <span
              className="relative z-10 flex items-center justify-center transition-colors duration-150"
              style={{ color: active ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)' }}
            >
              <ThemeIcon theme={t} />
            </span>
            <span className="sr-only">{THEME_META[t].label}</span>
          </button>
        );
      })}
    </div>
  );
}
