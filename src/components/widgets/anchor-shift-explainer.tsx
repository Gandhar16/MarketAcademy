'use client';

/**
 * AnchorShiftExplainer — "the identical price feels cheap or expensive
 * purely depending on which high you happened to see", as a short animated
 * walkthrough. Figures match the opening predict in the same lesson (₹800
 * today, against a ₹1,200 high vs. an ₹850 high). See `scene-explainer.tsx`
 * for the shared chrome and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'price', caption: 'The share is ₹800 today. That is the only fact that has not changed.' },
  { id: 'high-anchor', caption: 'Its 52-week high was ₹1,200. ₹800 now feels like a steep discount.' },
  { id: 'low-anchor', caption: 'Now imagine the year’s high had been ₹850 instead. The same ₹800 feels expensive.' },
  { id: 'compare', caption: 'Identical company, identical price — opposite feeling, produced only by which number you saw.' },
  { id: 'real-anchor', caption: 'A price-to-earnings multiple, checked against similar companies, is a real anchor — grounded in what you get for the price. A past price you happened to notice is not.' },
  { id: 'lesson', caption: 'Neither high tells you anything about tomorrow. Both changed how cheap ₹800 felt.' },
];

export function AnchorShiftExplainer() {
  return (
    <SceneExplainer
      title="The same price, two different anchors"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showHighAnchor = scene === 1 || (scene >= 3 && scene !== 4);
        const showLowAnchor = scene === 2 || (scene >= 3 && scene !== 4);
        const dimmed = scene >= 3 ? false : false;

        // Scale: ₹700 to ₹1,250 mapped to y=170 (bottom) .. y=20 (top)
        const yFor = (price: number) => 170 - ((price - 700) * (150 / 550));
        const priceY = yFor(800);
        const highY = yFor(1200);
        const lowY = yFor(850);

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A price-to-earnings comparison against similar companies, a real anchor, next to a past price, which is not">
              <rect x={20} y={30} width={70} height={110} rx={8} fill="var(--color-down)" fillOpacity={0.12} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
              <text x={55} y={70} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-down)' }}>
                past price
              </text>
              <text x={55} y={86} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                not real
              </text>

              <rect x={110} y={30} width={70} height={110} rx={8} fill="var(--color-up)" fillOpacity={0.15} stroke="var(--color-up)" strokeWidth={1.5} />
              <text x={145} y={65} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                P/E vs.
              </text>
              <text x={145} y={80} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                peers
              </text>
              <text x={145} y={96} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                grounded
              </text>

              <text x={100} y={168} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                one is real, one just feels real
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A price of 800 rupees, feeling cheap against a 1200 rupee high and feeling expensive against an 850 rupee high">
            <line x1={30} y1={20} x2={30} y2={170} stroke="var(--color-line)" strokeWidth={1.5} />

            <g>
              <line x1={26} y1={priceY} x2={140} y2={priceY} stroke="var(--color-ink)" strokeWidth={2} />
              <text x={148} y={priceY + 3} style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>₹800</text>
            </g>

            {showHighAnchor && (
              <g style={{ transition: 'opacity 400ms ease-out' }} opacity={dimmed ? 0.3 : 1}>
                <line x1={26} y1={highY} x2={110} y2={highY} stroke="var(--color-up)" strokeWidth={1.5} strokeDasharray="3 2" />
                <text x={4} y={highY - 4} style={{ fontSize: 7, fill: 'var(--color-up)' }}>₹1,200 high</text>
                {scene === 1 && (
                  <text x={68} y={190} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)', fontWeight: 700 }}>feels cheap</text>
                )}
              </g>
            )}

            {showLowAnchor && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={26} y1={lowY} x2={90} y2={lowY} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
                <text x={4} y={lowY - 4} style={{ fontSize: 7, fill: 'var(--color-down)' }}>₹850 high</text>
                {scene === 2 && (
                  <text x={68} y={190} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>feels expensive</text>
                )}
              </g>
            )}

            {scene >= 3 && (
              <text x={100} y={190} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>same ₹800, two feelings</text>
            )}
          </svg>
        );
      }}
    />
  );
}
