/**
 * The animated backdrop for the "market" theme — real-looking ticker lines
 * and candle glyphs, coloured by direction and visibly drifting, behind the
 * page content.
 *
 * Deliberately CSS-only, not a canvas or a client component: visibility is
 * controlled entirely by the `[data-theme='market']` selector in
 * `globals.css`, so this renders identically on the server and needs no
 * hydration, no JS, and no `'use client'` boundary. It is present in the DOM
 * on every page and every theme; it simply has `display: none` unless the
 * market theme is active.
 *
 * Market theme keeps the site's original DARK surfaces (see the CSS) rather
 * than switching to a light palette, which is what gives this layer real
 * headroom — the lines read as genuine market signal, not a faint texture,
 * while still sitting entirely behind the opaque cards every real widget
 * renders on top of. `prefers-reduced-motion` freezes the drift via the
 * same global media query every other animation in this app respects.
 */

/** One tile's worth of (x, y) points, offset in x by `shift`. */
function shiftPoints(points: [number, number][], shift: number): [number, number][] {
  return points.map(([x, y]) => [x + shift, y]);
}

/** A polyline rendered as individual segments, each coloured by whether it rises or falls — "lines going up or down", not one flat colour. */
function DirectionalLine({ points, strokeWidth }: { points: [number, number][]; strokeWidth: number }) {
  return (
    <>
      {points.slice(1).map(([x2, y2], i) => {
        const [x1, y1] = points[i];
        const rising = y2 < y1; // smaller y is higher on screen
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={rising ? 'var(--color-up)' : 'var(--color-down)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

const TICKER_TILE: [number, number][] = [
  [0, 80], [40, 60], [80, 70], [120, 40], [160, 55], [200, 25], [240, 45], [280, 20],
  [320, 50], [360, 30], [400, 60], [440, 35], [480, 65], [520, 40], [560, 70], [600, 50],
  [640, 80], [680, 55], [720, 90], [760, 65], [800, 85],
];

const TICKER_TILE_2: [number, number][] = [
  [0, 40], [50, 60], [100, 30], [150, 50], [200, 75], [250, 45], [300, 65], [350, 35],
  [400, 55], [450, 25], [500, 45], [550, 70], [600, 40], [650, 60], [700, 30], [750, 50], [800, 35],
];

const CANDLE_X = [8, 30, 52, 74, 96, 118, 140, 162, 184, 206, 228, 250, 272, 294, 316, 338, 360, 382];

function CandleTile({ offset }: { offset: number }) {
  return (
    <g transform={`translate(${offset}, 0)`}>
      {CANDLE_X.map((x, i) => {
        const up = i % 3 !== 1;
        const bodyTop = 40 + ((i * 13) % 30);
        const bodyH = 10 + ((i * 7) % 20);
        const colour = up ? 'var(--color-up)' : 'var(--color-down)';
        return (
          <g key={x}>
            <line x1={x} y1={bodyTop - 8} x2={x} y2={bodyTop + bodyH + 8} stroke={colour} strokeWidth="1" />
            <rect x={x - 3} y={bodyTop} width="6" height={bodyH} fill={colour} />
          </g>
        );
      })}
    </g>
  );
}

export function MarketThemeBackground() {
  return (
    <div aria-hidden className="market-bg" data-testid="market-bg">
      <svg className="market-bg-ticker" viewBox="0 0 1600 120" preserveAspectRatio="none">
        <DirectionalLine points={TICKER_TILE} strokeWidth={2.5} />
        <DirectionalLine points={shiftPoints(TICKER_TILE, 800)} strokeWidth={2.5} />
      </svg>
      <svg className="market-bg-ticker market-bg-ticker--second" viewBox="0 0 1600 120" preserveAspectRatio="none">
        <DirectionalLine points={TICKER_TILE_2} strokeWidth={2} />
        <DirectionalLine points={shiftPoints(TICKER_TILE_2, 800)} strokeWidth={2} />
      </svg>
      <svg className="market-bg-candles" viewBox="0 0 800 120" preserveAspectRatio="none">
        <CandleTile offset={0} />
        <CandleTile offset={400} />
      </svg>
    </div>
  );
}
