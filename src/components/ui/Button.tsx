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
    'border border-white/40 bg-[linear-gradient(135deg,var(--color-primary-500),var(--color-primary-600))] text-[var(--color-primary-foreground)] shadow-[0_18px_34px_-20px_var(--surface-button-shadow)] hover:-translate-y-0.5 hover:brightness-[1.02] hover:shadow-[0_24px_40px_-20px_var(--surface-button-shadow)]',
  secondary:
    'border border-[color:var(--border-default)] bg-[linear-gradient(180deg,var(--surface-card-start),var(--surface-raised))] text-[var(--color-neutral-900)] shadow-[0_16px_26px_-24px_var(--surface-card-shadow-strong)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:bg-[linear-gradient(180deg,var(--surface-base),var(--surface-overlay))] dark:text-[var(--color-neutral-900)]',
  ghost:
    'border border-transparent bg-white/20 text-[var(--color-neutral-700)] hover:bg-[var(--surface-panel)] hover:text-[var(--color-neutral-900)] hover:shadow-[0_14px_28px_-24px_var(--surface-card-shadow-strong)] dark:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-900)]',
  danger:
    'border border-white/30 bg-[linear-gradient(135deg,var(--color-error),color-mix(in_srgb,var(--color-error)_78%,#b91c1c))] text-white shadow-[0_16px_30px_-20px_rgba(234,126,126,0.45)] hover:-translate-y-0.5 hover:opacity-95',
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
    const isLink = variant === 'link';

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium tracking-[0.01em] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]',
          'disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60',
          isLink
            ? null
            : 'relative isolate overflow-hidden rounded-[var(--radius-lg)] before:pointer-events-none before:absolute before:inset-[1px] before:rounded-[calc(var(--radius-lg)-1px)] before:bg-[linear-gradient(180deg,var(--surface-card-highlight),transparent_62%)] before:content-[\'\']',
          variantClasses[variant],
          isLink ? undefined : sizeClasses[size],
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
