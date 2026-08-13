'use client';

/**
 * PhysicalObligationExplainer — "the obligation is 168 times the premium
 * you risked — selling the option in the market instead realises the same
 * profit and creates none of it", as a short animated walkthrough. Figures
 * match the worked example in the same lesson (₹2,000 premium on a
 * RELIANCE 1,350 call, expiring ₹50 in the money into a ₹3,37,500
 * obligation). See `scene-explainer.tsx` for the shared chrome and why
 * this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'premium', caption: 'You paid ₹2,000 for one lot of a RELIANCE 1,350 call. That is what you risked.' },
  { id: 'itm', caption: 'RELIANCE closes ₹50 in the money — a genuinely good trade, worth ₹12,500.' },
  { id: 'obligation', caption: 'But single-stock options are physically settled. You now must BUY 250 shares at ₹1,350.' },
  { id: 'fund', caption: 'That is ₹3,37,500 you must fund — 168 times the premium you paid.' },
  { id: 'index', caption: 'A NIFTY or BANKNIFTY option would never do this — index options are cash-settled. The obligation to fund a delivery exists only for single-stock options, and it is easy to forget that distinction.' },
  { id: 'lesson', caption: 'Selling the option in the market instead realises the same ₹12,500 and creates none of this.' },
];

export function PhysicalObligationExplainer() {
  return (
    <SceneExplainer
      title="₹2,000 at risk, ₹3,37,500 to fund"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const showObligation = scene >= 2 && scene !== 4;
        const premiumH = 6;
        const obligationH = showObligation ? 140 : 6;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="An index option settling in cash next to a single-stock option requiring physical delivery, the only difference that matters here">
              <rect x={20} y={40} width={75} height={100} rx={8} fill="var(--color-up)" fillOpacity={0.12} stroke="var(--color-up)" strokeWidth={1.5} />
              <text x={57} y={80} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-up)' }}>
                NIFTY
              </text>
              <text x={57} y={98} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-up)' }}>
                cash-settled
              </text>

              <rect x={105} y={40} width={75} height={100} rx={8} fill="var(--color-down)" fillOpacity={0.15} stroke="var(--color-down)" strokeWidth={1.5} />
              <text x={142} y={80} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-down)' }}>
                RELIANCE
              </text>
              <text x={142} y={98} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)' }}>
                physical delivery
              </text>

              <text x={100} y={168} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                easy distinction to forget
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A 2000 rupee option premium next to the 337,500 rupee delivery obligation it can convert into at expiry">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Premium vs. obligation
            </text>
            <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            <rect x={40} y={baseY - premiumH} width={44} height={premiumH} rx={3} fill="var(--color-accent)" fillOpacity={0.7} />
            <text x={62} y={baseY - premiumH - 10} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹2,000</text>
            <text x={62} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>premium</text>

            <rect x={110} y={baseY - obligationH} width={50} height={obligationH} rx={4} fill={showObligation ? 'var(--color-down)' : 'var(--color-ink-faint)'} fillOpacity={0.75} style={{ transition: 'all 600ms ease-out' }} />
            <text x={135} y={baseY - obligationH - 10} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>
              {showObligation ? '₹3,37,500' : '?'}
            </text>
            <text x={135} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>to fund</text>

            {scene >= 3 && (
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-down)', fontWeight: 700 }}>168x the premium</text>
            )}
          </svg>
        );
      }}
    />
  );
}
