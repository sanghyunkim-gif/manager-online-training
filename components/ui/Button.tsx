'use client';

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 disabled:bg-primary-300',
  secondary:
    'bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 focus-visible:ring-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-400',
  danger:
    'bg-accent-500 text-white hover:bg-accent-600 focus-visible:ring-accent-500 disabled:bg-accent-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leftIcon,
      isLoading = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          'shadow-sm hover:shadow-md',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {isLoading ? (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span aria-hidden="true">{leftIcon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
