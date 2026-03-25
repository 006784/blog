'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getNowEntries, formatDate, type NowEntry } from '@/lib/supabase';

// ── 分类配置 ──────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  location:  { label: '所在地',   icon: '📍' },
  doing:     { label: '正在做',   icon: '💼' },
  reading:   { label: '在读',     icon: '📖' },
  learning:  { label: '在学',     icon: '🎯' },
  thinking:  { label: '在想',     icon: '💭' },
  watching:  { label: '在看',     icon: '🎬' },
  listening: { label: '在听',     icon: '🎵' },
};

function getMeta(category: string) {
  return CATEGORY_META[category] ?? { label: category, icon: '✦' };
}

// ── 加载骨架 ──────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────

export default function NowPage() {
  const [entries, setEntries] = useState<NowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    getNowEntries().then((data) => {
      if (data.length > 0) {
        setEntries(data);
        const latest = data.reduce((a, b) =>
          new Date(a.updated_at) > new Date(b.updated_at) ? a : b
        );
        setLastUpdated(latest.updated_at);
      }
    }).finally(() => setLoading(false));
  }, []);

  // 按分类分组
  const grouped = entries.reduce<Record<string, NowEntry[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-semibold tracking-tight">此刻</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            我现在正在做什么、想什么、关注什么
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-zinc-400">
              最后更新于 {formatDate(lastUpdated)}
            </p>
          )}
        </motion.div>

        {loading ? (
          <Skeleton />
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
            <p className="text-3xl mb-3">✦</p>
            <p>此刻内容尚未配置</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items], gi) => {
              const meta = getMeta(category);
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.06 }}
                  className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur p-5"
                >
                  {/* 分类标题 */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{meta.icon}</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {meta.label}
                    </span>
                  </div>

                  {/* 条目列表 */}
                  <ul className="space-y-2.5">
                    {items.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-2">
                        {entry.emoji && (
                          <span className="text-base shrink-0 mt-0.5">{entry.emoji}</span>
                        )}
                        <span className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed flex-1">
                          {entry.link ? (
                            <a
                              href={entry.link}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                              {entry.content}
                            </a>
                          ) : (
                            entry.content
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 说明 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-xs text-zinc-400"
        >
          灵感来自{' '}
          <a
            href="https://nownownow.com"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-zinc-600"
          >
            nownownow.com
          </a>{' '}
          · 记录当下的切片
        </motion.p>
      </div>
    </div>
  );
}
