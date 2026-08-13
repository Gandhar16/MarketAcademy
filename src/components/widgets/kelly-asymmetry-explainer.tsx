'use client';

/**
 * KellyAsymmetryExplainer — "half Kelly gives up a quarter of the growth
 * and halves the pain, double Kelly gives up all of it", as a short
 * animated walkthrough. Figures match the worked example in the same
 * lesson (a 55/45 edge at 1:1, full Kelly 10%, growth rates at half, full
 * and double). See `scene-explainer.tsx` for the shared chrome and why
 * this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'half', caption: 'Half Kelly: bet 5%. Growth rate is about three-quarters of the maximum. Drawdowns are shallow.' },
  { id: 'full', caption: 'Full Kelly: bet 10%. Growth is at its peak — and so is the pain, with drawdowns near 50%.' },
  { id: 'double', caption: 'Double Kelly: bet 20%. Growth crosses zero here, despite every bet still having a positive edge.' },
  { id: 'compare', caption: 'Half the size costs a quarter of the growth. Twice the size costs all of it.' },
  { id: 'drawdown', caption: 'Look at the pain, not just the growth: half Kelly draws down maybe 25%. Full Kelly draws down near 50%. Doubling the bet size roughly doubled the worst-case pain for a quarter less growth.' },
  { id: 'lesson', caption: 'That asymmetry is why practitioners sit well below full Kelly on purpose.' },
];

export function KellyAsymmetryExplainer() {
  return (
    <SceneExplainer
      title="The asymmetry between under- and over-betting"
      scenes={SCENES}
      renderVisual={(scene) => {
        const baseY = 170;
        const bars = [
          { label: 'Half\n5%', growth: 0.375, show: scene >= 0 },
          { label: 'Full\n10%', growth: 0.5, show: scene >= 1 },
          { label: 'Double\n20%', growth: 0, show: scene >= 2 },
        ];
        const maxGrowth = 0.5;

        if (scene === 4) {
          const drawdowns = [
            { label: 'Half 5%', pct: 25 },
            { label: 'Full 10%', pct: 50 },
          ];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Worst-case drawdown at half Kelly, about 25 percent, next to full Kelly, near 50 percent, for a quarter less growth">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                Worst-case drawdown
              </text>
              {drawdowns.map((d, i) => (
                <g key={d.label}>
                  <rect x={40 + i * 70} y={40} width={44} height={d.pct * 2.4} rx={4} fill="var(--color-down)" fillOpacity={0.3 + i * 0.3} />
                  <text x={62 + i * 70} y={40 + d.pct * 2.4 + 16} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-down)' }}>
                    {d.pct}%
                  </text>
                  <text x={62 + i * 70} y={190} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                    {d.label}
                  </text>
                </g>
              ))}
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Growth rate at half Kelly, full Kelly and double Kelly, showing growth peaking at full Kelly and falling to zero at double">
            <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              Long-run growth rate
            </text>
            <line x1={16} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />

            {bars.map((b, i) => {
              const x = 32 + i * 50;
              const h = Math.max((b.growth / maxGrowth) * 120, 3);
              return (
                <g key={i} style={{ transition: 'opacity 400ms ease-out' }} opacity={b.show ? 1 : 0.15}>
                  <rect x={x} y={baseY - h} width={36} height={h} rx={4} fill={b.growth === 0 ? 'var(--color-down)' : 'var(--color-accent)'} fillOpacity={0.75} style={{ transition: 'all 500ms ease-out' }} />
                  {b.label.split('\n').map((line, li) => (
                    <text key={li} x={x + 18} y={baseY + 14 + li * 10} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        );
      }}
    />
  );
}
