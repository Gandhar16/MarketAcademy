'use client';

/**
 * RolesExplainer — "who your order actually passes through", as a short
 * animated walkthrough. See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'you', caption: 'You place an order to buy shares.' },
  { id: 'broker', caption: 'Your broker forwards it to the exchange — you cannot reach the exchange directly.' },
  { id: 'exchange', caption: 'The exchange matches your order against another investor who wants to sell.' },
  { id: 'clearing', caption: 'The clearing corporation guarantees the trade goes through, even though you and that seller are strangers.' },
  { id: 'depository', caption: 'The depository updates the record — the shares now exist in your name there.' },
  { id: 'speed', caption: 'All five steps — broker, exchange, clearing, depository — usually happen in under a second. You only ever see "order placed" and then "filled".' },
  { id: 'safe', caption: 'If your broker ever fails, your shares stay exactly where they are. They were never the broker\'s to lose.' },
];

const ROLES = [
  { id: 'you', label: 'You' },
  { id: 'broker', label: 'Broker' },
  { id: 'exchange', label: 'Exchange' },
  { id: 'clearing', label: 'Clearing corp.' },
  { id: 'depository', label: 'Depository' },
];

const Y_START = 16;
const Y_STEP = 40;
const CX = 26;

export function RolesExplainer() {
  return (
    <SceneExplainer
      title="Who your order actually passes through"
      scenes={SCENES}
      renderVisual={(scene) => {
        // scenes 0-4 map one-to-one to the 5 roles reaching "active"; scene 5
        // (speed) and scene 6 (safe) both keep the full chain lit, with scene
        // 6 additionally dimming the broker specifically.
        const activeIndex = Math.min(scene, 4);
        const showSpeed = scene === 5;
        const brokerFailed = scene === 6;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A vertical diagram of an order passing through you, your broker, the exchange, the clearing corporation, and the depository">
            {ROLES.map((role, i) => {
              if (i === 0) return null;
              const y1 = Y_START + (i - 1) * Y_STEP;
              const y2 = Y_START + i * Y_STEP;
              const reached = activeIndex >= i;
              return (
                <line
                  key={`line-${role.id}`}
                  x1={CX}
                  y1={y1 + 12}
                  x2={CX}
                  y2={y2 - 12}
                  stroke={reached ? 'var(--color-accent)' : 'var(--color-line)'}
                  strokeWidth={2}
                  style={{ transition: 'stroke 400ms ease-out' }}
                />
              );
            })}

            {ROLES.map((role, i) => {
              const y = Y_START + i * Y_STEP;
              const isActive = i === activeIndex && !brokerFailed;
              const isBrokerDimmed = brokerFailed && role.id === 'broker';
              const isDepositoryFinal = brokerFailed && role.id === 'depository';
              const reached = activeIndex >= i;
              return (
                <g key={role.id} style={{ transition: 'opacity 400ms ease-out', opacity: isBrokerDimmed ? 0.25 : 1 }}>
                  <circle
                    cx={CX}
                    cy={y}
                    r={isActive || isDepositoryFinal ? 11 : 9}
                    fill={reached ? 'var(--color-accent)' : 'var(--color-surface-2)'}
                    stroke={isBrokerDimmed ? 'var(--color-down)' : 'var(--color-line)'}
                    strokeWidth={isBrokerDimmed ? 2 : 1.5}
                    style={{ transition: 'all 400ms ease-out' }}
                  />
                  <text
                    x={CX + 20}
                    y={y + 4}
                    style={{
                      fontSize: 11,
                      fill: isActive || isDepositoryFinal ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                      fontWeight: isActive || isDepositoryFinal ? 600 : 400,
                    }}
                  >
                    {role.label}
                    {isBrokerDimmed && ' ✕'}
                  </text>
                </g>
              );
            })}

            {showSpeed && (
              <g>
                <rect x={100} y={4} width={92} height={22} rx={6} fill="var(--color-surface-2)" stroke="var(--color-accent)" strokeWidth={1} />
                <text x={146} y={19} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-accent)' }}>
                  ⚡ under 1 second
                </text>
              </g>
            )}
          </svg>
        );
      }}
    />
  );
}
