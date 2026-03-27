'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Milestone, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { type TimelineEvent } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';

// ── 分类颜色 ──────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  work:        'bg-blue-500',
  education:   'bg-emerald-500',
  life:        'bg-amber-500',
  achievement: 'bg-purple-500',
  travel:      'bg-rose-500',
};

function getCategoryColor(category: string) {
  return CATEGORY_COLOR[category] ?? 'bg-zinc-400';
}

const CATEGORY_LABEL: Record<string, string> = {
  work:        '工作',
  education:   '学习',
  life:        '生活',
  achievement: '成就',
  travel:      '旅行',
};

// ── 骨架 ──────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-6">
          <Skeleton className="mt-2 h-3 w-3 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-20 rounded-[var(--radius-2xl)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────

export default function TimelinePage() {
  const { isAdmin, loading: authLoading } = useAdmin();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/timeline');
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error('load failed');
      }

      setEvents(data);
    } catch (error) {
      console.error('加载时间线失败:', error);
      setEvents([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline]);

  // 分类列表
  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];

  // 按年分组 + 分类筛选
  const filtered = activeCategory === 'all'
    ? events
    : events.filter((e) => e.category === activeCategory);

  const byYear = filtered.reduce<Record<string, TimelineEvent[]>>((acc, e) => {
    const year = e.date.slice(0, 4);
    (acc[year] ??= []).push(e);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Life Milestones
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                时间线
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                把成长中的关键节点按时间串起来，记录重要的变化、选择和那些值得记住的时刻。
              </p>
            </div>
            <Card variant="glass" padding="sm" className="w-full max-w-sm rounded-[var(--radius-2xl)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]">
                  <Milestone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Timeline Events</p>
                  <p className="text-2xl font-semibold text-[var(--color-neutral-900)]">{events.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {!loading && events.length > 0 && (
          <Card variant="glass" className="rounded-[var(--radius-2xl)]">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-3.5 py-2 text-sm transition ${
                    activeCategory === cat
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                      : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                  }`}
                >
                  {cat === 'all' ? '全部' : (CATEGORY_LABEL[cat] ?? cat)}
                </button>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <TimelineSkeleton />
        ) : error ? (
          <StatePanel
            tone="error"
            icon={<RefreshCw className="h-6 w-6" />}
            title="时间线加载失败"
            description="这次没能获取到时间线数据，你可以重新试一次。"
            action={
              <button
                onClick={() => void loadTimeline()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
              >
                <RefreshCw className="h-4 w-4" />
                重新加载
              </button>
            }
          />
        ) : events.length === 0 ? (
          <StatePanel
            tone="empty"
            title="时间线尚未配置"
            description="等你录入成长节点后，这里会按年份展示重要时刻。"
            action={!authLoading && isAdmin ? (
              <Link
                href="/admin/timeline"
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
              >
                去后台配置时间线
              </Link>
            ) : null}
          />
        ) : (
          <div className="space-y-12">
            {years.map((year, yi) => (
              <div key={year}>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: yi * 0.05 }}
                  className="mb-6 flex items-center gap-3"
                >
                  <span className="text-2xl font-bold tabular-nums text-[var(--color-neutral-400)]">
                    {year}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border-default)]" />
                </motion.div>

                <div className="relative space-y-6 pl-6">
                  <div className="absolute bottom-0 left-[9px] top-0 w-px bg-[var(--border-default)]" />

                  {byYear[year].map((event, ei) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: yi * 0.05 + ei * 0.04 }}
                      className="relative flex gap-4"
                    >
                      <div
                        className={`absolute -left-[calc(24px-9px)] mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-[var(--surface-base)] ${getCategoryColor(event.category)} ${
                          event.is_milestone ? 'scale-125' : ''
                        }`}
                      />

                      <Card
                        variant={event.is_milestone ? 'bordered' : 'glass'}
                        className={`flex-1 rounded-[var(--radius-2xl)] ${
                          event.is_milestone ? 'border-amber-400/30 bg-amber-500/10' : ''
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {event.icon ? <span className="text-base">{event.icon}</span> : null}
                            <h3 className={`font-semibold ${event.is_milestone ? 'text-amber-700 dark:text-amber-200' : 'text-[var(--color-neutral-900)]'}`}>
                              {event.title}
                            </h3>
                            {event.is_milestone ? (
                              <Badge tone="warning" variant="soft">
                                里程碑
                              </Badge>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-xs text-[var(--color-neutral-500)]">
                            {event.date.slice(5).replace('-', '/')}
                          </span>
                        </div>

                        {event.description ? (
                          <p className="mt-1 text-sm leading-7 text-[var(--color-neutral-600)]">
                            {event.description}
                          </p>
                        ) : null}

                        {event.link ? (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex text-xs font-medium text-[var(--color-primary-600)] transition hover:underline"
                          >
                            了解更多 →
                          </a>
                        ) : null}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
