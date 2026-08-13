'use client';

/**
 * TriggerFillExplainer — "a stop has two prices, a trigger and a fill, and
 * a gap can put real distance between them", as a short animated
 * walkthrough. See `scene-explainer.tsx` for the shared chrome and why this
 * is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'hold', caption: 'You hold at ₹1,400, with a stop set to trigger at ₹1,350.' },
  { id: 'gap', caption: 'Overnight, bad news. The stock never trades at ₹1,350 — it opens already down, at ₹1,180.' },
  { id: 'trigger', caption: 'The trigger still fires, because price passed through where ₹1,350 used to be.' },
  { id: 'fill', caption: 'But the order fills at the next available price: ₹1,180. Trigger and fill are two different prices.' },
  { id: 'cost', caption: 'On a 100-share position, that ₹170 gap between trigger and fill is ₹17,000 — money the stop\'s "guarantee" never actually promised.' },
  { id: 'lesson', caption: 'In a calm market they are nearly identical. After a gap, they can be far apart — and nothing failed. That is simply where the market was.' },
];

const priceY = (price: number) => 188 - ((price - 1150) / (1450 - 1150)) * 168;

export function TriggerFillExplainer() {
  return (
    <SceneExplainer
      title="Trigger price vs. fill price"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showGap = scene >= 1;
        const showTrigger = scene >= 2;
        const showFill = scene >= 3;
        const showCost = scene >= 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A vertical price axis showing a stop's trigger price and, after a gap, a fill price far below it">
            <line x1={30} y1={16} x2={30} y2={196} stroke="var(--color-line)" strokeWidth={1.5} />

            <circle cx={30} cy={priceY(1400)} r={3} fill="var(--color-ink-faint)" />
            <text x={38} y={priceY(1400) + 3} style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Held at ₹1,400
            </text>

            <circle cx={30} cy={priceY(1350)} r={3} fill="var(--color-accent)" />
            <text x={38} y={priceY(1350) + 3} style={{ fontSize: 8, fill: 'var(--color-accent)' }}>
              Trigger ₹1,350
            </text>

            {showGap && (
              <line
                x1={30}
                y1={priceY(1350)}
                x2={30}
                y2={priceY(1180)}
                stroke="var(--color-down)"
                strokeWidth={2}
                strokeDasharray="3 3"
                style={{ transition: 'opacity 400ms ease-out' }}
              />
            )}

            {showTrigger && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={76} y={priceY(1350) - 9} width={70} height={18} rx={4} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1.5} />
                <text x={111} y={priceY(1350) + 4} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-accent)', fontWeight: 600 }}>
                  triggered
                </text>
              </g>
            )}

            {showFill && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={30} cy={priceY(1180)} r={3} fill="var(--color-down)" />
                <rect x={76} y={priceY(1180) - 9} width={70} height={18} rx={4} fill="var(--color-down)" fillOpacity={0.15} stroke="var(--color-down)" strokeWidth={1.5} />
                <text x={111} y={priceY(1180) + 4} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 600 }}>
                  fills ₹1,180
                </text>
              </g>
            )}

            {showCost && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <rect x={30} y={4} width={166} height={16} rx={4} fill="var(--color-down)" fillOpacity={0.1} stroke="var(--color-down)" strokeWidth={1} />
                <text x={113} y={16} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 700, fill: 'var(--color-down)' }}>
                  100 shares × ₹170 gap = ₹17,000
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
