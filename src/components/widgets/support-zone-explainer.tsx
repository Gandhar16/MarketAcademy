'use client';

/**
 * SupportZoneExplainer — "a level is a zone, and a stop belongs below the
 * zone plus room for noise, not below a precise line", as a short animated
 * walkthrough. Figures match the worked example in the same lesson (lows
 * 1,196–1,203). See `scene-explainer.tsx` for the shared chrome and why
 * this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'lows', caption: 'Four recent lows: ₹1,196, ₹1,201, ₹1,198, ₹1,203. No single price was ever THE level.' },
  { id: 'line', caption: 'Draw a LINE at ₹1,200 and a stop 5 rupees under it, at ₹1,195.' },
  { id: 'inside', caption: 'That stop sits inside the zone itself — ordinary daily noise hits it, not being wrong.' },
  { id: 'zone', caption: 'Draw the ZONE instead — ₹1,196 to ₹1,203 — and place the stop below it, with room for a normal day\'s range.' },
  { id: 'genuine-break', caption: 'Now picture a real break: the price closes at ₹1,175, well under the whole zone and under the zone-based stop too. That is not noise — the level actually failed.' },
  { id: 'lesson', caption: 'That stop fails only when the level genuinely breaks — not when you were right, but early.' },
];

const priceY = (p: number) => 178 - ((p - 1170) / (1210 - 1170)) * 150;
const LOWS = [1196, 1201, 1198, 1203];

export function SupportZoneExplainer() {
  return (
    <SceneExplainer
      title="Why a level is a zone, not a line"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showLine = scene === 1 || scene === 2;
        const showInsideStop = scene === 1 || scene === 2;
        const showZone = scene >= 3;
        const showGoodStop = scene >= 3;
        const showBreak = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A scatter of four lows near 1,200, a line-based stop sitting inside the noise, and a zone-based stop placed safely below it">
            <line x1={30} y1={14} x2={30} y2={190} stroke="var(--color-line)" strokeWidth={1.5} />

            {LOWS.map((p) => (
              <circle key={p} cx={30} cy={priceY(p)} r={3} fill="var(--color-ink-muted)" style={{ transition: 'opacity 400ms ease-out' }} />
            ))}
            <text x={38} y={priceY(1199) + 3} style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
              recent lows
            </text>

            {showZone && (
              <rect x={20} y={priceY(1203)} width={20} height={priceY(1196) - priceY(1203)} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-accent)" strokeWidth={1} style={{ transition: 'opacity 400ms ease-out' }} />
            )}

            {showLine && (
              <line x1={20} y1={priceY(1200)} x2={130} y2={priceY(1200)} stroke="var(--color-ink-faint)" strokeWidth={1.5} strokeDasharray="2 2" style={{ transition: 'opacity 400ms ease-out' }} />
            )}

            {showInsideStop && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={80} cy={priceY(1195)} r={3.5} fill="var(--color-down)" />
                <text x={88} y={priceY(1195) + 3} style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 600 }}>
                  stop ₹1,195 — inside the noise
                </text>
              </g>
            )}

            {showGoodStop && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={80} cy={priceY(1180)} r={3.5} fill="var(--color-up)" />
                <text x={88} y={priceY(1180) + 3} style={{ fontSize: 7.5, fill: 'var(--color-up)', fontWeight: 600 }}>
                  stop ₹1,180 — below zone + noise
                </text>
              </g>
            )}

            {showBreak && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <circle cx={30} cy={priceY(1175)} r={4.5} fill="var(--color-down)" />
                <text x={38} y={priceY(1175) - 8} style={{ fontSize: 7.5, fill: 'var(--color-down)', fontWeight: 700 }}>
                  genuine break: closes ₹1,175
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
