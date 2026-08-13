/**
 * A small circular progress ring — "3/8 done" as a shape, not just a
 * fraction, so a course card reads at a glance from across the grid.
 * Plain SVG, no chart library; the percentage text is real text underneath
 * it, never baked into the graphic, so it stays readable and accessible.
 */
const SIZE = 56;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CourseRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-hidden>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth={STROKE} />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={clamped >= 100 ? 'var(--color-up)' : 'var(--color-accent)'}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: 'stroke-dashoffset 500ms ease-out' }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="num"
        style={{ fontSize: 13, fill: 'var(--color-ink)' }}
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
