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
  default: 'border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]',
  elevated: 'border border-[color:var(--border-default)] bg-[var(--surface-base)] shadow-[var(--shadow-lg)]',
  bordered: 'border border-[color:var(--border-strong)] bg-[var(--surface-base)] shadow-none',
  glass: 'border border-white/10 bg-[var(--surface-glass)] backdrop-blur-xl shadow-[var(--shadow-md)]',
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
        'rounded-[var(--radius-xl)] text-[var(--color-neutral-900)] dark:text-[var(--color-neutral-900)]',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    />
  );
}
