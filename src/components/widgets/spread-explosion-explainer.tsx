'use client';

/**
 * SpreadExplosionExplainer — "the exit that cost about ₹1,750 on Tuesday
 * costs roughly ₹25,000 on the day you actually need it", as a short
 * animated walkthrough. Figures match the worked example in the same
 * lesson (5,000 shares at ₹1,400, an ordinary-day exit versus a
 * crisis-day exit with a widened spread and a thinner book). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'ordinary', caption: 'An ordinary Tuesday: 5,000 shares walked through a normal book, a normal spread.' },
  { id: 'ordinarycost', caption: 'The exit costs about ₹1,750 — barely noticeable against the position size.' },
  { id: 'crisis', caption: 'Now a genuine crisis: the book has thinned and the spread has widened enormously.' },
  { id: 'crisiscost', caption: 'The same order, the same shares — but a much longer walk down a much thinner book.' },
  { id: 'only-defence', caption: 'Nothing here is fixable in the moment — not a smarter order type, not a better broker. The only two things that ever help are decided in advance: hold a size small enough that you are never forced to sell in a hurry, and keep some cash so you are not selling to raise it.' },
  { id: 'lesson', caption: 'The same exit now costs roughly ₹25,000 — on the one day you actually needed it.' },
];

export function SpreadExplosionExplainer() {
  return (
    <SceneExplainer
      title="The same exit, fourteen times the cost"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const isCrisis = scene >= 2 && scene !== 4;
        const h = isCrisis ? (scene >= 3 ? 130 : 60) : (scene >= 1 ? 20 : 5);

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The two things decided in advance that actually help during a liquidity crisis: a smaller position size and held cash">
              <rect x={20} y={40} width={75} height={90} rx={8} fill="var(--color-up)" fillOpacity={0.15} stroke="var(--color-up)" strokeWidth={1.5} />
              <text x={57} y={80} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                smaller
              </text>
              <text x={57} y={98} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                size
              </text>

              <rect x={105} y={40} width={75} height={90} rx={8} fill="var(--color-up)" fillOpacity={0.15} stroke="var(--color-up)" strokeWidth={1.5} />
              <text x={142} y={80} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                held
              </text>
              <text x={142} y={98} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                cash
              </text>

              <text x={100} y={155} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                decided long before the crisis
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The cost of exiting 5000 shares rising from about 1750 rupees on an ordinary day to about 25000 rupees on a crisis day">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              {isCrisis ? 'Crisis day' : 'Ordinary day'}
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={80} y={baseY - h} width={44} height={h} rx={4} fill={isCrisis ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.75} style={{ transition: 'all 600ms ease-out' }} />
            <text x={102} y={baseY - h - 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {isCrisis && scene >= 3 ? '≈₹25,000' : '≈₹1,750'}
            </text>
            <text x={102} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>cost to exit</text>

            {scene >= 4 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                same 5,000 shares, ~14x the cost
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
