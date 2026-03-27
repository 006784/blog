'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Boxes, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { type UsesItem } from '@/lib/supabase';
import { UsesIcon } from '@/components/UsesIcon';

// ── 分类配置 ──────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  hardware:   { label: '硬件设备',      icon: '💻' },
  chips:      { label: '芯片 / CPU',   icon: '⚡' },
  software:   { label: '常用软件',      icon: '📱' },
  notes:      { label: '笔记工具',      icon: '📝' },
  opensource: { label: 'Mac 开源工具',  icon: '🐙' },
  'dev-tools':{ label: '开发工具 / IDE', icon: '🛠' },
  languages:  { label: '编程语言',      icon: '🔤' },
  services:   { label: '云服务',        icon: '☁️' },
  design:     { label: '设计工具',      icon: '🎨' },
  daily:      { label: '日常',          icon: '✨' },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, icon: '📦' };
}

function UsesSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <Skeleton className="mb-4 h-5 w-24 rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-32 rounded-[var(--radius-2xl)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UsesPage() {
  const [items, setItems] = useState<UsesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/uses');
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error('failed');
      }

      setItems(data);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  // 按分类分组，保留 CATEGORY_META 中定义的顺序
  const grouped = items.reduce<Record<string, UsesItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const categoryOrder = [
    ...Object.keys(CATEGORY_META).filter((k) => grouped[k]),
    ...Object.keys(grouped).filter((k) => !CATEGORY_META[k]),
  ];

  return (
    <div className="min-h-screen px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Setup & Stack
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                工具箱
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                我每天在用的硬件、软件和在线服务，从效率工具到开发环境都整理在这里。
              </p>
            </div>
            <Card variant="glass" padding="sm" className="w-full max-w-sm rounded-[var(--radius-2xl)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]">
                  <Boxes className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Tool Entries</p>
                  <p className="text-2xl font-semibold text-[var(--color-neutral-900)]">{items.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {loading ? (
          <UsesSkeleton />
        ) : error ? (
          <StatePanel
            tone="error"
            icon={<RefreshCw className="h-6 w-6" />}
            title="工具箱暂时加载失败"
            description="这次没能拿到工具数据，你可以重新试一次。"
            action={
              <button
                onClick={() => void loadItems()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
              >
                <RefreshCw className="h-4 w-4" />
                重新加载
              </button>
            }
          />
        ) : items.length === 0 ? (
          <StatePanel
            tone="empty"
            title="工具箱内容尚未配置"
            description="等你把常用设备、软件和服务录入后，这里会自动按分类展示。"
          />
        ) : (
          <div className="space-y-10">
            {categoryOrder.map((category, ci) => {
              const meta = getCategoryMeta(category);
              return (
                <motion.section
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.07 }}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="text-lg">{meta.icon}</span>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">
                        {meta.label}
                      </h2>
                      <Badge variant="soft">{grouped[category].length}</Badge>
                    </div>
                    <div className="h-px flex-1 bg-[var(--border-default)]" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {grouped[category].map((item, ii) => {
                      const cardClass = 'group block h-full';
                      const inner = (
                        <Card
                          variant="glass"
                          padding="sm"
                          className="flex h-full items-start gap-4 rounded-[var(--radius-2xl)] transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)]">
                            {item.icon_url ? (
                              <UsesIcon
                                key={`${item.id}:${item.icon_url ?? ''}:${item.link ?? ''}`}
                                iconUrl={item.icon_url}
                                link={item.link}
                                name={item.name}
                                fallback={meta.icon}
                                wrapperClassName="flex h-full w-full items-center justify-center overflow-hidden"
                                imgClassName="h-full w-full object-cover"
                                fallbackClassName="text-lg"
                              />
                            ) : (
                              <span className="text-lg">{meta.icon}</span>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-base font-semibold text-[var(--color-neutral-900)] transition-colors group-hover:text-[var(--color-primary-600)]">
                                  {item.name}
                                </h3>
                                {item.link ? (
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--color-neutral-500)] transition-colors group-hover:text-[var(--color-primary-600)]" />
                                ) : null}
                              </div>
                              {item.description ? (
                                <p className="line-clamp-3 text-sm leading-6 text-[var(--color-neutral-600)]">
                                  {item.description}
                                </p>
                              ) : (
                                <p className="text-sm leading-6 text-[var(--color-neutral-500)]">
                                  {meta.label} 中的一项常用工具。
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-[var(--color-neutral-500)]">
                              {item.link ? '支持外部访问' : '本地记录'}
                            </div>
                          </div>
                        </Card>
                      );
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: ci * 0.07 + ii * 0.03 }}
                        >
                          {item.link ? (
                            <a href={item.link} className={cardClass}>
                              {inner}
                            </a>
                          ) : (
                            <div className={cardClass}>{inner}</div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
