'use client';

/**
 * RecallForcedBuyExplainer — "the loss was forced — you did not decide to
 * close at ₹880, the recall decided it for you", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (500
 * shares shorted at ₹800, recalled three weeks later at ₹880). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'short', caption: 'You borrow 500 shares and sell them at ₹800, expecting a fall.' },
  { id: 'time', caption: 'Three weeks pass. The borrowing fee accrues daily, whatever the price does.' },
  { id: 'recall', caption: 'The lender recalls the shares. You must return them — by buying, not by choice.' },
  { id: 'price', caption: 'The price is now ₹880. You buy back at whatever it is, on the lender\'s schedule.' },
  { id: 'crowded', caption: 'The stocks most worth shorting are usually the ones everybody already agrees are overpriced — which means the crowd of borrowers is largest exactly there, and so is the risk of a recall arriving at the worst possible moment.' },
  { id: 'lesson', caption: 'A ₹40,000 loss, forced. You did not decide to close here — the recall did.' },
];

export function RecallForcedBuyExplainer() {
  return (
    <SceneExplainer
      title="A recall closes the position on someone else's clock"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showRecall = scene >= 2 && scene !== 4;
        const showPrice = scene >= 3 && scene !== 4;
        const soldY = 130;
        const boughtY = 70;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A crowded stock everybody agrees is overpriced, drawing the largest pool of short sellers and the greatest recall risk">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={i} cx={40 + (i % 3) * 60} cy={50 + Math.floor(i / 3) * 40} r={9} fill="var(--color-down)" fillOpacity={0.6} />
              ))}
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                the crowd everyone agrees with
              </text>
              <text x={100} y={150} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                = the highest recall risk
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="500 shares sold at 800 rupees, then a recall forcing a buyback at 880 rupees on a schedule the borrower did not choose">
            <line x1={20} y1={soldY} x2={170} y2={soldY} stroke="var(--color-line)" strokeWidth={1.5} />
            <text x={20} y={soldY + 14} style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>sold ₹800</text>

            {showRecall && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={100} y={100} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                  RECALLED
                </text>
              </g>
            )}

            {showPrice && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={boughtY} x2={170} y2={boughtY} stroke="var(--color-down)" strokeWidth={2} />
                <text x={20} y={boughtY - 6} style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>forced buy ₹880</text>
                <line x1={95} y1={soldY} x2={95} y2={boughtY} stroke="var(--color-down)" strokeWidth={1.5} strokeDasharray="3 2" />
              </g>
            )}

            {scene >= 4 && (
              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>
                −₹40,000, not your choice of moment
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
