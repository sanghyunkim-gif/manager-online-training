'use client';

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import {
  Button as DsButton,
} from 'plab-design-system';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}

const variantMap: Record<ButtonVariant, 'solid' | 'soft' | 'danger'> = {
  primary: 'solid',
  secondary: 'soft',
  danger: 'danger',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leftIcon,
      isLoading = false,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <DsButton
        ref={ref}
        variant={variantMap[variant]}
        size={size}
        disabled={isDisabled}
        className={className}
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
      </DsButton>
    );
  }
);

Button.displayName = 'Button';
