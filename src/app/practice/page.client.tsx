'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code2, Search, SlidersHorizontal, CheckCircle, Clock, Zap, BookOpen, HelpCircle, MessageSquare } from 'lucide-react';
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
  algorithm:       { label: '算法', icon: <Zap className="w-3.5 h-3.5" /> },
  multiple_choice: { label: '选择题', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  interview:       { label: '面试题', icon: <MessageSquare className="w-3.5 h-3.5" /> },
};

export function PracticeListClient() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (difficulty) params.set('difficulty', difficulty);
    params.set('limit', '100');
    const res = await fetch(`/api/practice/problems?${params}`);
    const data = await res.json();
    setProblems(data.problems ?? []);
    setLoading(false);
  }, [q, type, difficulty]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'easy').length,
    medium: problems.filter(p => p.difficulty === 'medium').length,
    hard: problems.filter(p => p.difficulty === 'hard').length,
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 border border-[var(--line,#ddd9d0)]" style={{ background: 'var(--paper-deep,#ede9e0)' }}>
              <Code2 className="w-8 h-8" style={{ color: 'var(--gold,#c4a96d)' }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">编程练习</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            算法题、选择题、面试题 — 支持 Python、JS、Java、C++、C、PHP、TypeScript 在线运行
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: '全部', value: stats.total, color: 'text-[var(--ink)]' },
            { label: '简单', value: stats.easy, color: 'text-emerald-600' },
            { label: '中等', value: stats.medium, color: 'text-amber-600' },
            { label: '困难', value: stats.hard, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl border border-[var(--line)] bg-[var(--paper-deep,#ede9e0)]">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索题目..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 border border-[var(--line)] rounded-lg p-1">
            {[['', '全部'], ['algorithm', '算法'], ['multiple_choice', '选择'], ['interview', '面试']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={`px-3 py-1 rounded text-sm transition-colors ${type === v ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-muted-foreground hover:text-[var(--ink)]'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-1 border border-[var(--line)] rounded-lg p-1">
            {[['', '全部'], ['easy', '简单'], ['medium', '中等'], ['hard', '困难']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setDifficulty(v)}
                className={`px-3 py-1 rounded text-sm transition-colors ${difficulty === v ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-muted-foreground hover:text-[var(--ink)]'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Problem list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-[var(--paper-deep)] animate-pulse" />
            ))}
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>没有找到题目</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-[var(--line)] overflow-hidden"
          >
            {/* Table header */}
            <div className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_5rem] gap-4 px-4 py-2.5 bg-[var(--paper-deep)] text-xs font-medium text-muted-foreground border-b border-[var(--line)]">
              <span>#</span>
              <span>题目</span>
              <span>类型</span>
              <span>难度</span>
              <span>标签</span>
              <span className="text-right">通过率</span>
            </div>

            {problems.map((problem, index) => {
              const acceptRate = problem.submission_count > 0
                ? Math.round((problem.accept_count / problem.submission_count) * 100)
                : null;
              const typeInfo = TYPE_LABELS[problem.type];

              return (
                <Link
                  key={problem.id}
                  href={`/practice/${problem.slug}`}
                  className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_5rem] gap-4 px-4 py-3.5 hover:bg-[var(--paper-deep)] transition-colors border-b border-[var(--line)] last:border-0 group items-center"
                >
                  <span className="text-sm text-muted-foreground">{index + 1}</span>

                  <span className="text-sm font-medium group-hover:text-[var(--gold)] transition-colors truncate">
                    {problem.title}
                  </span>

                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {typeInfo?.icon}
                    {typeInfo?.label}
                  </span>

                  <span><DifficultyBadge difficulty={problem.difficulty} /></span>

                  <span className="flex flex-wrap gap-1">
                    {problem.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--paper-deep)] border border-[var(--line)] text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </span>

                  <span className="text-xs text-right text-muted-foreground">
                    {acceptRate !== null ? (
                      <span className={acceptRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}>{acceptRate}%</span>
                    ) : '—'}
                  </span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
