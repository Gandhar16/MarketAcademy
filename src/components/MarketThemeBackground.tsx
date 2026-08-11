/**
 * The animated backdrop for the "market" theme — a slow drift of ticker-line
 * silhouettes and faint candle glyphs behind the page content.
 *
 * Deliberately CSS-only, not a canvas or a client component: visibility is
 * controlled entirely by the `[data-theme='market']` selector below, so this
 * renders identically on the server and needs no hydration, no JS, and no
 * `'use client'` boundary. It is present in the DOM on every page and every
 * theme; it simply has `display: none` unless the market theme is active.
 *
 * Kept faint on purpose — the request was "modern market signals in the
 * background, but should not make reading hard, keep it light". Opacity
 * stays low enough that body text sits comfortably on top of it at every
 * point in the loop, and `prefers-reduced-motion` freezes it via the same
 * global media query every other animation in this app already respects.
 */
// One tile of the ticker line, 0-800 in its own coordinate space. Rendered
// twice, back to back, so a CSS translateX of exactly -50% loops seamlessly
// regardless of the element's actual rendered pixel width.
const TICKER_TILE =
  '0,80 40,60 80,70 120,40 160,55 200,25 240,45 280,20 320,50 360,30 400,60 440,35 480,65 520,40 560,70 600,50 640,80 680,55 720,90 760,65 800,85';

const CANDLE_X = [8, 30, 52, 74, 96, 118, 140, 162, 184, 206, 228, 250, 272, 294, 316, 338, 360, 382];

function CandleTile({ offset }: { offset: number }) {
  return (
    <g transform={`translate(${offset}, 0)`}>
      {CANDLE_X.map((x, i) => {
        const up = i % 3 !== 1;
        const bodyTop = 40 + ((i * 13) % 30);
        const bodyH = 10 + ((i * 7) % 20);
        return (
          <g key={x}>
            <line x1={x} y1={bodyTop - 8} x2={x} y2={bodyTop + bodyH + 8} stroke="currentColor" strokeWidth="1" />
            <rect x={x - 3} y={bodyTop} width="6" height={bodyH} fill={up ? 'var(--color-up)' : 'var(--color-down)'} />
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
        <polyline points={TICKER_TILE} fill="none" stroke="currentColor" strokeWidth="2" />
        <polyline
          points={TICKER_TILE.split(' ')
            .map((pt) => {
              const [x, yv] = pt.split(',');
              return `${Number(x) + 800},${yv}`;
            })
            .join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <svg className="market-bg-candles" viewBox="0 0 800 120" preserveAspectRatio="none">
        <CandleTile offset={0} />
        <CandleTile offset={400} />
      </svg>
    </div>
  );
}
