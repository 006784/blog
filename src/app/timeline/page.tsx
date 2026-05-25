'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, GitCommit, Milestone, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { type TimelineEvent } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import rawGitLog from '@/data/git-log.json';

// ── Git 提交类型颜色 ───────────────────────────────────────
interface GitCommit { hash: string; date: string; message: string; author: string }
const GIT_LOG: GitCommit[] = rawGitLog as GitCommit[];

const COMMIT_TYPE_COLOR: Record<string, { dot: string; badge: string; label: string }> = {
  feat:     { dot: 'bg-teal-500',   badge: 'bg-teal-500/15 text-teal-700',    label: '功能' },
  fix:      { dot: 'bg-orange-500', badge: 'bg-orange-500/15 text-orange-700', label: '修复' },
  refactor: { dot: 'bg-blue-500',   badge: 'bg-blue-500/15 text-blue-700',     label: '重构' },
  docs:     { dot: 'bg-purple-500', badge: 'bg-purple-500/15 text-purple-700', label: '文档' },
  chore:    { dot: 'bg-neutral-400', badge: 'bg-neutral-400/15 text-neutral-600', label: '杂务' },
  style:    { dot: 'bg-pink-400',   badge: 'bg-pink-400/15 text-pink-700',     label: '样式' },
  revert:   { dot: 'bg-red-400',    badge: 'bg-red-400/15 text-red-700',       label: '回滚' },
  perf:     { dot: 'bg-amber-500',  badge: 'bg-amber-500/15 text-amber-700',   label: '性能' },
};

function getCommitType(message: string) {
  const m = /^(\w+)(?:\(.+\))?!?:/.exec(message);
  const type = m?.[1]?.toLowerCase() ?? '';
  return COMMIT_TYPE_COLOR[type] ?? { dot: 'bg-neutral-400', badge: 'bg-neutral-400/15 text-neutral-600', label: type || 'other' };
}

