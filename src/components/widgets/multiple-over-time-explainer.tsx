'use client';

/**
 * MultipleOverTimeExplainer — "the multiple was never the point — the
 * growth behind it was", as a short animated walkthrough. Figures match the
 * worked example in the same lesson (two companies at 30x, one growing 25%
 * a year). See `scene-explainer.tsx` for the shared chrome and why this is
 * a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'both', caption: 'Two companies, both trading at 30 times earnings, both earning ₹20 a share today.' },
  { id: 'grower', caption: 'Company A grows its earnings 25% a year.' },
  { id: 'flat', caption: "Company B's earnings do not grow at all." },
  { id: 'later', caption: 'Same price, three years later.' },
  { id: 'arithmetic', caption: 'The price never moved from ₹600. Only the denominator did: ₹600 ÷ ₹39 of earnings = 15.4x. Growth did all the work.' },
  { id: 'lesson', caption: "A's multiple has fallen to about 15, just by growing. B is still at 30. The multiple was never the point." },
];

export function MultipleOverTimeExplainer() {
  return (
    <SceneExplainer
      title="The same multiple, two different sentences"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showGrower = scene >= 1;
        const showFlat = scene >= 2;
        const showLater = scene >= 3;

        const aMultiple = showLater ? 15.4 : 30;
        const bMultiple = 30;
        const aEarnings = showLater ? 39 : 20;
        const bEarnings = 20;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The equation 600 divided by 39 equals 15.4, showing the unchanged price divided by grown earnings">
              <text x={100} y={60} textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: 'var(--color-ink)' }}>
                ₹600
              </text>
              <text x={100} y={80} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                price — unchanged
              </text>
              <line x1={60} y1={92} x2={140} y2={92} stroke="var(--color-ink)" strokeWidth={2} />
              <text x={100} y={112} textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: 'var(--color-up)' }}>
                ₹39
              </text>
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)' }}>
                earnings — grew 25%/yr
              </text>
              <text x={100} y={168} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-accent)' }}>
                = 15.4×
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two companies' price-to-earnings multiples, identical at first and diverging as one company's earnings grow">
            <g style={{ transition: 'opacity 400ms ease-out', opacity: showGrower ? 1 : 0.5 }}>
              <text x={55} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Company A
              </text>
              <text x={55} y={70} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: showLater ? 'var(--color-up)' : 'var(--color-ink)' }}>
                {aMultiple}x
              </text>
              <text x={55} y={86} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                earns ₹{aEarnings}/sh
              </text>
              {showGrower && (
                <text x={55} y={100} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-up)' }}>
                  +25%/yr
                </text>
              )}
            </g>

            <line x1={100} y1={20} x2={100} y2={110} stroke="var(--color-line)" strokeWidth={1} />

            <g style={{ transition: 'opacity 400ms ease-out', opacity: showFlat ? 1 : 0.5 }}>
              <text x={145} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Company B
              </text>
              <text x={145} y={70} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-ink)' }}>
                {bMultiple}x
              </text>
              <text x={145} y={86} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                earns ₹{bEarnings}/sh
              </text>
              {showFlat && (
                <text x={145} y={100} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                  no growth
                </text>
              )}
            </g>

            {showLater && (
              <text x={100} y={140} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                same price paid, 3 years on
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
