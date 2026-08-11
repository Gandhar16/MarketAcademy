'use client';

/**
 * CandleAnatomy — the single most useful diagram in beginner trading education,
 * and one that is almost always a static image.
 *
 * Here it is DRAGGABLE. Move the open, high, low or close and the candle
 * redraws, the labels follow, and the description updates to name what you have
 * built. A learner who has dragged the close below the open and watched the
 * candle flip colour understands it in a way no annotated PNG achieves.
 *
 * Inline SVG rather than an image asset: it inherits the theme, scales to any
 * width, stays crisp on any display, and adds nothing to the download.
 */
import { useCallback, useRef, useState } from 'react';

interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

const DEFAULT: OHLC = { open: 38, high: 78, low: 12, close: 62 };
type Handle = keyof OHLC;

export function CandleAnatomy({ interactive = true }: { interactive?: boolean }) {
  const [ohlc, setOhlc] = useState<OHLC>(DEFAULT);
  const [dragging, setDragging] = useState<Handle | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 460;
  const H = 300;
  const cx = 150;
  const bodyW = 52;
  /** Values are 0–100; map to a padded vertical band. */
  const y = (v: number) => H - 30 - (v / 100) * (H - 60);

  const up = ohlc.close >= ohlc.open;
  const colour = up ? 'var(--color-up)' : 'var(--color-down)';
  const bodyTop = y(Math.max(ohlc.open, ohlc.close));
  const bodyBottom = y(Math.min(ohlc.open, ohlc.close));

  const move = useCallback(
    (clientY: number) => {
      if (!dragging || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const ratio = (clientY - rect.top) / rect.height;
      const raw = (1 - (ratio * H - 30) / (H - 60)) * 100;
      const v = Math.round(Math.min(100, Math.max(0, raw)));

      setOhlc((c) => {
        const next = { ...c, [dragging]: v };
        // A candle where the high is not the highest point is not a candle —
        // the constraint is enforced here rather than left to produce nonsense.
        next.high = Math.max(next.high, next.open, next.close);
        next.low = Math.min(next.low, next.open, next.close);
        if (dragging === 'high') next.high = Math.max(v, next.open, next.close);
        if (dragging === 'low') next.low = Math.min(v, next.open, next.close);
        return next;
      });
    },
    [dragging],
  );

  const describe = () => {
    const body = Math.abs(ohlc.close - ohlc.open);
    const range = ohlc.high - ohlc.low;
    const upper = ohlc.high - Math.max(ohlc.open, ohlc.close);
    const lower = Math.min(ohlc.open, ohlc.close) - ohlc.low;

    if (range === 0) return 'No range at all — the price never moved. Rare, and usually a halted or untraded session.';
    if (body <= range * 0.1)
      return 'A doji. Open and close are almost identical: buyers and sellers fought all session and finished level. Folklore calls this indecision — the T2 lesson checks whether that means anything.';
    if (lower >= body * 2 && upper <= body * 0.5)
      return 'A hammer shape. Price fell hard during the session and closed near the top — sellers pushed it down and were rejected. What that predicts is a separate question from what it describes.';
    if (upper >= body * 2 && lower <= body * 0.5)
      return 'A shooting star shape. Price rallied during the session and gave it all back by the close.';
    if (body >= range * 0.8)
      return `A ${up ? 'strong green' : 'strong red'} candle with almost no wick. One side controlled the entire session; there was barely any pushback.`;
    return up
      ? 'A green candle: the close is above the open, so buyers finished ahead over this period.'
      : 'A red candle: the close is below the open, so sellers finished ahead over this period.';
  };

  const handles: { key: Handle; label: string; side: 'left' | 'right'; note: string }[] = [
    { key: 'high', label: 'High', side: 'right', note: 'the highest price traded' },
    { key: 'open', label: 'Open', side: 'left', note: 'the first trade of the period' },
    { key: 'close', label: 'Close', side: 'right', note: 'the last trade of the period' },
    { key: 'low', label: 'Low', side: 'left', note: 'the lowest price traded' },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label="Anatomy of a candlestick"
        onPointerMove={(e) => dragging && move(e.clientY)}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        {/* the wick */}
        <line x1={cx} y1={y(ohlc.high)} x2={cx} y2={y(ohlc.low)} stroke={colour} strokeWidth={3} />

        {/* the body */}
        <rect
          x={cx - bodyW / 2}
          y={bodyTop}
          width={bodyW}
          height={Math.max(2, bodyBottom - bodyTop)}
          fill={colour}
          rx={2}
        />

        {/* leader lines and labels */}
        {handles.map((h) => {
          const vy = y(ohlc[h.key]);
          const isLeft = h.side === 'left';
          const lineFrom = isLeft ? cx - bodyW / 2 - 4 : cx + bodyW / 2 + 4;
          const lineTo = isLeft ? 108 : 262;
          const textX = isLeft ? 100 : 270;
          return (
            <g key={h.key}>
              <line
                x1={lineFrom}
                y1={vy}
                x2={lineTo}
                y2={vy}
                stroke="var(--color-line-strong)"
                strokeDasharray="3 3"
              />
              <text
                x={textX}
                y={vy - 4}
                textAnchor={isLeft ? 'end' : 'start'}
                fill="var(--color-ink)"
                fontSize={13}
              >
                {h.label}
              </text>
              <text
                x={textX}
                y={vy + 11}
                textAnchor={isLeft ? 'end' : 'start'}
                fill="var(--color-ink-faint)"
                fontSize={10}
              >
                {h.note}
              </text>
              {interactive && (
                <circle
                  cx={isLeft ? cx - bodyW / 2 - 4 : cx + bodyW / 2 + 4}
                  cy={vy}
                  r={8}
                  fill={dragging === h.key ? 'var(--color-accent)' : 'var(--color-surface-2)'}
                  stroke="var(--color-accent)"
                  strokeWidth={1.5}
                  className="cursor-ns-resize"
                  onPointerDown={(e) => {
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    setDragging(h.key);
                  }}
                />
              )}
            </g>
          );
        })}

        {/* wick / body annotations */}
        <g opacity={0.85}>
          <text x={cx + 4} y={y(ohlc.high) + 16} fill="var(--color-ink-faint)" fontSize={10}>
            upper wick
          </text>
          <text x={cx + 4} y={y(ohlc.low) - 8} fill="var(--color-ink-faint)" fontSize={10}>
            lower wick
          </text>
          <text x={cx - bodyW / 2 - 8} y={(bodyTop + bodyBottom) / 2} textAnchor="end" fill="var(--color-ink-faint)" fontSize={10}>
            body
          </text>
        </g>
      </svg>

      {interactive && (
        <p className="mt-1 text-center text-[11px] text-ink-faint">
          Drag the four handles. The candle redraws and the reading below follows.
        </p>
      )}

      <p className="mt-3 rounded-lg bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">{describe()}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Preset label="Doji" onClick={() => setOhlc({ open: 50, high: 78, low: 22, close: 51 })} />
        <Preset label="Hammer" onClick={() => setOhlc({ open: 66, high: 72, low: 14, close: 70 })} />
        <Preset label="Shooting star" onClick={() => setOhlc({ open: 32, high: 88, low: 27, close: 35 })} />
        <Preset label="Strong green" onClick={() => setOhlc({ open: 18, high: 84, low: 15, close: 80 })} />
        <Preset label="Reset" onClick={() => setOhlc(DEFAULT)} />
      </div>
    </div>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-line-strong px-3 py-1 text-[12px] text-ink-muted transition-colors hover:text-ink"
    >
      {label}
    </button>
  );
}
