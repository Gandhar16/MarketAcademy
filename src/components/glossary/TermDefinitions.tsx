'use client';

/**
 * Definitions, everywhere on the site, on hover as well as on tap.
 *
 * WHAT CHANGED AND WHY
 *
 * This started life as `lesson/GlossaryPopover` and wrapped exactly one thing:
 * the lesson player. That was the right first move — the lessons are where the
 * prose is — and it left the actual complaint unanswered. A learner meets "STT"
 * for the first time in a cost breakdown after a fill in Chart Replay, not in a
 * paragraph. Every game, the simulator, the progress page and the leaderboard
 * were jargon with no way in.
 *
 * So it moved up to the root layout. One listener, delegated, for the whole
 * document: anything anywhere that carries `data-term` gets a definition, and
 * no page has to opt in or know this exists. Prose gets them automatically from
 * the annotator; React-rendered UI uses the `<Term>` component below.
 *
 * ON HOVER **AND** TAP
 *
 * The original was tap-only, on a stated principle worth keeping: hover does
 * not exist on a phone, and a definition only a mouse can reach is a definition
 * half the readers never see. That argument is about not *depending* on hover.
 * It was over-applied into not *supporting* it, and on a desktop a dotted
 * underline that needs a click reads as broken.
 *
 * Both now, without either weakening the other:
 *  - Tap/click opens and closes. Unchanged, still the primary path, still the
 *    only path that has to work.
 *  - Hover opens after a short delay, on fine-pointer devices only, and closes
 *    on leaving. The delay is what stops a definition flashing up every time
 *    the cursor crosses a paragraph on its way somewhere else.
 *  - Keyboard focus opens, because the terms have always been real buttons and
 *    tabbing to one and being told nothing is the worst of the three.
 *
 * A hover-opened popover closes on leave; a tapped one stays until dismissed.
 * That difference is deliberate — a click is a decision, a hover is a glance.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GLOSSARY_BY_ID, type GlossaryEntry } from '@/content/glossary';

interface Anchored {
  entry: GlossaryEntry;
  top: number;
  left: number;
  /** Hover-opened popovers close themselves; tapped ones wait to be dismissed. */
  transient: boolean;
}

const HOVER_OPEN_MS = 350;
const HOVER_CLOSE_MS = 180;

