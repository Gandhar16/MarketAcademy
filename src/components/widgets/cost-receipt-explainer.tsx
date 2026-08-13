'use client';

/**
 * CostReceiptExplainer — "zero brokerage is not zero cost", as a short
 * animated walkthrough. Figures match the worked example and predict block
 * in the same lesson (₹1,00,000 of delivery, held a week, sold flat). See
 * `scene-explainer.tsx` for the shared chrome and why this is a diagram,
 * not a real video.
 */
import { SceneExplainer, type Scene } from './scene-explainer';

const SCENES: Scene[] = [
  { id: 'start', caption: 'You buy ₹1,00,000 of Reliance at a zero-brokerage broker, and sell it a week later at exactly the same price.' },
  { id: 'brokerage', caption: 'Brokerage really is zero — that part is true.' },
  { id: 'stt', caption: 'But STT takes 0.1% on the buy AND 0.1% on the sell — about ₹200, the single biggest cost here.' },
  { id: 'other', caption: 'Stamp duty, exchange charges, the SEBI turnover fee, and 18% GST on top of those add a little more.' },
  { id: 'dp', caption: 'A flat ₹15.34 DP charge applies when the shares leave your demat account on the sell.' },
  { id: 'total', caption: 'Add it up: you get back about ₹99,760 — roughly ₹236 gone, on a trade that never moved at all.' },
  { id: 'scale', caption: 'Do this ten times in a month — routine for an active trader — and the same ₹236 becomes about ₹2,360. Nobody sends a bill for it; it just quietly reduces what you keep.' },
];

interface Row {
  label: string;
  amount: number; // negative = a deduction, 0 = shown but zero
}

// cumulative rows revealed by scene index
const ROWS_BY_SCENE: Row[][] = [
  [],
  [{ label: 'Brokerage', amount: 0 }],
  [
    { label: 'Brokerage', amount: 0 },
    { label: 'STT (buy + sell)', amount: -200 },
  ],
  [
    { label: 'Brokerage', amount: 0 },
    { label: 'STT (buy + sell)', amount: -200 },
    { label: 'Stamp + exchange + SEBI + GST', amount: -21 },
  ],
  [
    { label: 'Brokerage', amount: 0 },
    { label: 'STT (buy + sell)', amount: -200 },
    { label: 'Stamp + exchange + SEBI + GST', amount: -21 },
    { label: 'DP charge', amount: -15 },
  ],
  [
    { label: 'Brokerage', amount: 0 },
    { label: 'STT (buy + sell)', amount: -200 },
    { label: 'Stamp + exchange + SEBI + GST', amount: -21 },
    { label: 'DP charge', amount: -15 },
  ],
  [
    { label: 'Brokerage', amount: 0 },
    { label: 'STT (buy + sell)', amount: -200 },
    { label: 'Stamp + exchange + SEBI + GST', amount: -21 },
    { label: 'DP charge', amount: -15 },
  ],
];

const ROW_Y_START = 46;
const ROW_H = 22;

export function CostReceiptExplainer() {
  return (
    <SceneExplainer
      title="Zero brokerage is not zero cost"
      scenes={SCENES}
      intervalMs={3000}
      renderVisual={(scene) => {
        const rows = ROWS_BY_SCENE[scene];
        const runningTotal = 100000 + rows.reduce((s, r) => s + r.amount, 0);
        const showTotal = scene >= 5;
        const showScale = scene === 6;

        return (
          <svg
            viewBox="0 0 200 200"
            className="h-40 w-40"
            role="img"
            aria-label={showScale ? 'The same charges scaled up to ten trades in a month, totalling about ₹2,360' : 'A receipt of charges being subtracted from a ₹1,00,000 trade'}
          >
            <text x={6} y={20} style={{ fontSize: 11, fill: 'var(--color-ink)', fontWeight: 700 }}>
              ₹1,00,000
            </text>
            <line x1={6} y1={28} x2={194} y2={28} stroke="var(--color-line)" strokeWidth={1} />

            {rows.map((row, i) => (
              <g key={row.label} style={{ transition: 'opacity 400ms ease-out' }}>
                <text x={6} y={ROW_Y_START + i * ROW_H} style={{ fontSize: 8, fill: 'var(--color-ink-muted)' }}>
                  {row.label}
                </text>
                <text
                  x={194}
                  y={ROW_Y_START + i * ROW_H}
                  textAnchor="end"
                  style={{ fontSize: 8, fill: row.amount === 0 ? 'var(--color-ink-faint)' : 'var(--color-down)', fontWeight: 600 }}
                >
                  {row.amount === 0 ? '₹0' : `−₹${Math.abs(row.amount)}`}
                </text>
              </g>
            ))}

            {showScale && (
              <g>
                <rect x={6} y={126} width={188} height={40} rx={6} fill="var(--color-down)" fillOpacity={0.08} stroke="var(--color-down)" strokeWidth={1} />
                <text x={100} y={144} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--color-down)' }}>
                  × 10 trades this month
                </text>
                <text x={100} y={158} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-down)' }}>
                  ≈ −₹2,360
                </text>
              </g>
            )}

            <line x1={6} y1={182} x2={194} y2={182} stroke="var(--color-line)" strokeWidth={1} />
            <text x={6} y={196} style={{ fontSize: 9, fill: 'var(--color-ink)', fontWeight: 700 }}>
              You get back
            </text>
            <text
              x={194}
              y={196}
              textAnchor="end"
              style={{ fontSize: 9, fontWeight: 700, fill: showTotal ? 'var(--color-down)' : 'var(--color-ink)' }}
            >
              ₹{runningTotal.toLocaleString('en-IN')}
            </text>
          </svg>
        );
      }}
    />
  );
}
