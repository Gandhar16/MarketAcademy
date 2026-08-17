'use client';

/**
 * True when the primary pointer is a finger rather than a mouse.
 *
 * Every hit target on the drawing layer was sized for a cursor, which lands
 * within a pixel of where it is aimed. A fingertip covers roughly 8mm — about
 * 40 CSS pixels — and the person cannot see what is underneath it. An 8px grab
 * radius that feels precise with a mouse means a trendline on a phone simply
 * cannot be picked up.
 *
 * `(pointer: coarse)` asks about the primary input, so a laptop with a
 * touchscreen still reports fine and keeps the precise targets; a tablet with a
 * stylus reports fine too, which is right — a stylus is as accurate as a mouse.
 *
 * `useSyncExternalStore` rather than an effect, for the same reason as
 * `useDrawings`: it is the one hook React guarantees uses `getServerSnapshot`
 * for both the server pass and the hydration pass. The server has no pointer to
 * ask about, so it answers "fine" and the browser corrects it on the render
 * after hydration — sizes change, never markup structure.
 */

import { useSyncExternalStore } from 'react';

const QUERY = '(pointer: coarse)';

function subscribe(onChange: () => void): () => void {
  // Not merely a server guard: `matchMedia` is absent in the jsdom-less test
  // environment too, and a chart that throws on render is a worse outcome than
  // one that assumes a mouse.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isCoarse(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, isCoarse, () => false);
}

/**
 * The drawing layer's geometry, in one place so the layer and anything that
 * hit-tests against it cannot drift apart.
 *
 * `hit` is the radius within which a press counts as landing on a drawing;
 * `handle` is how big the round endpoint grips are drawn; `stroke` is the width
 * of the invisible fat copy of each shape that exists purely to be grabbed.
 * `slop` is how far the pointer must travel before a press-and-release is read
 * as a drag rather than a tap — a finger rolls a few pixels on every tap, and
 * at the mouse threshold that turns taps into unwanted one-pixel trendlines.
 */
export interface TouchMetrics {
  hit: number;
  handle: number;
  stroke: number;
  slop: number;
}

export const FINE_METRICS: TouchMetrics = { hit: 8, handle: 4.5, stroke: 14, slop: 4 };
export const COARSE_METRICS: TouchMetrics = { hit: 15, handle: 7.5, stroke: 30, slop: 10 };

export function useTouchMetrics(): TouchMetrics {
  return useCoarsePointer() ? COARSE_METRICS : FINE_METRICS;
}
