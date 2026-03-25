'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** 是否输出 JSON-LD，默认 true */
  withJsonLd?: boolean;
}

export function Breadcrumb({ items, withJsonLd = true }: BreadcrumbProps) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

  const schema = withJsonLd
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.label,
          ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
        })),
      }
    : null;

  return (
    <>
      {/* JSON-LD */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}

      {/* 视觉面包屑 */}
      <motion.nav
        aria-label="breadcrumb"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center flex-wrap gap-1 text-sm text-zinc-500 dark:text-zinc-500"
      >
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />
              )}
              {isLast || !item.href ? (
                <span
                  className={
                    isLast
                      ? 'text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[200px]'
                      : 'text-zinc-500 dark:text-zinc-500'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </motion.nav>
    </>
  );
}
