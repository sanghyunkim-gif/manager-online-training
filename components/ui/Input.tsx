'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input as DsInput } from 'plab-design-system';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  /** HTML size 속성 (DS Input의 size와 구분). 필요 시 스타일로 대체하세요. */
  htmlSize?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      'aria-invalid': ariaInvalid,
      'aria-label': ariaLabel,
      htmlSize: _htmlSize,
      ...props
    },
    ref
  ) => {
    // DS Input의 <label>은 htmlFor로 input과 연결되지 않으므로,
    // 스크린리더 접근성을 위해 label을 aria-label로 보강한다(명시값 우선).
    return (
      <DsInput
        ref={ref}
        label={label}
        error={!!error}
        helperText={error ?? helperText}
        aria-invalid={error ? true : ariaInvalid}
        aria-label={ariaLabel ?? label}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
