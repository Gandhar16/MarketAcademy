'use client';

/**
 * IntrinsicVsHopeExplainer — "the cheapest row on the screen is cheap
 * because it is currently worth nothing — that is not a bargain, it is a
 * description", as a short animated walkthrough. Figures match the worked
 * example in the same lesson (NIFTY at 24,000; 23,800 / 24,000 / 24,200
 * calls). See `scene-explainer.tsx` for the shared chrome and why this is
 * a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'NIFTY is at 24,000. Three call rows on the screen: 23,800, 24,000, 24,200.' },
  { id: 'itm', caption: 'The 23,800 call already has 200 points of real value — that part cannot be taken away by time.' },
  { id: 'atm', caption: 'The 24,000 call has nothing real yet. Its whole price is hope of improvement.' },
  { id: 'otm', caption: 'The 24,200 call has nothing real either, and needs an even bigger move just to matter.' },
  { id: 'expiry', caption: 'If NIFTY is still sitting at 24,000 on expiry day, the 24,000 and 24,200 calls both settle at zero. Their entire prices, the whole time, were only ever hope — none of it was ever real.' },
  { id: 'lesson', caption: 'The cheapest row is cheap because it is worth nothing today — a different bet, not a better price.' },
];

export function IntrinsicVsHopeExplainer() {
  return (
    <SceneExplainer
      title="What part of the price is real, right now"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const atExpiry = scene === 4;
        const cols = [
          { x: 26, strike: '23,800', intrinsic: 60, hope: atExpiry ? 0 : 20, show: scene >= 1 },
          { x: 86, strike: '24,000', intrinsic: 0, hope: atExpiry ? 0 : 40, show: scene >= 2 },
          { x: 146, strike: '24,200', intrinsic: 0, hope: atExpiry ? 0 : 26, show: scene >= 3 },
        ];

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Three call rows at 23800, 24000 and 24200 showing how much of each price is real value already held versus hope of improvement">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              NIFTY at 24,000
            </text>
            <line x1={16} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            {cols.map((c, i) => (
              <g key={i} style={{ transition: 'opacity 400ms ease-out' }} opacity={c.show ? 1 : 0.15}>
                {c.intrinsic > 0 && (
                  <rect x={c.x} y={baseY - c.intrinsic} width={38} height={c.intrinsic} fill="var(--color-up)" fillOpacity={0.7} style={{ transition: 'all 500ms ease-out' }} />
                )}
                <rect x={c.x} y={baseY - c.intrinsic - c.hope} width={38} height={c.hope} fill="var(--color-ink-faint)" fillOpacity={0.5} style={{ transition: 'all 500ms ease-out' }} />
                <text x={c.x + 19} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink)' }}>
                  {c.strike}
                </text>
              </g>
            ))}

            {scene === 5 && (
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                shaded = real · grey = hope
              </text>
            )}

            {atExpiry && (
              <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-down)' }}>
                hope is gone — only real value settles
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
