'use client';

/**
 * The "key terms in this lesson" primer — a centre-focused card carousel.
 *
 * Sits between the header and the first interactive block. A beginner should
 * never meet an unexplained word mid-sentence and have to guess or tap a
 * popover to keep going — this puts the vocabulary the lesson is about to use
 * in front of them up front, in plain language, with a real example, before
 * anything else asks them to reason with it.
 *
 * Sourced entirely from `lesson.introduces` and the glossary — never
 * hand-authored per lesson, so it can never drift out of sync with what a
 * lesson actually teaches. A lesson that introduces nothing new (because it
 * only deepens terms an earlier lesson already covered) renders nothing here,
 * which is correct: there is nothing new to define.
 *
 * INTERACTION — three ways in, because a carousel driven only by drag fails
 * WCAG 2.5.7 (dragging movements need a non-drag alternative) and fails
 * anyone without a mouse:
 *  1. Mouse drag (pointer events — a plain scroll container does not
 *     respond to mouse click-drag on desktop, only touch/trackpad).
 *  2. Touch swipe and trackpad scroll — free, from native
 *     `overflow-x: auto` + `scroll-snap-type`, no JS involved.
 *  3. Prev/Next buttons and dots, both keyboard-operable, which are also the
 *     accessible alternative the dragging itself needs to be WCAG-compliant.
 * Arrow keys move focus-to-focus once the track itself is focused.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { GLOSSARY_BY_ID } from '@/content/glossary';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TermPrimer({ termIds }: { termIds: string[] }) {
  const entries = useMemo(() => termIds.map((id) => GLOSSARY_BY_ID.get(id)).filter((e) => e != null), [termIds]);

  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const dragState = useRef<{ startX: number; startScroll: number; dragging: boolean; moved: boolean } | null>(null);

  // Which card's centre currently sits closest to the track's own centre —
  // recomputed on scroll (drag, swipe, wheel, or keyboard all end up here).
  const updateActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - trackCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActiveFromScroll);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [updateActiveFromScroll]);

  const scrollToIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(entries.length - 1, i));
    const card = cardRefs.current[clamped];
    card?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  };

  // Mouse drag-to-scroll. Touch already works natively (overflow-x + touch
  // scrolling); this only needs to handle the mouse pointer type, since
  // hijacking touch/pen pointer events here would fight the browser's own
  // (better) touch-scroll handling.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const track = trackRef.current;
    if (!track) return;
    dragState.current = { startX: e.clientX, startScroll: track.scrollLeft, dragging: true, moved: false };
    track.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    const track = trackRef.current;
    if (!state?.dragging || !track) return;
    const delta = e.clientX - state.startX;
    // A few pixels of jitter on an intended click should not count as a drag —
    // only past this threshold do we treat it as one, and correspondingly
    // suppress the click that fires on release (see the card's onClick below).
    if (Math.abs(delta) > 4) state.moved = true;
    track.scrollLeft = state.startScroll - delta;
  };
  const endDrag = () => {
    if (dragState.current) dragState.current.dragging = false;
  };

  /**
   * A card click either centres that card (if it is a side card, showing the
   * "click a neighbour to open it" behaviour) or, on the already-active card,
   * lets its "More on this" link work normally. Also swallows the phantom
   * click that fires on pointerup right after a real drag — otherwise
   * dragging past a card and releasing on it would both scroll AND navigate.
   */
  const onCardClick = (i: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current?.moved) {
      dragState.current.moved = false;
      e.preventDefault();
      return;
    }
    if (i !== active) {
      e.preventDefault();
      scrollToIndex(i);
    }
  };

  // Lets an ordinary vertical mouse wheel drive a horizontal carousel —
  // trackpads already produce horizontal deltas on their own and pass
  // straight through untouched.
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      track.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToIndex(active + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToIndex(active - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToIndex(entries.length - 1);
    }
  };

  if (entries.length === 0) return null;

  return (
    // Breaks out of the lesson article's `max-w-3xl` reading column — a
    // carousel needs real screen width, not the width tuned for prose. The
    // heading/description re-center at a wider (but still bounded) column so
    // this doesn't just sprawl edge-to-edge on an ultrawide monitor.
    <section
      aria-labelledby="term-primer-heading"
      className="relative left-1/2 mt-6 w-screen -translate-x-1/2 px-4 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <h2 id="term-primer-heading" className="text-[11px] uppercase tracking-wider text-accent">
          Key terms in this lesson
        </h2>
        <p className="mt-1.5 text-[13px] text-ink-faint">
          Everything below assumes you know these. Drag, scroll, or use the arrows — each one has a real example, not
          just a definition.
        </p>

        <div className="relative mt-4">
        <div
          ref={trackRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Key terms in this lesson"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          className="no-scrollbar flex cursor-grab gap-4 overflow-x-auto px-[4%] py-2 outline-none [scroll-snap-type:x_mandatory] focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing sm:px-[11%] md:px-[18%] lg:px-[24%]"
        >
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${entries.length}: ${entry.term}`}
              aria-hidden={i !== active}
              onClick={onCardClick(i)}
              className={`flex w-[92%] shrink-0 select-none flex-col rounded-xl border bg-surface p-6 transition-[opacity,transform,box-shadow,border-color] duration-500 ease-out sm:w-[78%] md:w-[64%] lg:w-[52%] ${i !== active ? 'cursor-pointer' : ''}`}
              style={{
                scrollSnapAlign: 'center',
                minHeight: '10rem',
                borderColor: i === active ? 'var(--color-accent)' : 'var(--color-line)',
                opacity: i === active ? 1 : 0.5,
                transform: i === active ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(6px)',
                boxShadow: i === active ? '0 12px 32px -12px rgb(0 0 0 / 0.35)' : 'none',
              }}
            >
              <div className="text-lg font-medium text-ink">{entry.term}</div>
              <p className="mt-2 leading-relaxed text-ink-muted">{entry.plain}</p>
              {entry.example && (
                <p className="mt-3 rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed text-ink-faint">
                  <span className="text-ink-muted">For example: </span>
                  {entry.example}
                </p>
              )}
              <Link
                href={`/kb#${entry.id}`}
                tabIndex={i === active ? 0 : -1}
                className="mt-3 inline-block text-xs text-accent hover:underline"
              >
                More on this →
              </Link>
            </div>
          ))}
        </div>

        {entries.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(active - 1)}
              disabled={active === 0}
              aria-label="Previous term"
              className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-full border border-line bg-surface p-2 text-ink-muted shadow-md transition-opacity hover:text-ink disabled:pointer-events-none disabled:opacity-0 sm:block"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(active + 1)}
              disabled={active === entries.length - 1}
              aria-label="Next term"
              className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-full border border-line bg-surface p-2 text-ink-muted shadow-md transition-opacity hover:text-ink disabled:pointer-events-none disabled:opacity-0 sm:block"
            >
              →
            </button>
          </>
        )}
      </div>

        {entries.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" role="group" aria-label="Term">
            {entries.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to ${entry.term}`}
                aria-current={i === active}
                className="h-1.5 w-6 rounded-full transition-colors"
                style={{ background: i === active ? 'var(--color-accent)' : 'var(--color-line)' }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
