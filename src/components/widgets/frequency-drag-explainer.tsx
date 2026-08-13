'use client';

/**
 * FrequencyDragExplainer — "frequency multiplies whatever is really there —
 * a real edge scales up, an overestimated one scales into a bill", as a
 * short animated walkthrough. Figures match the worked example in the same
 * lesson (₹288 net per trade at a genuine 0.4% edge, vs. roughly −₹12 net
 * per trade at an overestimated 0.1% edge, each at 20 and 200 trades a
 * year). See `scene-explainer.tsx` for the shared chrome and why this is a
 * diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Asha trades 20 times a year. Bharat trades 200. Same 0.4% edge before costs.' },
  { id: 'net', caption: 'After real charges, the net edge is ₹288 a trade — small, but real.' },
  { id: 'real-scale', caption: 'Scaled up: ₹5,760 a year at 20 trades. ₹57,600 a year at 200.' },
  { id: 'overestimate', caption: 'Now the edge is actually 0.1% — an ordinary amount of self-deception.' },
  { id: 'fake-scale', caption: 'Net per trade turns negative: about −₹12. At 200 trades, that is a −₹2,400 bill.' },
  { id: 'verify-first', caption: 'The instinct is always to trade more once something feels like it is working. Frequency does not create an edge — it only multiplies whichever one you actually have, real or imagined.' },
];

export function FrequencyDragExplainer() {
  return (
    <SceneExplainer
      title="Frequency multiplies whatever is really there"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showReal = scene >= 2 && scene < 3;
        const showFake = scene >= 4;
        const showVerify = scene === 5;
        const baseY = 170;

        // Real-edge bars (scenes 2): net ₹5,760 / ₹57,600 — display as scaled heights
        const realSmall = 24;
        const realBig = 130;

        // Fake-edge bars (scene 4): both negative, small vs. large loss
        const fakeSmall = 10;
        const fakeBig = 60;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Net trading result at 20 trades a year versus 200 trades a year, first with a genuine edge and then with an overestimated one">
            {scene < 2 && (
              <g>
                <text x={100} y={16} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  0.4% edge, real charges
                </text>
                <text x={56} y={90} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-ink)', fontWeight: 700 }}>Asha</text>
                <text x={56} y={104} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>20 trades</text>
                <text x={144} y={90} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-ink)', fontWeight: 700 }}>Bharat</text>
                <text x={144} y={104} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>200 trades</text>
                {scene === 1 && (
                  <text x={100} y={140} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-accent)', fontWeight: 700 }}>₹288 net, per trade, each</text>
                )}
              </g>
            )}

            {showReal && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={baseY} x2={190} y2={baseY} stroke="var(--color-line)" strokeWidth={1} />
                <rect x={40} y={baseY - realSmall} width={40} height={realSmall} rx={3} fill="var(--color-up)" fillOpacity={0.65} style={{ transition: 'all 500ms ease-out' }} />
                <text x={60} y={baseY - realSmall - 6} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹5,760</text>
                <text x={60} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>20 trades</text>

                <rect x={120} y={baseY - realBig} width={40} height={realBig} rx={3} fill="var(--color-up)" fillOpacity={0.85} style={{ transition: 'all 500ms ease-out' }} />
                <text x={140} y={baseY - realBig - 6} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>₹57,600</text>
                <text x={140} y={baseY + 14} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>200 trades</text>
              </g>
            )}

            {scene === 3 && (
              <text x={100} y={100} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-down)', fontWeight: 700 }}>
                edge is really 0.1%
              </text>
            )}

            {showFake && (
              <g style={{ transition: 'opacity 400ms ease-out' }}>
                <line x1={20} y1={baseY - 70} x2={190} y2={baseY - 70} stroke="var(--color-line)" strokeWidth={1} />
                <rect x={40} y={baseY - 70} width={40} height={fakeSmall} rx={3} fill="var(--color-down)" fillOpacity={0.65} style={{ transition: 'all 500ms ease-out' }} />
                <text x={60} y={baseY - 70 + fakeSmall + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>−₹240</text>
                <text x={60} y={baseY - 70 - 6} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>20 trades</text>

                <rect x={120} y={baseY - 70} width={40} height={fakeBig} rx={3} fill="var(--color-down)" fillOpacity={0.85} style={{ transition: 'all 500ms ease-out' }} />
                <text x={140} y={baseY - 70 + fakeBig + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 700 }}>−₹2,400</text>
                <text x={140} y={baseY - 70 - 6} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-ink-faint)' }}>200 trades</text>
              </g>
            )}

            {showVerify && (
              <g>
                <rect x={30} y={82} width={140} height={30} rx={6} fill="var(--color-surface)" fillOpacity={0.92} stroke="var(--color-accent)" strokeWidth={1.5} />
                <text x={100} y={101} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-accent)' }}>
                  frequency is a multiplier, not a source
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
