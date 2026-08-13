'use client';

/**
 * MoneyFlowExplainer — "where does your money actually go", as a short
 * animated walkthrough. See `scene-explainer.tsx` for the shared chrome and
 * why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'setup', caption: 'Mango Motors, a fictional company, sells 100 brand-new shares directly to the public at ₹100 each — an IPO.' },
  { id: 'primary', caption: 'You buy 10 of those new shares. Your ₹1,000 goes straight to Mango Motors — this is the primary market.' },
  { id: 'later', caption: 'A year later, you decide to sell those same 10 shares to Priya, another investor, on the exchange.' },
  { id: 'secondary', caption: "Priya's money goes to you, not to Mango Motors. The company is not a party to this trade at all." },
  { id: 'repeats', caption: 'Next month Priya sells those same 10 shares to someone else. Same pattern: their money goes to Priya, not to Mango Motors — again.' },
  { id: 'summary', caption: 'Same shares, same company — but Mango Motors was only ever paid once, at step one. Every trade after that just passes the shares, and the money, between investors.' },
];

const COMPANY = { x: 100, y: 34 };
const YOU = { x: 40, y: 160 };
const PRIYA = { x: 160, y: 160 };

function Node({ x, y, label, dim }: { x: number; y: number; label: string; dim?: boolean }) {
  return (
    <g style={{ transition: 'opacity 400ms ease-out', opacity: dim ? 0.35 : 1 }}>
      <circle cx={x} cy={y} r={22} fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth={1.5} />
      <text x={x} y={y + 4} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-ink)' }}>
        {label}
      </text>
    </g>
  );
}

/** An arrow from one node's edge toward another, offset so two opposite arrows don't overlap. */
function Arrow({
  from,
  to,
  colour,
  offset,
  visible,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  colour: string;
  offset: number;
  visible: boolean;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // perpendicular offset so the money arrow and the shares arrow, going
  // opposite ways between the same two nodes, render as two parallel lines
  const px = -uy * offset;
  const py = ux * offset;
  const start = { x: from.x + ux * 24 + px, y: from.y + uy * 24 + py };
  const end = { x: to.x - ux * 26 + px, y: to.y - uy * 26 + py };

  const markerId = colour === 'var(--color-down)' ? 'arrowhead-down' : 'arrowhead-up';

  return (
    <g style={{ transition: 'opacity 300ms ease-out', opacity: visible ? 1 : 0 }}>
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={colour} strokeWidth={2.5} markerEnd={`url(#${markerId})`} />
    </g>
  );
}

export function MoneyFlowExplainer() {
  return (
    <SceneExplainer
      title="Where the money goes — in one picture"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showPrimary = scene >= 1;
        const showPriya = scene >= 2;
        const showSecondary = scene >= 3;
        const companyDim = scene >= 3;
        const showRepeats = scene === 4;

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="A diagram of money and shares moving between Mango Motors, you, and Priya">
            <defs>
              <marker id="arrowhead-down" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--color-down)" />
              </marker>
              <marker id="arrowhead-up" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--color-up)" />
              </marker>
            </defs>

            <Node x={COMPANY.x} y={COMPANY.y} label="Mango Motors" dim={companyDim} />
            <Node x={YOU.x} y={YOU.y} label="You" />
            {showPriya && <Node x={PRIYA.x} y={PRIYA.y} label="Priya" />}

            {/* primary market: money You -> Company, shares Company -> You */}
            <Arrow from={YOU} to={COMPANY} colour="var(--color-down)" offset={4} visible={showPrimary && !showSecondary} />
            <Arrow from={COMPANY} to={YOU} colour="var(--color-up)" offset={-4} visible={showPrimary && !showSecondary} />

            {/* secondary market: money Priya -> You, shares You -> Priya */}
            {showPriya && (
              <>
                <Arrow from={PRIYA} to={YOU} colour="var(--color-down)" offset={4} visible={showSecondary} />
                <Arrow from={YOU} to={PRIYA} colour="var(--color-up)" offset={-4} visible={showSecondary} />
              </>
            )}

            {/* A small "this repeats" marker, distinct from the primary/
                secondary arrows above — those two already show ONE trade;
                this scene's point is that the same secondary pattern can
                happen indefinitely, without a third node crowding a tight
                200x200 canvas. */}
            <g style={{ transition: 'opacity 400ms ease-out', opacity: showRepeats ? 1 : 0 }}>
              <text x={100} y={130} textAnchor="middle" style={{ fontSize: 16, fill: 'var(--color-ink-faint)' }}>
                ↻
              </text>
              <text x={100} y={144} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                and again, and again
              </text>
            </g>
          </svg>
        );
      }}
    />
  );
}
