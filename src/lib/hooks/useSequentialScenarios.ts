'use client';

/**
 * Shared state machine behind every "answer before you see the result, one
 * scenario at a time" widget (BiasBuster, ProcessNotOutcomeLab, and any
 * future one). Pulled out once two independent components had hand-rolled
 * the identical index/picked/finished/choose/next/reset shape — the scoring
 * itself (what counts as a right answer, what gets recorded) stays local to
 * each caller via the `onPick` callback, since that part genuinely differs
 * between them.
 */
import { useState } from 'react';

export function useSequentialScenarios<T>(items: T[]) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const finished = index >= items.length;
  const current = finished ? null : items[index];

  const choose = (i: number, onPick?: (choiceIndex: number, item: T) => void) => {
    if (picked !== null || !current) return;
    setPicked(i);
    onPick?.(i, current);
  };

  const next = () => {
    setIndex((n) => n + 1);
    setPicked(null);
  };

  const reset = () => {
    setIndex(0);
    setPicked(null);
  };

  return { index, picked, current, finished, total: items.length, choose, next, reset };
}
