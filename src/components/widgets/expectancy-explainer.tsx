'use client';

/**
 * ExpectancyExplainer — "win rate alone tells you nothing", as a short
 * animated walkthrough. Figures match the opening predict in the same
 * lesson (Asha vs. Bharat). See `scene-explainer.tsx` for the shared chrome
 * and why this is a diagram, not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'asha', caption: 'Asha wins 7 of 10 trades, ₹1,000 each. She loses 3, ₹4,000 each.' },
  { id: 'asha-net', caption: 'Total: +₹7,000 in wins, −₹12,000 in losses. Net: down ₹5,000.' },
  { id: 'bharat', caption: 'Bharat wins only 3 of 10 — but ₹5,000 each. He loses 7, ₹1,000 each.' },
  { id: 'bharat-net', caption: 'Total: +₹15,000 in wins, −₹7,000 in losses. Net: up ₹8,000.' },
  { id: 'formula', caption: "Per trade: (win rate × average win) − (loss rate × average loss). Asha: (0.7 × ₹1,000) − (0.3 × ₹4,000) = −₹500 a trade. Bharat: (0.3 × ₹5,000) − (0.7 × ₹1,000) = +₹800 a trade." },
  { id: 'lesson', caption: 'Asha is right more than twice as often as Bharat — and she is the one losing money.' },
];

function Column({
  x,
  name,
  winRate,
  wins,
  winAmount,
  losses,
  lossAmount,
  showTotals,
  net,
}: {
  x: number;
  name: string;
  winRate: string;
  wins: number;
  winAmount: number;
  losses: number;
  lossAmount: number;
  showTotals: boolean;
  net: number | null;
}) {
  const winsTotal = wins * winAmount;
  const lossesTotal = losses * lossAmount;
  const winH = Math.min(60, winsTotal / 300);
  const lossH = Math.min(60, lossesTotal / 300);

  return (
    <g>
      <text x={x} y={14} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 600 }}>
        {name} ({winRate})
      </text>
      <rect x={x - 24} y={80 - winH} width={20} height={winH} rx={3} fill="var(--color-up)" style={{ transition: 'height 500ms ease-out, y 500ms ease-out' }} />
      <rect x={x + 4} y={80 - lossH} width={20} height={lossH} rx={3} fill="var(--color-down)" style={{ transition: 'height 500ms ease-out, y 500ms ease-out' }} />
      <line x1={x - 30} y1={80} x2={x + 30} y2={80} stroke="var(--color-line)" strokeWidth={1} />
      <text x={x - 14} y={94} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-up)' }}>
        {wins}×₹{winAmount}
      </text>
      <text x={x + 14} y={94} textAnchor="middle" style={{ fontSize: 6.5, fill: 'var(--color-down)' }}>
        {losses}×₹{lossAmount}
      </text>
      {showTotals && net != null && (
        <text x={x} y={112} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: net >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
          {net >= 0 ? '+' : ''}₹{net.toLocaleString('en-IN')}
        </text>
      )}
    </g>
  );
}

export function ExpectancyExplainer() {
  return (
    <SceneExplainer
      title="Win rate alone tells you nothing"
      scenes={SCENES}
      renderVisual={(scene) => {
        const showAsha = scene >= 0;
        const showAshaNet = scene >= 1;
        const showBharat = scene >= 2;
        const showBharatNet = scene >= 3;

        if (scene === 4) {
          return (
            <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="The expectancy formula computed for both traders: Asha loses ₹500 per trade on average, Bharat gains ₹800 per trade on average">
              <text x={100} y={16} textAnchor="middle" style={{ fontSize: 7.5, fill: 'var(--color-ink-faint)' }}>
                (win% × avg win) − (loss% × avg loss)
              </text>

              <g>
                <text x={100} y={44} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                  Asha
                </text>
                <text x={100} y={58} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  (0.7×1,000) − (0.3×4,000)
                </text>
                <text x={100} y={78} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: 'var(--color-down)' }}>
                  −₹500 / trade
                </text>
              </g>

              <line x1={20} y1={98} x2={180} y2={98} stroke="var(--color-line)" strokeWidth={1} />

              <g>
                <text x={100} y={122} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink)', fontWeight: 600 }}>
                  Bharat
                </text>
                <text x={100} y={136} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-ink-faint)' }}>
                  (0.3×5,000) − (0.7×1,000)
                </text>
                <text x={100} y={156} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: 'var(--color-up)' }}>
                  +₹800 / trade
                </text>
              </g>

              <text x={100} y={184} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700, fill: 'var(--color-ink-muted)' }}>
                This is what actually decides the outcome
              </text>
            </svg>
          );
        }

        return (
          <svg viewBox="0 0 200 200" className="h-40 w-40" role="img" aria-label="Two traders' win and loss totals compared, showing the one with the lower win rate ends up ahead">
            <g transform="translate(0, 45)">
              {showAsha && (
                <g transform="translate(50, 0)">
                  <Column x={0} name="Asha" winRate="70%" wins={7} winAmount={1000} losses={3} lossAmount={4000} showTotals={showAshaNet} net={showAshaNet ? -5000 : null} />
                </g>
              )}
              {showBharat && (
                <g transform="translate(150, 0)" style={{ transition: 'opacity 400ms ease-out' }}>
                  <Column x={0} name="Bharat" winRate="30%" wins={3} winAmount={5000} losses={7} lossAmount={1000} showTotals={showBharatNet} net={showBharatNet ? 8000 : null} />
                </g>
              )}
            </g>
          </svg>
        );
      }}
    />
  );
}
