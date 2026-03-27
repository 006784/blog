'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
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

function NowSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 rounded-[var(--radius-2xl)]" />
      ))}
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────

export default function NowPage() {
  const [entries, setEntries] = useState<NowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await getNowEntries();
      setEntries(data);

      if (data.length > 0) {
        const latest = data.reduce((a, b) =>
          new Date(a.updated_at) > new Date(b.updated_at) ? a : b
        );
        setLastUpdated(latest.updated_at);
      } else {
        setLastUpdated(null);
      }
    } catch {
      setEntries([]);
      setLastUpdated(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  // 按分类分组
  const grouped = entries.reduce<Record<string, NowEntry[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="warning" variant="soft" className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Now Snapshot
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                此刻
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                用一页记录最近正在关注、在做、在想和在学习的东西，让站点保持当下感。
              </p>
              {lastUpdated ? (
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                  最后更新于 {formatDate(lastUpdated)}
                </p>
              ) : null}
            </div>
            <Card variant="glass" padding="sm" className="w-full max-w-sm rounded-[var(--radius-2xl)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]">
                  <Compass className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Active Notes</p>
                  <p className="text-2xl font-semibold text-[var(--color-neutral-900)]">{entries.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {loading ? (
          <NowSkeleton />
        ) : error ? (
          <StatePanel
            tone="error"
            icon={<RefreshCw className="h-6 w-6" />}
            title="此刻页面加载失败"
            description="这次没能读到当前状态数据，你可以重新试一次。"
            action={
              <button
                onClick={() => void loadEntries()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
              >
                <RefreshCw className="h-4 w-4" />
                重新加载
              </button>
            }
          />
        ) : entries.length === 0 ? (
          <StatePanel
            tone="empty"
            title="此刻内容尚未配置"
            description="等你添加最近在做、在学或在关注的内容后，这里会自动按主题展开。"
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {Object.entries(grouped).map(([category, items], gi) => {
              const meta = getMeta(category);
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.06 }}
                  className="h-full"
                >
                  <Card variant="glass" className="h-full rounded-[var(--radius-2xl)]">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{meta.icon}</span>
                        <div>
                          <p className="text-lg font-semibold text-[var(--color-neutral-900)]">
                            {meta.label}
                          </p>
                          <p className="text-sm text-[var(--color-neutral-500)]">
                            当前 {items.length} 条记录
                          </p>
                        </div>
                      </div>
                      <Badge variant="soft">{items.length}</Badge>
                    </div>

                    <ul className="space-y-3">
                      {items.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] px-4 py-3"
                        >
                          {entry.emoji ? (
                            <span className="mt-0.5 shrink-0 text-base">{entry.emoji}</span>
                          ) : (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-primary-500)]" />
                          )}
                          <span className="flex-1 text-sm leading-7 text-[var(--color-neutral-700)]">
                            {entry.link ? (
                              <a
                                href={entry.link}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4 transition-colors hover:text-[var(--color-primary-600)]"
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
                  </Card>
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
