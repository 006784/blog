'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, Milestone, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { type TimelineEvent, type TimelineEventLog } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';

// ── 分类配置 ──────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  breakthrough: 'var(--color-smoke-blue-400)',
  product: 'var(--color-teal-500)',
  industry: 'var(--color-orange-500)',
  tracking: 'var(--color-orange-400)',
};

function getCategoryColor(category: string) {
  return CATEGORY_COLOR[category] ?? 'var(--ink-ghost)';
}

const CATEGORY_LABEL: Record<string, string> = {
  breakthrough: '技术突破',
  product: '模型发布',
  industry: '行业事件',
  tracking: 'AI日报',
};

// ── 日志按月/周分组 ────────────────────────────────────────

interface LogTimeGroup {
  key: string;
  label: string;
  logs: TimelineEventLog[];
  weeks: LogTimeGroup[] | null;
}

/** 把逐日日志按「年月 → 周」分组，单月超过7条才拆分到周一级。 */
function groupLogsByTime(logs: TimelineEventLog[]): LogTimeGroup[] {
  const byMonth = new Map<string, TimelineEventLog[]>();
  for (const log of logs) {
    const ym = log.date.slice(0, 7);
    const list = byMonth.get(ym);
    if (list) list.push(log);
    else byMonth.set(ym, [log]);
  }

  return Array.from(byMonth.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ym, monthLogs]) => {
      const sorted = [...monthLogs].sort((a, b) => b.date.localeCompare(a.date));
      const [year, month] = ym.split('-');

      let weeks: LogTimeGroup[] | null = null;
      if (sorted.length > 7) {
        const byWeek = new Map<number, TimelineEventLog[]>();
        for (const log of sorted) {
          const day = Number(log.date.slice(8, 10));
          const weekNo = Math.ceil(day / 7);
          const list = byWeek.get(weekNo);
          if (list) list.push(log);
          else byWeek.set(weekNo, [log]);
        }
        weeks = Array.from(byWeek.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([weekNo, weekLogs]) => ({
            key: `${ym}-w${weekNo}`,
            label: `第${weekNo}周`,
            logs: weekLogs,
            weeks: null,
          }));
      }

      return {
        key: ym,
        label: `${year}年${Number(month)}月`,
        logs: sorted,
        weeks,
      };
    });
}

// ── 日志卡片 ──────────────────────────────────────────────

function LogCard({ log }: { log: TimelineEventLog }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface-base)' }}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-ink">{log.title}</h4>
        <span className="shrink-0 text-xs text-ink-muted">
          {log.date.slice(5).replace('-', '/')}
        </span>
      </div>
      <p className="mt-1 text-sm leading-6 text-ink-secondary">{log.content}</p>
      {log.link ? (
        <a
          href={log.link}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-xs font-medium text-teal-600 transition hover:underline"
        >
          了解更多 →
        </a>
      ) : null}
    </div>
  );
}

