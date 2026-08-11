'use client';

/**
 * Indicator toolbar and live readout.
 *
 * Two jobs. It toggles indicators on the chart, and it shows the CURRENT value
 * of each active one — which is the part that turns a pretty line into
 * something a learner can reason with. "RSI 68" next to a chart is information;
 * an unlabelled squiggle is decoration.
 *
 * The warm-up notice matters more than it looks. A learner who switches on
 * SMA 50 twenty bars into a replay sees nothing and concludes the app is
 * broken. Saying "needs 50 bars, has 20" is the difference between a bug report
 * and a lesson about what a moving average actually is.
 */
import { INDICATORS, latest, type ComputedIndicators, type IndicatorId } from '@/lib/analysis/indicators';

export function ChartToolbar({
  active,
  onToggle,
  computed,
  barCount,
}: {
  active: IndicatorId[];
  onToggle: (id: IndicatorId) => void;
  computed: ComputedIndicators;
  barCount: number;
}) {
  const overlays = INDICATORS.filter((i) => i.placement === 'overlay');
  const panes = INDICATORS.filter((i) => i.placement === 'pane');

  const readout = (id: IndicatorId): string | null => {
    switch (id) {
      case 'sma20':
        return fmt(latest(computed.sma20));
      case 'sma50':
        return fmt(latest(computed.sma50));
      case 'ema9':
        return fmt(latest(computed.ema9));
      case 'ema21':
        return fmt(latest(computed.ema21));
      case 'vwap':
        return fmt(latest(computed.vwap));
      case 'rsi':
        return fmt(latest(computed.rsi), 1);
      case 'atr':
        return fmt(latest(computed.atr));
      case 'macd':
        return fmt(latest(computed.macd.macd));
      case 'bollinger': {
        const u = latest(computed.bollinger.upper);
        const l = latest(computed.bollinger.lower);
        return u == null || l == null ? null : `${fmt(l)}–${fmt(u)}`;
      }
      default:
        return null;
    }
  };

  const warmingActive = INDICATORS.filter((i) => active.includes(i.id) && barCount < i.warmup);

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <IndicatorGroup
          label="On the price"
          items={overlays}
          active={active}
          onToggle={onToggle}
          barCount={barCount}
          readout={readout}
        />
        <IndicatorGroup
          label="Below the price"
          items={panes}
          active={active}
          onToggle={onToggle}
          barCount={barCount}
          readout={readout}
        />
      </div>

      {warmingActive.length > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
          {warmingActive.map((i) => i.label).join(', ')}{' '}
          {warmingActive.length === 1 ? 'has' : 'have'} not drawn yet — an average needs its full window before it
          exists. {warmingActive[0].label} wants {warmingActive[0].warmup} bars and there are {barCount}. This is not a
          bug; it is what &ldquo;20-period&rdquo; means.
        </p>
      )}

      {active.length > 0 && (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
          Every indicator here is computed only from the bars you can see. None of them can look ahead — that is
          enforced in the engine and tested, not merely intended.
        </p>
      )}
    </div>
  );
}

/**
 * Declared at module scope, not inside the toolbar's render. A component
 * created during render is a new component type on every pass, so React
 * remounts it and any state inside it is lost.
 */
function IndicatorGroup({
  label,
  items,
  active,
  onToggle,
  barCount,
  readout,
}: {
  label: string;
  items: typeof INDICATORS;
  active: IndicatorId[];
  onToggle: (id: IndicatorId) => void;
  barCount: number;
  readout: (id: IndicatorId) => string | null;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((ind) => {
          const on = active.includes(ind.id);
          const warming = barCount < ind.warmup;
          const value = on ? readout(ind.id) : null;
          return (
            <button
              key={ind.id}
              onClick={() => onToggle(ind.id)}
              title={warming ? `${ind.hint} — needs ${ind.warmup} bars, has ${barCount}` : ind.hint}
              aria-pressed={on}
              className="num rounded-md px-2.5 py-1 text-[11px] transition-colors"
              style={{
                background: on ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color: on ? 'var(--color-ground)' : warming ? 'var(--color-ink-faint)' : 'var(--color-ink-muted)',
                opacity: warming && !on ? 0.55 : 1,
              }}
            >
              {ind.label}
              {value && <span className="ml-1.5 opacity-80">{value}</span>}
              {on && warming && <span className="ml-1.5">·{ind.warmup}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fmt(v: number | null, dp = 2): string | null {
  return v == null ? null : v.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
