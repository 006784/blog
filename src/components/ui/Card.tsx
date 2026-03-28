'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'border border-[color:var(--border-default)] bg-[linear-gradient(180deg,var(--surface-card-start),var(--surface-card-end))] shadow-[0_18px_36px_-28px_var(--surface-card-shadow-strong),0_10px_18px_-16px_var(--surface-card-shadow)]',
  elevated:
    'border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-card-start)_94%,white),var(--surface-card-end))] shadow-[0_26px_52px_-34px_var(--surface-card-shadow-strong),0_14px_24px_-18px_var(--surface-card-shadow)]',
  bordered:
    'border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,var(--surface-base),var(--surface-raised))] shadow-[inset_0_1px_0_var(--surface-card-highlight)]',
  glass:
    'border border-white/20 bg-[linear-gradient(180deg,var(--surface-panel),var(--surface-glass))] backdrop-blur-xl shadow-[0_20px_40px_-28px_var(--surface-card-shadow-strong)]',
};

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-[var(--radius-xl)] text-[var(--color-neutral-900)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-20 before:bg-[linear-gradient(180deg,var(--surface-card-highlight),transparent)] before:content-[\'\'] dark:text-[var(--color-neutral-900)]',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    />
  );
}
