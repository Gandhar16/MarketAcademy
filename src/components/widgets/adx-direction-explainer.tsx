'use client';

/**
 * AdxDirectionExplainer — "ADX rises for a strong move in EITHER direction
 * — it measures conviction, never which way", as a short animated
 * walkthrough. See `scene-explainer.tsx` for the shared chrome and why this
 * is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'up', caption: 'A stock trends up hard.' },
  { id: 'up-adx', caption: 'ADX rises.' },
  { id: 'down', caption: 'A different stock trends down just as hard.' },
  { id: 'down-adx', caption: 'ADX rises here too — identically.' },
  { id: 'plus-minus', caption: "Direction comes from a different pair of lines entirely: +DI above −DI describes an uptrend, +DI below −DI describes a downtrend. ADX only says how strongly, once you already know which." },
  { id: 'lesson', caption: 'ADX cannot tell an uptrend from a downtrend. Direction lives in +DI and −DI, never in ADX itself.' },
];

export function AdxDirectionExplainer() {
  return (
    <SceneExplainer
      title="ADX measures strength, never direction"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showUp = scene <= 1;
        const showDown = scene >= 2 && scene !== 4;
        const showAdxLine = scene === 1 || scene === 3 || scene === 5;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two separate lines, plus DI and minus DI, whose relative position — not ADX — is what actually shows the trend's direction">
              <path d="M 15 150 L 60 120 L 100 95 L 140 75" fill="none" stroke="var(--color-up)" strokeWidth={2} />
              <text x={140} y={68} textAnchor="end" style={{ fontSize: 7, fill: 'var(--color-up)', fontWeight: 700 }}>
                +DI
              </text>
              <path d="M 15 100 L 60 115 L 100 130 L 140 150" fill="none" stroke="var(--color-down)" strokeWidth={2} />
              <text x={140} y={162} textAnchor="end" style={{ fontSize: 7, fill: 'var(--color-down)', fontWeight: 700 }}>
                −DI
              </text>
              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink)' }}>
                +DI above −DI = uptrend
              </text>
              <text x={100} y={185} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                ADX only says how strongly
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="An uptrend and a downtrend, each producing the identical rising ADX line underneath">
            {showUp && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <path d="M 15 90 L 60 65 L 100 45 L 140 25" fill="none" stroke="var(--color-up)" strokeWidth={2} />
                <text x={140} y={18} textAnchor="end" style={{ fontSize: 7, fill: 'var(--color-up)' }}>
                  strong uptrend
                </text>
              </g>
            )}
            {showDown && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <path d="M 15 25 L 60 45 L 100 65 L 140 90" fill="none" stroke="var(--color-down)" strokeWidth={2} />
                <text x={140} y={100} textAnchor="end" style={{ fontSize: 7, fill: 'var(--color-down)' }}>
                  strong downtrend
                </text>
              </g>
            )}

            <line x1={5} y1={115} x2={195} y2={115} stroke="var(--color-line)" strokeWidth={1} />
            <text x={5} y={126} style={{ fontSize: 6.5, fill: 'var(--color-ink-faint)' }}>
              ADX
            </text>
            <path
              d="M 15 180 L 60 155 L 100 130 L 140 122"
              fill="none"
              stroke={showAdxLine ? 'var(--color-accent)' : 'var(--color-line)'}
              strokeWidth={2.5}
              style={{ transition: 'stroke 400ms ease-out' }}
            />
            {showAdxLine && (
              <text x={140} y={116} textAnchor="end" style={{ fontSize: 7, fill: 'var(--color-accent)', fontWeight: 600 }}>
                rising, either way
              </text>
            )}
          </svg>
        );
      }}
    />
  );
}
