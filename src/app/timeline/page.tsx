'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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

function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-6">
          <div className="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-2 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
            <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
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
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/api/timeline')
      .then(async (r) => {
        if (!r.ok) throw new Error('load failed');
        return r.json();
      })
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('加载时间线失败:', error);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-semibold tracking-tight">时间线</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            成长历程中的重要节点与记忆
          </p>
        </motion.div>

        {/* 分类筛选 */}
        {!loading && events.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {cat === 'all' ? '全部' : (CATEGORY_LABEL[cat] ?? cat)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Skeleton />
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
            <p className="text-3xl mb-3">⏳</p>
            <p>时间线尚未配置</p>
            {!authLoading && isAdmin && (
              <Link
                href="/admin/timeline"
                className="inline-flex items-center justify-center mt-5 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
              >
                去后台配置时间线
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {years.map((year, yi) => (
              <div key={year}>
                {/* 年份标签 */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: yi * 0.05 }}
                  className="mb-6 flex items-center gap-3"
                >
                  <span className="text-2xl font-bold text-zinc-300 dark:text-zinc-600 tabular-nums">
                    {year}
                  </span>
                  <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                </motion.div>

                {/* 当年事件 */}
                <div className="relative pl-6 space-y-6">
                  {/* 竖线 */}
                  <div className="absolute left-[9px] top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800" />

                  {byYear[year].map((event, ei) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: yi * 0.05 + ei * 0.04 }}
                      className="relative flex gap-4"
                    >
                      {/* 节点圆点 */}
                      <div
                        className={`absolute -left-[calc(24px-9px)] mt-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 shrink-0 ${getCategoryColor(event.category)} ${
                          event.is_milestone ? 'scale-125' : ''
                        }`}
                      />

                      {/* 卡片 */}
                      <div
                        className={`flex-1 rounded-2xl border p-4 transition-colors ${
                          event.is_milestone
                            ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20'
                            : 'border-zinc-100 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60'
                        } backdrop-blur`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {event.icon && <span className="text-base">{event.icon}</span>}
                            <h3 className={`font-medium ${event.is_milestone ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                              {event.title}
                            </h3>
                            {event.is_milestone && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                里程碑
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400 shrink-0">
                            {event.date.slice(5).replace('-', '/')}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                            {event.description}
                          </p>
                        )}

                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-text text-xs text-blue-500 hover:underline"
                          >
                            了解更多 →
                          </a>
                        )}
                      </div>
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
