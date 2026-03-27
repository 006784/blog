'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-lg)] bg-[linear-gradient(90deg,var(--surface-overlay)_0%,var(--surface-raised)_50%,var(--surface-overlay)_100%)] bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  );
}
