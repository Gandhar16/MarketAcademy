'use client';

/**
 * VolumeMythExplainer — "'more buyers than sellers' cannot describe any
 * real trade — every trade has exactly one of each", as a short animated
 * walkthrough. See `scene-explainer.tsx` for the shared chrome and why this
 * is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'claim', caption: 'A commentator says: "the share rose because there were more buyers than sellers."' },
  { id: 'impossible', caption: 'That cannot be true. Every trade requires exactly one buyer and one seller — always, on every single trade.' },
  { id: 'same-bar', caption: 'A day of heavy buying and a day of heavy selling produce the exact same volume bar.' },
  { id: 'urgency', caption: 'What actually differs is urgency — whether buyers paid up to get filled, or sellers accepted less to get out.' },
  { id: 'breakout', caption: 'This is why traders watch volume on a breakout — not because it proves "buyers won", but because a bigger, more urgent crowd showed up willing to trade at that price at all.' },
  { id: 'lesson', caption: 'Volume counts participation. It has no direction in it at all.' },
];

function PersonIcon({ x, y, colour }: { x: number; y: number; colour: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill={colour} />
      <rect x={x - 6} y={y + 6} width={12} height={14} rx={4} fill={colour} />
    </g>
  );
}

export function VolumeMythExplainer() {
  return (
    <SceneExplainer
      title="Why “more buyers than sellers” is impossible"
      scenes={SCENES}
      renderVisual={(scene) => {
        if (scene === 0) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="An unbalanced group of buyer and seller icons, with more buyers than sellers, crossed out">
              {[40, 65, 90, 115].map((x) => (
                <PersonIcon key={`b${x}`} x={x} y={70} colour="var(--color-up)" />
              ))}
              <PersonIcon x={70} y={130} colour="var(--color-down)" />
              <line x1={20} y1={100} x2={180} y2={100} stroke="var(--color-down)" strokeWidth={2} />
              <text x={100} y={165} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-down)', fontWeight: 700 }}>
                this cannot happen
              </text>
            </svg>
          );
        }
        if (scene === 1) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Four pairs of buyer and seller icons, always equal in number">
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <PersonIcon x={40 + i * 40} y={70} colour="var(--color-up)" />
                  <PersonIcon x={40 + i * 40} y={130} colour="var(--color-down)" />
                  <line x1={40 + i * 40} y1={82} x2={40 + i * 40} y2={118} stroke="var(--color-line)" strokeWidth={1} />
                </g>
              ))}
              <text x={100} y={168} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
                4 trades, 4 of each — always equal
              </text>
            </svg>
          );
        }
        if (scene === 2) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two identical volume bars, one labelled a heavy buying day and one a heavy selling day">
              <rect x={30} y={40} width={50} height={110} rx={4} fill="var(--color-up)" fillOpacity={0.7} />
              <text x={55} y={164} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                heavy buying
              </text>
              <rect x={120} y={40} width={50} height={110} rx={4} fill="var(--color-down)" fillOpacity={0.7} />
              <text x={145} y={164} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                heavy selling
              </text>
              <text x={100} y={26} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                identical volume bar
              </text>
            </svg>
          );
        }
        if (scene === 4) {
          const bars = [30, 34, 28, 40, 32, 90];
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A row of ordinary volume bars followed by one much taller bar on a breakout day, showing a bigger crowd showed up to trade — not which side of the trade they were on">
              {bars.map((h, i) => (
                <rect
                  key={i}
                  x={20 + i * 26}
                  y={160 - h}
                  width={18}
                  height={h}
                  rx={2}
                  fill={i === bars.length - 1 ? 'var(--color-accent)' : 'var(--color-ink-faint)'}
                  fillOpacity={i === bars.length - 1 ? 1 : 0.5}
                />
              ))}
              <text x={100} y={176} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                ordinary days
              </text>
              <text x={177} y={64} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-accent)', fontWeight: 700 }}>
                breakout
              </text>
              <text x={100} y={20} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                a bigger, more urgent crowd
              </text>
            </svg>
          );
        }
        // scene 3: urgency framing
        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A buyer lifting the ask and a seller hitting the bid, the real distinction volume cannot show">
            <text x={100} y={30} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
              same count, different urgency
            </text>
            <PersonIcon x={60} y={80} colour="var(--color-up)" />
            <text x={60} y={112} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-up)' }}>
              lifts the ask
            </text>
            <PersonIcon x={140} y={80} colour="var(--color-down)" />
            <text x={140} y={112} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--color-down)' }}>
              hits the bid
            </text>
            <text x={100} y={150} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
              volume: no direction
            </text>
          </svg>
        );
      }}
    />
  );
}
