'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, rows = 4, id: idProp, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={[
            'w-full resize-y rounded-md border px-3 py-2 text-sm text-neutral-800',
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
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
