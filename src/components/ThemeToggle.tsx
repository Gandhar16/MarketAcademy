'use client';

/**
 * Three-way theme switch: dark (the site's original, still the default),
 * light, and market — a dark base with a visibly animated ticker/candle
 * backdrop (`MarketThemeBackground`), all driven by the same `data-theme`
 * attribute this component sets on `<html>`.
 *
 * A sliding segmented control rather than a single cycling button: a pill
 * background slides to whichever of the three segments is active, so
 * switching reads as a physical toggle rather than "click and reread the
 * label to see what changed". The choice is persisted to `localStorage` and
 * applied by a blocking inline script in `layout.tsx`'s `<head>` BEFORE this
 * component ever mounts, so there is no flash of the wrong theme on load.
 */
import { useEffect, useState } from 'react';

const THEMES = ['dark', 'light', 'market'] as const;
type Theme = (typeof THEMES)[number];

const THEME_META: Record<Theme, { label: string; icon: string }> = {
  dark: { label: 'Dark', icon: '●' },
  light: { label: 'Light', icon: '○' },
  market: { label: 'Market', icon: '▲' },
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
    // real control mounts a moment later.
    return <span className="inline-block h-8 w-[6.5rem]" aria-hidden />;
  }

  const activeIndex = THEMES.indexOf(theme);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative inline-flex h-8 items-center rounded-full border border-line-strong bg-surface-2 p-0.5"
    >
      {/* The sliding pill — one absolutely-positioned element whose `left`
          animates between the three fixed-width slots, rather than three
          separately-animated buttons. `transition-[left]` alone is enough
          because every slot is the same width. */}
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 rounded-full bg-accent transition-[left] duration-300 ease-out"
        style={{ left: `calc(${activeIndex} * 2rem + 0.125rem)`, width: '2rem' }}
      />
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={theme === t}
          onClick={() => {
            applyTheme(t);
            setTheme(t);
          }}
          title={THEME_META[t].label}
          className="num relative z-10 flex h-7 w-8 items-center justify-center text-[13px] leading-none transition-colors"
          style={{ color: theme === t ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)' }}
        >
          <span aria-hidden>{THEME_META[t].icon}</span>
          <span className="sr-only">{THEME_META[t].label}</span>
        </button>
      ))}
    </div>
  );
}
