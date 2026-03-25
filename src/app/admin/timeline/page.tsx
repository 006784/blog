'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Edit2, Trash2, X, Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/AdminProvider';
import { TimelineEvent } from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'work',        label: '工作', color: 'bg-blue-400' },
  { value: 'education',   label: '学习', color: 'bg-emerald-400' },
  { value: 'life',        label: '生活', color: 'bg-amber-400' },
  { value: 'achievement', label: '成就', color: 'bg-purple-400' },
  { value: 'travel',      label: '旅行', color: 'bg-rose-400' },
];

const EMPTY: Partial<TimelineEvent> = {
  title: '', description: '', date: '', category: 'life',
  icon: '', link: '', is_milestone: false,
};

export default function AdminTimelinePage() {
  const { isAdmin, loading: authLoading } = useAdmin();
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [form, setForm] = useState<Partial<TimelineEvent>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/admin/login?redirect=/admin/timeline');
      return;
    }

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
  }, [authLoading, isAdmin, router]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(event: TimelineEvent) {
    setEditing(event);
    setForm({ ...event });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title?.trim() || !form.date) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/timeline/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
      } else {
        const res = await fetch('/api/timeline', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        const created = await res.json();
        setEvents((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;
    setDeleting(id);
    try {
      await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const field = (key: keyof TimelineEvent) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSeedDefaults() {
    setSeeding(true);
    try {
      const res = await fetch('/api/timeline/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'seed failed');
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error('初始化时间线失败:', error);
    } finally {
      setSeeding(false);
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
          <p>{authLoading ? '验证中...' : '正在跳转到登录页...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Clock className="w-5 h-5 text-zinc-500" />
          <h1 className="text-xl font-semibold">时间线管理</h1>
          <span className="text-sm text-zinc-400">({events.length})</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" /> 添加
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
          <p className="mb-4">暂无事件</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              初始化示例时间线
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
            >
              手动添加
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const cat = CATEGORY_OPTIONS.find((c) => c.value === event.category);
            return (
              <motion.div
                key={event.id}
                layout
                className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-4 py-3 backdrop-blur"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${cat?.color ?? 'bg-zinc-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {event.icon && <span className="text-sm">{event.icon}</span>}
                    <span className="font-medium text-sm truncate">{event.title}</span>
                    {event.is_milestone && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                        里程碑
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                    <span>{event.date}</span>
                    <span>{cat?.label}</span>
                  </div>
                </div>
                <button onClick={() => openEdit(event)} className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  {deleting === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{editing ? '编辑' : '添加'}事件</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">标题 *</label>
                <input value={form.title || ''} onChange={field('title')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">日期 *</label>
                  <input type="date" value={form.date || ''} onChange={field('date')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">分类</label>
                  <select value={form.category} onChange={field('category')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                    {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">图标 emoji</label>
                  <input value={form.icon || ''} onChange={field('icon')} placeholder="🚀" className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_milestone ?? false}
                      onChange={(e) => setForm((f) => ({ ...f, is_milestone: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">标记为里程碑</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">描述</label>
                <textarea value={form.description || ''} onChange={field('description')} rows={2} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm resize-none" />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">链接</label>
                <input value={form.link || ''} onChange={field('link')} placeholder="https://..." className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 transition-colors">取消</button>
                <button onClick={handleSave} disabled={saving || !form.title?.trim() || !form.date} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
