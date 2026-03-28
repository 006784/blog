'use client';

import {
  type InputHTMLAttributes,
  forwardRef,
} from 'react';
import { cn } from '@/lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[linear-gradient(180deg,var(--surface-card-start),var(--surface-raised))] px-4 py-3 text-[var(--text-sm)] text-[var(--color-neutral-900)] shadow-[inset_0_1px_0_var(--surface-card-highlight),0_14px_24px_-24px_var(--surface-card-shadow)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)]',
        'placeholder:text-[var(--color-neutral-500)] focus-visible:border-[color:var(--color-primary-500)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_var(--surface-accent-ring),inset_0_1px_0_var(--surface-card-highlight),0_18px_30px_-24px_var(--surface-card-shadow-strong)]',
        'disabled:cursor-not-allowed disabled:opacity-50 dark:text-[var(--color-neutral-900)]',
        className
      )}
      {...props}
    />
  );
});