/** 月/周分组的可折叠小节点标题 */
function LogGroupHeader({
  label,
  count,
  open,
  level,
  color,
  onClick,
}: {
  label: string;
  count: number;
  open: boolean;
  level: 'month' | 'week';
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-(--surface-base)"
    >
      <span
        className={level === 'month' ? 'h-1.5 w-1.5 rounded-full' : 'h-1 w-1 rounded-full'}
        style={{ background: level === 'month' ? color : 'var(--ink-ghost)' }}
      />
      <span className={level === 'month' ? 'text-xs font-semibold text-ink-secondary' : 'text-[11px] font-medium text-ink-muted'}>
        {label}
      </span>
      <span className="text-[10px] text-ink-muted">{count} 条</span>
      <ChevronDown className={`ml-auto h-3 w-3 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logsByEvent, setLogsByEvent] = useState<Record<string, TimelineEventLog[] | 'loading' | 'error'>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

  const toggleExpand = async (event: TimelineEvent) => {
    const id = event.id;
    setExpandedId((prev) => (prev === id ? null : id));
    if (logsByEvent[id] !== undefined) return;

    setLogsByEvent((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const res = await fetch(`/api/timeline/${id}/logs`);
      const data = await res.json();
      setLogsByEvent((prev) => ({ ...prev, [id]: Array.isArray(data) ? data : 'error' }));
    } catch {
      setLogsByEvent((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  // 月/周分组默认展开最新一组，其余折叠；点击后记录用户的显式状态
  const isGroupOpen = (key: string, defaultOpen: boolean) => expandedGroups[key] ?? defaultOpen;
  const toggleGroup = (key: string, defaultOpen: boolean) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) }));
  };

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
    <div className="relative min-h-screen overflow-hidden px-6 py-16 sm:px-8">
      <div className="pointer-events-none absolute right-[8%] top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-smoke-blue-100)_0%,transparent_70%)] opacity-50 blur-3xl" />
      <div className="relative mx-auto max-w-5xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Timeline
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                AI 发展时间线
              </h1>
              <p className="text-sm leading-7 text-ink-secondary sm:text-base">
                从达特茅斯会议到大模型时代，按时间梳理人工智能发展的关键里程碑。点开「AI日报」节点，查看每天更新的行业动态详细记录。
              </p>
            </div>
            <Card variant="glass" padding="sm" className="w-full max-w-sm rounded-2xl">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: 'color-mix(in srgb, var(--color-smoke-blue-400) 15%, transparent)', color: 'var(--color-smoke-blue-400)' }}
                >
                  <Milestone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">AI Milestones</p>
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
            description="等你录入AI发展节点后，这里会按年份展示重要时刻。"
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

                  {byYear[year].map((event, ei) => {
                    const isExpanded = expandedId === event.id;
                    const logs = logsByEvent[event.id];
                    const color = getCategoryColor(event.category);

                    return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: yi * 0.05 + ei * 0.04 }}
                      className="relative flex gap-4"
                    >
                      {/* Dot marker */}
                      <div
                        className={`absolute -left-3.75 shrink-0 rounded-full ${
                          event.is_milestone ? 'mt-2 h-4 w-4' : 'mt-2.5 h-3 w-3'
                        }`}
                        style={{
                          background: color,
                          border: '2px solid var(--surface-base)',
                          ...(event.is_milestone
                            ? { boxShadow: `0 0 0 2px color-mix(in srgb, ${color} 45%, transparent)` }
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
                            ? `color-mix(in srgb, var(--surface-raised) 90%, ${color} 10%)`
                            : 'var(--surface-raised)',
                          boxShadow: 'var(--neu-shadow-sm)',
                          ...(event.is_milestone
                            ? { borderLeftColor: color }
                            : {}),
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => void toggleExpand(event)}
                          className="flex w-full items-start justify-between gap-2 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {event.icon ? (
                              <span
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base"
                                style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
                              >
                                {event.icon}
                              </span>
                            ) : null}
                            <h3 className="font-semibold text-ink">
                              {event.title}
                            </h3>
                            {event.is_milestone ? (
                              <Badge tone="warning" variant="soft">
                                里程碑
                              </Badge>
                            ) : null}
                            {event.category === 'tracking' ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
                              >
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: color }} />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                                </span>
                                每日更新
                              </span>
                            ) : null}
                          </div>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-ink-muted">
                            {event.date.slice(5).replace('-', '/')}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </span>
                        </button>

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

                        {isExpanded && (
                          <div className="mt-4 space-y-2 border-t border-(--border-default) pt-4">
                            {logs === 'loading' ? (
                              <p className="text-xs text-ink-muted">加载中...</p>
                            ) : logs === 'error' ? (
                              <p className="text-xs text-ink-muted">加载失败，请重试</p>
                            ) : logs && logs.length > 0 ? (
                              groupLogsByTime(logs).map((month, mi) => {
                                const monthOpen = isGroupOpen(month.key, mi === 0);
                                return (
                                  <div key={month.key} className="space-y-2">
                                    <LogGroupHeader
                                      label={month.label}
                                      count={month.logs.length}
                                      open={monthOpen}
                                      level="month"
                                      color={color}
                                      onClick={() => toggleGroup(month.key, mi === 0)}
                                    />
                                    {monthOpen && (
                                      <div className="space-y-2 border-l border-(--border-default) pl-3">
                                        {month.weeks
                                          ? month.weeks.map((week, wi) => {
                                              const weekOpen = isGroupOpen(week.key, wi === 0);
                                              return (
                                                <div key={week.key} className="space-y-2">
                                                  <LogGroupHeader
                                                    label={week.label}
                                                    count={week.logs.length}
                                                    open={weekOpen}
                                                    level="week"
                                                    color={color}
                                                    onClick={() => toggleGroup(week.key, wi === 0)}
                                                  />
                                                  {weekOpen && (
                                                    <div className="space-y-2 border-l border-(--border-default) pl-3">
                                                      {week.logs.map((log) => (
                                                        <LogCard key={log.id} log={log} />
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })
                                          : month.logs.map((log) => <LogCard key={log.id} log={log} />)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-ink-muted">暂无逐日动态记录</p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