export function TermDefinitions({
  children,
  className = '',
}: {
  children: React.ReactNode;
  /**
   * Extra classes for the wrapper. It sits in the middle of the layout's flex
   * column, so it has to be able to pass the stretch through to its child —
   * an unstyled wrapper here silently collapses every short page on the site.
   * `relative` is always applied: the popover positions against it.
   */
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Anchored | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const close = useCallback(() => {
    clearTimer();
    setOpen(null);
  }, [clearTimer]);

  const anchor = useCallback((target: HTMLElement, transient: boolean): Anchored | null => {
    const entry = GLOSSARY_BY_ID.get(target.dataset.term ?? '');
    if (!entry) return null;
    const rect = target.getBoundingClientRect();
    const width = containerRef.current?.clientWidth ?? 0;
    // Clamped here rather than in the style prop, because the container width
    // comes off a ref and a ref must not be read during render.
    const left = Math.max(12, Math.min(rect.left + window.scrollX, Math.max(12, width - 100)));
    return { entry, top: rect.bottom + window.scrollY + 6, left, transient };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Hover is an enhancement for devices that have one. On a touch screen the
    // browser synthesises hover events around a tap, which would fight the
    // click handler for control of the same popover.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-term]');
      if (!target) {
        // A click anywhere else dismisses — but not a click inside the popover
        // itself, which is how the "More on this" link stays reachable.
        if (!(e.target as HTMLElement | null)?.closest('[data-term-popover]')) close();
        return;
      }
      e.preventDefault();
      clearTimer();
      const next = anchor(target, false);
      if (!next) return;
      // Tapping the same word again closes it. A hover-opened popover promotes
      // to a sticky one instead of closing, which is what a click on something
      // you are already looking at means.
      setOpen((current) => (current?.entry.id === next.entry.id && !current.transient ? null : next));
    }

    function onPointerOver(e: PointerEvent) {
      if (!finePointer.matches || e.pointerType !== 'mouse') return;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-term]');
      if (!target) return;
      clearTimer();
      timer.current = setTimeout(() => {
        const next = anchor(target, true);
        // Never downgrade a sticky popover into a transient one under the cursor.
        if (next) setOpen((current) => (current && !current.transient ? current : next));
      }, HOVER_OPEN_MS);
    }

    function onPointerOut(e: PointerEvent) {
      if (!finePointer.matches || e.pointerType !== 'mouse') return;
      const from = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-term]');
      if (!from) return;
      const to = e.relatedTarget as HTMLElement | null;
      // Moving into the popover is not leaving — otherwise the definition
      // vanishes the instant you reach for the link inside it.
      if (to?.closest?.('[data-term-popover]')) return;
      clearTimer();
      timer.current = setTimeout(() => setOpen((c) => (c?.transient ? null : c)), HOVER_CLOSE_MS);
    }

    function onFocusIn(e: FocusEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-term]');
      if (!target) return;
      clearTimer();
      const next = anchor(target, false);
      if (next) setOpen(next);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    container.addEventListener('click', onClick);
    container.addEventListener('pointerover', onPointerOver);
    container.addEventListener('pointerout', onPointerOut);
    container.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKey);
    return () => {
      container.removeEventListener('click', onClick);
      container.removeEventListener('pointerover', onPointerOver);
      container.removeEventListener('pointerout', onPointerOut);
      container.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [anchor, clearTimer, close]);

  // A definition anchored to a word must move with it, so it closes rather than
  // drifting when the page scrolls under it.
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', close, { passive: true, once: true });
    window.addEventListener('resize', close, { once: true });
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {children}

      {open && (
        <div
          data-term-popover
          role="dialog"
          aria-label={`Definition of ${open.entry.term}`}
          className="absolute z-40 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-line-strong bg-surface-2 p-4 shadow-2xl"
          style={{ top: open.top, left: open.left }}
          onPointerEnter={clearTimer}
          onPointerLeave={() => {
            if (open.transient) close();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-medium text-ink">{open.entry.term}</h4>
            <button
              onClick={close}
              aria-label="Close definition"
              className="-mr-1 -mt-1 rounded p-1 text-ink-faint hover:text-ink"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{open.entry.plain}</p>

          {open.entry.analogy && (
            <p className="mt-3 rounded-lg border border-accent/25 bg-accent/[0.07] px-3 py-2 text-xs leading-relaxed text-ink-muted">
              <span className="text-accent">Like this: </span>
              {open.entry.analogy}
            </p>
          )}

          {open.entry.example && (
            <p className="mt-2 rounded-lg bg-ground/60 px-3 py-2 text-xs leading-relaxed text-ink-faint">
              {open.entry.example}
            </p>
          )}

          <Link
            href={`/kb/${open.entry.id}`}
            className="mt-3 inline-block text-xs text-accent hover:underline"
            onClick={close}
          >
            The whole page on this →
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * A glossary term in React-rendered UI.
 *
 * Prose gets its terms from the annotator, which works on HTML strings and
 * cannot reach a number rendered inside a table cell. This is how a cost
 * breakdown row, a stat label in a game, or a column heading opts in — it
 * renders the same markup the annotator emits, so the one delegated listener
 * above picks it up with no extra wiring.
 *
 * Children default to the canonical spelling, and are overridable so a heading
 * can say "STT" where the entry is titled differently, or vice versa.
 */
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const entry = GLOSSARY_BY_ID.get(id);
  // A missing id renders the text plainly rather than a dead control. A typo
  // should degrade to "no definition", never to a button that does nothing.
  if (!entry) return <>{children}</>;
  return (
    <button type="button" className="term" data-term={id} aria-label={`What ${entry.term} means`}>
      {children ?? entry.term}
    </button>
  );
}
