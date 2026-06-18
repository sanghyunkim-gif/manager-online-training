'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id: idProp, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={[
            'w-full rounded-md border px-3 py-2 text-sm text-neutral-800',
            'bg-neutral-50 placeholder:text-neutral-400',
            'transition',
            error
              ? 'border-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1'
              : 'border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs font-medium text-accent-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
