'use client';

/**
 * The definition that appears when a reader taps an unfamiliar word.
 *
 * One listener on a container rather than a React component per term, because
 * the terms are injected as HTML by the prose renderer and there is no React
 * element to hang a handler on. Event delegation is the honest way to do that;
 * hydrating hundreds of individual buttons would not be.
 *
 * Tap rather than hover: hover does not exist on a phone, and a definition that
 * only appears on a mouse is a definition half the readers never see.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GLOSSARY_BY_ID, type GlossaryEntry } from '@/content/glossary';

interface Anchored {
  entry: GlossaryEntry;
  top: number;
  left: number;
}

export function GlossaryPopover({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Anchored | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-term]');
      if (!target) {
        setOpen(null);
        return;
      }
      const entry = GLOSSARY_BY_ID.get(target.dataset.term ?? '');
      if (!entry) return;

      e.preventDefault();
      const rect = target.getBoundingClientRect();
      // Clamped here rather than in the style prop, because the container width
      // comes off a ref and a ref must not be read during render.
      const containerWidth = container?.clientWidth ?? 0;
      const left = Math.max(12, Math.min(rect.left + window.scrollX, Math.max(12, containerWidth - 100)));

      setOpen((current) =>
        current?.entry.id === entry.id
          ? null // Tapping the same word again closes it.
          : { entry, top: rect.bottom + window.scrollY + 6, left },
      );
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null);
    }

    container.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      container.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

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
    <div ref={containerRef} className="relative">
      {children}

      {open && (
        <div
          role="dialog"
          aria-label={`Definition of ${open.entry.term}`}
          className="absolute z-40 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-line-strong bg-surface-2 p-4 shadow-2xl"
          style={{ top: open.top, left: open.left }}
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

          {open.entry.example && (
            <p className="mt-3 rounded-lg bg-ground/60 px-3 py-2 text-xs leading-relaxed text-ink-faint">
              {open.entry.example}
            </p>
          )}

          <Link
            href={`/kb#${open.entry.id}`}
            className="mt-3 inline-block text-xs text-accent hover:underline"
            onClick={close}
          >
            More on this →
          </Link>
        </div>
      )}
    </div>
  );
}
