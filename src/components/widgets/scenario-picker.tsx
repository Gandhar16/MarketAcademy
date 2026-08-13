'use client';

/**
 * ScenarioPicker — the accessible radiogroup-of-buttons used to switch
 * between a widget's illustrative scenarios. Pulled out once two widgets
 * (OwnershipToPriceMap, MoneySecuritiesFlow) had copy-pasted the identical
 * role="radio" + roving-tabindex + arrow-key markup.
 */
import { useRef } from 'react';

export interface ScenarioOption {
  id: string;
  label: string;
}

interface ScenarioPickerProps {
  options: ScenarioOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
  className: string;
  optionClassName: string;
}

export function ScenarioPicker({ options, selectedId, onSelect, ariaLabel, className, optionClassName }: ScenarioPickerProps) {
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const moveTo = (index: number) => {
    const wrapped = (index + options.length) % options.length;
    onSelect(options[wrapped].id);
    radioRefs.current[wrapped]?.focus();
  };

  const onKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      moveTo(index + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      moveTo(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      moveTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      moveTo(options.length - 1);
    }
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={className}>
      {options.map((opt, i) => {
        const isSelected = selectedId === opt.id;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              radioRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (selectedId === null && i === 0) ? 0 : -1}
            onKeyDown={onKeyDown(i)}
            onClick={() => onSelect(opt.id)}
            className={optionClassName}
            style={{
              borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-line)',
              background: isSelected ? 'var(--color-surface-2)' : 'transparent',
              color: isSelected ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
