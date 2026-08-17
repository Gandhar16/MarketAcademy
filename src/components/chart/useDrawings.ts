'use client';

/**
 * Drawing state for one chart: the list, the armed tool, undo, and persistence.
 *
 * Extracted from the games rather than repeated in each of them, because
 * "trendlines survive a refresh but not a new replay" is a rule that has to be
 * identical everywhere or it is not a rule.
 */

import { useCallback, useState, useSyncExternalStore } from 'react';
import { deserialise, serialise, storageKey, type Drawing, type DrawingKind } from '@/lib/chart/drawings';

const UNDO_DEPTH = 40;

/**
 * Reading storage is wrapped because every failure mode here — private mode,
 * blocked storage, a full quota, stale JSON from an older shape — should cost
 * the learner their drawings at worst, and never the chart.
 */
function load(scope: string): Drawing[] {
  if (typeof window === 'undefined') return [];
  try {
    return deserialise(window.localStorage.getItem(storageKey(scope)));
  } catch {
    return [];
  }
}

function save(scope: string, drawings: Drawing[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(scope), serialise(drawings));
  } catch {
    // Persistence is a convenience, never a requirement.
  }
}

/**
 * False on the server and during the hydration render, true from the first
 * client render after that.
 *
 * `useSyncExternalStore` is the only hook React guarantees this behaviour for:
 * it uses `getServerSnapshot` for both the server pass and the hydration pass,
 * then switches to `getSnapshot`. That makes it the hydration-safe way to ask
 * "may I look at browser-only state yet", without a `setState` in an effect —
 * which this repo's lint rules reject, and rightly.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useDrawings(scope: string) {
  /**
   * Starts empty, always — never seeded from storage.
   *
   * Reading `localStorage` in the initial state is the classic hydration bug:
   * the server has no storage and renders "0 on chart", the browser has three
   * saved drawings and renders "3 on chart", and React throws the server's
   * markup away. Today the games happen to hide the toolbar behind a loading
   * state so it never surfaced, but that is luck rather than design, and the
   * next component to use this hook would not be so lucky.
   */
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [history, setHistory] = useState<Drawing[][]>([]);
  const [tool, setTool] = useState<DrawingKind | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [colour, setColour] = useState('#2dd4a7');
  /**
   * Off by default, like every charting package. A magnet that is on before
   * anybody asked feels like the chart is refusing to let you draw where you
   * clicked — which is exactly what it is doing.
   */
  const [magnet, setMagnet] = useState(false);
  const [hidden, setHidden] = useState(false);

  /**
   * Load once hydration has happened, and again whenever the chart underneath
   * changes identity — a new replay session is a new, unrelated stretch of
   * history, and carrying the last chart's trendlines onto it would be worse
   * than starting empty.
   *
   * Adjusted during render rather than in an effect. This is React's own
   * pattern for state that has to follow a prop: it re-renders immediately
   * with the right value instead of painting one frame of the wrong drawings
   * first.
   *
   * The key is null until hydrated, which is what keeps the hydration render
   * identical to the server's: no storage is read, so there is nothing to
   * disagree about.
   */
  const hydrated = useHydrated();
  const key = hydrated ? scope : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (loadedKey !== key) {
    setLoadedKey(key);
    setDrawings(key == null ? [] : load(key));
    setHistory([]);
    setSelectedId(null);
    setTool(null);
  }

  const change = useCallback(
    (next: Drawing[]) => {
      setDrawings((current) => {
        // Only a change in the SHAPE of the list is worth an undo step. A drag
        // fires this on every pointer move, and pushing each frame would make
        // Undo mean "rewind by one pixel".
        if (current.length !== next.length) {
          setHistory((h) => [...h.slice(-(UNDO_DEPTH - 1)), current]);
        }
        return next;
      });
      save(scope, next);
    },
    [scope],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const previous = h[h.length - 1];
      setDrawings(previous);
      save(scope, previous);
      setSelectedId(null);
      return h.slice(0, -1);
    });
  }, [scope]);

  const clear = useCallback(() => {
    setDrawings((current) => {
      if (current.length > 0) setHistory((h) => [...h.slice(-(UNDO_DEPTH - 1)), current]);
      return [];
    });
    save(scope, []);
    setSelectedId(null);
  }, [scope]);

  return {
    /** What the chart should paint — empty while drawings are hidden. */
    drawings: hidden ? [] : drawings,
    /** Everything held, hidden or not, for counts and for Clear. */
    allDrawings: drawings,
    change,
    tool,
    setTool,
    selectedId,
    setSelectedId,
    colour,
    setColour,
    magnet,
    setMagnet,
    hidden,
    setHidden,
    undo,
    canUndo: history.length > 0,
    clear,
  };
}
