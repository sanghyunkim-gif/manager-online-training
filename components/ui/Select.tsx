'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, options, error, placeholder, id: idProp, className = '', ...props },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={[
              'w-full appearance-none rounded-md border px-3 py-2 pr-9 text-sm text-neutral-800',
              'bg-neutral-50',
              'transition',
              error
                ? 'border-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1'
                : 'border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400',
              className,
            ].join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
            size={16}
            aria-hidden="true"
          />
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-accent-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
