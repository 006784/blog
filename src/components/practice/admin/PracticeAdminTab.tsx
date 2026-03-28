'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader2, Eye, EyeOff, Zap, HelpCircle, MessageSquare } from 'lucide-react';
import { DifficultyBadge } from '../DifficultyBadge';
import { ProblemFormModal } from './ProblemFormModal';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  type: string;
  tags: string[];
  is_public: boolean;
  submission_count: number;
  accept_count: number;
}

const TYPE_ICON: Record<string, ReactNode> = {
  algorithm:       <Zap className="w-3.5 h-3.5" />,
  multiple_choice: <HelpCircle className="w-3.5 h-3.5" />,
  interview:       <MessageSquare className="w-3.5 h-3.5" />,
};

const TYPE_LABEL: Record<string, string> = {
  algorithm: '算法', multiple_choice: '选择', interview: '面试',
};

export function PracticeAdminTab() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  async function loadProblems() {
    setLoading(true);
    const res = await fetch('/api/practice/problems?limit=200');
    const data = await res.json();
    setProblems(data.problems ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    const fetchProblems = async () => {
      setLoading(true);
      const res = await fetch('/api/practice/problems?limit=200');
      const data = await res.json();
      if (!cancelled) {
        setProblems(data.problems ?? []);
        setLoading(false);
      }
    };

    fetchProblems();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('确定删除这道题目吗？相关提交记录也会一并删除。')) return;
    await fetch(`/api/practice/problems/${id}`, { method: 'DELETE' });
    setProblems(p => p.filter(pr => pr.id !== id));
  }

  function openAdd() { setEditingProblem(null); setShowModal(true); }
  function openEdit(p: Problem) { setEditingProblem(p); setShowModal(true); }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">编程题库</h2>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> 新建题目
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>暂无题目，点击「新建题目」开始</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_5rem_5rem_5rem_6rem_5rem] gap-4 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
            <span>题目</span>
            <span>类型</span>
            <span>难度</span>
            <span>状态</span>
            <span>通过率</span>
            <span className="text-right">操作</span>
          </div>
          <div className="divide-y divide-border">
            {problems.map(p => {
              const rate = p.submission_count > 0
                ? Math.round((p.accept_count / p.submission_count) * 100) : null;
              return (
                <div key={p.id} className="grid grid-cols-[1fr_5rem_5rem_5rem_6rem_5rem] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {TYPE_ICON[p.type]}
                    {TYPE_LABEL[p.type] || p.type}
                  </span>
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className={`flex items-center gap-1 text-xs ${p.is_public ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {p.is_public ? <><Eye className="w-3.5 h-3.5" />公开</> : <><EyeOff className="w-3.5 h-3.5" />草稿</>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rate !== null ? <span className={rate >= 50 ? 'text-emerald-600' : 'text-amber-600'}>{rate}%</span> : '—'}
                    <span className="text-muted-foreground/50 ml-1">({p.submission_count})</span>
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ProblemFormModal
            problem={editingProblem}
            onClose={() => setShowModal(false)}
            onSave={() => { setShowModal(false); loadProblems(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
