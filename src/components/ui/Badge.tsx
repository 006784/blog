'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'solid' | 'outline' | 'soft';
type BadgeTone = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, Record<BadgeVariant, string>> = {
  default: {
    solid: 'border-transparent bg-[var(--color-primary-500)] text-[var(--color-primary-foreground)]',
    outline: 'border-[color:var(--border-default)] bg-transparent text-[var(--color-neutral-700)]',
    soft: 'border-transparent bg-[var(--surface-overlay)] text-[var(--color-neutral-700)]',
  },
  success: {
    solid: 'border-transparent bg-[var(--color-success)] text-white',
    outline: 'border-emerald-500/30 bg-transparent text-emerald-600 dark:text-emerald-300',
    soft: 'border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  },
  warning: {
    solid: 'border-transparent bg-[var(--color-warning)] text-white',
    outline: 'border-amber-500/30 bg-transparent text-amber-600 dark:text-amber-300',
    soft: 'border-transparent bg-amber-500/12 text-amber-600 dark:text-amber-300',
  },
  error: {
    solid: 'border-transparent bg-[var(--color-error)] text-white',
    outline: 'border-red-500/30 bg-transparent text-red-600 dark:text-red-300',
    soft: 'border-transparent bg-red-500/12 text-red-600 dark:text-red-300',
  },
  info: {
    solid: 'border-transparent bg-[var(--color-info)] text-white',
    outline: 'border-cyan-500/30 bg-transparent text-cyan-600 dark:text-cyan-300',
    soft: 'border-transparent bg-cyan-500/12 text-cyan-600 dark:text-cyan-300',
  },
};

export function Badge({
  className,
  variant = 'soft',
  tone = 'default',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.04em]',
        toneClasses[tone][variant],
        className
      )}
      {...props}
    />
  );
}