function GitCommitSection() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? GIT_LOG : GIT_LOG.slice(0, 8);

  if (GIT_LOG.length === 0) return null;

  return (
    <div className="mt-12 space-y-6">
      {/* 分节标题 */}
      <div className="flex items-center gap-4">
        <span className="shrink-0 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold bg-(--surface-overlay) text-teal-500 shadow-(--neu-inset)">
          <GitCommit className="h-3.5 w-3.5" />
          代码提交
        </span>
        <div className="h-px flex-1 bg-(--border-default)" />
        <span className="text-xs text-ink-ghost">{GIT_LOG.length} 条记录</span>
      </div>

      {/* 提交列表 */}
      <div className="relative space-y-3 pl-6">
        <div className="absolute bottom-0 left-2.25 top-0 w-px bg-(--border-default)" />

        <AnimatePresence initial={false}>
          {visible.map((commit, i) => {
            const type = getCommitType(commit.message);
            const subject = commit.message.replace(/^\w+(?:\(.+\))?!?:\s*/, '');
            const dateStr = new Date(commit.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

            return (
              <motion.div
                key={commit.hash}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.02 }}
                className="relative flex gap-3 items-start"
              >
                {/* Dot */}
                <div className={`absolute -left-3.75 mt-2 h-3 w-3 shrink-0 rounded-full border-2 border-(--surface-base) ${type.dot}`} />

                {/* Card */}
                <div className="flex-1 rounded-xl px-4 py-2.5 flex items-center gap-3 bg-(--surface-raised) shadow-(--neu-shadow-sm)">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${type.badge}`}>
                    {type.label}
                  </span>
                  <p className="flex-1 text-sm text-ink leading-snug line-clamp-1">{subject}</p>
                  <span className="shrink-0 font-mono text-[11px] text-ink-ghost">{commit.hash}</span>
                  <span className="shrink-0 text-xs text-ink-ghost">{dateStr}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {GIT_LOG.length > 8 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="relative ml-0 flex items-center gap-1.5 rounded-full border border-(--border-default) bg-(--surface-raised) px-4 py-1.5 text-xs text-ink-muted transition hover:border-teal-500/40 hover:text-teal-600"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? '收起' : `查看全部 ${GIT_LOG.length} 条提交`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── 分类配置 ──────────────────────────────────────────────

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
            <Skeleton className="h-20 rounded-2xl" />
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

  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];

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
              <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                时间线
              </h1>
              <p className="text-sm leading-7 text-ink-secondary sm:text-base">
                把成长中的关键节点按时间串起来，记录重要的变化、选择和那些值得记住的时刻。
              </p>
            </div>
            <Card variant="glass" padding="sm" className="w-full max-w-sm rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--surface-overlay) text-teal-500">
                  <Milestone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Timeline Events</p>
                  <p className="text-2xl font-semibold text-ink">{events.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {!loading && events.length > 0 && (
          <Card variant="glass" className="rounded-2xl">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-3.5 py-2 text-sm transition ${
                    activeCategory === cat
                      ? 'border-teal-500 bg-teal-500 text-white shadow-(--shadow-sm)'
                      : 'border-(--border-default) bg-(--surface-base) text-ink-secondary hover:border-teal-300 hover:text-teal-600'
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
                className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-600"
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
                className="inline-flex items-center justify-center rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-600"
              >
                去后台配置时间线
              </Link>
            ) : null}
          />
        ) : (
          <div className="space-y-12">
            {years.map((year, yi) => (
              <div key={year}>
                {/* Year separator */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: yi * 0.05 }}
                  className="mb-6 flex items-center gap-4"
                >
                  <span
                    className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold tabular-nums"
                    style={{
                      background: 'var(--surface-overlay)',
                      color: 'var(--color-teal-500)',
                      boxShadow: 'var(--neu-inset)',
                    }}
                  >
                    {year}
                  </span>
                  <div className="h-px flex-1 bg-(--border-default)" />
                </motion.div>

                {/* Events */}
                <div className="relative space-y-5 pl-6">
                  {/* Vertical connector line */}
                  <div
                    className="absolute bottom-0 left-2.25 top-0 w-px"
                    style={{ background: 'var(--border-default)' }}
                  />

                  {byYear[year].map((event, ei) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: yi * 0.05 + ei * 0.04 }}
                      className="relative flex gap-4"
                    >
                      {/* Dot marker */}
                      <div
                        className={`absolute -left-3.75 shrink-0 rounded-full ${getCategoryColor(event.category)} ${
                          event.is_milestone ? 'mt-2 h-4 w-4' : 'mt-2.5 h-3 w-3'
                        }`}
                        style={{
                          border: '2px solid var(--surface-base)',
                          ...(event.is_milestone
                            ? { boxShadow: '0 0 0 2px var(--color-orange-400)' }
                            : {}),
                        }}
                      />

                      {/* Event card */}
                      <div
                        className={`flex-1 rounded-2xl p-5 transition-shadow duration-200 ${
                          event.is_milestone ? 'border-l-[3px]' : ''
                        }`}
                        style={{
                          background: event.is_milestone
                            ? 'color-mix(in srgb, var(--surface-raised) 88%, var(--color-orange-500) 12%)'
                            : 'var(--surface-raised)',
                          boxShadow: 'var(--neu-shadow-sm)',
                          ...(event.is_milestone
                            ? { borderLeftColor: 'var(--color-orange-500)' }
                            : {}),
                        }}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {event.icon ? (
                              <span className="text-base">{event.icon}</span>
                            ) : null}
                            <h3 className="font-semibold text-ink">
                              {event.title}
                            </h3>
                            {event.is_milestone ? (
                              <Badge tone="warning" variant="soft">
                                里程碑
                              </Badge>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-xs text-ink-muted">
                            {event.date.slice(5).replace('-', '/')}
                          </span>
                        </div>

                        {event.description ? (
                          <p className="mt-1 text-sm leading-7 text-ink-secondary">
                            {event.description}
                          </p>
                        ) : null}

                        {event.link ? (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex text-xs font-medium text-teal-600 transition hover:underline"
                          >
                            了解更多 →
                          </a>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Git 提交历史 */}
        <GitCommitSection />
      </div>
    </div>
  );
}
