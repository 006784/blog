'use client';

import {
  type ButtonHTMLAttributes,
  forwardRef,
} from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-[var(--color-primary-500)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:bg-[var(--color-primary-600)]',
  secondary:
    'border border-[color:var(--border-default)] bg-[var(--surface-raised)] text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-[var(--surface-overlay)] dark:text-[var(--color-neutral-900)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-neutral-700)] hover:bg-[var(--surface-overlay)] hover:text-[var(--color-neutral-900)] dark:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-900)]',
  danger:
    'border border-transparent bg-[var(--color-error)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:opacity-95',
  link:
    'h-auto border-none bg-transparent px-0 text-[var(--color-primary-600)] shadow-none hover:text-[var(--color-primary-700)] dark:text-[var(--color-primary-700)] dark:hover:text-[var(--color-primary-500)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] font-medium tracking-[0.01em] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]',
          'disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60',
          variantClasses[variant],
          variant === 'link' ? undefined : sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
