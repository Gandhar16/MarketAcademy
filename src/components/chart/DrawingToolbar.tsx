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
 */

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
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
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
                    className="rounded-md px-2.5 py-1 text-[11px] transition-colors"
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

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">Colour</span>
          {COLOURS.map((c) => (
            <button
              key={c}
              onClick={() => onColour(c)}
              aria-label={`Draw in ${c}`}
              aria-pressed={colour === c}
              className="h-4 w-4 rounded-full transition-transform hover:scale-110"
              style={{ background: c, outline: colour === c ? '2px solid var(--color-ink)' : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-muted">
          <input type="checkbox" checked={magnet} onChange={(e) => onMagnet(e.target.checked)} />
          Snap to highs and lows (off by default)
        </label>

        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-muted">
          <input type="checkbox" checked={hidden} onChange={(e) => onHidden(e.target.checked)} />
          Hide drawings
        </label>

        <div className="ml-auto flex items-center gap-2">
          <span className="num text-[11px] text-ink-faint">{count} on chart</span>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-md border border-line px-2 py-1 text-[11px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            Undo
          </button>
          <button
            onClick={onClear}
            disabled={count === 0}
            className="rounded-md border border-line px-2 py-1 text-[11px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      {tool && (
        <p className="mt-2 text-[11px] text-ink-faint">
          {TOOLS.find((t) => t.kind === tool)?.hint} Click to place each point. Escape cancels; Delete removes the
          selected drawing.
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
        A line you draw is your opinion, not a measurement — and on a chart whose right-hand edge has not happened yet,
        it is the only honest kind. Drawing one <em>before</em> the next bars arrive is the whole exercise.
      </p>
    </div>
  );
}
