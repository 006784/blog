'use client';

import { type ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

type StateTone = 'empty' | 'error' | 'loading' | 'default';

interface StatePanelProps {
  title: string;
  description?: string;
  tone?: StateTone;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const toneStyles: Record<StateTone, string> = {
  empty: 'border-(--border-default)',
  error: 'border-red-500/25 bg-(--surface-base)',
  loading: 'border-(--border-default) bg-(--surface-base)',
  default: 'border-(--border-default)',
};

const defaultIcons: Record<StateTone, ReactNode> = {
  empty: <Inbox className="h-6 w-6" />,
  error: <AlertTriangle className="h-6 w-6" />,
  loading: <Loader2 className="h-6 w-6 animate-spin" />,
  default: <Inbox className="h-6 w-6" />,
};

export function StatePanel({
  title,
  description,
  tone = 'default',
  icon,
  action,
  className,
}: StatePanelProps) {
  return (
    <Card
      variant="bordered"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-10 text-center',
        toneStyles[tone],
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--surface-card-start),var(--surface-overlay))] text-(--color-primary-600) shadow-[0_14px_26px_-20px_var(--surface-card-shadow-strong)]">
        {icon || defaultIcons[tone]}
      </div>
      <div className="space-y-1">
        <p className="text-(--text-lg) font-semibold text-neutral-900 dark:text-neutral-900">
          {title}
        </p>
        {description && (
          <p className="max-w-md text-(--text-sm) leading-(--leading-relaxed) text-neutral-600 dark:text-neutral-600">
            {description}
          </p>
        )}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </Card>
  );
}
