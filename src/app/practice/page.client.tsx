'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Code2,
  HelpCircle,
  MessageSquare,
  Search,
  Terminal,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { DifficultyBadge } from '@/components/practice/DifficultyBadge';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'algorithm' | 'multiple_choice' | 'interview';
  tags: string[];
  submission_count: number;
  accept_count: number;
  sort_order: number;
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  algorithm: { label: '算法', icon: <Zap className="h-3.5 w-3.5" /> },
  multiple_choice: { label: '选择题', icon: <HelpCircle className="h-3.5 w-3.5" /> },
  interview: { label: '面试题', icon: <MessageSquare className="h-3.5 w-3.5" /> },
};

function PracticeSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-28 rounded-[var(--radius-2xl)]" />
      ))}
    </div>
  );
}

export function PracticeListClient() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProblems = async () => {
      setLoading(true);
      setError(false);

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (type) params.set('type', type);
      if (difficulty) params.set('difficulty', difficulty);
      params.set('limit', '100');

      try {
        const res = await fetch(`/api/practice/problems?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error('failed');
        if (!cancelled) {
          setProblems(data.problems ?? []);
        }
      } catch {
        if (!cancelled) {
          setProblems([]);
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProblems();

    return () => {
      cancelled = true;
    };
  }, [difficulty, q, type]);

  const stats = useMemo(
    () => ({
      total: problems.length,
      easy: problems.filter((p) => p.difficulty === 'easy').length,
      medium: problems.filter((p) => p.difficulty === 'medium').length,
      hard: problems.filter((p) => p.difficulty === 'hard').length,
    }),
    [problems]
  );

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <Code2 className="h-3.5 w-3.5" />
            Practice Arena
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                编程练习
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                算法题、选择题和面试题都放在这里，配合在线运行环境一起练习会更顺手。
              </p>
            </div>
            <Link href="/code" className="w-full lg:w-auto">
              <Button variant="secondary" className="w-full lg:w-auto">
                <Terminal className="h-4 w-4" />
                打开代码运行环境
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            { label: '全部', value: stats.total, tone: 'default' as const },
            { label: '简单', value: stats.easy, tone: 'success' as const },
            { label: '中等', value: stats.medium, tone: 'warning' as const },
            { label: '困难', value: stats.hard, tone: 'error' as const },
          ].map((stat) => (
            <Card key={stat.label} variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{stat.value}</p>
                </div>
                <Badge tone={stat.tone}>{stat.label}</Badge>
              </div>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card variant="glass" className="rounded-[var(--radius-2xl)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-500)]" />
                  <Input
                    type="text"
                    placeholder="搜索题目..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-11"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ['', '全部'],
                    ['algorithm', '算法'],
                    ['multiple_choice', '选择'],
                    ['interview', '面试'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setType(value)}
                      className={`rounded-full border px-3.5 py-2 text-sm transition ${
                        type === value
                          ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                          : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ['', '全部'],
                  ['easy', '简单'],
                  ['medium', '中等'],
                  ['hard', '困难'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setDifficulty(value)}
                    className={`rounded-full border px-3.5 py-2 text-sm transition ${
                      difficulty === value
                        ? 'border-[var(--color-primary-500)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]'
                        : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {loading ? (
          <PracticeSkeleton />
        ) : error ? (
          <StatePanel
            tone="error"
            title="题目列表加载失败"
            description="这次没能获取到练习题数据，你可以稍后刷新再试。"
          />
        ) : problems.length === 0 ? (
          <StatePanel
            tone="empty"
            icon={<BookOpen className="h-6 w-6" />}
            title="没有找到题目"
            description={q || type || difficulty ? '试试切换筛选条件，看看其他类型或难度的题目。' : '题库还没有内容，稍后这里会出现练习题列表。'}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="space-y-4"
          >
            {problems.map((problem, index) => {
              const acceptRate =
                problem.submission_count > 0
                  ? Math.round((problem.accept_count / problem.submission_count) * 100)
                  : null;
              const typeInfo = TYPE_LABELS[problem.type];

              return (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/practice/${problem.slug}`} className="block">
                    <Card
                      variant="glass"
                      padding="sm"
                      className="rounded-[var(--radius-2xl)] transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]">
                            <span className="text-sm font-semibold">{index + 1}</span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-semibold text-[var(--color-neutral-900)] transition-colors hover:text-[var(--color-primary-600)]">
                                {problem.title}
                              </h3>
                              <Badge variant="soft" className="gap-1.5">
                                {typeInfo?.icon}
                                {typeInfo?.label}
                              </Badge>
                              <DifficultyBadge difficulty={problem.difficulty} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {problem.tags?.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="soft" className="font-normal">
                                  {tag}
                                </Badge>
                              ))}
                              {problem.tags?.length > 3 ? (
                                <Badge variant="soft" className="font-normal">
                                  +{problem.tags.length - 3}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-neutral-500)] lg:min-w-[220px] lg:justify-end">
                          <span>提交 {problem.submission_count}</span>
                          <span>通过 {problem.accept_count}</span>
                          <span className={acceptRate !== null && acceptRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}>
                            {acceptRate !== null ? `${acceptRate}%` : '—'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
