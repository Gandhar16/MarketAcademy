'use client';

/**
 * Small client hooks that keep components pure.
 *
 * Both of these exist to avoid the two easy React mistakes this codebase would
 * otherwise make: setting state in an effect purely to detect hydration, and
 * calling `Date.now()` during render. Both are modelled correctly as external
 * stores instead.
 */
import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * False on the server and during the first client render, true afterwards.
 *
 * Anything reading localStorage must gate on this, or the server HTML and the
 * first client render disagree and React throws a hydration error.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * The current time, quantised to `intervalMs` and refreshed on that cadence.
 *
 * Quantising matters: an unrounded `Date.now()` returns a new value on every
 * read, which would make the external-store snapshot unstable and send React
 * into an infinite re-render. Rounding makes it constant within each tick.
 */
export function useNow(intervalMs = 60_000): number {
  return useSyncExternalStore(
    (onChange) => {
      const t = setInterval(onChange, intervalMs);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}
