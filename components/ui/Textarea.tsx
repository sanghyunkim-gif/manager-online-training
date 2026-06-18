'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { Input as DsInput } from 'plab-design-system';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, rows, required, 'aria-label': ariaLabel, ...rest }, ref) => {
    return (
      <DsInput
        as="textarea"
        ref={ref as React.RefObject<HTMLInputElement | HTMLTextAreaElement>}
        label={label}
        error={!!error}
        helperText={error}
        // required는 라벨 별표(DS Input 직속)와 textarea 속성 양쪽에 전달
        required={required}
        // DS <label>은 htmlFor로 연결되지 않으므로 aria-label로 보강(명시값 우선).
        textareaProps={{ rows, required, 'aria-label': ariaLabel ?? label, ...rest }}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
