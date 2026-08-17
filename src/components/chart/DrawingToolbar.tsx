'use client';

/**
 * The drawing palette.
 *
 * Grouped the way the tools are actually reached for — lines, channels, shapes,
 * measurements, notes — rather than alphabetically, and each button carries a
 * plain-English hint under the same no-jargon rule the glossary follows.
 *
 * The note at the foot is not decoration. This site spends a whole lesson
 * (`t2-trendlines`) on the fact that a line drawn across a finished chart is a
 * line drawn with hindsight, and a drawing toolbar is precisely the instrument
 * that makes that mistake easy. Saying so where the tools are is the difference
 * between teaching the idea and merely having taught it.
 *
 * On a phone the palette collapses behind a single button. Sixteen tools in
 * five labelled groups wrap to roughly six rows at 360px, which pushed the
 * chart itself below the fold — on the one screen size where the chart is
 * already smallest. The collapse is done with a `hidden sm:block` class rather
 * than by measuring the viewport in JavaScript, so the server and the browser
 * render the same markup and nothing jumps after hydration.
 */

import { useState } from 'react';
import { TOOLS, type DrawingKind } from '@/lib/chart/drawings';

const COLOURS = ['#2dd4a7', '#6ba9ff', '#f0b429', '#ff7a5c', '#a78bfa', '#9aa5b8'];

const GROUPS = ['Lines', 'Channels', 'Shapes', 'Measure', 'Notes'] as const;

export function DrawingToolbar({
  tool,
  onTool,
  colour,
  onColour,
  magnet,
  onMagnet,
  count,
  onClear,
  onUndo,
  canUndo,
  hidden,
  onHidden,
  hasSelection,
  onDeleteSelected,
}: {
  tool: DrawingKind | null;
  onTool: (t: DrawingKind | null) => void;
  colour: string;
  onColour: (c: string) => void;
  magnet: boolean;
  onMagnet: (v: boolean) => void;
  count: number;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hidden: boolean;
  onHidden: (v: boolean) => void;
  /** Something on the chart is selected, so there is something to delete. */
  hasSelection: boolean;
  onDeleteSelected: () => void;
}) {
  const [open, setOpen] = useState(false);
  const active = TOOLS.find((t) => t.kind === tool);

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      {/*
        Phone-only header. It doubles as the readout of what is armed, so a
        collapsed palette still answers "why is my finger drawing a rectangle".
      */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-line px-3 text-left text-xs text-ink-muted sm:hidden"
      >
        <span>
          {active ? (
            <>
              Drawing: <span className="font-medium text-ink">{active.label}</span>
            </>
          ) : (
            'Drawing tools'
          )}
        </span>
        <span aria-hidden className="text-ink-faint">
          {open ? 'Hide ▲' : 'Show ▼'}
        </span>
      </button>

      <div className={`${open ? 'mt-3' : 'hidden'} sm:mt-0 sm:block`}>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          {GROUPS.map((group) => (
            <div key={group}>
              <div className="text-[10px] uppercase tracking-wider text-ink-faint">{group}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TOOLS.filter((t) => t.group === group).map((t) => {
                  const on = tool === t.kind;
                  return (
                    <button
                      key={t.kind}
                      onClick={() => onTool(on ? null : t.kind)}
                      title={t.hint}
                      aria-pressed={on}
                      // `min-h-9` on touch, the compact original from `sm` up.
                      // A 24px-tall chip is a coin toss for a fingertip.
                      className="min-h-9 rounded-md px-3 text-xs transition-colors sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-[11px]"
                      style={{
                        background: on ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: on ? 'var(--color-on-emphasis)' : 'var(--color-ink-muted)',
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">Colour</span>
          {COLOURS.map((c) => (
            <button
              key={c}
              onClick={() => onColour(c)}
              aria-label={`Draw in ${c}`}
              aria-pressed={colour === c}
              // A 16px dot is an unhittable target with a fingertip, and there
              // are six of them side by side. Doubled below `sm`.
              className="h-7 w-7 rounded-full transition-transform hover:scale-110 sm:h-4 sm:w-4"
              style={{ background: c, outline: colour === c ? '2px solid var(--color-ink)' : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>

        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs text-ink-muted sm:min-h-0 sm:gap-1.5 sm:text-[11px]">
          <input
            type="checkbox"
            checked={magnet}
            onChange={(e) => onMagnet(e.target.checked)}
            className="h-4 w-4 sm:h-3 sm:w-3"
          />
          Snap to highs and lows (off by default)
        </label>

        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs text-ink-muted sm:min-h-0 sm:gap-1.5 sm:text-[11px]">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => onHidden(e.target.checked)}
            className="h-4 w-4 sm:h-3 sm:w-3"
          />
          Hide drawings
        </label>

        <div className="ml-auto flex items-center gap-2">
          <span className="num text-[11px] text-ink-faint">{count} on chart</span>
          {/*
            Delete and Cancel exist on the keyboard already. They are repeated
            here because a phone has neither key — without them a drawing
            selected on a touchscreen could not be removed at all, and a
            half-placed channel could not be abandoned.
          */}
          {hasSelection && (
            <button
              onClick={onDeleteSelected}
              className="min-h-9 rounded-md border border-danger/40 px-3 text-xs text-ink-muted transition-colors hover:text-ink sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
            >
              Delete selected
            </button>
          )}
          {tool && (
            <button
              onClick={() => onTool(null)}
              className="min-h-9 rounded-md border border-line px-3 text-xs text-ink-muted transition-colors hover:text-ink sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="min-h-9 rounded-md border border-line px-3 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
          >
            Undo
          </button>
          <button
            onClick={onClear}
            disabled={count === 0}
            className="min-h-9 rounded-md border border-line px-3 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
          >
            Clear
          </button>
        </div>
      </div>

      {active && (
        <p className="mt-2 text-[11px] text-ink-faint">
          {/* Worded for both inputs. The old copy named only Escape and Delete,
              which told a phone user to press keys their device does not have. */}
          {active.hint} Drag or tap to place each point. Cancel abandons it; a selected drawing goes with Delete
          selected, or the Delete key.
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
        A line you draw is your opinion, not a measurement — and on a chart whose right-hand edge has not happened yet,
        it is the only honest kind. Drawing one <em>before</em> the next bars arrive is the whole exercise.
      </p>
    </div>
  );
}
