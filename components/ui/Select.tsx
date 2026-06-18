'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { Select as DsSelect } from 'plab-design-system';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, 'aria-label': ariaLabel, ...props }, ref) => {
    return (
      <DsSelect
        ref={ref}
        // DS Select는 variant="labeled"일 때만 라벨을 렌더하므로,
        // label이 있으면 labeled로 전환해 라벨이 표시되도록 한다.
        variant={label ? 'labeled' : 'default'}
        label={label}
        error={!!error}
        helperText={error}
        placeholder={placeholder}
        // DS Select의 <label>은 htmlFor로 연결되지 않으므로 aria-label로 보강(명시값 우선).
        aria-label={ariaLabel ?? label}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </DsSelect>
    );
  }
);

Select.displayName = 'Select';
