'use client';

/**
 * Three-way theme toggle: dark (the site's original, still the default),
 * light, and market — a light palette plus an animated background layer
 * (`MarketThemeBackground`), toggled purely by the same `data-theme`
 * attribute this component sets on `<html>`.
 *
 * The choice is persisted to `localStorage` and applied by a blocking
 * inline script in `layout.tsx`'s `<head>` BEFORE this component ever
 * mounts, so there is no flash of the wrong theme on load — this component
 * only needs to keep the attribute and storage in sync after that.
 */
import { useEffect, useState } from 'react';

const THEMES = ['dark', 'light', 'market'] as const;
type Theme = (typeof THEMES)[number];

const THEME_META: Record<Theme, { label: string; icon: string }> = {
  dark: { label: 'Dark', icon: '●' },
  light: { label: 'Light', icon: '○' },
  market: { label: 'Market', icon: '△' },
};

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

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a value the blocking <head> script set before mount; there is no earlier, hydration-safe point to read it from.
    setTheme(current && (THEMES as readonly string[]).includes(current) ? (current as Theme) : 'dark');
  }, []);

  if (!theme) {
    // A fixed-size placeholder, not nothing — avoids a layout shift once the
    // real button mounts a moment later.
    return <span className="inline-block h-8 w-[4.5rem]" aria-hidden />;
  }

  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      className="num inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong bg-surface-2 px-3 text-[11px] uppercase tracking-wide text-ink-muted transition-colors hover:text-ink"
      title={`Theme: ${THEME_META[theme].label}. Click for ${THEME_META[next].label}.`}
    >
      <span aria-hidden className="text-[13px] leading-none text-accent">
        {THEME_META[theme].icon}
      </span>
      <span className="hidden sm:inline">{THEME_META[theme].label}</span>
      <span className="sr-only">Current theme: {THEME_META[theme].label}. Activate to switch to {THEME_META[next].label}.</span>
    </button>
  );
}
