'use client';

import {
  type TextareaHTMLAttributes,
  forwardRef,
} from 'react';
import { cn } from '@/lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--text-sm)] leading-[var(--leading-relaxed)] text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)]',
        'placeholder:text-[var(--color-neutral-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]',
        'disabled:cursor-not-allowed disabled:opacity-50 dark:text-[var(--color-neutral-900)]',
        className
      )}
      {...props}
    />
  );
});
